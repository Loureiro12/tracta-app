import { SLEEP_FACTOR_KEYS, SLEEP_FACTOR_MAX } from '../model/health.constants';

import type { SleepFactorKey } from '../model/health.constants';
import type { MetricKey, MetricPeriod, SleepStage, WeekdayKey } from '../model/health.types';
import type { health, history } from '@tracta/api';

type HealthDay = health.HealthDay;
type Entry = history.HistoryEntry;

/** Goals the Health screens compare against (Perfil › Metas). */
export type HealthGoals = { steps: number; sleepMinutes: number; workouts: number };

// ---------------------------------------------------------------------------
// Calendar helpers (local days as YYYY-MM-DD)
// ---------------------------------------------------------------------------

const WEEKDAYS: readonly WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function dateKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function addDays(key: string, delta: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

export function weekdayOf(key: string): WeekdayKey {
  return WEEKDAYS[keyToDate(key).getDay()]!;
}

/** `n` day keys ending at `endKey` (oldest first). */
export function dayKeys(endKey: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(endKey, i - (n - 1)));
}

export type DayLookup = (key: string) => HealthDay | null;

export function lookup(days: readonly HealthDay[] | undefined): DayLookup {
  const map = new Map((days ?? []).map((d) => [d.day, d]));
  return (key) => map.get(key) ?? null;
}

const nn = (v: readonly (number | null | undefined)[]) =>
  v.filter((x): x is number => x != null && Number.isFinite(x));
const sum = (v: readonly number[]) => v.reduce((a, b) => a + b, 0);
const avg = (v: readonly number[]) => (v.length ? sum(v) / v.length : null);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Mean absolute deviation (null with fewer than two values). */
function mad(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const m = sum(values) / values.length;
  return sum(values.map((v) => Math.abs(v - m))) / values.length;
}

/** Minutes from local midnight, folded into (-720, 720] so 23:48 → -12 and 00:08 → 8. */
export function clockMinutes(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const m = d.getHours() * 60 + d.getMinutes();
  return m > 720 ? m - 1440 : m;
}

/** -19 → "23:41". */
export function formatClock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Local "HH:MM" of an ISO instant. */
export function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export type ScoreFactor = {
  key: SleepFactorKey;
  pts: number;
  max: number;
  pct: number;
};

export type SleepScore = {
  total: number;
  factors: ScoreFactor[];
  /** Inputs shown next to each factor. */
  slept: number;
  regularityMin: number;
  wakeups: number;
  awakeMinutes: number;
  nights: number;
};

/**
 * Sleep score (0–100) from data the band provides:
 *  duration (40) loses 1 pt per 7 min below the goal; regularity (30) 1 pt per 6 min of bedtime
 *  deviation over the last 7 nights; interruptions (20) 1 pt per 5 min awake; consistency (10)
 *  1 pt per 15 min of deviation in the duration of the last 7 nights.
 */
export function sleepScore(
  get: DayLookup,
  todayKey: string,
  goalMinutes: number,
): SleepScore | null {
  const night = get(todayKey);
  const slept = night?.sleepMinutes;
  if (night == null || slept == null) return null;
  const week = dayKeys(todayKey, 7)
    .map(get)
    .filter((d): d is HealthDay => d?.sleepMinutes != null);
  const regularityMin = Math.round(mad(nn(week.map((d) => clockMinutes(d.bedtime)))) ?? 0);
  const durationMad = mad(nn(week.map((d) => d.sleepMinutes))) ?? 0;
  const awake = night.awakeMinutes ?? 0;
  const pts: Record<SleepFactorKey, number> = {
    duration: 40 - Math.round(Math.max(0, goalMinutes - slept) / 7),
    regularity: 30 - Math.round(regularityMin / 6),
    interruptions: 20 - Math.round(awake / 5),
    consistency: 10 - Math.round(durationMad / 15),
  };
  const factors = SLEEP_FACTOR_KEYS.map((key) => {
    const max = SLEEP_FACTOR_MAX[key];
    const p = clamp(pts[key], 0, max);
    return { key, pts: p, max, pct: Math.round((p / max) * 100) };
  });
  return {
    total: sum(factors.map((f) => f.pts)),
    factors,
    slept,
    regularityMin,
    wakeups: night.wakeups ?? 0,
    awakeMinutes: awake,
    nights: week.length,
  };
}

