import { useCallback, useEffect, useState } from 'react';

/** Counts down from `seconds` to 0 once per second; `restart` rewinds it. */
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const running = remaining > 0;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  const restart = useCallback(() => setRemaining(seconds), [seconds]);
  return { remaining, restart };
}
