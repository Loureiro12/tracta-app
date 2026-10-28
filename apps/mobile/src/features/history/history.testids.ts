import { testId } from '@tracta/design-system';

/**
 * Single source of truth for History test IDs. Flows live in e2e/flows/history.
 * List containers carry the prefix; items append their key: `${historyIds.calendarDays}.19`.
 */
export const historyIds = {
  // Histórico tab
  screen: testId('history', 'screen'),
  header: testId('history', 'header'),
  share: testId('history', 'share'),
  recapOpen: testId('history', 'recap', 'open'),
  achievementsOpen: testId('history', 'achievements', 'open'),
  calendar: testId('history', 'calendar'),
  calendarMonth: testId('history', 'calendar', 'month'),
  calendarDays: testId('history', 'calendar', 'days'),
  dayCard: testId('history', 'day', 'card'),
  dayDate: testId('history', 'day', 'date'),
  dayMeta: testId('history', 'day', 'meta'),
  daySessions: testId('history', 'day', 'sessions'),
  dayEmpty: testId('history', 'day', 'empty'),
  dayEmptyLine: testId('history', 'day', 'empty-line'),
  statWorkouts: testId('history', 'stats', 'workouts'),
  statRun: testId('history', 'stats', 'run'),
  statVolume: testId('history', 'stats', 'volume'),
  report7d: testId('history', 'reports', '7d'),
  report30d: testId('history', 'reports', '30d'),
  reportCustom: testId('history', 'reports', 'custom'),
  evoCard: testId('history', 'evo', 'card'),
  evoHeading: testId('history', 'evo', 'heading'),
  evoCount: testId('history', 'evo', 'count'),
  evoKind: testId('history', 'evo', 'kind'),
  evoChips: testId('history', 'evo', 'chips'),
  evoMetric: testId('history', 'evo', 'metric'),
  evoBig: testId('history', 'evo', 'big'),
  evoBigSub: testId('history', 'evo', 'big-sub'),
  evoChart: testId('history', 'evo', 'chart'),
  evoBest: testId('history', 'evo', 'best'),
  evoDelta: testId('history', 'evo', 'delta'),
  evoRecent: testId('history', 'evo', 'recent'),
  evoNote: testId('history', 'evo', 'note'),

  // Day overlay (/history/day/[date])
  dayViewScreen: testId('history', 'day-view', 'screen'),
  dayViewBack: testId('history', 'day-view', 'back'),
  dayViewTitle: testId('history', 'day-view', 'title'),

  // Session detail (/history/session/[id])
  sessionScreen: testId('history', 'session', 'screen'),
  sessionBack: testId('history', 'session', 'back'),
  sessionShare: testId('history', 'session', 'share'),
  sessionDate: testId('history', 'session', 'date'),
  sessionTitle: testId('history', 'session', 'title'),
  sessionSub: testId('history', 'session', 'sub'),
  sessionStats: testId('history', 'session', 'stats'),
  sessionMap: testId('history', 'session', 'map'),
  sessionSplits: testId('history', 'session', 'splits'),
  sessionExercises: testId('history', 'session', 'exercises'),
  sessionNotes: testId('history', 'session', 'notes'),
  sessionSource: testId('history', 'session', 'source'),
  sessionDelete: testId('history', 'session', 'delete'),
  sessionMissing: testId('history', 'session', 'missing'),

  // Recap stories (/history/recap)
  recapScreen: testId('history', 'recap', 'screen'),
  recapProgress: testId('history', 'recap', 'progress'),
  recapClose: testId('history', 'recap', 'close'),
  recapNext: testId('history', 'recap', 'next'),
  recapPrev: testId('history', 'recap', 'prev'),
  recapShare: testId('history', 'recap', 'share'),
  recapKicker: testId('history', 'recap', 'kicker'),
  recapBig: testId('history', 'recap', 'big'),
  recapTitle: testId('history', 'recap', 'title'),

  // Records & achievements (/history/achievements)
  achievementsScreen: testId('history', 'achievements', 'screen'),
  achievementsBack: testId('history', 'achievements', 'back'),
  achievementsTitle: testId('history', 'achievements', 'title'),
  achievementsTab: testId('history', 'achievements', 'tab'),
  achievementsShare: testId('history', 'achievements', 'share'),
  achievementsRecords: testId('history', 'achievements', 'records'),
  achievementsNote: testId('history', 'achievements', 'note'),
  achievementsCount: testId('history', 'achievements', 'count'),
  achievementsBadges: testId('history', 'achievements', 'badges'),
} as const;
