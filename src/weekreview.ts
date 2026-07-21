import { moment } from "obsidian";
import type MeridianDashPlugin from "./main";
import {
	WeekReviewConfig,
	WeekReviewData,
	WeekReviewBlock,
	headingField,
	readDailyNoteRaw,
	readField,
	readHeadingSection,
	readMarkerLogLines,
} from "dash-core";

/**
 * MERIDIAN's weekly review: the in-world observation summary compiled from the
 * archived daily notes. Counts, not commentary. All voice + companion-marker
 * reads live here (host); dash-core only renders the resulting WeekReviewData.
 */
export function meridianWeekReviewConfig(plugin: MeridianDashPlugin): WeekReviewConfig {
	return {
		title: "Weekly review",
		compilingText: "Compiling the record…",
		compile: () => compile(plugin),
	};
}

async function compile(plugin: MeridianDashPlugin): Promise<WeekReviewData> {
	const s = plugin.settings;
	const bridge = plugin.bridge;
	const days: string[] = [];
	for (let i = 6; i >= 0; i--) days.push(moment().subtract(i, "days").format("YYYY-MM-DD"));

	const dayStats: Array<{ date: string; completed: number }> = [];
	let totalCompleted = 0;
	let contactLines = 0;
	const contacts = new Set<string>();
	let mealsDays = 0;
	let regulationEntries = 0;
	let nourishmentEntries = 0;

	for (const date of days) {
		const raw = await readDailyNoteRaw(plugin.app, date);

		const completed = countBullets(readField(raw, headingField(s.completedTasksHeading)));
		totalCompleted += completed;
		dayStats.push({ date, completed });

		const crm = readMarkerLogLines(raw, s.crmLogMarker || "%% crm-log %%", s.crmLogHeading);
		contactLines += crm.length;
		for (const line of crm) {
			const name = contactName(line);
			if (name) contacts.add(name);
		}

		if (readHeadingSection(raw, "Meals").trim().length > 0) mealsDays++;

		nourishmentEntries += readMarkerLogLines(raw, "%% arfid-log %%", "Miscellaneous notes").length;
		regulationEntries += await bridge.spiralEntriesForDate(date);
	}

	const sortedContacts = [...contacts].sort((a, b) => a.localeCompare(b));

	const streak = plugin.streak;
	const streakLine =
		streak.current > 0
			? `RECORD — ${streak.current} consecutive ${plural(streak.current, "day", "days")} observed${
					streak.longest > streak.current ? ` · longest ${streak.longest}` : ""
			  }.`
			: undefined;

	const blocks: WeekReviewBlock[] = [
		{
			head: "Directives completed",
			figure: String(totalCompleted),
			bars: dayStats.map((d) => ({ label: moment(d.date, "YYYY-MM-DD").format("dd")[0], count: d.completed })),
		},
		{
			head: "Contacts reached",
			line: `${contactLines} ${plural(contactLines, "interaction", "interactions")} · ${sortedContacts.length} distinct.`,
			chips: sortedContacts.length > 0 ? sortedContacts : undefined,
		},
		{ head: "Meals planned", line: `${mealsDays} of 7 ${plural(mealsDays, "day", "days")}.` },
		{ head: "Nourishment log", line: `${nourishmentEntries} ${plural(nourishmentEntries, "entry", "entries")} this week.` },
	];
	if (regulationEntries > 0) {
		blocks.push({ head: "Regulation log", line: `${regulationEntries} ${plural(regulationEntries, "entry", "entries")} this week.` });
	}

	return { header: "OBSERVATION SUMMARY — 7-day window. The record is complete.", streakLine, blocks };
}

/** Count `- …` bullet lines in a section body. */
function countBullets(body: string): number {
	return body.split("\n").filter((l) => /^\s*-\s+\S/.test(l)).length;
}

/** The display name from a `- HH:MM [[Target|Name]] — …` contact log line. */
function contactName(line: string): string {
	const m = line.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
	if (!m) return "";
	return (m[2] ?? m[1]).trim();
}

function plural(n: number, one: string, many: string): string {
	return n === 1 ? one : many;
}
