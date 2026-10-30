import { useEffect } from 'react';

import { alerts } from '@/shared/notifications';

import { useSessionStore } from '../model/session.store';

/**
 * Schedules a local notification with sound for the end of the rest, so it rings even with the
 * phone locked. `countedAt + remainingSec` stays put while the countdown ticks, so the alert is
 * only rescheduled when the rest is adjusted, paused or resumed; leaving the rest cancels it.
 */
export function useRestAlert(title: string, body: string) {
  const endsAt = useSessionStore((s) =>
    s.rest && !s.rest.paused && s.rest.remainingSec > 0
      ? s.rest.countedAt + s.rest.remainingSec * 1000
      : null,
  );

  useEffect(() => {
    if (endsAt == null) return;
    let cancelled = false;
    let id: string | null = null;
    void alerts.schedule({ at: endsAt, title, body }).then((scheduled) => {
      id = scheduled;
      if (cancelled && id) void alerts.cancel(id);
    });
    return () => {
      cancelled = true;
      if (id) void alerts.cancel(id);
    };
  }, [endsAt, title, body]);
}
