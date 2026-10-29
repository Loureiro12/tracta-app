import { history, supabase, useQuery } from '@/shared/api';
import { now, toDateKey, today } from '@/shared/clock';
import { useSession } from '@/shared/session';

import type { history as historyApi } from '@tracta/api';

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Monday 00:00 of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/**
 * Last five weeks of history entries (strength sessions + activities). Lives under the
 * ['history'] prefix, so saving a session or a run refreshes Home automatically.
 */
export function useRecentEntries() {
  const { user } = useSession();
  const day = today();
  return useQuery({
    queryKey: ['history', 'home-recent', user?.id, day],
    queryFn: async () => {
      const end = new Date(startOfDay(now()).getTime() + DAY_MS);
      const start = new Date(startOfWeek(now()).getTime() - 28 * DAY_MS);
      return (
        await history.getMonth(supabase, { from: start.toISOString(), to: end.toISOString() })
      ).entries;
    },
    enabled: Boolean(user),
  });
}

export type HomeActivity = {
  /** Entries of the current Monday–Sunday week. */
  weekDone: number;
  /** A strength session was logged today. */
  doneToday: boolean;
  /** Most recent entry, if any. */
  last: historyApi.HistoryEntry | null;
};

export function summarize(entries: readonly historyApi.HistoryEntry[]): HomeActivity {
  const weekStart = startOfWeek(now()).getTime();
  const todayKey = today();
  let last: historyApi.HistoryEntry | null = null;
  let weekDone = 0;
  let doneToday = false;
  for (const e of entries) {
    const at = new Date(e.startedAt);
    if (at.getTime() >= weekStart) weekDone += 1;
    if (e.kind === 'strength' && toDateKey(at) === todayKey) doneToday = true;
    if (!last || at.getTime() > new Date(last.startedAt).getTime()) last = e;
  }
  return { weekDone, doneToday, last };
}
