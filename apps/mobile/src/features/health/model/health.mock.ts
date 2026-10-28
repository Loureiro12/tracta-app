import type { MetricKey, SleepStage, WeekdayKey } from './health.types';

/**
 * Mock data ported from the prototype (`SEG`, `SC`, `SN`, `NIGHTS`, `HOURS`, `WEEK`, `KIND`, `RUNS`).
 * Numbers are raw; screens format them with the locale helpers in ../lib/format.
 */

/** Hypnogram: [stage, minutes] segments of the night (432 min in bed). */
export const SLEEP_SEGMENTS: readonly (readonly [SleepStage, number])[] = [
  ['light', 18],
  ['deep', 42],
  ['light', 30],
  ['rem', 16],
  ['light', 34],
  ['deep', 30],
  ['light', 22],
  ['awake', 6],
  ['rem', 24],
  ['light', 40],
  ['deep', 18],
  ['light', 32],
  ['rem', 28],
  ['light', 30],
  ['awake', 8],
  ['rem', 26],
  ['light', 20],
  ['awake', 8],
];

export const SLEEP_IN_BED_MIN = 432;
/** Rows of the hypnogram, top to bottom. */
export const SLEEP_STAGE_ROWS: readonly SleepStage[] = ['awake', 'rem', 'light', 'deep'];
/** Order of the stage totals legend (prototype: deep, light, rem, awake). */
export const SLEEP_STAGE_LEGEND: readonly SleepStage[] = ['deep', 'light', 'rem', 'awake'];
export const HYPNOGRAM_AXIS = ['23:48', '02h', '04h', '07:00'] as const;

export const SLEEP_GOAL_MIN = 450;
export const SLEEP_LAST_NIGHT_MIN = 410;
export const SLEEP_SCORE = 85;

export type SleepFactorKey = 'duration' | 'regularity' | 'interruptions' | 'consistency';
export const SLEEP_FACTORS: readonly {
  key: SleepFactorKey;
  pts: number;
  max: number;
  pct: number;
}[] = [
  { key: 'duration', pts: 34, max: 40, pct: 85 },
  { key: 'regularity', pts: 27, max: 30, pct: 90 },
  { key: 'interruptions', pts: 16, max: 20, pct: 80 },
  { key: 'consistency', pts: 8, max: 10, pct: 80 },
];

/** Last 7 nights: [minutes asleep, weekday]. */
export const NIGHTS: readonly (readonly [number, WeekdayKey])[] = [
  [412, 'tue'],
  [445, 'wed'],
  [398, 'thu'],
  [470, 'fri'],
  [488, 'sat'],
  [455, 'sun'],
  [410, 'mon'],
];

/** Last 30 nights (minutes), ending with NIGHTS. */
export const NIGHTS_30: readonly number[] = Array.from({ length: 30 }, (_, i) =>
  i >= 23 ? NIGHTS[i - 23]![0] : 430 + Math.round(30 * Math.sin(i * 1.3)) + (((i * 53) % 41) - 20),
);
export const MONTH_AXIS = ['27 set', '11 out', '26 out'] as const;

/** A value shown in a comparison table; formatted by `formatCompareValue` in ../lib/format. */
export type CompareValue =
  | { kind: 'text'; text: string }
  | { kind: 'ratio'; hit: number; total: number }
  | { kind: 'number'; value: number; digits?: number; unit?: 'bpm' };

export type SleepCompareKey = 'duration' | 'bedtime' | 'regularity' | 'onGoal' | 'wakeups';
export const SLEEP_COMPARE: readonly {
  key: SleepCompareKey;
  current: CompareValue;
  previous: CompareValue;
  better: boolean;
}[] = [
  {
    key: 'duration',
    current: { kind: 'text', text: '7h 20' },
    previous: { kind: 'text', text: '6h 45' },
    better: true,
  },
  {
    key: 'bedtime',
    current: { kind: 'text', text: '23:41' },
    previous: { kind: 'text', text: '00:08' },
    better: true,
  },
  {
    key: 'regularity',
    current: { kind: 'text', text: '±18 min' },
    previous: { kind: 'text', text: '±34 min' },
    better: true,
  },
  {
    key: 'onGoal',
    current: { kind: 'ratio', hit: 3, total: 7 },
    previous: { kind: 'ratio', hit: 1, total: 7 },
    better: true,
  },
  {
    key: 'wakeups',
    current: { kind: 'number', value: 2.6, digits: 1 },
    previous: { kind: 'number', value: 2.4, digits: 1 },
    better: false,
  },
];

