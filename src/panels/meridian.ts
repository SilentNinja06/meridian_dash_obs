import { moment } from "obsidian";
import { BasePanel, RefreshReason, placard } from "./types";
// Canon: 288 lines across 12 pools. Bundled verbatim — never rewritten (§7.3, §12).
import LINES from "../../meridian-lines.json";

type TimeSegment = "morning" | "afternoon" | "evening" | "late_night";

interface LinesFile {
	session: string[];
	standard: string[];
	time_of_day: Record<TimeSegment, string[]>;
	affirming: string[];
	identity: string[];
	care: string[];
	productivity: string[];
	overdue: string[];
	idle: string[];
	food: string[];
	aftercare: string[];
	milestone: string[];
}

const POOLS = LINES as unknown as LinesFile;

/**
 * MERIDIAN ambient line (§7.3): contextual, weighted selection — not a flat
 * random draw. Aftercare dominates when a spiral/shutdown was logged today;
 * overdue/idle/food/productivity respond to state; identity, affirming, and
 * care sit in the baseline rotation organically. A recent-history ring stops
 * repeats within a session. Milestone lines fire rarely and never twice a day.
 */
export class MeridianPanel extends BasePanel {
	id = "meridian";
	title = "MERIDIAN";
	private currentLine = "";

	protected async setup(): Promise<void> {
		const minutes = Math.max(1, this.ctx.settings().meridianRotationMinutes || 5);
		this.setInterval(() => void this.rotate(), minutes * 60 * 1000);
	}

	async refresh(reason?: RefreshReason): Promise<void> {
		if (reason === "open" || reason === "manual") {
			await this.rotate();
			return;
		}
		// vault/interval-driven redraw keeps the current line steady.
		if (this.el?.isConnected) await this.paint();
	}

	private async paint(): Promise<void> {
		this.el.empty();
		await this.renderBody();
	}

	/** Force-rotate the ambient line (§1.1 `new-meridian-line`). Public so the
	 * command can drive a mounted panel through the full weighted selection. */
	async rotate(): Promise<void> {
		this.currentLine = await this.pick();
		if (this.el?.isConnected) await this.paint();
	}

	protected async renderBody(): Promise<void> {
		if (!this.currentLine) this.currentLine = await this.pick();
		const head = placard(this.el, "MERIDIAN");
		head.createSpan({ cls: "mrd-placard-badge", text: "OBSERVING" });
		const card = this.el.createDiv({ cls: "mrd-meridian" });
		card.createDiv({ cls: "mrd-meridian-line", text: this.currentLine });
	}

	// --------------------------------------------------------- selection

	private async pick(): Promise<string> {
		const weights = await this.weights();
		let pool = weightedPick(weights);
		let candidates = this.candidatesFor(pool);
		// Fall back through standard if a pool somehow has no candidates.
		if (candidates.length === 0) {
			pool = "standard";
			candidates = POOLS.standard.slice();
		}

		const ring = this.ctx.runtime.recentLines;
		const fresh = candidates.filter((l) => !ring.includes(l));
		const bag = fresh.length ? fresh : candidates;
		const line = bag[Math.floor(Math.random() * bag.length)];

		if (pool === "milestone") {
			this.ctx.plugin.milestoneShownDate = moment().format("YYYY-MM-DD");
			void this.ctx.plugin.saveData_();
		}

		ring.push(line);
		while (ring.length > 24) ring.shift();
		return line;
	}

	private candidatesFor(pool: string): string[] {
		if (pool === "time_of_day") return POOLS.time_of_day[timeSegment()].slice();
		const arr = (POOLS as unknown as Record<string, string[]>)[pool];
		return Array.isArray(arr) ? arr.slice() : [];
	}

	private async weights(): Promise<Record<string, number>> {
		const { todos, bridge, runtime, plugin } = this.ctx;
		const todayStr = moment().format("YYYY-MM-DD");
		const pending = todos.pendingCount();
		const overdueTodos = todos.overdueCount();
		const crm = safe(() => bridge.crmContacts(), []);
		const crmOverdue = crm.filter((r) => r.overdue).length;
		const spiralToday = await safeAsync(() => bridge.spiralOccurredToday(), false);
		const firstOfSession = runtime.recentLines.length === 0;
		const gapMs = Date.now() - runtime.previousAccess;

		const w: Record<string, number> = {
			// Baseline mix — always eligible, tuned to stay well under half of output.
			standard: 4,
			time_of_day: 3,
			care: 2,
			affirming: 2,
			identity: 1.5,
		};

		// Time-of-day productivity vs idle.
		const hour = new Date().getHours();
		const midday = hour >= 10 && hour <= 17;
		if (pending > 0) w.productivity = midday ? 3 : 1.5;
		if (pending === 0 && overdueTodos === 0 && crmOverdue === 0) w.idle = 4;
		if (overdueTodos > 0 || crmOverdue > 0) w.overdue = 5;

		// Food focus window (§7.3) — set when a food surface is interacted with.
		if (runtime.foodFocusUntil > Date.now()) w.food = 6;

		// Session line on open, weighted up after a long gap.
		if (firstOfSession) w.session = gapMs > 60 * 60 * 1000 ? 10 : 5;

		// Aftercare dominates when the day held a spiral/shutdown — highest priority.
		if (spiralToday) w.aftercare = 14;

		// Milestone: rare, real trigger, never twice a day.
		if (plugin.milestoneShownDate !== todayStr && this.milestoneTriggered()) {
			w.milestone = 9;
		}

		return w;
	}

	/** A real, honest round-number trigger: today's completed directives just
	 * crossed a multiple of five. */
	private milestoneTriggered(): boolean {
		const doneToday = this.ctx.todos.instancesFor().filter((i) => i.done).length;
		return doneToday > 0 && doneToday % 5 === 0;
	}
}

/** A uniformly random line from the whole closed canon (all 288 lines across
 * every pool). Used only for the headless `new-meridian-line` Notice when no
 * dashboard leaf is mounted — still the closed pool, never generated. */
export function anyCanonLine(): string {
	const all: string[] = [
		...POOLS.session,
		...POOLS.standard,
		...POOLS.time_of_day.morning,
		...POOLS.time_of_day.afternoon,
		...POOLS.time_of_day.evening,
		...POOLS.time_of_day.late_night,
		...POOLS.affirming,
		...POOLS.identity,
		...POOLS.care,
		...POOLS.productivity,
		...POOLS.overdue,
		...POOLS.idle,
		...POOLS.food,
		...POOLS.aftercare,
		...POOLS.milestone,
	];
	return all[Math.floor(Math.random() * all.length)] ?? "STABILITY THROUGH OBSERVATION.";
}

function timeSegment(): TimeSegment {
	const h = new Date().getHours();
	if (h >= 5 && h <= 11) return "morning";
	if (h >= 12 && h <= 16) return "afternoon";
	if (h >= 17 && h <= 21) return "evening";
	return "late_night";
}

function weightedPick(weights: Record<string, number>): string {
	const entries = Object.entries(weights).filter(([, w]) => w > 0);
	const total = entries.reduce((s, [, w]) => s + w, 0);
	let r = Math.random() * total;
	for (const [pool, w] of entries) {
		r -= w;
		if (r <= 0) return pool;
	}
	return entries.length ? entries[entries.length - 1][0] : "standard";
}

function safe<T>(fn: () => T, fallback: T): T {
	try {
		return fn();
	} catch {
		return fallback;
	}
}

async function safeAsync<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
	try {
		return await fn();
	} catch {
		return fallback;
	}
}
