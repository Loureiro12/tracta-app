import type { activities } from '@tracta/api';

/** A row of the day card under the calendar. `key` is stable for testIDs ("run-24"). */
export type DayItem =
  | {
      id: string;
      key: string;
      kind: 'strength';
      routineName: string;
      focus: string;
      minutes: number;
      sets: number;
    }
  | {
      id: string;
      key: string;
      kind: 'run' | 'activity';
      activity: activities.ActivityKind;
      summary: string;
    }
  | { id: string; key: string; kind: 'planned'; routineName: string; focus: string };

/** Calendar marker of a day: strength (brand dot) or any activity (run dot). */
export type DayActivity = 'strength' | 'run';

export type RunSplit = {
  /** Full kilometre index (1-based) or the trailing fraction in km. */
  km: number;
  partial: boolean;
  paceSeconds: number;
  /** Bar width in percent. */
  width: number;
  best: boolean;
};

export type EvoKind = 'strength' | 'cardio';
export type StrengthMetric = 'kg' | 'vol' | 'reps';
export type CardioMetric = 'pace' | 'dist' | 'hr';
export type CardioGroup = 'all' | '5k' | 'long';

export type ChartPoint = { date: Date; value: number; pr: boolean };

export type ChartGeometry = {
  line: string;
  area: string;
  cx: number;
  cy: number;
};
