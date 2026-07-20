import { moment } from "obsidian";
import { BasePanel, RefreshReason, placard } from "./types";
import {
	FieldSpec,
	headingField,
	readDailyField,
	readDailyNoteRaw,
	readField,
	writeDailyField,
} from "../core/dailynote";
import { LOG_FIELD_SPECS } from "../core/dailyfields";

/**
 * Journal / free-text panel (§7.6). Four editable fields, each an editor for a
 * section of today's note: Musings / random thoughts, Daily log → Primary,
 * Daily log → Supplemental, and Reconsider tomorrow. Plus a read-only view of
 * *yesterday's* Reconsider-tomorrow, carried onto today. Debounced autosave
 * (~800ms); textareas that grow. These are editors *for the note*, not a
 * separate store. On an external refresh we reload values unless the Operator
 * is mid-edit.
 */
interface FieldDef {
	key: string;
	label: string;
	spec: FieldSpec;
	/** Strip empty `- [ ]` / bullet placeholders when loading the field. */
	stripPlaceholder?: boolean;
}

// Specs come from the shared source (src/core/dailyfields.ts) so the panel and
// the log commands / URI actions target byte-identical note regions (§1.1).
const FIELDS: FieldDef[] = [
	{ key: "musings", label: "Musings / random thoughts", spec: LOG_FIELD_SPECS.musing },
	{ key: "log-primary", label: "Daily log · Primary", spec: LOG_FIELD_SPECS.primary },
	{ key: "log-supplemental", label: "Daily log · Supplemental", spec: LOG_FIELD_SPECS.supplemental },
	{ key: "reconsider", label: "Reconsider tomorrow", spec: LOG_FIELD_SPECS.reconsider, stripPlaceholder: true },
];

export class JournalPanel extends BasePanel {
	id = "journal";
	title = "Daily Log";
	private editing = false;

	async refresh(reason?: RefreshReason): Promise<void> {
		// Don't yank the text out from under the Operator mid-sentence.
		if (reason === "vault" && this.editing) return;
		if (this.el?.isConnected) {
			this.el.empty();
			await this.renderBody();
		}
	}

	protected async renderBody(): Promise<void> {
		placard(this.el, "Daily Log");
		await this.renderYesterdayReconsider();
		const wrap = this.el.createDiv({ cls: "mrd-journal" });
		for (const field of FIELDS) {
			await this.renderField(wrap, field);
		}
	}

	/** Read-only carry-over of yesterday's "Reconsider tomorrow" onto today. */
	private async renderYesterdayReconsider(): Promise<void> {
		const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");
		let text = "";
		try {
			const raw = await readDailyNoteRaw(this.ctx.app, yesterday);
			text = tidy(readField(raw, headingField("Reconsider tomorrow")));
		} catch (e) {
			console.error("MERIDIAN: could not read yesterday's reconsider", e);
		}
		if (!text) return; // nothing worth carrying — stay quiet
		const block = this.el.createDiv({ cls: "mrd-carry" });
		block.createDiv({ cls: "mrd-carry-label", text: "Carried from yesterday · to reconsider" });
		block.createDiv({ cls: "mrd-carry-body", text });
	}

	private async renderField(parent: HTMLElement, field: FieldDef): Promise<void> {
		const block = parent.createDiv({ cls: "mrd-journal-field" });
		block.createDiv({ cls: "mrd-journal-label", text: field.label });
		const ta = block.createEl("textarea", { cls: "mrd-journal-input" });
		const loaded = await readDailyField(this.ctx.app, field.spec);
		ta.value = field.stripPlaceholder ? tidy(loaded) : loaded;
		autosize(ta);

		let timer: number | null = null;
		const save = () => {
			void writeDailyField(this.ctx.app, field.spec, ta.value).catch((e) =>
				console.error("MERIDIAN: journal save failed", e)
			);
		};
		ta.addEventListener("focus", () => {
			this.editing = true;
			this.ctx.runtime.typingUntil = Date.now() + 2000;
		});
		ta.addEventListener("blur", () => {
			this.editing = false;
			this.ctx.runtime.typingUntil = 0;
			if (timer !== null) {
				window.clearTimeout(timer);
				timer = null;
			}
			save();
		});
		ta.addEventListener("input", () => {
			// Hold off the vault-refresh bus while actively typing so the layout
			// doesn't jump; the window is renewed on each keystroke.
			this.ctx.runtime.typingUntil = Date.now() + 2000;
			autosize(ta);
			if (timer !== null) window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				timer = null;
				save();
			}, 800);
		});
		this.onCleanup(() => {
			if (timer !== null) window.clearTimeout(timer);
		});
	}
}

function autosize(ta: HTMLTextAreaElement): void {
	ta.style.height = "auto";
	ta.style.height = Math.max(48, ta.scrollHeight) + "px";
}

/** Drop empty bullet/checkbox placeholders so an untouched section reads as
 * empty rather than carrying a lone "- [ ]". */
function tidy(text: string): string {
	return text
		.split("\n")
		.map((l) => l.replace(/\s+$/, ""))
		.filter((l) => l.trim() !== "" && !/^\s*-\s*(\[[ xX]?\]\s*)?$/.test(l))
		.join("\n")
		.trim();
}
