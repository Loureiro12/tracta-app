#!/usr/bin/env node
/**
 * check-tests: "is the code I touched covered by an end-to-end flow?"
 *
 * Modes
 *   --staged [--message-file <path>]   pre-commit / commit-msg hook (staged changes)
 *   --base <ref>                       CI / pre-push (merge-base of <ref>...HEAD)
 *   --all                              audit the whole repository
 *
 * Rules
 *   1. Every changed source file maps to a test domain; that domain must have ≥1 flow.
 *   2. Every static testID declared in a changed file must be used by at least one flow.
 *   3. If a domain received behaviour changes (heuristic on added lines) and no flow in
 *      that domain changed in the same changeset, fail — unless the commit carries an
 *      `E2E-Skip: <reason>` trailer.
 */
import { readFileSync } from 'node:fs';

import {
  addedLines,
  commitsInRange,
  rangeFiles,
  readTrailer,
  resolveBase,
  stagedFiles,
} from './lib/git.mjs';
import {
  PATHS,
  collectAllTestIds,
  exists,
  extractTestIds,
  kebab,
  listFlowFiles,
  listSubflowFiles,
  listFeatures,
  listDsComponents,
  parseFlow,
  usageIndex,
  walk,
} from './lib/project.mjs';
import { Report, c, parseArgs } from './lib/report.mjs';

const args = parseArgs(process.argv.slice(2));
const report = new Report('check-tests · E2E coverage of changed files');

