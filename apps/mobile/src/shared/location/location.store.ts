import { create } from 'zustand';

import type { GeoPoint } from './location.types';

type LocationState = {
  /** Raw points since tracking started (kept while the activity is paused or minimized). */
  points: GeoPoint[];
  tracking: boolean;
  setTracking: (tracking: boolean) => void;
  addPoints: (points: GeoPoint[]) => void;
  clear: () => void;
};

/** Recorded track of the activity in progress. Lives in memory until the activity is saved. */
export const useLocationStore = create<LocationState>((set, get) => ({
  points: [],
  tracking: false,
  setTracking: (tracking) => set({ tracking }),
  addPoints: (incoming) => {
    if (!get().tracking || incoming.length === 0) return;
    const points = get().points;
    const last = points[points.length - 1]?.t ?? -Infinity;
    // Background batches can repeat or reorder fixes: keep the track strictly increasing in time.
    const fresh = incoming.filter((p) => p.t > last).sort((a, b) => a.t - b.t);
    if (fresh.length) set({ points: [...points, ...fresh] });
  },
  clear: () => set({ points: [] }),
}));
