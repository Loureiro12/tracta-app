# E2E (Maestro)

Every user-facing behaviour is specified here, as a Maestro flow. There are no unit tests in this repo: a feature without a flow is not done.

## Layout

```
e2e/
├── flows/
│   ├── config.yaml          # which folders are executed
│   ├── app/                 # navigation, deep links, cold start
│   ├── <feature>/           # one folder per src/features/<feature>
│   └── design-system/       # one file per design-system component (<slug>.yaml) + theme.yaml
└── subflows/                # reusable steps (never executed on their own)
```

## Rules enforced by `pnpm check:flows` and `pnpm check:tests`

- A flow file has `appId`, `name`, `tags` and at least one `assertVisible`.
- Selectors use `id:` (a testID). Text-only selectors are warnings; prefer `id` + `text`. OS alerts have no testID: mark those taps with `# system-dialog`.
- Every `id:` must match a testID declared in source. Dead selectors fail the check.
- Every testID declared in source must be used by at least one flow.
- Changing a feature, route or component requires a flow in the matching folder, and behaviour changes require a flow change in the same commit (or an `E2E-Skip:` trailer with a reason).

## Running

```bash
# build once per native change (creates ios/ or android/ via prebuild)
pnpm --filter @tracta/mobile ios        # or android

# then run against the booted simulator/emulator
pnpm e2e                      # everything
pnpm --filter @tracta/mobile e2e:smoke  # tag "smoke" only
maestro test apps/mobile/e2e/flows/home # one folder
maestro studio                          # inspect testIDs interactively
```

## Writing a flow

1. Declare testIDs in `src/features/<feature>/<feature>.testids.ts` using `testId()`.
2. Pass them to design-system components (`testID` is mandatory on interactive ones).
3. Start the flow with `runFlow: ../../subflows/launch.yaml` and assert the screen id.
4. Prefer `assertVisible: { id, text }` over text-only assertions.
