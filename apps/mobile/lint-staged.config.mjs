export default {
  '*.{ts,tsx,js,mjs,cjs}': ['eslint --fix --max-warnings=0 --no-warn-ignored', 'prettier --write'],
  '*.{json,md,yaml,yml}': ['prettier --write'],
  'e2e/**/*.yaml': () => 'node ../../tooling/scripts/check-flows.mjs',
};
