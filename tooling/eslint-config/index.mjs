import expoConfig from 'eslint-config-expo/flat.js';
import reactNative from 'eslint-plugin-react-native';
import tseslint from 'typescript-eslint';

/**
 * React Native primitives that MUST NOT be used directly inside the app.
 * They are wrapped by @tracta/design-system so that spacing, colors and
 * typography always come from tokens and every element carries a testID.
 */
const RESTRICTED_RN_PRIMITIVES = [
  'Text',
  'View',
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'TextInput',
  'ScrollView',
  'Button',
  'Switch',
  'Image',
];

const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.expo/**',
    '**/.turbo/**',
    '**/ios/**',
    '**/android/**',
    '**/*.config.{js,mjs,cjs}',
    '**/babel.config.js',
    '**/metro.config.js',
  ],
};

/** Rules shared by every TypeScript package in the monorepo. */
const base = [
  ...expoConfig,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'type'],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'react-native', group: 'external', position: 'before' },
            { pattern: '@tracta/**', group: 'internal', position: 'before' },
            { pattern: '@/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-default-export': 'error',
    },
  },
];

/**
 * Config for the mobile app. Enforces:
 *  - no raw RN primitives (use the design system)
 *  - no color literals / inline styles (use tokens)
 *  - feature isolation (import other features only through their barrel)
 *  - expo-router files are the only allowed default exports
 */
export function appConfig() {
  return [
    ignores,
    ...base,
    {
      files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      plugins: { 'react-native': reactNative },
      rules: {
        'react-native/no-color-literals': 'error',
        'react-native/no-inline-styles': 'error',
        'react-native/no-unused-styles': 'error',
        'react-native/no-raw-text': ['error', { skip: ['Text', 'Heading', 'Label'] }],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: RESTRICTED_RN_PRIMITIVES,
                message:
                  'Use the wrapped primitives from @tracta/design-system instead of raw react-native components.',
              },
            ],
            patterns: [
              {
                group: ['@/features/*/*'],
                message:
                  'Import another feature only through its public barrel: @/features/<name>.',
              },
              {
                group: ['@tracta/design-system/src/*', '@tracta/design-system/dist/*'],
                message: 'Deep imports into the design system are not allowed.',
              },
              {
                group: ['../../*'],
                message: 'Use the "@/" alias instead of climbing more than one directory.',
              },
            ],
          },
        ],
      },
    },
    {
      // expo-router requires default exports for routes and layouts; Expo reads app.config.ts the same way.
      files: ['app/**/*.{ts,tsx}', 'app.config.ts'],
      rules: { 'import/no-default-export': 'off' },
    },
  ];
}

/** Config for shared libraries such as the design system. */
export function libraryConfig() {
  return [
    ignores,
    ...base,
    {
      files: ['src/**/*.{ts,tsx}'],
      plugins: { 'react-native': reactNative },
      rules: {
        'react-native/no-color-literals': 'error',
        'react-native/no-inline-styles': 'error',
        'react-native/no-unused-styles': 'error',
      },
    },
    {
      // Tokens are the single place where literal colors are allowed.
      files: ['src/tokens/**/*.ts'],
      rules: { 'react-native/no-color-literals': 'off' },
    },
  ];
}

export default { appConfig, libraryConfig };
