import {
  CAL_WEEK,
  DEFAULT_MEASURES,
  DIST_WEEK,
  GOALS,
  HOURS,
  HR_DAY,
  HR_WEEK,
  KIND,
  NIGHTS,
  NIGHTS_30,
  RUN_KM,
  SLEEP_GOAL_MIN,
  SLEEP_LAST_NIGHT_MIN,
  SLEEP_SEGMENTS,
  STEPS_GOAL,
  TODAY_DAY,
  WEEK,
  WEIGHT_BASE,
  WEIGHT_DAYS,
  series30,
} from '../model/health.mock';

import type { BodyLogEntry, MetricKey, MetricPeriod, SleepStage } from '../model/health.types';

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

/** Minutes per stage of last night. */
export function stageTotals(): Record<SleepStage, number> {
  const tot: Record<SleepStage, number> = { awake: 0, rem: 0, light: 0, deep: 0 };
  for (const [stage, min] of SLEEP_SEGMENTS) tot[stage] += min;
  return tot;
}

export function sleep30() {
  const avg = Math.round(NIGHTS_30.reduce((a, b) => a + b, 0) / NIGHTS_30.length);
  const hit = NIGHTS_30.filter((m) => m >= SLEEP_GOAL_MIN).length;
  return {
    avg,
    hit,
    longest: Math.max(...NIGHTS_30),
    shortest: Math.min(...NIGHTS_30),
  };
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

export type WeightPoint = { day: number; weight: number; manual: boolean };

/** Weighings of the last 30 days, with manual entries appended on the last day. */
export function weightPoints(bodyLogs: readonly BodyLogEntry[]): WeightPoint[] {
  const pts: WeightPoint[] = WEIGHT_DAYS.map((i) => ({
    day: i,
    weight: WEIGHT_BASE[i] ?? 0,
    manual: false,
  }));
  for (const log of bodyLogs) pts.push({ day: 29, weight: log.weight, manual: true });
  return pts.sort((a, b) => a.day - b.day);
}

export function latestMeasures(bodyLogs: readonly BodyLogEntry[]) {
  const last = bodyLogs[bodyLogs.length - 1];
  return last
    ? { waist: last.waist, hip: last.hip, arm: last.arm, manualToday: true }
    : { ...DEFAULT_MEASURES, manualToday: false };
}

/** SVG paths for the weight chart (viewBox 0 0 310 120), ported from the prototype. */
export function weightChart(points: readonly WeightPoint[]) {
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

// ---------------------------------------------------------------------------
// Metric detail (prototype `metricData`)
// ---------------------------------------------------------------------------

export type MetricSeries = {
  /** Raw values (null = no reading). */
  values: readonly (number | null)[];
  /** Lower bound of the chart (hr starts at 40). */
  lo: number;
  goal: number | null;
  /** Index of the highlighted bar (today / current hour). */
  highlight: number;
  /** Bars after this index are empty (future hours). */
  futureFrom: number | null;
};

const SUM = (v: readonly (number | null)[]) => v.reduce<number>((a, b) => a + (b ?? 0), 0);
const NN = (v: readonly (number | null)[]) => v.filter((x): x is number => x != null);

export function metricSeries(key: MetricKey, p: MetricPeriod): MetricSeries {
  const base = { lo: 0, goal: null, futureFrom: null as number | null };
  switch (key) {
    case 'steps': {
      const values =
        p === 'D'
          ? HOURS
          : p === 'W'
            ? WEEK.map((x) => x[0])
            : series30(9200, 2600, 0).map((v, i) => (i >= 23 ? WEEK[i - 23]![0] : v));
      return {
        ...base,
        values,
        goal: p === 'D' ? null : STEPS_GOAL,
        highlight: p === 'D' ? 16 : values.length - 1,
        futureFrom: p === 'D' ? 17 : null,
      };
    }
    case 'hr': {
      const values =
        p === 'D'
          ? HR_DAY
          : p === 'W'
            ? HR_WEEK
            : series30(60, 2.5, 1).map((v, i) => (i === 29 ? 58 : v));
      return {
        ...base,
        values,
        lo: 40,
        highlight: p === 'D' ? 16 : values.length - 1,
        futureFrom: p === 'D' ? 17 : null,
      };
    }
    case 'cal': {
      const values =
        p === 'D'
          ? HOURS.map((v) => Math.round(v * 0.0456))
          : p === 'W'
            ? CAL_WEEK
            : series30(450, 90, 2).map((v, i) => (i >= 23 ? CAL_WEEK[i - 23]! : v));
      return {
        ...base,
        values,
        highlight: p === 'D' ? 16 : values.length - 1,
        futureFrom: p === 'D' ? 17 : null,
      };
    }
    case 'dist': {
      const values =
        p === 'D'
          ? HOURS.map((v) => +(v * 0.00072).toFixed(2))
          : p === 'W'
            ? DIST_WEEK
            : series30(7.2, 2.2, 3).map((v, i) => (i >= 23 ? DIST_WEEK[i - 23]! : Math.max(2, v)));
      return {
        ...base,
        values,
        highlight: p === 'D' ? 16 : values.length - 1,
        futureFrom: p === 'D' ? 17 : null,
      };
    }
    case 'sleep': {
      const values =
        p === 'D'
          ? SLEEP_SEGMENTS.map((s) => s[1])
          : p === 'W'
            ? NIGHTS.map((n) => n[0])
            : NIGHTS_30;
      return {
        ...base,
        values,
        goal: p === 'D' ? null : SLEEP_GOAL_MIN,
        highlight: values.length - 1,
      };
    }
    case 'weight': {
      const values =
        p === 'D' ? [WEIGHT_BASE[29] ?? 0] : p === 'W' ? WEIGHT_BASE.slice(23) : WEIGHT_BASE;
      return { ...base, values, lo: 70, highlight: values.length - 1 };
    }
  }
}

export type MetricStats = {
  big: number;
  stats: readonly { key: string; value: number; ratioOf?: number }[];
};

/** Headline number + the three stat cells, as raw numbers (labels/units are i18n). */
export function metricStats(key: MetricKey, p: MetricPeriod): MetricStats {
  const { values } = metricSeries(key, p);
  const nn = NN(values);
  const avg = nn.length ? SUM(nn) / nn.length : 0;
  const max = nn.length ? Math.max(...nn) : 0;
  const min = nn.length ? Math.min(...nn) : 0;
  switch (key) {
    case 'steps': {
      if (p === 'D')
        return {
          big: 6842,
          stats: [
            { key: 'goal', value: STEPS_GOAL },
            { key: 'peakHour', value: 16 },
            { key: 'remaining', value: Math.max(0, STEPS_GOAL - 6842) },
          ],
        };
      const done = nn.filter((v) => v >= STEPS_GOAL).length;
      return {
        big: Math.round(avg),
        stats: [
          { key: 'bestDay', value: max },
          { key: 'daysOnGoal', value: done, ratioOf: nn.length },
          { key: 'total', value: SUM(nn) },
        ],
      };
    }
    case 'hr':
      if (p === 'D')
        return {
          big: 58,
          stats: [
            { key: 'min', value: 52 },
            { key: 'max', value: 92 },
            { key: 'resting', value: 58 },
          ],
        };
      return {
        big: Math.round(avg),
        stats: [
          { key: 'avg', value: Math.round(avg) },
          { key: 'lowest', value: min },
          { key: 'highest', value: max },
        ],
      };
    case 'cal':
      if (p === 'D')
        return {
          big: 312,
          stats: [
            { key: 'active', value: 312 },
            { key: 'rest', value: 1120 },
            { key: 'total', value: 1432 },
          ],
        };
      return {
        big: Math.round(avg),
        stats: [
          { key: 'highest', value: max },
          { key: 'lowest', value: min },
          { key: 'totalActive', value: SUM(nn) },
        ],
      };
    case 'dist':
      if (p === 'D')
        return {
          big: 4.9,
          stats: [
            { key: 'inActivities', value: 0 },
            { key: 'gps', value: -1 },
            { key: 'walking', value: 4.9 },
          ],
        };
      return {
        big: SUM(nn),
        stats: [
          { key: 'perDay', value: SUM(nn) / nn.length },
          { key: 'inRuns', value: p === 'W' ? 13 : 38.4 },
          { key: 'bestDay', value: max },
        ],
      };
    case 'sleep': {
      if (p === 'D')
        return {
          big: SLEEP_LAST_NIGHT_MIN,
          stats: [
            { key: 'goal', value: SLEEP_GOAL_MIN },
            { key: 'inBed', value: 432 },
            { key: 'wakeups', value: 3 },
          ],
        };
      const hit = nn.filter((v) => v >= SLEEP_GOAL_MIN).length;
      return {
        big: Math.round(avg),
        stats: [
          { key: 'longest', value: max },
          { key: 'nightsOnGoal', value: hit, ratioOf: nn.length },
          { key: 'shortest', value: min },
        ],
      };
    }
    case 'weight':
      return {
        big: nn[nn.length - 1] ?? 0,
        stats: [
          { key: 'lowest', value: min },
          { key: 'highest', value: max },
          { key: 'change', value: (nn[nn.length - 1] ?? 0) - (nn[0] ?? 0) },
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
  steps: number;
  sleep: number;
  stepHit: number;
  sleepHit: number;
  n: number;
  prs: number;
  total: number;
};

export function reportTotals(a: number, b: number): ReportTotals {
  const r: ReportTotals = {
    strength: 0,
    runs: 0,
    walks: 0,
    others: 0,
    km: 0,
    vol: 0,
    steps: 0,
    sleep: 0,
    stepHit: 0,
    sleepHit: 0,
    n: 0,
    prs: 0,
    total: 0,
  };
  for (let d = a; d <= b; d++) {
    if (d < 1) continue;
    r.n++;
    const seed = (d * 7919) % 1000;
    const k = KIND[d];
    if (d < TODAY_DAY && k && k !== 'R') {
      r.strength++;
      r.vol += 8000 + seed * 4;
      if (d >= 19) r.prs++;
    }
    if (d < TODAY_DAY && k === 'R') {
      r.runs++;
      r.km += RUN_KM[d] ?? 0;
    }
    const sp = d === TODAY_DAY ? 6842 : 6000 + seed * 7;
    const sl = d === TODAY_DAY ? 410 : 390 + (seed % 90);
    r.steps += sp;
    r.sleep += sl;
    if (sp >= GOALS.steps) r.stepHit++;
    if (sl >= GOALS.sleep) r.sleepHit++;
  }
  r.total = r.strength + r.runs + r.walks + r.others;
  return r;
}
