import type { DashCopy, TodoModalCopy, ClockCopy } from "dash-core";

/** MERIDIAN's clock register — the exact voice the dashboard has always shown.
 * Friendly injects its own warm, plain equivalents. */
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
