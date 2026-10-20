# 03: New Name como área própria com fonte independente

**What to build:** uma área própria de New Name tem entrada e retorno claros pela navegação. A fonte real independente ainda não está disponível; até lá, qualquer exemplo do mock permanece explicitamente demonstrativo, sem inferência de classificação real. New Name não deriva do grupo econômico nem dos campos Opp/Conta Novo/Base.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] New Name aparece como destino próprio na navegação e oferece retorno à Home.
- [x] Enquanto a fonte real independente estiver pendente, a área mostra “classificação indisponível”; exemplos do mock são identificados como demonstrativos e não inferem classificação real.
- [x] A documentação conflitante, incluindo a ADR-0003, está alinhada às definições aprovadas: New Name depende de fonte própria; Cross depende de condição de cliente, produto ou módulo novo e representante executivo. Nenhuma das classificações deriva apenas do grupo econômico.

## Progress

New Name e seus links estão implementados. `CONTEXT.md` e ADR-0003 registram a fonte independente pendente e substituem a hipótese histórica de classificação por grupo econômico.

## Verification

- CUA desktop: New Name com `ERP` e busca Agro Upsilon → `opp-013` → retorno preservou `solution`, `q` e `from=new-name`; o ticket identifica classificação pendente e exemplos como demonstrativos.
- `tests/comercial-v3-acquisition.test.mjs` — 4/4; suíte de contratos V3 — 95/95; TSC, ESLint e build Next — aprovados.
