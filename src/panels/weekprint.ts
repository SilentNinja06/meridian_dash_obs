import { App, Modal, moment } from "obsidian";
import { AgendaItem, eventsOnDate, parseICS } from "../core/ics";
import { calendarColor } from "../core/tokens";
import { CalendarLink } from "../settings";

interface CalendarSource {
	label: string;
	color: string;
	events: ReturnType<typeof parseICS>;
}

interface WeekEvent {
	item: AgendaItem;
	label: string;
	color: string;
}

/**
 * A printable "week at a glance" planner. Each day lists that week's events,
 * colour-coded by the calendar they came from (with a legend), and leaves ruled
 * blank space to write in. Rendered light-on-white for paper; a Print button
 * hides the rest of the app and prints just the planner.
 */
export class WeekPrintModal extends Modal {
	private weekStart = moment().startOf("week");
	private sources: CalendarSource[] = [];

	constructor(app: App, private urls: CalendarLink[], private cache: Record<string, { text: string; fetchedAt: number }>) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("mrd-week-modal");
		this.sources = this.urls.map((cal, i) => ({
			label: cal.label,
			color: calendarColor(i),
			events: safeParse(this.cache[cal.url]?.text),
		}));
		this.render();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		const days = Array.from({ length: 7 }, (_, i) => this.weekStart.clone().add(i, "days"));
		const range = `${days[0].format("MMM D")} – ${days[6].format("MMM D, YYYY")}`;

		// --- on-screen controls (not printed) ---
		const controls = contentEl.createDiv({ cls: "mrd-week-noprint mrd-week-controls" });
		const nav = controls.createDiv({ cls: "mrd-week-nav" });
		this.ctrlBtn(nav, "‹ Prev week", () => {
			this.weekStart = this.weekStart.clone().subtract(1, "week");
			this.render();
		});
		nav.createSpan({ cls: "mrd-week-range", text: range });
		this.ctrlBtn(nav, "Next week ›", () => {
			this.weekStart = this.weekStart.clone().add(1, "week");
			this.render();
		});
		this.ctrlBtn(nav, "This week", () => {
			this.weekStart = moment().startOf("week");
			this.render();
		});
		const printBtn = controls.createEl("button", { cls: "mrd-btn mrd-btn-primary", text: "Print" });
		printBtn.addEventListener("click", () => this.print());

		// --- printable sheet ---
		const sheet = contentEl.createDiv({ cls: "mrd-week-print" });
		const header = sheet.createDiv({ cls: "mrd-week-header" });
		header.createDiv({ cls: "mrd-week-title", text: "Week at a Glance" });
		header.createDiv({ cls: "mrd-week-dates", text: range });

		if (this.sources.length > 0) {
			const legend = sheet.createDiv({ cls: "mrd-week-legend" });
			for (const s of this.sources) {
				const item = legend.createSpan({ cls: "mrd-week-legend-item" });
				const sw = item.createSpan({ cls: "mrd-week-swatch" });
				sw.style.background = s.color;
				item.createSpan({ text: s.label });
			}
		}

		const grid = sheet.createDiv({ cls: "mrd-week-grid" });
		for (const day of days) {
			this.renderDay(grid, day);
		}
		// 8th cell: free notes / to-do.
		const notes = grid.createDiv({ cls: "mrd-week-cell mrd-week-notes" });
		notes.createDiv({ cls: "mrd-week-cell-head", text: "Notes / To-do" });
		notes.createDiv({ cls: "mrd-week-lines" });
	}

	private renderDay(grid: HTMLElement, day: moment.Moment): void {
		const dateStr = day.format("YYYY-MM-DD");
		const events = this.eventsForDay(dateStr);

		const cell = grid.createDiv({ cls: "mrd-week-cell" });
		const head = cell.createDiv({ cls: "mrd-week-cell-head" });
		head.createSpan({ cls: "mrd-week-dow", text: day.format("dddd") });
		head.createSpan({ cls: "mrd-week-date", text: day.format("MMM D") });

		if (events.length > 0) {
			const list = cell.createDiv({ cls: "mrd-week-events" });
			for (const ev of events) {
				const row = list.createDiv({ cls: "mrd-week-event" });
				row.style.borderLeftColor = ev.color;
				const time = ev.item.allDay ? "" : ev.item.timeLabel + " ";
				row.createSpan({ cls: "mrd-week-ev-text", text: `${time}${ev.item.summary}` });
			}
		}
		// Ruled space to write in — grows to fill the cell.
		cell.createDiv({ cls: "mrd-week-lines" });
	}

	private eventsForDay(dateStr: string): WeekEvent[] {
		const out: WeekEvent[] = [];
		for (const s of this.sources) {
			try {
				for (const item of eventsOnDate(s.events, dateStr)) {
					out.push({ item, label: s.label, color: s.color });
				}
			} catch {
				/* skip a bad calendar */
			}
		}
		out.sort((a, b) => a.item.sortKey - b.item.sortKey || a.item.summary.localeCompare(b.item.summary));
		return out;
	}

	private ctrlBtn(parent: HTMLElement, text: string, onClick: () => void): void {
		const b = parent.createEl("button", { cls: "mrd-btn mrd-btn-sm", text });
		b.addEventListener("click", onClick);
	}

	private print(): void {
		document.body.addClass("mrd-printing");
		const cleanup = () => {
			document.body.removeClass("mrd-printing");
			window.removeEventListener("afterprint", cleanup);
		};
		window.addEventListener("afterprint", cleanup);
		// Fallback in case afterprint doesn't fire (some platforms).
		window.setTimeout(cleanup, 2000);
		window.print();
	}

	onClose(): void {
		this.contentEl.empty();
		document.body.removeClass("mrd-printing");
	}
}

function safeParse(text: string | undefined): ReturnType<typeof parseICS> {
	if (!text) return [];
	try {
		return parseICS(text);
	} catch {
		return [];
	}
}
