/**
 * Conventional Commits with a scope list derived from the workspace.
 * Scopes: a workspace package (mobile, design-system, tooling, ci, docs, repo)
 * or a feature folder name under apps/mobile/src/features.
 */
import { readdirSync, existsSync } from 'node:fs';

const featureDir = new URL('./apps/mobile/src/features/', import.meta.url);
const features = existsSync(featureDir)
  ? readdirSync(featureDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'perf',
        'test',
        'docs',
        'chore',
        'ci',
        'build',
        'revert',
        'style',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'mobile',
        'design-system',
        'ds',
        'e2e',
        'i18n',
        'tooling',
        'ci',
        'docs',
        'repo',
        'deps',
        'api',
        'db',
        ...features,
      ],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
