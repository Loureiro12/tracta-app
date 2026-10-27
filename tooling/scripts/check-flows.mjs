#!/usr/bin/env node
/**
 * check-flows: validates Maestro flows against the source of truth (testIDs in code).
 *   - header has appId, name, tags; body has ≥1 assertVisible
 *   - flow folder matches a known domain (app, a feature, design-system)
 *   - every `id:` selector resolves to a declared testID (no dead selectors)
 *   - runFlow targets exist
 *   - text-only selectors are warnings (prefer id + text)
 */
import { dirname, resolve } from 'node:path';

import {
  PATHS,
  abs,
  collectAllTestIds,
  exists,
  listFlowFiles,
  listFeatures,
  listSubflowFiles,
  parseFlow,
  rel,
  selectorMatcher,
} from './lib/project.mjs';
import { Report, parseArgs } from './lib/report.mjs';

const args = parseArgs(process.argv.slice(2));
const report = new Report('check-flows · Maestro flows vs declared testIDs');

const APP_ID = 'com.tracta.mobile';
const knownDomains = new Set(['app', 'design-system', ...listFeatures()]);
const ids = collectAllTestIds();
const matches = selectorMatcher(ids);

const flowFiles = listFlowFiles();
const subflowFiles = listSubflowFiles();
report.info(
  `${flowFiles.length} flow(s), ${subflowFiles.length} subflow(s), ${ids.static.size} static testID(s)`,
);

const names = new Map();

for (const path of [...flowFiles, ...subflowFiles]) {
  const flow = parseFlow(path);
  const isSub = path.startsWith(`${PATHS.subflows}/`);

  if (flow.appId !== APP_ID)
    report.error(`${path}: appId must be "${APP_ID}" (got ${flow.appId ?? 'none'})`);

  if (!isSub) {
    const domain = path.slice(PATHS.flows.length + 1).split('/')[0];
    if (!knownDomains.has(domain)) {
      report.error(
        `${path}: folder "${domain}" is not a known domain`,
        `Known: ${[...knownDomains].join(', ')}`,
      );
    }
    if (!flow.name) report.error(`${path}: missing "name:" in header`);
    else if (names.has(flow.name))
      report.error(`${path}: duplicate flow name "${flow.name}" (also in ${names.get(flow.name)})`);
    else names.set(flow.name, path);
    if (flow.tags.length === 0) report.error(`${path}: missing "tags:" in header`);
    if (flow.asserts === 0)
      report.error(`${path}: no assertVisible — a flow must verify something`);
  }

  for (const target of flow.runFlows) {
    const targetPath = rel(resolve(dirname(abs(path)), target));
    if (!exists(targetPath)) report.error(`${path}: runFlow target not found: ${target}`);
  }

  for (const s of flow.selectors) {
    if (!matches(s.value)) {
      report.error(
        `${path}:${s.line}: selector id "${s.value}" does not match any declared testID`,
        'Declare it in a *.testids.ts file or on a design-system gallery, or fix the typo.',
      );
    }
  }
  for (const t of flow.textOnly) {
    report.warn(
      `${path}:${t.line}: ${t.action} uses a text-only selector "${t.value}"`,
      'Prefer { id: "<testID>", text: "..." } — text changes should not break navigation.',
    );
  }
}

process.exit(report.finish({ warningsAsErrors: Boolean(args.strict) }));
