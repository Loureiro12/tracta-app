import { create } from 'zustand';

import type { ChallengeDraft } from './social.types';

type SocialState = {
  /** E-mail invites (no backend yet): shown as "waiting for sign-up" for this session. */
  emailInvites: string[];
  /** Dev affordance: hides friends, invites and challenges so the empty state can be reached. */
  simulateNoFriends: boolean;
  draft: ChallengeDraft | null;

  inviteEmail: (email: string) => void;
  setSimulateNoFriends: (value: boolean) => void;
  /** Starts the wizard with every friend selected. */
  startDraft: (friendIds: string[]) => void;
  updateDraft: (patch: Partial<ChallengeDraft>) => void;
  toggleDraftMember: (id: string) => void;
  clearDraft: () => void;
};

/** Local UI state of the Social feature; server data lives in the React Query hooks (api/). */
export const useSocialStore = create<SocialState>((set) => ({
  emailInvites: [],
  simulateNoFriends: false,
  draft: null,

  inviteEmail: (email) =>
    set((s) => {
      const key = email.toLowerCase();
      return s.emailInvites.includes(key) ? s : { emailInvites: [...s.emailInvites, key] };
    }),
  setSimulateNoFriends: (simulateNoFriends) => set({ simulateNoFriends }),
  startDraft: (friendIds) =>
    set({
      draft: {
        step: 1,
        type: 'day',
        min: 20,
        days: 7,
        start: 'today',
        members: [...friendIds],
        name: '',
      },
    }),
  updateDraft: (patch) => set((s) => (s.draft ? { draft: { ...s.draft, ...patch } } : {})),
  toggleDraftMember: (id) =>
    set((s) => {
      if (!s.draft) return {};
      const members = s.draft.members.includes(id)
        ? s.draft.members.filter((m) => m !== id)
        : [...s.draft.members, id];
      return { draft: { ...s.draft, members } };
    }),
  clearDraft: () => set({ draft: null }),
}));
