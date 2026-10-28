# Handoff: Tracta — app de musculação, corrida e saúde (iOS/Android)

## Overview
Tracta é um app mobile para quem combina **musculação e corrida**. O usuário registra treinos série a série, corre com GPS, acompanha sono e atividade (Apple Health / Health Connect), planeja semanas (programas, prova-alvo), compete com amigos e compartilha a evolução. Público: 25–40 anos, urbano, treino híbrido, quer constância e valoriza privacidade. Idioma base: **pt-BR**; marca pensada para uso global (nome sem acento, descrição de loja localizada).

## About the Design Files
Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram aparência e comportamento, **não código de produção**. A tarefa é **recriar estas telas no ambiente do app** (React Native, SwiftUI, Flutter, Kotlin etc.) usando os padrões e bibliotecas do projeto. Se ainda não houver projeto, recomendamos **React Native (Expo)** ou **SwiftUI + Jetpack Compose** — o app depende muito de APIs nativas (HealthKit, Health Connect, GPS em segundo plano, Live Activities, widgets, watchOS).

Para abrir: sirva a pasta por HTTP local (ex.: `npx serve .`) e abra `Tracta App.dc.html`. O `support.js` é só o runtime do protótipo; não faz parte do produto. A lógica do protótipo (dados mock, regras) está na classe `Component` dentro de `<script type="text/x-dc">` no fim de cada arquivo — leia para entender regras de negócio.

## Fidelity
**Alta fidelidade.** Cores, tipografia, espaçamentos, raios e textos são finais. Recriar pixel a pixel (moldura de 390×844 pt = iPhone 14/15). Dados numéricos são mock.

---

## Design Tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| brand | `#D8613C` | laranja-tijolo: preenchimentos de destaque, chaves ligadas, barras de gráfico, CTA secundário, ícone |
| brand-text | `#B4482A` | texto/link/ícone de navegação em laranja sobre fundo claro (contraste ≥4.5:1) |
| brand-dark | `#8F3A22` | hover/pressed de link; texto sobre `brand-tint` |
| brand-tint | `#FBE5DC` | chips/realces claros |
| brand-on-dark | `#F0A487` | laranja sobre fundo escuro |
| ink | `#1A1A17` | texto principal, botões primários (fundo), cartões escuros |
| bg | `#F2EEE6` | areia — fundo de todas as telas |
| surface | `#FFFFFF` | cartões |
| fill-1 | `#E8E2D6` | botões/pílulas neutras (Editar, ícones redondos) |
| fill-2 | `#EBE5DA` | segmentados, chips |
| fill-3 | `#E5DFD2` | trilhos de segmentado |
| track | `#E3DDD0` | trilho de barras de progresso |
| switch-off | `#DAD3C5` | chave desligada, alça de sheet |
| text-2 | `#6B6A63` | texto secundário |
| text-3 | `#8F8E86` | terciário, chevrons |
| danger | `#B3261E` | excluir/destrutivo, recordes em listas |
| success / meta | `#1F6F5C` | "Conectado", meta atingida, WhatsApp |
| warn | `#8A6100` texto · `#FBF1D6` fundo | avisos, "a verificar" |
| run (dado) | `#2E86C1` | corrida/cardio em gráficos e plano semanal |
| sleep (dado) | `#5B5FD6` (claro `#D7D8F3`) | sono |
| social | `#4B4FC4` sobre `#E7E4FA` | superset, amigos |
| moldura | `#D9D3C6` | fundo atrás do celular (só protótipo) |

Plano semanal: musculação = `brand`, corrida = `run`, descanso = `fill-2` com texto `text-3`.

### Tipografia
Família única: **Archivo** (Google Fonts, eixo de largura `wdth` 62–125, peso 400–900).
- Título de tela (header fixo): 30px / 700 / `font-stretch:80%`
- Título grande de overlay: 34–36px / 800 / stretch 75%, line-height 1
- Número herói: 52–96px / 700–800 / stretch 70–75%, line-height .85–.9, `tabular-nums`
- Título de cartão: 16–18px / 600–700
- Corpo: 15px / 400–600; secundário 13px; legenda 11–12px
- Botão: 15–17px / 700–800
- Wordmark TRACTA: 800 / `font-stretch:112%` / letter-spacing .01–.04em / caixa alta
Números sempre com `font-variant-numeric: tabular-nums` em timers.

