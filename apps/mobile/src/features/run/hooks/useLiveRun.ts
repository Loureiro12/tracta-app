import { useMemo } from 'react';

import { useRunTicker } from './useRunTicker';
import { liveValues } from '../model/run.logic';
import { useRunStore } from '../model/run.store';

import type { LiveValues } from '../model/run.logic';

/** Derived values of the activity in progress, refreshed every second while it runs. */
export function useLiveRun(): LiveValues | null {
  const run = useRunStore((s) => s.run);
  const now = useRunTicker(run !== null && run.pausedAt === null);
  return useMemo(() => (run ? liveValues(run, now) : null), [run, now]);
}
