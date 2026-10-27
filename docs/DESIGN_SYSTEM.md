# Design system (`@tracta/design-system`)

## Princípios

1. **Tokens, nunca literais.** Cor, espaçamento, raio, sombra e tipografia vêm de `useTheme()` ou de props tokenizadas. O ESLint bloqueia cores literais e estilos inline no app.
2. **Semântica antes de paleta.** Componentes usam `theme.colors.textPrimary`, nunca `palette.gray900`. A paleta só existe dentro de `tokens/colors.ts`.
3. **Tudo é testável.** Componentes interativos exigem `testID` (tipo `Testable`). Elementos derivados recebem sufixos previsíveis (`<testID>.label`, `.input`, `.error`, `.loading`).
4. **Toda peça tem galeria.** Cada componente tem `<Nome>.gallery.tsx`, registrado em `gallery/registry.ts`, renderizado em `tracta://design-system/<slug>` e coberto por `e2e/flows/design-system/<slug>.yaml`.

## Tokens

| Token        | Arquivo                | Uso                                                       |
| ------------ | ---------------------- | --------------------------------------------------------- |
| `colors`     | `tokens/colors.ts`     | paleta + `lightColors`/`darkColors` (papéis semânticos)   |
| `spacing`    | `tokens/spacing.ts`    | escala 4pt: `none xxs xs sm md lg xl 2xl 3xl 4xl`         |
| `radii`      | `tokens/radii.ts`      | `none sm md lg xl full`                                   |
| `typography` | `tokens/typography.ts` | variantes completas: `displayLg … bodyMd … label caption` |
| `shadows`    | `tokens/shadows.ts`    | `none sm md lg`                                           |

Tema: `ThemeProvider preference="system|light|dark"`, `useTheme()`, `lightTheme`, `darkTheme`.

## Componentes

| Componente          | Para quê                                         | `testID`    | IDs derivados                           |
| ------------------- | ------------------------------------------------ | ----------- | --------------------------------------- |
| `Box`               | layout com props tokenizadas (`p`, `bg`, `gap`…) | opcional    | —                                       |
| `VStack` / `HStack` | pilhas com `gap`                                 | opcional    | —                                       |
| `Text` / `Heading`  | tipografia por `variant` e `color`               | opcional    | —                                       |
| `Pressable`         | área tocável custom                              | obrigatório | —                                       |
| `Button`            | ação com `variant`, `size`, `loading`            | obrigatório | `.label`, `.loading`                    |
| `TextField`         | input com label, helper e erro                   | obrigatório | `.label`, `.input`, `.helper`, `.error` |
| `Screen`            | raiz de tela (safe area, scroll, fundo)          | obrigatório | `.scroll` ou `.content`                 |

## Contrato de testID

Formato `<dominio>.<contexto>.<elemento>[.<qualificador>]`, tudo em kebab-case minúsculo separado por pontos.

- Feature: `home.counter.increment`, `settings.theme.dark`, `<feature>.screen` (obrigatório).
- Design system: `ds.<slug>.gallery` (raiz da galeria) e `ds.<slug>.<caso>`.

Use `testId('home', 'counter', 'increment')`: em desenvolvimento valida os segmentos.

## Criando um componente

```bash
pnpm gen:component Badge
```

Gera `components/Badge/{Badge.tsx,index.ts,Badge.gallery.tsx}`, registra na galeria, exporta no barrel e cria `e2e/flows/design-system/badge.yaml`. O `check-structure` falha se qualquer uma dessas partes faltar.

## Checklist de revisão

- Nenhuma cor/número mágico fora de `tokens/`.
- Props aceitam tokens, não valores.
- Estados cobertos na galeria: default, pressed/focused, disabled, loading, error.
- Acessibilidade: `accessibilityRole`, `accessibilityLabel`, alvo mínimo de 44pt.
