import { create } from 'zustand';

import type { OutboxEntry } from './outbox.types';

type OutboxState = {
  entries: OutboxEntry[];
  /** Ids that stopped being retried automatically; the user sees "Sync failed" for them. */
  failed: string[];
};

export const useOutboxStore = create<OutboxState>(() => ({ entries: [], failed: [] }));

/** How many of this user's items wait for the server, and how many of those gave up. */
export function useOutboxStatus(userId: string | undefined) {
  const pending = useOutboxStore((s) => s.entries.filter((e) => e.userId === userId).length);
  const failed = useOutboxStore(
    (s) => s.entries.filter((e) => e.userId === userId && s.failed.includes(e.id)).length,
  );
  return { pending, failed };
}
