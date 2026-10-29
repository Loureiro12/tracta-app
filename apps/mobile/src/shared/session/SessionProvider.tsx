import { useEffect } from 'react';

import { auth, queryClient, supabase } from '@/shared/api';

import { useSessionStore } from './session.store';

import type { PropsWithChildren } from 'react';

/** Restores the persisted session on launch and keeps the session store in sync. */
export function SessionProvider({ children }: PropsWithChildren) {
  const setUser = useSessionStore((s) => s.setUser);

  useEffect(() => {
    let mounted = true;
    void auth.getCurrentUser(supabase).then((user) => {
      if (mounted) setUser(user);
    });
    const unsubscribe = auth.onAuthChange(supabase, (user) => {
      // A different (or no) user must never see the previous user's cached data.
      if (useSessionStore.getState().user?.id !== user?.id) queryClient.clear();
      setUser(user);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setUser]);

  return children;
}
