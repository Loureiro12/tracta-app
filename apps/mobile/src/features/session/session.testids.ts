import { testId } from '@tracta/design-system';

/** Single source of truth for Session test IDs. Flows live in e2e/flows/session. */
export const sessionIds = {
  // Session (full screen)
  screen: testId('session', 'screen'),
  minimize: testId('session', 'header', 'minimize'),
  pause: testId('session', 'header', 'pause'),
  timer: testId('session', 'header', 'timer'),
  pausedBanner: testId('session', 'paused', 'banner'),
  pausedResume: testId('session', 'paused', 'resume'),
  /** Per-exercise navigation pill: `${pill}.${index}` */
  pill: testId('session', 'pill'),
  exerciseMeta: testId('session', 'exercise', 'meta'),
  exerciseName: testId('session', 'exercise', 'name'),
  superset: testId('session', 'exercise', 'superset'),
  suggestion: testId('session', 'suggestion', 'card'),
  suggestionApply: testId('session', 'suggestion', 'apply'),
  suggestionKeep: testId('session', 'suggestion', 'keep'),
  warmupOffer: testId('session', 'warmup', 'offer'),
  warmupAdd: testId('session', 'warmup', 'add'),
  warmupSkip: testId('session', 'warmup', 'skip'),
  /** Warm-up row: `${warmupRow}.${index}` */
  warmupRow: testId('session', 'warmup', 'row'),
  activeSet: testId('session', 'set', 'active'),
  setKg: testId('session', 'set', 'kg'),
  setReps: testId('session', 'set', 'reps'),
  setPlates: testId('session', 'set', 'plates'),
  /** Collapsed set row: `${setRow}.${index}` */
  setRow: testId('session', 'set', 'row'),
  addExercise: testId('session', 'actions', 'add-exercise'),
  addSet: testId('session', 'actions', 'add-set'),
  removeSet: testId('session', 'actions', 'remove-set'),
  skipExercise: testId('session', 'actions', 'skip'),
  finish: testId('session', 'actions', 'finish'),
  navPrev: testId('session', 'nav', 'prev'),
  navMain: testId('session', 'nav', 'main'),
  navNext: testId('session', 'nav', 'next'),

  // Rest
  restScreen: testId('session', 'rest', 'screen'),
  restLabel: testId('session', 'rest', 'label'),
  restTime: testId('session', 'rest', 'time'),
  restTotal: testId('session', 'rest', 'total'),
  restMinus: testId('session', 'rest', 'minus'),
  restPause: testId('session', 'rest', 'pause'),
  restPlus: testId('session', 'rest', 'plus'),
  restSkip: testId('session', 'rest', 'skip'),
  restNext: testId('session', 'rest', 'next'),

  // Summary
  summaryScreen: testId('session', 'summary', 'screen'),
  summaryTitle: testId('session', 'summary', 'title'),
  summarySets: testId('session', 'summary', 'sets'),
  summaryVolume: testId('session', 'summary', 'volume'),
  summaryNoPr: testId('session', 'summary', 'no-pr'),
  summaryNext: testId('session', 'summary', 'next'),
  summaryBack: testId('session', 'summary', 'back'),
  summaryDiscard: testId('session', 'summary', 'discard'),
  summarySave: testId('session', 'summary', 'save'),

  // Plates sheet
  platesSheet: testId('session', 'plates', 'sheet'),
  /** Stepper: `${platesTotal}.minus` / `.value` / `.plus` */
  platesTotal: testId('session', 'plates', 'total'),
  /** Segmented: `${platesBar}.<20|15|10>` */
  platesBar: testId('session', 'plates', 'bar'),
  /** Plate rows: `${platesRow}.bar` and `${platesRow}.<index>` */
  platesRow: testId('session', 'plates', 'row'),
  platesNote: testId('session', 'plates', 'note'),

  // Recover sheet
  recoverSheet: testId('session', 'recover', 'sheet'),
  recoverTitle: testId('session', 'recover', 'title'),
  recoverLine: testId('session', 'recover', 'line'),
  recoverResume: testId('session', 'recover', 'resume'),
  recoverReview: testId('session', 'recover', 'review'),
  recoverLater: testId('session', 'recover', 'later'),
  recoverDiscard: testId('session', 'recover', 'discard'),
} as const;
