import type { DashCopy, TodoModalCopy } from "dash-core";

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