export type TrainRestKey = 'sleepAfter' | 'steps' | 'restingHr';
export const TRAIN_VS_REST: readonly {
  key: TrainRestKey;
  train: CompareValue;
  rest: CompareValue;
  better: boolean;
}[] = [
  {
    key: 'sleepAfter',
    train: { kind: 'text', text: '7h 24' },
    rest: { kind: 'text', text: '7h 02' },
    better: true,
  },
  {
    key: 'steps',
    train: { kind: 'number', value: 10840 },
    rest: { kind: 'number', value: 6920 },
    better: true,
  },
  {
    key: 'restingHr',
    train: { kind: 'number', value: 60, unit: 'bpm' },
    rest: { kind: 'number', value: 59, unit: 'bpm' },
    better: false,
  },
];

/** Steps per hour today (ends at 16h). */
export const HOURS: readonly number[] = [
  0, 0, 0, 0, 0, 0, 120, 640, 820, 310, 260, 410, 980, 540, 380, 620, 1762, 0, 0, 0, 0, 0, 0, 0,
];
export const CURRENT_HOUR = 16;
export const HOURS_AXIS = ['0h', '6h', '12h', '18h', '23h'] as const;
export const STEPS_TODAY = 6842;
export const STEPS_GOAL = 10000;

/** Last 7 days of steps: [steps, weekday]. */
export const WEEK: readonly (readonly [number, WeekdayKey])[] = [
  [8420, 'tue'],
  [11230, 'wed'],
  [7310, 'thu'],
  [10450, 'fri'],
  [12880, 'sat'],
  [9640, 'sun'],
  [6842, 'mon'],
];

export const CALORIES = { active: 312, rest: 1120, total: 1432 } as const;
export const DISTANCE_TODAY_KM = 4.9;
export const ACTIVE_MINUTES = { moving: 38, intense: 12 } as const;

/** Resting heart rate today per hour (null = no reading yet). */
export const HR_DAY: readonly (number | null)[] = [
  56,
  54,
  53,
  52,
  52,
  53,
  58,
  72,
  84,
  78,
  74,
  80,
  92,
  76,
  73,
  79,
  88,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];
export const HR_WEEK: readonly number[] = [61, 60, 62, 59, 60, 61, 58];
export const CAL_WEEK: readonly number[] = [410, 520, 360, 480, 610, 450, 312];
export const DIST_WEEK: readonly number[] = [6.1, 8.2, 5.3, 7.6, 12.4, 7.0, 4.9];
export const METRIC_MONTH_AXIS = ['27 set', '6 out', '16 out', '26 out'] as const;

/** 30-day series generator from the prototype (`M30`). */
export function series30(base: number, amp: number, k: number): number[] {
  return Array.from({ length: 30 }, (_, i) =>
    Math.round(base + amp * Math.sin(i * 1.1 + k) + ((((i + 3) * 977) % 23) - 11) * (amp / 22)),
  );
}

export const METRIC_KEYS: readonly MetricKey[] = ['steps', 'hr', 'cal', 'dist', 'sleep', 'weight'];

/** Body: 30-day weight base series (kg) and the days with a scale reading. */
export const WEIGHT_BASE: readonly number[] = Array.from(
  { length: 30 },
  (_, i) =>
    Math.round((79.6 - i * 0.04 + 0.35 * Math.sin(i * 1.7) + (((i * 37) % 7) - 3) * 0.06) * 10) /
    10,
);
export const WEIGHT_DAYS: readonly number[] = [1, 4, 8, 11, 15, 18, 22, 25, 29];
export const DEFAULT_MEASURES = { waist: 86, hip: 98, arm: 35.5 } as const;
export const TODAY_DAY = 26;

/** History kinds per October day (A/B/C strength, R run) and run distances — feed the report. */
export const KIND: Readonly<Record<number, 'A' | 'B' | 'C' | 'R'>> = {
  2: 'C',
  5: 'A',
  7: 'B',
  9: 'C',
  12: 'A',
  14: 'B',
  16: 'C',
  19: 'A',
  21: 'B',
  23: 'C',
  3: 'R',
  6: 'R',
  10: 'R',
  13: 'R',
  17: 'R',
  20: 'R',
  24: 'R',
};
export const RUN_KM: Readonly<Record<number, number>> = {
  3: 5.2,
  6: 4.8,
  10: 7.5,
  13: 5.0,
  17: 7.8,
  20: 5.1,
  24: 8.2,
};
export const GOALS = { steps: 10000, sleep: 450, workouts: 4 } as const;
