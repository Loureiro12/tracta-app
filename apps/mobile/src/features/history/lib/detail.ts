/** Session-detail helpers: splits bars and the illustrative route (no GPS track is stored yet). */
import type { RouteGeometry, RunSplit } from '../model/history.types';
import type { activities } from '@tracta/api';

/** Route placeholder: a closed loop in a 358×230 box (prototype `ROUTE`). */
const ROUTE: [number, number][] = Array.from({ length: 81 }, (_, i) => {
  const t = (i / 80) * Math.PI * 2 - Math.PI / 2;
  return [
    179 + 118 * Math.cos(t) + 26 * Math.cos(3 * t),
    115 + 74 * Math.sin(t) + 16 * Math.sin(2 * t),
  ];
});

function pathOf(points: [number, number][]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
}

export function routeAt(fraction: number): RouteGeometry {
  const n = Math.max(1, Math.round(Math.min(1, fraction) * 80));
  const partial = ROUTE.slice(0, n + 1);
  const end = partial[partial.length - 1] ?? [0, 0];
  return { full: pathOf(ROUTE), partial: pathOf(partial), cx: end[0], cy: end[1] };
}

/** Bars of the "Splits" card from the stored splits (fastest full km highlighted). */
export function splitBars(splits: readonly activities.Split[]): RunSplit[] {
  const paces = splits.map((s) => s.seconds / s.km);
  if (paces.length === 0) return [];
  const min = Math.min(...paces);
  const max = Math.max(...paces);
  let whole = 0;
  return splits.map((s, i) => {
    const partial = s.km < 1;
    if (!partial) whole += 1;
    const pace = paces[i]!;
    return {
      km: partial ? s.km : whole,
      partial,
      paceSeconds: pace,
      width: Math.round(100 - (max === min ? 0 : (pace - min) / (max - min)) * 45),
      best: pace === min,
    };
  });
}
