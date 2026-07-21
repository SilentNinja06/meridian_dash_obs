import type { DashCopy, TodoModalCopy, ClockCopy, MealsCopy, JournalCopy, WeeklyGoalsCopy, TodoCopy } from "dash-core";

/** MERIDIAN's copy for the Directives panel (the "directive" vocabulary + the
 * in-voice empty state). */
export const MERIDIAN_TODO_PANEL_COPY: TodoCopy = {
	title: "Directives",
	addNew: "+ New directive",
	empty: "No directives pending. The queue is clear. This is permitted.",
};
import { LOG_FIELD_SPECS } from "./core/dailyfields";

/** MERIDIAN's daily-log journal fields (the specific note sections + labels) and
 * the yesterday carry-over. The field specs come from the shared dailyfields. */
export const MERIDIAN_JOURNAL_COPY: JournalCopy = {
	title: "Daily Log",
	carryHeading: "Reconsider tomorrow",
	carryLabel: "Carried from yesterday · to reconsider",
	fields: [
		{ label: "Musings / random thoughts", spec: LOG_FIELD_SPECS.musing },
		{ label: "Daily log · Primary", spec: LOG_FIELD_SPECS.primary },
		{ label: "Daily log · Supplemental", spec: LOG_FIELD_SPECS.supplemental },
		{ label: "Reconsider tomorrow", spec: LOG_FIELD_SPECS.reconsider, stripPlaceholder: true },
	],
};

/** MERIDIAN's copy for the weekly-goals modal ("Directive" vocabulary). */
export const MERIDIAN_WEEKLYGOALS_COPY: WeeklyGoalsCopy = {
	titleTemplate: "Weekly goals · {week}",
	empty: "No goals set for this week yet.",
	toItem: "→ Directive",
	removeGoal: "Remove goal",
	addName: "Add a goal",
	addPlaceholder: "A goal for the week",
	addButton: "Add",
	done: "Done",
	addedNotice: "Added to Directives.",
};

/** MERIDIAN's copy for the meals & provisioning panel — exact strings and the
 * Recipe Manager command buttons the dashboard has always shown. */
export const MERIDIAN_MEALS_COPY: MealsCopy = {
	title: "Meals & Provisioning",
	offline: "The provisioning subsystem is offline. Enable Recipe Manager to bring it online.",
	plannedHeading: "Planned today",
	noMeals: "No meals planned today.",
	openRecipe: "Open recipe →",
	groceryHeading: "Grocery list",
	noGroceryAt: "No grocery list at {path}. Build one below.",
	groceryEmpty: "The grocery list is present but has no items.",
	remaining: "{remaining} of {total} remaining",
	commandOffline: "This subsystem is offline. Its plugin is not currently enabled.",
	commands: [
		{ id: "recipe-manager:meal-plan", label: "Plan a meal", cls: "mrd-btn-primary", food: true },
		{ id: "recipe-manager:grocery-list", label: "Build grocery list", food: true },
		{ id: "recipe-manager:open-recipe", label: "Open recipe", food: true },
		{ id: "recipe-manager:new-recipe", label: "New recipe", food: true },
		{ id: "recipe-manager:recipe-index", label: "Recipe index", food: true },
	],
};

/** MERIDIAN's clock register — the exact voice the dashboard has always shown.
 * Friendly injects its own warm, plain equivalents. */
/** MERIDIAN's disabled-command tooltip (a companion plugin isn't enabled). */
export const MERIDIAN_COMMAND_OFFLINE = "This subsystem is offline. Its plugin is not currently enabled.";

/** MERIDIAN's copy for the places / navigation panel. */
export const MERIDIAN_PLACES_COPY = {
	title: "Navigation",
	empty: "No destinations configured. Add some in settings.",
	commandOffline: MERIDIAN_COMMAND_OFFLINE,
};

export const MERIDIAN_CLOCK_COPY: ClockCopy = {
	title: "Chronometer",
	firstAccess: "Session opened. This access is the first on record.",
	continuous: "Continuous observation. You did not go far.",
	under1h: "Last access {dur} ago. The interval was noted.",
	under6h: "Last access {dur} ago. Welcome back. The record was kept.",
	under24h: "Last access {dur} ago. The facility continued without you, as designed.",
	longer: "Last access {dur} ago. A longer absence. It changes nothing here.",
	record: "RECORD — {count} consecutive {unit} observed.",
	dayUnit: "day",
	daysUnit: "days",
};

/** MERIDIAN's vocabulary for the directive add/edit modal. Exact strings the
 * dashboard has always shown — friendly injects its own plainer words. */
export const MERIDIAN_TODO_COPY: TodoModalCopy = {
	editTitle: "Edit directive",
	newTitle: "New directive",
	itemLabel: "Directive",
	weekPrintDesc:
		"Draw this directive on the week-at-a-glance print on its scheduled, due, or recurrence days.",
	needsText: "A directive needs text.",
};

/**
 * MERIDIAN's user-facing chrome/status copy, injected into core panels so the
 * shared code carries no voice. Dry, institutional register. This grows as core
 * panels that read `ctx.copy` are migrated; each key is documented by the panel
 * that reads it. Canon MERIDIAN lines never live here — only chrome/status text.
 */
export const MERIDIAN_COPY: DashCopy = {
	// Populated as copy-bearing core panels are migrated.
};
