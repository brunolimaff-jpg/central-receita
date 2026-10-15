/**
 * Seletores puros da Visão Comercial V3: toda métrica de tela deriva do
 * CommercialSnapshot por funções sem estado (plano Task 2 Step 6, l.244-254).
 *
 * Contrato travado por tests/comercial-v3-model.test.mjs:
 * KPIs 12,0/8,4/11,0/10,2 · movimentos que fecham · Top 10 por abs(delta) ·
 * filiais reconciliadas · FILIAL != HEAD · semanas derivadas de asOf.
 */

import {
  ALL_FILTERS,
  FORECAST_MOVEMENTS,
  type CommercialFilters,
  type CommercialPeriod,
  type CommercialSnapshot,
  type DealOrigin,
  type ForecastMovement,
  type ForecastOpportunity,
  type RealizedDeal,
  type SupportedQuestion,
  type Intervention,
  type AgentOpening,
  type EvidenceRef,
  type FocusAnswer,
} from './types'
import { mesCurto } from './mock-data'
import { ASSISTENTE_COPY, ASSISTENTE_PERGUNTAS, MOVIMENTO_SUBSTANTIVOS } from './copy'
import { formatarComSinal, formatarMilhoes, formatarPercentualInteiro } from './format'

export type KpiKey = 'meta' | 'realizado' | 'forecastOficial' | 'forecastAtual' | 'deltaMeta'

export type Kpi = {
  key: KpiKey
  value: number
  caption: string
}

export type MovementSummary = {
  value: number
  count: number
}

export type FlowStep = {
  key: string
  value: number
}

export type Movimentos = {
  oficial: number
  atual: number
  net: number
  grossAbs: number
  byMovement: Record<ForecastMovement, MovementSummary>
  steps: FlowStep[]
}

export type OrigemRealizado = {
  realizado: number
  newNames: number
  cross: number
  recorrente: number
  habilitacao: number
  servicos: number
}

export type Top10Row = {
  rank: number
  id: string
  account: string
  solution: string
  executive: string
  head: string | null
  branch: string
  movement: ForecastMovement | null
  delta: number
  recurring: number
  current: number
  prev: number
}

