import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { LocalePreference } from '@/shared/i18n';
import type { ThemePreference } from '@tracta/design-system';

type SettingsState = {
  themePreference: ThemePreference;
  localePreference: LocalePreference;
  setThemePreference: (preference: ThemePreference) => void;
  setLocalePreference: (preference: LocalePreference) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      localePreference: 'system',
      setThemePreference: (themePreference) => set({ themePreference }),
      setLocalePreference: (localePreference) => set({ localePreference }),
    }),
    {
      name: 'tracta.settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        themePreference: s.themePreference,
        localePreference: s.localePreference,
      }),
    },
  ),
);

/**
 * Runs `callback` once the persisted settings have been restored from storage.
 * Writes made before hydration would be overwritten by the stored snapshot.
 */
export function onSettingsHydrated(callback: () => void): () => void {
  if (useSettingsStore.persist.hasHydrated()) {
    callback();
    return () => {};
  }
  return useSettingsStore.persist.onFinishHydration(() => callback());
}
