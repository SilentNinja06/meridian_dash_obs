import { Panel } from "./types";
import type MeridianDashPlugin from "../main";
import {
	ClockPanel,
	JournalPanel,
	MealsPanel,
	PlacesPanel,
	CalendarPanel,
	SearchPanel,
	SecondBrainPanel,
	TodoPanel,
	AgendaPanel,
	WeekReviewModal,
	WeekPrintModal,
	LocalEventModal,
	WeeklyGoalsModal,
	currentWeekKey,
} from "dash-core";
import {
	MERIDIAN_CLOCK_COPY,
	MERIDIAN_JOURNAL_COPY,
	MERIDIAN_MEALS_COPY,
	MERIDIAN_PLACES_COPY,
	MERIDIAN_TODO_PANEL_COPY,
	MERIDIAN_TODO_COPY,
	MERIDIAN_AGENDA_COPY,
	MERIDIAN_WEEKLYGOALS_COPY,
} from "../copy";
import { calendarColor } from "../core/tokens";
import { meridianLocalEvents } from "../localevents";
import { meridianWeeklyGoals } from "../weeklygoals";
import { meridianWeekReviewConfig } from "../weekreview";
import { meridianWeekPrintConfig } from "../weekprint";
import { QotdPanel } from "./qotd";
import { MeridianPanel } from "./meridian";
import { ArfidPanel } from "./arfid";
import { SpiralPanel } from "./spiral";
import { CrmPanel } from "./crm";
import { ActionsPanel } from "./actions";

/** Registration order = default panel order (§4, §11.2). Everything ships
 * enabled; the layout is responsive (single column on mobile, grid on desktop),
 * and every panel is toggleable/reorderable in settings. */
export const PANEL_ORDER: string[] = [
	"clock",
	"meridian",
	"todo",
	"agenda",
	"calendar",
	"actions",
	"qotd",
	"journal",
	"meals",
	"arfid",
	"spiral",
	"crm",
	"search",
	"secondbrain",
	"places",
];

export const PANEL_TITLES: Record<string, string> = {
	clock: "Chronometer",
	meridian: "MERIDIAN",
	todo: "Directives",
	agenda: "Today's Agenda",
	calendar: "Calendar",
	actions: "Quick Actions",
	qotd: "Quote of the Day",
	journal: "Daily Log",
	meals: "Meals & Provisioning",
	arfid: "Nourishment Log",
	spiral: "Regulation Log",
	crm: "Contacts",
	search: "Knowledge Base",
	secondbrain: "Second Brain",
	places: "Navigation",
};

type PanelFactory = () => Panel;

/** Build the enabled panels in the configured order. Factories close over the
 * plugin so core panels can be constructed with the host stores/copy they need. */
export function createPanels(order: string[], enabled: Record<string, boolean>, plugin: MeridianDashPlugin): Panel[] {
	const factories: Record<string, PanelFactory> = {
		clock: () => new ClockPanel(MERIDIAN_CLOCK_COPY),
		meridian: () => new MeridianPanel(),
		todo: () => new TodoPanel(MERIDIAN_TODO_PANEL_COPY, MERIDIAN_TODO_COPY, () => new WeekReviewModal(plugin.app, meridianWeekReviewConfig(plugin)).open()),
		agenda: () =>
			new AgendaPanel(MERIDIAN_AGENDA_COPY, calendarColor, "var(--dash-cal-local)", {
				openLocalEvent: (existing, onDone) =>
					new LocalEventModal(plugin.app, meridianLocalEvents(plugin), existing, onDone).open(),
				openWeeklyGoals: (onDone) =>
					new WeeklyGoalsModal(plugin.app, meridianWeeklyGoals(plugin), plugin.todos, currentWeekKey(), onDone, MERIDIAN_WEEKLYGOALS_COPY).open(),
				openWeekPrint: () => new WeekPrintModal(plugin.app, meridianWeekPrintConfig(plugin)).open(),
			}),
		calendar: () => new CalendarPanel(),
		actions: () => new ActionsPanel(),
		qotd: () => new QotdPanel(),
		journal: () => new JournalPanel(MERIDIAN_JOURNAL_COPY),
		meals: () => new MealsPanel(MERIDIAN_MEALS_COPY),
		arfid: () => new ArfidPanel(),
		spiral: () => new SpiralPanel(),
		crm: () => new CrmPanel(),
		search: () => new SearchPanel(plugin.knowledgeBase),
		secondbrain: () => new SecondBrainPanel(plugin.secondBrain),
		places: () => new PlacesPanel(MERIDIAN_PLACES_COPY),
	};

	const seen = new Set<string>();
	const panels: Panel[] = [];
	for (const id of order) {
		if (seen.has(id)) continue;
		seen.add(id);
		if (enabled[id] === false) continue;
		const factory = factories[id];
		if (factory) panels.push(factory());
	}
	return panels;
}
