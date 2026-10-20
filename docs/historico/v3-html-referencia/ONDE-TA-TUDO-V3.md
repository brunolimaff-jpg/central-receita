# Onde tá tudo — Central de Receita V3

Mapa de localização dos artefatos do V3. Análise visual dos PNGs é feita **fora** deste mapa.

**Raiz do projeto (base de todos os caminhos relativos):**
`C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Projetos/Central de Receita`.
A raiz **não** é repositório git (`git rev-parse --show-toplevel` → `fatal: not a git repository`);
o app `Dash com IA/` tem `.git` próprio.

**Legenda:** `00` = `00_SPEC_VISAO_COMERCIAL_V3.md`; `03` = `03_TOM_DE_VOZ_SENIOR_RESUMO.md`;
`04` = `04_CHECKLIST_FIDELIDADE.md`; `05` = `05_IMPLEMENTATION_PLAN_V3.md` — os quatro em
`v3/Central-de-Receita-V3-Implementation-Plan-Pack/`.

---

## 1. Visão geral

O V3 é a **Visão Comercial da Central de Receita**: uma Home que vira cockpit executivo de
previsibilidade comercial para o Giovanne (Diretoria Comercial), com Agente Comercial simulado,
drill-down Home → Forecast → Filial → Oportunidade e mocks reconciliados — sem banco, sem API real,
sem writeback e sem LLM real (`00:4-7`; `05:5`).
São **três camadas distintas**: (a) **pacote de plano** em `v3/Central-de-Receita-V3-Implementation-Plan-Pack/`
— spec congelada + plano de 11 tasks, **não executado**; (b) **preview HTML final** em
`v3/Central-de-Receita-V3-FINAL-HTML/` — protótipo vanilla de arquivo único, que **já roda** mas
**não é** a implementação no checkout; (c) **app real** em `Dash com IA/` — Next.js 16 + React 19 +
Tailwind 4 com a Home V2 ativa, onde o V3 deve pousar (`05:5,7`).
Em pé: design aprovado e plano escrito; **nenhuma linha do V3 implementada no app** — verificado:
`ls Dash com IA/src/` → `app components hooks lib`; `find "Dash com IA/src" -maxdepth 2 -type d -name
features` → vazio, ou seja `src/features/comercial-v3` não existe.

---

## 2. Mapa por caminho

| Caminho (relativo à raiz) | O que é | Status |
|---|---|---|
| `v3/Central-de-Receita-V3-Implementation-Plan-Pack/00_SPEC_VISAO_COMERCIAL_V3.md` | Spec de visão comercial congelada; cabeçalho "SPEC FINAL APROVADO PARA PLANO DE IMPLEMENTAÇÃO"; §18 é o Adendo que substitui a §4.3 (Hero) e governa em divergência | Aprovado, congelado |
| `v3/Central-de-Receita-V3-Implementation-Plan-Pack/03_TOM_DE_VOZ_SENIOR_RESUMO.md` | Resumo operacional de tom de voz (970 B); fonte declarada `TOM DE VOZ MARCA SENIOR.html`, **não presente no pacote** | Pronto, curto |
| `v3/Central-de-Receita-V3-Implementation-Plan-Pack/04_CHECKLIST_FIDELIDADE.md` | Checklist de fidelidade em 9 blocos, 75 linhas; **todos os itens ainda desmarcados** | Não validado |
| `v3/Central-de-Receita-V3-Implementation-Plan-Pack/05_IMPLEMENTATION_PLAN_V3.md` | Plano de implementação, 11 tasks, com contratos travados (fixture 12,0/8,4/11,0/10,2 mi; Top 10 com `abs(deltaForecast)`) | Pronto para execução |
| `v3/Central-de-Receita-V3-FINAL-HTML/index.html` | Preview navegável em arquivo único (62.603 B): vanilla, CSS inline (`<style>` l.8-169), JS inline (`<script>` l.395-444), sem `<link>`/`<script src>`/CDN | Roda; é protótipo |
| `v3/Central-de-Receita-V3-FINAL-HTML/SPEC_V3_FINAL.md` | Spec no pacote HTML; **byte-idêntica** ao `00_..._VISAO_COMERCIAL_V3.md` do pacote de plano (md5 `11d216b3…` nos dois) | Duplicata da spec |
| `Dash com IA/` | App Next.js 16.1.1 + React 19 + Tailwind 4 real (Prisma, `node_modules`, `.git` próprio, 14 rotas de API em `src/app/api/`, 17 testes `.mjs` em `tests/`) | Baseline ativo — **onde o V3 pousa** |
| `Dash com IA/src/app/page.tsx` | Home `/` da V2: `RevenueShell` + `RevenuePulse` + `DecisionPanel` + `ChangeFeed` + `UpcomingMovements` + `RevenueFlow` | V2 ativa |
| `Dash com IA/src/components/revenue-home/` + `Dash com IA/src/lib/revenue-home/` | Código da Home V2 ativa (6 componentes; 4 módulos: `format`, `get-home-data`, `mock-data`, `types`) | Ativo |
| `Dash com IA/src/components/central/` | Legado + Briefing (`agora.tsx`); mantido só por reversibilidade | Legado, não podar |
| `Dash com IA/HANDOFF_AI.md` | Checkpoint do projeto (178 linhas). É a **fonte dos números de teste** citados aqui: 61/61 (l.17), 67/67 (l.12), 13/13 (l.67,93) — **não medidos nesta sessão** | Fonte de histórico |
| `Dash com IA/docs/` | Onde vivem os documentos reais: `design/` (feed, feed-senior, feed-v2, piloto, escopo, material Senior MG), `superpowers/plans` (3), `superpowers/specs` (2) | Ativo |
| `Dash com IA/docs/design/feed-senior/index.html` | Mock HTML self-contained (54.114 B), tokens Senior (`#f6f9fe`, `#00968c`, Public Sans); coexiste com `feed/` (22.890 B) e `feed-v2/` (113.273 B) sem índice que defina hierarquia | Ambíguo |
| `Dash com IA/docs/superpowers/specs/` | `2026-09-25-agentic-briefing-design.md` e `2026-09-28-dashboard-piloto-design.md` — ambos "aguardando revisão/escolha" | Propostas, não aprovadas |
| `docs/` (na raiz) | **Vazio**: `find docs -type f` → 0 arquivos; `find docs -type d` → `docs`, `docs/design`, `docs/design/feed-senior`, `docs/superpowers`, `docs/superpowers/specs`. Duas pastas folha sem nenhum conteúdo | Resíduo / sem função |

