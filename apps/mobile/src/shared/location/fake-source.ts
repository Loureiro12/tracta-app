import { useLocationStore } from './location.store';

import type { LocationSource } from './location.types';

/**
 * Deterministic GPS for E2E builds (Maestro cannot drive the simulator's location). Plays back a
 * 5 km loop around Ibirapuera (São Paulo) with the prototype's ROUTE shape, one fix per real
 * second, compressed in time by FAKE_TIME_SCALE so flows see kilometres go by in seconds.
 */
export const FAKE_TIME_SCALE = 12;

const CENTER = { lat: -23.5874, lng: -46.6576 };
const LOOP_M = 5000;
const SAMPLES = 400;
const M_PER_DEG = 111320;
const TICK_MS = 1000;

/** Prototype ROUTE loop (358×230 box, y down) as east/north metres, scaled to LOOP_M. */
const LOOP: { x: number; y: number; at: number }[] = (() => {
  const raw = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const t = (i / SAMPLES) * Math.PI * 2 - Math.PI / 2;
    return {
      x: 118 * Math.cos(t) + 26 * Math.cos(3 * t),
      y: -(74 * Math.sin(t) + 16 * Math.sin(2 * t)),
    };
  });
  let length = 0;
  const withAt = raw.map((p, i) => {
    const prev = raw[i - 1];
    if (prev) length += Math.hypot(p.x - prev.x, p.y - prev.y);
    return { ...p, at: length };
  });
  const k = LOOP_M / length;
  return withAt.map((p) => ({ x: p.x * k, y: p.y * k, at: p.at * k }));
})();

/** Position `meters` along the loop (wraps around). */
function fakeLoopPoint(meters: number): { lat: number; lng: number } {
  const d = ((meters % LOOP_M) + LOOP_M) % LOOP_M;
  let i = 1;
  while (i < LOOP.length - 1 && (LOOP[i]?.at ?? 0) < d) i++;
  const a = LOOP[i - 1] ?? LOOP[0]!;
  const b = LOOP[i] ?? a;
  const f = b.at > a.at ? (d - a.at) / (b.at - a.at) : 0;
  const x = a.x + (b.x - a.x) * f;
  const y = a.y + (b.y - a.y) * f;
  return {
    lat: CENTER.lat + y / M_PER_DEG,
    lng: CENTER.lng + x / (M_PER_DEG * Math.cos((CENTER.lat * Math.PI) / 180)),
  };
}

let timer: ReturnType<typeof setInterval> | null = null;

export const fakeSource: LocationSource = {
  requestPermission: async () => 'always',
  start: async ({ paceHintSec = 335 }) => {
    const store = useLocationStore.getState();
    if (store.tracking) return true;
    store.setTracking(true);
    let meters = 0;
    let tick = 0;
    const emit = () => {
      const p = fakeLoopPoint(meters);
      useLocationStore.getState().addPoints([{ ...p, t: Date.now(), accuracy: 5 }]);
      // A gentle wobble so the current pace moves like a real run.
      meters +=
        ((TICK_MS / 1000) * FAKE_TIME_SCALE * 1000 * (1 + 0.06 * Math.sin(tick / 5))) / paceHintSec;
      tick += 1;
    };
    emit();
    timer = setInterval(emit, TICK_MS);
    return true;
  },
  stop: async () => {
    if (timer) clearInterval(timer);
    timer = null;
    useLocationStore.getState().setTracking(false);
  },
};
