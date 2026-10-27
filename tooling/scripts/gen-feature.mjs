#!/usr/bin/env node
/** Scaffolds a feature with its screen, testIDs, route and smoke flow.  Usage: pnpm gen:feature <kebab-name> */
import { mkdirSync, writeFileSync } from 'node:fs';

import { PATHS, abs, exists, isKebab, pascal, read } from './lib/project.mjs';

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
  [`${dir}/i18n/en.json`]: `{
  "title": "${Pascal}",
  "subtitle": "Describe this screen in e2e/flows/${name}."
}
`,
  [`${dir}/i18n/pt-BR.json`]: `{
  "title": "${Pascal}",
  "subtitle": "Descreva esta tela em e2e/flows/${name}."
}
`,
  [`${dir}/i18n/index.ts`]: `import en from './en.json';
import ptBR from './pt-BR.json';

export const ${camel}Translations = { en, 'pt-BR': ptBR } as const;
`,
  [`${dir}/screens/${Pascal}Screen.tsx`]: `import { Heading, Screen, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { ${camel}Ids } from '../${name}.testids';

export function ${Pascal}Screen() {
  const { t } = useTranslation('${name}');
  return (
    <Screen testID={${camel}Ids.screen}>
      <Heading testID={${camel}Ids.title}>{t('title')}</Heading>
      <Text color="textSecondary">{t('subtitle')}</Text>
    </Screen>
  );
}
`,
  [`${dir}/index.ts`]: `export { ${Pascal}Screen } from './screens/${Pascal}Screen';
export { ${camel}Ids } from './${name}.testids';
export { ${camel}Translations } from './i18n';
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
- openLink: "tracta://${name}?locale=en"
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

// Register the namespace in the i18n composition root.
const resourcesPath = 'apps/mobile/src/app-providers/i18n/resources.ts';
let resources = read(resourcesPath);
const importRe = /^import \{ [a-zA-Z]+Translations \} from '@\/features\/[^']+';\n/gm;
const imports = resources.match(importRe) ?? [];
imports.push(`import { ${camel}Translations } from '@/features/${name}';\n`);
const pathOf = (line) => line.match(/from '([^']+)'/)[1].toLowerCase();
imports.sort((a, b) => (pathOf(a) < pathOf(b) ? -1 : pathOf(a) > pathOf(b) ? 1 : 0));
const firstImportAt = resources.search(importRe);
resources = resources.replace(importRe, '');
resources = resources.slice(0, firstImportAt) + imports.join('') + resources.slice(firstImportAt);
resources = resources.replace(
  /( {2}en: \{\n(?: {4}.*\n)*?)( {2}\},)/,
  `$1    ${name.includes('-') ? `'${name}'` : name}: ${camel}Translations.en,\n$2`,
);
resources = resources.replace(
  /( {2}'pt-BR': \{\n(?: {4}.*\n)*?)( {2}\},)/,
  `$1    ${name.includes('-') ? `'${name}'` : name}: ${camel}Translations['pt-BR'],\n$2`,
);
writeFileSync(abs(resourcesPath), resources);
console.log(`updated ${resourcesPath}`);
console.log(
  `\nNext: implement the screen, extend ${PATHS.flows}/${name}/, commit with scope (${name}).`,
);
