import { libraryConfig } from '@tracta/eslint-config';

export default [
  ...libraryConfig(),
  {
    // vitest config and test files use default exports / node globals
    files: ['vitest.config.ts', 'tests/**/*.ts'],
    rules: { 'import/no-default-export': 'off', 'no-console': 'off' },
  },
];
