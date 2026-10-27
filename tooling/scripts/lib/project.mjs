import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { repoRoot } from './git.mjs';

export const ROOT = repoRoot();
export const PATHS = {
  mobile: 'apps/mobile',
  routes: 'apps/mobile/app',
  features: 'apps/mobile/src/features',
  shared: 'apps/mobile/src/shared',
  providers: 'apps/mobile/src/app-providers',
  flows: 'apps/mobile/e2e/flows',
  subflows: 'apps/mobile/e2e/subflows',
  ds: 'packages/design-system/src',
  dsComponents: 'packages/design-system/src/components',
  dsRegistry: 'packages/design-system/src/gallery/registry.ts',
};

export const abs = (p) => join(ROOT, p);
export const rel = (p) => relative(ROOT, p).split(sep).join('/');
export const read = (p) => readFileSync(abs(p), 'utf8');
export const exists = (p) => existsSync(abs(p));

export function walk(dir, { ext } = {}) {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of readdirSync(abs(dir), { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...walk(p, { ext }));
    } else if (!ext || ext.some((e) => entry.name.endsWith(e))) {
      out.push(p);
    }
  }
  return out;
}

export function listDirs(dir) {
  if (!exists(dir)) return [];
  return readdirSync(abs(dir), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export const listFeatures = () => listDirs(PATHS.features);
export const listDsComponents = () => listDirs(PATHS.dsComponents);

export const kebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
export const pascal = (s) =>
  s
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

export const isKebab = (s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
export const isPascal = (s) => /^[A-Z][A-Za-z0-9]*$/.test(s);

// ---------------------------------------------------------------------------
// testID extraction
// ---------------------------------------------------------------------------

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Same-file string constants: `const ID = 'ds.box'`. */
function stringConsts(src) {
  const consts = new Map();
  for (const m of src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*['"`]([^'"`]+)['"`]/g)) {
    consts.set(m[1], m[2]);
  }
  return consts;
}

/**
 * Converts a template literal body into either a static id or a regex source.
 * `${CONST}` resolves against same-file consts; other placeholders become wildcards.
 */
function templateToId(body, consts) {
  let pattern = '';
  let isStatic = true;
  let cursor = 0;
  const re = /\$\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(body))) {
    pattern += escapeRe(body.slice(cursor, m.index));
    const expr = m[1].trim();
    if (consts.has(expr)) {
      pattern += escapeRe(consts.get(expr));
    } else {
      isStatic = false;
      pattern += m.index === 0 ? '.+' : '[^.]+';
    }
    cursor = m.index + m[0].length;
  }
  pattern += escapeRe(body.slice(cursor));
  if (isStatic) return { id: pattern.replace(/\\(.)/g, '$1'), pattern: null };
  return { id: null, pattern };
}

/**
 * Extracts every testID a source file declares.
 * Returns { static: Set<string>, patterns: string[] } where patterns are regex sources.
 */
export function extractTestIds(path) {
  const src = read(path);
  const consts = stringConsts(src);
  const result = { static: new Set(), patterns: [] };

  // testId('a', 'b', 'c')
  for (const m of src.matchAll(/testId\(([^)]*)\)/g)) {
    const segs = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
    if (segs.length >= 2) result.static.add(segs.join('.'));
  }
  // testID="a.b" | testID={'a.b'} | testID={"a.b"}
  for (const m of src.matchAll(/testID=(?:\{\s*)?['"]([^'"]+)['"]/g)) {
    result.static.add(m[1]);
  }
  // testID={`...`}
  for (const m of src.matchAll(/testID=\{\s*`([^`]+)`\s*\}/g)) {
    const r = templateToId(m[1], consts);
    if (r.id) result.static.add(r.id);
    else result.patterns.push(r.pattern);
  }
  // testID: `...` / testID: 'a.b' inside object literals (e.g. option lists)
  for (const m of src.matchAll(/testID:\s*['"]([^'"]+)['"]/g)) {
    result.static.add(m[1]);
  }
  for (const m of src.matchAll(/testID:\s*`([^`]+)`/g)) {
    const r = templateToId(m[1], consts);
    if (r.id) result.static.add(r.id);
    else result.patterns.push(r.pattern);
  }
  return result;
}

/** All testIDs across app + design system. */
export function collectAllTestIds() {
  const files = [
    ...walk(PATHS.routes, { ext: ['.tsx', '.ts'] }),
    ...walk('apps/mobile/src', { ext: ['.tsx', '.ts'] }),
    ...walk(PATHS.ds, { ext: ['.tsx', '.ts'] }),
  ];
  const all = { static: new Set(), patterns: [], byFile: new Map() };
  for (const f of files) {
    const ids = extractTestIds(f);
    all.byFile.set(f, ids);
    for (const id of ids.static) all.static.add(id);
    all.patterns.push(...ids.patterns);
  }
  return all;
}

// ---------------------------------------------------------------------------
// Maestro flow parsing (line based; enough for selectors and headers)
// ---------------------------------------------------------------------------

export function listFlowFiles() {
  return walk(PATHS.flows, { ext: ['.yaml', '.yml'] }).filter((f) => !f.endsWith('config.yaml'));
}
export function listSubflowFiles() {
  return walk(PATHS.subflows, { ext: ['.yaml', '.yml'] });
}

export function parseFlow(path) {
  const src = read(path);
  const [header = '', ...bodyParts] = src.split(/^---\s*$/m);
  const body = bodyParts.join('\n');
  const get = (key) => header.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null;
  const tags = [...header.matchAll(/^\s+-\s+(.+)$/gm)].map((m) => m[1].trim());
  const selectors = [];
  const textOnly = [];
  for (const [i, line] of body.split('\n').entries()) {
    const idMatch = line.match(/^\s*(?:-\s+)?id:\s*["']?([^"'#]+?)["']?\s*(?:#.*)?$/);
    if (idMatch) selectors.push({ value: idMatch[1].trim(), line: i + 1 });
    const textAction = line.match(
      /^\s*-\s*(tapOn|assertVisible|assertNotVisible):\s*["']([^"']+)["']\s*$/,
    );
    if (textAction) textOnly.push({ action: textAction[1], value: textAction[2], line: i + 1 });
  }
  const asserts = (body.match(/assertVisible/g) ?? []).length;
  const runFlows = [
    ...body.matchAll(/runFlow:\s*(?:\n\s+file:\s*)?["']?([^\s"']+\.ya?ml)["']?/g),
  ].map((m) => m[1]);
  return {
    path,
    header,
    body,
    appId: get('appId'),
    name: get('name'),
    tags,
    selectors,
    textOnly,
    asserts,
    runFlows,
  };
}

const REGEX_HINT = /[*[\]()|+?\\]/;

/** Builds a matcher that answers whether a flow selector points at a real testID. */
export function selectorMatcher(ids) {
  const staticIds = [...ids.static];
  const patternRes = ids.patterns.map((p) => new RegExp(`^${p}$`));
  return (selector) => {
    // ${ENV} placeholders in flows → wildcard segment
    if (selector.includes('${')) {
      const re = new RegExp(
        `^${selector
          .split(/\$\{[^}]+\}/)
          .map(escapeRe)
          .join('[^.]+')}$`,
      );
      if (staticIds.some((id) => re.test(id))) return true;
      const literalPrefix = selector.split('${')[0];
      return ids.patterns.some((p) => p.replace(/\\(.)/g, '$1').startsWith(literalPrefix));
    }
    if (REGEX_HINT.test(selector)) {
      let re;
      try {
        re = new RegExp(`^${selector}$`);
      } catch {
        return false;
      }
      return staticIds.some((id) => re.test(id));
    }
    if (ids.static.has(selector)) return true;
    return patternRes.some((re) => re.test(selector));
  };
}

/** Whether a declared static testID is referenced by any flow or subflow. */
export function usageIndex(flows) {
  const exact = new Set();
  const regexes = [];
  for (const f of flows) {
    for (const s of f.selectors) {
      if (s.value.includes('${')) {
        regexes.push(
          new RegExp(
            `^${s.value
              .split(/\$\{[^}]+\}/)
              .map(escapeRe)
              .join('[^.]+')}$`,
          ),
        );
      } else if (REGEX_HINT.test(s.value)) {
        try {
          regexes.push(new RegExp(`^${s.value}$`));
        } catch {
          /* reported by check-flows */
        }
      } else {
        exact.add(s.value);
      }
    }
  }
  return (id) => exact.has(id) || regexes.some((re) => re.test(id));
}

export function fileMtime(p) {
  return statSync(abs(p)).mtimeMs;
}
