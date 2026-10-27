import 'intl-pluralrules'; // no-op when the runtime already ships Intl.PluralRules
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales';

import type { Locale } from './locales';
import type { Resource } from 'i18next';

/** The app's single i18next instance. Only this module and the composition root may touch it. */
export const i18n = createInstance();

/**
 * Initialises the instance synchronously so the first render is already translated.
 * Resources are injected by the composition root (app-providers) so that
 * shared code never depends on features.
 */
export function initI18n(resources: Resource, initialLocale: Locale) {
  if (i18n.isInitialized) return i18n;
  void i18n.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    defaultNS: 'common',
    interpolation: { escapeValue: false }, // React already escapes
    returnNull: false,
    initAsync: false,
  });
  return i18n;
}

export function changeLocale(locale: Locale) {
  if (i18n.language !== locale) void i18n.changeLanguage(locale);
}

export function getCurrentLocale(): Locale {
  return (i18n.language as Locale | undefined) ?? DEFAULT_LOCALE;
}
