# Testes: E2E-first com Maestro

## Por que só E2E

O app é validado do jeito que o usuário usa: instalado em um simulador/emulador, navegando por deep links e toques. Isso elimina mocks de navegação, de tema e de estado e faz do fluxo a especificação executável da feature. O custo é tempo de execução; por isso há a tag `smoke` para o subconjunto rápido e a CI roda a suíte completa.

## Organização

```
apps/mobile/e2e/
├── flows/
│   ├── config.yaml             # quais pastas executam
│   ├── app/                    # cold start, navegação, deep links
│   ├── <feature>/              # 1 pasta por feature, N fluxos
│   └── design-system/          # <slug>.yaml por componente + theme.yaml
└── subflows/                   # launch.yaml, open-gallery.yaml (reutilizáveis)
```

## Anatomia de um fluxo

```yaml
appId: com.tracta.mobile
name: home-counter # único no repo
tags: [smoke, home] # smoke = roda no pre-push opcional e em PR
---
- runFlow: ../../subflows/launch.yaml # cold start + assert home.screen
- tapOn:
    id: 'home.counter.increment'
- assertVisible:
    id: 'home.counter.value'
    text: '1 tap' # id + text: robusto e específico
```

Regras aplicadas por `check-flows`:

- cabeçalho com `appId`, `name`, `tags`; corpo com pelo menos um `assertVisible`;
- todo `id:` corresponde a um testID declarado no código (sem seletor morto);
- seletores só por texto geram warning (na CI, erro);
- `runFlow` aponta para arquivo existente.

## O que `check-tests` exige de um commit

| Alterou                                                | Precisa de                                         |
| ------------------------------------------------------ | -------------------------------------------------- |
| `src/features/<f>/**` ou `app/<f>.tsx`                 | ≥1 fluxo em `e2e/flows/<f>/`                       |
| `app/_layout.tsx`, `src/shared/**`, `app-providers/**` | ≥1 fluxo em `e2e/flows/app/` (não estrito)         |
| `design-system/src/components/<Nome>/**`               | `e2e/flows/design-system/<slug>.yaml`              |
| `design-system/src/{tokens,theme}/**`                  | `e2e/flows/design-system/theme.yaml` (não estrito) |

Além disso:

- **testIDs declarados nos arquivos alterados precisam ser usados** por algum fluxo. Se declarou, testou.
- **Mudança de comportamento exige mudança de fluxo no mesmo commit.** A heurística olha linhas adicionadas com `onPress`, `useState`, `useEffect`, `router.push`, `fetch(`, `testID` etc. Em domínios estritos (features, rotas, componentes) é erro; em `shared`/tokens é warning.
- Para justificar uma exceção (refatoração sem impacto, por exemplo), adicione no corpo do commit:

  ```
  refactor(home): extrai Counter para componente próprio

  E2E-Skip: extração pura, comportamento coberto por home-counter.yaml
  ```

  O trailer vale só para aquele commit e fica registrado no histórico.

## Rodando localmente

```bash
pnpm ios                                   # ou pnpm android: build de desenvolvimento
pnpm e2e                                   # todos os fluxos
pnpm --filter @tracta/mobile e2e:smoke     # só smoke
maestro test apps/mobile/e2e/flows/home    # uma pasta
maestro studio                             # inspecionar a árvore e testIDs
```

Deep links custom (`tracta://`) não funcionam no Expo Go; use um development build.

## Boas práticas

- Comece com `runFlow: ../../subflows/launch.yaml` (estado limpo) ou `open-gallery.yaml`.
- Assert na chegada de cada tela via `<feature>.screen`.
- Um fluxo por comportamento, nome no formato `<feature>-<comportamento>`.
- Nunca use `sleep`; prefira `assertVisible` com `timeout` ou `extendedWaitUntil`.
- Evite `tapOn: "Texto"`; use `id` e, quando relevante, `text` junto.
