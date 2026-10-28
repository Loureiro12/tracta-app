import { useCallback, useEffect, useRef } from 'react';

/**
 * Schedules a callback after `ms` (mock network latency) and cancels it when the
 * screen unmounts, so a pending "request" never updates an unmounted screen.
 */
export function useDelayedAction() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return useCallback((callback: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      callback();
    }, ms);
  }, []);
}
