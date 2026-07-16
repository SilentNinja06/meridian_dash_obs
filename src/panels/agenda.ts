import { moment } from "obsidian";
import { BasePanel, placard } from "./types";
import { AgendaItem, eventsOnDate, fetchICS, parseICS } from "../core/ics";
import { calendarColor } from "../core/tokens";

/**
 * Today's agenda (§7.5). Today only — no month view. Fetches each Proton share
 * link via requestUrl (CORS-free, mobile + desktop), caches the last successful
 * fetch in plugin data so it renders offline, and surfaces fetch failures
 * *visibly* in MERIDIAN's voice (a dead share link must be noticed — Proton
 * stops feeding third-party subscribers silently).
 */
export class AgendaPanel extends BasePanel {
	id = "agenda";
	title = "Today's Agenda";
	private errors = new Map<string, string>();
	private fetching = false;

	protected async setup(): Promise<void> {
		const minutes = Math.max(1, this.ctx.settings().agendaRefreshMinutes || 30);
		this.setInterval(() => void this.fetchAll(), minutes * 60 * 1000);
		void this.fetchAll();
	}

	protected renderBody(): void {
		const s = this.ctx.settings();
		const head = placard(this.el, "Today's Agenda");
		head.createSpan({ cls: "mrd-placard-badge", text: moment().format("YYYY-MM-DD") });

		if (s.agendaUrls.length === 0) {
			this.el.createDiv({
				cls: "mrd-muted",
				text: "No calendars are on file. Add Proton Calendar share links (public .ics URLs) in settings and today's schedule will appear here.",
			});
			return;
		}

		const today = moment().format("YYYY-MM-DD");
		const rows: Array<{ item: AgendaItem; color: string; label: string }> = [];
		let anyCache = false;
		let oldest = Infinity;

		s.agendaUrls.forEach((cal, i) => {
			const color = calendarColor(i);
			const cache = this.ctx.plugin.agendaCache[cal.url];
			if (cache) {
				anyCache = true;
				oldest = Math.min(oldest, cache.fetchedAt);
				try {
					for (const item of eventsOnDate(parseICS(cache.text), today)) {
						rows.push({ item, color, label: cal.label });
					}
				} catch {
					this.errors.set(cal.url, "parse error");
				}
			}
		});

		// Failure notices — always visible, in voice.
		const failed = s.agendaUrls.filter((c) => this.errors.has(c.url));
		if (failed.length) {
			const box = this.el.createDiv({ cls: "mrd-agenda-alert" });
			for (const c of failed) {
				box.createDiv({
					cls: "mrd-agenda-alert-line",
					text: `${c.label}: this calendar could not be reached (${this.errors.get(c.url)}). A share link can go quiet on Proton's side — this one may need renewing.`,
				});
			}
		}

		rows.sort((a, b) => a.item.sortKey - b.item.sortKey || a.item.summary.localeCompare(b.item.summary));

		const list = this.el.createDiv({ cls: "mrd-agenda-list" });
		if (rows.length === 0 && !failed.length) {
			list.createDiv({ cls: "mrd-muted", text: "Nothing scheduled today. The day is unclaimed." });
		}
		for (const r of rows) {
			const row = list.createDiv({ cls: "mrd-agenda-row" });
			row.createSpan({ cls: "mrd-agenda-swatch" }).style.background = r.color;
			const time = row.createSpan({ cls: "mrd-agenda-time" });
			time.setText(r.item.allDay ? "ALL DAY" : r.item.timeLabel);
			const body = row.createDiv({ cls: "mrd-agenda-body" });
			body.createDiv({ cls: "mrd-agenda-title", text: r.item.summary });
			const sub = [r.label, r.item.location].filter(Boolean).join(" · ");
			if (sub) body.createDiv({ cls: "mrd-agenda-sub", text: sub });
		}

		// Staleness footer.
		if (anyCache && oldest !== Infinity) {
			const age = Date.now() - oldest;
			if (age > 90 * 1000) {
				this.el.createDiv({
					cls: "mrd-agenda-age",
					text: `Serving the last successful read from ${moment(oldest).fromNow()}. Proton can take up to eight hours to propagate a change; a fresh read is on its way.`,
				});
			}
		}
	}

	private async fetchAll(): Promise<void> {
		if (this.fetching) return;
		const urls = this.ctx.settings().agendaUrls;
		if (urls.length === 0) return;
		this.fetching = true;
		let changed = false;
		try {
			for (const cal of urls) {
				try {
					const text = await fetchICS(cal.url);
					this.ctx.plugin.agendaCache[cal.url] = { text, fetchedAt: Date.now() };
					this.errors.delete(cal.url);
					changed = true;
				} catch (e) {
					this.errors.set(cal.url, String((e as Error)?.message ?? e));
				}
			}
			if (changed) await this.ctx.plugin.saveData_();
		} finally {
			this.fetching = false;
		}
		if (this.el?.isConnected) this.rerender();
	}
}
