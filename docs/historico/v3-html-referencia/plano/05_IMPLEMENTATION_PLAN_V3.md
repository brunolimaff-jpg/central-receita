# Central de Receita V3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a V3 final da Visão Comercial no checkout Next.js atual, com Home executiva fiel às referências aprovadas, Agente Comercial local simulado, drill-down Home → Forecast → Filial → Oportunidade e dados mockados reconciliados, sem banco, schema migration, writeback ou LLM real.

**Architecture:** Manter Next.js 16 + React 19 + Tailwind 4 e isolar a V3 em `src/features/comercial-v3`. `src/app/page.tsx` vira apenas a composição da nova experiência; o legado permanece no repositório, mas não é podado nesta rodada. Toda métrica da V3 deriva de um único `CommercialSnapshot` mockado por funções puras; navegação e filtros ficam no URL para preservar contexto entre Home, Agente, Forecast, Filial e Oportunidade.

**Tech Stack:** Next.js 16.1.1, React 19, TypeScript 5, Tailwind CSS 4, Lucide React já instalado, Recharts apenas onde simplificar o gráfico sem prejudicar fidelidade, Node `node:test` para contratos puros e QA visual por Browser/IAB ou captura equivalente do executor.

**Spec:** `/mnt/data/Central-de-Receita-V3-Spec-FINAL/00_SPEC_VISAO_COMERCIAL_V3.md`

## Global Constraints

- Usar o checkout atual; não migrar framework ou styling stack.
- Preservar `Public Sans`, tokens Senior, `globals.css`, `Toaster` e identidade já instalados, salvo blocker visual comprovado.
- Não integrar banco, Prisma, API real ou LLM real na V3.
- Não alterar schema nem executar migrations.
- Não realizar writeback, mensagem externa, cobrança, alteração de forecast, oportunidade ou CRM.
- Não podar módulos legados fora da Home nesta rodada.
- Filtro organizacional superior é **Filial**; nunca `Todos os HEADs`.
- `FILIAL != HEAD`; não derivar um do outro por conveniência.
- Forecast oficial é fotografia congelada; movimentos posteriores são comparados contra ela.
- New Names x Cross permanece dimensão material da Home.
- Receita recorrente recebe maior ênfase visual que habilitação e serviços.
- Top 10 é ordenado por `abs(deltaForecast)` e inclui impactos positivos e negativos.
- Hero final usa exatamente: `Seu agente comercial de hoje`, `Seu retrato diário já está pronto.`, `Abrir agente`, `Resumo atualizado agora`.
- Hero mensal mostra Sem 1 / Sem 2 / Sem 3 / Sem 4 e destaca a semana corrente do snapshot.
- CTA `Abrir agente` carrega o mesmo snapshot e filtros da Home.
- Oportunidade abre como tela completa, não em modal/sheet.
- Retorno preserva período, solução, filial e origem da navegação.
- Não adicionar nova dependência sem blocker concreto; preferir dependências já instaladas.
- Não usar GSAP nesta rodada; motion de 180–280ms com `transform`/`opacity` é suficiente.
- Respeitar `prefers-reduced-motion` e foco por teclado já definidos em `globals.css`.
- Referência visual governante do hero/agente/semanas: `/mnt/data/Central-de-Receita-V3-Spec-FINAL/01_REFERENCIA_VISUAL_FINAL.png`.
- Referência visual secundária de densidade/tabela/rail: `/mnt/data/Central-de-Receita-V3-Spec-FINAL/02_REFERENCIA_VISUAL_HIGH_END.png`.

## Review Focus

1. **Reconciliação numérica:** alterar um registro mockado não pode deixar hero, KPIs, movimentos, Top 10, New Names x Cross, filiais ou agente com números divergentes.
2. **Contexto na navegação:** Home → Agente/Forecast/Filial/Oportunidade → voltar deve preservar `periodo`, `solucao`, `filial` e `from` sem reset silencioso.
3. **Semântica de filtro:** `Todas as filiais` é o default; HEAD nunca aparece como substituto de Filial no header.
4. **Detalhe de oportunidade:** deve ser página/tela completa no fluxo V3; o comportamento legado de Sheet não pode vazar para a nova jornada.
5. **Responsividade e overflow:** tabelas e hero não podem gerar overflow horizontal global; mobile deve condensar a informação sem esconder valores essenciais.

---

# Ordem de implementação das telas

1. **Fundação V3 + modelo de dados + shell**
2. **Home — primeira dobra**: header, filtros, hero/agente, semanas, KPIs
3. **Home — segunda dobra**: evolução, movimentos, New Names x Cross, Top 10, rail de filiais e destaques
4. **Agente Comercial**: briefing carregado + perguntas simuladas
5. **Forecast**: foto oficial → atual + movimentos + populações clicáveis
6. **Filial**: resumo da filial + oportunidades que explicam o resultado
7. **Oportunidade**: tela completa + valores + histórico mockado + retorno contextual
8. **Responsive + acessibilidade + QA visual + pacote final**

---

### Task 1: Isolar a V3 e congelar o contrato de navegação

