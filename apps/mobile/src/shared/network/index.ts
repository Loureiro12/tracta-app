// Device connectivity behind one store. E2E builds can't cut the simulator's network, so they
// simulate it from Settings: every Supabase request then fails as it would with no internet.
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

import { env } from '@/shared/config/env';

import { isOnline, useNetworkStore } from './network.store';

const SIMULATED_KEY = 'tracta.e2e.simulated-offline';

function applySimulation(offline: boolean) {
  useNetworkStore.setState({ simulatedOffline: offline, isOnline: !offline });
}

/** E2E only. Survives restarts so flows can cold start the app with no internet. */
export async function setSimulatedOffline(offline: boolean): Promise<void> {
  applySimulation(offline);
  await AsyncStorage.setItem(SIMULATED_KEY, offline ? '1' : '0');
}

/** Follows connectivity and tells React Query. Call once, before the first request. */
export async function startNetworkMonitoring(): Promise<void> {
  onlineManager.setEventListener((setOnline) =>
    useNetworkStore.subscribe((s) => setOnline(s.isOnline)),
  );
  if (env.isE2E) {
    applySimulation((await AsyncStorage.getItem(SIMULATED_KEY)) === '1');
    return;
  }
  // `isInternetReachable` is null until it is known: only an explicit false counts as offline.
  NetInfo.addEventListener((state) =>
    useNetworkStore
      .getState()
      .setOnline(state.isConnected !== false && state.isInternetReachable !== false),
  );
}

/** Fails like a device with no internet while the E2E simulation is on. */
export const simulatedFetch: typeof fetch = (input, init) =>
  useNetworkStore.getState().simulatedOffline
    ? Promise.reject(new TypeError('Network request failed'))
    : fetch(input, init);

export { isOnline, useNetworkStore };
export const useIsOnline = () => useNetworkStore((s) => s.isOnline);
export const useSimulatedOffline = () => useNetworkStore((s) => s.simulatedOffline);
