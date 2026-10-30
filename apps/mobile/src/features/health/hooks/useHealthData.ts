import { useMemo } from 'react';

import { now, today } from '@/shared/clock';
import { useAccount } from '@/shared/session';

import { useHealthConnection, useHealthDays, useHealthEntries } from '../api/useHealth';
import { lookup, timeOf } from '../lib/derive';

import type { HealthGoals } from '../lib/derive';

/** Database defaults (public.goals), used until the account loads. */
const DEFAULT_GOALS: HealthGoals = { steps: 10000, sleepMinutes: 450, workouts: 4 };

export function useHealthGoals(): HealthGoals {
  const goals = useAccount().data?.goals;
  return goals
    ? { steps: goals.steps, sleepMinutes: goals.sleepMinutes, workouts: goals.workoutsPerWeek }
    : DEFAULT_GOALS;
}

/**
 * Everything the Health screens read: synced days (as a day lookup), goals, the connection and
 * the time of the last sync ("16:12"), plus the history entries of the same window.
 */
export function useHealthData() {
  const days = useHealthDays();
  const entries = useHealthEntries();
  const { data: connection } = useHealthConnection();
  const goals = useHealthGoals();
  const todayKey = today();
  const get = useMemo(() => lookup(days.data), [days.data]);
  return {
    get,
    todayKey,
    currentHour: Math.min(23, now().getHours()),
    goals,
    entries: entries.data ?? [],
    connection: connection ?? null,
    syncTime: connection?.lastSyncedAt ? timeOf(connection.lastSyncedAt) : null,
    sourceName: connection?.source === 'health_connect' ? 'Health Connect' : 'Apple Health',
    isLoading: days.isLoading,
    isError: days.isError,
    refetch: days.refetch,
  };
}