**Files:**
- Create: `src/features/comercial-v3/types.ts`
- Create: `src/features/comercial-v3/context.ts`
- Create: `src/features/comercial-v3/copy.ts`
- Create: `tests/comercial-v3-context.test.mjs`
- Create: `tests/comercial-v3-copy.test.mjs`
- Modify later, not in this task: `src/app/page.tsx`

**Interfaces:**
- Produces: `CommercialView`, `CommercialPeriod`, `CommercialContext`, `parseCommercialContext(params)`, `buildCommercialHref(view, context, extra?)`, `COMMERCIAL_COPY`.
- Consumes: only `URLSearchParams`; no dependency on legacy `src/lib/domain/navigation.ts`.

- [ ] **Step 1: Write `tests/comercial-v3-context.test.mjs` with the TS transpile hook already used by `tests/navigation-ia.test.mjs`.**

Assert exactly:
- default context = `{ view: 'home', period: 'month', solution: 'all', branch: 'all' }`;
- `?view=agent&period=month&solution=ERP&branch=SP` parses without dropping filters;
- `buildCommercialHref('opportunity', ctx, { opportunityId: 'opp-001', from: 'home' })` serializes `period`, `solution`, `branch`, `op` and `from`;
- invalid view/period falls back to `home`/`month`;
- `branch` remains independent from any HEAD field.

- [ ] **Step 2: Run the focused context test and verify FAIL because the module does not exist.**

Run: `node --test tests/comercial-v3-context.test.mjs`

Expected: FAIL on missing `src/features/comercial-v3/context.ts`.

- [ ] **Step 3: Implement exact public types in `types.ts`.**

Required signatures:

```ts
export type CommercialView = 'home' | 'agent' | 'forecast' | 'branch' | 'opportunity'
export type CommercialPeriod = 'month' | 'quarter' | 'threeMonths'

export type CommercialContext = {
  view: CommercialView
  period: CommercialPeriod
  solution: string
  branch: string
  from?: CommercialView
  opportunityId?: string
}
```

Do not add generic routing abstractions.

- [ ] **Step 4: Implement `parseCommercialContext` and `buildCommercialHref` in `context.ts`.**

Required signatures:

```ts
export function parseCommercialContext(params: URLSearchParams): CommercialContext
export function buildCommercialHref(
  view: CommercialView,
  context: Pick<CommercialContext, 'period' | 'solution' | 'branch'>,
  extra?: { from?: CommercialView; opportunityId?: string },
): string
```

Use root query navigation (`/?view=...`) to minimize blast radius and preserve legacy files untouched.

- [ ] **Step 5: Write `tests/comercial-v3-copy.test.mjs` asserting the approved above-the-fold strings.**

Pin exactly:
- `Seu agente comercial de hoje`
- `Seu retrato diário já está pronto.`
- `Consolidei o panorama do mês, os movimentos do forecast, os principais desvios e as oportunidades que mais explicam o resultado de hoje.`
- `Abrir agente`
- `Resumo atualizado agora`
- `Todas as filiais`

- [ ] **Step 6: Implement `COMMERCIAL_COPY` in `copy.ts` as the only source for those strings.**

- [ ] **Step 7: Re-run both focused tests.**

Run: `node --test tests/comercial-v3-context.test.mjs tests/comercial-v3-copy.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add src/features/comercial-v3/types.ts src/features/comercial-v3/context.ts src/features/comercial-v3/copy.ts tests/comercial-v3-context.test.mjs tests/comercial-v3-copy.test.mjs
git commit -m "feat: define commercial v3 context contract"
```

---

### Task 2: Criar a fonte mock única e seletores reconciliados

**Files:**
- Create: `src/features/comercial-v3/mock-data.ts`
- Create: `src/features/comercial-v3/model.ts`
- Create: `tests/comercial-v3-model.test.mjs`

**Interfaces:**
- Produces: `COMMERCIAL_SNAPSHOT`, `selectCommercialView(snapshot, filters)`, `selectHomeModel(...)`, `selectForecastModel(...)`, `selectBranchModel(...)`, `selectOpportunityModel(...)`, `selectAgentBriefing(...)`.
- Consumes: types from Task 1 only.

- [ ] **Step 1: Write the failing reconciliation tests in `tests/comercial-v3-model.test.mjs`.**

Pin the default monthly slice to these values:

```text
Meta total              = R$ 12,0 mi
Realizado                = R$ 8,4 mi
Forecast oficial         = R$ 11,0 mi
Forecast atual           = R$ 10,2 mi
Delta vs forecast oficial= -R$ 0,8 mi
Delta vs meta            = -R$ 1,8 mi
New Names realizado      = R$ 5,1 mi
Cross realizado          = R$ 3,3 mi
Recorrente realizado     = R$ 6,2 mi
Habilitação              = R$ 1,1 mi
Serviços                 = R$ 1,1 mi
```

Movimentos do forecast:

```text
Saiu          = -R$ 0,9 mi
Postergou     = -R$ 0,6 mi
Alterou valor = -R$ 0,3 mi
Entrou        = +R$ 1,0 mi
Net           = -R$ 0,8 mi
Gross abs     =  R$ 2,8 mi
```

Top 10 movement deltas, em milhões, para o fixture principal:

```text
+0.600, -0.550, +0.384, -0.350, -0.300,
-0.200, -0.150, -0.150, -0.100, +0.016
```

