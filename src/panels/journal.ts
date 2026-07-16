import { BasePanel, RefreshReason, placard } from "./types";
import { FieldSpec, headingField, labelField, readDailyField, writeDailyField } from "../core/dailynote";

/**
 * Journal / free-text panel (§7.6). Four fields, each an editor for a section of
 * today's note: Primary Activities, Daily log → Primary, Daily log →
 * Supplemental, and Reconsider tomorrow. Debounced autosave (~800ms); textareas
 * that grow. These are editors *for the note*, not a separate store. On an
 * external refresh we reload values unless the Operator is mid-edit.
 */
const SUPPLEMENTAL_STOP = /^\s*-\s+Supplemental\s*:?\s*$/i;
const SPIRAL_MARKER = /%%\s*spiral-log\s*%%/i;

interface FieldDef {
	key: string;
	label: string;
	spec: FieldSpec;
}

const FIELDS: FieldDef[] = [
	{ key: "primary-activities", label: "Primary Activities", spec: headingField("Primary Activities") },
	{ key: "log-primary", label: "Daily log · Primary", spec: labelField("Primary", [SUPPLEMENTAL_STOP, SPIRAL_MARKER]) },
	{ key: "log-supplemental", label: "Daily log · Supplemental", spec: labelField("Supplemental", [SPIRAL_MARKER]) },
	{ key: "reconsider", label: "Reconsider tomorrow", spec: headingField("Reconsider tomorrow") },
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
		const wrap = this.el.createDiv({ cls: "mrd-journal" });
		for (const field of FIELDS) {
			await this.renderField(wrap, field);
		}
	}

	private async renderField(parent: HTMLElement, field: FieldDef): Promise<void> {
		const block = parent.createDiv({ cls: "mrd-journal-field" });
		block.createDiv({ cls: "mrd-journal-label", text: field.label });
		const ta = block.createEl("textarea", { cls: "mrd-journal-input" });
		ta.value = await readDailyField(this.ctx.app, field.spec);
		autosize(ta);

		let timer: number | null = null;
		const save = () => {
			void writeDailyField(this.ctx.app, field.spec, ta.value).catch((e) =>
				console.error("MERIDIAN: journal save failed", e)
			);
		};
		ta.addEventListener("focus", () => (this.editing = true));
		ta.addEventListener("blur", () => {
			this.editing = false;
			if (timer !== null) {
				window.clearTimeout(timer);
				timer = null;
			}
			save();
		});
		ta.addEventListener("input", () => {
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
