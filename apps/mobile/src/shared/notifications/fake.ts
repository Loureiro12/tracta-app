import type { Alerts } from './types';

/** E2E builds: no permission prompt, nothing scheduled. */
export const fakeAlerts: Alerts = {
  ensurePermission: async () => true,
  schedule: async () => null,
  cancel: async () => {},
};
