// Root: configuration files and tooling scripts. Each workspace package has its own lint-staged config,
// so ESLint always runs from the directory that owns the eslint.config.mjs.
export default {
  '*.{js,mjs,cjs}': ['eslint --fix --max-warnings=0 --no-warn-ignored', 'prettier --write'],
  '*.{json,md,yaml,yml}': ['prettier --write'],
};
