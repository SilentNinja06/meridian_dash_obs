import { BasePanel, placard } from "./types";
import { commandButton } from "./util";

/**
 * Spiral / Regulation panel (§7.8). Reads today's entries via the plugin API
 * (falling back to `%% spiral-log %%`). Calm presentation — no red, no alarm
 * iconography, no count framed as a score. If something was logged today, the
 * panel should feel like it is *holding* it, not flagging it. A today-entry
 * signal drives MERIDIAN's `aftercare` weighting (§7.3).
 */
export class SpiralPanel extends BasePanel {
	id = "spiral";
	title = "Regulation Log";

	protected async renderBody(): Promise<void> {
		const { bridge, app } = this.ctx;
		placard(this.el, "Regulation Log");

		if (!bridge.spiralAvailable()) {
			this.el.createDiv({ cls: "dash-muted", text: "The regulation subsystem is offline. Enable the Spiral & Shutdown Logger to bring it online." });
			return;
		}

		const entries = await bridge.spiralToday();
		const card = this.el.createDiv({ cls: "dash-spiral" });
		if (entries.length === 0) {
			card.createDiv({ cls: "dash-muted", text: "Nothing logged today. That is simply the reading; it is not a target." });
		} else {
			card.createDiv({ cls: "dash-spiral-held", text: "Logged today. The record is holding it." });
			const list = card.createDiv({ cls: "dash-loglist" });
			for (const e of entries) {
				const row = list.createDiv({ cls: "dash-logrow" });
				row.createSpan({ cls: "dash-logrow-time", text: e.time });
				row.createSpan({ cls: "dash-logrow-label", text: e.label });
			}
		}

		const actions = this.el.createDiv({ cls: "dash-btn-row" });
		commandButton(actions, app, "spiral-shutdown-logger:quick-capture", "Log an entry", { cls: "dash-btn-cold" });
		commandButton(actions, app, "spiral-shutdown-logger:thought-capture", "Jot a thought", {});
	}
}
