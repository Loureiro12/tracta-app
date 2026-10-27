import { create } from 'zustand';

import type { ThemePreference } from '@tracta/design-system';

type SettingsState = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  setThemePreference: (themePreference) => set({ themePreference }),
}));
