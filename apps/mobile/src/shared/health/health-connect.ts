import { toDateKey } from '@/shared/clock';

import type {
  DayActivity,
  HealthPermissions,
  HealthRange,
  HealthSource,
  HeartRateData,
  SleepSession,
  SleepStage,
  WorkoutToSave,
} from './types';
import type * as HealthConnectModule from 'react-native-health-connect';

type HealthConnect = typeof HealthConnectModule;
type Permission = HealthConnectModule.Permission;
type RecordType = HealthConnectModule.RecordType;

/** SdkAvailabilityStatus.SDK_AVAILABLE */
const SDK_AVAILABLE = 3;
const STEPS_PER_MOVING_MINUTE = 100;
// ExerciseType values.
const EXERCISE = { run: 56, walk: 79, strength: 70, other: 0 } as const;
// SleepStageType values.
const STAGE: Record<number, SleepStage | null> = {
  0: 'light', // unknown
  1: 'awake',
  2: 'light', // sleeping
  3: 'awake', // out of bed
  4: 'light',
  5: 'deep',
  6: 'rem',
};

let module: Promise<HealthConnect | null> | null = null;

/** Loads and initializes Health Connect lazily; null when the provider app is missing. */
function load(): Promise<HealthConnect | null> {
  module ??= import('react-native-health-connect')
    .then(async (m) => {
      if ((await m.getSdkStatus()) !== SDK_AVAILABLE) return null;
      return (await m.initialize()) ? m : null;
    })
    .catch(() => null);
  return module;
}

async function hc(): Promise<HealthConnect> {
  const m = await load();
  if (!m) throw new Error('Health Connect is not available');
  return m;
}

const READ: Record<HealthPermissions['read'][number], RecordType[]> = {
  steps: ['Steps'],
  distance: ['Distance'],
  active: ['ActiveCaloriesBurned', 'ExerciseSession'],
  resting: ['RestingHeartRate'],
  heart: ['HeartRate'],
  sleep: ['SleepSession'],
  workouts: ['ExerciseSession'],
};
const WRITE: Record<HealthPermissions['write'][number], RecordType[]> = {
  workouts: ['ExerciseSession'],
  distance: ['Distance'],
};

const between = (r: HealthRange) => ({
  operator: 'between' as const,
  startTime: r.from.toISOString(),
  endTime: r.to.toISOString(),
});

/** All pages of one record type. */
async function readAll<T extends RecordType>(m: HealthConnect, type: T, range: HealthRange) {
  const out: Awaited<ReturnType<typeof m.readRecords<T>>>['records'] = [];
  let pageToken: string | undefined;
  do {
    const page = await m.readRecords(type, {
      timeRangeFilter: between(range),
      ascendingOrder: true,
      ...(pageToken ? { pageToken } : {}),
    });
    out.push(...page.records);
    pageToken = page.pageToken || undefined;
  } while (pageToken);
  return out;
}

export const healthConnectSource: HealthSource = {
  kind: 'health_connect',
  isFake: false,

  isAvailable: async () => (await load()) != null,

  async requestPermissions({ read, write }: HealthPermissions) {
    try {
      const m = await hc();
      const wanted: Permission[] = [
        ...Array.from(new Set(read.flatMap((t) => READ[t])), (recordType) => ({
          accessType: 'read' as const,
          recordType,
        })),
        ...Array.from(new Set(write.flatMap((t) => WRITE[t])), (recordType) => ({
          accessType: 'write' as const,
          recordType,
        })),
      ];
      const granted = await m.requestPermission(wanted);
      return granted.some((p) => p.accessType === 'read');
    } catch {
      return false;
    }
  },

  async readDayActivity(range): Promise<DayActivity[]> {
    const m = await hc();
    const days: DayActivity[] = [];
    for (let d = new Date(range.from); d < range.to; d.setDate(d.getDate() + 1)) {
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      const r = { from: new Date(d), to: end < range.to ? end : range.to };
      const [steps, distance, active, exercise, hourly] = await Promise.all([
        m.aggregateRecord({ recordType: 'Steps', timeRangeFilter: between(r) }),
        m.aggregateRecord({ recordType: 'Distance', timeRangeFilter: between(r) }),
        m.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter: between(r) }),
        m.aggregateRecord({ recordType: 'ExerciseSession', timeRangeFilter: between(r) }),
        m.aggregateGroupByDuration({
          recordType: 'Steps',
          timeRangeFilter: between(r),
          timeRangeSlicer: { duration: 'HOURS', length: 1 },
        }),
      ]);
      const stepsHourly = Array<number>(24).fill(0);
      for (const h of hourly) stepsHourly[new Date(h.startTime).getHours()] = h.result.COUNT_TOTAL;
      const count = steps.COUNT_TOTAL;
      days.push({
        day: toDateKey(r.from),
        steps: count,
        distanceM: distance.DISTANCE.inMeters,
        activeKcal: active.ACTIVE_CALORIES_TOTAL.inKilocalories,
        restKcal: null,
        activeMinutes: Math.round(count / STEPS_PER_MOVING_MINUTE),
        intenseMinutes: Math.round(exercise.EXERCISE_DURATION_TOTAL.inSeconds / 60),
        stepsHourly,
      });
    }
    return days;
  },

  async readSleepSessions(range): Promise<SleepSession[]> {
    const m = await hc();
    const records = await readAll(m, 'SleepSession', range);
    return records.map((r) => ({
      start: new Date(r.startTime),
      end: new Date(r.endTime),
      stages: (r.stages ?? []).flatMap((s) => {
        const stage = STAGE[s.stage];
        return stage ? [{ stage, start: new Date(s.startTime), end: new Date(s.endTime) }] : [];
      }),
    }));
  },

  async readHeartRate(range): Promise<HeartRateData> {
    const m = await hc();
    const [heart, resting] = await Promise.all([
      readAll(m, 'HeartRate', range),
      readAll(m, 'RestingHeartRate', range),
    ]);
    return {
      samples: heart.flatMap((r) =>
        r.samples.map((s) => ({ at: new Date(s.time), bpm: s.beatsPerMinute })),
      ),
      resting: resting.map((r) => ({ day: toDateKey(new Date(r.time)), bpm: r.beatsPerMinute })),
    };
  },

  async saveWorkout(w: WorkoutToSave) {
    try {
      const m = await hc();
      const startTime = w.start.toISOString();
      const endTime = w.end.toISOString();
      await m.insertRecords([
        {
          recordType: 'ExerciseSession',
          exerciseType: EXERCISE[w.kind],
          startTime,
          endTime,
          ...(w.title ? { title: w.title } : {}),
        },
      ]);
      if (w.distanceM != null && w.distanceM > 0) {
        await m.insertRecords([
          {
            recordType: 'Distance',
            startTime,
            endTime,
            distance: { unit: 'meters', value: w.distanceM },
          },
        ]);
      }
      return true;
    } catch {
      return false;
    }
  },
};
