import { create } from 'zustand';

import { DEFAULT_PERMISSIONS, HEALTH_IMPORT_MS, READ_TYPES, SOCIAL_ACCOUNTS } from './auth.mock';

import type { PermissionKey, SocialProvider } from './auth.mock';

export type HealthStatus = 'off' | 'busy' | 'on';
export type Account = { name: string; email: string };

type AuthState = {
  account: Account | null;
  /** Last e-mail typed in a form; carried over to the "check your e-mail" screen. */
  email: string;
  health: HealthStatus;
  googleNotify: boolean;
  gps: boolean;
  notifications: boolean;
  permissions: Record<PermissionKey, boolean>;
  setEmail: (email: string) => void;
  signIn: (account: Account) => void;
  signInWith: (provider: SocialProvider) => void;
  togglePermission: (key: PermissionKey) => void;
  setAllRead: (on: boolean) => void;
  setGoogleNotify: (on: boolean) => void;
  setGps: (on: boolean) => void;
  setNotifications: (on: boolean) => void;
  /** Mock import: "busy" for a moment, then "on". `onConnected` fires when it finishes. */
  connectHealth: (onConnected?: () => void) => void;
};

let healthTimer: ReturnType<typeof setTimeout> | null = null;

/** In-memory auth/connections state (layout phase: no backend, no native APIs). */
export const useAuthStore = create<AuthState>((set) => ({
  account: null,
  email: '',
  health: 'off',
  googleNotify: false,
  gps: false,
  notifications: false,
  permissions: DEFAULT_PERMISSIONS,
  setEmail: (email) => set({ email }),
  signIn: (account) => set({ account, email: account.email }),
  signInWith: (provider) => set({ account: SOCIAL_ACCOUNTS[provider] }),
  togglePermission: (key) =>
    set((s) => ({ permissions: { ...s.permissions, [key]: !s.permissions[key] } })),
  setAllRead: (on) =>
    set((s) => {
      const permissions = { ...s.permissions };
      for (const type of READ_TYPES) permissions[`read.${type}`] = on;
      return { permissions };
    }),
  setGoogleNotify: (googleNotify) => set({ googleNotify }),
  setGps: (gps) => set({ gps }),
  setNotifications: (notifications) => set({ notifications }),
  connectHealth: (onConnected) => {
    if (healthTimer) clearTimeout(healthTimer);
    set({ health: 'busy' });
    healthTimer = setTimeout(() => {
      healthTimer = null;
      set({ health: 'on' });
      onConnected?.();
    }, HEALTH_IMPORT_MS);
  },
}));
