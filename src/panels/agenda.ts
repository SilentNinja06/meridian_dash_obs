import { moment } from "obsidian";
import { BasePanel, placard } from "./types";
import { AgendaItem, eventsOnDate, fetchICS, parseICS } from "dash-core";
import { agendaState, formatGap } from "dash-core";
import { LocalEvent, localEventToAgendaItem } from "dash-core";
import { calendarColor } from "../core/tokens";
import { WeekPrintModal } from "./weekprint";
import { LocalEventModal } from "dash-core";
import { meridianLocalEvents } from "../localevents";
import { WeeklyGoalsModal, currentWeekKey } from "./weeklygoals";

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
	/** Today's merged, sorted items — kept so the 1-minute countdown tick can
	 * recompute from the cached parse without re-fetching (§1.3). */
	private dayItems: AgendaItem[] = [];
	private hadEvents = false;
	private countdownEl?: HTMLElement;

	protected async setup(): Promise<void> {
		const minutes = Math.max(1, this.ctx.settings().agendaRefreshMinutes || 30);
		this.setInterval(() => void this.fetchAll(), minutes * 60 * 1000);
		// The countdown ticks on the clock's cadence — recompute from cache only,
		// never a network fetch.
		this.setInterval(() => this.tickCountdown(), 60 * 1000);
		void this.fetchAll();
	}

	protected renderBody(): void {
		const s = this.ctx.settings();
		const head = placard(this.el, "Today's Agenda");
		head.createSpan({ cls: "mrd-placard-badge", text: moment().format("YYYY-MM-DD") });
		// Actions sit on their own row below the placard so the header stays clean.
		const actions = this.el.createDiv({ cls: "mrd-btn-row mrd-agenda-actions" });
		const addBtn = actions.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "+ Event" });
		addBtn.addEventListener("click", () =>
			new LocalEventModal(this.ctx.app, meridianLocalEvents(this.ctx.plugin), undefined, () => this.rerender()).open()
		);
		const goalsBtn = actions.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "Weekly goals" });
		goalsBtn.addEventListener("click", () =>
			new WeeklyGoalsModal(this.ctx.app, this.ctx.plugin, currentWeekKey(), () => this.rerender()).open()
		);
		const printBtn = actions.createEl("button", { cls: "mrd-btn mrd-btn-sm", text: "Print week" });
		printBtn.addEventListener("click", () => {
			// Best-effort freshen, then open the planner from cache.
			void this.fetchAll();
			new WeekPrintModal(this.ctx.app, this.ctx.plugin).open();
		});

		const today = moment().format("YYYY-MM-DD");
		const localToday = this.ctx.plugin.localEvents.filter((e) => e.date === today);

		if (s.agendaUrls.length === 0 && localToday.length === 0) {
			this.el.createDiv({
				cls: "mrd-muted",
				text: "No calendars are on file. Add Proton Calendar share links (public .ics URLs) in settings, or add a local event with “+ Event”, and today's schedule will appear here.",
			});
			return;
		}

		const rows: Array<{ item: AgendaItem; color: string; label: string; countdown: boolean; local?: LocalEvent }> = [];
		let anyCache = false;
		let oldest = Infinity;

		s.agendaUrls.forEach((cal, i) => {
			const color = cal.color || calendarColor(i);
			const countdown = cal.countdown !== false;
			const cache = this.ctx.plugin.agendaCache[cal.url];
			if (cache) {
				anyCache = true;
				oldest = Math.min(oldest, cache.fetchedAt);
				try {
					for (const item of eventsOnDate(parseICS(cache.text), today)) {
						rows.push({ item, color, label: cal.label, countdown });
					}
				} catch {
					this.errors.set(cal.url, "parse error");
				}
			}
		});

		// Local events feed the same sorted list + countdown math (§2.1).
		for (const ev of localToday) {
			rows.push({ item: localEventToAgendaItem(ev), color: "var(--mrd-cal-local)", label: "LOCAL", countdown: true, local: ev });
		}

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

		// Next-event / open-gap placard, above the list (§1.3). Calendars toggled
		// out of the countdown still render in the list but are excluded here.
		this.dayItems = rows.filter((r) => r.countdown).map((r) => r.item);
		this.hadEvents = rows.length > 0;
		this.countdownEl = this.el.createDiv({ cls: "mrd-agenda-next" });
		this.renderCountdown();

		const list = this.el.createDiv({ cls: "mrd-agenda-list" });
		// The empty/clear state is carried by the countdown placard above.
		for (const r of rows) {
			const row = list.createDiv({ cls: "mrd-agenda-row" });
			row.createSpan({ cls: "mrd-agenda-swatch" }).style.background = r.color;
			const time = row.createSpan({ cls: "mrd-agenda-time" });
			time.setText(r.item.allDay ? "ALL DAY" : r.item.timeLabel);
			const body = row.createDiv({ cls: "mrd-agenda-body" });
			const title = body.createDiv({ cls: "mrd-agenda-title" });
			title.createSpan({ text: r.item.summary });
			if (r.local) title.createSpan({ cls: "mrd-chip mrd-chip-cold mrd-agenda-local-chip", text: "LOCAL" });
			const sub = [r.local ? "" : r.label, r.item.location].filter(Boolean).join(" · ");
			if (sub) body.createDiv({ cls: "mrd-agenda-sub", text: sub });
			if (r.local) {
				const ev = r.local;
				row.addClass("mrd-agenda-row-edit");
				row.setAttr("title", "Edit this local event");
				row.addEventListener("click", () =>
					new LocalEventModal(this.ctx.app, meridianLocalEvents(this.ctx.plugin), ev, () => this.rerender()).open()
				);
			}
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

	/** Draw the NEXT / NOW / clear placard from the cached day items. */
	private renderCountdown(): void {
		const el = this.countdownEl;
		if (!el) return;
		el.empty();
		const state = agendaState(this.dayItems, Date.now());

		if (state.kind === "clear") {
			el.addClass("is-clear");
			el.removeClass("is-now");
			el.createDiv({
				cls: "mrd-agenda-next-line",
				text: this.hadEvents
					? "Clear for the rest of the day. The remaining hours are unclaimed."
					: "The day's agenda is clear. This is a reading, not an absence.",
			});
			return;
		}

		el.removeClass("is-clear");
		el.toggleClass("is-now", state.kind === "now");
		const label = state.kind === "now" ? "NOW" : "NEXT";
		const line = el.createDiv({ cls: "mrd-agenda-next-line" });
		line.createSpan({ cls: "mrd-agenda-next-label", text: label });
		line.createSpan({ cls: "mrd-agenda-next-summary", text: state.summary ?? "" });
		const until = formatGap(state.untilMs ?? 0);
		line.createSpan({
			cls: "mrd-agenda-next-when",
			text: state.kind === "now" ? `ends in ${until}` : `in ${until}`,
		});

		// Open-gap sub-line.
		if (state.kind === "now") {
			el.createDiv({
				cls: "mrd-agenda-gap",
				text:
					state.gapMs === undefined
						? "Then clear for the rest of the day."
						: `Then open for ${formatGap(state.gapMs)} before the next.`,
			});
		} else {
			el.createDiv({ cls: "mrd-agenda-gap", text: `Open until then — ${until} free.` });
		}
	}

	/** 1-minute tick: recompute the placard only, guarding against unmount. */
	private tickCountdown(): void {
		if (!this.el?.isConnected || !this.countdownEl?.isConnected) return;
		this.renderCountdown();
	}

	private async fetchAll(): Promise<void> {
		if (this.fetching) return;
		const urls = this.ctx.settings().agendaUrls;
		if (urls.length === 0) return;
		this.fetching = true;
		let changed = false;
		try {
			for (const cal of urls) {
				if (!cal.url) continue; // a blank row in the editor — nothing to fetch
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
