import { useMemo } from 'react';

import { now, toDateKey } from '@/shared/clock';

import { useHistoryMonth } from '../api/useHistory';
import { dayActivity, dayItems, entriesByDay, monthGrid, parseDateKey } from '../lib/month';

import type { DayActivity } from '../model/history.types';

/**
 * Month view of the backend shaped for the calendar: grid, markers, totals and the rows of
 * `date` (YYYY-MM-DD; default today). The month shown is the one containing `date`.
 */
export function useMonthModel(date?: string) {
  const todayKey = toDateKey(now());
  const anchor = parseDateKey(date) ?? parseDateKey(todayKey) ?? now();
  const query = useHistoryMonth(anchor);
  const monthKey = toDateKey(anchor).slice(0, 7);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the grid only changes with the month
  const grid = useMemo(() => monthGrid(anchor), [monthKey]);
  const view = query.data;
  const byDay = useMemo(() => entriesByDay(view?.entries ?? []), [view]);
  const activity = useMemo(() => {
    const out = new Map<string, DayActivity>();
    for (const [key, list] of byDay) {
      const a = dayActivity(list);
      if (a) out.set(key, a);
    }
    return out;
  }, [byDay]);
  const itemsOf = (key: string) => {
    const day = parseDateKey(key);
    return day ? dayItems(day, todayKey, byDay.get(key) ?? [], view?.routines ?? []) : [];
  };
  return { query, view, grid, todayKey, byDay, activity, itemsOf };
}