/** Busca textual compartilhada pelas superfícies V3 que listam oportunidades. */
export function filterOpportunityRows(
  rows: Top10Row[],
  details: ReadonlyMap<string, { stage: string; origin: string }>,
  query: string,
): Top10Row[] {
  const term = query.trim().toLowerCase()
  if (term === '') return rows
  return rows.filter((row) =>
    [
      row.account,
      row.solution,
      row.executive,
      row.branch,
      details.get(row.id)?.stage ?? '',
      details.get(row.id)?.origin ?? '',
      row.movement ?? '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(term),
  )
}

export type FilialRow = {
  branch: string
  realizado: number
  meta: number
  forecastAtual: number
  atingimento: number
  missing?: Array<'meta' | 'realizado' | 'forecastAtual'>
}

export type SinalAtencao = {
  branch: string
  cobertura: number
  realizado: number
  meta: number
}

export type SemanaRow = {
  week: number
  date?: string
  label: string
  rangeLabel: string
  current: boolean
  forecast: number
  pace: number
  cutoffDay: number
  closed: boolean
}

export type HomeModel = {
  kpis: Kpi[]
  movimentos: Movimentos
  origem: OrigemRealizado
  top10: Top10Row[]
  filiais: FilialRow[]
  atencao: SinalAtencao[]
  semanas: SemanaRow[]
  semanaAtual: number | null
  populacaoForecast: number
}

/**
 * Resumo da filial (plano Task 8 Step 1, l.690-702). `atingimento`, `origem` e
 * `movimentos` entram porque a tela precisa de `% da meta`, New Names × Cross e do
 * movimento corrente da filial — sempre derivados do mesmo snapshot, nunca
 * recalculados na tela.
 * `heads` é só o conjunto de executivos que atendem a filial: não é ranking e
 * nunca substitui a filial como eixo organizacional.
 */
export type BranchModel = {
  branch: string
  meta: number
  realizado: number
  forecastAtual: number
  /** `realizado / meta` — mesma razão usada no rail e nos tiles da Home. */
  atingimento: number
  oportunidades: Top10Row[]
  heads: string[]
  origem: OrigemRealizado
  movimentos: Movimentos
}

export type OpportunityModel = {
  id: string
  account: string
  solution: string
  executive: string
  head: string | null
  branch: string
  /** Origem comercial do negócio — campo exigido pela spec §7 (l.317-341). */
  origin: DealOrigin
  stage: string
  movement: ForecastMovement | null
  delta: number
  forecastOfficial: number
  forecastCurrent: number
  recurring: number
  enablement: number
  services: number
  history: Array<{ at: string; label: string }>
}

export type ForecastModel = {
  oficial: number
  atual: number
  deltaAbsoluto: number
  deltaPercentual: number
  oportunidades: Top10Row[]
  porMovimento: Record<ForecastMovement, Top10Row[]>
  origem: OrigemRealizado
  /** Totais e contagens por movimento, do mesmo recorte que alimenta `porMovimento`. */
  movimentos: Movimentos
  /** Visão por filial do recorte corrente (plano Task 7 Step 1, l.643: "branch breakdown"). */
  filiais: FilialRow[]
}

/**
 * Briefing do agente. `semanas`/`semanaAtual` entram porque a spec §18.5 (l.649-653)
 * exige resposta para "o que mudou na semana atual?" — a resposta não pode inventar
 * leitura semanal que o modelo não carregue.
 */
export type AgentBriefingModel = {
  tiposNegativos: number
  top5Share: number
  /** Quantas oportunidades entram no Top 5 e no Top 10 do recorte corrente. */
  top5Count: number
  top10Count: number
  atencao: SinalAtencao[]
  deltaOficial: number
  deltaMeta: number
  origem: OrigemRealizado
  movimentos: Movimentos
  kpis: Kpi[]
  semanas: SemanaRow[]
  semanaAtual: number | null
}

export type CommercialViewModel = {
  filtros: CommercialFilters
  home: HomeModel
  forecast: ForecastModel
}

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

function filtrarOpps(snapshot: CommercialSnapshot, f: CommercialFilters): ForecastOpportunity[] {
  return snapshot.periods[f.period].forecastOpportunities.filter(
    (opp) =>
      (f.solution === ALL_FILTERS || opp.solution === f.solution) &&
      (f.branch === ALL_FILTERS || opp.branch === f.branch),
  )
}

function filtrarDeals(snapshot: CommercialSnapshot, f: CommercialFilters): RealizedDeal[] {
  return snapshot.periods[f.period].realizedDeals.filter(
    (deal) =>
      (f.solution === ALL_FILTERS || deal.solution === f.solution) &&
      (f.branch === ALL_FILTERS || deal.branch === f.branch),
  )
}

function soma(values: number[]): number {
  return values.reduce((total, valor) => total + valor, 0)
}

const valorDeal = (deal: RealizedDeal): number => deal.recurring + deal.enablement + deal.services

function metaFiltrada(snapshot: CommercialSnapshot, f: CommercialFilters): number {
  const alvos = snapshot.periods[f.period].branchTargets
  if (f.branch === ALL_FILTERS) return soma(alvos.map((alvo) => alvo.target))
  return alvos.find((alvo) => alvo.branch === f.branch)?.target ?? 0
}

// ---------------------------------------------------------------------------
// Formatação (a UI pode reformatar; aqui ficam as legendas do contrato)
// ---------------------------------------------------------------------------

const pctInteiro = (razao: number): string => `${Math.round(razao * 100)}%`

const pctUmaCasa = (razao: number): string => `${(razao * 100).toFixed(1).replace('.', ',')}%`

function legendasKpis(meta: number, realizado: number, oficial: number, atual: number): Kpi[] {
  return [
    { key: 'meta', value: meta, caption: meta > 0 ? '100%' : '—' },
    {
      key: 'realizado',
      value: realizado,
      caption: meta > 0 ? `${pctInteiro(realizado / meta)} da meta` : '—',
    },
    {
      key: 'forecastOficial',
      value: oficial,
      caption: meta > 0 ? `${pctInteiro(oficial / meta)} da meta` : '—',
    },
    {
      key: 'forecastAtual',
      value: atual,
      caption: oficial > 0 ? `${pctUmaCasa((atual - oficial) / oficial)} vs. oficial` : '—',
    },
    {
      key: 'deltaMeta',
      value: atual - meta,
      caption: meta > 0 ? pctInteiro((atual - meta) / meta) : '—',
    },
  ]
}

// ---------------------------------------------------------------------------
// Linha de oportunidade (mesma forma no Top 10, Filial e Forecast)
// ---------------------------------------------------------------------------

function paraLinha(opp: ForecastOpportunity, rank: number): Top10Row {
  return {
    rank,
    id: opp.id,
    account: opp.account,
    solution: opp.solution,
    executive: opp.executive,
    head: opp.head ?? null,
    branch: opp.branch,
    movement: opp.movement,
    delta: opp.delta,
    recurring: opp.recurring,
    current: opp.forecastCurrent,
    prev: opp.forecastOfficial,
  }
}

function origemDe(deals: RealizedDeal[]): OrigemRealizado {
  return {
    realizado: soma(deals.map(valorDeal)),
    newNames: soma(deals.filter((d) => d.origin === 'New Name').map(valorDeal)),
    cross: soma(deals.filter((d) => d.origin === 'Cross').map(valorDeal)),
    recorrente: soma(deals.map((d) => d.recurring)),
    habilitacao: soma(deals.map((d) => d.enablement)),
    servicos: soma(deals.map((d) => d.services)),
  }
}

function movimentosDe(oppss: ForecastOpportunity[], oficial: number, atual: number): Movimentos {
  const byMovement = {} as Record<ForecastMovement, MovementSummary>
  for (const movimento of FORECAST_MOVEMENTS) {
    const doMovimento = oppss.filter((opp) => opp.movement === movimento)
    byMovement[movimento] = {
      value: soma(doMovimento.map((opp) => opp.delta)),
      count: doMovimento.length,
    }
  }

  const steps: FlowStep[] = [{ key: 'oficial', value: oficial }]
  let acumulado = oficial
  for (const movimento of FORECAST_MOVEMENTS) {
    acumulado += byMovement[movimento].value
    steps.push({ key: movimento, value: acumulado })
  }
  steps.push({ key: 'atual', value: atual })

  const deltas = oppss.filter((opp) => opp.movement !== null).map((opp) => opp.delta)
  return {
    oficial,
    atual,
    net: soma(deltas),
    grossAbs: soma(deltas.map(Math.abs)),
    byMovement,
    steps,
  }
}

function filiaisDe(
  snapshot: CommercialSnapshot,
  f: CommercialFilters,
  deals: RealizedDeal[],
  oppss: ForecastOpportunity[],
): FilialRow[] {
  const alvos = snapshot.periods[f.period].branchTargets
  const nomes = f.branch === ALL_FILTERS ? alvos.map((alvo) => alvo.branch) : [f.branch]
  return nomes.map((branch) => {
    const realizado = soma(deals.filter((d) => d.branch === branch).map(valorDeal))
    const meta = alvos.find((alvo) => alvo.branch === branch)?.target ?? 0
    const forecastAtual = soma(
      oppss.filter((opp) => opp.branch === branch).map((opp) => opp.forecastCurrent),
    )
    return { branch, realizado, meta, forecastAtual, atingimento: meta > 0 ? realizado / meta : 0 }
  })
}

function atencaoDe(filiais: FilialRow[]): SinalAtencao[] {
  return filiais
    .filter((linha) => linha.meta > 0)
    .map((linha) => ({
      branch: linha.branch,
      cobertura: linha.forecastAtual / linha.meta,
      realizado: linha.realizado,
      meta: linha.meta,
    }))
    .sort((a, b) => a.cobertura - b.cobertura)
    .slice(0, 2)
}

function semanasDe(snapshot: CommercialSnapshot): { semanas: SemanaRow[]; semanaAtual: number | null } {
  const dados = snapshot.periods.month
  const dataSnapshot = snapshot.asOf.slice(0, 10)
  const ultimoDia = new Date(Date.UTC(snapshot.competence.year, snapshot.competence.month, 0)).getUTCDate()
  const corteSexta = (diaFinal: number) => {
    const data = new Date(Date.UTC(snapshot.competence.year, snapshot.competence.month - 1, diaFinal))
    return diaFinal - (data.getUTCDay() + 2) % 7
  }
  const fechado = (diaCorte: number) => {
    const dataCorte = `${snapshot.competence.year}-${String(snapshot.competence.month).padStart(2, '0')}-${String(diaCorte).padStart(2, '0')}`
    // Sem horário de fechamento na fonte, sexta ainda é parcial; sábado confirma o corte.
    return dataCorte < dataSnapshot
  }
  const atual = dados.weeklyForecast.filter((ponto) => fechado(corteSexta(ponto.toDay))).at(-1)?.week ?? null
  const mes = mesCurto(snapshot.competence.month)
  const semanas = dados.weeklyForecast.map((ponto) => ({
    week: ponto.week,
    label: `Sem ${ponto.week}`,
    rangeLabel: `Sex, ${String(corteSexta(ponto.toDay)).padStart(2, '0')}/${mes}`,
    current: ponto.week === atual,
    forecast: ponto.value,
    pace: soma(dados.branchTargets.map((item) => item.target)) * corteSexta(ponto.toDay) / ultimoDia,
    cutoffDay: corteSexta(ponto.toDay),
    closed: fechado(corteSexta(ponto.toDay)),
  }))
  return { semanas, semanaAtual: atual }
}

// ---------------------------------------------------------------------------
// Seletores públicos
// ---------------------------------------------------------------------------

export function selectHomeModel(snapshot: CommercialSnapshot, f: CommercialFilters): HomeModel {
  const oppss = filtrarOpps(snapshot, f)
  const deals = filtrarDeals(snapshot, f)
  const meta = metaFiltrada(snapshot, f)
  const realizado = soma(deals.map(valorDeal))
  const oficial = soma(oppss.map((opp) => opp.forecastOfficial))
  const atual = soma(oppss.map((opp) => opp.forecastCurrent))

  const ordenadas = [...oppss].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  const top10 = ordenadas.slice(0, 10).map((opp, indice) => paraLinha(opp, indice + 1))
  const filiais = filiaisDe(snapshot, f, deals, oppss)
  // O fixture semanal é consolidado: não simular histórico por filial ou solução.
  const { semanas, semanaAtual } = f.period === 'month' && f.branch === ALL_FILTERS && f.solution === ALL_FILTERS ? semanasDe(snapshot) : { semanas: [], semanaAtual: null }

  return {
    kpis: legendasKpis(meta, realizado, oficial, atual),
    movimentos: movimentosDe(oppss, oficial, atual),
    origem: origemDe(deals),
    top10,
    filiais,
    atencao: atencaoDe(filiais),
    semanas,
    semanaAtual,
    populacaoForecast: oppss.length,
  }
}

/**
 * Resumo de uma filial. O filtro de filial é o próprio argumento `branch`, então
 * o terceiro parâmetro é o contexto sem `branch` (plano Task 2 Step 6, l.251):
 * `all` e filial desconhecida devolvem `null` — nunca uma filial escolhida no lugar.
 */
export function selectBranchModel(
  snapshot: CommercialSnapshot,
  branch: string,
  f: Omit<CommercialFilters, 'branch'>,
): BranchModel | null {
  if (branch === ALL_FILTERS) return null
  const alvo = snapshot.periods[f.period].branchTargets.find((item) => item.branch === branch)
  if (!alvo) return null

  const contexto: CommercialFilters = { ...f, branch }
  const oppss = filtrarOpps(snapshot, contexto)
  const deals = filtrarDeals(snapshot, contexto)
  const oportunidades = [...oppss]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .map((opp, indice) => paraLinha(opp, indice + 1))
  const heads = [...new Set(oppss.map((opp) => opp.head).filter((head): head is string => head !== undefined))]
  const oficial = soma(oppss.map((opp) => opp.forecastOfficial))
  const atual = soma(oppss.map((opp) => opp.forecastCurrent))
  const realizado = soma(deals.map(valorDeal))

  return {
    branch,
    meta: alvo.target,
    realizado,
    forecastAtual: atual,
    atingimento: alvo.target > 0 ? realizado / alvo.target : 0,
    oportunidades,
    heads,
    origem: origemDe(deals),
    movimentos: movimentosDe(oppss, oficial, atual),
  }
}

/**
 * Detalhe de uma oportunidade. O período é opcional e cai no mês — a assinatura
 * original de dois argumentos continua valendo —, mas passar o período faz o
 * filtro de período do header valer também na tela de detalhe.
 */
export function selectOpportunityModel(
  snapshot: CommercialSnapshot,
  id: string,
  period: CommercialPeriod = 'month',
): OpportunityModel | null {
  if (id === '') return null
  const opp = snapshot.periods[period].forecastOpportunities.find((item) => item.id === id)
  if (!opp) return null
  return {
    id: opp.id,
    account: opp.account,
    solution: opp.solution,
    executive: opp.executive,
    head: opp.head ?? null,
    branch: opp.branch,
    origin: opp.origin,
    stage: opp.stage,
    movement: opp.movement,
    delta: opp.delta,
    forecastOfficial: opp.forecastOfficial,
    forecastCurrent: opp.forecastCurrent,
    recurring: opp.recurring,
    enablement: opp.enablement,
    services: opp.services,
    history: opp.history,
  }
}

export function selectForecastModel(snapshot: CommercialSnapshot, f: CommercialFilters): ForecastModel {
  const oppss = filtrarOpps(snapshot, f)
  const deals = filtrarDeals(snapshot, f)
  const oficial = soma(oppss.map((opp) => opp.forecastOfficial))
  const atual = soma(oppss.map((opp) => opp.forecastCurrent))

  const porMovimento = {} as Record<ForecastMovement, Top10Row[]>
  for (const movimento of FORECAST_MOVEMENTS) {
    porMovimento[movimento] = oppss
      .filter((opp) => opp.movement === movimento)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .map((opp, indice) => paraLinha(opp, indice + 1))
  }

  return {
    oficial,
    atual,
    deltaAbsoluto: atual - oficial,
    deltaPercentual: oficial > 0 ? (atual - oficial) / oficial : 0,
    oportunidades: [...oppss]
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .map((opp, indice) => paraLinha(opp, indice + 1)),
    porMovimento,
    origem: origemDe(deals),
    movimentos: movimentosDe(oppss, oficial, atual),
    filiais: filiaisDe(snapshot, f, deals, oppss),
  }
}

export function selectAgentBriefing(
  snapshot: CommercialSnapshot,
  f: CommercialFilters,
): AgentBriefingModel {
  const home = selectHomeModel(snapshot, f)
  const top5 = home.top10.slice(0, 5).reduce((total, linha) => total + Math.abs(linha.delta), 0)
  const todos = home.top10.reduce((total, linha) => total + Math.abs(linha.delta), 0)
  const tiposNegativos = FORECAST_MOVEMENTS.filter(
    (movimento) => home.movimentos.byMovement[movimento].value < 0,
  ).length
  const deltaMeta = home.kpis.find((kpi) => kpi.key === 'deltaMeta')?.value ?? 0

  return {
    tiposNegativos,
    top5Share: todos > 0 ? top5 / todos : 0,
    top5Count: Math.min(5, home.top10.length),
    top10Count: home.top10.length,
    atencao: home.atencao,
    deltaOficial: home.movimentos.net,
    deltaMeta,
    origem: home.origem,
    movimentos: home.movimentos,
    kpis: home.kpis,
    semanas: home.semanas,
    semanaAtual: home.semanaAtual,
  }
}

// ---------------------------------------------------------------------------
// Casa do assistente (revisão geral — ticket 01)
//
// Abertura narrativa, intervenções sugeridas ("Exige você") e Resposta em foco.
// Tudo deriva do mesmo `CommercialSnapshot` pelos filtros do recorte; os textos
// vivem em `copy.ts` e nenhum número nasce fora dos seletores.
// ---------------------------------------------------------------------------

/** Perguntas suportadas pela Resposta em foco — conjunto explícito, texto em `copy.ts`. */
export const AGENT_SUPPORTED_QUESTIONS: SupportedQuestion[] = ASSISTENTE_PERGUNTAS

/** Preenche um template `{chave}` de `copy.ts`; chave desconhecida fica como está. */
function preencher(template: string, valores: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (literal, chave: string) => valores[chave] ?? literal)
}

