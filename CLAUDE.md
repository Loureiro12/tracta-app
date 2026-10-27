# Tracta — guidance for AI assistants

- pnpm + Turborepo monorepo. App: `apps/mobile` (Expo, expo-router). UI kit: `packages/design-system`.
- Testing is **E2E only** (Maestro, `apps/mobile/e2e`). Never add jest/unit tests; add or update a flow instead.
- Every feature lives in `apps/mobile/src/features/<kebab>/` with `index.ts`, `<kebab>.testids.ts`, `screens/*Screen.tsx`. Routes in `app/` are thin re-exports.
- Use only `@tracta/design-system` components in the app; raw `react-native` primitives, color literals and inline styles are lint errors.
- Every interactive or asserted element needs a `testID` from the feature's `*.testids.ts` (`testId('feature', 'element')`), and every declared testID must be used by a flow.
- Scaffold with `pnpm gen:feature <name>` / `pnpm gen:component <Name>`.
- Before committing: `pnpm check` (lint, typecheck, format, structure, flows, check-tests). Commits are Conventional Commits with a scope (`feat(home): ...`). If behaviour changes without a flow change, add a trailer `E2E-Skip: <reason>` to the commit body.
- Docs: `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/TESTING.md`, `docs/COMMITS.md`.