const BEHAVIOUR_RE =
  /\b(onPress|onLongPress|onChangeText|onChange|onSubmit|onSubmitEditing|useState|useReducer|useEffect|useCallback|useMemo|useQuery|useMutation|router\.(push|replace|back|navigate)|fetch\(|axios|create\(|set\(|testID|Alert\.|Linking\.)/;

// ---------------------------------------------------------------------------
// Domain mapping
// ---------------------------------------------------------------------------
const features = new Set(listFeatures());
const dsComponents = listDsComponents();

/**
 * Maps a repo-relative path to a domain descriptor, or null when the file needs no E2E.
 * domain = { key, label, flowsDir?, flowFile?, strict }  strict=false → rule 3 is a warning.
 */
function domainOf(path) {
  let m;
  if ((m = path.match(/^apps\/mobile\/src\/features\/([^/]+)\//))) {
    return {
      key: `feature:${m[1]}`,
      label: `feature "${m[1]}"`,
      flowsDir: `${PATHS.flows}/${m[1]}`,
      strict: true,
    };
  }
  if ((m = path.match(/^apps\/mobile\/app\/(.+)$/))) {
    // Skip expo-router groups "(tabs)", "(sheets)", "(overlays)" and layouts: the first real
    // segment names the feature (app/(overlays)/workouts/builder.tsx → "workouts").
    const segments = m[1].split('/').filter((s) => !/^\(.*\)$/.test(s));
    const seg = (segments[0] ?? '').replace(/\.tsx?$/, '');
    if (seg === 'design-system') {
      return {
        key: 'ds:routes',
        label: 'design-system routes',
        flowsDir: `${PATHS.flows}/design-system`,
        strict: true,
      };
    }
    const feature = seg === 'index' ? 'home' : seg;
    if (features.has(feature)) {
      return {
        key: `feature:${feature}`,
        label: `feature "${feature}" (route)`,
        flowsDir: `${PATHS.flows}/${feature}`,
        strict: true,
      };
    }
    return {
      key: 'app',
      label: 'app shell / navigation',
      flowsDir: `${PATHS.flows}/app`,
      strict: true,
    };
  }
  if (/^apps\/mobile\/src\/(shared|app-providers)\//.test(path)) {
    return {
      key: 'app',
      label: 'app shell (shared code)',
      flowsDir: `${PATHS.flows}/app`,
      strict: false,
    };
  }
  if ((m = path.match(/^packages\/design-system\/src\/components\/([^/]+)\//))) {
    const slug = kebab(m[1]);
    return {
      key: `ds:${slug}`,
      label: `design-system component "${m[1]}"`,
      flowFile: `${PATHS.flows}/design-system/${slug}.yaml`,
      strict: true,
    };
  }
  if (/^packages\/design-system\/src\/(tokens|theme)\//.test(path)) {
    return {
      key: 'ds:theme',
      label: 'design-system tokens/theme',
      flowFile: `${PATHS.flows}/design-system/theme.yaml`,
      strict: false,
    };
  }
  // ---- Backend: covered by integration tests (vitest) and database tests (pgTAP), not flows.
  if ((m = path.match(/^packages\/api\/src\/domains\/([^/]+)\.ts$/))) {
    return {
      key: `api:${m[1]}`,
      label: `api domain "${m[1]}"`,
      testFile: `packages/api/tests/${m[1]}.test.ts`,
      backend: true,
      strict: true,
    };
  }
  if (/^packages\/api\/src\//.test(path) && !path.endsWith('database.types.ts')) {
    return {
      key: 'api:core',
      label: 'api core (client, errors)',
      testsDir: 'packages/api/tests',
      testExt: '.test.ts',
      backend: true,
      strict: false,
    };
  }
  if (/^supabase\/migrations\/[^/]+\.sql$/.test(path)) {
    return {
      key: 'db:schema',
      label: 'database schema (migrations)',
      testsDir: 'supabase/tests/database',
      testExt: '.test.sql',
      backend: true,
      strict: true,
    };
  }
  if (/^supabase\/seeds\/[^/]+\.sql$/.test(path)) {
    return {
      key: 'db:seeds',
      label: 'database seeds (demo data)',
      testsDir: 'supabase/tests/database',
      testExt: '.test.sql',
      backend: true,
      strict: false,
    };
  }
  return null;
}

/** Test files that cover a domain: Maestro flows for app code, vitest/pgTAP files for backend code. */
function coveringTests(d) {
  if (d.testFile) return exists(d.testFile) ? [d.testFile] : [];
  if (d.testsDir) return walk(d.testsDir, { ext: [d.testExt] });
  if (d.flowsDir) return listFlowFiles().filter((p) => p.startsWith(`${d.flowsDir}/`));
  return exists(d.flowFile) ? [d.flowFile] : [];
}

const isSource = (p) =>
  (/\.(ts|tsx)$/.test(p) && !/\.d\.ts$/.test(p) && !p.endsWith('database.types.ts')) ||
  /^supabase\/(migrations|seeds)\/[^/]+\.sql$/.test(p);
const isBackendTest = (p) =>
  /^packages\/api\/tests\/.+\.test\.ts$/.test(p) ||
  /^supabase\/tests\/database\/.+\.test\.sql$/.test(p);
const isFlow = (p) =>
  p.startsWith(`${PATHS.flows}/`) && /\.ya?ml$/.test(p) && !p.endsWith('config.yaml');
const isSubflow = (p) => p.startsWith(`${PATHS.subflows}/`) && /\.ya?ml$/.test(p);

// ---------------------------------------------------------------------------
// Collect the changeset
// ---------------------------------------------------------------------------
let mode;
let base = null;
let changed = [];
const skipByDomain = new Map(); // domain key → reason

if (args.all) {
  mode = 'all';
  changed = [
    ...walk(PATHS.routes, { ext: ['.ts', '.tsx'] }),
    ...walk('apps/mobile/src', { ext: ['.ts', '.tsx'] }),
    ...walk(PATHS.ds, { ext: ['.ts', '.tsx'] }),
    ...walk('packages/api/src', { ext: ['.ts'] }),
    ...walk('supabase/migrations', { ext: ['.sql'] }),
  ].map((path) => ({ status: 'M', path }));
} else if (args.staged) {
  mode = 'staged';
  changed = stagedFiles();
  if (args['message-file']) {
    const message = readFileSync(args['message-file'], 'utf8');
    const reason = readTrailer(message, 'E2E-Skip');
    if (reason) skipByDomain.set('*', reason);
  }
} else {
  mode = 'base';
  base = resolveBase(args.base);
  if (!base) {
    report.error('Could not resolve a base ref. Pass --base <ref> (e.g. origin/main).');
    process.exit(report.finish());
  }
  changed = rangeFiles(base);
  for (const commit of commitsInRange(base)) {
    const reason = readTrailer(commit.message, 'E2E-Skip');
    if (!reason) continue;
    for (const f of commit.files) {
      const d = domainOf(f);
      if (d) skipByDomain.set(d.key, `${reason} (${commit.hash.slice(0, 7)})`);
    }
  }
}

report.info(
  `mode: ${mode}${base ? ` (base ${base})` : ''} · ${changed.length} file(s) in changeset`,
);

const changedSources = changed.filter((f) => isSource(f.path));
const changedFlows = new Set(
  changed
    .filter((f) => isFlow(f.path) || isSubflow(f.path) || isBackendTest(f.path))
    .map((f) => f.path),
);

if (changedSources.length === 0 && mode !== 'all') {
  report.info('no source files changed — nothing to verify');
  process.exit(report.finish());
}

// ---------------------------------------------------------------------------
// Rule 1 + 3: domain coverage
// ---------------------------------------------------------------------------
const flowFiles = listFlowFiles();
const subflowFiles = listSubflowFiles();
const allFlows = [...flowFiles, ...subflowFiles].map(parseFlow);
const isUsed = usageIndex(allFlows);

const domains = new Map(); // key → { descriptor, files: [], behaviour: [] }
const untracked = [];
for (const f of changedSources) {
  const d = domainOf(f.path);
  if (!d) {
    untracked.push(f.path);
    continue;
  }
  if (!domains.has(d.key)) domains.set(d.key, { descriptor: d, files: [], behaviour: [] });
  const entry = domains.get(d.key);
  entry.files.push(f.path);
  if (mode !== 'all') {
    const lines = addedLines(f.path, { mode, base });
    const hits = d.backend
      ? lines.filter((l) => l.trim() && !/^\s*(--|\/\/|\*|\/\*)/.test(l))
      : lines.filter((l) => BEHAVIOUR_RE.test(l));
    if (hits.length) entry.behaviour.push({ file: f.path, hits: hits.length });
  }
}

if (untracked.length && mode !== 'all') {
  report.info(
    `${untracked.length} source file(s) outside E2E domains (infra/config): ${untracked.map((p) => c.dim(p)).join(', ')}`,
  );
}

for (const { descriptor: d, files, behaviour } of domains.values()) {
  const domainFlows = coveringTests(d);
  const kindOfTest = d.backend ? 'test' : 'E2E flow';

  // Rule 1: a flow (app) or test file (backend) must exist
  if (domainFlows.length === 0) {
    const where =
      d.testFile ??
      (d.testsDir
        ? `${d.testsDir}/<name>${d.testExt}`
        : d.flowsDir
          ? `${d.flowsDir}/<name>.yaml`
          : d.flowFile);
    report.error(
      `${d.label}: no ${kindOfTest} found`,
      `Changed: ${files.join(', ')}\n    Create ${where} (see docs/TESTING.md).`,
    );
    continue;
  }

  // Rule 3: behaviour change needs a flow change in the same changeset
  if (mode === 'all' || behaviour.length === 0) {
    report.info(
      `${d.label}: ${files.length} file(s), covered by ${domainFlows.length} ${kindOfTest}(s)${behaviour.length === 0 && mode !== 'all' ? ' · no behaviour change detected' : ''}`,
    );
    continue;
  }
  const touchedFlow = domainFlows.some((p) => changedFlows.has(p));
  const skip = skipByDomain.get(d.key) ?? skipByDomain.get('*');
  const detail = behaviour.map((b) => `${b.file} (${b.hits} behavioural line(s))`).join(', ');
  if (touchedFlow) {
    report.info(`${d.label}: behaviour changed and ${kindOfTest}s updated ✓`);
  } else if (skip) {
    report.warn(
      `${d.label}: behaviour changed without flow change — skipped by trailer: ${skip}`,
      detail,
    );
  } else if (d.strict) {
    report.error(
      `${d.label}: behaviour changed but no ${kindOfTest} in ${d.testFile ?? d.testsDir ?? d.flowsDir ?? d.flowFile} was added or updated`,
      `${detail}\n    Add/adjust a ${kindOfTest}, or justify with a commit trailer:  E2E-Skip: <reason>`,
    );
  } else {
    report.warn(`${d.label}: behaviour changed without a flow change (non-strict domain)`, detail);
  }
}

// ---------------------------------------------------------------------------
// Rule 2: every static testID declared in changed files is used by some flow
// ---------------------------------------------------------------------------
for (const f of changedSources) {
  const d = domainOf(f.path);
  // Deleted in the working tree after being committed on the branch: nothing left to declare.
  if (!d || d.backend || !exists(f.path)) continue;
  const ids = extractTestIds(f.path);
  const unused = [...ids.static].filter((id) => !isUsed(id));
  if (unused.length) {
    report.error(
      `${f.path}: ${unused.length} testID(s) never used by any flow`,
      unused.map((id) => `• ${id}`).join('\n    ') +
        '\n    Every declared testID must be tapped or asserted by an E2E flow.',
    );
  }
}

// ---------------------------------------------------------------------------
// --all extras: every feature / component must have its flow
// ---------------------------------------------------------------------------
if (mode === 'all') {
  for (const feature of features) {
    if (!flowFiles.some((p) => p.startsWith(`${PATHS.flows}/${feature}/`))) {
      report.error(`feature "${feature}" has no flows in ${PATHS.flows}/${feature}/`);
    }
  }
  for (const name of dsComponents) {
    const file = `${PATHS.flows}/design-system/${kebab(name)}.yaml`;
    if (!exists(file)) report.error(`design-system component "${name}" has no flow at ${file}`);
  }
  for (const file of walk('packages/api/src/domains', { ext: ['.ts'] })) {
    const name = file.split('/').pop().replace(/\.ts$/, '');
    if (!exists(`packages/api/tests/${name}.test.ts`)) {
      report.error(
        `api domain "${name}" has no integration test at packages/api/tests/${name}.test.ts`,
      );
    }
  }
  if (
    walk('supabase/migrations', { ext: ['.sql'] }).length &&
    !walk('supabase/tests/database', { ext: ['.test.sql'] }).length
  ) {
    report.error('database migrations exist but supabase/tests/database has no pgTAP tests');
  }
  const all = collectAllTestIds();
  report.info(
    `${all.static.size} static testID(s) and ${all.patterns.length} dynamic pattern(s) declared across the repo`,
  );
}

process.exit(report.finish({ warningsAsErrors: Boolean(args.strict) }));