/**
 * Ordem do funil dos estágios usados pelo mock. "Parada antes da Negociação" é
 * qualquer estágio de índice menor que Negociação; estágio fora da lista não
 * vira prioridade — sem posição conhecida, o assistente não inventa urgência.
 */
const ORDEM_STAGES: readonly string[] = ['Proposta', 'Negociação', 'Contrato']
const INDICE_NEGOCIACAO = ORDEM_STAGES.indexOf('Negociação')

function antesDaNegociacao(stage: string): boolean {
  const indice = ORDEM_STAGES.indexOf(stage)
  return indice !== -1 && indice < INDICE_NEGOCIACAO
}

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Dias corridos entre o evento mais recente do history e o `asOf` — a idade
 * sem avanço da oportunidade. Sem history não há idade conhecida: 0, nunca
 * um número inventado.
 */
function diasSemAvanco(opp: ForecastOpportunity, asOf: string): number {
  if (opp.history.length === 0) return 0
  const marcadores = opp.history.map((evento) => Date.parse(evento.at))
  const ultimo = Math.max(...marcadores)
  const corte = Date.parse(asOf)
  if (Number.isNaN(ultimo) || Number.isNaN(corte)) return 0
  return Math.max(0, Math.round((corte - ultimo) / DIA_MS))
}

