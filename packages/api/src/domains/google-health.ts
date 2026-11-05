/**
 * Google Health API (https://health.googleapis.com/v4): reads a user's data with their OAuth token
 * and shapes it like the on-device Health stores, so it syncs to `health_days` the same way.
 * It holds no credentials: the app owns the OAuth flow and hands over `getToken`.
 */
import { ApiError } from '../errors';

import type { ActivityKind } from './activities';

const BASE = 'https://health.googleapis.com/v4/users/me';
const SCOPE = 'https://www.googleapis.com/auth/googlehealth';

/** What the Health screens show, plus writing back the workouts and weight logged in Tracta. */
export const SCOPES = [
  `${SCOPE}.activity_and_fitness.readonly`,
  `${SCOPE}.activity_and_fitness.writeonly`,
  `${SCOPE}.health_metrics_and_measurements.readonly`,
  `${SCOPE}.health_metrics_and_measurements.writeonly`,
  `${SCOPE}.sleep.readonly`,
] as const;

/** Longest range a single rollup accepts for heart-rate, active-minutes and total-calories. */
const MAX_RANGE_DAYS = 14;
const HOUR_WINDOW = '3600s';

export type GoogleHealthContext = {
  /** A valid access token; `forceRefresh` after the API rejected the previous one. */
  getToken: (forceRefresh?: boolean) => Promise<string>;
  /** This app's OAuth client: what it wrote to Google must not come back as an import. */
  clientId?: string | undefined;
  fetch?: typeof fetch;
};

/** Half-open local-time range [from, to), starting on a local midnight. */
export type Range = { from: Date; to: Date };

export type DayActivity = {
  day: string;
  steps: number | null;
  distanceM: number | null;
  activeKcal: number | null;
  restKcal: number | null;
  activeMinutes: number | null;
  intenseMinutes: number | null;
  stepsHourly: number[] | null;
};

export type SleepStage = 'awake' | 'rem' | 'light' | 'deep';
export type SleepSession = {
  start: Date;
  end: Date;
  stages: { stage: SleepStage; start: Date; end: Date }[];
};
export type HeartRateData = {
  samples: { at: Date; bpm: number }[];
  resting: { day: string; bpm: number }[];
};
export type WorkoutKind = ActivityKind | 'strength';
export type Workout = {
  id: string;
  kind: WorkoutKind;
  start: Date;
  end: Date;
  distanceM: number | null;
  avgHeartRate: number | null;
};
export type WeightReading = { at: Date; weightKg: number };
export type WorkoutToWrite = { kind: WorkoutKind; start: Date; end: Date; distanceM?: number };

type CivilDate = { year: number; month: number; day: number };
type DailyPoint = {
  civilStartTime: { date: CivilDate };
  distance?: { millimetersSum?: string };
  activeEnergyBurned?: { kcalSum?: number };
  totalCalories?: { kcalSum?: number };
  activeMinutes?: {
    activeMinutesRollupByActivityLevel?: { activityLevel?: string; activeMinutesSum?: string }[];
  };
};
type HourPoint = {
  startTime: string;
  steps?: { countSum?: string };
  heartRate?: { beatsPerMinuteAvg?: number };
};
type RollupPage<T> = { rollupDataPoints?: T[]; nextPageToken?: string };
type SleepPoint = {
  sleep?: {
    interval: { startTime: string; endTime: string };
    stages?: { type: string; startTime: string; endTime: string }[];
  };
};
type RestingPoint = { dailyRestingHeartRate?: { date: CivilDate; beatsPerMinute: string } };
type ListPage<T> = { dataPoints?: T[]; nextPageToken?: string };
type PointSource = { dataSource?: { application?: { googleWebClientId?: string } } };
type ExercisePoint = PointSource & {
  name?: string;
  exercise?: {
    interval: { startTime: string; endTime: string };
    exerciseType?: string;
    metricsSummary?: { distanceMillimeters?: number; averageHeartRateBeatsPerMinute?: string };
  };
};
type WeightPoint = PointSource & {
  weight?: { sampleTime: { physicalTime: string }; weightGrams: number };
};

