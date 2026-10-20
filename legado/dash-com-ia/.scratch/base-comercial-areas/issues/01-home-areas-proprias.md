# 01: Home enxuta com trajetória semanal e acesso às áreas

**What to build:** a Home preserva o visual aprovado e a trajetória semanal, remove blocos repetidos e leva o usuário às áreas próprias de Contas, New Name e Cross.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] A trajetória semanal continua na Home, identificada conforme o cenário simulado atual.
- [x] A Home não repete blocos e oferece acesso direto às áreas próprias no desktop, preservando o visual aprovado.

## Verification

- CUA desktop: 4 KPIs, cortes de sexta, snapshot em 19/09/2026, corte de 25/set pendente e realizado sem série semanal; briefing, acessos diretos e grade de filiais visíveis, sem tabela ou distribuição repetidas.
- `node node_modules/typescript/bin/tsc --noEmit`, ESLint V3 + testes, 95/95 testes V3 e `node node_modules/next/dist/bin/next build` — aprovados.
- Busca global da Home levou a Oportunidades e mostrou `1 de 7` para Cooperativa Mu com ERP selecionado.
- Capturas: `screenshots/final/areas-home-20260930.png` e `screenshots/final/areas-cross-20260930.png`.
