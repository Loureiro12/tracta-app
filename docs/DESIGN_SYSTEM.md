# Design system (`@tracta/design-system`)

Fonte de verdade visual: `design_handoff_tracta_app/README.md` (tokens, tipografia, raios, sombras) e os protótipos HTML. Tudo abaixo é a tradução desse handoff para React Native.

## Princípios

1. **Tokens, nunca literais.** Cor, espaçamento, raio, sombra e tipografia vêm de `useTheme()` ou de props tokenizadas. O ESLint bloqueia cores literais e estilos inline no app.
2. **Semântica antes de paleta.** Componentes usam `theme.colors.text2`, nunca `palette.text2`. A paleta só existe em `tokens/colors.ts`.
3. **Tudo é testável.** Componentes interativos exigem `testID` (`Testable`); os estruturais aceitam (`MaybeTestable`). Elementos derivados recebem sufixos previsíveis (`<testID>.label`, `.input`, `.error`, `.loading`, `.badge`, `.fill`).
4. **Toda peça tem galeria.** Cada componente tem `<Nome>.gallery.tsx`, registrado em `gallery/registry.ts`, renderizado em `tracta://design-system/<slug>` e coberto por `e2e/flows/design-system/<slug>.yaml`.

## Tokens (handoff)

| Token        | Arquivo                | Conteúdo                                                                                                                                                                                                                                                                              |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`     | `tokens/colors.ts`     | `bg` areia · `surface` · `ink` carvão · `fill1-3` · `track` · `switchOff` · `divider` · `text/text2/text3` · `brand/brandText/brandDark/brandTint/brandOnDark` · `danger` · `success` · `warnText/warnBg` · `run` · `sleep` · `social` · `heart` · `challenge` · `overlay` · `tabBar` |
| `spacing`    | `tokens/spacing.ts`    | `xxs 2 · xs 4 · sm 8 · md 12 · ml 14 · lg 16 · xl 18 · screen 20 · 2xl 24 · 3xl 32 · 4xl 48 · 5xl 64`                                                                                                                                                                                 |
| `radii`      | `tokens/radii.ts`      | `xs 8 · sm 10 · md 14 · lg 16 · xl 18 · pill 20 · card 22 · sheet 28 · full`                                                                                                                                                                                                          |
| `typography` | `tokens/typography.ts` | ver abaixo                                                                                                                                                                                                                                                                            |
| `shadows`    | `tokens/shadows.ts`    | `floating` (mini-player/toast) · `toast` · `cta` (CTA de destaque) · `share` (cartão de compartilhar)                                                                                                                                                                                 |

Tema: `ThemeProvider preference="system|light|dark"`, `useTheme()`. O handoff é só claro; o escuro é uma inversão conservadora dos mesmos papéis.

### Tipografia

Família **Archivo** embutida como instâncias estáticas (`apps/mobile/assets/fonts`, geradas da fonte variável com fontTools; licença OFL). O eixo de largura do CSS (`font-stretch`) vira família:

| Família                | Uso                                       |
| ---------------------- | ----------------------------------------- |
| `Archivo100-*`         | 400/500/600/700/800 em largura normal     |
| `Archivo80-Bold`       | título de tela (30), stats (20)           |
| `Archivo75-*`          | título de overlay (36/800), números-herói |
| `Archivo70-*`          | números-herói grandes (96)                |
| `Archivo112-ExtraBold` | wordmark TRACTA                           |

Variantes: `screenTitle`, `overlayTitle`, `heroXl/Lg/Md/Sm` (tabular), `stat`, `nameTitle`, `cardTitle`, `cardTitleSm`, `subtitle`, `body*`, `bodyLg`, `secondary*`, `small*`, `caption*`, `micro`, `microBold`, `tab`, `button*`, `wordmark`.

## Componentes

| Componente                                                        | Para quê                                                                                                               | `testID`               |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `Box`, `VStack`, `HStack`                                         | layout com props tokenizadas                                                                                           | opcional               |
| `Text`, `Heading`                                                 | tipografia por `variant`/`color`; Heading 1=tela, 2=cartão, 3=cartão pequeno                                           | opcional               |
| `Pressable`                                                       | área tocável custom                                                                                                    | obrigatório            |
| `Button`                                                          | `primary brand secondary surface onInk ghost danger dangerText` · `xs 36 · sm 40 · md 50 · lg 56 · xl 60` · `elevated` | obrigatório            |
| `IconButton`, `Icon`                                              | botão redondo 40px (fill-1) com badge; ícones Feather                                                                  | obrigatório / opcional |
| `TextField`                                                       | input branco 50px com label, helper, erro e `trailing`                                                                 | obrigatório            |
| `Screen`                                                          | raiz de tela: safe area, `header`/`footer` fixos, `bottomInset="tab"`                                                  | obrigatório            |
| `ScreenHeader`, `BackHeader`                                      | header fixo das abas (título 30 condensado) · "‹ Voltar"                                                               | opcional / obrigatório |
| `Card`                                                            | `surface ink outline tint warn social fill`, `onPress`                                                                 | opcional               |
| `SectionLabel`                                                    | rótulo 13px cinza acima de um grupo                                                                                    | opcional               |
| `ListGroup`, `ListRow`                                            | linhas 50px com valor/chevron/descrição/`trailing`                                                                     | obrigatório (row)      |
| `Chip`                                                            | tons `neutral brand ink run sleep social success warn danger`                                                          | opcional               |
| `Segmented`                                                       | opções em trilho fill-3; ids `<testID>.<value>`                                                                        | obrigatório            |
| `Switch`, `CheckCircle`, `Stepper`, `ProgressBar`, `Bars`, `Ring` | controles e gráficos simples                                                                                           | ver cada um            |
| `Avatar`, `Dot`, `Badge`, `Divider`, `Logo`                       | identidade e marcadores                                                                                                | opcional               |
| `Toast`, `Banner`, `FloatingBar`                                  | feedback global (renderizados por `AppChrome`/`AppTabBar`)                                                             | obrigatório            |
| `Sheet`                                                           | bottom sheet (alça, título central, Cancelar/Fechar, `footer`)                                                         | obrigatório            |
| `TabBar`                                                          | 5 abas com blur; usada por `AppTabBar`                                                                                 | obrigatório            |

## Contrato de testID

Formato `<dominio>.<contexto>.<elemento>[.<qualificador>]`, kebab-case minúsculo separado por pontos. Feature: `home.counter.increment`, `<feature>.screen` (obrigatório). Design system: `ds.<slug>.gallery` e `ds.<slug>.<caso>`. App shell: `app.tab.<aba>`, `app.tab-bar`, `app.toast`, `app.banner`, `app.mini-player`.

## Criando um componente

```bash
pnpm gen:component Badge
```

Gera `components/Badge/{Badge.tsx,index.ts,Badge.gallery.tsx}`, registra na galeria, exporta no barrel e cria `e2e/flows/design-system/badge.yaml`. O `check-structure` falha se qualquer parte faltar.

## Checklist de revisão

- Nenhuma cor/número mágico fora de `tokens/`.
- Props aceitam tokens, não valores.
- Estados cobertos na galeria: default, pressed/focused, disabled, loading, error.
- Acessibilidade: `accessibilityRole`, `accessibilityLabel`, alvo mínimo de 44pt.
