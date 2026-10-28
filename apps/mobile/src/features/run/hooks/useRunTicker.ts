import { useEffect, useState } from 'react';

/** Re-renders once a second while `active`, returning the current epoch ms. */
export function useRunTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}
