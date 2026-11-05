/**
 * Google Health API (https://health.googleapis.com/v4): reads a user's data with their OAuth token
 * and shapes it like the on-device Health stores, so it syncs to `health_days` the same way.
 * It holds no credentials: the app owns the OAuth flow and hands over `getToken`.
 */
import { ApiError } from '../errors';

const BASE = 'https://health.googleapis.com/v4/users/me';
const SCOPE = 'https://www.googleapis.com/auth/googlehealth';

/** Read-only, and only what the Health screens show. */
export const SCOPES = [
  `${SCOPE}.activity_and_fitness.readonly`,
  `${SCOPE}.health_metrics_and_measurements.readonly`,
  `${SCOPE}.sleep.readonly`,
] as const;

/** Longest range a single rollup accepts for heart-rate, active-minutes and total-calories. */
const MAX_RANGE_DAYS = 14;
const HOUR_WINDOW = '3600s';

export type GoogleHealthContext = {
  /** A valid access token; `forceRefresh` after the API rejected the previous one. */
  getToken: (forceRefresh?: boolean) => Promise<string>;
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

const STAGES: Record<string, SleepStage> = {
  AWAKE: 'awake',
  RESTLESS: 'awake',
  LIGHT: 'light',
  ASLEEP: 'light',
  DEEP: 'deep',
  REM: 'rem',
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
