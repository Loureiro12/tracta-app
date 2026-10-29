/** Pure evolution math over the backend series (prototype `evoValsRaw` / `cardioEvo`). */
import type {
  CardioGroup,
  CardioMetric,
  ChartGeometry,
  ChartPoint,
  StrengthMetric,
} from './history.types';
import type { history } from '@tracta/api';

/** Comparison window of the evolution card. */
export const EVOLUTION_WEEKS = 12;

export const CHART_WIDTH = 310;
export const CHART_HEIGHT = 120;

/** SVG line/area for the 310×120 chart. `invert` plots lower values higher (pace). */
export function chartGeometry(values: readonly number[], invert = false): ChartGeometry {
  if (values.length === 0) return { line: '', area: '', cx: -20, cy: -20 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xy = values.map((v, i) => [
    10 + (i * 290) / Math.max(1, values.length - 1),
    105 - ((invert ? max - v : v - min) / span) * 80,
  ]);
  const line = xy
    .map((p, i) => `${i ? 'L' : 'M'}${p[0]!.toFixed(1)} ${p[1]!.toFixed(1)}`)
    .join(' ');
  const last = xy[xy.length - 1]!;
  return {
    line,
    area: `${line} L${last[0]!.toFixed(1)} 118 L10 118 Z`,
    cx: last[0]!,
    cy: last[1]!,
  };
}

export type StrengthEvolution = {
  exerciseId: string;
  slug: string;
  bodyweight: boolean;
  metrics: readonly StrengthMetric[];
  metric: StrengthMetric;
  points: ChartPoint[];
  /** The best session (max load, or max reps when bodyweight). */
  best: { date: Date; kg: number | null; reps: number };
  delta: number;
  deltaPct: number;
  geometry: ChartGeometry;
};

/**
 * Series of one exercise (by slug; falls back to the first one). Metrics: max load, volume
 * (Σ kg × reps, or total reps for bodyweight) and reps (total, or the best set for bodyweight).
 */
export function strengthEvolution(
  exercises: readonly history.ExerciseEvolution[],
  slug: string | null,
  requestedMetric: StrengthMetric,
): StrengthEvolution | null {
  const exercise = exercises.find((e) => e.slug === slug) ?? exercises[0];
  if (!exercise || exercise.points.length === 0) return null;
  const { bodyweight } = exercise;
  const metrics: readonly StrengthMetric[] = bodyweight ? ['reps', 'vol'] : ['kg', 'vol', 'reps'];
  const metric = metrics.includes(requestedMetric) ? requestedMetric : metrics[0]!;
  const series = exercise.points;
  const key = (p: history.StrengthPoint) => (bodyweight ? p.maxReps : (p.topKg ?? 0));
  const values = series.map((p) =>
    metric === 'kg'
      ? (p.topKg ?? 0)
      : metric === 'vol'
        ? bodyweight
          ? p.totalReps
          : p.volumeKg
        : bodyweight
          ? p.maxReps
          : p.totalReps,
  );
  const points: ChartPoint[] = series.map((p, i) => ({
    date: new Date(p.startedAt),
    value: values[i]!,
    pr: i > 0 && key(p) > Math.max(...series.slice(0, i).map(key)),
  }));
  const top = Math.max(...series.map(key));
  const best = series.find((p) => key(p) === top) ?? series[0]!;
  const first = values[0]!;
  const delta = values[values.length - 1]! - first;
  return {
    exerciseId: exercise.exerciseId,
    slug: exercise.slug,
    bodyweight,
    metrics,
    metric,
    points,
    best: {
      date: new Date(best.startedAt),
      kg: best.topKg,
      reps: bodyweight ? best.maxReps : best.topReps,
    },
    delta,
    deltaPct: first ? Math.round((delta / first) * 100) : 0,
    geometry: chartGeometry(values),
  };
}

export type CardioEvolution = {
  group: CardioGroup;
  metric: CardioMetric;
  /** Fewer than two comparable runs: no trend. */
  enough: boolean;
  points: ChartPoint[];
  best: ChartPoint | null;
  delta: number;
  geometry: ChartGeometry;
};

export function cardioEvolution(
  runs: readonly history.RunPoint[],
  group: CardioGroup,
  metric: CardioMetric,
): CardioEvolution {
  const list = runs
    .filter((r) =>
      group === 'all'
        ? true
        : group === '5k'
          ? r.distanceKm >= 4.5 && r.distanceKm <= 5.5
          : r.distanceKm >= 7,
    )
    .filter((r) => (metric === 'hr' ? r.avgHeartRate !== null : metric === 'dist' ? r.gps : true));
  const valueOf = (r: history.RunPoint) =>
    metric === 'pace' ? r.paceSeconds : metric === 'dist' ? r.distanceKm : (r.avgHeartRate ?? 0);
  const values = list.map(valueOf);
  const points: ChartPoint[] = list.map((r, i) => ({
    date: new Date(r.startedAt),
    value: values[i]!,
    pr:
      metric === 'pace' &&
      i > 0 &&
      r.paceSeconds < Math.min(...list.slice(0, i).map((q) => q.paceSeconds)),
  }));
  if (list.length < 2) {
    return {
      group,
      metric,
      enough: false,
      points,
      best: null,
      delta: 0,
      geometry: chartGeometry([]),
    };
  }
  const bestValue = metric === 'dist' ? Math.max(...values) : Math.min(...values);
  const best = points[values.indexOf(bestValue)] ?? null;
  return {
    group,
    metric,
    enough: true,
    points,
    best,
    delta: values[values.length - 1]! - values[0]!,
    geometry: chartGeometry(values, metric === 'pace'),
  };
}
