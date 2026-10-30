import { useEffect, useRef } from 'react';

import { AppState } from 'react-native';

import {
  health,
  history,
  sessions,
  supabase,
  useMutation,
  useQuery,
  useQueryClient,
} from '@/shared/api';
import { now, toDateKey } from '@/shared/clock';
import { collectHealthDays, getHealthSource } from '@/shared/health';
import { useSession } from '@/shared/session';

import type { HealthPermissions } from '@/shared/health';
import type { health as api } from '@tracta/api';

/** Days kept in the cache for the Health screens (30-day views + the previous period). */
export const HEALTH_WINDOW_DAYS = 60;
/** Days read from the device on every sync. */
export const SYNC_DAYS = 30;
/** Foregrounding the app syncs again only after this long. */
const RESYNC_AFTER_MS = 5 * 60_000;

export const healthKeys = {
  all: ['health'] as const,
  connection: (userId: string | undefined) => ['health', 'connection', userId] as const,
  days: (userId: string | undefined, from: string, to: string) =>
    ['health', 'days', userId, from, to] as const,
};

/** First and last calendar day of the cached window, ending on the app's "today". */
export function healthWindow(days = HEALTH_WINDOW_DAYS): { from: string; to: string } {
  const end = now();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { from: toDateKey(start), to: toDateKey(end) };
}

/** The connected Health source (null = not connected). */
export function useHealthConnection() {
  const { user } = useSession();
  return useQuery({
    queryKey: healthKeys.connection(user?.id),
    queryFn: () => health.getConnection(supabase),
    enabled: Boolean(user),
  });
}

/** Synced days of the last 60 days, oldest first. */
export function useHealthDays() {
  const { user } = useSession();
  const { from, to } = healthWindow();
  return useQuery({
    queryKey: healthKeys.days(user?.id, from, to),
    queryFn: () => health.listDays(supabase, { from, to }),
    enabled: Boolean(user),
  });
}

/** Synced days between two calendar days (inclusive), oldest first. */
export function useHealthRange(from: string, to: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: healthKeys.days(user?.id, from, to),
    queryFn: () => health.listDays(supabase, { from, to }),
    enabled: Boolean(user),
  });
}

/** One synced day (any date), or null. */
export function useHealthDay(day: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: healthKeys.days(user?.id, day, day),
    queryFn: async () => (await health.listDays(supabase, { from: day, to: day }))[0] ?? null,
    enabled: Boolean(user),
  });
}

function invalidateAfterSync(queryClient: ReturnType<typeof useQueryClient>) {
  // Steps also feed the friends' feed and the challenges.
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: healthKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['social'] }),
  ]);
}

/** Reads the last 30 days from the device and upserts them. Resolves the sync instant. */
async function runSync(): Promise<string | null> {
  const source = await getHealthSource();
  if (!source) return null;
  const days = await collectHealthDays(source, now(), SYNC_DAYS);
  return health.syncDays(supabase, { source: source.kind, days });
}

export function useHealthSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['health', 'sync'],
    mutationFn: runSync,
    onSuccess: () => invalidateAfterSync(queryClient),
  });
}

export class HealthPermissionDenied extends Error {
  constructor() {
    super('Health permission denied');
    this.name = 'HealthPermissionDenied';
  }
}

/**
 * Asks the device for the chosen data types, records the connection and runs the first sync.
 * Rejects with HealthPermissionDenied when the user declines (or no Health store exists).
 */
export function useConnectHealth() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: async (permissions: HealthPermissions): Promise<api.HealthConnection> => {
      const source = await getHealthSource();
      if (!source || !(await source.requestPermissions(permissions))) {
        throw new HealthPermissionDenied();
      }
      const connection = await health.connect(supabase, {
        source: source.kind,
        readTypes: [...permissions.read],
        writeTypes: [...permissions.write],
      });
      queryClient.setQueryData(healthKeys.connection(user?.id), connection);
      await runSync();
      return connection;
    },
    onSettled: () => invalidateAfterSync(queryClient),
  });
}

/** Stops syncing; with `deleteData` also removes every synced day from the server. */
export function useDisconnectHealth() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: (options: { deleteData?: boolean } = {}) => health.disconnect(supabase, options),
    onSuccess: () => {
      queryClient.setQueryData(healthKeys.connection(user?.id), null);
      return invalidateAfterSync(queryClient);
    },
  });
}

/** Deletes the synced health days (the connection stays as it is). */
export function useDeleteHealthData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => health.deleteHealthData(supabase),
    onSuccess: () => invalidateAfterSync(queryClient),
  });
}

/**
 * Syncs once the signed-in user has a connection, and again when the app returns to the
 * foreground (at most every 5 minutes). Mount it on a screen that lives for the whole session.
 */
export function useAutoHealthSync() {
  const { data: connection } = useHealthConnection();
  const { mutate, isPending } = useHealthSync();
  const lastRun = useRef(0);
  const connected = Boolean(connection);

  useEffect(() => {
    if (!connected) return;
    const run = () => {
      if (isPending || Date.now() - lastRun.current < RESYNC_AFTER_MS) return;
      lastRun.current = Date.now();
      mutate();
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [connected, isPending, mutate]);
}

/** History entries (sessions + activities) of the cached window: training days, runs, report. */
export function useHealthEntries() {
  const { user } = useSession();
  const { from, to } = healthWindow();
  return useQuery({
    // Under ['history'] so saving a session or a run refreshes the Health screens too.
    queryKey: ['history', 'health-window', user?.id, from, to],
    queryFn: async () => {
      const start = keyStart(from);
      const end = keyStart(to);
      end.setDate(end.getDate() + 1);
      return (
        await history.getMonth(supabase, { from: start.toISOString(), to: end.toISOString() })
      ).entries;
    },
    enabled: Boolean(user),
  });
}

/** Dates (ISO) of the current personal records, for the report's "records" tile. */
export function useRecordDates() {
  const { user } = useSession();
  return useQuery({
    queryKey: ['history', 'record-dates', user?.id],
    queryFn: async () => (await sessions.listPersonalRecords(supabase)).map((r) => r.achievedAt),
    enabled: Boolean(user),
  });
}

function keyStart(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
