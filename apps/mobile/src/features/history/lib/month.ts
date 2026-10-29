/** Calendar math and day rows of the History tab, over the backend month view. */
import { toDateKey } from '@/shared/clock';

import { clock, decimal } from './format';

import type { DayActivity, DayItem } from '../model/history.types';
import type { history } from '@tracta/api';

export const CALENDAR_CELLS = 35;

export type MonthGrid = {
  year: number;
  /** 0-based. */
  month: number;
  daysInMonth: number;
  /** Empty cells before day 1 (the grid starts on Monday). */
  offset: number;
  /** Rows needed (5, or 6 when the month spills over). */
  cells: number;
};

export function monthGrid(anchor: Date): MonthGrid {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return { year, month, daysInMonth, offset, cells: Math.ceil((offset + daysInMonth) / 7) * 7 };
}

/** Local month bounds as ISO instants (query range) plus a cache key ("2026-10"). */
export function monthBounds(anchor: Date): { from: string; to: string; key: string } {
  const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  return { from: from.toISOString(), to: to.toISOString(), key: toDateKey(from).slice(0, 7) };
}

export function dateKeyOf(year: number, month: number, day: number): string {
  return toDateKey(new Date(year, month, day));
}

/** "2026-10-19" → local Date at midnight; null when malformed. */
export function parseDateKey(value: string | undefined): Date | null {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toDateKey(date) === value ? date : null;
}

/** Entries grouped by their local calendar day. */
export function entriesByDay(
  entries: readonly history.HistoryEntry[],
): Map<string, history.HistoryEntry[]> {
  const out = new Map<string, history.HistoryEntry[]>();
  for (const e of entries) {
    const key = toDateKey(new Date(e.startedAt));
    const list = out.get(key) ?? [];
    list.push(e);
    out.set(key, list);
  }
  return out;
}

export function dayActivity(
  entries: readonly history.HistoryEntry[] | undefined,
): DayActivity | null {
  if (!entries?.length) return null;
  return entries.some((e) => e.kind === 'strength') ? 'strength' : 'run';
}

/** "8,2 km · 45:41 · 5:34 /km", or the duration for modalities without distance. */
export function activitySummary(e: history.HistoryEntry): string {
  const km = (e.distanceM ?? 0) / 1000;
  if (km <= 0) return clock(e.durationSeconds);
  return `${decimal(km)} km · ${clock(e.durationSeconds)} · ${clock(e.durationSeconds / km)} /km`;
}

/** Monday-first weekday (the routines' `weekday`). */
export function weekdayOf(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Rows of a day: logged sessions/activities, plus today's planned routine while it is not done.
 * Keys are `<kind>-<day>` (suffixed when a day has several of the same kind).
 */
export function dayItems(
  date: Date,
  todayKey: string,
  entries: readonly history.HistoryEntry[],
  routines: readonly history.PlannedRoutine[],
): DayItem[] {
  const key = toDateKey(date);
  const day = date.getDate();
  if (key > todayKey) return [];
  const used = new Map<string, number>();
  const keyOf = (kind: string) => {
    const n = (used.get(kind) ?? 0) + 1;
    used.set(kind, n);
    return n === 1 ? `${kind}-${day}` : `${kind}-${day}-${n}`;
  };
  const items: DayItem[] = entries.map((e) =>
    e.kind === 'strength'
      ? {
          id: e.id,
          key: keyOf('strength'),
          kind: 'strength',
          routineName: e.title ?? '',
          focus: e.focus ?? '',
          minutes: Math.round(e.durationSeconds / 60),
          sets: e.sets ?? 0,
        }
      : {
          id: e.id,
          key: keyOf(e.kind === 'run' ? 'run' : 'activity'),
          kind: e.kind === 'run' ? 'run' : 'activity',
          activity: e.kind,
          summary: activitySummary(e),
        },
  );
  if (key === todayKey && !entries.some((e) => e.kind === 'strength')) {
    const planned = routines.find((r) => r.weekday === weekdayOf(date));
    if (planned) {
      items.push({
        id: `planned-${day}`,
        key: `planned-${day}`,
        kind: 'planned',
        routineName: planned.name,
        focus: planned.focus,
      });
    }
  }
  return items;
}

/** Latest day up to today with something logged (the default selection), else today. */
export function defaultSelection(byDay: Map<string, unknown[]>, todayKey: string): string {
  let best: string | null = null;
  for (const key of byDay.keys()) if (key <= todayKey && (!best || key > best)) best = key;
  return best ?? todayKey;
}
