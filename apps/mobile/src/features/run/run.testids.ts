import { testId } from '@tracta/design-system';

export const runIds = {
  /** Live activity screen. */
  screen: testId('run', 'screen'),
  liveMinimize: testId('run', 'live', 'minimize'),
  liveLabel: testId('run', 'live', 'label'),
  liveGps: testId('run', 'live', 'gps'),
  liveMap: testId('run', 'live', 'map'),
  liveNoGps: testId('run', 'live', 'no-gps'),
  livePaused: testId('run', 'live', 'paused'),
  liveInterval: testId('run', 'live', 'interval'),
  liveBig: testId('run', 'live', 'big'),
  /** Row container; each stat is `${liveStats}.<key>`. */
  liveStats: testId('run', 'live', 'stats'),
  liveSplitHint: testId('run', 'live', 'split-hint'),
  /** List container; each row is `${liveSplits}.<km>`. */
  liveSplits: testId('run', 'live', 'splits'),
  livePause: testId('run', 'live', 'pause'),
  liveResume: testId('run', 'live', 'resume'),
  liveEnd: testId('run', 'live', 'end'),

  /** Location permission dialog. */
  gpsScreen: testId('run', 'gps', 'screen'),
  gpsAllow: testId('run', 'gps', 'allow'),
  gpsOnce: testId('run', 'gps', 'once'),
  gpsDeny: testId('run', 'gps', 'deny'),

  /** Summary screen. */
  summaryScreen: testId('run', 'summary', 'screen'),
  summaryTitle: testId('run', 'summary', 'title'),
  /** Grid container; each card is `${summaryStats}.<key>`. */
  summaryStats: testId('run', 'summary', 'stats'),
  summaryMap: testId('run', 'summary', 'map'),
  /** Card container; each row is `${summarySplits}.<km|partial>`. */
  summarySplits: testId('run', 'summary', 'splits'),
  summarySwimLabel: testId('run', 'summary', 'swim-label'),
  summarySwim: testId('run', 'summary', 'swim'),
  summarySwimLaps: testId('run', 'summary', 'swim-laps'),
  summaryNotes: testId('run', 'summary', 'notes'),
  summaryLocal: testId('run', 'summary', 'dest-local'),
  summaryHealth: testId('run', 'summary', 'dest-health'),
  summaryBack: testId('run', 'summary', 'back'),
  summaryDiscard: testId('run', 'summary', 'discard'),
  summarySave: testId('run', 'summary', 'save'),
} as const;
