import { toDateKey } from '@/shared/clock';
import { env } from '@/shared/config/env';

import type {
  BodyReading,
  DayActivity,
  HealthPermissions,
  HealthRange,
  HealthSource,
  HealthWorkout,
  HeartRateData,
  SleepSession,
  SleepStage,
  WorkoutKind,
  WorkoutToSave,
} from './types';
import type * as HealthKitModule from '@kingstinct/react-native-healthkit';

type HealthKit = typeof HealthKitModule;

const STEPS = 'HKQuantityTypeIdentifierStepCount';
const DISTANCE = 'HKQuantityTypeIdentifierDistanceWalkingRunning';
const ACTIVE = 'HKQuantityTypeIdentifierActiveEnergyBurned';
const BASAL = 'HKQuantityTypeIdentifierBasalEnergyBurned';
const EXERCISE = 'HKQuantityTypeIdentifierAppleExerciseTime';
const HEART = 'HKQuantityTypeIdentifierHeartRate';
const RESTING = 'HKQuantityTypeIdentifierRestingHeartRate';
const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis';
const WORKOUT = 'HKWorkoutTypeIdentifier';
const BODY_MASS = 'HKQuantityTypeIdentifierBodyMass';
const WAIST = 'HKQuantityTypeIdentifierWaistCircumference';

/** Average walking cadence used to estimate "moving" minutes from steps (HealthKit has no such total). */
const STEPS_PER_MOVING_MINUTE = 100;

// HKWorkoutActivityType raw values.
const ACTIVITY: Record<WorkoutKind, number> = {
  run: 37,
  walk: 52,
  bike: 13,
  swim: 46,
  soccer: 41,
  basket: 6,
  tennis: 48,
  functional: 20,
  stretch: 62,
  yoga: 57,
  strength: 50,
};
/** Types that read as another kind than the one Tracta writes (the rest count as 'functional'). */
const ACTIVITY_KIND: Record<number, WorkoutKind> = {
  ...(Object.fromEntries(Object.entries(ACTIVITY).map(([kind, raw]) => [raw, kind])) as Record<
    number,
    WorkoutKind
  >),
  24: 'walk', // hiking
  74: 'bike', // hand cycling
  80: 'stretch', // cooldown
};
/** Recorded as workouts, but not training: mind and body, fishing, hunting, recovery, rest, transition. */
const NOT_A_WORKOUT: ReadonlySet<number> = new Set([29, 19, 26, 33, 2998, 83]);
// HKCategoryValueSleepAnalysis raw values.
const SLEEP_VALUE: Record<number, SleepStage | null> = {
  0: null, // in bed
  1: 'light', // asleep (unspecified)
  2: 'awake',
  3: 'light', // core
  4: 'deep',
  5: 'rem',
};

let module: Promise<HealthKit | null> | null = null;

/** Loads the Nitro module lazily: builds without it (Expo Go, old dev clients) must not crash. */
export function loadHealthKit(): Promise<HealthKit | null> {
  module ??= import('@kingstinct/react-native-healthkit').then(
    (m) => (m.isHealthDataAvailable() ? m : null),
    () => null,
  );
  return module;
}

async function hk(): Promise<HealthKit> {
  const m = await loadHealthKit();
  if (!m) throw new Error('HealthKit is not available');
  return m;
}

const READ = {
  steps: [STEPS],
  distance: [DISTANCE],
  active: [ACTIVE, BASAL, EXERCISE],
  resting: [RESTING],
  heart: [HEART],
  sleep: [SLEEP],
  workouts: [WORKOUT],
  body: [BODY_MASS, WAIST],
} as const;
const WRITE = {
  workouts: [WORKOUT, ACTIVE],
  distance: [DISTANCE],
  body: [BODY_MASS],
} as const;

const dateFilter = (r: HealthRange) => ({ filter: { date: { startDate: r.from, endDate: r.to } } });

/** Daily sums of one cumulative quantity, keyed by local day. */
async function dailySums(
  m: HealthKit,
  identifier: string,
  unit: string,
  range: HealthRange,
  interval: { day?: number; hour?: number } = { day: 1 },
): Promise<{ start: Date; value: number }[]> {
  const rows = await m.queryStatisticsCollectionForQuantity(
    identifier as typeof STEPS,
    ['cumulativeSum'],
    range.from,
    interval,
    { ...dateFilter(range), unit: unit as 'count' },
  );
  return rows
    .filter((r) => r.startDate && r.sumQuantity)
    .map((r) => ({ start: new Date(r.startDate!), value: r.sumQuantity!.quantity }));
}