/** Minutes per stage of one night. */
export function stageTotals(night: HealthDay | null): Record<SleepStage, number> {
  const tot: Record<SleepStage, number> = { awake: 0, rem: 0, light: 0, deep: 0 };
  for (const [stage, min] of night?.sleepStages ?? []) tot[stage] += min;
  return tot;
}

/** Hypnogram axis: bedtime, two full hours in between, wake-up ("23:48", "02h", "04h", "07:00"). */
export function sleepAxis(night: HealthDay | null): string[] {
  if (!night?.bedtime || !night.wakeTime) return [];
  const a = new Date(night.bedtime).getTime();
  const b = new Date(night.wakeTime).getTime();
  const hour = (t: number) => `${String(new Date(t).getHours()).padStart(2, '0')}h`;
  return [
    timeOf(night.bedtime),
    hour(a + (b - a) / 3),
    hour(a + ((b - a) * 2) / 3),
    timeOf(night.wakeTime),
  ];
}

/** "Oct 25 → 26" for the night ending on `key`. */
export function nightRange(
  key: string,
  format: (d: Date, o: Intl.DateTimeFormatOptions) => string,
) {
  const end = keyToDate(key);
  const start = keyToDate(addDays(key, -1));
  return `${format(start, { day: 'numeric', month: 'short' })} → ${format(end, { day: 'numeric' })}`;
}

export type WeekStats = {
  avg: number | null;
  bedtime: number | null;
  regularity: number | null;
  onGoal: number;
  nights: number;
  wakeups: number | null;
};

/** Sleep of the 7 nights ending at `endKey`. */
export function sleepWeek(get: DayLookup, endKey: string, goalMinutes: number): WeekStats {
  const nights = dayKeys(endKey, 7)
    .map(get)
    .filter((d): d is HealthDay => d?.sleepMinutes != null);
  const minutes = nn(nights.map((d) => d.sleepMinutes));
  const beds = nn(nights.map((d) => clockMinutes(d.bedtime)));
  const a = avg(minutes);
  const b = avg(beds);
  const r = mad(beds);
  const w = avg(nn(nights.map((d) => d.wakeups)));
  return {
    avg: a == null ? null : Math.round(a),
    bedtime: b == null ? null : Math.round(b),
    regularity: r == null ? null : Math.round(r),
    onGoal: minutes.filter((m) => m >= goalMinutes).length,
    nights: nights.length,
    wakeups: w == null ? null : Math.round(w * 10) / 10,
  };
}

export function sleepMonth(get: DayLookup, todayKey: string, goalMinutes: number) {
  const minutes = nn(dayKeys(todayKey, 30).map((k) => get(k)?.sleepMinutes));
  const a = avg(minutes);
  return {
    avg: a == null ? null : Math.round(a),
    hit: minutes.filter((m) => m >= goalMinutes).length,
    total: minutes.length,
    longest: minutes.length ? Math.max(...minutes) : null,
    shortest: minutes.length ? Math.min(...minutes) : null,
  };
}

/**
 * "On the N nights you went to bed before HH:MM you slept X min longer": nights of the last 30
 * days split at the average bedtime.
 */
export function bedtimeSuggestion(get: DayLookup, todayKey: string) {
  const pairs = dayKeys(todayKey, 30)
    .map(get)
    .flatMap((d) => {
      const bed = clockMinutes(d?.bedtime ?? null);
      return d?.sleepMinutes != null && bed != null ? [{ bed, slept: d.sleepMinutes }] : [];
    });
  const mean = avg(pairs.map((p) => p.bed));
  if (mean == null || pairs.length < 4) return null;
  const cut = Math.round(mean / 15) * 15;
  const early = pairs.filter((p) => p.bed < cut);
  const late = pairs.filter((p) => p.bed >= cut);
  const a = avg(early.map((p) => p.slept));
  const b = avg(late.map((p) => p.slept));
  if (a == null || b == null) return null;
  return { count: early.length, cut, diff: Math.round(a - b) };
}