### Espaçamento, raio, sombra
- Padding lateral de tela: **20px**; gap vertical entre blocos: 12–14px; dentro de cartão: 16–18px.
- Raios: cartão 20–22px · sheet 28px (topo) · botão grande 16–18px · pílula 18–20px · chip 8–14px · ícone app 34/150 do lado.
- Alvos de toque ≥ 44px.
- Sombras: mini-player/toast `0 10px 30px rgba(0,0,0,.18)`; CTA de destaque `0 8px 20px rgba(26,26,23,.18)`; cartão de compartilhar `0 18px 40px rgba(26,26,23,.22)`.
- Divisórias: `1px solid rgba(26,26,23,.06–.08)`.
- Tab bar: altura 88, fundo `rgba(242,238,230,.92)` + `backdrop-filter: blur(16px)`.

### Logo
Símbolo: quadrado arredondado `ink` com **três barras verticais crescentes** alinhadas na base (alturas 34/54/76 em caixa de 150; larguras 22; gap 10; padding-bottom 38). As duas primeiras em `bg` (#F2EEE6), a terceira em `brand`. Wordmark: "TRACTA". Ver `Marca - Nome Logo e Cor.dc.html` (opção **2a** aprovada). Exportar como SVG vetorial a partir dessas proporções.

---

## Navegação
Tab bar com 5 abas: **Início · Saúde · Treinos · Histórico · Perfil**. Cada aba tem **header fixo** (sticky) com título 30px e ações à direita. Overlays de tela cheia (z acima da tab bar) com botão "‹ Voltar" sticky; bottom sheets com alça, título central e "Fechar"/"Cancelar".

## Screens / Views
(Todos no arquivo `Tracta App.dc.html`; nomes entre parênteses = flags do protótipo.)

### 1. Autenticação e conexões (`showAuth`)
- **Boas-vindas** (`aWelcome`): símbolo + TRACTA 64px, três perguntas ("Como estou? / O que vou fazer? / Como estou evoluindo?"), CTA primário "Criar conta" (ink, 56px), secundário "Já tenho conta". **Não há entrar sem conta.**
- **Login / Cadastro / Esqueci a senha / E-mail enviado** (`aLogin`, `aSignup`, `aForgot`, `aSent`): validação inline por campo (e-mail, senha ≥8, nome, aceite de termos), mensagens abaixo do campo em `danger`; botão com estado carregando; reenvio com contagem.
- **Conexões** (`aConnect`, `aHealth`): Apple Health/Google Health — escolha de tipos de dado com chaves (passos, distância, energia, FC, sono, treinos; gravar treinos/distância), explicação do que é lido e gravado. Modos onboarding vs. configurações.

### 2. Tour inicial (`showTour`)
Primeiro acesso após cadastro: modal de boas-vindas + spotlights sobre as principais áreas (Início, Treinos, Saúde, Histórico, Perfil) com "Anterior/Próximo/Pular". Reabrível em Perfil › "Ver tour do app".

### 3. Início (`isHome`)
Header: data, "Como estou hoje", ícones redondos 40px (Editar início · sino com badge de não lidas · avatar).
Cartões reordenáveis/ocultáveis (`showHomeEdit`): Sono (pontuação, horas, barra vs. meta), Movimento, Estatísticas, Próximo treino, Último treino; densidade Resumida/Detalhada. Cartão escuro de **Resumo semanal** (`showWeeklyCard`). Bloco de desafio com amigos. Estado **usuário novo** (`fs.show`): checklist "Comece por aqui" (conectar Health, criar treino, convidar amigo).
- **Central de notificações** (`showInbox`): agrupado Hoje/Esta semana, item com ícone-letra, título, texto, hora, ponto de não lido, remover; "Marcar como lidas"; aviso se notificações do sistema estão desligadas.

### 4. Saúde (`isHealth`)
Segmentado Sono / Atividade / Corpo. Sono: hipnograma, estágios, 7/30 dias, comparação. Atividade: passos/hora, semana. Corpo: peso e medidas com registro (`showBodyLog`). Detalhe de métrica (`showMetric`), metas (`showGoals`), relatório por período (`showReport`).

### 5. Treinos (`isWorkoutList`, `isWorkoutDetail`)
Header "Treinos" + "+ Novo". Faixa "Esta semana" (7 dias). **Começar atividade**: Corrida, Caminhada, Sessão livre, Outras (modalidades), **Corrida intervalada** (PRO). **Planejamento**: Programa ativo (cartão escuro com progresso) ou "Programas" (PRO), **Minha prova** (PRO). Rotinas (A/B/C…) e Biblioteca de exercícios. Estado vazio para usuário novo.
- **Construtor de treino** (`showBuilder`): nome, descrição, dia; lista de exercícios expansível (séries, reps, carga, descanso, reordenar, remover, **"Fazer superset com o próximo"**).
- **Seletor de exercícios** (`showPicker`) com busca, filtros por grupo, multi-seleção; **Cadastrar exercício** (`showExForm`) com nome, grupo, equipamento, tipo; detalhe do exercício (`showExDetail`) com histórico, favoritos, notas.
- **Programas** (`showProg`): lista → detalhe (semana típica, semanas com "leve", CTA Começar/Trocar/Encerrar).
- **Corrida intervalada** (sheet): steppers de tiros, duração, recuperação, aquecimento; barra de estrutura proporcional.
- **Minha prova** (sheet): distância (5/10/21/42 km), data, tempo-alvo → ritmo necessário, ritmo recente, estimativa.

### 6. Sessão de musculação (`showSession`, `showRest`, `showSummary`)
Tela cheia: exercício atual, pílulas de navegação entre exercícios, linhas de série (carga/reps com steppers 44px, marcar feita), sugestão de carga, **aquecimento sugerido** (séries 40/60/80%, não contam volume), etiqueta de **superset** (alterna sem descanso até fechar a rodada), **calculadora de anilhas** em exercícios com barra (sheet: carga total, tipo de barra, desenho da barra, anilhas por lado, aviso quando não fecha exato). Descanso com contagem, +30 s, pular. Pausa. **Mini-player** flutuante ao minimizar. **Resumo**: duração, séries, volume, recordes, sugestão para o próximo treino; CTA "Concluir/Salvar treino" destacado (60px, ink, sombra). Ao salvar → aviso "Criar cartão" (ver Compartilhar).

### 7. Corrida / atividades com GPS (`showRun`, `showRunSum`, `showGpsAsk`)
Pedido de permissão de localização (Permitir / Só desta vez / Agora não). Tela ao vivo: tempo herói, distância, ritmo atual/médio, parciais, mapa (placeholder), pausa; faixa colorida de **fase do intervalado** (aquecimento/tiro/recuperação/desaquecimento, tempo restante, próxima). Resumo: mapa, parciais, notas, salvar/descartar.

### 8. Histórico (`isHistory`, `isHistDetail`)
Header com botão **Compartilhar**. Cartão "Retrospectiva · Seu outubro em 5 telas" (`showRecap`: stories em tela cheia, 5 cores, toque avança). "Recordes e conquistas" (`showAch`: abas Recordes / Conquistas com 8 badges, progresso). Calendário mensal com pontos por tipo, detalhe do dia, detalhe da sessão (séries, mapa, origem dos dados, excluir com confirmação em 2 toques). Evolução por exercício.

### 9. Perfil (`isProfile`)
Header com avatar, nome, e-mail e "Editar" (`showProfileEdit`: nome, e-mail, troca de senha). Cartão **Tracta Pro** (Ver planos / Gerenciar). Metas, Fontes de dados, botões Conquistas · Fotos de progresso, Amigos e desafios, Ver tour, Gerenciar conexões. Preferências: unidades, descanso automático, Notificações (`showNotif`), **Quem vê meus treinos** (Amigos/Só eu/Todos), Privacidade e dados (`showPriv`: exportar, desconectar Health, excluir histórico, excluir conta — confirmação em 2 toques). Sair.
- **Fotos de progresso** (`showPhotos`): linha do tempo em grade 3 col com peso da data; Comparar lado a lado + diferença. Fotos ficam só no aparelho.
- **Assinatura**: Paywall (`showPaywall`) com tabela Grátis × Pro, planos Anual R$ 119,90 (7 dias grátis) / Mensal R$ 14,90, restaurar compra; Gerenciar (`showManage`) status, troca de plano, cancelar/reativar. Recursos PRO: Programas, Minha prova, Corrida intervalada, evolução completa.

### 10. Social (`showSocial`)
Hub de amigos e desafios: convidar (contatos/link, `showInvite`), criar desafio em 4 passos (`showNewCh`: tipo, duração, meta mínima, participantes), detalhe do desafio com ranking diário, feed, "torcer"; privacidade social (`showSPriv`: o que amigos veem — cargas e recordes desligados por padrão).

### 11. Compartilhar progresso (`showShare`, `nudge`)
Tela cheia: prévia do cartão centralizada (Story 232×412 / Post 270×338 na prévia; exportar em 1080×1920 e 1080×1350), setas para trocar modelo.
- Modelos: Treino de hoje · Evolução (barras 6 meses) · Recorde · Semana (7 pontos) · Corrida (parciais) · Mês.
- Estilos: Carvão (`ink`), Areia (`bg`), Tijolo (`brand`), Foto do usuário (com degradê escuro na base).
- Opções: Mostrar cargas (se desligado, mostrar % em vez de kg), Mostrar tempos, Meu nome.
- Destinos: Stories (Instagram), WhatsApp, Salvar nas Fotos, Mais (share sheet nativo).
- Entrada: aviso escuro após salvar treino/corrida ("Criar cartão", some em 7 s), Histórico › Compartilhar, Recordes › "Compartilhar recorde do mês", Retrospectiva e Resumo semanal.
- Nunca incluir dados de saúde (sono, FC) nos cartões.

### 12. Estados de borda
Faixa sob a status bar (44px) empurra o conteúdo: **Sem internet** (cinza; treinos salvos no aparelho, N aguardando envio) e **Falha de sync** (amarelo; "Tentar de novo"). Estados vazios por lista. Toast central no topo (ink, 14px/600, 2,2 s).

### 13. Widgets e relógio (`Tracta Widgets e Relogio.dc.html`)
- Tela bloqueada: widgets circulares (anel 3/4 treinos; sequência), retangular (prova: dias restantes, ritmo-alvo), linha inline (próximo treino) e **Live Activity** de descanso (tempo, barra, +30 s, Pular, próxima série) — também para corrida.
- Tela inicial: pequeno (treino de hoje), médio (semana), grande (sono, passos, prova + atalhos).
- watchOS: Série (carga/reps, FC, "Série feita"), Descanso (anel, +30 s, Pular), Corrida (tempo, km, ritmo, FC/zona, alvo), Resumo. Sincroniza com o iPhone; grava sem ele.

---

## Interactions & Behavior
- **Descanso automático** começa ao marcar série (configurável). Em superset, pula o descanso até a última série da rodada.
- **Sugestão de carga** para o próximo treino a partir do desempenho.
- **Confirmação em 2 toques** para ações destrutivas (botão troca texto para "Toque de novo para confirmar").
- **Recuperação de sessão**: ao reabrir o app com treino/corrida em andamento, oferecer retomar; sessão fica pausada.
- **Gate PRO**: tocar em recurso PRO sem assinatura abre o paywall com contexto ("Programas faz parte do Pro"); após comprar, volta ao recurso.
- **Intervalado**: fases calculadas; aviso por voz e vibração a cada troca (no protótipo só visual).
- **Persistência**: o protótipo salva o estado em `localStorage`; no app, persistir localmente (offline-first) e sincronizar com backend.
- Transições: sheets sobem de baixo; overlays de tela cheia entram por cima; sem animações elaboradas além do pulso do indicador "ao vivo" (opacidade 1→.35, 1,4 s).

## State Management (entidades principais)
- **Conta**: usuário, autenticação, assinatura (plano, trial, cancelado, renovação).
- **Permissões/conexões**: Health (tipos lidos/gravados), GPS, notificações.
- **Rotinas**: id, nome, foco, dia, exercícios (nome, grupo, equipamento, séries, reps, carga, descanso, grupo de superset, cardio).
- **Biblioteca**: exercícios padrão + do usuário, favoritos, notas.
- **Sessão ativa**: lista de exercícios/séries (kg, reps, done), aquecimento, índice atual, pausas, descanso.
- **Atividades**: tipo, GPS, início, pausas, distância, parciais, plano de intervalos.
- **Histórico**: sessões e atividades por dia; recordes derivados; conquistas.
- **Planejamento**: programa ativo (id, semana), prova (distância, data, tempo-alvo).
- **Social**: amigos, convites pendentes, desafios (tipo, período, participantes, pontuação), privacidade social.
- **Saúde**: sono, passos, FC, peso/medidas (importados × manuais × calculados — sempre indicar a origem).
- **Preferências**: unidades kg/lb, metas, notificações, cartões do Início, visibilidade, fotos (locais).

## Assets
- Fonte Archivo (Google Fonts, OFL).
- Ícones de linha desenhados inline (stroke 1.8–2, cantos arredondados) — substituir por SF Symbols / Material Symbols equivalentes.
- Mapas e fotos são placeholders: usar MapKit/Google Maps e fotos do usuário.
- `image-slot.js` é só do protótipo (área para soltar imagem).

## Files
- `Tracta App.dc.html` — app completo (todas as telas e fluxos).
- `Tracta Widgets e Relogio.dc.html` — widgets, Live Activity e watchOS.
- `Marca - Nome Logo e Cor.dc.html` — identidade (opção 2a aprovada) e pesquisa de nome.
- `support.js`, `image-slot.js` — runtime do protótipo (não portar).

## Pendências
- Confirmar marca "Tracta" no INPI/USPTO e domínio (tracta.app / gettracta.com).
- Preços da assinatura são exemplos.
- Textos estão em pt-BR; preparar i18n (en, es).
