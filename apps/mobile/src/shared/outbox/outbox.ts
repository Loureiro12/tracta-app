import AsyncStorage from '@react-native-async-storage/async-storage';

import { activities, ApiError, health, queryClient, sessions, supabase } from '@/shared/api';
import { getHealthSource } from '@/shared/health';
import { isOnline } from '@/shared/network';

import { useOutboxStore } from './outbox.store';

import type { OutboxEntry, OutboxPayload } from './outbox.types';
import type { WorkoutKind } from '@/shared/health';

/**
 * One key per item: a long GPS route can take hundreds of KB and Android can't read a single
 * AsyncStorage value over 2 MB, so a shared list could lose every queued workout at once.
 */
const KEY_PREFIX = 'tracta.outbox.';
/** How long saving waits for the server before telling the user it will upload later. */
const SEND_GRACE_MS = 4000;
/** Failures of unknown cause tolerated before showing "Sync failed". */
const MAX_ATTEMPTS = 5;
/** The request can't succeed by repeating it; only the user retrying should try again. */
const PERMANENT: ReadonlySet<string> = new Set([
  'validation',
  'forbidden',
  'not_found',
  'conflict',
]);
/** Not about this item: stop here and try the whole queue again later. */
const TRANSIENT: ReadonlySet<string> = new Set(['network', 'not_authenticated', 'rate_limited']);

const HEALTH_KIND: Partial<Record<string, WorkoutKind>> = { run: 'run', walk: 'walk' };
const SESSION_QUERIES = [['history'], ['sessions'], ['routines'], ['exercises']];
const ACTIVITY_QUERIES = [['history']];

const attempts = new Map<string, number>();
let loaded: Promise<void> | null = null;
let flushing: Promise<void> | null = null;

/** Not security-sensitive and unique per user on the server, so Math.random is enough. */
function newClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16),
  );
}

/** Reads what a previous run left behind. Values are read one by one for the same 2 MB limit. */
export function loadOutbox(): Promise<void> {
  loaded ??= (async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(KEY_PREFIX));
    const entries: OutboxEntry[] = [];
    for (const key of keys) {
      const raw = await AsyncStorage.getItem(key);
      if (raw) entries.push(JSON.parse(raw) as OutboxEntry);
    }
    entries.sort((a, b) => a.createdAt - b.createdAt);
    useOutboxStore.setState({ entries });
  })();
  return loaded;
}

/** Best effort: the activity is already saved, so failures are ignored. */
async function writeActivityToHealth(entry: OutboxEntry): Promise<void> {
  if (entry.kind !== 'activity') return;
  const input = entry.payload;
  const connection = await health.getConnection(supabase);
  if (!connection?.writeTypes.includes('workouts')) return;
  const source = await getHealthSource(connection.source);
  if (!source) return;
  const start = new Date(input.startedAt);
  const distance = connection.writeTypes.includes('distance') ? input.distanceM : undefined;
  await source.saveWorkout({
    kind: HEALTH_KIND[input.kind] ?? 'other',
    start,
    end: new Date(start.getTime() + input.durationSeconds * 1000),
    ...(distance ? { distanceM: distance } : {}),
  });
}

async function send(entry: OutboxEntry): Promise<void> {
  if (entry.kind === 'session') await sessions.saveSession(supabase, entry.payload);
  else await activities.saveActivity(supabase, entry.payload);
}

async function remove(entry: OutboxEntry): Promise<void> {
  await AsyncStorage.removeItem(KEY_PREFIX + entry.id);
  attempts.delete(entry.id);
  useOutboxStore.setState((s) => ({
    entries: s.entries.filter((e) => e.id !== entry.id),
    failed: s.failed.filter((id) => id !== entry.id),
  }));
}

function markFailed(id: string) {
  useOutboxStore.setState((s) => ({ failed: [...s.failed, id] }));
}

async function drain(userId: string, retryFailed: boolean): Promise<void> {
  await loadOutbox();
  if (retryFailed) {
    attempts.clear();
    useOutboxStore.setState({ failed: [] });
  }
  const { entries, failed } = useOutboxStore.getState();
  const queue = entries.filter((e) => e.userId === userId && !failed.includes(e.id));
  for (const entry of queue) {
    if (!isOnline()) return;
    try {
      await send(entry);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 'unknown';
      const tries = (attempts.get(entry.id) ?? 0) + 1;
      attempts.set(entry.id, tries);
      if (PERMANENT.has(code) || tries >= MAX_ATTEMPTS) markFailed(entry.id);
      if (TRANSIENT.has(code)) return;
      continue;
    }
    await remove(entry);
    await Promise.all(
      (entry.kind === 'session' ? SESSION_QUERIES : ACTIVITY_QUERIES).map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
    void writeActivityToHealth(entry).catch(() => undefined);
  }
}

/**
 * Sends this user's queue, oldest first. Only one run at a time: a call during a run waits for
 * it. `retryFailed` also tries the items that gave up.
 */
export function flushOutbox(
  userId: string,
  options: { retryFailed?: boolean } = {},
): Promise<void> {
  flushing ??= drain(userId, options.retryFailed ?? false).finally(() => {
    flushing = null;
  });
  return flushing;
}

/**
 * Stores a finished workout/activity on the device, then tries to send it. Resolves once it is
 * safe on the device; rejects only if the device couldn't store it. `sent` tells whether the
 * server already has it.
 */
export async function saveThroughOutbox(
  userId: string,
  item: OutboxPayload,
): Promise<{ sent: boolean }> {
  await loadOutbox();
  const id = newClientId();
  const entry = {
    ...item,
    id,
    userId,
    createdAt: Date.now(),
    payload: { ...item.payload, clientId: id },
  } as OutboxEntry;
  await AsyncStorage.setItem(KEY_PREFIX + id, JSON.stringify(entry));
  useOutboxStore.setState((s) => ({ entries: [...s.entries, entry] }));

  let timer: ReturnType<typeof setTimeout> | undefined;
  const grace = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, SEND_GRACE_MS);
  });
  // A run that started before this item doesn't include it, so one more follows it.
  const delivery = flushOutbox(userId).then(() => flushOutbox(userId));
  await Promise.race([delivery, grace]);
  clearTimeout(timer);
  return { sent: !useOutboxStore.getState().entries.some((e) => e.id === id) };
}

/** Removes what this user still had queued (the account no longer exists). */
export async function discardOutbox(userId: string): Promise<void> {
  await loadOutbox();
  const mine = useOutboxStore.getState().entries.filter((e) => e.userId === userId);
  await Promise.all(mine.map(remove));
}
