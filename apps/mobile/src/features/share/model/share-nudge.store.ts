import { create } from 'zustand';

import { env } from '@/shared/config/env';

import type { ShareTemplate } from './share.mock';

export type ShareNudge = {
  template: ShareTemplate;
  title: string;
  description?: string;
};

type ShareNudgeState = {
  nudge: ShareNudge | null;
  /** Shows the "Criar cartão" nudge; it hides itself after `NUDGE_TIMEOUT_MS`. */
  showNudge: (nudge: ShareNudge) => void;
  hideNudge: () => void;
};

/** The post-save nudge disappears after 7 s (handoff §11). */
/** 7 s in the design; longer under Maestro so the assertion window is not missed. */
export const NUDGE_TIMEOUT_MS = env.isE2E ? 30000 : 7000;

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Transient state of the post-save "Criar cartão" nudge. The route `/share/nudge`
 * (ShareNudgeScreen) is the default host; any screen may also render <ShareNudge> from it.
 */
export const useShareNudgeStore = create<ShareNudgeState>((set) => ({
  nudge: null,
  showNudge: (nudge) => {
    if (timer) clearTimeout(timer);
    set({ nudge });
    timer = setTimeout(() => {
      timer = null;
      set({ nudge: null });
    }, NUDGE_TIMEOUT_MS);
  },
  hideNudge: () => {
    if (timer) clearTimeout(timer);
    timer = null;
    set({ nudge: null });
  },
}));
