# CENTRAL-001-HOME — fechamento das ressalvas do Explorer

Data: 17/11/2026 · Branch: `central-001/home-giovanne` · SHA: **`0187047`** (base `cf9a426`)
Cópia: `.scratch\CENTRAL-001-paineis\app` · Escopo: somente as ressalvas da verificação de `cf9a426` e o defeito de barra que apareceu na medição.

## RESULTADO

Três defeitos fechados, todos reproduzidos antes e depois na tela:

| # | Defeito | Causa | Correção |
|---|---|---|---|
| 1 | "Evolução semanal" (série Demo) continuava visível no **estado de erro** — ressalva (1) do Explorer | `<BlocoEvolucaoSemanal>` era renderizado sem olhar `estado` | `mostraBlocoSemanal(estado)` novo em `central-vendas-mrr.ts`; o bloco só existe em `sem-carga` (série do cenário) e `com-carga` ("sem fonte"). Em `erro` e `carregando`, nada. |
| 2 | O **selo "Demo" do topo da página** também sobrevivia ao erro (achado da minha própria medição, não estava na ressalva) | `SeloOrigem` do cabeçalho era incondicional | selo do topo só aparece com carga ou em `sem-carga`; em erro/carregando a página não declara origem que não tem |
| 3 | A meta do bloco Demo não dizia que o percentual é só de MRR — ressalva (2) | linha dizia "Percentual calculado de MRR ÷ meta", sem falar do escopo da meta | a linha passa a declarar **"Atingimento de MRR … conta só a recorrência"**, mostra a leitura do mesmo mês com NR contra a mesma meta (70% · faltam R$ 3,6 mi) e declara que **a fonte não define se a meta mede só recorrência ou a receita total** — Q2 segue em aberto, nada foi decidido |
| 4 | **Barra inferior a 390 px**: "Oportunidades" invadia "Configurações" em 8 px e "Configurações" saía da barra | 6 rótulos em ~57 px, com `overflow: visible` e sem ponto de quebra (o Chrome deste ambiente não hifenizou) | hífen suave (U+00AD) em "Oportuni-dades" e "Configu-rações": a palavra quebra na sílaba certa só quando não cabe; em tela larga o hífen é invisível |

O item 4 não é ressalva do Explorer: apareceu quando medi a barra em vez de olhar a captura. Estava presente em `cf9a426` e em `c9c78c9` (nenhuma mudança deste lote toca a navegação); a verificação anterior mediu corte dentro do próprio rótulo e não a invasão do vizinho.

## ALTERAÇÕES

`0187047` · 6 arquivos · **+56 / −9**

| Arquivo | Mudança |
|---|---|
| `src/features/comercial-v3/central-vendas-mrr.ts` | `mostraBlocoSemanal(estado)` — 9 linhas |
| `src/features/comercial-v3/screens/executive-page.tsx` | bloco semanal e selo do topo condicionados ao estado (+8/−3) |
| `src/features/comercial-v3/components/home-resultado.tsx` | linha da meta do Demo com as duas leituras e o escopo pendente (+10/−3) |
| `src/features/comercial-v3/components/commercial-sidebar.tsx` | `ROTULO_COM_HIFEN` + aplicação nos dois rótulos longos (+16/−2) |
| `tests/central-vendas-mrr.test.mjs` | teste: série não sobrevive a erro/carregamento (+10/−1) |
| `tests/home-giovanne.test.mjs` | teste: duas leituras do Demo contra a mesma meta, com absoluto (+12) |

Fora do commit: `next-env.d.ts` segue modificado, com o conteúdo preservado (SHA-256 `B8B3A344…`). O build de produção o reescreveu para `.next/types`; restaurei da cópia em `logs\next-env-preservado.d.ts` e conferi o hash.

## VERIFICAÇÃO

