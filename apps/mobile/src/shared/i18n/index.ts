// Public i18n surface for features. Features must import from here, never from i18next directly.
export { useTranslation, Trans } from 'react-i18next';
export { initI18n, changeLocale, getCurrentLocale } from './i18n';
export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isSupportedLocale,
  matchLocale,
  getDeviceLocale,
  resolveLocale,
} from './locales';
export type { Locale, LocalePreference } from './locales';
export { formatNumber, formatCurrency, formatDate } from './format';
