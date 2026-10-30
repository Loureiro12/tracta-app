# Testes

Três camadas, cada uma no lugar certo:

| Camada | Ferramenta                                      | Onde                                 | Cobre                                                              |
| ------ | ----------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Banco  | pgTAP (`pnpm db:test`)                          | `supabase/tests/database/*.test.sql` | RLS entre usuários, constraints, RPCs, triggers                    |
| API    | vitest contra o Supabase real (`pnpm test:api`) | `packages/api/tests/*.test.ts`       | contratos do `@tracta/api`, validação, códigos de erro, isolamento |
| App    | Maestro (`pnpm e2e`)                            | `apps/mobile/e2e/flows/**`           | comportamento de ponta a ponta no simulador, com backend real      |

Não há mocks de rede: os testes de API e o E2E falam com o Supabase local (`pnpm db:start`). Os de API criam usuários próprios por teste, então rodam em paralelo; o E2E usa a conta demo restaurada a cada fluxo (ver docs/BACKEND.md).

# E2E com Maestro

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

Backend: mudou `supabase/migrations/*` → algum `supabase/tests/database/*.test.sql` muda junto; mudou `supabase/functions/<fn>/**` → algum `packages/api/tests/*.test.ts` muda junto (as funções são testadas pela API, com `functions.invoke`); mudou `packages/api/src/domains/<d>.ts` → `packages/api/tests/<d>.test.ts` muda junto (mesmo trailer `E2E-Skip:` para exceções).

App:

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

Dois modos:

- **Debug + Metro (iteração rápida):** `pnpm ios` uma vez (build Debug no simulador), depois `pnpm dev` em outro terminal e `pnpm e2e`. O app carrega o bundle do Metro; mudanças de JS recarregam sem rebuild. Não edite código enquanto a suíte roda: o reload derruba o fluxo em execução.
- **Disco:** cada execução grava logs e screenshots em `~/.maestro/tests` (dezenas de MB por fluxo; uma suíte inteira passa de 5 GB). Limpe periodicamente com `rm -rf ~/.maestro/tests`; com o disco cheio o Maestro aborta a suíte no meio sem gerar o relatório.
- **Atenção ao watcher do Metro:** sem o Watchman instalado (`brew install watchman`), o Metro pode não perceber mudanças em `packages/design-system` nem remoção/criação de arquivos em `app/` e seguir servindo um bundle antigo. Se um comportamento "não muda", reinicie com `pnpm expo start --clear`.
- **Limite do modo Debug:** no build Debug os snapshots de hierarquia são lentos e, em fluxos longos (>60 s), o Maestro pode derrubar o próprio runner ("Exiting due to IDE disconnection" → "Failed to connect"). Use o Debug para iterar; a referência de aprovação é a suíte no build Release.
- **Release (o que a CI faz):** `pnpm --filter @tracta/mobile e2e:ios` (build Release com `EXPO_PUBLIC_E2E=1` e bundle embutido) e depois `pnpm e2e`.

Comandos:

```bash
pnpm ios                                   # ou pnpm android: build de desenvolvimento
pnpm e2e                                   # todos os fluxos
pnpm --filter @tracta/mobile e2e:smoke     # só smoke
maestro test apps/mobile/e2e/flows/home    # uma pasta
maestro studio                             # inspecionar a árvore e testIDs
```

Deep links custom (`tracta://`) não funcionam no Expo Go; use um development build.

## Idioma nos fluxos

Os textos assertados são em inglês. O subflow `launch.yaml` abre `tracta://?locale=en` após o cold start, e `open-gallery.yaml` passa `?locale=en` no deep link; qualquer `openLink` direto deve fazer o mesmo. Assim a suíte não depende do idioma do simulador. Para testar outro idioma, troque pela tela de Settings dentro do fluxo (ver `settings/settings-language.yaml`).

Builds para E2E usam `EXPO_PUBLIC_E2E=1` (scripts `e2e:ios`/`e2e:android` e a CI), que mantém a galeria do design system acessível em Release.

## iOS: alerta "Abrir com Tracta?"

Na primeira vez que um deep link de scheme custom abre em um simulador, o iOS pede confirmação. O subflow `subflows/accept-deep-link-prompt.yaml` toca em "Open|Abrir" se o alerta estiver visível e é chamado após todo `openLink`. A aceitação fica gravada no simulador. Se fluxos forem abortados repetidas vezes, os alertas se empilham e nenhum tap resolve: reinicie o simulador (`xcrun simctl shutdown <udid> && xcrun simctl boot <udid>`).

O iOS também pode interromper um fluxo com alertas de sistema sem testID (ex.: "Ativar Ditado?" após digitar num campo). O subflow `subflows/dismiss-system-dialogs.yaml` dispensa esses alertas e é chamado no `launch.yaml` e logo após cada `inputText`; um alerta preso bloqueia todos os fluxos seguintes, então reinicie o simulador se a suíte inteira começar a falhar na `home.screen`.

O comando `back` do Maestro só funciona no Android. Toda tela que precisa de "voltar" expõe o próprio botão com testID (`settings.nav.back`, `ds.index.back`).

## Regras aprendidas no iOS (XCUITest)

- `assertVisible: { id, text }` só casa quando **id e texto estão no mesmo elemento**. Asserte o texto no `Text` filho (`<id>.label`, `<id>.title`, `.message`), não no container. `Chip` e `Toast` expõem o texto no container de propósito.
- Um `Switch` dentro de uma linha tocável (`ListRow onPress`) não aparece para o XCUITest: toque na linha.
- `hideKeyboard` é instável (falha no teclado numérico e às vezes no alfanumérico). Toque num texto simples dentro do scroll (`<campo>.label`) ou role a lista: `Screen` e `Sheet` fecham o teclado ao arrastar.
- Listas horizontais: `scrollUntilVisible` só rola a partir do centro da tela. Use `repeat … while notVisible` com `swipe from: <id do container> direction: LEFT` (ver `history-evolution.yaml`).
- Antes de tocar em algo perto do rodapé, `scrollUntilVisible` com `centerElement: true`, senão o toque cai na tab bar.
- Toasts aparecem sobre sheets porque cada rota `(sheets)` monta o próprio `AppChrome` (`screenLayout` no `_layout.tsx` raiz); overlays de janela inteira (`FullWindowOverlay`) escondem o app do Maestro.
- Deep link a frio é perdido: espere a `home.screen` antes de `openLink` (o `launch.yaml` já faz isso).

## Boas práticas

- Comece com `runFlow: ../../subflows/launch.yaml` (estado limpo, locale en) ou `open-gallery.yaml`.
- Assert na chegada de cada tela via `<feature>.screen`.
- Um fluxo por comportamento, nome no formato `<feature>-<comportamento>`.
- Nunca use `sleep`; prefira `assertVisible` com `timeout` ou `extendedWaitUntil`.
- Evite `tapOn: "Texto"`; use `id` e, quando relevante, `text` junto.