Assert `sum(abs(top5)) / sum(abs(all10)) === 0.78` com tolerância de ponto flutuante.

- [ ] **Step 2: Pin branch totals in the same test.**

Use this monthly branch fixture:

| Filial | Realizado | Meta | Forecast atual |
|---|---:|---:|---:|
| SP | 2,0 | 2,4 | 2,0 |
| RS | 1,5 | 2,0 | 1,7 |
| MG | 1,2 | 1,8 | 1,5 |
| PR | 0,9 | 1,5 | 1,2 |
| SC | 0,8 | 1,2 | 1,0 |
| GO | 0,7 | 1,0 | 0,8 |
| BA | 0,6 | 0,8 | 0,7 |
| Outras | 0,7 | 1,3 | 1,3 |

Assert sums = 8.4 / 12.0 / 10.2.

- [ ] **Step 3: Pin the week derivation.**

Snapshot mock default: `2026-09-19T09:12:00-04:00` → `Sem 3`.

Required week buckets for September mock:
- Sem 1 = 1–7
- Sem 2 = 8–14
- Sem 3 = 15–21
- Sem 4 = 22–30

Assert the current week is derived from `snapshot.asOf`, not hardcoded in the component.

- [ ] **Step 4: Run the model test and verify FAIL.**

Run: `node --test tests/comercial-v3-model.test.mjs`

- [ ] **Step 5: Implement `CommercialSnapshot` and the minimum mock grain in `mock-data.ts`.**

Required data groups:
- `branchTargets[]`;
- `realizedDeals[]` with `branch`, `solution`, `origin`, `recurring`, `enablement`, `services`;
- `forecastOpportunities[]` with `id`, `account`, `solution`, `executive`, `head?`, `branch`, `origin`, `stage`, `forecastOfficial`, `forecastCurrent`, `movement`, `delta`, `recurring`, `enablement`, `services`, `history[]`;
- `weeklyForecast[]` and optional `weeklyTargetPace[]` for hero rendering.

Use enough realized rows to derive 5.1 New Names + 3.3 Cross and enough forecast rows to derive 11.0 → 10.2. Do not store aggregate strings like `"78%"` in the fixture.

- [ ] **Step 6: Implement pure selectors in `model.ts`.**

Required functions:

```ts
export function selectHomeModel(snapshot: CommercialSnapshot, filters: CommercialFilters): HomeModel
export function selectForecastModel(snapshot: CommercialSnapshot, filters: CommercialFilters): ForecastModel
export function selectBranchModel(snapshot: CommercialSnapshot, branch: string, filters: Omit<CommercialFilters, 'branch'>): BranchModel | null
export function selectOpportunityModel(snapshot: CommercialSnapshot, opportunityId: string): OpportunityModel | null
export function selectAgentBriefing(snapshot: CommercialSnapshot, filters: CommercialFilters): AgentBriefingModel
```

Derive:
- KPI values;
- movement totals/counts;
- Top 10 sorted by `Math.abs(delta)` descending;
- Top 5 share from gross absolute movement;
- New Names/Cross share from realized rows;
- revenue composition;
- two branch attention signals as the two lowest `forecastCurrent / target` ratios within current filter;
- hero signals from the same derived model.

- [ ] **Step 7: Add filter tests for branch and solution.**

Test that a selected branch/solution reduces the relevant realized, forecast and opportunity populations and never rewrites `branch` from `head`.

- [ ] **Step 8: Run model tests and verify PASS.**

Run: `node --test tests/comercial-v3-model.test.mjs`

- [ ] **Step 9: Commit.**

```bash
git add src/features/comercial-v3/mock-data.ts src/features/comercial-v3/model.ts tests/comercial-v3-model.test.mjs
git commit -m "feat: add reconciled commercial v3 mock model"
```

---

### Task 3: Implementar shell V3, header e controles de contexto

**Files:**
- Create: `src/features/comercial-v3/commercial-v3-app.tsx`
- Create: `src/features/comercial-v3/components/commercial-shell.tsx`
- Create: `src/features/comercial-v3/components/commercial-header.tsx`
- Create: `src/features/comercial-v3/components/commercial-sidebar.tsx`
- Create: `src/features/comercial-v3/components/period-tabs.tsx`
- Create: `src/features/comercial-v3/components/filter-select.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx` metadata only, if desired; preserve font and Toaster.

**Interfaces:**
- Consumes: context helpers from Task 1 and models from Task 2.
- Produces: `CommercialV3App` and shared shell used by all five views.

- [ ] **Step 1: Replace `src/app/page.tsx` with a thin composition that renders `<CommercialV3App />`.**

Do not delete imports/components from legacy files; only stop importing them from root.

- [ ] **Step 2: Implement URL-driven state in `CommercialV3App`.**

Use `useSearchParams()` + `useRouter()`.

Required interactions:
- period tab updates `period` and stays on current view;
- solution filter updates `solution`;
- branch filter updates `branch`;
- `Todas as filiais` serializes as `branch=all` or omitted consistently;
- navigation functions preserve all active filters;
- back actions use `from` when present, not browser history assumptions.

- [ ] **Step 3: Implement `CommercialSidebar` exactly with these labels.**

```text
Visão Comercial
Forecast
Oportunidades
Contas
Relatórios
Explorar
```

