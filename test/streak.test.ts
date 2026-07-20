import { test, is, eq } from "./_harness";
import { advanceStreak, DEFAULT_STREAK, StreakData } from "../src/core/streak";

const T = "2026-07-20";
const Y = "2026-07-19";

test("streak: first counted day starts at 1 and sets the record", () => {
	const r = advanceStreak({ ...DEFAULT_STREAK }, true, T, Y);
	eq(r.streak, { current: 1, longest: 1, lastDayCounted: T });
	is(r.newRecord, true);
});

test("streak: consecutive day increments", () => {
	const prev: StreakData = { current: 3, longest: 3, lastDayCounted: Y };
	const r = advanceStreak(prev, true, T, Y);
	is(r.streak.current, 4);
	is(r.streak.longest, 4);
	is(r.streak.lastDayCounted, T);
	is(r.newRecord, true);
});

test("streak: a gap (older than yesterday) breaks to 1, keeps longest, no record, no guilt", () => {
	const prev: StreakData = { current: 9, longest: 9, lastDayCounted: "2026-07-10" };
	const r = advanceStreak(prev, true, T, Y);
	is(r.streak.current, 1);
	is(r.streak.longest, 9); // preserved
	is(r.newRecord, false);
});

test("streak: idempotent per day — counting twice today is a no-op", () => {
	const prev: StreakData = { current: 4, longest: 4, lastDayCounted: T };
	const r = advanceStreak(prev, true, T, Y);
	eq(r.streak, prev);
	is(r.newRecord, false);
});

test("streak: a day that doesn't count leaves the streak untouched (never breaks it)", () => {
	const prev: StreakData = { current: 5, longest: 6, lastDayCounted: Y };
	const r = advanceStreak(prev, false, T, Y);
	eq(r.streak, prev);
	is(r.newRecord, false);
});

test("streak: incrementing without beating the record is not a newRecord", () => {
	const prev: StreakData = { current: 2, longest: 10, lastDayCounted: Y };
	const r = advanceStreak(prev, true, T, Y);
	is(r.streak.current, 3);
	is(r.streak.longest, 10);
	is(r.newRecord, false);
});

test("streak: multiples of seven are reachable by consecutive increments", () => {
	let s: StreakData = { ...DEFAULT_STREAK };
	const days = ["07-14", "07-15", "07-16", "07-17", "07-18", "07-19", "07-20"].map((d) => "2026-" + d);
	let prevDay = "2026-07-13";
	for (const d of days) {
		s = advanceStreak(s, true, d, prevDay).streak;
		prevDay = d;
	}
	is(s.current, 7);
	is(s.current % 7 === 0, true);
});
