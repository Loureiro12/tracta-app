/**
 * Mock data for the share cards (prototype `shareVals()`), kg only.
 * Health data (sleep, heart rate) is never part of a card.
 */
export const shareTemplates = ['today', 'evo', 'pr', 'week', 'run', 'month'] as const;
export type ShareTemplate = (typeof shareTemplates)[number];

export const shareStyles = ['ink', 'sand', 'brand', 'photo'] as const;
export type ShareStyle = (typeof shareStyles)[number];

export const shareFormats = ['story', 'post'] as const;
export type ShareFormat = (typeof shareFormats)[number];

export const shareOptions = ['loads', 'times', 'name'] as const;
export type ShareOption = (typeof shareOptions)[number];

export const shareTargets = ['stories', 'whatsapp', 'save', 'more'] as const;
export type ShareTarget = (typeof shareTargets)[number];

export function isShareTemplate(value: unknown): value is ShareTemplate {
  return typeof value === 'string' && (shareTemplates as readonly string[]).includes(value);
}
export function isShareStyle(value: unknown): value is ShareStyle {
  return typeof value === 'string' && (shareStyles as readonly string[]).includes(value);
}

/** Preview sizes (export sizes are 1080×1920 / 1080×1350). */
export const cardSizes: Record<ShareFormat, { width: number; height: number }> = {
  story: { width: 232, height: 412 },
  post: { width: 270, height: 338 },
};

/** Glyphs drawn inside the destination squares. */
export const targetGlyphs: Record<ShareTarget, string> = {
  stories: 'IG',
  whatsapp: 'WA',
  save: '↓',
  more: '···',
};

export const userMock = { handle: 'lucas' };

export const todayMock = {
  duration: '52 min',
  sets: 22,
  volumeTons: 8.4,
  prs: 1,
  weekDone: 4,
  weekGoal: 4,
};

export const evoMock = {
  maxKgByMonth: [70, 72.5, 75, 77.5, 80, 82.5],
  deltaKg: 12.5,
  deltaPct: 18,
  workouts: 64,
  streakDays: 12,
};

export const prMock = {
  kg: 82.5,
  reps: 6,
  deltaKg: 2.5,
  recordsThisMonth: 3,
  sinceStartKg: 22.5,
  sinceStartPct: 37,
};

export const weekMock = {
  done: 4,
  goal: 4,
  /** Indices (Mon..Sun) with an activity. */
  activeDays: [0, 2, 3, 5],
  strengthWorkouts: 3,
  runKm: 18,
  streakDays: 12,
};

export const runMock = {
  km: 12.4,
  time: '1:09:02',
  pace: '5:34',
  /** Pace per 2 km split (min/km). */
  splits: [5.52, 5.4, 5.36, 5.31, 5.28, 5.2],
};

export const monthMock = {
  workouts: 16,
  moreThanPrevious: 4,
  runKm: 58,
  volumeTons: 42.2,
  records: 3,
};

/** Bar heights (px) for the 6-month evolution chart, as in the prototype. */
export function evoBarHeights(kgs: readonly number[]): number[] {
  const max = Math.max(...kgs);
  const min = Math.min(...kgs) - 8;
  return kgs.map((v) => Math.round(8 + ((v - min) / (max - min)) * 44));
}

/** Bar heights (px) for run splits: faster split = taller bar. */
export function splitBarHeights(splits: readonly number[]): number[] {
  const slowest = Math.max(...splits);
  return splits.map((v) => Math.round(10 + ((slowest - v) / (slowest - 5.2 + 0.01)) * 40));
}
