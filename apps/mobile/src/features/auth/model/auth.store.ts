import { create } from 'zustand';

import { DEFAULT_PERMISSIONS, READ_TYPES } from './auth.mock';

import type { PermissionKey } from './auth.mock';

type AuthState = {
  /** Last e-mail typed in a form; carried over to the "check your e-mail" screen. */
  email: string;
  /** A Health connection (permission prompt + first import) is running. */
  healthBusy: boolean;
  googleNotify: boolean;
  gps: boolean;
  notifications: boolean;
  permissions: Record<PermissionKey, boolean>;
  setEmail: (email: string) => void;
  togglePermission: (key: PermissionKey) => void;
  setAllRead: (on: boolean) => void;
  setGoogleNotify: (on: boolean) => void;
  setGps: (on: boolean) => void;
  setNotifications: (on: boolean) => void;
  setHealthBusy: (busy: boolean) => void;
};

/**
 * In-memory auth/connections UI state. Whether Health is connected is server state
 * (`useHealthConnection` from the health feature); GPS/notification switches stay local.
 */
export const useAuthStore = create<AuthState>((set) => ({
  email: '',
  healthBusy: false,
  googleNotify: false,
  gps: false,
  notifications: false,
  permissions: DEFAULT_PERMISSIONS,
  setEmail: (email) => set({ email }),
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
  setHealthBusy: (healthBusy) => set({ healthBusy }),
}));
