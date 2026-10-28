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

/** Demo clock: one real second counts as 12 activity seconds (the prototype's `fastSim`). */
export const SIM_FACTOR = 12;

/** Route placeholder canvas (matches the prototype's 358×230 SVG viewBox). */
export const ROUTE_WIDTH = 358;
export const ROUTE_HEIGHT = 230;
export const ROUTE_GRID = 28;

/** A closed loop of 81 points drawn by the prototype's `ROUTE` generator. */
export const ROUTE_POINTS: readonly (readonly [number, number])[] = Array.from(
  { length: 81 },
  (_, i) => {
    const t = (i / 80) * Math.PI * 2 - Math.PI / 2;
    return [
      179 + 118 * Math.cos(t) + 26 * Math.cos(3 * t),
      115 + 74 * Math.sin(t) + 16 * Math.sin(2 * t),
    ] as const;
  },
);

/** Distance (km) that completes the mock loop once. */
export const LOOP_KM: Partial<Record<ModalityId, number>> = { walk: 2.5 };
export const DEFAULT_LOOP_KM = 5;

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
