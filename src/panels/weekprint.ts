import { App, Modal, moment } from "obsidian";
import type MeridianDashPlugin from "../main";
import { AgendaItem, eventsOnDate, parseICS } from "../core/ics";
import { calendarColor } from "../core/tokens";
import { WeeklyGoalsModal, weekKeyOf, weekLabel } from "./weeklygoals";

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
 * A printable "week at a glance" planner. Each day lists that week's calendar
 * events (colour-coded, with a legend) and any directives opted into the planner,
 * and leaves ruled blank space to write in. The week's goals are printed at the
 * top. Rendered light-on-white for paper; a Print button prints just the planner.
 */
export class WeekPrintModal extends Modal {
	private weekStart = moment().startOf("week");
	private sources: CalendarSource[] = [];

	constructor(app: App, private plugin: MeridianDashPlugin) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("mrd-week-modal");
		const cache = this.plugin.agendaCache;
		this.sources = this.plugin.settings.agendaUrls.map((cal, i) => ({
			label: cal.label,
			color: cal.color || calendarColor(i),
			events: safeParse(cache[cal.url]?.text),
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
		this.ctrlBtn(nav, "Set goals", () => {
			new WeeklyGoalsModal(this.app, this.plugin, weekKeyOf(this.weekStart), () => this.render()).open();
		});
		const printBtn = controls.createEl("button", { cls: "mrd-btn mrd-btn-primary", text: "Print" });
		printBtn.addEventListener("click", () => this.print());

		// --- printable sheet ---
		const sheet = contentEl.createDiv({ cls: "mrd-week-print" });
		const header = sheet.createDiv({ cls: "mrd-week-header" });
		header.createDiv({ cls: "mrd-week-title", text: "Week at a Glance" });
		header.createDiv({ cls: "mrd-week-dates", text: range });

		this.renderGoals(sheet);

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

	/** The week's goals, printed at the top as checkbox lines to work against. */
	private renderGoals(sheet: HTMLElement): void {
		const goals = this.plugin.weeklyGoalsFor(weekKeyOf(this.weekStart));
		if (goals.length === 0) return;
		const block = sheet.createDiv({ cls: "mrd-week-goals" });
		block.createDiv({ cls: "mrd-week-goals-head", text: "Goals for the week" });
		const list = block.createDiv({ cls: "mrd-week-goals-list" });
		for (const goal of goals) {
			const row = list.createDiv({ cls: "mrd-week-goal" });
			row.createSpan({ cls: "mrd-week-goal-box", text: "☐" });
			row.createSpan({ cls: "mrd-week-goal-text", text: goal.text });
		}
	}

	private renderDay(grid: HTMLElement, day: moment.Moment): void {
		const dateStr = day.format("YYYY-MM-DD");
		const events = this.eventsForDay(dateStr);
		const directives = this.plugin.todos.itemsForWeekPrint(dateStr);

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
		if (directives.length > 0) {
			const list = cell.createDiv({ cls: "mrd-week-directives" });
			for (const item of directives) {
				const row = list.createDiv({ cls: "mrd-week-directive" });
				row.createSpan({ cls: "mrd-week-goal-box", text: "☐" });
				const time = item.scheduledTime ? item.scheduledTime + " " : "";
				row.createSpan({ cls: "mrd-week-directive-text", text: `${time}${item.text}` });
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

	/**
	 * Print the planner by rendering it into an isolated off-screen iframe and
	 * printing *that* document. This sidesteps Obsidian's own print CSS and the
	 * modal's containing block entirely — the earlier body-visibility approach
	 * printed blank on some setups. The sheet's inline styles (swatch/event
	 * colours) carry over in the serialized HTML; the class styles are copied from
	 * the loaded stylesheet.
	 */
	private print(): void {
		const sheet = this.contentEl.querySelector(".mrd-week-print") as HTMLElement | null;
		if (!sheet) {
			window.print();
			return;
		}
		const iframe = document.body.createEl("iframe", { cls: "mrd-week-print-frame" });
		iframe.setAttribute("aria-hidden", "true");
		const doc = iframe.contentDocument;
		const win = iframe.contentWindow;
		if (!doc || !win) {
			iframe.remove();
			return;
		}

		// US Letter, landscape (11in × 8.5in), half-inch margins.
		const css = `@page { size: 11in 8.5in; margin: 0.5in; }\nhtml, body { margin: 0; padding: 0; background: #fff; }\n${collectWeekPrintCss()}`;
		doc.open();
		doc.write(
			`<!doctype html><html><head><meta charset="utf-8"><title>Week at a Glance</title><style>${css}</style></head><body>${sheet.outerHTML}</body></html>`
		);
		doc.close();

		let done = false;
		const cleanup = () => {
			if (done) return;
			done = true;
			iframe.remove();
		};
		win.addEventListener("afterprint", cleanup);
		// Let layout settle, then print. A generous fallback removes the frame if
		// afterprint never fires (some platforms).
		window.setTimeout(() => {
			try {
				win.focus();
				win.print();
			} catch (e) {
				console.error("MERIDIAN: week print failed", e);
			}
			window.setTimeout(cleanup, 60000);
		}, 150);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/** Pull every `.mrd-week-*` rule out of the loaded stylesheet(s) so the print
 * iframe renders identically without the whole app's CSS. Falls back to a
 * minimal built-in sheet if the rules can't be read. */
function collectWeekPrintCss(): string {
	const parts: string[] = [];
	for (const ss of Array.from(document.styleSheets)) {
		let rules: CSSRuleList | null = null;
		try {
			rules = ss.cssRules;
		} catch {
			continue; // cross-origin sheet — skip
		}
		if (!rules) continue;
		for (const rule of Array.from(rules)) {
			if (rule.cssText.includes("mrd-week")) parts.push(rule.cssText);
		}
	}
	return parts.length ? parts.join("\n") : WEEK_PRINT_FALLBACK_CSS;
}

/** Minimal self-contained planner CSS, used only if the stylesheet can't be read. */
const WEEK_PRINT_FALLBACK_CSS = `
.mrd-week-print { background:#fff; color:#16140f; padding:16px 18px; font-family:"Inter",system-ui,sans-serif; }
.mrd-week-header { display:flex; justify-content:space-between; border-bottom:2px solid #16140f; padding-bottom:6px; margin-bottom:8px; }
.mrd-week-title { font-weight:600; letter-spacing:0.14em; text-transform:uppercase; font-size:1.15rem; }
.mrd-week-dates { font-size:0.85rem; color:#444; }
.mrd-week-legend { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:10px; font-size:0.72rem; color:#333; }
.mrd-week-legend-item { display:inline-flex; align-items:center; gap:5px; }
.mrd-week-swatch { width:11px; height:11px; border-radius:2px; display:inline-block; }
.mrd-week-goals { border:1px solid #999; border-radius:4px; padding:6px 8px; margin-bottom:10px; }
.mrd-week-goals-head { font-weight:700; font-size:0.78rem; margin-bottom:4px; }
.mrd-week-goal, .mrd-week-directive { display:flex; align-items:baseline; gap:6px; font-size:0.72rem; color:#16140f; }
.mrd-week-goal-box { color:#444; }
.mrd-week-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
.mrd-week-cell { border:1px solid #999; border-radius:4px; padding:5px 7px; min-height:5.6cm; display:flex; flex-direction:column; }
.mrd-week-cell-head { display:flex; justify-content:space-between; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:4px; }
.mrd-week-dow { font-weight:700; font-size:0.82rem; }
.mrd-week-date { font-size:0.7rem; color:#666; }
.mrd-week-event, .mrd-week-directive-text { font-size:0.68rem; color:#16140f; }
.mrd-week-event { border-left:4px solid #999; padding-left:5px; }
.mrd-week-lines { flex:1; min-height:1.6cm; background-image:repeating-linear-gradient(to bottom, transparent 0, transparent 0.56cm, #d8d8d8 0.56cm, #d8d8d8 calc(0.56cm + 1px)); }
`;

function safeParse(text: string | undefined): ReturnType<typeof parseICS> {
	if (!text) return [];
	try {
		return parseICS(text);
	} catch {
		return [];
	}
}