---

## 3. O que o V3 pede × o que já existe pronto × onde pousa

**O plano pede (`05`):** manter Next.js 16 / React 19 / Tailwind 4 e isolar a V3 em
`src/features/comercial-v3` (`05:7`); `src/app/page.tsx` vira só composição; toda métrica deriva de um
único `CommercialSnapshot` mockado por funções puras; navegação e filtros no URL. Arquivos nomeados:
`types.ts`, `context.ts`, `copy.ts`, `mock-data.ts`, `model.ts`, `agent.ts`,
`commercial-v3-app.tsx`, `components/*`, `screens/*`, testes `tests/comercial-v3-*.test.mjs`.
Ordem: 1) fundação + shell → 2) Home 1ª dobra → 3) Home 2ª dobra → 4) Agente → 5) Forecast → 6) Filial
→ 7) Oportunidade → 8) responsive/QA/pacote (`05:48-57`).

**O que já existe pronto (preview HTML):** a Home inteira no markup `index.html:206-309` (hero do
agente, 5 KPIs, evolução, movimentos, New Names x Cross, Top 10 de 12 colunas, rail de filiais +
destaques) e, em sequência, as views Agente (l.311-361), Forecast (l.363-374), Filiais (l.376-379),
**Oportunidades** (l.381-384) e **Oportunidade** (l.386-390). Tokens em l.9-33: `--bg:#f5f8fb`,
`--green:#009b83`, `--blue:#2f78ea`, `--coral:#ef4c64`, raios 20/14/10px.
*Oportunidades × Oportunidade são duas superfícies distintas:* a primeira é a **lista** (tabela de 12
colunas + busca, markup l.381-384), a segunda é o **detalhe** de uma conta (hero + composição +
timeline, markup l.386-390). No plano, a lista é item de sidebar opcional (`05:320,326`) e o detalhe é
a Task 9, obrigatória (`05:725`).

