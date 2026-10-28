import { testId } from '@tracta/design-system';

/**
 * Single source of truth for Home test IDs. Flows live in e2e/flows/home.
 * Dynamic lists use a declared prefix on the container plus `${prefix}.${itemId}` on each row.
 */
export const homeIds = {
  screen: testId('home', 'screen'),
  /** Root passed to ScreenHeader; it derives `home.title` and `home.eyebrow`. */
  header: 'home',
  title: testId('home', 'title'),
  eyebrow: testId('home', 'eyebrow'),
  navEdit: testId('home', 'nav', 'edit'),
  navInbox: testId('home', 'nav', 'inbox'),
  navProfile: testId('home', 'nav', 'profile'),
  goToSettings: testId('home', 'nav', 'settings'),
  goToDesignSystem: testId('home', 'nav', 'design-system'),

  checklistCard: testId('home', 'checklist', 'card'),
  checklistProgress: testId('home', 'checklist', 'progress'),
  checklistSteps: testId('home', 'checklist', 'steps'),
  syncLine: testId('home', 'sync', 'line'),

  weeklyCard: testId('home', 'weekly', 'card'),
  weeklyHeadline: testId('home', 'weekly', 'headline'),

  sleepCard: testId('home', 'sleep', 'card'),
  sleepValue: testId('home', 'sleep', 'value'),
  sleepScore: testId('home', 'sleep', 'score'),
  sleepBars: testId('home', 'sleep', 'bars'),

  moveCard: testId('home', 'move', 'card'),
  moveValue: testId('home', 'move', 'value'),
  moveBars: testId('home', 'move', 'bars'),
  moveStats: testId('home', 'move', 'stats'),

  hrCard: testId('home', 'hr', 'card'),
  hrValue: testId('home', 'hr', 'value'),
  weekCard: testId('home', 'week', 'card'),
  weekValue: testId('home', 'week', 'value'),

  nextCard: testId('home', 'next', 'card'),
  nextTitle: testId('home', 'next', 'title'),
  nextStart: testId('home', 'next', 'start'),
  nextDone: testId('home', 'next', 'done'),

  friendsCard: testId('home', 'friends', 'card'),
  friendsTitle: testId('home', 'friends', 'title'),
  friendsCta: testId('home', 'friends', 'cta'),
  friendsRanking: testId('home', 'friends', 'ranking'),

  lastCard: testId('home', 'last', 'card'),
  lastHistory: testId('home', 'last', 'history'),

  // "Personalizar início" sheet
  editSheet: testId('home', 'edit', 'sheet'),
  editDensity: testId('home', 'edit', 'density'),
  editDensitySummary: testId('home', 'edit', 'density', 'summary'),
  editDensityDetailed: testId('home', 'edit', 'density', 'detailed'),
  editCount: testId('home', 'edit', 'count'),
  editRows: testId('home', 'edit', 'rows'),
  editReset: testId('home', 'edit', 'reset'),
  editNote: testId('home', 'edit', 'note'),
  editSimulateNewUser: testId('home', 'edit', 'simulate-new-user'),

  // "Resumo semanal" overlay
  weeklyScreen: testId('home', 'weekly', 'screen'),
  weeklyBack: testId('home', 'weekly', 'back'),
  weeklyTitle: testId('home', 'weekly', 'title'),
  weeklyStats: testId('home', 'weekly', 'stats'),
  weeklyDays: testId('home', 'weekly', 'days'),
  weeklyChanges: testId('home', 'weekly', 'changes'),
  weeklyHighlights: testId('home', 'weekly', 'highlights'),
  weeklyGoals: testId('home', 'weekly', 'goals'),
  weeklyPreview: testId('home', 'weekly', 'preview'),
  weeklyShare: testId('home', 'weekly', 'share'),
  weeklyNote: testId('home', 'weekly', 'note'),
} as const;
