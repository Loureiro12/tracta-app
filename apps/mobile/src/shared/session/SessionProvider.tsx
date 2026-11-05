import { useEffect } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  auth,
  clearPersistedQueries,
  queryClient,
  startQueryPersistence,
  supabase,
} from '@/shared/api';
import { startNetworkMonitoring } from '@/shared/network';
import { loadOutbox } from '@/shared/outbox';

import { useSessionStore } from './session.store';

import type { AuthUser } from '@/shared/api';
import type { PropsWithChildren } from 'react';

const LAST_USER_KEY = 'tracta.session.last-user';
/**
 * With no internet and an expired token, getSession retries the refresh for ~30 s before it
 * answers. A returning user shouldn't wait for that; auth events correct it if it turns out wrong.
 */
const RESTORE_GRACE_MS = 3000;

async function readLastUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(LAST_USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

/** With a known user, gives up on the server after a moment and counts it as unreachable. */
function restoreUser(lastUser: AuthUser | null) {
  const restore = auth.restoreUser(supabase);
  if (!lastUser) return restore;
  const slow = new Promise<{ user: null; unreachable: true }>((resolve) =>
    setTimeout(() => resolve({ user: null, unreachable: true }), RESTORE_GRACE_MS),
  );
  return Promise.race([restore, slow]);
}

/**
 * Restores the persisted session and that user's cached data on launch, and keeps the session
 * store in sync. Losing the connection never signs anyone out: only an explicit SIGNED_OUT or a
 * launch with no stored session does.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const setUser = useSessionStore((s) => s.setUser);

  useEffect(() => {
    let mounted = true;
    let activeId: string | null = null;
    let stopPersistence: (() => void) | null = null;
    // Auth events and the launch below can overlap; applying them in order keeps one cache owner.
    let applying: Promise<void> = Promise.resolve();

    const switchTo = async (user: AuthUser | null) => {
      const id = user?.id ?? null;
      if (id !== activeId) {
        // A different (or no) user must never see the previous user's cached data.
        stopPersistence?.();
        stopPersistence = null;
        queryClient.clear();
        activeId = id;
        if (user) stopPersistence = await startQueryPersistence(user.id);
      }
      if (user) await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(user));
      if (mounted) setUser(user);
    };
    const apply = (user: AuthUser | null) => {
      applying = applying.then(() => switchTo(user));
      return applying;
    };

    const unsubscribe = auth.onAuthChange(supabase, (user, event) => {
      if (event === 'SIGNED_OUT') {
        const signedOutId = activeId;
        void AsyncStorage.removeItem(LAST_USER_KEY);
        if (signedOutId) void clearPersistedQueries(signedOutId);
        void apply(null);
      } else if (user) {
        void apply(user);
      }
    });

    void (async () => {
      await Promise.all([startNetworkMonitoring(), loadOutbox()]);
      const lastUser = await readLastUser();
      const { user, unreachable } = await restoreUser(lastUser);
      await apply(user ?? (unreachable ? lastUser : null));
    })();

    return () => {
      mounted = false;
      unsubscribe();
      stopPersistence?.();
    };
  }, [setUser]);

  return children;
}
