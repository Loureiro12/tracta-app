import {
  COOLDOWN_SEC,
  DEFAULT_LOOP_KM,
  LOOP_KM,
  ROUTE_POINTS,
  SIM_FACTOR,
  modalities,
} from './run.mock';

import type { ActiveRun, IntervalConfig, IntervalPhase, ModalityId, Split } from './run.types';

export const EM_DASH = '—';

/** m:ss or h:mm:ss. */
export function clock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(x).padStart(2, '0')}`;
}

/** Activity seconds elapsed, excluding pauses, scaled by the demo factor. */
export function elapsedSec(run: ActiveRun, now: number): number {
  const pausedNow = run.pausedAt ? now - run.pausedAt : 0;
  const ms = now - run.startedAt - run.pausedTotalMs - pausedNow;
  return Math.max(0, (ms / 1000) * SIM_FACTOR);
}

export function basePace(type: ModalityId): number {
  return modalities[type].paceSec ?? 335;
}

/** Mock distance for GPS activities: base pace with a gentle wobble. */
export function distanceKm(run: ActiveRun, sec: number): number | null {
  if (!run.gps) return null;
  return Math.max(0, (sec / basePace(run.type)) * (1 + 0.025 * Math.sin(sec / 97)));
}

/** Current pace wobbles around the average, like the prototype. */
export function currentPace(avg: number | null, sec: number): number | null {
  return avg ? avg + 9 * Math.sin(sec / 40) : null;
}

export function averagePace(sec: number, dist: number | null): number | null {
  return dist !== null && dist > 0.02 ? sec / dist : null;
}

export function kmh(paceSec: number): number {
  return 3600 / paceSec;
}

/**
 * Per-km splits. `sec` > 0 adds the trailing partial km; the live screen passes 0 so only
 * complete kms are listed.
 */
export function splitsFor(type: ModalityId, dist: number | null, sec: number): Split[] {
  if (dist === null) return [];
  const p = basePace(type);
  const n = Math.floor(dist);
  const paces: number[] = [];
  for (let k = 1; k <= n; k++) paces.push(p + ((k * 37) % 17) - 8);
  const rest = dist - n;
  const hasPartial = rest > 0.05 && sec > 0;
  if (hasPartial) {
    const used = paces.reduce((a, b) => a + b, 0);
    paces.push(Math.max(p - 20, (sec - used) / rest));
  }
  if (paces.length === 0) return [];
  const mn = Math.min(...paces);
  const mx = Math.max(...paces);
  return paces.map((v, i) => ({
    km: i < n ? i + 1 : null,
    partialKm: i < n ? null : rest,
    paceSec: v,
    width: (100 - (mx === mn ? 0 : (v - mn) / (mx - mn)) * 45) / 100,
    fastest: v === mn,
  }));
}

export function intervalPhases(c: IntervalConfig): IntervalPhase[] {
  const out: IntervalPhase[] = [{ kind: 'warmup', sec: c.warmSec }];
  for (let i = 1; i <= c.reps; i++) {
    out.push({ kind: 'work', sec: c.workSec, index: i, total: c.reps });
    if (i < c.reps) out.push({ kind: 'recovery', sec: c.restSec });
  }
  out.push({ kind: 'cooldown', sec: COOLDOWN_SEC });
  return out;
}

export type PhaseProgress = {
  done: boolean;
  phase: IntervalPhase;
  remainingSec: number;
  /** 0..1 */
  progress: number;
  next: IntervalPhase | null;
};

export function phaseAt(phases: IntervalPhase[], sec: number): PhaseProgress {
  let t = 0;
  let k = 0;
  while (k < phases.length - 1 && t + (phases[k]?.sec ?? 0) <= sec) {
    t += phases[k]?.sec ?? 0;
    k++;
  }
  const phase = phases[k] ?? phases[0] ?? { kind: 'cooldown', sec: COOLDOWN_SEC };
  const into = Math.min(phase.sec, sec - t);
  const total = phases.reduce((a, b) => a + b.sec, 0);
  const done = sec >= total;
  return {
    done,
    phase,
    remainingSec: done ? 0 : phase.sec - into,
    progress: done ? 1 : into / phase.sec,
    next: phases[k + 1] ?? null,
  };
}

/** Fraction of the mock loop covered by `dist` km (one loop = 5 km, 2.5 km when walking). */
export function routeFraction(type: ModalityId, dist: number | null): number {
  if (dist === null) return 0;
  return Math.min(1, dist / (LOOP_KM[type] ?? DEFAULT_LOOP_KM));
}

export type RoutePath = { full: string; drawn: string; cx: number; cy: number };

function toPath(points: readonly (readonly [number, number])[]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

/** SVG path data for the loop and the portion already covered (`fraction` 0..1). */
export function routePath(fraction: number): RoutePath {
  const n = Math.max(1, Math.round(Math.min(1, Math.max(0, fraction)) * (ROUTE_POINTS.length - 1)));
  const drawn = ROUTE_POINTS.slice(0, n + 1);
  const last = drawn[drawn.length - 1] ?? ROUTE_POINTS[0] ?? [0, 0];
  return { full: toPath(ROUTE_POINTS), drawn: toPath(drawn), cx: last[0], cy: last[1] };
}

export type LiveValues = {
  run: ActiveRun;
  sec: number;
  dist: number | null;
  avgPace: number | null;
  curPace: number | null;
  /** Latest km first. */
  splits: Split[];
  phase: PhaseProgress | null;
  routeFraction: number;
  paused: boolean;
};

export function liveValues(run: ActiveRun, now: number): LiveValues {
  const sec = elapsedSec(run, now);
  const dist = distanceKm(run, sec);
  const avgPace = averagePace(sec, dist);
  return {
    run,
    sec,
    dist,
    avgPace,
    curPace: currentPace(avgPace, sec),
    splits: splitsFor(run.type, dist === null ? null : Math.floor(dist), 0).reverse(),
    phase: run.intervals ? phaseAt(intervalPhases(run.intervals), sec) : null,
    routeFraction: routeFraction(run.type, dist),
    paused: run.pausedAt !== null,
  };
}