function paraIntervencao(opp: ForecastOpportunity, daysIdle: number): Intervention {
  return {
    id: `interv-${opp.id}`,
    headline: preencher(ASSISTENTE_COPY.intervencao.headline, {
      conta: opp.account,
      dias: String(daysIdle),
      etapa: opp.stage,
    }),
    reason: preencher(ASSISTENTE_COPY.intervencao.reason, {
      valor: formatarMilhoes(opp.forecastCurrent),
      etapa: opp.stage,
      executivo: opp.executive,
      filial: opp.branch,
    }),
    executive: opp.executive,
    value: opp.forecastCurrent,
    daysIdle,
    opportunityId: opp.id,
  }
}

/**
 * Intervenções sugeridas do bloco "Exige você": oportunidades do recorte
 * paradas antes da Negociação, ordenadas por valor em jogo (desc), com desempate
 * por dias sem avanço e id. No máximo 3 — não é "tudo atrasado".
 */
export function selectInterventions(data: CommercialSnapshot, f: CommercialFilters): Intervention[] {
  return filtrarOpps(data, f)
    .filter((opp) => opp.forecastCurrent > 0 && antesDaNegociacao(opp.stage))
    .map((opp) => paraIntervencao(opp, diasSemAvanco(opp, data.asOf)))
    .sort((a, b) => b.value - a.value || b.daysIdle - a.daysIdle || a.id.localeCompare(b.id))
    .slice(0, 3)
}

