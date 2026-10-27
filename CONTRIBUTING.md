# Contribuindo

Leia antes de abrir um PR:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): onde cada coisa mora e as regras de dependência.
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): tokens, componentes e o contrato de `testID`.
- [docs/TESTING.md](docs/TESTING.md): como escrever fluxos Maestro e o que o `check-tests` exige.
- [docs/COMMITS.md](docs/COMMITS.md): formato de commit, escopos e os hooks.
- [docs/I18N.md](docs/I18N.md): traduções por feature, chaves tipadas e o que o lint exige.

Resumo em seis regras:

1. Uma feature = uma pasta em `apps/mobile/src/features/<nome>` com barrel, testIDs e pelo menos um fluxo em `e2e/flows/<nome>/`.
2. UI só com `@tracta/design-system`. Nada de `View`/`Text` crus, cores literais ou estilos inline no app.
3. Todo elemento interativo ou assertado tem `testID` vindo de `<feature>.testids.ts`.
4. Mudou comportamento, mudou (ou criou) fluxo no mesmo commit.
5. Nenhum texto literal na UI: `t('chave')` com `en.json` e `pt-BR.json` em paridade.
6. Commits no formato `tipo(escopo): descrição` em minúsculas, até 72 caracteres.
