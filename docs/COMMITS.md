# Commits e verificações

## Formato

Conventional Commits com **escopo obrigatório**:

```
<tipo>(<escopo>): <descrição em minúsculas, imperativo, ≤72 chars>

<corpo opcional>

<trailers opcionais>
```

- Tipos: `feat fix refactor perf test docs chore ci build revert style`.
- Escopos: `mobile design-system ds e2e i18n tooling ci docs repo deps` ou o nome de qualquer feature em `apps/mobile/src/features/` (lido dinamicamente pelo `commitlint.config.mjs`).
- Trailers reconhecidos: `E2E-Skip: <motivo>` (ver TESTING.md).

Exemplos:

```
feat(settings): permite escolher tema claro/escuro
fix(ds): Button ignora onPress enquanto loading
chore(deps): atualiza expo para 58.0.20
```

## Hooks (husky)

| Hook         | Executa                                                                                                    | Falha quando                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `pre-commit` | `lint-staged` (eslint --fix, prettier), `turbo typecheck`, `check-structure`                               | lint/tipos quebrados ou layout fora do padrão              |
| `commit-msg` | `commitlint`, `check-flows`, `check-tests --staged --message-file`                                         | mensagem inválida, seletor morto, código sem cobertura E2E |
| `pre-push`   | `turbo lint typecheck`, `check-structure`, `check-flows`, `check-tests` (base = upstream ou `origin/main`) | qualquer gate acima no conjunto de commits a enviar        |

`E2E_ON_PUSH=1 git push` também roda os fluxos `smoke` no simulador ligado.

Pular hooks (`--no-verify`) não é bloqueado localmente, mas a CI reexecuta tudo no PR.

## CI (GitHub Actions)

- `quality`: lint, typecheck, prettier, structure, flows (`--strict`), commitlint no range do PR, `check-tests --base origin/<base>`; em `main`, `check-tests --all` audita o repositório inteiro.
- `e2e-android`: `expo prebuild` + Gradle release + Maestro em emulador (todo PR).
- `e2e-ios`: build de simulador + Maestro (push em `main` e manual, por custo de runner macOS).

## Comandos manuais

```bash
pnpm check                          # replica o job quality
node tooling/scripts/check-tests.mjs --staged
node tooling/scripts/check-tests.mjs --base origin/main
node tooling/scripts/check-tests.mjs --all
node tooling/scripts/check-flows.mjs --strict
node tooling/scripts/check-structure.mjs
```
