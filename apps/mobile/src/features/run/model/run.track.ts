import { activityTimeScale } from '@/shared/location';

import type { ActiveRun, ModalityId, Split } from './run.types';
import type { GeoPoint } from '@/shared/location';
import type { activities } from '@tracta/api';

/** Fixes worse than this (metres) are dropped. */
const MAX_ACCURACY_M = 25;
/** Moves shorter than this (or half the accuracy radius) are GPS jitter, not running. */
const MIN_STEP_M = 3;
/** Implied speeds above this (m/s) are jumps (tunnels, multipath), not movement. */
const MAX_SPEED: Partial<Record<ModalityId, number>> = { bike: 30 };
const DEFAULT_MAX_SPEED = 12;
/** Current pace = pace over the last PACE_WINDOW_SEC activity seconds. */
const PACE_WINDOW_SEC = 30;
const PACE_MIN_M = 20;

/** An accepted fix: activity seconds since start (pauses excluded) and cumulative metres. */
export type TrackPoint = {
  lat: number;
  lng: number;
  sec: number;
  distM: number;
  /** Increments after each pause; no distance is counted between segments. */
  segment: number;
};

export type Track = { points: TrackPoint[]; distanceM: number };

const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Real ms of activity between the start and `t`, without pauses. */
function activeMs(run: ActiveRun, t: number): number {
  let ms = t - run.startedAt;
  for (const [from, to] of run.pauses) ms -= Math.max(0, Math.min(to, t) - from);
  if (run.pausedAt !== null && t > run.pausedAt) ms -= t - run.pausedAt;
  return Math.max(0, ms);
}

/** Activity seconds at epoch ms `t` (scaled in E2E, where the fake GPS compresses time). */
export function activitySecAt(run: ActiveRun, t: number): number {
  return (activeMs(run, t) / 1000) * activityTimeScale;
}

function isPausedAt(run: ActiveRun, t: number): boolean {
  if (run.pausedAt !== null && t >= run.pausedAt) return true;
  return run.pauses.some(([from, to]) => t >= from && t <= to);
}

function segmentAt(run: ActiveRun, t: number): number {
  return run.pauses.filter(([, to]) => to < t).length;
}

/** Filters raw fixes (accuracy, jitter, jumps, pauses) and accumulates the distance. */
export function buildTrack(run: ActiveRun, raw: readonly GeoPoint[]): Track {
  const maxSpeed = MAX_SPEED[run.type] ?? DEFAULT_MAX_SPEED;
  const points: TrackPoint[] = [];
  let distM = 0;
  for (const p of raw) {
    if (p.t < run.startedAt || isPausedAt(run, p.t)) continue;
    if (p.accuracy !== null && p.accuracy > MAX_ACCURACY_M) continue;
    const sec = activitySecAt(run, p.t);
    const segment = segmentAt(run, p.t);
    const prev = points[points.length - 1];
    if (!prev || prev.segment !== segment) {
      points.push({ lat: p.lat, lng: p.lng, sec, distM, segment });
      continue;
    }
    const d = haversineM(prev, p);
    if (d < Math.max(MIN_STEP_M, (p.accuracy ?? 0) / 2)) continue;
    const dt = sec - prev.sec;
    if (dt <= 0 || d / dt > maxSpeed) continue;
    distM += d;
    points.push({ lat: p.lat, lng: p.lng, sec, distM, segment });
  }
  return { points, distanceM: distM };
}

/** Pace (s/km) over the last PACE_WINDOW_SEC of movement; null when standing still. */
export function rollingPace(track: Track, nowSec: number): number | null {
  const last = track.points[track.points.length - 1];
  if (!last || nowSec - last.sec > PACE_WINDOW_SEC) return null;
  let first = last;
  for (let i = track.points.length - 1; i >= 0; i--) {
    const p = track.points[i]!;
    if (p.segment !== last.segment || p.sec < nowSec - PACE_WINDOW_SEC) break;
    first = p;
  }
  const meters = last.distM - first.distM;
  if (meters < PACE_MIN_M) return null;
  return (nowSec - first.sec) / (meters / 1000);
}

/** Activity second at which each full kilometre was crossed (interpolated between fixes). */
function kmCrossings(track: Track): number[] {
  const out: number[] = [];
  let next = 1000;
  for (let i = 1; i < track.points.length; i++) {
    const a = track.points[i - 1]!;
    const b = track.points[i]!;
    while (b.distM >= next && b.distM > a.distM) {
      out.push(a.sec + ((next - a.distM) / (b.distM - a.distM)) * (b.sec - a.sec));
      next += 1000;
    }
  }
  return out;
}

/**
 * Per-km splits from the track. `totalSec` > 0 adds the trailing partial km (summary); the live
 * screen passes 0 so only complete kms are listed.
 */
export function trackSplits(track: Track, totalSec: number): Split[] {
  const crossings = kmCrossings(track);
  const paces = crossings.map((c, i) => c - (crossings[i - 1] ?? 0));
  const n = crossings.length;
  const rest = track.distanceM / 1000 - n;
  if (totalSec > 0 && rest > 0.05) {
    paces.push(Math.max(1, totalSec - (crossings[n - 1] ?? 0)) / rest);
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

/** The track as saved with the activity ([lat, lng]); null without at least two fixes. */
export function trackRoute(track: Track): activities.LatLng[] | null {
  if (track.points.length < 2) return null;
  const step = Math.ceil(track.points.length / 20000);
  return track.points.filter((_, i) => i % step === 0).map((p) => [p.lat, p.lng]);
}
