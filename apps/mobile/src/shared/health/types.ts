import type { activities } from '@tracta/api';

/** Which on-device store a HealthSource talks to (matches the backend's `health_connections.source`). */
export type HealthSourceKind = 'apple_health' | 'health_connect' | 'google_health';

/** Data types the app reads. Same keys as the permission screen (features/auth). */
export type HealthReadType =
  'steps' | 'distance' | 'active' | 'resting' | 'heart' | 'sleep' | 'workouts' | 'body';
/** Data types the app writes back. */
export type HealthWriteType = 'workouts' | 'distance' | 'body';

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

export type WorkoutKind = activities.ActivityKind | 'strength';

/** A workout recorded by another app, read from the store. */
export type HealthWorkout = {
  /** The store's own id, stable between syncs. */
  id: string;
  kind: WorkoutKind;
  start: Date;
  end: Date;
  distanceM: number | null;
  avgHeartRate: number | null;
};

/** One reading of a body measure (a scale or another app wrote it). */
export type BodyReading = { at: Date; weightKg?: number; waistCm?: number };

/** A finished workout or run to write back into the store. */
export type WorkoutToSave = {
  kind: WorkoutKind;
  start: Date;
  end: Date;
  distanceM?: number;
  energyKcal?: number;
  title?: string;
};

/** Extra operations of a source that needs its own sign-in (Google Health). */
export type GoogleHealthClient = {
  /** False when the user must sign in to Google again (consent expired or revoked). */
  isLinked(): Promise<boolean>;
  signOut(): Promise<void>;
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
  /** Workouts that started in the range, without the ones Tracta wrote itself. */
  readWorkouts(range: HealthRange): Promise<HealthWorkout[]>;
  readBody(range: HealthRange): Promise<BodyReading[]>;
  /** Writes a workout; resolves false when the store refused (no permission, unavailable). */
  saveWorkout(workout: WorkoutToSave): Promise<boolean>;
  /** Writes a weigh-in; resolves false when the store refused. */
  saveWeight(at: Date, weightKg: number): Promise<boolean>;
}
