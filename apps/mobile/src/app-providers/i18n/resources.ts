import { authTranslations } from '@/features/auth';
import { healthTranslations } from '@/features/health';
import { historyTranslations } from '@/features/history';
import { homeTranslations } from '@/features/home';
import { inboxTranslations } from '@/features/inbox';
import { profileTranslations } from '@/features/profile';
import { runTranslations } from '@/features/run';
import { sessionTranslations } from '@/features/session';
import { settingsTranslations } from '@/features/settings';
import { shareTranslations } from '@/features/share';
import { socialTranslations } from '@/features/social';
import { tourTranslations } from '@/features/tour';
import { workoutsTranslations } from '@/features/workouts';

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
    auth: authTranslations.en,
    tour: tourTranslations.en,
    inbox: inboxTranslations.en,
    health: healthTranslations.en,
    workouts: workoutsTranslations.en,
    session: sessionTranslations.en,
    run: runTranslations.en,
    history: historyTranslations.en,
    profile: profileTranslations.en,
    social: socialTranslations.en,
    share: shareTranslations.en,
  },
  'pt-BR': {
    common: commonPtBR,
    home: homeTranslations['pt-BR'],
    settings: settingsTranslations['pt-BR'],
    auth: authTranslations['pt-BR'],
    tour: tourTranslations['pt-BR'],
    inbox: inboxTranslations['pt-BR'],
    health: healthTranslations['pt-BR'],
    workouts: workoutsTranslations['pt-BR'],
    session: sessionTranslations['pt-BR'],
    run: runTranslations['pt-BR'],
    history: historyTranslations['pt-BR'],
    profile: profileTranslations['pt-BR'],
    social: socialTranslations['pt-BR'],
    share: shareTranslations['pt-BR'],
  },
} as const satisfies Record<Locale, Record<string, object>>;

export type Resources = (typeof resources)['en'];
