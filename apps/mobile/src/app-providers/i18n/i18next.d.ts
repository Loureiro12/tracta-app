import 'i18next';

import type { Resources } from './resources';

/** Makes t('key') and useTranslation('ns') fully typed from en.json. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: Resources;
    returnNull: false;
  }
}
