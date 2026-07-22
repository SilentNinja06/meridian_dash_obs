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
			this.el.createDiv({ cls: "dash-muted", text: "The nourishment subsystem is offline. Enable ARFID Tracker to bring it online." });
			return;
		}

		const entries = await bridge.arfidToday();
		const list = this.el.createDiv({ cls: "dash-loglist" });
		if (entries.length === 0) {
			list.createDiv({ cls: "dash-muted", text: "No entries logged today. The log is open whenever you are." });
		} else {
			// A food merely added to the library, or a status change, is *not*
			// something eaten — tag those so the log never reads them as consumed
			// (§7.3: the food register observes the log, never the eating).
			const KIND_TAG: Record<string, string> = {
				exposure: "exposure",
				baseline: "added to library",
				"status-change": "status change",
			};
			for (const e of entries) {
				const kind = e.kind ?? "meal";
				const nonMeal = kind === "baseline" || kind === "status-change";
				const row = list.createDiv({ cls: "dash-logrow" });
				if (nonMeal) row.addClass("dash-logrow-aside");
				row.createSpan({ cls: "dash-logrow-time", text: e.time });
				row.createSpan({ cls: "dash-logrow-label", text: e.label });
				const tag = KIND_TAG[kind];
				if (tag) row.createSpan({ cls: "dash-chip dash-chip-cold dash-logrow-tag", text: tag });
			}
		}

		const actions = this.el.createDiv({ cls: "dash-btn-row" });
		const nudge = () => this.ctx.markFoodFocus();
		commandButton(actions, app, "arfid-tracker:quick-log", "Log a food", { cls: "dash-btn-primary", onRun: nudge });
		commandButton(actions, app, "arfid-tracker:struggling", "I'm struggling", { cls: "dash-btn-cold", onRun: nudge });
		commandButton(actions, app, "arfid-tracker:log-exposure", "Exposure", { onRun: nudge });
		commandButton(actions, app, "arfid-tracker:log-symptoms", "Symptoms", { onRun: nudge });
	}
}
