import { testId } from '@tracta/design-system';

/**
 * Single source of truth for Inbox test IDs. Flows live in e2e/flows/inbox.
 * The list prefix `inbox.items` derives group cards (`.today`, `.week`, `.<group>.label`) and rows
 * (`inbox.items.<id>` with `.open`, `.title`, `.unread`, `.remove`).
 */
export const inboxIds = {
  screen: testId('inbox', 'screen'),
  back: testId('inbox', 'back'),
  title: testId('inbox', 'title'),
  readAll: testId('inbox', 'read-all'),
  systemOff: testId('inbox', 'system-off'),
  systemOffCta: testId('inbox', 'system-off', 'cta'),
  empty: testId('inbox', 'empty'),
  items: testId('inbox', 'items'),
} as const;
