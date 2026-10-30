import { useMemo } from 'react';

import { useLocationStore } from '@/shared/location';

import { useRunTicker } from './useRunTicker';
import { liveValues } from '../model/run.logic';
import { useRunStore } from '../model/run.store';

import type { LiveValues } from '../model/run.logic';

/** Derived values of the activity in progress, refreshed every second and on each GPS fix. */
export function useLiveRun(): LiveValues | null {
  const run = useRunStore((s) => s.run);
  const points = useLocationStore((s) => s.points);
  const now = useRunTicker(run !== null && run.pausedAt === null);
  return useMemo(() => (run ? liveValues(run, points, now) : null), [run, points, now]);
}
