import { useEffect } from 'react';

import { useSessionStore } from '../model/session.store';

/** Advances the elapsed timer once per second while a session is running (mock, in-memory). */
export function useSessionTicker() {
  const running = useSessionStore((s) => !!s.session && !s.session.paused);
  const tick = useSessionStore((s) => s.tick);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, tick]);
}
