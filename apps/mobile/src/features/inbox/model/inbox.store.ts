import { create } from 'zustand';

import { inboxItems } from './inbox.mock';

import type { InboxItemId } from './inbox.mock';

type InboxState = {
  read: InboxItemId[];
  removed: InboxItemId[];
  /** OS notifications disabled (prototype default): shows the warning strip. */
  systemNotificationsOff: boolean;
  markRead: (id: InboxItemId) => void;
  markAllRead: () => void;
  remove: (id: InboxItemId) => void;
};

/** Read/removed state of the mock notifications. In-memory only for now. */
export const useInboxStore = create<InboxState>((set) => ({
  read: [],
  removed: [],
  systemNotificationsOff: true,
  markRead: (id) => set((s) => (s.read.includes(id) ? s : { read: [...s.read, id] })),
  markAllRead: () => set({ read: inboxItems.map((item) => item.id) }),
  remove: (id) => set((s) => (s.removed.includes(id) ? s : { removed: [...s.removed, id] })),
}));
