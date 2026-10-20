# 04: Cross como área própria com critério explícito

**What to build:** uma área própria de Cross representa o cruzamento entre condição de cliente, produto ou módulo novo e representante executivo. As regras específicas por produto serão definidas depois. Cross permanece distinto de Upsell, que é upgrade de licenças no módulo atual.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Cross só é classificado quando há evidência dos três elementos; se faltar evidência, mostra “classificação indisponível”.
- [x] A área mantém Cross separado de Upsell e não infere Cross apenas por grupo econômico, canal ou classificação informada na oportunidade.

## Progress

Cross e seu retorno estão implementados. A tela expõe os três elementos e mantém Upsell separado; amostras existentes do mock não validam o rótulo informado.

## Verification

- CUA desktop: Cross com `ERP` e busca Cooperativa Mu → `opp-005` → retorno preservou `solution`, `q` e `from=cross`; tela mostra os três critérios, fonte pendente e Upsell separado.
- `tests/comercial-v3-acquisition.test.mjs` — 4/4; suíte de contratos V3 — 95/95; TSC, ESLint e build Next — aprovados.