Only `Visão Comercial` and `Forecast` must be fully wired in this implementation slice. `Oportunidades` should navigate to a filtered list surface backed by `view=forecast` or a compact list mode only if already required by the Home flow; `Contas`, `Relatórios`, `Explorar` may remain visually disabled with `aria-disabled=true` rather than fake navigation.

- [ ] **Step 4: Implement the header controls.**

Exact primary controls:
- `Mês`
- `Trimestre`
- `3 meses`
- `Todas as soluções`
- `Todas as filiais`
- search icon
- Giovanne / Diretoria Comercial profile treatment

No `Todos os HEADs` string anywhere in V3 source.

- [ ] **Step 5: Add a source-contract test that scans V3 files.**

Create `tests/comercial-v3-source-contract.test.mjs` and assert:
- V3 source contains `Todas as filiais`;
- V3 source does not contain `Todos os HEADs`;
- root `page.tsx` imports only the V3 app, not legacy dashboard screens.

- [ ] **Step 6: Run source-contract test.**

Run: `node --test tests/comercial-v3-source-contract.test.mjs`

Expected: PASS.

- [ ] **Step 7: Run lint on touched files or full lint.**

Run: `npm run lint`

- [ ] **Step 8: Commit.**

```bash
git add src/app/page.tsx src/app/layout.tsx src/features/comercial-v3 tests/comercial-v3-source-contract.test.mjs
git commit -m "feat: add commercial v3 shell and context controls"
```

---

### Task 4: Construir a Home V3 — hero do Agente + semanas + KPIs

**Files:**
- Create: `src/features/comercial-v3/screens/home-screen.tsx`
- Create: `src/features/comercial-v3/components/agent-hero.tsx`
- Create: `src/features/comercial-v3/components/weekly-forecast-scene.tsx`
- Create: `src/features/comercial-v3/components/hero-briefing-card.tsx`
- Create: `src/features/comercial-v3/components/kpi-strip.tsx`
- Create: `tests/comercial-v3-hero-contract.test.mjs`

**Interfaces:**
- Consumes: `HomeModel`, `CommercialContext`, `COMMERCIAL_COPY`.
- Produces: above-the-fold Home and `onOpenAgent()` callback.

- [ ] **Step 1: Write a source contract test for approved hero copy and CTA.**

Assert the implementation references `COMMERCIAL_COPY.hero` and exposes exactly one primary CTA labelled `Abrir agente`.

- [ ] **Step 2: Implement `AgentHero`.**

Desktop composition at 1536×1024:
- left copy ~30–34% of hero width;
- briefing summary card around center-left;
- weekly scene occupies remaining right side;
- min hero height ~300px in production implementation, tuned by screenshot rather than copied pixel-for-pixel;
- headline max 2 lines at reference viewport;
- CTA bottom-left;
- `Resumo atualizado agora` adjacent as secondary state.

- [ ] **Step 3: Implement `HeroBriefingCard` from derived values.**

Three lines, derived from `AgentBriefingModel`:
1. count of negative movement types that pressure forecast;
2. Top 5 share of gross absolute movement;
3. count of branch attention signals.

No hardcoded numeric strings.

- [ ] **Step 4: Implement `WeeklyForecastScene` as controlled SVG/CSS, not a raster screenshot.**

Required:
- four mountain bands with low contrast;
- green forecast trajectory;
- dashed target/rhythm line only from mock `weeklyTargetPace`;
- week separators and labels Sem 1–4;
- current week marker derived from snapshot date;
- callout with current forecast and delta;
- no text collision at 1536×1024.

Do not use Image Gen raster as UI background; the scene must remain responsive and code-native.

- [ ] **Step 5: Implement KPI strip in exact order.**

`Meta do mês → Realizado → Forecast oficial → Forecast atual → Δ versus meta`.

Use `.num`/tabular figures. Revenue progress bars are semantic presentation only; label numbers explicitly.

- [ ] **Step 6: Wire CTA `Abrir agente` to `view=agent` preserving period/solution/branch.**

- [ ] **Step 7: Run focused tests and lint.**

Run:
```bash
node --test tests/comercial-v3-hero-contract.test.mjs tests/comercial-v3-model.test.mjs
npm run lint
```

- [ ] **Step 8: Capture first-viewport screenshot at 1536×1024 and compare immediately to `01_REFERENCIA_VISUAL_FINAL.png`.**

Do not continue to lower Home until the following are within design-review tolerance:
- sidebar/header proportion;
- headline wrapping;
- hero height;
- summary card position;
- weekly scene readability;
- CTA size/position;
- KPI baseline alignment.

- [ ] **Step 9: Commit after first-viewport fidelity pass.**

```bash
git add src/features/comercial-v3/screens/home-screen.tsx src/features/comercial-v3/components tests/comercial-v3-hero-contract.test.mjs screenshots/v3-home-above-fold.png
git commit -m "feat: build commercial v3 agent hero"
```

---

### Task 5: Completar a Home — análises, Top 10, filiais e destaques

