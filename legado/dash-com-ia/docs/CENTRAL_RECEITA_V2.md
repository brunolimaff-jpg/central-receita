# Central de Receita V2 — baseline de interface

## Objetivo

A Home deixa de ser um dashboard de navegação e passa a operar como uma central executiva de decisão:

`Pulso da Receita -> Movimento -> Exposição -> Decisão Aberta -> Próximo Movimento -> Resultado Verificado -> Aprendizado`

Nesta referência, todos os dados continuam sintéticos e nenhuma ação é persistida ou enviada para sistemas externos.

## Estrutura ativa

- `src/app/page.tsx` — composição da Home no servidor.
- `src/components/revenue-home/revenue-shell.tsx` — navegação e shell visual.
- `src/components/revenue-home/revenue-pulse.tsx` — Pulso e métricas da Diretoria; Server Component.
- `src/components/revenue-home/decision-panel.tsx` — decisões e ações simuladas.
- `src/components/revenue-home/change-feed.tsx` — movimentos desde a última visita.
- `src/components/revenue-home/upcoming-movements.tsx` — próximos movimentos relevantes.
- `src/components/revenue-home/revenue-flow.tsx` — jornada ponta a ponta por estado/exceção.
- `src/lib/revenue-home/mock-data.ts` — único fixture da nova Home.
- `src/lib/revenue-home/get-home-data.ts` — fronteira única para trocar mock por SQL quando o contrato de dados for validado.
- `src/lib/revenue-home/types.ts` — contratos mínimos usados pela Home.

## Decisões de simplicidade

1. A Home não chama as APIs legadas.
2. Não há store global.
3. Não há camada de repository/service/use-case.
4. A navegação da referência usa âncoras nativas.
5. Apenas Decisões é Client Component porque possui interação local.
6. Glassmorphism é restrito ao Pulso e às métricas; áreas operacionais permanecem sólidas.
7. O código legado foi mantido nesta primeira passagem para preservar reversibilidade. Depois da validação visual, ele pode ser removido por evidência de não uso.

## Próximo contrato de dados

Quando o protótipo visual estiver congelado, substituir somente a implementação de `getRevenueHomeData()` por uma leitura server-side do banco. Os componentes não devem depender de Prisma, SQL ou rotas HTTP.

## Fora de escopo desta passagem

- integração corporativa;
- autenticação/RBAC;
- persistência de decisões;
- agente ou chat;
- writeback;
- engine genérica de regras;
- redesign das telas legadas;
- migração do schema Prisma.
