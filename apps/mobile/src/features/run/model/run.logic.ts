import { COOLDOWN_SEC } from './run.mock';
import { activitySecAt, buildTrack, rollingPace, trackRoute, trackSplits } from './run.track';

import type { Track } from './run.track';
import type { ActiveRun, IntervalConfig, IntervalPhase, RunSummary, Split } from './run.types';
import type { GeoPoint } from '@/shared/location';
import type { activities } from '@tracta/api';

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

/** Activity seconds elapsed, excluding pauses. */
export function elapsedSec(run: ActiveRun, now: number): number {
  return activitySecAt(run, now);
}

export function averagePace(sec: number, dist: number | null): number | null {
  return dist !== null && dist > 0.02 ? sec / dist : null;
}

export function kmh(paceSec: number): number {
  return 3600 / paceSec;
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

export type LiveValues = {
  run: ActiveRun;
  sec: number;
  dist: number | null;
  avgPace: number | null;
  curPace: number | null;
  /** Latest km first. */
  splits: Split[];
  phase: PhaseProgress | null;
  /** Accepted fixes drawn on the map ([lat, lng]). */
  route: [number, number][];
  /** A fix arrived in the last few seconds. */
  gpsFix: boolean;
  paused: boolean;
};

/** A GPS run without a fix for this long (real ms) shows "searching". */
const FIX_STALE_MS = 15000;

function trackOf(run: ActiveRun, points: readonly GeoPoint[]): Track | null {
  return run.gps ? buildTrack(run, points) : null;
}

export function liveValues(run: ActiveRun, points: readonly GeoPoint[], now: number): LiveValues {
  const sec = elapsedSec(run, now);
  const track = trackOf(run, points);
  const dist = track ? track.distanceM / 1000 : null;
  const last = points[points.length - 1];
  return {
    run,
    sec,
    dist,
    avgPace: averagePace(sec, dist),
    curPace: track ? rollingPace(track, sec) : null,
    splits: track ? trackSplits(track, 0).reverse() : [],
    phase: run.intervals ? phaseAt(intervalPhases(run.intervals), sec) : null,
    route: track ? track.points.map((p) => [p.lat, p.lng]) : [],
    gpsFix: last !== undefined && now - last.t < FIX_STALE_MS,
    paused: run.pausedAt !== null,
  };
}

/** Freezes distance, splits and route of a finished activity (`run` already paused). */
export function summarize(
  run: ActiveRun,
  points: readonly GeoPoint[],
  now: number,
  swimMeters: number | null,
): RunSummary {
  const sec = elapsedSec(run, now);
  const track = trackOf(run, points);
  return {
    type: run.type,
    gps: run.gps,
    sec,
    distKm: track ? track.distanceM / 1000 : null,
    swimMeters,
    splits: track ? trackSplits(track, sec) : [],
    route: track ? trackRoute(track) : null,
  };
}

/**
 * `activities.saveActivity` input for a finished activity. Times use the app clock (E2E lands on
 * the frozen "today"); the activity seconds the summary shows are what is saved.
 */
export function toActivityInput(
  summary: RunSummary,
  intervals: IntervalConfig | null,
  notes: string,
  endedAt: Date,
): activities.SaveActivityInput {
  const durationSeconds = Math.max(1, Math.round(summary.sec));
  const meters =
    summary.swimMeters ?? (summary.distKm === null ? null : Math.round(summary.distKm * 1000));
  const splits = summary.splits
    .map((s) => {
      const km = s.km !== null ? 1 : Math.round((s.partialKm ?? 0) * 100) / 100;
      return { km, seconds: Math.max(1, Math.round(s.paceSec * km)) };
    })
    .filter((s) => s.km > 0);
  return {
    kind: summary.type,
    startedAt: new Date(endedAt.getTime() - durationSeconds * 1000).toISOString(),
    durationSeconds,
    distanceM: meters,
    gps: summary.gps,
    splits,
    route: summary.gps ? summary.route : null,
    intervals,
    notes: notes.trim(),
  };
}