/** Training vs rest days of the last 30 days. */
export function trainVsRest(get: DayLookup, todayKey: string, entries: readonly Entry[]) {
  const trained = new Set(entries.map((e) => dateKey(new Date(e.startedAt))));
  const keys = dayKeys(todayKey, 30);
  const group = (isTrain: boolean) => {
    const ks = keys.filter((k) => trained.has(k) === isTrain);
    const next = (k: string) => (k < todayKey ? get(addDays(k, 1)) : null);
    return {
      days: ks.length,
      sleepAfter: avg(nn(ks.map((k) => next(k)?.sleepMinutes))),
      steps: avg(nn(ks.map((k) => get(k)?.steps))),
      restingHr: avg(nn(ks.map((k) => next(k)?.restingHr))),
    };
  };
  return { train: group(true), rest: group(false) };
}

// ---------------------------------------------------------------------------
// Metric detail (prototype `metricData`)
// ---------------------------------------------------------------------------

export type MetricSeries = {
  /** Raw values (null = no reading). */
  values: readonly (number | null)[];
  /** Day keys of W/M bars (empty for D). */
  keys: readonly string[];
  /** Lower bound of the chart (hr starts at 40). */
  lo: number;
  goal: number | null;
  /** Index of the highlighted bar (today / current hour). */
  highlight: number;
  /** Bars after this index are empty (future hours). */
  futureFrom: number | null;
};

export type MetricContext = {
  get: DayLookup;
  todayKey: string;
  currentHour: number;
  goals: HealthGoals;
  /** Weigh-ins of the last 30 days (kg by day key). */
  weights: ReadonlyMap<string, number>;
  /** History entries of the last 30 days (runs/walks for "in runs"). */
  entries: readonly Entry[];
};

const PERIOD_DAYS: Record<Exclude<MetricPeriod, 'D'>, number> = { W: 7, M: 30 };

function dayValue(key: MetricKey, d: HealthDay | null, kg: number | undefined): number | null {
  switch (key) {
    case 'steps':
      return d?.steps ?? null;
    case 'hr':
      return d?.restingHr ?? null;
    case 'cal':
      return d?.activeKcal ?? null;
    case 'dist':
      return d?.distanceM == null ? null : Math.round(d.distanceM / 100) / 10;
    case 'sleep':
      return d?.sleepMinutes ?? null;
    case 'weight':
      return kg ?? null;
  }
}

/** Steps of each hour scaled to a day total (calories / distance per hour). */
function hourlyShare(d: HealthDay | null, total: number | null, digits = 0): (number | null)[] {
  const hours = d?.stepsHourly;
  if (!hours || total == null || !d?.steps) return Array(24).fill(null);
  const f = 10 ** digits;
  return hours.map((v) => Math.round((v / d.steps!) * total * f) / f);
}

export function metricSeries(key: MetricKey, p: MetricPeriod, ctx: MetricContext): MetricSeries {
  const today = ctx.get(ctx.todayKey);
  const base = { lo: key === 'hr' ? 40 : key === 'weight' ? 70 : 0, goal: null, keys: [] };
  if (p === 'D') {
    const hourly = { highlight: ctx.currentHour, futureFrom: ctx.currentHour + 1 };
    switch (key) {
      case 'steps':
        return { ...base, ...hourly, values: today?.stepsHourly ?? Array(24).fill(null) };
      case 'hr':
        return { ...base, ...hourly, values: today?.hrHourly ?? Array(24).fill(null) };
      case 'cal':
        return { ...base, ...hourly, values: hourlyShare(today, today?.activeKcal ?? null) };
      case 'dist':
        return {
          ...base,
          ...hourly,
          values: hourlyShare(today, today?.distanceM == null ? null : today.distanceM / 1000, 2),
        };
      case 'sleep': {
        const values = (today?.sleepStages ?? []).map((s) => s[1]);
        return { ...base, values, highlight: values.length - 1, futureFrom: null };
      }
      case 'weight': {
        const last = [...ctx.weights.values()].pop();
        return { ...base, values: [last ?? null], highlight: 0, futureFrom: null };
      }
    }
  }
  const keys = dayKeys(ctx.todayKey, PERIOD_DAYS[p]);
  const values = keys.map((k) => dayValue(key, ctx.get(k), ctx.weights.get(k)));
  const goal = key === 'steps' ? ctx.goals.steps : key === 'sleep' ? ctx.goals.sleepMinutes : null;
  if (key === 'weight') {
    // Weigh-ins are sparse: chart only the days that have one.
    const present = values.filter((v): v is number => v != null);
    return { ...base, keys, values: present, highlight: present.length - 1, futureFrom: null };
  }
  return { ...base, keys, values, goal, highlight: values.length - 1, futureFrom: null };
}