**Files:**
- Create: `src/features/comercial-v3/components/month-evolution-chart.tsx`
- Create: `src/features/comercial-v3/components/forecast-movement-flow.tsx`
- Create: `src/features/comercial-v3/components/origin-mix.tsx`
- Create: `src/features/comercial-v3/components/top-opportunities-table.tsx`
- Create: `src/features/comercial-v3/components/branch-rail.tsx`
- Create: `src/features/comercial-v3/components/month-highlights.tsx`
- Modify: `src/features/comercial-v3/screens/home-screen.tsx`

**Interfaces:**
- Consumes: only `HomeModel` and callbacks to open Forecast/Branch/Opportunity.
- Produces: complete desktop Home.

- [ ] **Step 1: Implement `MonthEvolutionChart`.**

Use Recharts if it reproduces the reference without extra dependency; otherwise inline SVG.

Series:
- Meta: dashed blue-gray;
- Realizado: green;
- Forecast oficial: blue;
- Forecast atual: coral.

Chart must have legible 1/set, 8/set, 15/set, 22/set, 30/set labels and no dense tooltip chrome by default.

- [ ] **Step 2: Implement `ForecastMovementFlow` as sequential DOM/CSS flow.**

Order:
`Forecast oficial → Saiu → Postergou → Alterou valor → Entrou → Forecast atual`.

Each middle step shows:
- signed value;
- opportunity count;
- human label;
- clickable affordance to open Forecast already filtered to that movement.

Do not recreate a generic waterfall library.

- [ ] **Step 3: Implement `OriginMix` for New Names x Cross.**

Show:
- realized value and share for New Names;
- realized value and share for Cross;
- recurring value emphasized below;
- enablement/services available in tooltip/detail, not competing visually.

- [ ] **Step 4: Implement `TopOpportunitiesTable`.**

Desktop columns:
`# | Conta | Solução | Executivo | Filial | Movimento | Δ valor | Receita recorrente | Valor atual | Previsão | Estágio | Origem`.

Row click → `view=opportunity&op=<id>&from=home` preserving filters.

Do not add action menu or writeback CTA.

- [ ] **Step 5: Implement `BranchRail`.**

Each branch row shows:
- name;
- realized;
- target;
- current forecast;
- `% da meta`;
- compact bar.

Click → `view=branch&branch=<branch>`.

- [ ] **Step 6: Implement `MonthHighlights` from selectors only.**

Allowed statements must be derived from current filtered HomeModel. No duplicated hardcoded values.

- [ ] **Step 7: Run model tests to ensure Home additions did not duplicate calculations.**

Run: `node --test tests/comercial-v3-model.test.mjs`

- [ ] **Step 8: Capture full Home desktop screenshot and compare with both references.**

Primary QA comparison points:
1. final hero from `01_REFERENCIA_VISUAL_FINAL.png`;
2. analytics density from `02_REFERENCIA_VISUAL_HIGH_END.png`;
3. Top 10 row density;
4. branch rail hierarchy;
5. New Names x Cross prominence.

- [ ] **Step 9: Commit.**

```bash
git add src/features/comercial-v3/screens/home-screen.tsx src/features/comercial-v3/components screenshots/v3-home-1536x1024.png
git commit -m "feat: complete commercial v3 home analytics"
```

---

### Task 6: Implementar o Agente Comercial local simulado

**Files:**
- Create: `src/features/comercial-v3/screens/agent-screen.tsx`
- Create: `src/features/comercial-v3/agent.ts`
- Create: `src/features/comercial-v3/components/agent-briefing.tsx`
- Create: `src/features/comercial-v3/components/agent-conversation.tsx`
- Create: `tests/comercial-v3-agent.test.mjs`

**Interfaces:**
- Consumes: `selectAgentBriefing`, current `CommercialContext`.
- Produces: `answerAgentQuestion(question, briefing)` and a local-only conversation UI.

- [ ] **Step 1: Write deterministic agent tests.**

Supported intent examples:
- `o que mudou hoje?`
- `quais oportunidades concentram o desvio?`
- `quais filiais mais mudaram?`
- `como New Names e Cross participam?`
- `o que mudou na semana atual?`

Assert answers only contain values present in the briefing model.

Unknown question must return a natural limitation such as:
`Não encontrei essa resposta no retrato atual. Posso detalhar forecast, oportunidades, filiais, New Names x Cross ou a semana corrente.`

- [ ] **Step 2: Implement `answerAgentQuestion`.**

Keyword/intention matching only; no provider, no API call, no hidden async work.

- [ ] **Step 3: Build `AgentScreen`.**

Initial state:
- title/briefing current snapshot;
- same three hero signals expanded;
- quick question buttons;
- text input;
- back action labelled `Voltar à visão comercial`.

Interaction states:
- idle;
- quick prompt selected;
- local answer rendered;
- unsupported question;
- empty input disabled;
- back preserves period/solution/branch.

- [ ] **Step 4: Add permanent local-state disclosure in the agent footer.**

Exact intent: `Preview local · respostas simuladas · nenhuma alteração é gravada.`

- [ ] **Step 5: Run tests.**

Run: `node --test tests/comercial-v3-agent.test.mjs tests/comercial-v3-model.test.mjs`

Expected: PASS.

- [ ] **Step 6: Browser QA the CTA path.**

Verify:
`Home → Abrir agente → quick prompt → resposta → Voltar à visão comercial`.

All filters must survive.

- [ ] **Step 7: Commit.**