const STAGES: Record<string, SleepStage> = {
  AWAKE: 'awake',
  RESTLESS: 'awake',
  LIGHT: 'light',
  ASLEEP: 'light',
  DEEP: 'deep',
  REM: 'rem',
};

/** Google's exercise types that map to something else than a generic workout ('functional'). */
const EXERCISE_KINDS: Record<string, WorkoutKind> = {
  ...Object.fromEntries(
    ['RUNNING', 'TRAIL_RUN', 'TREADMILL', 'INCLINE_RUN', 'TRACK_AND_FIELD'].map((t) => [t, 'run']),
  ),
  ...Object.fromEntries(
    [
      'WALKING',
      'HIKING',
      'INCLINE_WALK',
      'NORDIC_WALKING',
      'POWER_WALKING',
      'RUCKING',
      'STROLLER_WALK',
      'TREADMILL_WALK',
      'WALK_WITH_WEIGHTS',
    ].map((t) => [t, 'walk']),
  ),
  ...Object.fromEntries(
    [
      'BIKING',
      'OUTDOOR_BIKE',
      'MOUNTAIN_BIKE',
      'STATIONARY_BIKE',
      'SPINNING',
      'ASSAULT_BIKE',
      'ELECTRIC_BIKE',
      'HAND_CYCLING',
    ].map((t) => [t, 'bike']),
  ),
  ...Object.fromEntries(
    ['SWIMMING', 'SWIMMING_OPEN_WATER', 'SWIMMING_POOL'].map((t) => [t, 'swim']),
  ),
  ...Object.fromEntries(
    ['YOGA', 'YOGA_BIKRAM', 'YOGA_HATHA', 'YOGA_POWER', 'YOGA_VINYASA'].map((t) => [t, 'yoga']),
  ),
  ...Object.fromEntries(
    [
      'STRENGTH_TRAINING',
      'WEIGHTLIFTING',
      'WEIGHTS',
      'FREE_WEIGHTS',
      'WEIGHT_MACHINES',
      'POWERLIFTING',
      'RESISTANCE_BANDS',
      'BODY_WEIGHT',
      'CALISTHENICS',
    ].map((t) => [t, 'strength']),
  ),
  SOCCER: 'soccer',
  BASKETBALL: 'basket',
  TENNIS: 'tennis',
  STRETCHING: 'stretch',
};
/** Logged in Google Health, but not training. */
const NOT_A_WORKOUT: ReadonlySet<string> = new Set([
  'BILLIARDS',
  'CARPENTRY',
  'CLEANING',
  'ELECTRIC_SCOOTER',
  'FISHING',
  'GARDENING',
  'HOEING',
  'HOUSEHOLD_CHORES',
  'MEDITATE',
  'MOTORCYCLE',
  'MOWING_LAWN',
  'MUSICAL_PERFORMANCE',
  'PAINTING',
  'SHOVELING',
  'SNOWMOBILING',
  'WEEDING',
]);
/** Written back: one type per kind, the one Google's app shows for it. */
const EXERCISE_TYPES: Record<WorkoutKind, string> = {
  run: 'RUNNING',
  walk: 'WALKING',
  bike: 'BIKING',
  swim: 'SWIMMING',
  soccer: 'SOCCER',
  basket: 'BASKETBALL',
  tennis: 'TENNIS',
  functional: 'FUNCTIONAL_STRENGTH_TRAINING',
  stretch: 'STRETCHING',
  yoga: 'YOGA',
  strength: 'STRENGTH_TRAINING',
};

const pad = (n: number) => String(n).padStart(2, '0');
const civilKey = (d: CivilDate) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
const localKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toCivil = (d: Date): CivilDate => ({
  year: d.getFullYear(),
  month: d.getMonth() + 1,
  day: d.getDate(),
});

function errorFor(status: number, detail: string): ApiError {
  if (status === 401) return new ApiError('not_authenticated', detail);
  if (status === 403) return new ApiError('forbidden', detail);
  if (status === 404) return new ApiError('not_found', detail);
  if (status === 429) return new ApiError('rate_limited', detail);
  return new ApiError('unknown', detail);
}

