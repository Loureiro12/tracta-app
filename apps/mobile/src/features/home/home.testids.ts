import { testId } from '@tracta/design-system';

/** Single source of truth for Home test IDs. Flows live in e2e/flows/home. */
export const homeIds = {
  screen: testId('home', 'screen'),
  title: testId('home', 'title'),
  counterValue: testId('home', 'counter', 'value'),
  counterIncrement: testId('home', 'counter', 'increment'),
  counterReset: testId('home', 'counter', 'reset'),
  goToSettings: testId('home', 'nav', 'settings'),
  goToDesignSystem: testId('home', 'nav', 'design-system'),
} as const;
