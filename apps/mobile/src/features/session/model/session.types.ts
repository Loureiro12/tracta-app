/** Previous set: [kg | null (bodyweight), reps]. */
export type PrevSet = readonly [number | null, number];

export type SessionSet = { kg: number | null; reps: number; done: boolean };

export type SessionExercise = {
  /** Unique inside the session (position-based). */
  id: string;
  /** Exercise id in the backend library. */
  exerciseId: string;
  name: string;
  group: string;
  equipment: string;
  targetReps: number;
  restSec: number;
  /** Exercises sharing a superset id alternate without rest until the round closes. */
  superset: string | null;
  bodyweight: boolean;
  cardio: boolean;
  prev: readonly PrevSet[];
  sets: SessionSet[];
  /** Suggested warm-up sets (40/60/80 %). They never count toward volume. */
  warmup: SessionSet[] | null;
  warmupSkipped: boolean;
  suggestionDismissed: boolean;
};

export type ActiveSession = {
  /** Backend routine id, or FREE_ROUTINE_ID for a free session. */
  routineId: string;
  name: string;
  focus: string;
  startedAt: number;
  exercises: SessionExercise[];
  exerciseIndex: number;
  elapsedSec: number;
  paused: boolean;
};

export type RestState = { remainingSec: number; totalSec: number; paused: boolean };

export type SummaryRow = { name: string; sets: { kg: number | null; reps: number }[] };

export type SessionSummary = {
  name: string;
  focus: string;
  durationSec: number;
  sets: number;
  reps: number;
  volumeKg: number;
  /** Personal records: name + new best + previous best. */
  prs: { name: string; value: number; previous: number; bodyweight: boolean }[];
  /** Load suggestions for the next session. */
  next: { name: string; kg: number }[];
  rows: SummaryRow[];
};

export type PlateBar = 20 | 15 | 10;