export const healthKitSource: HealthSource = {
  kind: 'apple_health',
  isFake: false,

  isAvailable: async () => (await loadHealthKit()) != null,

  async requestPermissions({ read, write }: HealthPermissions) {
    try {
      const m = await hk();
      const toRead = [...new Set(read.flatMap((t) => READ[t]))];
      const toShare = [...new Set(write.flatMap((t) => WRITE[t]))];
      return await m.requestAuthorization({
        toRead: toRead as never,
        toShare: toShare as never,
      });
    } catch {
      return false;
    }
  },

  async readDayActivity(range): Promise<DayActivity[]> {
    const m = await hk();
    const [steps, distance, active, basal, exercise, hourly] = await Promise.all([
      dailySums(m, STEPS, 'count', range),
      dailySums(m, DISTANCE, 'm', range),
      dailySums(m, ACTIVE, 'kcal', range),
      dailySums(m, BASAL, 'kcal', range),
      dailySums(m, EXERCISE, 'min', range),
      dailySums(m, STEPS, 'count', range, { hour: 1 }),
    ]);
    const days = new Map<string, DayActivity>();
    const day = (d: Date) => {
      const key = toDateKey(d);
      let e = days.get(key);
      if (!e) {
        e = {
          day: key,
          steps: null,
          distanceM: null,
          activeKcal: null,
          restKcal: null,
          activeMinutes: null,
          intenseMinutes: null,
          stepsHourly: null,
        };
        days.set(key, e);
      }
      return e;
    };
    for (const s of steps) {
      const e = day(s.start);
      e.steps = s.value;
      e.activeMinutes = Math.round(s.value / STEPS_PER_MOVING_MINUTE);
    }
    for (const s of distance) day(s.start).distanceM = s.value;
    for (const s of active) day(s.start).activeKcal = s.value;
    for (const s of basal) day(s.start).restKcal = s.value;
    for (const s of exercise) day(s.start).intenseMinutes = s.value;
    for (const s of hourly) {
      const e = days.get(toDateKey(s.start));
      if (!e) continue;
      e.stepsHourly ??= Array<number>(24).fill(0);
      e.stepsHourly[s.start.getHours()] = Math.round(s.value);
    }
    return [...days.values()];
  },

  async readSleepSessions(range): Promise<SleepSession[]> {
    const m = await hk();
    const samples = await m.queryCategorySamples(SLEEP, {
      limit: 0,
      ascending: true,
      ...dateFilter(range),
    });
    // Group samples into sessions: a gap of more than 2 h starts a new night.
    const sessions: SleepSession[] = [];
    let current: { start: Date; end: Date; stages: SleepSession['stages'][number][] } | null = null;
    for (const s of samples) {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      if (!current || start.getTime() - current.end.getTime() > 2 * 3_600_000) {
        if (current) sessions.push(current);
        current = { start, end, stages: [] };
      }
      if (end > current.end) current.end = end;
      const stage = SLEEP_VALUE[Number(s.value)];
      if (stage) current.stages.push({ stage, start, end });
    }
    if (current) sessions.push(current);
    return sessions;
  },

  async readHeartRate(range): Promise<HeartRateData> {
    const m = await hk();
    const [samples, resting] = await Promise.all([
      m.queryQuantitySamples(HEART, {
        limit: 0,
        ascending: true,
        unit: 'count/min',
        ...dateFilter(range),
      }),
      m.queryQuantitySamples(RESTING, {
        limit: 0,
        ascending: true,
        unit: 'count/min',
        ...dateFilter(range),
      }),
    ]);
    return {
      samples: samples.map((s) => ({ at: new Date(s.startDate), bpm: s.quantity })),
      resting: resting.map((s) => ({ day: toDateKey(new Date(s.startDate)), bpm: s.quantity })),
    };
  },

  async readWorkouts(range): Promise<HealthWorkout[]> {
    const m = await hk();
    const workouts = await m.queryWorkoutSamples({
      limit: 0,
      ascending: true,
      ...dateFilter(range),
    });
    return workouts.flatMap((w) => {
      const type = Number(w.workoutActivityType);
      if (w.sourceRevision.source.bundleIdentifier === env.appId || NOT_A_WORKOUT.has(type)) {
        return [];
      }
      return [
        {
          id: w.uuid,
          kind: ACTIVITY_KIND[type] ?? 'functional',
          start: new Date(w.startDate),
          end: new Date(w.endDate),
          distanceM: w.totalDistance?.quantity || null,
          avgHeartRate: null,
        },
      ];
    });
  },

  async readBody(range): Promise<BodyReading[]> {
    const m = await hk();
    const options = { limit: 0, ascending: true, ...dateFilter(range) };
    const [weight, waist] = await Promise.all([
      m.queryQuantitySamples(BODY_MASS, { ...options, unit: 'kg' }),
      m.queryQuantitySamples(WAIST, { ...options, unit: 'cm' }),
    ]);
    return [
      ...weight.map((s) => ({ at: new Date(s.startDate), weightKg: s.quantity })),
      ...waist.map((s) => ({ at: new Date(s.startDate), waistCm: s.quantity })),
    ];
  },

  async saveWeight(at, weightKg) {
    try {
      const m = await hk();
      await m.saveQuantitySample(BODY_MASS, 'kg', weightKg, at, at);
      return true;
    } catch {
      return false;
    }
  },

  async saveWorkout(w: WorkoutToSave) {
    try {
      const m = await hk();
      await m.saveWorkoutSample(
        ACTIVITY[w.kind] as never,
        [],
        w.start,
        w.end,
        {
          ...(w.distanceM != null ? { distance: w.distanceM } : {}),
          ...(w.energyKcal != null ? { energyBurned: w.energyKcal } : {}),
        },
        w.title ? { HKWorkoutBrandName: w.title } : undefined,
      );
      return true;
    } catch {
      return false;
    }
  },
};