```bash
git add src/features/comercial-v3/agent.ts src/features/comercial-v3/screens/agent-screen.tsx src/features/comercial-v3/components/agent-* tests/comercial-v3-agent.test.mjs
git commit -m "feat: add local commercial briefing agent"
```

---

### Task 7: Implementar tela Forecast e drill-down por movimento

**Files:**
- Create: `src/features/comercial-v3/screens/forecast-screen.tsx`
- Create: `src/features/comercial-v3/components/forecast-summary.tsx`
- Create: `src/features/comercial-v3/components/forecast-movement-list.tsx`
- Create: `src/features/comercial-v3/components/forecast-opportunity-list.tsx`
- Modify: `src/features/comercial-v3/commercial-v3-app.tsx`

**Interfaces:**
- Consumes: `ForecastModel`, current context.
- Produces: movement selection state encoded in query as optional `movement` parameter if needed.

- [ ] **Step 1: Build Forecast summary.**

Required visible values:
- fotografia oficial;
- forecast atual;
- delta absoluto;
- delta percentual;
- New Names x Cross summary;
- branch breakdown.

- [ ] **Step 2: Build movement selectors.**

Buttons/segments:
- Saiu;
- Postergou;
- Alterou valor;
- Entrou.

Selecting a movement filters the opportunity list without changing the global branch/solution context.

- [ ] **Step 3: Make aggregated movement values clickable from Home.**

Home movement click must land in Forecast with the same movement selected.

- [ ] **Step 4: Opportunity click opens full-screen V3 opportunity.**

URL preserves `from=forecast`.

- [ ] **Step 5: Browser QA.**

Verify:
`Home movement → Forecast filtered → Opportunity → Voltar → Forecast filtered`.

- [ ] **Step 6: Commit.**

```bash
git add src/features/comercial-v3/screens/forecast-screen.tsx src/features/comercial-v3/components/forecast-* src/features/comercial-v3/commercial-v3-app.tsx
git commit -m "feat: add forecast drill down"
```

---

### Task 8: Implementar tela Filial

**Files:**
- Create: `src/features/comercial-v3/screens/branch-screen.tsx`
- Create: `src/features/comercial-v3/components/branch-summary.tsx`
- Create: `src/features/comercial-v3/components/branch-opportunity-table.tsx`
- Modify: `src/features/comercial-v3/commercial-v3-app.tsx`

**Interfaces:**
- Consumes: `BranchModel`, context where `branch !== 'all'`.
- Produces: full-screen branch view with opportunity navigation.

- [ ] **Step 1: Build branch summary.**

Show:
- branch name;
- target;
- realized;
- current forecast;
- `% target`;
- New Names x Cross in branch;
- current movement total.

No HEAD ranking.

- [ ] **Step 2: Build branch opportunity table sorted by absolute delta.**

Row click → `view=opportunity&from=branch`.

- [ ] **Step 3: Handle invalid/missing branch safely.**

If branch is `all` or unknown, render an explanatory empty state with CTA `Voltar à visão comercial`; do not pick a branch automatically.

- [ ] **Step 4: Browser QA branch path.**

Verify:
`Home rail → Filial → Oportunidade → Voltar → Filial`.

- [ ] **Step 5: Commit.**

```bash
git add src/features/comercial-v3/screens/branch-screen.tsx src/features/comercial-v3/components/branch-* src/features/comercial-v3/commercial-v3-app.tsx
git commit -m "feat: add branch drill down"
```

---

### Task 9: Implementar tela completa de Oportunidade

**Files:**
- Create: `src/features/comercial-v3/screens/opportunity-screen.tsx`
- Create: `src/features/comercial-v3/components/opportunity-summary.tsx`
- Create: `src/features/comercial-v3/components/opportunity-revenue.tsx`
- Create: `src/features/comercial-v3/components/opportunity-timeline.tsx`
- Modify: `src/features/comercial-v3/commercial-v3-app.tsx`

**Interfaces:**
- Consumes: `OpportunityModel`, `from`, global context.
- Produces: full-screen detail and deterministic return target.

- [ ] **Step 1: Render required fields.**

Show exactly when available:
- Conta;
- Solução;
- Executivo;
- Filial;
- HEAD;
- Estágio;
- Origem;
- Forecast na fotografia oficial;
- Forecast atual;
- Movimento observado;
- Mensalidade / recorrente;
- Habilitação;
- Serviços;
- histórico mock do período.

- [ ] **Step 2: Make recurring revenue visually strongest in the revenue block.**

Habilitação/serviços remain visible but secondary.

- [ ] **Step 3: Implement contextual back label.**

Examples:
- from Home → `Voltar à visão comercial`;
- from Forecast → `Voltar ao forecast`;
- from Branch → `Voltar à filial`.

Preserve filters and selected movement where applicable.

- [ ] **Step 4: Handle unknown `op` with a composed not-found state.**

Do not invent fallback opportunity. CTA returns to Home preserving filters.

- [ ] **Step 5: Add source-contract assertion that V3 root no longer uses the legacy Sheet detail path.**

Do not delete the legacy Sheet implementation; just ensure V3 cannot enter it.

- [ ] **Step 6: Browser QA all three entry paths.**

Verify:
- Home Top 10 → Opportunity → Home;
- Forecast → Opportunity → Forecast;
- Branch → Opportunity → Branch.

