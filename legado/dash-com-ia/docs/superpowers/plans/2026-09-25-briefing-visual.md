# Briefing visual-first — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` para implementar este plano tarefa por tarefa.

**Goal:** Converter o Briefing da Diretoria em um painel executivo orientado por visuais, com controles claros de horizonte, tamanho e densidade.

**Architecture:** Estender a visão comercial do domínio com uma decomposição mensal rastreável de New Name e Cross / Up Sell. Compor o Briefing em módulos React pequenos com gráficos Recharts/shadcn e barras semânticas; manter APIs existentes, filtros da URL, ações de detalhe e tratamento de erro parcial.

**Tech Stack:** Next.js 16, React 19, TypeScript, shadcn/ui local, Recharts 2.15.4, Node test runner com strip-types.

**Spec:** `docs/briefing-visual-spec.md`

## Global Constraints

- O app permanece local e 100% sintético; não conecta ao CRM e não grava ações.
- Não instalar dependências nem usar fonte externa de dados.
- Preservar a regra PEX já existente e a separação entre PEX, Forecast móvel, Win e Pedido.
- Valores com regra desconhecida ficam ausentes/não mapeados; não criar meta, conversão, receita oficial ou causalidade.
- New Name/Cross exigem rótulo exato e mapeamento observado/autorizado; data de competência é avaliada em `America/Sao_Paulo`.
- Preservar as rotas antigas, filtros aceitos, deep links, foco e provenance.
- Usar componentes locais shadcn e não copiar updates upstream nem adicionar pacotes.
- Manter viewport mobile como superfície irmã do desktop; informação crítica sempre disponível fora de hover.
- Não resetar, limpar ou estagiar o checkout. As 171 exclusões pré-existentes no índice devem permanecer intactas; não criar commit.

## Review Focus

- Datas próximas à virada do mês: agrupar no fuso da competência, não no fuso da máquina.
- Categoria de venda desconhecida, fixture-only ou não mapeada: excluir de New Name/Cross, mantendo estado/fonte explícitos.
- Ganho sem `valor_fechado`, perda no mês, lista vazia e forecast sem valores: não substituir nulo por valor previsto.
- Falha parcial de `/api/visao`, `/api/mudancas` ou `/api/agora`: distinguir seção indisponível de zero e conservar o restante do Briefing.
- Viewport 360–430 px, teclado, leitor de tela, prefers-reduced-motion e escala mínima/máxima: manter evidência, rótulos, foco e retorno ao gráfico.

---

### Task 1: Resumo mensal New Name e Cross / Up Sell

**Files:**
- Modify: `src/lib/domain/forecast-pex.ts`
- Modify: `src/lib/domain/types.ts`
- Create: `src/lib/domain/natureza-mes.ts`
- Modify: `src/lib/domain/metrics.ts`
- Test: `tests/natureza-mes.test.mjs`

**Interfaces:**
- `estaNaCompetencia(valor: string | null, competencia: CompetenciaPex, fusoHorario: string): boolean`
- `resumirNaturezasDoMes(snapshot: Snapshot, competencia: CompetenciaPex, fusoHorario: string): NaturezaComercialMesDTO[]`
- `VisaoDTO.naturezas_mes: NaturezaComercialMesDTO[]`
- `NaturezaComercialMesDTO` contém `natureza`, `rotulo`, `estado_mapeamento`, `fontes`, `entradas_criadas`, `ganhos_mes: TotalizadorPex`, `perdidas_mes` e `abertas_previstas_mes: TotalizadorPex`.

