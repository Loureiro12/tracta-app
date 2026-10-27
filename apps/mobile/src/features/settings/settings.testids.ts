import { testId } from '@tracta/design-system';

export const settingsIds = {
  screen: testId('settings', 'screen'),
  title: testId('settings', 'title'),
  themeCurrent: testId('settings', 'theme', 'current'),
  themeSystem: testId('settings', 'theme', 'system'),
  themeLight: testId('settings', 'theme', 'light'),
  themeDark: testId('settings', 'theme', 'dark'),
  back: testId('settings', 'nav', 'back'),
} as const;
