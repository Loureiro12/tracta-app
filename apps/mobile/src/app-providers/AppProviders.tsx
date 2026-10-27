import { ThemeProvider } from '@tracta/design-system';

import { useSettingsStore } from '@/features/settings';

import type { PropsWithChildren } from 'react';

/** Composition root for every global provider. Keep it flat and ordered. */
export function AppProviders({ children }: PropsWithChildren) {
  const themePreference = useSettingsStore((s) => s.themePreference);
  return <ThemeProvider preference={themePreference}>{children}</ThemeProvider>;
}
