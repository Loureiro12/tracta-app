/**
 * Mock data for the Home tab, ported from the prototype. Numbers only; labels live in i18n.
 * Sleep, movement, resting HR and the sync line read the synced health days (../api/useHomeHealth).
 */

export type HomeChecklistStepId = 'health' | 'workout' | 'friend';

export const checklistSteps: readonly { id: HomeChecklistStepId; done: boolean }[] = [
  { id: 'health', done: false },
  { id: 'workout', done: false },
  { id: 'friend', done: false },
];
