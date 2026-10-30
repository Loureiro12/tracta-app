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
│   ├── …_reference_data.sql    # biblioteca de exercícios e catálogo de programas
│   ├── …_photos_export.sql     # bucket progress-photos + progress_photos, export_my_data()
│   ├── …_achievements.sql      # achievements(), monthly_recap(), weekly_summary() (calculados)
│   └── …_health.sql            # health_connections, health_days (agregados diários) + upsert_health_days()
├── functions/invite-friend/    # edge function (Deno): convite de amigo por e-mail
├── templates/invite.html       # e-mail de convite do Auth (pt-BR/en pelo `locale` do convite)
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

## Fotos de progresso (Storage) e exportação

- **Bucket privado `progress-photos`** (criado na migration; até 5 MB, jpeg/png/webp/heic). Objetos em `<user_id>/<dia>-<sufixo>.<ext>`; as policies de `storage.objects` só deixam o dono ler, listar, enviar e apagar sob o próprio prefixo. A tabela `progress_photos` guarda dia, peso (última pesagem até o dia, se houver) e `storage_path`; o app mostra as fotos por URL assinada de 1 h (`photos.listPhotos`).
- **Apagar bytes é sempre pela API de Storage**: o Supabase recusa `delete from storage.objects` (deixaria arquivos órfãos). `photos.deletePhoto` apaga a linha e o objeto; `account.deleteAccount` remove todos os objetos do prefixo antes de `delete_account()` (as linhas caem em cascata). Excluir o histórico não apaga fotos.
- **`export_my_data()`** (security invoker, filtrado por `auth.uid()`) devolve um JSON `{ format, version, exported_at, user_id, email, profile, tables }`. `tables` traz toda tabela de `public` com `owner_id`/`user_id` (novas tabelas entram sozinhas), sessões com `sets`, rotinas com `exercises`, pedidos de amizade e cheers nos dois sentidos, e os metadados das fotos (os arquivos não vão no JSON). No app, Privacidade › Exportar grava o arquivo e abre a folha de compartilhamento (`account.exportData`).

## Convites por e-mail (edge function)

