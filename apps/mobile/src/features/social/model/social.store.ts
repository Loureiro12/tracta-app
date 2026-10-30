import { create } from 'zustand';

import type { ChallengeDraft } from './social.types';

type SocialState = {
  /** Dev affordance: hides friends, invites and challenges so the empty state can be reached. */
  simulateNoFriends: boolean;
  draft: ChallengeDraft | null;

  setSimulateNoFriends: (value: boolean) => void;
  /** Starts the wizard with every friend selected. */
  startDraft: (friendIds: string[]) => void;
  updateDraft: (patch: Partial<ChallengeDraft>) => void;
  toggleDraftMember: (id: string) => void;
  clearDraft: () => void;
};

/** Local UI state of the Social feature; server data lives in the React Query hooks (api/). */
export const useSocialStore = create<SocialState>((set) => ({
  simulateNoFriends: false,
  draft: null,

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
