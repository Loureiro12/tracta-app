import { getLocales } from 'expo-localization';

/** Locales shipped with the app. The first one is the fallback. */
export const SUPPORTED_LOCALES = ['en', 'pt-BR'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** What the user can pick: follow the device, or force a supported locale. */
export type LocalePreference = Locale | 'system';

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Maps any BCP 47 tag to a supported locale: exact match first, then language match
 * (`pt-PT` → `pt-BR`, `en-GB` → `en`), then the default.
 */
export function matchLocale(tag: string | null | undefined): Locale {
  if (!tag) return DEFAULT_LOCALE;
  if (isSupportedLocale(tag)) return tag;
  const language = tag.split('-')[0]?.toLowerCase();
  return SUPPORTED_LOCALES.find((l) => l.split('-')[0] === language) ?? DEFAULT_LOCALE;
}

/** Device locale (first entry of the OS preference list) resolved to a supported locale. */
export function getDeviceLocale(): Locale {
  return matchLocale(getLocales()[0]?.languageTag);
}

export function resolveLocale(preference: LocalePreference): Locale {
  return preference === 'system' ? getDeviceLocale() : preference;
}