function oppPorId(data: CommercialSnapshot, f: CommercialFilters, id: string): ForecastOpportunity | undefined {
  return data.periods[f.period].forecastOpportunities.find((opp) => opp.id === id)
}

/**
 * Abertura narrativa da Central: saudação + síntese da POSIÇÃO do recorte
 * (período, filtros, forecast atual, gap, realizado) + perguntas suportadas.
 * O snapshot não guarda meses anteriores: nenhuma frase afirma movimento
 * entre meses — só a posição atual e os movimentos oficiais do período.
 */
export function selectAgentOpening(data: CommercialSnapshot, f: CommercialFilters): AgentOpening {
  const home = selectHomeModel(data, f)
  const valorKpi = (key: KpiKey): number => home.kpis.find((kpi) => kpi.key === key)?.value ?? 0
  const meta = valorKpi('meta')
  const atual = valorKpi('forecastAtual')
  const realizado = valorKpi('realizado')
  const gap = atual - meta

  const periodo = preencher(ASSISTENTE_COPY.narrativaPeriodo[f.period], {
    mes: ASSISTENTE_COPY.mesesCompletos[data.competence.month - 1] ?? '',
  })
  const camposPosicao = {
    periodo,
    atual: formatarMilhoes(atual),
    meta: formatarMilhoes(meta),
    gap: formatarMilhoes(Math.abs(gap)),
    pct: meta > 0 ? formatarPercentualInteiro(Math.abs(gap) / meta) : '—',
  }
  const posicao =
    gap < 0
      ? preencher(ASSISTENTE_COPY.abertura.gapAbaixo, camposPosicao)
      : gap > 0
        ? preencher(ASSISTENTE_COPY.abertura.gapAcima, camposPosicao)
        : preencher(ASSISTENTE_COPY.abertura.gapNaMeta, camposPosicao)

  const filtros = [
    f.branch !== ALL_FILTERS ? `filial ${f.branch}` : null,
    f.solution !== ALL_FILTERS ? `solução ${f.solution}` : null,
  ].filter((item): item is string => item !== null)

  const intervencoes = selectInterventions(data, f)
  const exigeVoce =
    intervencoes.length > 0
      ? preencher(ASSISTENTE_COPY.abertura.exigeVoce, {
          n: String(intervencoes.length),
          valor: formatarMilhoes(soma(intervencoes.map((item) => item.value))),
          dias: String(Math.max(...intervencoes.map((item) => item.daysIdle))),
        })
      : ASSISTENTE_COPY.abertura.exigeVoceVazio

  return {
    greeting: ASSISTENTE_COPY.saudacao,
    synthesis: [
      posicao,
      preencher(ASSISTENTE_COPY.abertura.realizado, {
        realizado: formatarMilhoes(realizado),
        pct: meta > 0 ? formatarPercentualInteiro(realizado / meta) : '—',
      }),
      filtros.length > 0
        ? preencher(ASSISTENTE_COPY.abertura.recorteFiltrado, { filtros: filtros.join(' · ') })
        : ASSISTENTE_COPY.abertura.recorteSemFiltro,
      exigeVoce,
    ],
    supportedQuestions: AGENT_SUPPORTED_QUESTIONS,
  }
}

