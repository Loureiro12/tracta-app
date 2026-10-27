#!/usr/bin/env node
/** Scaffolds a design-system component with gallery, registry entry and flow.  Usage: pnpm gen:component <PascalName> */
import { mkdirSync, writeFileSync } from 'node:fs';

import { PATHS, abs, exists, isPascal, kebab, read } from './lib/project.mjs';

const name = process.argv[2];
if (!name || !isPascal(name)) {
  console.error('Usage: pnpm gen:component <PascalName>');
  process.exit(1);
}
const slug = kebab(name);
const dir = `${PATHS.dsComponents}/${name}`;
if (exists(dir)) {
  console.error(`Component "${name}" already exists.`);
  process.exit(1);
}

const files = {
  [`${dir}/${name}.tsx`]: `import { Box } from '../Box/Box';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';

export type ${name}Props = Testable & {
  label: string;
};

export function ${name}({ label, testID }: ${name}Props) {
  return (
    <Box testID={testID} p="md" bg="surface" radius="md">
      <Text testID={\`\${testID}.label\`}>{label}</Text>
    </Box>
  );
}
`,
  [`${dir}/index.ts`]: `export { ${name} } from './${name}';
export type { ${name}Props } from './${name}';
`,
  [`${dir}/${name}.gallery.tsx`]: `import { ${name} } from './${name}';
import { VStack } from '../Stack/Stack';

const ID = 'ds.${slug}';

export function ${name}Gallery() {
  return (
    <VStack testID={\`\${ID}.gallery\`}>
      <${name} testID={\`\${ID}.default\`} label="Default" />
    </VStack>
  );
}
`,
  [`${PATHS.flows}/design-system/${slug}.yaml`]: `appId: com.tracta.mobile
name: ds-${slug}
tags:
  - design-system
---
- runFlow:
    file: ../../subflows/open-gallery.yaml
    env:
      SLUG: ${slug}
- assertVisible:
    id: "ds.${slug}.gallery"
- assertVisible:
    id: "ds.${slug}.default.label"
    text: "Default"
`,
};

for (const [path, content] of Object.entries(files)) {
  mkdirSync(abs(path).replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(abs(path), content);
  console.log(`created ${path}`);
}

// barrel
const barrelPath = `${PATHS.dsComponents}/index.ts`;
writeFileSync(abs(barrelPath), read(barrelPath).trimEnd() + `\nexport * from './${name}';\n`);
console.log(`updated ${barrelPath}`);

// registry: keep gallery imports sorted the way eslint import/order expects (case-insensitive, by path)
const registry = read(PATHS.dsRegistry);
const importRe = /^import \{ [A-Za-z]+Gallery \} from '\.\.\/components\/[^\n]+;\n/gm;
const imports = registry.match(importRe) ?? [];
imports.push(`import { ${name}Gallery } from '../components/${name}/${name}.gallery';\n`);
const pathOf = (line) => line.match(/from '([^']+)'/)[1].toLowerCase();
imports.sort((a, b) => (pathOf(a) < pathOf(b) ? -1 : pathOf(a) > pathOf(b) ? 1 : 0));
const firstImportAt = registry.search(importRe);
const withoutImports = registry.replace(importRe, '');
const withImport =
  withoutImports.slice(0, firstImportAt) + imports.join('') + withoutImports.slice(firstImportAt);
const withEntry = withImport.replace(
  /(\n\];)/,
  `\n  { slug: '${slug}', name: '${name}', Gallery: ${name}Gallery },$1`,
);
writeFileSync(abs(PATHS.dsRegistry), withEntry);
console.log(`updated ${PATHS.dsRegistry}`);
console.log('\nRun: pnpm check:structure && pnpm lint');
