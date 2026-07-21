import { Panel } from "./types";
import { ClockPanel } from "./clock";
import { QotdPanel } from "./qotd";
import { MeridianPanel } from "./meridian";
import { TodoPanel } from "./todo";
import { AgendaPanel } from "./agenda";
import { CalendarPanel } from "dash-core";
import { JournalPanel } from "./journal";
import { ArfidPanel } from "./arfid";
import { SpiralPanel } from "./spiral";
import { CrmPanel } from "./crm";
import { MealsPanel } from "./meals";
import { ActionsPanel } from "./actions";
import { SearchPanel } from "./search";
import { SecondBrainPanel } from "./secondbrain";
import { PlacesPanel } from "./places";

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

const FACTORIES: Record<string, PanelFactory> = {
	clock: () => new ClockPanel(),
	meridian: () => new MeridianPanel(),
	todo: () => new TodoPanel(),
	agenda: () => new AgendaPanel(),
	calendar: () => new CalendarPanel(),
	actions: () => new ActionsPanel(),
	qotd: () => new QotdPanel(),
	journal: () => new JournalPanel(),
	meals: () => new MealsPanel(),
	arfid: () => new ArfidPanel(),
	spiral: () => new SpiralPanel(),
	crm: () => new CrmPanel(),
	search: () => new SearchPanel(),
	secondbrain: () => new SecondBrainPanel(),
	places: () => new PlacesPanel(),
};

/** Build the enabled panels in the configured order. */
export function createPanels(order: string[], enabled: Record<string, boolean>): Panel[] {
	const seen = new Set<string>();
	const panels: Panel[] = [];
	for (const id of order) {
		if (seen.has(id)) continue;
		seen.add(id);
		if (enabled[id] === false) continue;
		const factory = FACTORIES[id];
		if (factory) panels.push(factory());
	}
	return panels;
}