function valorDeKpi(home: HomeModel, key: KpiKey): number {
  return home.kpis.find((kpi) => kpi.key === key)?.value ?? 0
}

function focoAtencao(data: CommercialSnapshot, f: CommercialFilters, questao: SupportedQuestion): FocusAnswer {
  const intervencoes = selectInterventions(data, f)
  const limits = [ASSISTENTE_COPY.foco.atencaoLimite, ASSISTENTE_COPY.foco.limiteSimulado]
  const contaDe = (id: string): string => oppPorId(data, f, id)?.account ?? id

  if (intervencoes.length === 0) {
    return {
      questionId: questao.id,
      questionLabel: questao.label,
      conclusion: ASSISTENTE_COPY.foco.atencaoConclusaoVazia,
      evidence: [],
      limits,
      nextStep: { label: ASSISTENTE_COPY.foco.atencaoProximoVazio, view: 'home' },
    }
  }

  const lista = intervencoes
    .map(
      (item) =>
        `${contaDe(item.opportunityId)} — ${formatarMilhoes(item.value)}, ${item.daysIdle} dias sem avanço`,
    )
    .join('; ')

  return {
    questionId: questao.id,
    questionLabel: questao.label,
    conclusion: preencher(ASSISTENTE_COPY.foco.atencaoConclusao, {
      n: String(intervencoes.length),
      lista,
    }),
    evidence: intervencoes.map((item) => ({
      label: preencher(ASSISTENTE_COPY.foco.atencaoEvidencia, {
        conta: contaDe(item.opportunityId),
        executivo: item.executive,
      }),
      view: 'opportunity',
      opportunityId: item.opportunityId,
    })),
    limits,
    nextStep: {
      label: preencher(ASSISTENTE_COPY.foco.atencaoProximo, {
        conta: contaDe(intervencoes[0].opportunityId),
      }),
      view: 'opportunity',
      opportunityId: intervencoes[0].opportunityId,
    },
  }
}

