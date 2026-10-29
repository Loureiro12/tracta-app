import type { WeightPoint } from './derive';
import type { body } from '@tracta/api';

const DAY_MS = 86_400_000;

function dayIndex(from: string, day: string): number {
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** One weight point per day of the window (a manual entry wins over the scale that day). */
export function weightPointsOf(
  entries: readonly body.BodyMeasurement[],
  from: string,
): (WeightPoint & { measuredOn: string })[] {
  const byDay = new Map<string, body.BodyMeasurement>();
  for (const e of entries) {
    if (e.weightKg === null) continue;
    const current = byDay.get(e.measuredOn);
    if (!current || e.source === 'manual') byDay.set(e.measuredOn, e);
  }
  return [...byDay.values()]
    .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn))
    .map((e) => ({
      day: dayIndex(from, e.measuredOn),
      weight: e.weightKg ?? 0,
      manual: e.source === 'manual',
      measuredOn: e.measuredOn,
    }));
}
