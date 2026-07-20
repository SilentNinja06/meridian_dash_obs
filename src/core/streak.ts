/**
 * Observation streak (§2.2): a genuine longevity metric and honest milestone
 * trigger. The transition logic is pure (date strings passed in) so it can be
 * unit-tested for the consecutive / broken / idempotent-per-day cases.
 *
 * A broken streak is silent — it just resets `current` to 1 and produces no
 * negative copy anywhere. Only positive milestones speak, via the canon pool.
 */
export interface StreakData {
	current: number;
	longest: number;
	/** YYYY-MM-DD of the most recent day counted, or "" if none yet. */
	lastDayCounted: string;
}

export const DEFAULT_STREAK: StreakData = { current: 0, longest: 0, lastDayCounted: "" };

export interface StreakResult {
	streak: StreakData;
	/** True when this advance set a new all-time record (a fresh `longest`). */
	newRecord: boolean;
}

/**
 * Advance the streak given whether today counts and the today/yesterday dates.
 *  - today doesn't count yet → unchanged (we never break a streak on a day that
 *    simply hasn't earned its mark).
 *  - already counted today → unchanged (idempotent per day).
 *  - lastDayCounted was yesterday → current + 1.
 *  - lastDayCounted older than yesterday (or empty) → current = 1 (streak broke).
 */
export function advanceStreak(
	prev: StreakData,
	todayCounts: boolean,
	today: string,
	yesterday: string
): StreakResult {
	if (!todayCounts || prev.lastDayCounted === today) {
		return { streak: prev, newRecord: false };
	}
	const current = prev.lastDayCounted === yesterday ? prev.current + 1 : 1;
	const longest = Math.max(prev.longest, current);
	return {
		streak: { current, longest, lastDayCounted: today },
		newRecord: longest > prev.longest,
	};
}