export type MetricStat = { key: string; value: number; ratioOf?: number };
export type MetricStats = { big: number | null; stats: readonly MetricStat[] };

/** Headline number + the three stat cells, as raw numbers (labels/units are i18n). */
export function metricStats(key: MetricKey, p: MetricPeriod, ctx: MetricContext): MetricStats {
  const { values } = metricSeries(key, p, ctx);
  const v = nn(values);
  const mean = avg(v) ?? 0;
  const max = v.length ? Math.max(...v) : 0;
  const min = v.length ? Math.min(...v) : 0;
  const today = ctx.get(ctx.todayKey);
  if (p === 'D') {
    switch (key) {
      case 'steps': {
        const steps = today?.steps ?? null;
        const peak = values.reduce<number>(
          (best, x, i) => ((x ?? 0) > (values[best] ?? 0) ? i : best),
          0,
        );
        return {
          big: steps,
          stats: [
            { key: 'goal', value: ctx.goals.steps },
            { key: 'peakHour', value: peak },
            { key: 'remaining', value: Math.max(0, ctx.goals.steps - (steps ?? 0)) },
          ],
        };
      }
      case 'hr':
        return {
          big: today?.restingHr ?? null,
          stats: [
            { key: 'min', value: today?.hrMin ?? 0 },
            { key: 'max', value: today?.hrMax ?? 0 },
            { key: 'resting', value: today?.restingHr ?? 0 },
          ],
        };
      case 'cal': {
        const active = today?.activeKcal ?? 0;
        const rest = today?.restKcal ?? 0;
        return {
          big: today?.activeKcal ?? null,
          stats: [
            { key: 'active', value: active },
            { key: 'rest', value: rest },
            { key: 'total', value: active + rest },
          ],
        };
      }
      case 'dist': {
        const total = today?.distanceM == null ? null : today.distanceM / 1000;
        const inActivities =
          sum(
            nn(
              ctx.entries
                .filter((e) => dateKey(new Date(e.startedAt)) === ctx.todayKey)
                .map((e) => e.distanceM),
            ),
          ) / 1000;
        return {
          big: total,
          stats: [
            { key: 'inActivities', value: inActivities },
            { key: 'gps', value: inActivities > 0 ? inActivities : -1 },
            { key: 'walking', value: Math.max(0, (total ?? 0) - inActivities) },
          ],
        };
      }
      case 'sleep':
        return {
          big: today?.sleepMinutes ?? null,
          stats: [
            { key: 'goal', value: ctx.goals.sleepMinutes },
            { key: 'inBed', value: today?.inBedMinutes ?? 0 },
            { key: 'wakeups', value: today?.wakeups ?? 0 },
          ],
        };
      case 'weight':
        return {
          big: v[v.length - 1] ?? null,
          stats: [
            { key: 'lowest', value: min },
            { key: 'highest', value: max },
            { key: 'change', value: 0 },
          ],
        };
    }
  }
  switch (key) {
    case 'steps':
      return {
        big: v.length ? Math.round(mean) : null,
        stats: [
          { key: 'bestDay', value: max },
          {
            key: 'daysOnGoal',
            value: v.filter((x) => x >= ctx.goals.steps).length,
            ratioOf: v.length,
          },
          { key: 'total', value: sum(v) },
        ],
      };
    case 'hr':
      return {
        big: v.length ? Math.round(mean) : null,
        stats: [
          { key: 'avg', value: Math.round(mean) },
          { key: 'lowest', value: min },
          { key: 'highest', value: max },
        ],
      };
    case 'cal':
      return {
        big: v.length ? Math.round(mean) : null,
        stats: [
          { key: 'highest', value: max },
          { key: 'lowest', value: min },
          { key: 'totalActive', value: sum(v) },
        ],
      };
    case 'dist': {
      const from = dayKeys(ctx.todayKey, PERIOD_DAYS[p])[0]!;
      const runs = ctx.entries.filter(
        (e) => e.kind === 'run' && dateKey(new Date(e.startedAt)) >= from,
      );
      return {
        big: v.length ? sum(v) : null,
        stats: [
          { key: 'perDay', value: v.length ? sum(v) / v.length : 0 },
          { key: 'inRuns', value: sum(nn(runs.map((r) => r.distanceM))) / 1000 },
          { key: 'bestDay', value: max },
        ],
      };
    }
    case 'sleep':
      return {
        big: v.length ? Math.round(mean) : null,
        stats: [
          { key: 'longest', value: max },
          {
            key: 'nightsOnGoal',
            value: v.filter((x) => x >= ctx.goals.sleepMinutes).length,
            ratioOf: v.length,
          },
          { key: 'shortest', value: min },
        ],
      };
    case 'weight':
      return {
        big: v[v.length - 1] ?? null,
        stats: [
          { key: 'lowest', value: min },
          { key: 'highest', value: max },
          { key: 'change', value: (v[v.length - 1] ?? 0) - (v[0] ?? 0) },
        ],
      };
  }
}

