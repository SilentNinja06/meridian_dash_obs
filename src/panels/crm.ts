import { App, Modal, Notice, Setting, TFile, moment } from "obsidian";
import { BasePanel, placard } from "./types";
import { CrmRow } from "../core/bridge";
import { appendDailyLogLine } from "dash-core";
import { commandButton } from "./util";

/**
 * Contacts panel (§7.9). One field showing TODAY + OVERDUE together so the
 * Operator can triage who to reach — this replaces the two Dataview tables
 * removed from the template. Overdue first, then by priority. The daily note's
 * `# Contacts reached` section is written by Simple Contact Manager at log time
 * (§8.3), not compiled here; on open we run a reconcile pass as a safety net.
 */
export class CrmPanel extends BasePanel {
	id = "crm";
	title = "Contacts";
	private reconciled = false;

	protected async setup(): Promise<void> {
		if (this.reconciled) return;
		this.reconciled = true;
		await this.reconcile();
	}

	protected renderBody(): void {
		const { bridge, app } = this.ctx;
		placard(this.el, "Contacts");

		if (!bridge.crmAvailable()) {
			this.el.createDiv({ cls: "dash-muted", text: "The contacts subsystem is offline. Enable Simple Contact Manager to bring it online." });
			return;
		}

		const contacts = bridge.crmContacts();
		const triage = contacts.filter((c) => c.overdue || c.dueToday);

		const actions = this.el.createDiv({ cls: "dash-btn-row" });
		commandButton(actions, app, "simple-contact-manager:log-interaction", "Log interaction", { cls: "dash-btn-primary" });
		commandButton(actions, app, "simple-contact-manager:new-contact", "New contact", {});

		const list = this.el.createDiv({ cls: "dash-crm-list" });
		if (triage.length === 0) {
			list.createDiv({ cls: "dash-muted", text: "No one is due or overdue. The lines you keep are current." });
			return;
		}
		for (const c of triage) this.renderRow(list, c);
	}

	private renderRow(parent: HTMLElement, c: CrmRow): void {
		const row = parent.createDiv({ cls: "dash-crm-row" });
		if (c.overdue) row.addClass("is-overdue");

		const main = row.createDiv({ cls: "dash-crm-main" });
		const name = main.createEl("a", { cls: "dash-crm-name", text: c.name });
		name.addEventListener("click", (e) => {
			e.preventDefault();
			const file = this.ctx.app.vault.getAbstractFileByPath(c.path);
			if (file instanceof TFile) void this.ctx.app.workspace.getLeaf(false).openFile(file);
		});
		const meta = main.createDiv({ cls: "dash-crm-meta" });
		if (c.priority) meta.createSpan({ cls: `dash-chip dash-prio-${c.priority}`, text: c.priority });
		meta.createSpan({ cls: c.overdue ? "dash-chip dash-chip-warn" : "dash-chip", text: c.overdue ? "overdue" : "due today" });
		if (c.daysSince !== null) meta.createSpan({ cls: "dash-chip dash-chip-cold", text: `${c.daysSince}d since` });

		// Log this specific contact — no re-pick from a fuzzy list.
		const log = row.createEl("button", { cls: "dash-btn dash-btn-sm", text: "Log" });
		log.addEventListener("click", () => {
			// Prefer the plugin's own modal (API v2+); otherwise log it ourselves.
			if (this.ctx.bridge.crmLogViaApi(c.path)) return;
			new CrmInteractionModal(this.ctx.app, c.name, async (text) => {
				const ok = await this.ctx.bridge.crmWriteInteraction(c.path, text);
				if (ok) {
					new Notice(`Logged interaction with ${c.name}.`);
					this.ctx.requestRefresh("manual");
				} else {
					new Notice("Could not log the interaction.");
				}
			}).open();
		});
	}

	/** Backfill any `### <today>` interactions from contact notes that aren't in
	 * today's note yet. Best-effort; the primary write path is simple_cm at log
	 * time (§8.3). */
	private async reconcile(): Promise<void> {
		try {
			const lines = await this.ctx.bridge.crmReconcileLines();
			if (lines.length === 0) return;
			const s = this.ctx.settings();
			const time = moment().format("HH:mm");
			for (const tail of lines) {
				await appendDailyLogLine(this.ctx.app, `- ${time} ${tail}`, {
					marker: s.crmLogMarker,
					heading: s.crmLogHeading,
					time,
				});
			}
		} catch (e) {
			console.error("MERIDIAN: CRM reconcile failed", e);
		}
	}
}

/** Capture the interaction note for a specific contact (dashboard-side path,
 * used when Simple Contact Manager's log API isn't available). */
class CrmInteractionModal extends Modal {
	private note = "";
	constructor(app: App, private contactName: string, private onSubmit: (note: string) => void) {
		super(app);
	}
	onOpen(): void {
		this.titleEl.setText(`Log interaction — ${this.contactName}`);
		new Setting(this.contentEl).setName("Interaction note").addText((t) => {
			t.setPlaceholder("e.g. Called re: contract renewal").onChange((v) => (this.note = v));
			t.inputEl.classList.add("dash-modal-wide");
			t.inputEl.focus();
			t.inputEl.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					this.submit();
				}
			});
		});
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()))
			.addButton((b) => b.setButtonText("Log interaction").setCta().onClick(() => this.submit()));
	}
	private submit(): void {
		const note = this.note.trim();
		if (!note) {
			new Notice("Please enter an interaction note.");
			return;
		}
		this.onSubmit(note);
		this.close();
	}
	onClose(): void {
		this.contentEl.empty();
	}
}