async function send(ctx: GoogleHealthContext, path: string, body?: unknown, retry = true) {
  const token = await ctx.getToken(!retry);
  let response: Response;
  try {
    response = await (ctx.fetch ?? fetch)(`${BASE}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (cause) {
    throw new ApiError('network', 'Network request failed', cause);
  }
  // Access tokens last an hour and can be revoked at any time: refresh once before giving up.
  if (response.status === 401 && retry) return send(ctx, path, body, false);
  if (!response.ok) throw errorFor(response.status, `Google Health API ${response.status}`);
  return response.json() as Promise<unknown>;
}

/** Follows `nextPageToken` until the API has nothing else. */
async function allPages<T>(
  fetchPage: (pageToken?: string) => Promise<{ items?: T[]; nextPageToken?: string }>,
): Promise<T[]> {
  const items: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await fetchPage(pageToken);
    items.push(...(page.items ?? []));
    pageToken = page.nextPageToken || undefined;
  } while (pageToken);
  return items;
}

/** Splits a range in whole-day chunks the rollups accept. */
function chunks({ from, to }: Range): Range[] {
  const out: Range[] = [];
  for (let start = from; start < to;) {
    const end = new Date(start);
    end.setDate(end.getDate() + MAX_RANGE_DAYS);
    const chunkEnd = end < to ? end : to;
    out.push({ from: start, to: chunkEnd });
    start = chunkEnd;
  }
  return out;
}

async function dailyRollUp(ctx: GoogleHealthContext, dataType: string, range: Range) {
  const out: DailyPoint[] = [];
  for (const chunk of chunks(range)) {
    out.push(
      ...(await allPages<DailyPoint>(async (pageToken) => {
        const page = (await send(ctx, `/dataTypes/${dataType}/dataPoints:dailyRollUp`, {
          range: { start: { date: toCivil(chunk.from) }, end: { date: toCivil(chunk.to) } },
          windowSizeDays: 1,
          ...(pageToken ? { pageToken } : {}),
        })) as RollupPage<DailyPoint>;
        return {
          items: page.rollupDataPoints ?? [],
          ...(page.nextPageToken ? { nextPageToken: page.nextPageToken } : {}),
        };
      })),
    );
  }
  return out;
}

async function hourlyRollUp(ctx: GoogleHealthContext, dataType: string, range: Range) {
  const out: HourPoint[] = [];
  for (const chunk of chunks(range)) {
    out.push(
      ...(await allPages<HourPoint>(async (pageToken) => {
        const page = (await send(ctx, `/dataTypes/${dataType}/dataPoints:rollUp`, {
          range: { startTime: chunk.from.toISOString(), endTime: chunk.to.toISOString() },
          windowSize: HOUR_WINDOW,
          ...(pageToken ? { pageToken } : {}),
        })) as RollupPage<HourPoint>;
        return {
          items: page.rollupDataPoints ?? [],
          ...(page.nextPageToken ? { nextPageToken: page.nextPageToken } : {}),
        };
      })),
    );
  }
  return out;
}

function list<T>(ctx: GoogleHealthContext, dataType: string, filter: string): Promise<T[]> {
  return allPages<T>(async (pageToken) => {
    const params = `filter=${encodeURIComponent(filter)}${
      pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
    }`;
    const page = (await send(ctx, `/dataTypes/${dataType}/dataPoints?${params}`)) as ListPage<T>;
    return {
      items: page.dataPoints ?? [],
      ...(page.nextPageToken ? { nextPageToken: page.nextPageToken } : {}),
    };
  });
}

/** The user may grant only some scopes: what they didn't grant reads as no data. */
async function ifGranted<T>(read: Promise<T[]>): Promise<T[]> {
  try {
    return await read;
  } catch (error) {
    if (error instanceof ApiError && error.code === 'forbidden') return [];
    throw error;
  }
}

/**
 * Confirms the account has a Google Health profile, which the API needs before it has anything to
 * return. Rejects with `forbidden` / `not_found` when it doesn't.
 */
export async function getIdentity(ctx: GoogleHealthContext): Promise<{ healthUserId: string }> {
  return (await send(ctx, '/identity')) as { healthUserId: string };
}

export async function readDayActivity(
  ctx: GoogleHealthContext,
  range: Range,
): Promise<DayActivity[]> {
  const [steps, distance, active, total, minutes] = await Promise.all([
    ifGranted(hourlyRollUp(ctx, 'steps', range)),
    ifGranted(dailyRollUp(ctx, 'distance', range)),
    ifGranted(dailyRollUp(ctx, 'active-energy-burned', range)),
    ifGranted(dailyRollUp(ctx, 'total-calories', range)),
    ifGranted(dailyRollUp(ctx, 'active-minutes', range)),
  ]);

  const days = new Map<string, DayActivity>();
  const entry = (day: string) => {
    let e = days.get(day);
    if (!e) {
      e = {
        day,
        steps: null,
        distanceM: null,
        activeKcal: null,
        restKcal: null,
        activeMinutes: null,
        intenseMinutes: null,
        stepsHourly: null,
      };
      days.set(day, e);
    }
    return e;
  };

  for (const p of steps) {
    if (p.steps?.countSum == null) continue;
    const at = new Date(p.startTime);
    const e = entry(localKey(at));
    const count = Number(p.steps.countSum);
    e.steps = (e.steps ?? 0) + count;
    e.stepsHourly ??= Array<number>(24).fill(0);
    e.stepsHourly[at.getHours()]! += count;
  }
  for (const p of distance) {
    if (p.distance?.millimetersSum == null) continue;
    entry(civilKey(p.civilStartTime.date)).distanceM = Number(p.distance.millimetersSum) / 1000;
  }
  for (const p of active) {
    if (p.activeEnergyBurned?.kcalSum == null) continue;
    entry(civilKey(p.civilStartTime.date)).activeKcal = p.activeEnergyBurned.kcalSum;
  }
  for (const p of total) {
    const kcal = p.totalCalories?.kcalSum;
    if (kcal == null) continue;
    const e = entry(civilKey(p.civilStartTime.date));
    if (e.activeKcal != null) e.restKcal = Math.max(0, kcal - e.activeKcal);
  }
  for (const p of minutes) {
    const levels = p.activeMinutes?.activeMinutesRollupByActivityLevel;
    if (!levels) continue;
    const e = entry(civilKey(p.civilStartTime.date));
    e.activeMinutes = levels.reduce((sum, l) => sum + Number(l.activeMinutesSum ?? 0), 0);
    e.intenseMinutes = levels
      .filter((l) => l.activityLevel === 'VIGOROUS')
      .reduce((sum, l) => sum + Number(l.activeMinutesSum ?? 0), 0);
  }
  return [...days.values()];
}

export async function readSleepSessions(
  ctx: GoogleHealthContext,
  { from, to }: Range,
): Promise<SleepSession[]> {
  const filter = `sleep.interval.end_time >= "${from.toISOString()}" AND sleep.interval.end_time < "${to.toISOString()}"`;
  const points = await ifGranted(list<SleepPoint>(ctx, 'sleep', filter));
  return points.flatMap(({ sleep }) =>
    sleep
      ? [
          {
            start: new Date(sleep.interval.startTime),
            end: new Date(sleep.interval.endTime),
            stages: (sleep.stages ?? [])
              .map((s) => ({
                stage: STAGES[s.type],
                start: new Date(s.startTime),
                end: new Date(s.endTime),
              }))
              .filter((s): s is SleepSession['stages'][number] => s.stage !== undefined)
              .sort((a, b) => a.start.getTime() - b.start.getTime()),
          },
        ]
      : [],
  );
}

/**
 * Hourly averages rather than raw samples: a wearable records far too many samples to page through
 * on every sync, and the app only keeps hourly values.
 */
export async function readHeartRate(
  ctx: GoogleHealthContext,
  range: Range,
): Promise<HeartRateData> {
  const filter = `daily_resting_heart_rate.date >= "${localKey(range.from)}" AND daily_resting_heart_rate.date < "${localKey(range.to)}"`;
  const [hours, resting] = await Promise.all([
    ifGranted(hourlyRollUp(ctx, 'heart-rate', range)),
    ifGranted(list<RestingPoint>(ctx, 'daily-resting-heart-rate', filter)),
  ]);
  return {
    samples: hours.flatMap((p) =>
      p.heartRate?.beatsPerMinuteAvg == null
        ? []
        : [{ at: new Date(p.startTime), bpm: p.heartRate.beatsPerMinuteAvg }],
    ),
    resting: resting.flatMap(({ dailyRestingHeartRate: r }) =>
      r ? [{ day: civilKey(r.date), bpm: Number(r.beatsPerMinute) }] : [],
    ),
  };
}

const isOwnWrite = (ctx: GoogleHealthContext, point: PointSource) =>
  Boolean(ctx.clientId) && point.dataSource?.application?.googleWebClientId === ctx.clientId;

/** Workouts that started in the range, without the ones this app wrote and the non-training ones. */
export async function readWorkouts(ctx: GoogleHealthContext, range: Range): Promise<Workout[]> {
  const filter = `exercise.interval.civil_start_time >= "${localKey(range.from)}" AND exercise.interval.civil_start_time < "${localKey(range.to)}"`;
  const points = await ifGranted(list<ExercisePoint>(ctx, 'exercise', filter));
  return points.flatMap((point) => {
    const e = point.exercise;
    const type = e?.exerciseType ?? 'OTHER';
    if (!e || !point.name || isOwnWrite(ctx, point) || NOT_A_WORKOUT.has(type)) return [];
    const millimeters = e.metricsSummary?.distanceMillimeters;
    const heart = e.metricsSummary?.averageHeartRateBeatsPerMinute;
    return [
      {
        id: point.name.split('/').pop() ?? point.name,
        kind: EXERCISE_KINDS[type] ?? 'functional',
        start: new Date(e.interval.startTime),
        end: new Date(e.interval.endTime),
        distanceM: millimeters ? millimeters / 1000 : null,
        avgHeartRate: heart ? Number(heart) : null,
      },
    ];
  });
}

/** Weigh-ins in the range, without the ones this app wrote. */
export async function readWeight(ctx: GoogleHealthContext, range: Range): Promise<WeightReading[]> {
  const filter = `weight.sample_time.physical_time >= "${range.from.toISOString()}" AND weight.sample_time.physical_time < "${range.to.toISOString()}"`;
  const points = await ifGranted(list<WeightPoint>(ctx, 'weight', filter));
  return points.flatMap((point) =>
    point.weight && !isOwnWrite(ctx, point)
      ? [
          {
            at: new Date(point.weight.sampleTime.physicalTime),
            weightKg: point.weight.weightGrams / 1000,
          },
        ]
      : [],
  );
}

/** Google wants the offset as a duration in seconds ("-10800s"). */
const utcOffset = (d: Date) => `${-d.getTimezoneOffset() * 60}s`;

/** False when Google accepted the request but reports the write as failed. */
function operationSucceeded(operation: unknown): boolean {
  return !(operation as { error?: unknown } | null)?.error;
}

export async function writeWorkout(ctx: GoogleHealthContext, w: WorkoutToWrite): Promise<boolean> {
  const operation = await send(ctx, '/dataTypes/exercise/dataPoints', {
    exercise: {
      interval: {
        startTime: w.start.toISOString(),
        startUtcOffset: utcOffset(w.start),
        endTime: w.end.toISOString(),
        endUtcOffset: utcOffset(w.end),
      },
      exerciseType: EXERCISE_TYPES[w.kind],
      displayName: 'Tracta',
      metricsSummary: w.distanceM ? { distanceMillimeters: w.distanceM * 1000 } : {},
    },
  });
  return operationSucceeded(operation);
}

export async function writeWeight(
  ctx: GoogleHealthContext,
  at: Date,
  weightKg: number,
): Promise<boolean> {
  const operation = await send(ctx, '/dataTypes/weight/dataPoints', {
    weight: {
      sampleTime: { physicalTime: at.toISOString(), utcOffset: utcOffset(at) },
      weightGrams: Math.round(weightKg * 1000),
    },
  });
  return operationSucceeded(operation);
}
