import { create } from 'zustand';

type NetworkState = {
  isOnline: boolean;
  /** E2E only: pretends the device has no internet (see `simulatedFetch`). */
  simulatedOffline: boolean;
  setOnline: (isOnline: boolean) => void;
};

/** Whether the device has internet. Written only by this module. */
export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  simulatedOffline: false,
  setOnline: (isOnline) => set({ isOnline }),
}));

export const isOnline = () => useNetworkStore.getState().isOnline;
