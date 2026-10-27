#!/usr/bin/env node
/** Scaffolds a feature with its screen, testIDs, route and smoke flow.  Usage: pnpm gen:feature <kebab-name> */
import { mkdirSync, writeFileSync } from 'node:fs';

import { PATHS, abs, exists, isKebab, pascal } from './lib/project.mjs';

const name = process.argv[2];
if (!name || !isKebab(name)) {
  console.error('Usage: pnpm gen:feature <kebab-name>');
  process.exit(1);
}
const Pascal = pascal(name);
const camel = Pascal.charAt(0).toLowerCase() + Pascal.slice(1);
const dir = `${PATHS.features}/${name}`;
if (exists(dir)) {
  console.error(`Feature "${name}" already exists.`);
  process.exit(1);
}

const files = {
  [`${dir}/${name}.testids.ts`]: `import { testId } from '@tracta/design-system';

export const ${camel}Ids = {
  screen: testId('${name}', 'screen'),
  title: testId('${name}', 'title'),
} as const;
`,
  [`${dir}/screens/${Pascal}Screen.tsx`]: `import { Heading, Screen, Text } from '@tracta/design-system';

import { ${camel}Ids } from '../${name}.testids';

export function ${Pascal}Screen() {
  return (
    <Screen testID={${camel}Ids.screen}>
      <Heading testID={${camel}Ids.title}>${Pascal}</Heading>
      <Text color="textSecondary">TODO: describe this screen in e2e/flows/${name}.</Text>
    </Screen>
  );
}
`,
  [`${dir}/index.ts`]: `export { ${Pascal}Screen } from './screens/${Pascal}Screen';
export { ${camel}Ids } from './${name}.testids';
`,
  [`${PATHS.routes}/${name}.tsx`]: `import { ${Pascal}Screen } from '@/features/${name}';

export default ${Pascal}Screen;
`,
  [`${PATHS.flows}/${name}/${name}-smoke.yaml`]: `appId: com.tracta.mobile
name: ${name}-smoke
tags:
  - smoke
  - ${name}
---
- launchApp:
    clearState: true
- openLink: "tracta://${name}"
- assertVisible:
    id: "${name}.screen"
- assertVisible:
    id: "${name}.title"
    text: "${Pascal}"
`,
};

for (const [path, content] of Object.entries(files)) {
  mkdirSync(abs(path).replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(abs(path), content);
  console.log(`created ${path}`);
}
console.log(
  `\nNext: add "${name}" to apps/mobile/e2e/flows/config.yaml and commit with scope (${name}).`,
);
