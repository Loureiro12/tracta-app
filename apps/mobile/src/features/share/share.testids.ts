import { testId } from '@tracta/design-system';

/** Single source of truth for Share test IDs. Flows live in e2e/flows/share. */
export const shareIds = {
  screen: testId('share', 'screen'),
  title: testId('share', 'title'),
  close: testId('share', 'nav', 'close'),
  prev: testId('share', 'nav', 'prev'),
  next: testId('share', 'nav', 'next'),

  card: testId('share', 'card'),
  cardKicker: testId('share', 'card', 'kicker'),
  cardBig: testId('share', 'card', 'big'),
  cardLine: testId('share', 'card', 'line'),
  cardDate: testId('share', 'card', 'date'),
  cardHandle: testId('share', 'card', 'handle'),
  cardBars: testId('share', 'card', 'bars'),
  cardDots: testId('share', 'card', 'dots'),
  cardPhoto: testId('share', 'card', 'photo'),

  templateToday: testId('share', 'template', 'today'),
  templateEvo: testId('share', 'template', 'evo'),
  templatePr: testId('share', 'template', 'pr'),
  templateWeek: testId('share', 'template', 'week'),
  templateRun: testId('share', 'template', 'run'),
  templateMonth: testId('share', 'template', 'month'),

  styleInk: testId('share', 'style', 'ink'),
  styleSand: testId('share', 'style', 'sand'),
  styleBrand: testId('share', 'style', 'brand'),
  stylePhoto: testId('share', 'style', 'photo'),

  /** Segmented: `${format}.story` / `${format}.post`. */
  format: testId('share', 'format'),

  optionLoads: testId('share', 'option', 'loads'),
  optionTimes: testId('share', 'option', 'times'),
  optionName: testId('share', 'option', 'name'),

  targetStories: testId('share', 'target', 'stories'),
  targetWhatsapp: testId('share', 'target', 'whatsapp'),
  targetSave: testId('share', 'target', 'save'),
  targetMore: testId('share', 'target', 'more'),

  nudgeScreen: testId('share', 'nudge', 'screen'),
  nudgeBackdrop: testId('share', 'nudge', 'backdrop'),
  nudgeCard: testId('share', 'nudge', 'card'),
  nudgeTitle: testId('share', 'nudge', 'title'),
  nudgeDescription: testId('share', 'nudge', 'description'),
  nudgeCreate: testId('share', 'nudge', 'create'),
  nudgeDismiss: testId('share', 'nudge', 'dismiss'),
} as const;
