import { createContext, useContext, useMemo } from 'react';

import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme } from './themes';

import type { ColorScheme, Theme } from './types';
import type { PropsWithChildren } from 'react';

export type ThemePreference = ColorScheme | 'system';

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = PropsWithChildren<{
  /** "system" follows the OS; "light" | "dark" forces a scheme. */
  preference?: ThemePreference;
}>;

export function ThemeProvider({ preference = 'system', children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ColorScheme =
      preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
    return { theme: scheme === 'dark' ? darkTheme : lightTheme, preference };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return ctx.theme;
}

export function useThemePreference(): ThemePreference {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used inside <ThemeProvider>.');
  }
  return ctx.preference;
}
