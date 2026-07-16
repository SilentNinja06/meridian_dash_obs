import { moment } from "obsidian";
import { BasePanel, placard } from "./types";

/**
 * Clock (§7.1): four-digit 24h with no separator (1432), large mono amber,
 * beside the time since last access in MERIDIAN's register.
 */
export class ClockPanel extends BasePanel {
	id = "clock";
	title = "Chronometer";
	private digitsEl?: HTMLElement;
	private secEl?: HTMLElement;
	private sinceEl?: HTMLElement;
	private dateEl?: HTMLElement;
	private previousAccess = 0;

	protected async setup(): Promise<void> {
		this.previousAccess = this.ctx.runtime.previousAccess;
		this.setInterval(() => this.tick(), 1000);
	}

	protected renderBody(): void {
		placard(this.el, "Chronometer");
		const wrap = this.el.createDiv({ cls: "mrd-clock" });
		const main = wrap.createDiv({ cls: "mrd-clock-main" });
		this.digitsEl = main.createSpan({ cls: "mrd-clock-digits" });
		this.secEl = main.createSpan({ cls: "mrd-clock-sec" });
		this.dateEl = wrap.createDiv({ cls: "mrd-clock-date" });
		this.sinceEl = wrap.createDiv({ cls: "mrd-clock-since" });
		this.tick();
	}

	private tick(): void {
		const now = moment();
		if (this.digitsEl) this.digitsEl.setText(now.format("HHmm"));
		if (this.secEl) this.secEl.setText(now.format("ss"));
		if (this.dateEl) this.dateEl.setText(now.format("dddd · YYYY-MM-DD").toUpperCase());
		if (this.sinceEl) this.sinceEl.setText(sinceLine(this.previousAccess));
	}
}

function sinceLine(previousAccess: number): string {
	if (!previousAccess) return "Session opened. This access is the first on record.";
	const secs = Math.max(0, Math.floor((Date.now() - previousAccess) / 1000));
	if (secs < 45) return "Continuous observation. You did not go far.";
	const dur = humanize(secs);
	if (secs < 3600) return `Last access ${dur} ago. The interval was noted.`;
	if (secs < 6 * 3600) return `Last access ${dur} ago. Welcome back. The record was kept.`;
	if (secs < 24 * 3600) return `Last access ${dur} ago. The facility continued without you, as designed.`;
	return `Last access ${dur} ago. A longer absence. It changes nothing here.`;
}

function humanize(totalSecs: number): string {
	const d = Math.floor(totalSecs / 86400);
	const h = Math.floor((totalSecs % 86400) / 3600);
	const m = Math.floor((totalSecs % 3600) / 60);
	const parts: string[] = [];
	if (d) parts.push(`${d}d`);
	if (h) parts.push(`${h}h`);
	if (m || (!d && !h)) parts.push(`${m}m`);
	return parts.slice(0, 2).join(" ");
}
