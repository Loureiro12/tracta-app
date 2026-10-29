/**
 * What History still mocks: steps/sleep per day (they come from Apple Health on the device later),
 * badges and the monthly recap stories (gamification has no backend yet). Every logged session,
 * run, total, evolution point and record is read from the backend (see ../api).
 */

const HISTORY_YEAR = 2026;
/** October (0-based). */
const HISTORY_MONTH = 9;

function dateOf(day: number): Date {
  return new Date(HISTORY_YEAR, HISTORY_MONTH, day);
}

function seedOf(day: number): number {
  return (day * 7919) % 1000;
}

/** Steps/sleep of a day (YYYY-MM-DD); null after today. */
export function dayHealth(
  dateKey: string,
  todayKey: string,
): { steps: number; sleepMinutes: number } | null {
  if (dateKey > todayKey) return null;
  if (dateKey === todayKey) return { steps: 6842, sleepMinutes: 410 };
  const seed = seedOf(Number(dateKey.slice(8, 10)));
  return { steps: 6000 + seed * 7, sleepMinutes: 390 + (seed % 90) };
}

// ---------------------------------------------------------------------------
// Badges and recap (prototype `engageVals`)
// ---------------------------------------------------------------------------

export type EarnedBadgeId = 'streak12' | 'workouts50' | 'first5k' | 'oneTon';
export type LockedBadgeId = 'perfectMonth' | 'tenKSub55' | 'streak30' | 'workouts100';
export type BadgeId = EarnedBadgeId | LockedBadgeId;

export type BadgeTone = 'brand' | 'ink' | 'run' | 'danger' | 'sleep';

export type Badge =
  | { id: EarnedBadgeId; mark: string; tone: BadgeTone; earned: true; earnedOn: Date }
  | { id: LockedBadgeId; mark: string; tone: BadgeTone; earned: false; progress: number };

export const badges: readonly Badge[] = [
  { id: 'streak12', mark: '12', tone: 'brand', earned: true, earnedOn: dateOf(25) },
  { id: 'workouts50', mark: '50', tone: 'ink', earned: true, earnedOn: dateOf(14) },
  { id: 'first5k', mark: '5K', tone: 'run', earned: true, earnedOn: new Date(HISTORY_YEAR, 8, 2) },
  { id: 'oneTon', mark: '1t', tone: 'danger', earned: true, earnedOn: dateOf(21) },
  { id: 'perfectMonth', mark: '4/4', tone: 'sleep', earned: false, progress: 0.75 },
  { id: 'tenKSub55', mark: '10K', tone: 'run', earned: false, progress: 0.6 },
  { id: 'streak30', mark: '30', tone: 'brand', earned: false, progress: 0.4 },
  { id: 'workouts100', mark: '100', tone: 'ink', earned: false, progress: 0.64 },
];

export type RecapSlideIndex = 0 | 1 | 2 | 3 | 4;

export type RecapSlide = {
  index: RecapSlideIndex;
  bg: 'ink' | 'brand' | 'bg' | 'danger' | 'sleep';
  /** Light text on a dark background. */
  light: boolean;
  big: string;
};

export const recapSlides: readonly RecapSlide[] = [
  { index: 0, bg: 'ink', light: true, big: '16' },
  { index: 1, bg: 'brand', light: true, big: '58 km' },
  { index: 2, bg: 'bg', light: false, big: '42,2 t' },
  { index: 3, bg: 'danger', light: true, big: '3' },
  { index: 4, bg: 'sleep', light: true, big: '7h 02' },
];
