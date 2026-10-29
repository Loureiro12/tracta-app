# Tracta — guidance for AI assistants

- pnpm + Turborepo monorepo. App: `apps/mobile` (Expo, expo-router). UI kit: `packages/design-system`.
- App testing is **E2E only** (Maestro, `apps/mobile/e2e`). Never add jest/unit tests to the app or design system; add or update a flow instead. The backend is the exception: pgTAP for the schema and vitest integration tests for `packages/api` (see last bullets).
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
- Backend is Supabase (docs/BACKEND.md). Schema in supabase/migrations (RLS on every table), pgTAP in supabase/tests/database, typed access in packages/api (domains + vitest integration tests against the real local stack). Regenerate types with `pnpm gen:types`; never hand-edit database.types.ts. Server state in the app goes through React Query hooks in features/<f>/api over `@/shared/api`; use `@/shared/clock` for "today".
- Local Supabase uses ports 553xx (`pnpm db:start`); demo login lucas@tracta.app / Tracta2026. E2E flows start via `subflows/launch.yaml`, which signs in as the demo account and resets its data.
