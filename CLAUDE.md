# Tracta — guidance for AI assistants

- pnpm + Turborepo monorepo. App: `apps/mobile` (Expo, expo-router). UI kit: `packages/design-system`.
- Testing is **E2E only** (Maestro, `apps/mobile/e2e`). Never add jest/unit tests; add or update a flow instead.
- Every feature lives in `apps/mobile/src/features/<kebab>/` with `index.ts`, `<kebab>.testids.ts`, `screens/*Screen.tsx`, `i18n/`, `model/` (mock data + zustand stores). Routes in `app/` are thin re-exports, organised in groups: `(tabs)` the 5 tabs, `(auth)`, `(overlays)/<feature>/` full-screen overlays with a `BackHeader`, `(sheets)/<feature>/` bottom sheets (`Sheet` + `router.back()`). Group names are omitted from hrefs.
- The visual source of truth is `design_handoff_tracta_app/` (README = tokens and screen list; `Tracta App.dc.html` = prototype). Reproduce it with design-system components only; Archivo fonts are embedded (`apps/mobile/assets/fonts`).
- Global transient UI (toast, offline/sync banner, mini-player) goes through `useFeedbackStore` from `@/shared/feedback`, rendered by `AppChrome`/`AppTabBar`. Never build local toasts.
- Maestro `back` does not work on iOS: every overlay/sheet exposes its own back/close testID. Deep links need `?locale=en` plus the `accept-deep-link-prompt` subflow.
- Use only `@tracta/design-system` components in the app; raw `react-native` primitives, color literals and inline styles are lint errors.
- Every interactive or asserted element needs a `testID` from the feature's `*.testids.ts` (`testId('feature', 'element')`), and every declared testID must be used by a flow.
- All user-facing copy goes through `useTranslation('<feature>')` from `@/shared/i18n`; keys live in `src/features/<f>/i18n/{en,pt-BR}.json` (same key set in both, registered in `src/app-providers/i18n/resources.ts`). Never import `react-i18next`/`i18next` in features.
- E2E flows pin the locale with `?locale=en` on deep links (see `e2e/subflows/launch.yaml`).
- Scaffold with `pnpm gen:feature <name>` / `pnpm gen:component <Name>`.
- Before committing: `pnpm check` (lint, typecheck, format, structure, flows, check-tests). Commits are Conventional Commits with a scope (`feat(home): ...`). If behaviour changes without a flow change, add a trailer `E2E-Skip: <reason>` to the commit body.
- Never run `git commit`; leave changes in the working tree and propose a commit split with messages.
- Docs: `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/TESTING.md`, `docs/COMMITS.md`, `docs/I18N.md`.
