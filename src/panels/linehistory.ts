import { App, Modal, moment } from "obsidian";
import type MeridianDashPlugin from "../main";

/**
 * "MERIDIAN speaks" history (§3.2): a small, read-only record of recently shown
 * lines, newest first, with relative timestamps. No editing, no favouriting —
 * purely a record of what the closed pool already emitted. No new lines are
 * authored here.
 */
export class LineHistoryModal extends Modal {
	constructor(app: App, private plugin: MeridianDashPlugin) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText("MERIDIAN — recent lines");
		const { contentEl } = this;
		const history = this.plugin.lineHistory;
		if (history.length === 0) {
			contentEl.createDiv({ cls: "mrd-muted", text: "No lines on record yet. The rotation has only just begun." });
			return;
		}
		const list = contentEl.createDiv({ cls: "mrd-linehist" });
		for (let i = history.length - 1; i >= 0; i--) {
			const entry = history[i];
			const row = list.createDiv({ cls: "mrd-linehist-row" });
			row.createDiv({ cls: "mrd-linehist-line", text: entry.line });
			row.createDiv({ cls: "mrd-linehist-when", text: moment(entry.at).fromNow() });
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
