import type { IntervalConfig, Modality, ModalityId } from './run.types';

// TODO(workouts): replace with `modalities` from '@/features/workouts' once that feature exports its
// activity catalogue; until then this mirrors the prototype's `MOD` table.
export const modalities: Record<ModalityId, Modality> = {
  run: { id: 'run', gps: true, paceSec: 335 },
  walk: { id: 'walk', gps: true, paceSec: 630 },
  bike: { id: 'bike', gps: true, paceSec: 150, speed: true },
  swim: { id: 'swim', gps: false, swim: true },
  soccer: { id: 'soccer', gps: false },
  basket: { id: 'basket', gps: false },
  tennis: { id: 'tennis', gps: false },
  functional: { id: 'functional', gps: false },
  stretch: { id: 'stretch', gps: false },
  yoga: { id: 'yoga', gps: false },
};

/** Prototype defaults for the interval run (6 × 1:00 / 1:30, 5 min warm-up). */
export const DEFAULT_INTERVALS: IntervalConfig = {
  reps: 6,
  workSec: 60,
  restSec: 90,
  warmSec: 300,
};

export const COOLDOWN_SEC = 300;

/** Pool length used by the manual swim log. */
export const POOL_LENGTH_M = 25;
export const SWIM_STEP_M = 25;
export const SWIM_MIN_M = 25;
export const SWIM_MAX_M = 10000;
export const SWIM_DEFAULT_M = 1000;

/** Drawn-route canvas (the prototype's 358×230 SVG viewBox), used when no native map is available. */
export const ROUTE_WIDTH = 358;
export const ROUTE_HEIGHT = 230;
export const ROUTE_GRID = 28;

export function isModalityId(value: string | undefined): value is ModalityId {
  return value !== undefined && value in modalities;
}

/** Maps the `?type=` route param to a modality plus an optional interval plan. */
export function resolveActivity(param?: string): {
  type: ModalityId;
  intervals: IntervalConfig | null;
} {
  if (param === 'intervals') return { type: 'run', intervals: DEFAULT_INTERVALS };
  return { type: isModalityId(param) ? param : 'run', intervals: null };
}
