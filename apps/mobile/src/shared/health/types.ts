/** Which on-device store a HealthSource talks to (matches the backend's `health_connections.source`). */
export type HealthSourceKind = 'apple_health' | 'health_connect';

/** Data types the app reads. Same keys as the permission screen (features/auth). */
export type HealthReadType =
  'steps' | 'distance' | 'active' | 'resting' | 'heart' | 'sleep' | 'workouts';
/** Data types the app writes back. */
export type HealthWriteType = 'workouts' | 'distance';

export type HealthPermissions = {
  read: readonly HealthReadType[];
  write: readonly HealthWriteType[];
};

/** Half-open local-time range [from, to). */
export type HealthRange = { from: Date; to: Date };

/** Movement totals of one local calendar day. Null = the store has no reading for it. */
export type DayActivity = {
  /** YYYY-MM-DD (local). */
  day: string;
  steps: number | null;
  distanceM: number | null;
  activeKcal: number | null;
  restKcal: number | null;
  activeMinutes: number | null;
  intenseMinutes: number | null;
  /** 24 values (0h … 23h), or null when the store cannot split the day. */
  stepsHourly: number[] | null;
};

export type SleepStage = 'awake' | 'rem' | 'light' | 'deep';

/** One night in bed with its stages in chronological order. */
export type SleepSession = {
  start: Date;
  end: Date;
  stages: readonly { stage: SleepStage; start: Date; end: Date }[];
};

export type HeartRateSample = { at: Date; bpm: number };

export type HeartRateData = {
  samples: readonly HeartRateSample[];
  /** Resting HR per local day, when the store computes it. */
  resting: readonly { day: string; bpm: number }[];
};

export type WorkoutKind = 'run' | 'walk' | 'strength' | 'other';

/** A finished workout or run to write back into the store. */
export type WorkoutToSave = {
  kind: WorkoutKind;
  start: Date;
  end: Date;
  distanceM?: number;
  energyKcal?: number;
  title?: string;
};

/**
 * Reads health data from the device (Apple Health on iOS, Health Connect on Android) and writes
 * workouts back. E2E builds use a deterministic fake (see ./fake).
 */
export interface HealthSource {
  readonly kind: HealthSourceKind;
  /** True for the deterministic fake (E2E / simulators without the native module). */
  readonly isFake: boolean;
  isAvailable(): Promise<boolean>;
  /** Shows the system permission prompt; resolves false when the user declined or it failed. */
  requestPermissions(permissions: HealthPermissions): Promise<boolean>;
  readDayActivity(range: HealthRange): Promise<DayActivity[]>;
  readSleepSessions(range: HealthRange): Promise<SleepSession[]>;
  readHeartRate(range: HealthRange): Promise<HeartRateData>;
  /** Writes a workout; resolves false when the store refused (no permission, unavailable). */
  saveWorkout(workout: WorkoutToSave): Promise<boolean>;
}
