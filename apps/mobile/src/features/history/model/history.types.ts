export type SessionKind = 'strength' | 'run';

export type RoutineId = 'A' | 'B' | 'C';

/** One set as it appears in a finished strength session. */
export type LoggedSet = { kg: number | null; reps: number };

export type RoutineExercise = {
  id: string;
  name: string;
  reps: number;
  /** Last recorded sets [kg|null (bodyweight), reps]. */
  prev: readonly (readonly [number | null, number])[];
};

export type Routine = {
  id: RoutineId;
  name: string;
  focus: string;
  /** Day of the month of the latest session of this routine. */
  endDay: number;
  exercises: readonly RoutineExercise[];
};

/** A row of the day card under the calendar. */
export type DayItem =
  | {
      id: string;
      kind: 'strength';
      routineName: string;
      focus: string;
      minutes: number;
      sets: number;
    }
  | { id: string; kind: 'run'; summary: string }
  | { id: string; kind: 'planned'; routineName: string; focus: string };

export type SessionExercise = {
  id: string;
  name: string;
  bodyweight: boolean;
  pr: boolean;
  sets: LoggedSet[];
};

export type StrengthSession = {
  id: string;
  kind: 'strength';
  day: number;
  routine: Routine;
  startMinutes: number;
  durationMinutes: number;
  exercises: SessionExercise[];
  totals: { sets: number; reps: number; volume: number };
};

export type RunSplit = {
  /** Full kilometre index (1-based) or the trailing fraction in km. */
  km: number;
  partial: boolean;
  paceSeconds: number;
  /** Bar width in percent. */
  width: number;
  best: boolean;
};

export type RunSession = {
  id: string;
  kind: 'run';
  day: number;
  distanceKm: number;
  seconds: number;
  paceSeconds: number;
  heartRate: number;
  splits: RunSplit[];
  route: { full: string; partial: string; cx: number; cy: number };
};

export type HistorySession = StrengthSession | RunSession;

export type EvoKind = 'strength' | 'cardio';
export type StrengthMetric = 'kg' | 'vol' | 'reps';
export type CardioMetric = 'pace' | 'dist' | 'hr';
export type CardioGroup = 'all' | '5k' | 'long';

export type EvoPoint = {
  date: Date;
  kg: number | null;
  reps: number;
  vol: number;
};

export type RunPoint = {
  date: Date;
  dist: number;
  sec: number;
  pace: number;
  hr: number;
};

export type ChartPoint = { date: Date; value: number; pr: boolean };

export type ChartGeometry = {
  line: string;
  area: string;
  cx: number;
  cy: number;
};
