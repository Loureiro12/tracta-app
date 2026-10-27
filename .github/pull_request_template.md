## O que muda

<!-- uma frase por item -->

## Como foi testado (E2E)

- [ ] Fluxos Maestro adicionados/atualizados em `apps/mobile/e2e/flows/<domínio>/`
- [ ] Rodei `pnpm e2e` (ou `e2e:smoke`) localmente em iOS/Android
- [ ] Se algum commit usa `E2E-Skip:`, o motivo está descrito abaixo

## Checklist

- [ ] Commits seguem Conventional Commits com escopo (`feat(home): ...`)
- [ ] Nenhum primitivo cru do react-native fora do design system
- [ ] testIDs novos declarados em `*.testids.ts` e usados por um fluxo
