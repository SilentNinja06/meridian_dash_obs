import type MeridianDashPlugin from "./main";
import type { WeekPrintConfig } from "dash-core";
import { calendarColor } from "./core/tokens";
import { meridianWeeklyGoals } from "./weeklygoals";
import { MERIDIAN_WEEKLYGOALS_COPY, MERIDIAN_WEEKPRINT_COPY } from "./copy";

/** Builds the WeekPrintModal config from MERIDIAN's plugin state + palette. */
export function meridianWeekPrintConfig(plugin: MeridianDashPlugin): WeekPrintConfig {
	return {
		agendaCache: plugin.agendaCache,
		calendars: plugin.settings.agendaUrls,
		calendarColor,
		weeklyGoals: meridianWeeklyGoals(plugin),
		weeklyGoalsCopy: MERIDIAN_WEEKLYGOALS_COPY,
		todos: plugin.todos,
		copy: MERIDIAN_WEEKPRINT_COPY,
	};
}
