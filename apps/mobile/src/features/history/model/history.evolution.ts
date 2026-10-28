/** Pure evolution math (prototype `evoValsRaw` / `cardioEvo`). Formatting happens in the components. */
import { allExercises, evoSeries, runPoints } from './history.mock';

import type {
  CardioGroup,
  CardioMetric,
  ChartGeometry,
  ChartPoint,
  StrengthMetric,
} from './history.types';

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

export function strengthEvolution(
  exerciseId: string,
  requestedMetric: StrengthMetric,
): StrengthEvolution | null {
  const exercise = allExercises.find((e) => e.id === exerciseId) ?? allExercises[0];
  if (!exercise) return null;
  const bodyweight = exercise.prev[0]?.[0] == null;
  const metrics: readonly StrengthMetric[] = bodyweight ? ['reps', 'vol'] : ['kg', 'vol', 'reps'];
  const metric = metrics.includes(requestedMetric) ? requestedMetric : metrics[0]!;
  const series = evoSeries(exercise.id);
  if (series.length === 0) return null;
  const key = (p: { kg: number | null; reps: number }) => (bodyweight ? p.reps : (p.kg ?? 0));
  const values = series.map((p) =>
    metric === 'kg' ? (p.kg ?? 0) : metric === 'vol' ? p.vol : p.reps,
  );
  const points: ChartPoint[] = series.map((p, i) => ({
    date: p.date,
    value: values[i]!,
    pr: i > 0 && key(p) > Math.max(...series.slice(0, i).map(key)),
  }));
  const bestIndex = Math.max(
    0,
    series.findIndex((p) => key(p) === Math.max(...series.map(key))),
  );
  const best = series[bestIndex]!;
  const first = values[0]!;
  const delta = values[values.length - 1]! - first;
  return {
    exerciseId: exercise.id,
    bodyweight,
    metrics,
    metric,
    points,
    best: { date: best.date, kg: best.kg, reps: best.reps },
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
  group: CardioGroup,
  metric: CardioMetric,
  deleted: readonly string[],
): CardioEvolution {
  const list = runPoints(deleted).filter((r) =>
    group === 'all' ? true : group === '5k' ? r.dist >= 4.5 && r.dist <= 5.5 : r.dist >= 7,
  );
  const values = list.map((r) => r[metric]);
  const points: ChartPoint[] = list.map((r, i) => ({
    date: r.date,
    value: values[i]!,
    pr: metric === 'pace' && i > 0 && r.pace < Math.min(...list.slice(0, i).map((q) => q.pace)),
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
