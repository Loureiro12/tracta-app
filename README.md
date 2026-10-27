# Tracta

Monorepo do app mobile (React Native + Expo). O projeto é **E2E-first**: toda tela, fluxo e componente de UI é especificado e validado por um fluxo Maestro de ponta a ponta. Não há testes unitários; se não existe fluxo, não está pronto.

## Estrutura

```
tracta/
├── apps/
│   └── mobile/                 # app Expo (expo-router)
│       ├── app/                # rotas (finas: só exportam telas das features)
│       ├── src/
│       │   ├── features/<f>/   # screens, components, hooks, model, <f>.testids.ts, index.ts
│       │   ├── shared/         # lib, config (código sem domínio)
│       │   └── app-providers/  # composição de providers globais
│       └── e2e/
│           ├── flows/<dominio>/*.yaml   # fluxos Maestro (app, <feature>, design-system)
│           └── subflows/                # passos reutilizáveis
├── packages/
│   └── design-system/          # tokens, tema, primitivos testáveis, galeria
├── tooling/
│   ├── eslint-config/          # regras compartilhadas (força o DS e isola features)
│   ├── tsconfig/               # bases de TypeScript
│   └── scripts/                # guards de commit: check-tests, check-flows, check-structure, geradores
└── docs/                       # ARCHITECTURE, DESIGN_SYSTEM, TESTING, COMMITS
```

## Começando

```bash
corepack enable && corepack prepare pnpm@10.32.1 --activate   # ou instale o pnpm 10
pnpm install                 # instala e ativa os hooks do husky
pnpm dev                     # expo start (Expo Go não suporta deep link custom; use dev build)
pnpm ios                     # build de desenvolvimento no simulador (necessário para E2E)
pnpm android
```

Requisitos para E2E: [Maestro CLI](https://maestro.mobile.dev) instalado e um simulador/emulador ligado.

```bash
pnpm e2e                              # roda todos os fluxos
pnpm --filter @tracta/mobile e2e:smoke  # só os marcados com a tag smoke
pnpm --filter @tracta/mobile e2e:studio # inspecionar testIDs na tela
```

## Fluxo de trabalho

1. `pnpm gen:feature minha-feature` ou `pnpm gen:component MeuComponente` para criar a estrutura padrão (tela/rota/testIDs/fluxo já ligados).
2. Implemente usando **apenas** componentes de `@tracta/design-system`. O ESLint bloqueia `View`, `Text`, `Pressable` etc. do `react-native` dentro do app e cores/estilos literais.
3. Declare testIDs em `<feature>.testids.ts` e escreva o fluxo em `apps/mobile/e2e/flows/<feature>/`.
4. Commit com Conventional Commits e escopo: `feat(minha-feature): adiciona listagem`.

## O que cada commit passa

| Momento      | Verificação                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `pre-commit` | ESLint + Prettier nos arquivos staged, typecheck, `check-structure`                             |
| `commit-msg` | commitlint, `check-flows` (seletores apontam para testIDs reais), `check-tests` (cobertura E2E) |
| `pre-push`   | lint, typecheck, structure, flows e `check-tests` contra a base; `E2E_ON_PUSH=1` roda o smoke   |
| CI (PR)      | tudo acima + build Android e execução dos fluxos no emulador; iOS roda em `main`/manual         |

`check-tests` falha quando: o domínio alterado não tem fluxo; um testID declarado não é usado por nenhum fluxo; houve mudança de comportamento sem alterar um fluxo do domínio. Para a última regra, justifique com o trailer `E2E-Skip: <motivo>` no corpo do commit.

Detalhes em [docs/COMMITS.md](docs/COMMITS.md) e [docs/TESTING.md](docs/TESTING.md).

## Comandos úteis

```bash
pnpm check                   # tudo que a CI roda (exceto E2E)
pnpm check:tests --all       # auditoria de cobertura E2E do repositório inteiro
pnpm check:tests --base main # o que mudou desde main está coberto?
pnpm lint:fix && pnpm format
```
