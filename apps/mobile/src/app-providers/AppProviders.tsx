import { ThemeProvider } from '@tracta/design-system';

import { useSettingsStore } from '@/features/settings';

import { I18nProvider } from './i18n/I18nProvider';

import type { PropsWithChildren } from 'react';

/** Composition root for every global provider. Keep it flat and ordered. */
export function AppProviders({ children }: PropsWithChildren) {
  const themePreference = useSettingsStore((s) => s.themePreference);
  return (
    <I18nProvider>
      <ThemeProvider preference={themePreference}>{children}</ThemeProvider>
    </I18nProvider>
  );
}
