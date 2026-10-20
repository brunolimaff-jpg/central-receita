# 02: Contas com cliente, responsável e oportunidades do mock

**What to build:** uma área própria de Contas permite consultar o cliente, seu responsável e as oportunidades disponíveis no mock, com acesso ao detalhe da oportunidade.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Cada conta mostra cliente, responsáveis e oportunidades agrupados pelo nome exato no mock; dados ausentes aparecem como indisponíveis.
- [x] A área não inventa saúde ou churn do cliente.

## Verification

- CUA desktop: Contas → busca Cooperativa Mu com `ERP` e `Senior Filial SP` → `opp-005` → retorno a Contas preservando filtros, `q` e `from=accounts`.
- `node --test tests/comercial-v3-accounts.test.mjs` — 4/4 aprovados; suíte de contratos V3 — 95/95; TSC, ESLint e build Next — aprovados.
