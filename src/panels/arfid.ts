import { BasePanel, placard } from "./types";
import { commandButton } from "./util";

/**
 * ARFID / Nourishment panel (§7.7). Reads today's food log via the plugin API
 * (falling back to the `%% arfid-log %%` marker), shows it compactly, and offers
 * the one-tap logging actions. Interacting here nudges MERIDIAN's `food` pool.
 * The `food` register observes the *log*, never the eating (§7.3).
 */
export class ArfidPanel extends BasePanel {
	id = "arfid";
	title = "Nourishment Log";

	protected async renderBody(): Promise<void> {
		const { bridge, app } = this.ctx;
		placard(this.el, "Nourishment Log");

		if (!bridge.arfidAvailable()) {
			this.el.createDiv({ cls: "mrd-muted", text: "The nourishment subsystem is offline. Enable ARFID Tracker to bring it online." });
			return;
		}

		const entries = await bridge.arfidToday();
		const list = this.el.createDiv({ cls: "mrd-loglist" });
		if (entries.length === 0) {
			list.createDiv({ cls: "mrd-muted", text: "No entries logged today. The log is open whenever you are." });
		} else {
			for (const e of entries) {
				const row = list.createDiv({ cls: "mrd-logrow" });
				row.createSpan({ cls: "mrd-logrow-time", text: e.time });
				row.createSpan({ cls: "mrd-logrow-label", text: e.label });
			}
		}

		const actions = this.el.createDiv({ cls: "mrd-btn-row" });
		const nudge = () => this.ctx.markFoodFocus();
		commandButton(actions, app, "arfid-tracker:quick-log", "Log a food", { cls: "mrd-btn-primary", onRun: nudge });
		commandButton(actions, app, "arfid-tracker:struggling", "I'm struggling", { cls: "mrd-btn-cold", onRun: nudge });
		commandButton(actions, app, "arfid-tracker:log-exposure", "Exposure", { onRun: nudge });
		commandButton(actions, app, "arfid-tracker:log-symptoms", "Symptoms", { onRun: nudge });
	}
}
