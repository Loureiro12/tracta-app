import { LogBox } from 'react-native';

import { QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@tracta/design-system';

import { useSettingsStore } from '@/features/settings';
import { queryClient } from '@/shared/api';
import { env } from '@/shared/config/env';
import { defineLocationTask } from '@/shared/location';
import { SessionProvider } from '@/shared/session';

import { I18nProvider } from './i18n/I18nProvider';

import type { PropsWithChildren } from 'react';

// Debug builds driven by Maestro must not show the LogBox warning strip: it covers bottom CTAs.
if (env.isE2E) LogBox.ignoreAllLogs(true);

// expo-task-manager needs background tasks defined at module scope of the entry (GPS runs).
defineLocationTask();

/** Composition root for every global provider. Keep it flat and ordered. */
export function AppProviders({ children }: PropsWithChildren) {
  const themePreference = useSettingsStore((s) => s.themePreference);
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <I18nProvider>
          <ThemeProvider preference={themePreference}>{children}</ThemeProvider>
        </I18nProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
