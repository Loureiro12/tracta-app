import { LogBox } from 'react-native';

import { ThemeProvider } from '@tracta/design-system';

import { useSettingsStore } from '@/features/settings';
import { env } from '@/shared/config/env';

import { I18nProvider } from './i18n/I18nProvider';

import type { PropsWithChildren } from 'react';

// Debug builds driven by Maestro must not show the LogBox warning strip: it covers bottom CTAs.
if (env.isE2E) LogBox.ignoreAllLogs(true);

/** Composition root for every global provider. Keep it flat and ordered. */
export function AppProviders({ children }: PropsWithChildren) {
  const themePreference = useSettingsStore((s) => s.themePreference);
  return (
    <I18nProvider>
      <ThemeProvider preference={themePreference}>{children}</ThemeProvider>
    </I18nProvider>
  );
}
