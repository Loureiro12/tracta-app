import { useEffect } from 'react';

import { useSessionStore } from '../model/session.store';

/**
 * Re-counts the elapsed time from the wall clock once per second while a session is running, so
 * the timer catches up after the phone was locked (see `countSeconds`).
 */
export function useSessionTicker() {
  const running = useSessionStore((s) => !!s.session && !s.session.paused);
  const tick = useSessionStore((s) => s.tick);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, tick]);
}
