import { create } from 'zustand';

type InboxState = {
  /** OS notifications disabled (prototype default): shows the warning strip. */
  systemNotificationsOff: boolean;
  setSystemNotificationsOff: (value: boolean) => void;
};

/** Device-side inbox state (the notifications themselves are server state, see api/). */
export const useInboxStore = create<InboxState>((set) => ({
  systemNotificationsOff: true,
  setSystemNotificationsOff: (systemNotificationsOff) => set({ systemNotificationsOff }),
}));
