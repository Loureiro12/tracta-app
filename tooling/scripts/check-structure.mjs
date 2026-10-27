#!/usr/bin/env node
/**
 * check-structure: enforces the project layout documented in docs/ARCHITECTURE.md.
 */
import { readdirSync } from 'node:fs';

import {
  PATHS,
  abs,
  exists,
  extractTestIds,
  isKebab,
  isPascal,
  kebab,
  listDsComponents,
  listFeatures,
  read,
  walk,
} from './lib/project.mjs';
import { Report } from './lib/report.mjs';

const report = new Report('check-structure · project layout');

const FEATURE_DIRS = new Set(['screens', 'components', 'hooks', 'model', 'api', 'lib']);

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------
const features = listFeatures();
report.info(`${features.length} feature(s): ${features.join(', ') || '—'}`);

for (const f of features) {
  const dir = `${PATHS.features}/${f}`;
  if (!isKebab(f)) report.error(`${dir}: feature folder must be kebab-case`);
  if (!exists(`${dir}/index.ts`)) report.error(`${dir}: missing index.ts (public barrel)`);
  const idsFile = `${dir}/${f}.testids.ts`;
  if (!exists(idsFile)) {
    report.error(
      `${dir}: missing ${f}.testids.ts`,
      "Declare test IDs with testId('<feature>', ...) in one place.",
    );
  } else {
    const ids = extractTestIds(idsFile);
    for (const id of ids.static) {
      if (!id.startsWith(`${f}.`))
        report.error(`${idsFile}: testID "${id}" must start with "${f}."`);
    }
    if (!ids.static.has(`${f}.screen`))
      report.error(`${idsFile}: must declare "${f}.screen" (used to assert arrival on the screen)`);
  }
  if (!exists(`${dir}/screens`)) {
    report.error(`${dir}: missing screens/ folder`);
  } else {
    const screens = walk(`${dir}/screens`, { ext: ['.tsx'] });
    if (screens.length === 0) report.error(`${dir}/screens: must contain at least one *Screen.tsx`);
    for (const s of screens) {
      const name = s.split('/').pop();
      if (!/^[A-Z][A-Za-z0-9]*Screen\.tsx$/.test(name))
        report.error(`${s}: screen files must be PascalCase and end with Screen.tsx`);
    }
  }
  for (const entry of readdirSync(abs(dir), { withFileTypes: true })) {
    if (entry.isDirectory() && !FEATURE_DIRS.has(entry.name)) {
      report.error(
        `${dir}/${entry.name}: unexpected folder`,
        `Allowed: ${[...FEATURE_DIRS].join(', ')}`,
      );
    }
  }
  for (const c of walk(`${dir}/components`, { ext: ['.tsx'] })) {
    const name = c.split('/').pop().replace('.tsx', '');
    if (!isPascal(name)) report.error(`${c}: component files must be PascalCase`);
  }
  for (const h of walk(`${dir}/hooks`, { ext: ['.ts', '.tsx'] })) {
    const name = h.split('/').pop();
    if (!/^use[A-Z]/.test(name)) report.error(`${h}: hook files must start with "use"`);
  }
  // Features must not import other features' internals (eslint covers aliases; this covers relative paths)
  for (const src of walk(dir, { ext: ['.ts', '.tsx'] })) {
    const text = read(src);
    const m = text.match(/from\s+['"]\.\.\/\.\.\/([a-z0-9-]+)\//);
    if (m && features.includes(m[1]) && m[1] !== f) {
      report.error(
        `${src}: imports internals of feature "${m[1]}"`,
        'Use the barrel: import { X } from "@/features/<name>"',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Routes (expo-router) must be thin
// ---------------------------------------------------------------------------
for (const route of walk(PATHS.routes, { ext: ['.tsx'] })) {
  const text = read(route);
  if (/\b(useState|useEffect|useReducer|StyleSheet\.create)\b/.test(text)) {
    report.error(
      `${route}: route files must stay thin (no state, effects or styles)`,
      'Move the logic into src/features/<feature>/screens.',
    );
  }
  if (!/export\s+default/.test(text))
    report.error(`${route}: expo-router routes need a default export`);
}

// ---------------------------------------------------------------------------
// Design system components
// ---------------------------------------------------------------------------
const components = listDsComponents();
report.info(`${components.length} design-system component(s): ${components.join(', ')}`);
const registry = exists(PATHS.dsRegistry) ? read(PATHS.dsRegistry) : '';
const barrel = exists(`${PATHS.dsComponents}/index.ts`)
  ? read(`${PATHS.dsComponents}/index.ts`)
  : '';

for (const name of components) {
  const dir = `${PATHS.dsComponents}/${name}`;
  const slug = kebab(name);
  if (!isPascal(name)) report.error(`${dir}: component folder must be PascalCase`);
  if (!exists(`${dir}/${name}.tsx`)) report.error(`${dir}: missing ${name}.tsx`);
  if (!exists(`${dir}/index.ts`)) report.error(`${dir}: missing index.ts`);
  const gallery = `${dir}/${name}.gallery.tsx`;
  if (!exists(gallery)) {
    report.error(
      `${dir}: missing ${name}.gallery.tsx`,
      'The gallery is what the E2E flow exercises.',
    );
  } else {
    const text = read(gallery);
    if (!text.includes(`'ds.${slug}'`))
      report.error(`${gallery}: must declare const ID = 'ds.${slug}'`);
    const ids = extractTestIds(gallery);
    if (!ids.static.has(`ds.${slug}.gallery`))
      report.error(`${gallery}: must render a root element with testID "ds.${slug}.gallery"`);
  }
  if (!new RegExp(`slug:\\s*'${slug}'`).test(registry)) {
    report.error(`${PATHS.dsRegistry}: component "${name}" is not registered (slug '${slug}')`);
  }
  if (!barrel.includes(`'./${name}'`))
    report.error(`${PATHS.dsComponents}/index.ts: "${name}" is not exported`);
  if (!exists(`${PATHS.flows}/design-system/${slug}.yaml`)) {
    report.error(`${dir}: missing E2E flow ${PATHS.flows}/design-system/${slug}.yaml`);
  }
  // Components must not reach into tokens' raw palette
  for (const src of walk(dir, { ext: ['.ts', '.tsx'] })) {
    if (/from\s+['"][./]+tokens\/colors['"]/.test(read(src)) && /\bpalette\b/.test(read(src))) {
      report.error(`${src}: components must use theme.colors, never the raw palette`);
    }
  }
}

// App code must never import the raw palette or tokens directly
for (const src of walk('apps/mobile/src', { ext: ['.ts', '.tsx'] })) {
  if (/@tracta\/design-system\/(src|dist)/.test(read(src)))
    report.error(`${src}: deep import into the design system`);
}

process.exit(report.finish());
