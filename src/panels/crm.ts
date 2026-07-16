import { TFile, moment } from "obsidian";
import { BasePanel, placard } from "./types";
import { CrmRow } from "../core/bridge";
import { appendDailyLogLine } from "../core/dailynote";
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
		const { bridge } = this.ctx;
		placard(this.el, "Contacts");

		if (!bridge.crmAvailable()) {
			this.el.createDiv({ cls: "mrd-muted", text: "The contacts subsystem is offline. Enable Simple Contact Manager to bring it online." });
			return;
		}

		const contacts = bridge.crmContacts();
		const triage = contacts.filter((c) => c.overdue || c.dueToday);

		const actions = this.el.createDiv({ cls: "mrd-btn-row" });
		commandButton(actions, bridge, "simple-contact-manager:log-interaction", "Log interaction", { cls: "mrd-btn-primary" });
		commandButton(actions, bridge, "simple-contact-manager:new-contact", "New contact", {});

		const list = this.el.createDiv({ cls: "mrd-crm-list" });
		if (triage.length === 0) {
			list.createDiv({ cls: "mrd-muted", text: "No one is due or overdue. The lines you keep are current." });
			return;
		}
		for (const c of triage) this.renderRow(list, c);
	}

	private renderRow(parent: HTMLElement, c: CrmRow): void {
		const row = parent.createDiv({ cls: "mrd-crm-row" });
		if (c.overdue) row.addClass("is-overdue");

		const main = row.createDiv({ cls: "mrd-crm-main" });
		const name = main.createEl("a", { cls: "mrd-crm-name", text: c.name });
		name.addEventListener("click", (e) => {
			e.preventDefault();
			const file = this.ctx.app.vault.getAbstractFileByPath(c.path);
			if (file instanceof TFile) void this.ctx.app.workspace.getLeaf(false).openFile(file);
		});
		const meta = main.createDiv({ cls: "mrd-crm-meta" });
		if (c.priority) meta.createSpan({ cls: `mrd-chip mrd-prio-${c.priority}`, text: c.priority });
		meta.createSpan({ cls: c.overdue ? "mrd-chip mrd-chip-warn" : "mrd-chip", text: c.overdue ? "overdue" : "due today" });
		if (c.daysSince !== null) meta.createSpan({ cls: "mrd-chip mrd-chip-cold", text: `${c.daysSince}d since` });

		commandButton(row, this.ctx.bridge, "simple-contact-manager:log-interaction", "Log", { cls: "mrd-btn-sm" });
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