| Verificação | Resultado |
|---|---|
| `node --experimental-strip-types --test --test-isolation=none tests/*.test.mjs` | **379/379**, 0 falhas (377 anteriores + 2 novos) — `logs\tests-ressalvas-20261117.log` |
| `npx tsc --noEmit --incremental false` | exit **0** |
| `npm run build:static` | exit **0**, 3/3 páginas — `logs\build-ressalvas-20261117.log` |
| Rechecagem dirigida no navegador (headless, CDP 9223, perfil isolado, sem `--hide-scrollbars`) | **27/27 PASS**, 0 FAIL — `logs\rechecagem-ressalvas-20261117.log` |

O que a rechecagem cobre, por estado:

| Estado | Medição |
|---|---|
| sem carga (1440) | linha da meta com `52% · faltam R$ 5,8 mi` (MRR) e `70% · faltam R$ 3,6 mi` (MRR+NR), escopo pendente declarado; série do cenário presente; sem rolagem horizontal |
| erro (1440) | cartão de falha com "Tentar novamente"; **sem** "Evolução semanal", **sem** linha de semana, **sem** seção `resultado-semanal` no DOM; **sem** selo Demo no topo; Export e Planejamento seguem com selo próprio; fim da página vai de Segmentos direto a "Gestão de vendas" |
| carregando (IndexedDB atrasado 6 s) | esqueleto na consulta; sem série; sem selo Demo; sem "Nenhuma carga importada." |
| mobile 390 / 360 / 320 | 390/390 sem overflow; 6 rótulos na barra, **0 sobreposições, 0 rótulos fora da barra**; barra em 82 px |

**Com carga de teste (fechado depois do PASS focal):** importei os dois CSVs de fixture pela tela de Configurações com data 22/10/2026 (não é dado real) e medi a Home — **8/8 PASS** — `logs\rechecagem-com-carga-20261117.log`:

| Checagem | Medição |
|---|---|
| selo do topo | `Teste` · `out/2026 · carga de 22/10/2026` |
| bloco Demo | ausente; seções no DOM: `home`, `resultado-teste`, `resultado-export`, `resultado-segmentos`, `resultado-semanal`, `new-name` |
| bloco da carga | "Carga de teste" presente, com "MRR e NR: sem fonte" |
| série semanal | presente, "Sem fonte: a carga de teste não traz a série semanal do mês"; nenhuma linha "Semana N" inventada |
| lateral | "Dados carregados · Carga de 22/10/2026" |

Evidências novas em `evidencias\central-001-home\`:

- `08-home-sem-carga-meta.png` — meta declarada (1440)
- `09-home-erro-sem-serie.png` — topo do erro, sem selo Demo
- `09b-home-erro-fim-sem-serie.png` — fim da página no erro: Segmentos → Gestão de vendas, sem série
- `10-home-mobile-meta.png` — 390 com a linha da meta
- `10b-mobile-barra.png` — barra inferior a 2×: "Oportuni-dades" e "Configu-rações" em duas linhas, sem sobreposição
- `11-home-carregando-sem-serie.png` — esqueleto durante a consulta
- `12-home-com-carga-0187047.png` — Home com a carga de fixture (selo Teste, série "sem fonte")

Script reproduzível: `rechecagem-ressalvas-cf9a426.mjs`. Primeira execução dele deu **14/14 falso verde** por erro de assinatura no meu `ok()` (3 parâmetros para 4 argumentos); corrigi, reexecutei e a falha real da barra apareceu. Registrado para não virar número falso.

## PENDÊNCIAS

- **Q2 (escopo da meta)**: segue aberta. A tela agora mostra as duas leituras e diz que a definição está pendente; não escolhi nenhuma.
- **Datas divergentes** (topbar set/2026 × CSO out/2026): fora deste delta, como você registrou.
- **Persona** "Giovanni" × "Giovanne Farias": decisão do Bruno, não alterei.

## STATUS

Branch `central-001/home-giovanne` em `0187047`; `master` intocado em `c9c78c9`; sem remote, sem push, sem deploy, sem dado real. `next-env.d.ts` preservado fora do commit. Servidor (3012) e Chrome headless (9223) encerrados ao fim.

## PRÓXIMO PASSO

Verificação independente do `0187047` pelo Explorer, focal nas três ressalvas e na barra inferior em 390/360/320.
