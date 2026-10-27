import { useEffect } from 'react';

import { Linking } from 'react-native';

import { parse } from 'expo-linking';

import { onSettingsHydrated, useSettingsStore } from '@/features/settings';
import { changeLocale, initI18n, isSupportedLocale, resolveLocale } from '@/shared/i18n';

import { resources } from './resources';

import type { Locale } from '@/shared/i18n';
import type { PropsWithChildren } from 'react';

// Initialise synchronously at module load so the first render is already translated.
initI18n(resources, resolveLocale(useSettingsStore.getState().localePreference));

/** Reads `?locale=xx` from a deep link. Used by E2E flows and QA to pin a language. */
function localeFromUrl(url: string | null | undefined): Locale | null {
  if (!url) return null;
  const value = parse(url).queryParams?.locale;
  return typeof value === 'string' && isSupportedLocale(value) ? value : null;
}

export function I18nProvider({ children }: PropsWithChildren) {
  const preference = useSettingsStore((s) => s.localePreference);
  const setPreference = useSettingsStore((s) => s.setLocalePreference);

  // Keep i18next in sync with the (persisted) preference.
  useEffect(() => {
    changeLocale(resolveLocale(preference));
  }, [preference]);

  // Deep-link override: tracta://<route>?locale=pt-BR
  // Applied after hydration, otherwise the persisted snapshot would overwrite it.
  useEffect(() => {
    const apply = (url: string | null | undefined) => {
      const locale = localeFromUrl(url);
      if (locale) onSettingsHydrated(() => setPreference(locale));
    };
    void Linking.getInitialURL().then(apply);
    const subscription = Linking.addEventListener('url', ({ url }) => apply(url));
    return () => subscription.remove();
  }, [setPreference]);

  return children;
}