- **Fluxo:** o app chama `invites.inviteByEmail` → `functions.invoke('invite-friend')`. A função autentica o chamador pelo token, registra o convite com `create_email_invite()` (só service role: valida, deduplica por remetente+endereço, limite de 20 envios por dia, convites pendentes expiram em 30 dias) e, se o endereço ainda não tem conta, envia o e-mail com `auth.admin.inviteUserByEmail` (metadados `invited_by`, `invited_by_name`, `locale`). Se o endereço já tem conta confirmada, vira um pedido de amizade (notificação no app) e nenhum e-mail sai; a resposta é igual nos dois casos (sem enumeração de contas), mas o pedido criado aparece em "Convites enviados" como qualquer convite por @.
- **Cadastro do convidado:** o `inviteUserByEmail` cria um usuário não confirmado; quando ele se cadastra no app com o mesmo e-mail (ou confirma), o trigger `on_auth_user_confirmed_link_invites` marca os convites como `accepted` e cria o pedido de amizade de cada remetente. O botão do e-mail leva ao cadastro do app (`{{ .RedirectTo }}` = `INVITE_REDIRECT_URL`, padrão `tracta://signup`), não ao link de confirmação: confirmar pelo link deixaria a conta sem senha.
- **Link de convite:** o app mostra `tracta.app/convite/<handle>`; a rota `tracta://social/add/<handle>` abre o perfil e envia o pedido. Em produção a página web `https://tracta.app/convite/<handle>` deve redirecionar para esse deep link (universal links ainda não configurados).
- **Local:** `supabase start` serve as funções de `supabase/functions` (serviço edge-runtime). Se o stack subiu com `-x edge-runtime`, rode `supabase functions serve` em outro terminal; sem ele o envio por e-mail no app e `tests/invites.test.ts` falham. Os e-mails chegam no Mailpit (http://127.0.0.1:55324, API `/api/v1/search`). Mudanças em `config.toml`/`templates/` só valem após `supabase stop && supabase start`.

## Conquistas, recap e resumo semanal

Calculados na hora (sem tabela) por funções `security invoker` sobre `history_entries`, `session_sets` e `activities` do próprio usuário (`…_achievements.sql`, domínio `achievements` no `@tracta/api`). "Hoje"/início da semana vêm sempre do app. **Dia ativo** = dia local (São Paulo) com ao menos uma sessão ou atividade (corrida, caminhada…); semanas vão de segunda a domingo.

| Badge                        | Regra                                                                                                                                      | Progresso (bloqueada)                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `streak12` / `streak30`      | 12 / 30 dias ativos seguidos                                                                                                               | maior sequência / N                      |
| `workouts50` / `workouts100` | 50 / 100 registros (sessões + atividades); data = dia do N-ésimo                                                                           | total / N                                |
| `first5k`                    | primeira corrida com distância ≥ 5 km                                                                                                      | corrida mais longa / 5 km                |
| `oneTon`                     | primeira sessão com ≥ 1 000 kg de volume em séries válidas (sem aquecimento)                                                               | maior volume / 1 000 kg                  |
| `tenKSub55`                  | 10 parciais de 1 km consecutivas em < 55:00 (também dentro de corridas maiores)                                                            | 3 300 s / melhor 10 km                   |
| `perfectMonth`               | mês em que toda semana com segunda-feira nele bateu `goals.workouts_per_week` (meta atual); data = dia em que a última semana bateu a meta | semanas batidas / semanas do mês de hoje |

- `achievements(p_today)` devolve os 8 em ordem com `earned_on` (null = bloqueada), `progress` 0..1 (truncado; 1 quando conquistada), `current` e `target`. Registros depois de `p_today` não contam.
- `monthly_recap(p_today)`: mês de `p_today` do dia 1 até hoje vs o mês anterior inteiro (treinos, corridas, km, ritmo, mais longa, melhor 5 km, volume, séries, duração média, foco e exercício principais, sequência atual e recordes). A história de sono do recap continua no aparelho.
- `weekly_summary(p_week_start)` (segunda-feira; o app mostra a última semana completa): totais, dia a dia (`strength` > `run` > `other` > `rest`, com a letra da rotina), semana anterior, recordes e a corrida mais longa (`longestOfMonth`). Sono, passos e FC do resumo seguem do aparelho.
- **Recorde de força** (`strength_records(from, to)`): sessão cuja melhor série válida supera todas as anteriores do exercício (mais carga, depois mais reps; peso corporal compara reps). A primeira vez de um exercício não é recorde. `current_streak(dia)` conta até o dia anterior enquanto o dia não termina.

## Dados de demonstração e E2E

Os seeds definem loaders `seed.demo_<NN>_<o-que>()`; `seed.load_demo()` executa todos em ordem. A rota `tracta://e2e-sign-in` (só em builds com `EXPO_PUBLIC_E2E=1`) chama `public.e2e_reset_demo()` ainda sem login (restaura senha, e-mail e dados mesmo que o flow anterior tenha trocado a senha), apagando tudo que a conta demo pode alterar e reexecutando os loaders, e só então entra com a conta demo. A função aceita chamada anônima ou da própria conta demo; qualquer outro usuário logado é recusado. Essa função só existe onde os seeds rodaram (local/CI), nunca em produção. As fotos demo (`60_photos.sql`) são só linhas, sem arquivo (SQL não grava bytes no Storage), e o app mostra o placeholder; o reset apaga as linhas e os objetos enviados pelos flows.

## Percursos de GPS (`activities.route`)

- O app grava os pontos localmente (`apps/mobile/src/shared/location`: expo-location + expo-task-manager, também com a tela bloqueada) e calcula distância, ritmo e parciais a partir deles. Nada vai para o servidor antes de salvar; descartar apaga os pontos.
- Ao salvar, o percurso vai junto com a atividade em `activities.route`: **polyline codificada do Google** (precisão 5 ≈ 1 m, só lat/lng; os tempos ficam em `splits`). A coluna só aceita atividades com `gps = true` e strings no alfabeto da polyline (`?`–`~`).
- `@tracta/api` esconde o formato: `saveActivity({ route: [[lat, lng], …] })` codifica e `Activity.route` já vem decodificado (`null` sem percurso). Codec em `packages/api/src/polyline.ts`; o seed usa `seed.polyline()` (mesmo formato) para dar percursos às corridas da conta demo (`seeds/36_run_routes.sql`).
- O mapa usa react-native-maps (Apple Maps no iOS, Google Maps no Android com `GOOGLE_MAPS_API_KEY`); sem chave no Android, e sempre no E2E, o percurso é desenhado em SVG. No E2E o GPS é um replay determinístico de uma volta de 5 km no Ibirapuera, com o tempo acelerado 12×.

## Produção

1. Crie o projeto no Supabase e rode `supabase link --project-ref <ref>` e `supabase db push` (só migrations; seeds não vão).
2. Configure no painel: Site URL `tracta://`, redirect `tracta://**`, SMTP próprio, limites de taxa padrão e provedores Apple/Google quando houver credenciais.
3. Builds de release recebem `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (o app recusa iniciar sem eles fora de dev/E2E).
4. Edge functions: `supabase functions deploy invite-friend`. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetados; defina `INVITE_REDIRECT_URL` (`supabase secrets set`) se o botão do e-mail não for `tracta://signup`. O template de convite (`supabase/templates/invite.html`, assunto em `config.toml`) precisa ser copiado para Auth › Email Templates › Invite user, e o SMTP próprio é obrigatório (o SMTP padrão do Supabase só entrega para membros do time).
5. O job de E2E iOS da CI usa um projeto de staging com migrations + seed: defina os secrets `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY` e a variável `E2E_IOS_ENABLED=true`.

## Fora do backend (por ora)

Sono, passos, distância, energia e frequência cardíaca são **lidos** do Apple Health/Health Connect no aparelho (`apps/mobile/src/shared/health`: um `HealthSource` por plataforma e um fake determinístico no E2E) e **sincronizados como agregados diários**: `health_days` (um dia local por linha; o sono pertence ao dia em que a pessoa acordou) via `upsert_health_days()`, que exige uma linha em `health_connections` e carimba `last_synced_at`. Um trigger espelha `health_days.steps` em `daily_summaries.steps` (feed dos amigos e desafios) sem mexer no `updated_at` do resumo. Amostras brutas (minuto a minuto) nunca saem do aparelho; desconectar apaga só a conexão, e Privacidade › "Apagar dados de saúde sincronizados" apaga `health_days`. O GPS fica no aparelho enquanto a atividade acontece e só o percurso final é salvo (ver acima). Compras e assinaturas estão **ocultas no app por enquanto**: não há paywall, gerenciamento de plano nem selo PRO, e programas, provas e intervalados ficam liberados para todos. O backend mantém a tabela `subscriptions` e o `isPro` em `account.getAccount`, prontos para quando a integração com a loja voltar.
