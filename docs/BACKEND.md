# Backend (Supabase)

O backend é Postgres + Auth do Supabase. Não há servidor próprio: as regras de negócio que precisam de garantia vivem no banco (constraints, RLS, funções e triggers) e o app fala com ele pelo pacote tipado `@tracta/api`.

## Estrutura

```
supabase/
├── config.toml                 # stack local (portas 553xx, para não colidir com outros projetos)
├── migrations/                 # schema versionado (aplicado em todos os ambientes)
│   ├── …_core.sql              # profiles, user_settings, goals + bootstrap no cadastro
│   ├── …_training.sql          # exercises, routines, programs, races
│   ├── …_logging.sql           # workout_sessions, session_sets, activities, body_measurements
│   ├── …_social.sql            # friend_requests, daily_summaries, challenges, cheers
│   ├── …_inbox_billing.sql     # notifications (triggers), subscriptions (somente leitura), delete_account
│   └── …_reference_data.sql    # biblioteca de exercícios e catálogo de programas
├── seeds/                      # SÓ local/CI: helpers de teste, conta demo e loaders seed.demo_*
└── tests/database/*.test.sql   # testes pgTAP (RLS, constraints, RPCs, triggers)

packages/api/                   # @tracta/api
├── src/client.ts               # createTractaClient (sessão persistida no app)
├── src/errors.ts               # ApiError com códigos estáveis (invalid_credentials, email_taken…)
├── src/database.types.ts       # GERADO: pnpm gen:types (nunca edite à mão)
├── src/domains/*.ts            # um módulo por domínio, entradas validadas com zod, tipos camelCase
└── tests/*.test.ts             # integração com vitest contra o Supabase real
```

## Rodando

```bash
pnpm db:start        # sobe o Supabase local (Docker) com migrations + seed
pnpm db:reset        # recria o banco do zero e regenera os tipos
pnpm db:test         # pgTAP
pnpm test:api        # vitest de integração (exige o Supabase rodando)
pnpm test:backend    # os dois
pnpm gen:types       # regenera packages/api/src/database.types.ts a partir do banco
```

Studio: http://127.0.0.1:55323 · e-mails (Mailpit): http://127.0.0.1:55324.

Conta de demonstração (local/CI): `lucas@tracta.app` / `Tracta2026`. Amigos: ana, bruno, carla (aceitos); diego e elisa (não amigos, para convites).

## Regras

- **RLS em todas as tabelas.** Por padrão só o dono lê e escreve. O social nunca expõe sessões brutas: amigos veem `daily_summaries` filtrados pelas chaves `share_*` do dono, via `friend_days()`.
- **Clientes não escrevem o que o servidor decide:** `notifications` (triggers), `subscriptions` (webhook da loja com service role), `profiles/user_settings/goals` são criados pelo trigger de cadastro.
- **Mudança de schema = nova migration + teste pgTAP no mesmo commit** (o `check-tests` bloqueia). Nunca edite uma migration já aplicada em produção.
- **Mudança em `packages/api/src/domains/<d>.ts` = mudança em `packages/api/tests/<d>.test.ts`.**
- **Tipos gerados sempre em dia:** a CI regenera e falha se houver diferença.
- **Datas "de hoje"** vêm de `@/shared/clock` no app; o E2E congela em 2026-10-26 para casar com o seed.

## Dados de demonstração e E2E

Os seeds definem loaders `seed.demo_<NN>_<o-que>()`; `seed.load_demo()` executa todos em ordem. A rota `tracta://e2e-sign-in` (só em builds com `EXPO_PUBLIC_E2E=1`) chama `public.e2e_reset_demo()` ainda sem login (restaura senha, e-mail e dados mesmo que o flow anterior tenha trocado a senha), apagando tudo que a conta demo pode alterar e reexecutando os loaders, e só então entra com a conta demo. A função aceita chamada anônima ou da própria conta demo; qualquer outro usuário logado é recusado. Essa função só existe onde os seeds rodaram (local/CI), nunca em produção.

## Produção

1. Crie o projeto no Supabase e rode `supabase link --project-ref <ref>` e `supabase db push` (só migrations; seeds não vão).
2. Configure no painel: Site URL `tracta://`, redirect `tracta://**`, SMTP próprio, limites de taxa padrão e provedores Apple/Google quando houver credenciais.
3. Builds de release recebem `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (o app recusa iniciar sem eles fora de dev/E2E).
4. O job de E2E iOS da CI usa um projeto de staging com migrations + seed: defina os secrets `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY` e a variável `E2E_IOS_ENABLED=true`.

## Fora do backend (por ora)

Sono, passos e frequência cardíaca vêm do Apple Health/Health Connect no aparelho; GPS é local; fotos de progresso ficam no aparelho. Compras (Pro) não têm integração com loja ainda: o app lê o status real e simula a compra localmente.