- [ ] **Step 1: Escrever teste de competência e mapeamento** em `tests/natureza-mes.test.mjs`. O fixture deve conter: New Name criado/previsto perto da virada UTC (30/09 23:30 em São Paulo), Cross Ganho no mês com valor, Cross Ganho sem valor, New Name Perdido no mês, categoria não mapeada com o mesmo nome e uma natureza diferente. Esperar `2` contagens New Name apropriadas, Cross separado, o Ganho sem valor preservado em `quantidade_sem_valor`, e categoria não mapeada fora do agregado.
- [ ] **Step 2: Verificar RED** com `node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/natureza-mes.test.mjs`. Esperado: o teste executa a visão existente e falha na asserção porque `naturezas_mes` ainda está ausente; não deve haver erro de import ou fixture.
- [ ] **Step 3: Implementar** `estaNaCompetencia` exportada em `forecast-pex.ts`, reaproveitando o formatador de `America/Sao_Paulo`; criar `resumirNaturezasDoMes` para New Name/Cross com rótulo exato e estados `observado`/`autorizado_anterior`; ligar a saída em `visaoComercial` e `VisaoDTO`. Não usar valor previsto para completar valor fechado.
- [ ] **Step 4: Verificar GREEN** repetindo o teste isolado e `tests/forecast-pex.test.mjs`.

### Task 2: Briefing visual com leitura executiva e modos de exibição

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/central/agora.tsx`
- Create: `src/components/central/briefing-visuais.tsx`
- Create: `src/components/central/controles-briefing.tsx`

**Interfaces:**
- `Agora` recebe `contexto: ContextoGlobal` e `atualizarContexto: AtualizarContexto`.
- `ControlesBriefing` recebe `escala: number`, `densidade: 'executivo' | 'completo'`, setters e horizonte selecionado.
- `BriefingVisuais` recebe os DTOs existentes de Agora, Mudanças e Visão, escala em percentual, densidade e callbacks de drill-down.
- Escala em estado React limitado a 80–130, botões −/+ em passos de 10 e restauração em 100.

- [ ] **Step 1: Compor os visuais** em `briefing-visuais.tsx`: PEX realizado vs previsto aberto; Forecast móvel anterior vs atual com 30/60/90; New Name e Cross com entradas, ganhos, perdas e previsão aberta do mês; composição do pipeline por funil/etapa; atenção com impactos/quantidades.
- [ ] **Step 2: Implementar os controles** em `controles-briefing.tsx`: horizonte pela ToggleGroup; escala gráfica 80–130% por Slider e stepper −/+; densidade Executiva/Completa; restaurar escala 100 e modo Executivo. Preferências de visual não usam storage persistente.
- [ ] **Step 3: Integrar** `contexto` e `atualizarContexto` no caso `agora` de `page.tsx`; horizonte deve persistir no query param `janela`. Manter a tela funcional durante estados de loading e erros parciais.
- [ ] **Step 4: Preservar** CTAs para Mudanças, Radar, Casos e detalhe, simulações locais, fontes/limitações; detalhe completo expansível. Não inferir conversão entre jornadas.
- [ ] **Step 5: Verificar** `npx tsc --noEmit`, `npx eslint src/components/central/ src/app/page.tsx` e toda a suíte depois da integração.

### Task 3: QA acessível e retomada local

**Files:**
- Modify: `QA_VISUAL.md`
- Modify: `HANDOFF_AI.md`
- Modify: `worklog.md`

- [ ] **Step 1: Verificar suite completa** com `node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/*.test.mjs`, usando `CENTRAL_BASE_URL=http://127.0.0.1:3001` para contratos HTTP.
- [ ] **Step 2: Inspecionar no navegador** em 1600×900 e 390×844: Briefing carregado, comparação Forecast, PEX, New Name/Cross, filtros 30/60/90, scale −/+ (limites e Reset), densidade Executiva/Completa, teclado/foco e balão Pergunte. Conferir zero quebras horizontais, rótulos visíveis e um estado de erro parcial ou vazio.
- [ ] **Step 3: Verificar lint, TSC e `npx next build`**; encerrar dev antes do build e reiniciar `npm run dev` em `127.0.0.1:3001` depois.
- [ ] **Step 4: Registrar** limites que ficaram sem prova; confirmar que as 171 exclusões preparadas não mudaram e deixar o navegador no Briefing. Sem screenshots salvos no repositório e sem commit.
