import type { WeeklyGoalsStore } from "dash-core";
import type MeridianDashPlugin from "./main";

/** Adapts the plugin's weekly-goal storage to core's WeeklyGoalsStore, so the
 * (now core) weekly-goals modal never depends on the concrete plugin. */
export function meridianWeeklyGoals(plugin: MeridianDashPlugin): WeeklyGoalsStore {
	return {
		forWeek: (weekKey) => plugin.weeklyGoalsFor(weekKey),
		add: (weekKey, text) => plugin.addWeeklyGoal(weekKey, text),
		remove: (weekKey, id) => plugin.removeWeeklyGoal(weekKey, id),
	};
}
