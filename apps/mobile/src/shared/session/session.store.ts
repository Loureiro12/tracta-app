import { create } from 'zustand';

import type { AuthUser } from '@tracta/api';

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

type SessionState = {
  status: SessionStatus;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
};

/** Mirrors the Supabase auth session. Written only by SessionProvider. */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  setUser: (user) => set({ user, status: user ? 'signedIn' : 'signedOut' }),
}));

export function useSession() {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);
  return { status, user };
}
