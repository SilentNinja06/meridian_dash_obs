import { App, Modal, moment } from "obsidian";
import type MeridianDashPlugin from "../main";
import {
	headingField,
	readDailyNoteRaw,
	readField,
	readHeadingSection,
	readMarkerLogLines,
} from "../core/dailynote";

/**
 * Weekly review (§1.4): a read-only rollup of the last 7 days, compiled from the
 * archived daily notes — in-world, the observation summary MERIDIAN produces.
 * Counts, not commentary. It never writes and never re-derives state the stores
 * own; the notes are the record. Calm and descriptive: no scoring, no trend
 * judgment. Regulation is counts-only and a zero is silence (omitted), never a
 * "rough week"; nourishment is counted, never commented on.
 */
interface DayStat {
	date: string;
	completed: number;
}

interface WeekSummary {
	days: DayStat[];
	totalCompleted: number;
	contactLines: number;
	contacts: string[];
	mealsDays: number;
	regulationEntries: number;
	nourishmentEntries: number;
}

export class WeekReviewModal extends Modal {
	constructor(app: App, private plugin: MeridianDashPlugin) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText("Weekly review");
		this.modalEl.addClass("mrd-review-modal");
		const body = this.contentEl.createDiv({ cls: "mrd-review" });
		body.createDiv({ cls: "mrd-muted", text: "Compiling the record…" });
		void this.compile().then((summary) => {
			if (!body.isConnected) return;
			this.render(body, summary);
		});
	}

	private async compile(): Promise<WeekSummary> {
		const s = this.plugin.settings;
		const bridge = this.plugin.bridge;
		const days: string[] = [];
		for (let i = 6; i >= 0; i--) days.push(moment().subtract(i, "days").format("YYYY-MM-DD"));

		const dayStats: DayStat[] = [];
		let totalCompleted = 0;
		let contactLines = 0;
		const contacts = new Set<string>();
		let mealsDays = 0;
		let regulationEntries = 0;
		let nourishmentEntries = 0;

		for (const date of days) {
			const raw = await readDailyNoteRaw(this.app, date);

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

		return {
			days: dayStats,
			totalCompleted,
			contactLines,
			contacts: [...contacts].sort((a, b) => a.localeCompare(b)),
			mealsDays,
			regulationEntries,
			nourishmentEntries,
		};
	}

	private render(host: HTMLElement, sum: WeekSummary): void {
		host.empty();
		host.createDiv({ cls: "mrd-review-header", text: "OBSERVATION SUMMARY — 7-day window. The record is complete." });

		// Directives completed — total + per-day bars.
		const dir = host.createDiv({ cls: "mrd-review-block" });
		dir.createDiv({ cls: "mrd-review-stat-head", text: "Directives completed" });
		dir.createDiv({ cls: "mrd-review-figure", text: String(sum.totalCompleted) });
		const bars = dir.createDiv({ cls: "mrd-review-bars" });
		const max = Math.max(1, ...sum.days.map((d) => d.completed));
		for (const d of sum.days) {
			const cell = bars.createDiv({ cls: "mrd-review-bar-cell" });
			const track = cell.createDiv({ cls: "mrd-review-bar-track" });
			const fill = track.createDiv({ cls: "mrd-review-bar-fill" });
			fill.style.height = `${Math.round((d.completed / max) * 100)}%`;
			if (d.completed === 0) fill.addClass("is-empty");
			cell.createDiv({ cls: "mrd-review-bar-day", text: moment(d.date, "YYYY-MM-DD").format("dd")[0] });
			cell.createDiv({ cls: "mrd-review-bar-count", text: String(d.completed) });
		}

		// Contacts reached — count + distinct names (not descriptors).
		const crm = host.createDiv({ cls: "mrd-review-block" });
		crm.createDiv({ cls: "mrd-review-stat-head", text: "Contacts reached" });
		crm.createDiv({
			cls: "mrd-review-line",
			text: `${sum.contactLines} ${plural(sum.contactLines, "interaction", "interactions")} · ${sum.contacts.length} distinct.`,
		});
		if (sum.contacts.length > 0) {
			const chips = crm.createDiv({ cls: "mrd-review-chips" });
			for (const name of sum.contacts) chips.createSpan({ cls: "mrd-chip mrd-chip-cold", text: name });
		}

		// Meals planned — days with a non-empty Meals section.
		const meals = host.createDiv({ cls: "mrd-review-block" });
		meals.createDiv({ cls: "mrd-review-stat-head", text: "Meals planned" });
		meals.createDiv({ cls: "mrd-review-line", text: `${sum.mealsDays} of 7 ${plural(sum.mealsDays, "day", "days")}.` });

		// Nourishment — counts only, no comment.
		const nour = host.createDiv({ cls: "mrd-review-block" });
		nour.createDiv({ cls: "mrd-review-stat-head", text: "Nourishment log" });
		nour.createDiv({ cls: "mrd-review-line", text: `${sum.nourishmentEntries} ${plural(sum.nourishmentEntries, "entry", "entries")} this week.` });

		// Regulation — counts only; a zero is silence (omit the line entirely).
		if (sum.regulationEntries > 0) {
			const reg = host.createDiv({ cls: "mrd-review-block" });
			reg.createDiv({ cls: "mrd-review-stat-head", text: "Regulation log" });
			reg.createDiv({ cls: "mrd-review-line", text: `${sum.regulationEntries} ${plural(sum.regulationEntries, "entry", "entries")} this week.` });
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
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