// ---------------------------------------------------------------------------
// Report (prototype `reportVals`)
// ---------------------------------------------------------------------------

export type ReportTotals = {
  strength: number;
  runs: number;
  walks: number;
  others: number;
  km: number;
  vol: number;
  /** Averages over the days that have data (null = no data). */
  steps: number | null;
  sleep: number | null;
  stepHit: number;
  sleepHit: number;
  /** Days in the period. */
  n: number;
  prs: number;
  total: number;
};

/** Totals of the inclusive day range [fromKey, toKey]. `prDates` = ISO instants of records. */
export function reportTotals(
  fromKey: string,
  toKey: string,
  get: DayLookup,
  entries: readonly Entry[],
  prDates: readonly string[],
  goals: HealthGoals,
): ReportTotals {
  const inRange = (iso: string) => {
    const k = dateKey(new Date(iso));
    return k >= fromKey && k <= toKey;
  };
  const es = entries.filter((e) => inRange(e.startedAt));
  const keys: string[] = [];
  for (let k = fromKey; k <= toKey; k = addDays(k, 1)) keys.push(k);
  const steps = nn(keys.map((k) => get(k)?.steps));
  const sleep = nn(keys.map((k) => get(k)?.sleepMinutes));
  const strength = es.filter((e) => e.kind === 'strength').length;
  const runs = es.filter((e) => e.kind === 'run').length;
  const walks = es.filter((e) => e.kind === 'walk').length;
  const others = es.length - strength - runs - walks;
  return {
    strength,
    runs,
    walks,
    others,
    km:
      sum(nn(es.filter((e) => e.kind === 'run' || e.kind === 'walk').map((e) => e.distanceM))) /
      1000,
    vol: sum(nn(es.map((e) => e.volumeKg))),
    steps: avg(steps),
    sleep: avg(sleep),
    stepHit: steps.filter((s) => s >= goals.steps).length,
    sleepHit: sleep.filter((s) => s >= goals.sleepMinutes).length,
    n: keys.length,
    prs: prDates.filter(inRange).length,
    total: es.length,
  };
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

export type WeightPoint = { day: number; weight: number; manual: boolean };

/** SVG paths for the weight chart (viewBox 0 0 310 120), ported from the prototype. */
export function weightChart(points: readonly WeightPoint[]) {
  if (points.length === 0) return { line: '', trend: '', cx: -20, cy: -20 };
  const ws = points.map((p) => p.weight);
  const mn = Math.min(...ws) - 0.3;
  const mx = Math.max(...ws) + 0.3;
  const xy = points.map(
    (p) => [10 + (p.day / 29) * 290, 105 - ((p.weight - mn) / (mx - mn)) * 85] as const,
  );
  const path = (q: readonly (readonly [number, number])[]) =>
    q.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const t0 = xy[0] ?? ([10, 60] as const);
  const t1 = xy[xy.length - 1] ?? t0;
  return {
    line: path(xy),
    trend: path([t0, [(t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2 + 2] as const, t1]),
    cx: t1[0],
    cy: t1[1],
  };
}
