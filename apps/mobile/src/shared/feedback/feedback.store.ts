import { create } from 'zustand';

import { env } from '@/shared/config/env';

/** 2.2 s in the design; longer under Maestro, whose hierarchy snapshots in Debug can take over a second. */
const TOAST_MS = env.isE2E ? 6000 : 2200;

export type BannerState = {
  variant: 'offline' | 'sync';
  title: string;
  description: string;
  ctaLabel?: string;
} | null;
export type MiniPlayerState = { title: string; subtitle: string; href: string } | null;

type FeedbackState = {
  toast: string | null;
  banner: BannerState;
  /** Floating "Retomar" bar shown above the tab bar while a session/run is minimized. */
  miniPlayer: MiniPlayerState;
  /** Number of modal sheets currently hosting their own AppChrome (the root instance hides meanwhile). */
  sheetHosts: number;
  registerSheetHost: () => void;
  unregisterSheetHost: () => void;
  showToast: (message: string, durationMs?: number) => void;
  hideToast: () => void;
  setBanner: (banner: BannerState) => void;
  setMiniPlayer: (mini: MiniPlayerState) => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

/** App-wide transient UI: toast (2.2s), status banner and mini-player. Any feature may write here. */
export const useFeedbackStore = create<FeedbackState>((set) => ({
  toast: null,
  banner: null,
  miniPlayer: null,
  sheetHosts: 0,
  registerSheetHost: () => set((s) => ({ sheetHosts: s.sheetHosts + 1 })),
  unregisterSheetHost: () => set((s) => ({ sheetHosts: Math.max(0, s.sheetHosts - 1) })),
  showToast: (message, durationMs = TOAST_MS) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), durationMs);
  },
  hideToast: () => set({ toast: null }),
  setBanner: (banner) => set({ banner }),
  setMiniPlayer: (miniPlayer) => set({ miniPlayer }),
}));
