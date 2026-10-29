# Arquitetura

## Pacotes

| Pacote                  | Papel                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `@tracta/mobile`        | App Expo. Rotas em `app/`, código em `src/`.                                        |
| `@tracta/api`           | Cliente Supabase tipado, tipos gerados e módulos por domínio. Ver BACKEND.md.       |
| `@tracta/design-system` | Tokens, tema e primitivos de UI. Única fonte de cores, espaçamento e tipografia.    |
| `@tracta/eslint-config` | Regras compartilhadas. `appConfig()` para apps, `libraryConfig()` para bibliotecas. |
| `@tracta/tsconfig`      | Bases de TypeScript (`react-native.json`, `react-native-library.json`).             |
| `@tracta/scripts`       | Guards de commit e geradores. Sem dependências externas.                            |

## App mobile

```
apps/mobile/
├── app/                         # expo-router. Cada arquivo = rota. Só re-exporta telas.
│   ├── _layout.tsx              # AppProviders + Stack raiz + AppChrome (banner/toast)
│   ├── (tabs)/                  # as 5 abas: index(home) · health · workouts · history · profile
│   │   └── _layout.tsx          # Tabs com AppTabBar (TabBar do DS + mini-player)
│   ├── (auth)/                  # welcome · login · signup · forgot · sent · connect/
│   ├── (overlays)/<feature>/    # overlays de tela cheia ("‹ Voltar"), slide lateral
│   ├── (sheets)/<feature>/      # bottom sheets (Sheet do DS em modal transparente)
│   ├── settings.tsx             # preferências do app (tema, idioma, estados demo)
│   └── design-system/           # galeria do DS (dev/E2E); deep link tracta://design-system/<slug>
├── src/
│   ├── app-providers/           # composição de providers (tema, i18n) e i18n/resources.ts + common/
│   ├── features/<feature>/      # domínio vertical
│   │   ├── index.ts             # barrel: ÚNICO ponto de importação externo
│   │   ├── <feature>.testids.ts # testIDs com testId('<feature>', ...)
│   │   ├── screens/*Screen.tsx  # telas (uma por rota)
│   │   ├── components/          # componentes exclusivos da feature (PascalCase)
│   │   ├── hooks/               # use*.ts
│   │   ├── model/               # store, tipos, schemas
│   │   ├── api/                 # chamadas remotas
│   │   ├── lib/                 # utilitários da feature
│   │   └── i18n/                # en.json, pt-BR.json, index.ts (namespace = nome da feature)
│   └── shared/                  # sem domínio: config/, i18n/ (mecânica), feedback/ (toast, banner, mini-player)
└── e2e/                         # fluxos Maestro (ver TESTING.md)
```

### Grupos de rota e hrefs

Os nomes de grupo são omitidos nos hrefs: `app/(overlays)/workouts/builder.tsx` abre com `router.push('/workouts/builder')`. Overlays desenham o próprio `BackHeader`; sheets renderizam `Sheet` com `onClose={() => router.back()}`. O `check-tests` ignora os grupos ao mapear rota → feature.

### Regras de dependência

- `app/` → `@/features/*` e `@tracta/design-system`. Rotas não têm estado, efeitos nem estilos (`check-structure`).
- `features/<a>` → `@/features/<b>` **somente pelo barrel** (`@/features/<b>`), `@/shared`, `@tracta/design-system`.
- `shared/` → nunca importa de `features/`.
- `design-system` → não conhece o app.
- Deep imports (`@tracta/design-system/src/...`) e subir mais de um diretório (`../../`) são erros de lint.

### Estado

Dados do servidor: React Query com hooks em `features/<f>/api/use*.ts` sobre `@/shared/api`. Sessão em `@/shared/session` (`useSession`, `useAccount`); o `SessionGate` mantém deslogados nas telas de `(auth)`.

Estado global por feature com `zustand` em `model/<feature>.store.ts`, exportado pelo barrel. Preferências do usuário (tema, idioma) ficam no store de `settings`, persistido em AsyncStorage. Providers globais só em `app-providers/`.

### Internacionalização

Mecânica em `shared/i18n` (não conhece features); copy em `features/<f>/i18n`; composição em `app-providers/i18n/resources.ts`. Ver [I18N.md](I18N.md).

## Alias

`@/` aponta para `apps/mobile/src`. Configurado em `tsconfig.json` (Expo resolve `paths` automaticamente).

## Geradores

- `pnpm gen:feature <kebab>`: cria feature, rota, testIDs e fluxo smoke.
- `pnpm gen:component <Pascal>`: cria componente do DS, galeria, registro e fluxo.