- [ ] **Step 7: Commit.**

```bash
git add src/features/comercial-v3/screens/opportunity-screen.tsx src/features/comercial-v3/components/opportunity-* src/features/comercial-v3/commercial-v3-app.tsx tests/comercial-v3-source-contract.test.mjs
git commit -m "feat: add full screen opportunity detail"
```

---

### Task 10: Responsividade e estados de interação

**Files:**
- Modify: all V3 components touched in Tasks 3–9
- Modify only if necessary: `src/app/globals.css`
- Create: `docs/qa/central-receita-v3-interaction-matrix.md`

**Interfaces:**
- No new data interfaces.
- Produces documented interaction states and responsive behavior.

- [ ] **Step 1: Implement required interactive states.**

Pin these states:
- sidebar active/hover/focus;
- period tab default/hover/selected/focus;
- select default/open/focus;
- CTA default/hover/pressed/focus;
- KPI hover only if subtle; KPI itself not clickable unless specified;
- movement step default/hover/focus/selected;
- table row hover/focus/pressed;
- branch row hover/focus;
- agent prompt idle/selected;
- agent input empty/typing/answered/unsupported;
- empty branch/opportunity state;
- reduced-motion mode.

- [ ] **Step 2: Implement tablet behavior at 1024×768.**

- sidebar may collapse to compact rail;
- hero becomes two rows if needed: copy/briefing above, weekly scene below;
- KPI row may become 3+2;
- analytics become 2-column then 1-column;
- table gets controlled horizontal scroll inside its panel only.

- [ ] **Step 3: Implement mobile behavior at 390×844.**

- no global horizontal overflow;
- header controls collapse into a filter toolbar/drawer or stacked controls;
- hero headline remains readable;
- weeks become compact horizontal strip/mini-chart;
- KPI stack or horizontal snap strip;
- Top 10 becomes stacked opportunity list preserving delta/branch/origin;
- recurring, enablement, services remain accessible in opportunity detail.

- [ ] **Step 4: Create interaction matrix doc with each control and expected result.**

No dead critical controls.

- [ ] **Step 5: Run lint and type/build gates.**

Run:
```bash
npm run lint
npx tsc --noEmit
npm run build
```

Record blockers exactly; do not claim PASS if dependency/network/runtime prevents a gate.

- [ ] **Step 6: Commit.**

```bash
git add src/features/comercial-v3 src/app/globals.css docs/qa/central-receita-v3-interaction-matrix.md
git commit -m "feat: finalize commercial v3 responsive states"
```

---

### Task 11: QA visual de agência e fechamento do pacote

**Files:**
- Create: `docs/qa/central-receita-v3-fidelity-ledger.md`
- Create screenshots under: `screenshots/v3/`
- No product code unless fixing a mismatch found here.

**Interfaces:**
- Consumes: accepted references and final browser render.
- Produces: fidelity ledger + verified screenshots + final ZIP.

- [ ] **Step 1: Run the app with the repository's supported local command.**

Preferred: `npm run dev`.

If `node_modules` is absent, install using the repository's existing package manager/lock strategy. Do not replace the stack.

- [ ] **Step 2: Capture these mandatory screenshots.**

```text
screenshots/v3/home-1536x1024.png
screenshots/v3/home-1440x900.png
screenshots/v3/agent-1536x1024.png
screenshots/v3/forecast-1536x1024.png
screenshots/v3/branch-1536x1024.png
screenshots/v3/opportunity-1536x1024.png
screenshots/v3/home-tablet-1024x768.png
screenshots/v3/home-mobile-390x844.png
```

- [ ] **Step 3: Compare `home-1536x1024.png` side by side with `01_REFERENCIA_VISUAL_FINAL.png`.**

Inspect and record at minimum:
1. sidebar width/density;
2. topbar height and filter spacing;
3. hero height and left/right balance;
4. headline line breaks;
5. briefing card geometry;
6. weekly mountain scene/marker;
7. KPI height/baseline;
8. analytics panel proportions;
9. color temperature/background;
10. shadows/radii/borders.

- [ ] **Step 4: Compare lower Home against `02_REFERENCIA_VISUAL_HIGH_END.png`.**

Inspect:
- Top 10 density;
- New Names x Cross hierarchy;
- branch rail readability;
- whitespace around analytics;
- line/chart legibility;
- no extra cards/components absent from the reference.

- [ ] **Step 5: Run the above-the-fold copy diff.**

Visible hero/header strings must match `COMMERCIAL_COPY`; list any intentional deviation. No unapproved extra badge, kicker, CTA or status string.

- [ ] **Step 6: Run interaction QA.**

Mandatory workflow checks:
- period tab changes selected state and data;
- solution filter changes model population;
- branch filter changes model population;
- Home → Agent → answer → Home preserves context;
- Home → Forecast movement → Opportunity → Forecast preserves movement/filter;
- Home → Branch → Opportunity → Branch preserves branch/filter;
- Home Top 10 → Opportunity → Home;
- no writeback occurs;
- browser console has no relevant errors.

- [ ] **Step 7: Fix every material visual mismatch and recapture affected screenshots.**

Do not close with a repair list while fixable issues remain.

