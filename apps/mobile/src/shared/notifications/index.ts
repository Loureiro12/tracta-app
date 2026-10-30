// Local alerts with sound (timer endings) behind one interface; E2E uses a no-op fake.
import { env } from '@/shared/config/env';

import { deviceAlerts } from './device';
import { fakeAlerts } from './fake';

import type { Alerts } from './types';

export const alerts: Alerts = env.isE2E ? fakeAlerts : deviceAlerts;
export type { Alerts, ScheduledAlert } from './types';
