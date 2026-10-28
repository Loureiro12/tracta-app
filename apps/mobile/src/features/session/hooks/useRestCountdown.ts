import { useEffect } from 'react';

import { useSessionStore } from '../model/session.store';

/** Decrements the rest countdown every second and fires `onDone` when it reaches zero. */
export function useRestCountdown(onDone: () => void) {
  const counting = useSessionStore((s) => !!s.rest && !s.rest.paused && s.rest.remainingSec > 0);
  const finished = useSessionStore((s) => !!s.rest && s.rest.remainingSec === 0);
  const restTick = useSessionStore((s) => s.restTick);

  useEffect(() => {
    if (!counting) return;
    const id = setInterval(restTick, 1000);
    return () => clearInterval(id);
  }, [counting, restTick]);

  useEffect(() => {
    if (finished) onDone();
  }, [finished, onDone]);
}
