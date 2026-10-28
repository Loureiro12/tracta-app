import { create } from 'zustand';

import { friendById, initialChallenges, initialFriendIds } from './social.mock';

import type { Challenge, ChallengeDraft, PrivacyKey, SocialPrivacy } from './social.types';

type SocialState = {
  friendIds: string[];
  /** Friend ids or raw handles/e-mails invited and not yet accepted. */
  pendingInvites: string[];
  challenges: Challenge[];
  /** Ids of friends the user cheered today. */
  cheers: string[];
  privacy: SocialPrivacy;
  linkCopied: boolean;
  draft: ChallengeDraft | null;

  toggleCheer: (id: string) => void;
  /** Invites a contact or a raw handle; no-op when already a friend or pending. */
  invite: (idOrHandle: string) => void;
  copyLink: () => void;
  setPrivacy: (key: PrivacyKey, value: boolean) => void;
  /** Dev affordance: empties the friend list so the empty state can be reached. */
  clearFriends: () => void;

  startDraft: () => void;
  updateDraft: (patch: Partial<ChallengeDraft>) => void;
  toggleDraftMember: (id: string) => void;
  /** Creates the challenge from the draft and returns its id. */
  createChallenge: (fallbackName: string) => string;
  leaveChallenge: (id: string) => void;
};

/** Loads and personal records are private by default (prototype `sPriv`). */
const defaultPrivacy: SocialPrivacy = {
  done: true,
  kind: true,
  streak: true,
  loads: false,
  prs: false,
};

export const useSocialStore = create<SocialState>((set, get) => ({
  friendIds: [...initialFriendIds],
  pendingInvites: [],
  challenges: [...initialChallenges],
  cheers: [],
  privacy: defaultPrivacy,
  linkCopied: false,
  draft: null,

  toggleCheer: (id) =>
    set((s) => ({
      cheers: s.cheers.includes(id) ? s.cheers.filter((x) => x !== id) : [...s.cheers, id],
    })),
  invite: (idOrHandle) => {
    const known = friendById(idOrHandle.toLowerCase());
    const key = known ? known.id : idOrHandle;
    const { friendIds, pendingInvites } = get();
    if (friendIds.includes(key) || pendingInvites.includes(key)) return;
    set({ pendingInvites: [...pendingInvites, key] });
  },
  copyLink: () => set({ linkCopied: true }),
  setPrivacy: (key, value) => set((s) => ({ privacy: { ...s.privacy, [key]: value } })),
  clearFriends: () => set({ friendIds: [], pendingInvites: [], challenges: [] }),

  startDraft: () =>
    set((s) => ({
      draft: {
        step: 1,
        type: 'day',
        min: 20,
        days: 7,
        start: 'today',
        members: [...s.friendIds],
        name: '',
      },
    })),
  updateDraft: (patch) => set((s) => (s.draft ? { draft: { ...s.draft, ...patch } } : {})),
  toggleDraftMember: (id) =>
    set((s) => {
      if (!s.draft) return {};
      const members = s.draft.members.includes(id)
        ? s.draft.members.filter((m) => m !== id)
        : [...s.draft.members, id];
      return { draft: { ...s.draft, members } };
    }),
  createChallenge: (fallbackName) => {
    const d = get().draft;
    const id = `c${Date.now()}`;
    if (!d) return id;
    const challenge: Challenge = {
      id,
      name: d.name.trim() || fallbackName,
      type: d.type,
      min: d.min,
      days: d.days,
      start: d.start,
      members: d.members,
    };
    set((s) => ({ challenges: [challenge, ...s.challenges], draft: null }));
    return id;
  },
  leaveChallenge: (id) => set((s) => ({ challenges: s.challenges.filter((c) => c.id !== id) })),
}));