function focoMudou(data: CommercialSnapshot, f: CommercialFilters, questao: SupportedQuestion): FocusAnswer {
  const home = selectHomeModel(data, f)
  const detalhe = FORECAST_MOVEMENTS.map((movimento) => {
    const resumo = home.movimentos.byMovement[movimento]
    return preencher(ASSISTENTE_COPY.foco.mudouDetalhe, {
      rotulo: MOVIMENTO_SUBSTANTIVOS[movimento],
      valor: formatarComSinal(resumo.value),
      n: String(resumo.count),
    })
  }).join('; ')

  // Maiores impactos do período (o Top 10 já vem ordenado por abs(delta)).
  const principaisRefs: EvidenceRef[] = home.top10.slice(0, 2).map((linha): EvidenceRef => ({
    label: `${linha.account} — ${formatarComSinal(linha.delta)}`,
    view: 'opportunity',
    opportunityId: linha.id,
  }))

  return {
    questionId: questao.id,
    questionLabel: questao.label,
    conclusion: preencher(ASSISTENTE_COPY.foco.mudouConclusao, {
      oficial: formatarMilhoes(home.movimentos.oficial),
      atual: formatarMilhoes(home.movimentos.atual),
      detalhe,
      net: formatarComSinal(home.movimentos.net),
    }),
    evidence: [...principaisRefs, { label: ASSISTENTE_COPY.foco.mudouEvidenciaFluxo, view: 'forecast' }],
    limits: [ASSISTENTE_COPY.foco.mudouLimite, ASSISTENTE_COPY.foco.limiteSimulado],
    nextStep: { label: ASSISTENTE_COPY.foco.mudouProximo, view: 'forecast' },
  }
}

