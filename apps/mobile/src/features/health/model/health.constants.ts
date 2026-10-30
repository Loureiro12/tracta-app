import type { MetricKey, SleepStage } from './health.types';

/** Presentational constants of the Health screens (data comes from ../api). */

/** Rows of the hypnogram, top to bottom. */
export const SLEEP_STAGE_ROWS: readonly SleepStage[] = ['awake', 'rem', 'light', 'deep'];
/** Order of the stage totals legend (prototype: deep, light, rem, awake). */
export const SLEEP_STAGE_LEGEND: readonly SleepStage[] = ['deep', 'light', 'rem', 'awake'];
export const HOURS_AXIS = ['0h', '6h', '12h', '18h', '23h'] as const;
export const METRIC_KEYS: readonly MetricKey[] = ['steps', 'hr', 'cal', 'dist', 'sleep', 'weight'];

export type SleepFactorKey = 'duration' | 'regularity' | 'interruptions' | 'consistency';
/** Sleep score factors and their weights (they add up to 100). */
export const SLEEP_FACTOR_MAX: Readonly<Record<SleepFactorKey, number>> = {
  duration: 40,
  regularity: 30,
  interruptions: 20,
  consistency: 10,
};
export const SLEEP_FACTOR_KEYS = Object.keys(SLEEP_FACTOR_MAX) as SleepFactorKey[];

/** A value shown in a comparison table; formatted by `formatCompareValue` in ../lib/format. */
export type CompareValue =
  | { kind: 'text'; text: string }
  | { kind: 'ratio'; hit: number; total: number }
  | { kind: 'number'; value: number; digits?: number; unit?: 'bpm' }
  | { kind: 'none' };

export type SleepCompareKey = 'duration' | 'bedtime' | 'regularity' | 'onGoal' | 'wakeups';
export type TrainRestKey = 'sleepAfter' | 'steps' | 'restingHr';
