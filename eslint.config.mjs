// Root config: Node scripts and configuration files only.
// apps/* and packages/* carry their own eslint.config.mjs (ESLint 9 resolves config from the cwd).
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'apps/**',
      'packages/**',
      'design_handoff_tracta_app/**',
      '**/node_modules/**',
      '**/.turbo/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: globals.node },
    rules: {
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