function focoGap(data: CommercialSnapshot, f: CommercialFilters, questao: SupportedQuestion): FocusAnswer {
  const home = selectHomeModel(data, f)
  const meta = valorDeKpi(home, 'meta')
  const atual = valorDeKpi(home, 'forecastAtual')
  const realizado = valorDeKpi(home, 'realizado')
  const gap = atual - meta

  const campos = {
    gap: formatarMilhoes(Math.abs(gap)),
    pct: meta > 0 ? formatarPercentualInteiro(Math.abs(gap) / meta) : '—',
    atual: formatarMilhoes(atual),
    meta: formatarMilhoes(meta),
    realizado: formatarMilhoes(realizado),
    pctRealizado: meta > 0 ? formatarPercentualInteiro(realizado / meta) : '—',
  }
  const conclusion =
    gap < 0
      ? preencher(ASSISTENTE_COPY.foco.gapConclusaoAbaixo, campos)
      : preencher(ASSISTENTE_COPY.foco.gapConclusaoAcima, campos)

  // Composição do recorte: forecast, evolução da Central e a filial de menor
  // cobertura — tudo do mesmo snapshot, sem somar realizado ao forecast.
  const evidence: EvidenceRef[] = [
    { label: ASSISTENTE_COPY.foco.gapEvidenciaForecast, view: 'forecast' },
    { label: ASSISTENTE_COPY.foco.gapEvidenciaEvolucao, view: 'home' },
  ]
  const menorCobertura = home.atencao[0]
  if (menorCobertura) {
    evidence.push({
      label: preencher(ASSISTENTE_COPY.foco.gapEvidenciaCobertura, { filial: menorCobertura.branch }),
      view: 'branch',
    })
  }

  return {
    questionId: questao.id,
    questionLabel: questao.label,
    conclusion,
    evidence,
    limits: [ASSISTENTE_COPY.foco.limiteSimulado, ASSISTENTE_COPY.foco.gapLimiteComposicao],
    nextStep: { label: ASSISTENTE_COPY.foco.gapProximo, view: 'forecast' },
  }
}

/**
 * Resposta em foco para uma pergunta suportada. Pergunta fora do conjunto
 * explícito devolve `null` — a UI mostra a limitação específica, nunca uma
 * resposta inventada.
 */
export function selectFocusAnswer(
  data: CommercialSnapshot,
  f: CommercialFilters,
  questionId: string,
): FocusAnswer | null {
  const questao = AGENT_SUPPORTED_QUESTIONS.find((item) => item.id === questionId)
  if (!questao) return null
  if (questao.id === 'exige-atencao') return focoAtencao(data, f, questao)
  if (questao.id === 'o-que-mudou') return focoMudou(data, f, questao)
  if (questao.id === 'explique-o-gap') return focoGap(data, f, questao)
  return null
}

export function selectCommercialView(
  snapshot: CommercialSnapshot,
  f: CommercialFilters,
): CommercialViewModel {
  return {
    filtros: f,
    home: selectHomeModel(snapshot, f),
    forecast: selectForecastModel(snapshot, f),
  }
}

export function selectSolutionOptions(snapshot: CommercialSnapshot): string[] {
  const dados = snapshot.periods.month
  return [...new Set([...dados.realizedDeals, ...dados.forecastOpportunities].map((item) => item.solution))].sort()
}

export function selectBranchOptions(snapshot: CommercialSnapshot): string[] {
  return snapshot.periods.month.branchTargets.map((alvo) => alvo.branch)
}
