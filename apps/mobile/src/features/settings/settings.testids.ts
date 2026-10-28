import { testId } from '@tracta/design-system';

export const settingsIds = {
  screen: testId('settings', 'screen'),
  title: testId('settings', 'title'),
  back: testId('settings', 'nav', 'back'),
  themeCurrent: testId('settings', 'theme', 'current'),
  themeSystem: testId('settings', 'theme', 'system'),
  themeLight: testId('settings', 'theme', 'light'),
  themeDark: testId('settings', 'theme', 'dark'),
  languageCurrent: testId('settings', 'language', 'current'),
  languageSystem: testId('settings', 'language', 'system'),
  languageEn: testId('settings', 'language', 'en'),
  languagePtBr: testId('settings', 'language', 'pt-br'),
  demoOffline: testId('settings', 'demo', 'offline'),
  demoSync: testId('settings', 'demo', 'sync'),
  demoToast: testId('settings', 'demo', 'toast'),
  demoClear: testId('settings', 'demo', 'clear'),
} as const;
