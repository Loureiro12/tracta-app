import { testId } from '@tracta/design-system';

/** Single source of truth for Health test IDs. Flows live in e2e/flows/health. */
export const healthIds = {
  screen: testId('health', 'screen'),
  header: testId('health', 'header'),
  /** Segmented control; options are `${segment}.sleep|activity|body`. */
  segment: testId('health', 'segment'),

  sleepHero: testId('health', 'sleep', 'hero'),
  sleepStages: testId('health', 'sleep', 'stages'),
  /** Stage totals legend; items are `${sleepStage}.<awake|rem|light|deep>`. */
  sleepStage: testId('health', 'sleep', 'stage'),
  sleepScore: testId('health', 'sleep', 'score'),
  /** Score factors; items are `${sleepFactor}.<duration|regularity|interruptions|consistency>`. */
  sleepFactor: testId('health', 'sleep', 'factor'),
  sleepScoreHow: testId('health', 'sleep', 'score-how'),
  /** Segmented 7 nights / 30 days / compare; options are `${sleepRange}.7|30|cmp`. */
  sleepRange: testId('health', 'sleep', 'range'),
  sleepWeek: testId('health', 'sleep', 'week'),
  sleepMonth: testId('health', 'sleep', 'month'),
  sleepCompare: testId('health', 'sleep', 'compare'),
  sleepBedtime: testId('health', 'sleep', 'bedtime'),
  sleepTrainRest: testId('health', 'sleep', 'train-rest'),
  sleepSuggestion: testId('health', 'sleep', 'suggestion'),

  activitySteps: testId('health', 'activity', 'steps'),
  activityStepsValue: testId('health', 'activity', 'steps-value'),
  activityWeek: testId('health', 'activity', 'week'),
  activityCalories: testId('health', 'activity', 'calories'),
  activityDistance: testId('health', 'activity', 'distance'),

  bodyHero: testId('health', 'body', 'hero'),
  bodyWeight: testId('health', 'body', 'weight'),
  bodyChart: testId('health', 'body', 'chart'),
  /** Measurement rows; items are `${bodyMeasures}.<waist|hip|arm>`. */
  bodyMeasures: testId('health', 'body', 'measures'),
  bodyRegister: testId('health', 'body', 'register'),

  metricScreen: testId('health', 'metric', 'screen'),
  metricBack: testId('health', 'metric', 'back'),
  metricTitle: testId('health', 'metric', 'title'),
  /** Period segmented; options are `${metricPeriod}.D|W|M`. */
  metricPeriod: testId('health', 'metric', 'period'),
  metricBig: testId('health', 'metric', 'big'),
  metricChart: testId('health', 'metric', 'chart'),
  /** Stat cells; items are `${metricStat}.<key>`. */
  metricStat: testId('health', 'metric', 'stat'),
  metricInsight: testId('health', 'metric', 'insight'),

  reportScreen: testId('health', 'report', 'screen'),
  reportBack: testId('health', 'report', 'back'),
  reportTitle: testId('health', 'report', 'title'),
  /** Period segmented; options are `${reportPeriod}.7|30|custom`. */
  reportPeriod: testId('health', 'report', 'period'),
  reportFrom: testId('health', 'report', 'from'),
  reportTo: testId('health', 'report', 'to'),
  reportSessions: testId('health', 'report', 'sessions'),
  /** Modality rows; items are `${reportModality}.<strength|run|walk|other>`. */
  reportModality: testId('health', 'report', 'modality'),
  /** Stat tiles; items are `${reportStat}.<key>`. */
  reportStat: testId('health', 'report', 'stat'),
  /** Goal rows; items are `${reportGoal}.<steps|sleep|workouts>`. */
  reportGoal: testId('health', 'report', 'goal'),
  reportExport: testId('health', 'report', 'export'),

  scoreSheet: testId('health', 'score', 'sheet'),
  /** Factor rows; items are `${scoreRow}.<duration|...>`. */
  scoreRow: testId('health', 'score', 'row'),
  scoreOutside: testId('health', 'score', 'outside'),

  bodyLogSheet: testId('health', 'body-log', 'sheet'),
  bodyLogWeight: testId('health', 'body-log', 'weight'),
  bodyLogWaist: testId('health', 'body-log', 'waist'),
  bodyLogHip: testId('health', 'body-log', 'hip'),
  bodyLogArm: testId('health', 'body-log', 'arm'),
  bodyLogSave: testId('health', 'body-log', 'save'),
} as const;
