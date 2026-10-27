import { homeTranslations } from '@/features/home';
import { settingsTranslations } from '@/features/settings';

import commonEn from './common/en.json';
import commonPtBR from './common/pt-BR.json';

import type { Locale } from '@/shared/i18n';

/**
 * Composition of every translation namespace. Add a line per feature.
 * `en` is the source of truth for key typing (see i18next.d.ts).
 */
export const resources = {
  en: {
    common: commonEn,
    home: homeTranslations.en,
    settings: settingsTranslations.en,
  },
  'pt-BR': {
    common: commonPtBR,
    home: homeTranslations['pt-BR'],
    settings: settingsTranslations['pt-BR'],
  },
} as const satisfies Record<Locale, Record<string, object>>;

export type Resources = (typeof resources)['en'];
