import { Recurrence, TodoItem, cryptoId } from "dash-core";

/**
 * MERIDIAN's voiced header for the directives Markdown file. Host-owned so core
 * stays lore-free; passed into `DirectivesStore`. Parsing ignores the header, so
 * this only fixes the human-readable comment — but it must stay byte-exact to
 * keep an existing vault's file identical (see the core A.7 golden-file test).
 */
export const DIRECTIVES_HEADER =
	"%% MERIDIAN Dashboard — persistent directives. Managed automatically; " +
	"edit these in the dashboard, not here. %%";

/**
 * First-run starter directives (§7.4). Host-owned: this is MERIDIAN's specific
 * task list, so it lives here rather than in the shared core. Ids are minted
 * with core's `cryptoId` so they match every other directive.
 */
export function seedTodos(): TodoItem[] {
	const specs: Array<{ text: string; recurrence: Recurrence; time?: string }> = [
		{ text: "Take meds", recurrence: { type: "daily" }, time: "09:00" },
		{ text: "Log food", recurrence: { type: "daily" } },
		{ text: "Do daily log", recurrence: { type: "daily" } },
		{ text: "Refer to the day before's notes", recurrence: { type: "daily" } },
		{ text: "Check the day's calendar", recurrence: { type: "daily" } },
		{ text: "Ground School", recurrence: { type: "daily" } },
		{ text: "Resolve course", recurrence: { type: "daily" } },
		{ text: "Marketing course", recurrence: { type: "daily" } },
		{ text: "Inkscape course", recurrence: { type: "daily" } },
	];
	return specs.map((s, idx) => ({
		id: cryptoId(),
		text: s.text,
		recurrence: s.recurrence,
		createdAt: Date.now(),
		order: idx,
		scheduledTime: s.time,
		completions: [],
		skips: [],
	}));
}