**Onde pousa (fato, não pergunta):** no checkout `Dash com IA/`, criando `src/features/comercial-v3/`
e reduzindo `src/app/page.tsx` a composição — é o que o plano determina, sem alternativa (`05:5` "no
checkout Next.js atual"; `05:7` "isolar a V3 em `src/features/comercial-v3`"). O preview HTML **não é**
o pacote final do §12: é vanilla single-file, enquanto a spec exige build/type/lint, screenshot no
viewport de referência e gate visual (§12-13).

**Gaps conhecidos do preview HTML** (não do plano): "Top 5 explica 78%" é string fixa e os 5 maiores
|deltas| do mock somam 71,0% (markup l.242 e `:322`; dados `:397-406`); ordem do Top 10 viola
`abs(deltaForecast)` ("Governo Épsilon" +1,0 em 5º, dados `:397-406`); "Mudou de mês" fora da
taxonomia congelada (dados `:400`); header sem seletor de mês; Forecast sem delta percentual;
Oportunidade sem campo HEAD; select de solução e tabs de período sem listener real (só toast, JS `:437`).

---

## 4. Decisões tomadas e pendências em aberto

**Decidido (com origem):**
- Spec congelada e aprovada; **§18 substitui a §4.3** (Hero) e governa em divergência (`00` §18.8, l.683).
- Hero vira a **porta de entrada do Agente Comercial**, com copy exata: pretitle "Seu agente comercial
  de hoje", headline "Seu retrato diário já está pronto.", CTA "Abrir agente", status "Resumo
  atualizado agora" (`00` §18.1, l.560-578; `05:27`; `04:65-67`). Sem item de menu genérico "IA" — a
  entrada é o briefing da Home (`00` §18.3, l.607).
- Filtro executivo superior é **Filial** ("Todas as filiais"); `FILIAL != HEAD` sem derivação
  (`00` §2, l.42-48; `05:21-22`; `04:11`).
- Forecast oficial é **fotografia congelada**, não é reescrita (`00` §2, l.32-34; `05:23`); Top 10
  ordenado por `abs(deltaForecast)`, com positivos e negativos (`00` §2, l.64-68; `05:26`).
- Oportunidade abre como **tela completa**, nunca modal/sheet (`00` §5, l.288; `05:30`).
- Sem banco, Prisma, API real, LLM real, migration ou writeback (`00` §10/§14; `05:17-19`).
- **Sem GSAP**; motion 180–280ms com `transform`/`opacity` + `prefers-reduced-motion`
  (`00` §8, l.371-376; `05:33`).
- Fixture default travado: Meta 12,0 / Realizado 8,4 / Forecast oficial 11,0 / Forecast atual 10,2 mi
  (`05` Task 2 Steps 1-2, l.165-216; contrato em `05:1033-1039`).
- Divisão semanal 1–7 / 8–14 / 15–21 / 22–fim é **contrato do mock**, não regra corporativa
  (`00` §18.4, l.628). Pacote final em cópia isolada do checkout, ZIP `Central-de-Receita-V3-FINAL.zip`
  (`00` §12, l.443-456; `05` Task 11 Step 10, l.962-978).

**Pendências / ambiguidades:**
- **Nome do PNG de densidade não bate com o disco.** Os quatro documentos citam
  `01_REFERENCIA_VISUAL_HIGH_END.png` (`00:74,453,553,680`; `04:4`; `05:36`), mas o arquivo real é
  **`02_REFERENCIA_VISUAL_HIGH_END.png`**; nenhum `01_..._HIGH_END.png` existe (verificado por
  `find v3 -type f`). A **precedência está resolvida** (`00:679-680`; `05:35-36,534-535`: FINAL =
  hero/agente/semanas; HIGH_END = densidade/tabela/rail); falta corrigir o número nas citações.
- **Numeração de arquivos inconsistente:** `00` §17 (l.554) cita `02_TOM_DE_VOZ_SENIOR_RESUMO.md`; o
  arquivo é `03_`. E o `03:3` declara fonte um HTML que não está no pacote. `05:11,35-36` também
  aponta caminhos Linux (`/mnt/data/Central-de-Receita-V3-Spec-FINAL/...`) que não existem no Windows.
- **Token possivelmente defeituoso:** `05:311` diz `Todas as filiais` serializa como `branll`; o campo
  do tipo é **`branch`** (`05:95,102` — `CommercialView` e `branch: string`; `05:118`). `branll` não
  aparece em nenhum outro ponto (`grep -n "branll"` → só l.311).
- **Escolhas em aberto:** Recharts "apenas onde simplificar" vs SVG inline (`05:9,471`); navegação de
  `Oportunidades`/`Contas`/`Relatórios`/`Explorar` na sidebar, com `aria-disabled` (`05:315-326`).
- **Gates condicionais:** lint/tsc/build devem ser registrados com bloqueio exato — "do not claim PASS
  if dependency/network/runtime prevents a gate" (`05:842-851,945-960`); a Task 11 admite instalar
  `node_modules` se ausente (`05:873-877`).
- **Checklist de fidelidade 100% desmarcado** (`04:3-75`) — nenhuma validação visual registrada.
- **Pré-requisitos não verificados:** `05:75` assume o TS transpile hook de
  `tests/navigation-ia.test.mjs` e `05:955-958` os testes legados. Os três arquivos existem em
  `Dash com IA/tests/` (`ls tests/`), mas **nenhum gate foi executado** nesta sessão.
- **`/api/visao.gestao` não existe como rota separada:** o bloco `gestao` é montado dentro de
  `/api/visao` (verificado: `grep -n gestao Dash com IA/src/app/api/visao/route.ts` → l.4
  `import { resumoGestao } from '@/lib/domain/gestao'`, l.37 `gestao: resumoGestao(snapGestao, agora)`);
  `grep -rn "visao.gestao"` em `src` e `docs` → sem resultado. Se o V3 pressupõe endpoint próprio,
  precisa ser criado.
- **`docs/` na raiz é resíduo, não destino.** As duas pastas folha vazias espelham nomes de pastas
  internas de `Dash com IA/docs/`, e o plano manda pousar no checkout (`05:5,7`); nenhum documento
  propõe código fora do app. Sujeira a limpar, sem impacto no pouso.

---

## 5. PNGs de referência

Três imagens, nenhuma aberta neste mapa — **análise visual fica fora deste documento**:

| Arquivo (nome no disco) | Caminho | Papel declarado |
|---|---|---|
| `01_REFERENCIA_VISUAL_FINAL.png` (1.397.436 B) | `v3/Central-de-Receita-V3-Implementation-Plan-Pack/` — cópia idêntica (md5 `6809cdfe…`) também em `v3/Central-de-Receita-V3-FINAL-HTML/REFERENCIA_VISUAL_FINAL.png` | Referência **governante** do hero/agente/semanas (`00:679`; `05:35,534`) |
| `02_REFERENCIA_VISUAL_HIGH_END.png` (1.606.003 B) | `v3/Central-de-Receita-V3-Implementation-Plan-Pack/` | Referência **secundária** de densidade/tabela/rail (`00:680`; `05:36,535`); o `04:4` a chama de "benchmark primário" citando o nome errado `01_` |
| `QA_RENDER_1536x1024.png` (531.675 B) | `v3/Central-de-Receita-V3-FINAL-HTML/` | Render de QA do preview HTML no viewport 1536×1024 |

---

## 6. Próxima ação sugerida

Executar as Tasks 1–3 do `05_IMPLEMENTATION_PLAN_V3.md` em `Dash com IA/` — criar
`src/features/comercial-v3/{types,context,copy}.ts` e os testes de contrato, depois a Home nas duas
dobras — rodando os gates na ordem do plano: `node --test tests/comercial-v3-context.test.mjs`
(`05:86`), `node --test tests/comercial-v3-model.test.mjs` (`05:232`), `npm run lint` (`05:356`),
`npx tsc --noEmit` e `npm run build` (`05:846-848`), capturando `screenshots/v3/home-1536x1024.png`
e comparando com `01_REFERENCIA_VISUAL_FINAL.png` (`05:892`). Antes de começar, corrigir nas citações
o nome do PNG de densidade para `02_REFERENCIA_VISUAL_HIGH_END.png`.

---

### Nota de método

**Verificado nesta sessão por comando:** `find v3 -type f`; `ls -la` das duas pastas de `v3/`;
`find docs -type f` (raiz → 0 arquivos) e `find docs -type d` (→ as 5 pastas da §2);
`find "Dash com IA/src/app" -type f`; `ls "Dash com IA/tests/"`; `ls "Dash com IA/src/"` (→ app,
components, hooks, lib) e `find "Dash com IA/src" -maxdepth 2 -type d -name features` (→ vazio);
`ls "Dash com IA/src/components/"`; `md5sum` dos dois pares duplicados;
`grep -n "gestao" "Dash com IA/src/app/api/visao/route.ts"` (→ l.4, l.37);
`grep -rn "visao.gestao"` (→ sem resultado); `grep -n "branll\|branch"` no `05` (→ `branll` só em
l.311; `branch` em l.78-118,239,251,268,310); `grep -n "REFERENCIA_VISUAL"` em `00`, `04`, `05`;
`grep -n "61/61\|67/67\|13/13" "Dash com IA/HANDOFF_AI.md"` (→ l.17, l.12, l.67/93);
`git rev-parse --show-toplevel` na raiz (→ `fatal: not a git repository`);
`git -C "Dash com IA" log --oneline -5`; `head` de `00`, `05`, `04`, `03`, `page.tsx`,
`package.json`, `HANDOFF_AI.md`; `sed -n` de `index.html:305-330,376-395` e `05:305-330`.

**Não executado:** nenhum gate (`tsc`, `eslint`, `next build`, `node --test`) — os números de teste
(61/61, 67/67, 13/13) são do `HANDOFF_AI.md`, não de execução aqui; nenhuma leitura de imagem.