- [ ] **Step 8: Complete `central-receita-v3-fidelity-ledger.md`.**

For each mismatch record:
- reference evidence;
- render evidence;
- fix made;
- remaining intentional deviation, if any.

- [ ] **Step 9: Re-run regression gates.**

Run:
```bash
node --test tests/comercial-v3-*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
```

Also run legacy tests that do not require a running server:
```bash
node --test tests/navigation-ia.test.mjs tests/forecast-headline.test.mjs tests/runtime-guards.test.mjs
```

Expected: PASS, or exact documented environment blocker.

- [ ] **Step 10: Produce final ZIP from the isolated checkout copy.**

Name:
`Central-de-Receita-V3-FINAL.zip`

Include:
- source;
- spec/reference docs needed for handoff;
- screenshots/v3;
- fidelity ledger;
- interaction matrix.

Exclude:
- `node_modules`;
- temporary browser profiles;
- debug screenshots superseded by final images;
- secrets.

- [ ] **Step 11: Final commit.**

```bash
git add docs/qa screenshots/v3 src/features/comercial-v3 src/app/page.tsx src/app/layout.tsx src/app/globals.css tests/comercial-v3-*.test.mjs
git commit -m "feat: ship central revenue commercial v3"
```

---

# Component inventory locked by this plan

| Component | Responsibility | Client state? |
|---|---|---|
| `CommercialV3App` | Parse URL, select view, preserve context | Yes |
| `CommercialShell` | Sidebar + topbar + content frame | No/local callbacks |
| `CommercialHeader` | period/solution/branch/search/profile | Yes via props |
| `AgentHero` | executive briefing entry point | No |
| `HeroBriefingCard` | three derived signals | No |
| `WeeklyForecastScene` | weeks + scenic forecast/target | No |
| `KpiStrip` | five executive KPIs | No |
| `MonthEvolutionChart` | monthly series | No |
| `ForecastMovementFlow` | official → movements → current | No/local selection callback |
| `OriginMix` | New Names x Cross + recurring emphasis | No |
| `TopOpportunitiesTable` | Top 10 + drill-down | No/local row focus |
| `BranchRail` | branch summary + drill-down | No |
| `MonthHighlights` | derived executive observations | No |
| `AgentScreen` | contextual simulated agent | Yes |
| `ForecastScreen` | movement drill-down | Yes for selected movement |
| `BranchScreen` | selected branch drill-down | No |
| `OpportunityScreen` | full-screen opportunity | No |

No generic widget framework, no universal dashboard card abstraction, no event bus, no global store and no new state library are required.

---

# Mock data contract locked by this plan

```ts
type CommercialSnapshot = {
  asOf: string
  competence: { year: number; month: number }
  periods: Record<CommercialPeriod, CommercialPeriodData>
}

type CommercialPeriodData = {
  branchTargets: BranchTarget[]
  realizedDeals: RealizedDeal[]
  forecastOpportunities: ForecastOpportunity[]
  weeklyForecast: WeeklyPoint[]
  weeklyTargetPace: WeeklyPoint[]
}
```

Minimum behavior:
- aggregates are **computed**, not duplicated;
- default monthly snapshot must reconcile to the 12.0 / 8.4 / 11.0 / 10.2 contract;
- filtered views use the same record population;
- agent briefing consumes selectors, never raw copied strings;
- opportunity history is mock-local and read-only;
- no fixture contains an invented `customerId` universal or a HEAD→Filial derivation rule.

---

# Visual QA acceptance criteria

A release candidate is accepted only when all are true:

- At 1536×1024, the V3 is immediately recognizable as the approved reference.
- Hero uses the final agent copy and has comparable visual weight to `01_REFERENCIA_VISUAL_FINAL.png`.
- Week labels and current-week marker remain readable without obscuring the mountain scene.
- `Todas as filiais` is present; `Todos os HEADs` is absent.
- KPI order, hierarchy and tabular numbers match the spec.
- Forecast movement flow is understandable without reading a tooltip.
- New Names x Cross remains visible in first screen continuation and uses realized as denominator.
- Recurring revenue is the strongest revenue component visually.
- Top 10 is readable, dense and table-driven on desktop.
- Branch rail uses branch, never HEAD, as primary organizational grouping.
- No extra AI-purple gradient, generic chatbot bubble or decorative AI badge is introduced.
- Agent is opened from the hero; there is no generic `IA` menu item.
- Opportunity detail is full-screen.
- No critical control is inert.
- Keyboard focus is visible.
- Reduced-motion users do not receive essential information only via animation.
- No global horizontal overflow at 390×844.
- Console is clean of relevant runtime errors.
- Briefing/KPI/chart/table numbers reconcile from the same model.
- No writeback/network mutation exists in V3.
- Fidelity ledger contains no unresolved material mismatch that is realistically fixable.

---

# Stop conditions

Stop and return to the spec owner instead of improvising if any of these occurs:

- the real checkout lacks the assumed Next/Tailwind structure;
- the approved copy conflicts with a newer explicit decision;
- implementation requires production metric definitions not present in the mock contract;
- a real corporate source is required to make a filter meaningful;
- a dependency or framework change becomes necessary;
- the executor cannot capture/inspect the rendered UI for the mandatory visual gate;
- the agent request expands into real LLM integration or writeback.

