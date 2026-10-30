/** Session-detail helpers: splits bars (the route is drawn by RunMap from @/features/run). */
import type { RunSplit } from '../model/history.types';
import type { activities } from '@tracta/api';

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
