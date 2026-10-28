import type { MetricKey, SleepStage } from './health.types';
import type { SemanticColors } from '@tracta/design-system';

/**
 * Prototype colors mapped to the closest semantic tokens
 * (awake #B3261E → danger, REM #7CC0E8 → runLight, light #5B5FD6 → sleep, deep #5A4FE0 → social).
 */
export function stageColor(stage: SleepStage): keyof SemanticColors {
  switch (stage) {
    case 'awake':
      return 'danger';
    case 'rem':
      return 'runLight';
    case 'light':
      return 'sleep';
    case 'deep':
      return 'social';
  }
}

/** Accent per metric (steps brand, hr #FF7A59 heart, cal #D9822B challenge, dist run). */
export function metricColor(key: MetricKey): keyof SemanticColors {
  switch (key) {
    case 'steps':
      return 'brand';
    case 'hr':
      return 'heart';
    case 'cal':
      return 'challenge';
    case 'dist':
      return 'run';
    case 'sleep':
      return 'sleep';
    case 'weight':
      return 'success';
  }
}
