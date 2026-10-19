/**
 * Contratos públicos da Visão Comercial V3.
 *
 * Fonte: 05_IMPLEMENTATION_PLAN_V3.md
 * - Task 1 Step 3 (l.90-108): CommercialView, CommercialPeriod, CommercialContext.
 * - Task 2 Step 5 (l.234-241) e "Mock data contract locked by this plan" (l.1015-1039): grão do mock.
 * - 00_SPEC_VISAO_COMERCIAL_V3.md §2 (l.29-68) e §18.4 (l.609-628): taxonomia e regras congeladas.
 *
 * Os nomes do contrato congelado permanecem em inglês; rótulos de UI vivem em `copy.ts`.
 */

/**
 * `opportunities` é a **lista** de oportunidades e `opportunity` é o
 * detalhe de uma oportunidade; `accounts` representa a entidade cliente.
 * As telas usam contratos distintos para preservar Conta != Oportunidade.
 */
export type CommercialView =
  | 'home'
  | 'agent'
  | 'journey'
  | 'system'
  | 'forecast'
  | 'opportunities'
  | 'accounts'
  | 'new-name'
  | 'cross'
  | 'branch'
  | 'opportunity'
  | 'config'
export type CommercialPeriod = 'month' | 'quarter' | 'threeMonths'

export type CommercialContext = {
  view: CommercialView
  period: CommercialPeriod
  solution: string
  branch: string
  from?: CommercialView
  opportunityId?: string
  /** Origem local completa do aprofundamento, incluindo recorte e busca. */
  returnTo?: string
  /**
   * Movimento selecionado no Forecast. O plano Task 7 (l.635) prevê o estado de
   * seleção de movimento na query como parâmetro opcional `movement`.
   */
  movement?: ForecastMovement
}

/** Recorte do contexto consumido pelos seletores puros (plano Task 2 Step 6, l.244-254). */
export type CommercialFilters = Pick<CommercialContext, 'period' | 'solution' | 'branch'>

/** Sentinela de "sem filtro" para solução e filial. O plano Task 3 Step 2 (l.311) manda omitir na URL. */
export const ALL_FILTERS = 'all'

export const COMMERCIAL_VIEWS = [
  'home',
  'agent',
  'journey',
  'system',
  'forecast',
  'opportunities',
  'accounts',
  'new-name',
  'cross',
  'branch',
  'opportunity',
  'config',
] as const
export const COMMERCIAL_PERIODS = ['month', 'quarter', 'threeMonths'] as const

/**
 * Taxonomia congelada dos movimentos do forecast (spec §4.5 Bloco B, l.196).
 * "Mudou de mês" não existe aqui: era o gap do preview HTML (ONDE-TA-TUDO-V3 §3, l.83-84).
 */
export const FORECAST_MOVEMENTS = ['Saiu', 'Postergou', 'Alterou valor', 'Entrou'] as const
export type ForecastMovement = (typeof FORECAST_MOVEMENTS)[number]

export const DEAL_ORIGINS = ['New Name', 'Cross'] as const
export type DealOrigin = (typeof DEAL_ORIGINS)[number]

// ---------------------------------------------------------------------------
// Grão do mock (Task 2 Step 5)
// ---------------------------------------------------------------------------

/** Meta da filial. `branch` é filial; nunca HEAD (spec §2, l.42-48). */
export type BranchTarget = {
  branch: string
  target: number
}

/** Negócio realizado. O valor é a soma de recorrente + habilitação + serviços. */
export type RealizedDeal = {
  id: string
  account: string
  branch: string
  solution: string
  origin: DealOrigin
  recurring: number
  enablement: number
  services: number
}

export type OpportunityHistoryEvent = {
  at: string
  label: string
}

/** Oportunidade do forecast. `head` é opcional e nunca define `branch`. */
export type ForecastOpportunity = {
  id: string
  account: string
  solution: string
  executive: string
  head?: string
  branch: string
  origin: DealOrigin
  stage: string
  forecastOfficial: number
  forecastCurrent: number
  /** `null` quando a oportunidade permaneceu igual à fotografia oficial. */
  movement: ForecastMovement | null
  delta: number
  recurring: number
  enablement: number
  services: number
  history: OpportunityHistoryEvent[]
}

/** Ponto da leitura semanal: faixa de dias do mês com valor acumulado (spec §18.4, l.613-618). */
export type WeeklyPoint = {
  week: number
  fromDay: number
  toDay: number
  value: number
}

export type CommercialPeriodData = {
  branchTargets: BranchTarget[]
  realizedDeals: RealizedDeal[]
  forecastOpportunities: ForecastOpportunity[]
  weeklyForecast: WeeklyPoint[]
  weeklyTargetPace: WeeklyPoint[]
}

export type CommercialSnapshot = {
  asOf: string
  competence: { year: number; month: number }
  periods: Record<CommercialPeriod, CommercialPeriodData>
}

// ---------------------------------------------------------------------------
// Casa do assistente (revisão geral — ticket 01 "Casa do assistente")
//
// Fonte: ../v3/REVISAO-GERAL-PLANO.md ("Home = fluxo contínuo", "Resposta em
// foco", "Exige você não é 'tudo atrasado'") e CONTEXT.md §Produto/navegação.
// A UI é construída contra estes nomes; o texto pt-BR vive em `copy.ts`.
// ---------------------------------------------------------------------------

/**
 * Pergunta suportada pela Resposta em foco. O conjunto é explícito no mock:
 * pergunta fora da lista recebe limitação específica (nunca resposta inventada).
 */
export type SupportedQuestion = {
  id: string
  label: string
  hint: string
}

/**
 * Intervenção sugerida do bloco "Exige você": oportunidade parada ANTES da
 * Negociação, com valor em jogo (`value` = forecast atual), dias sem avanço
 * (`daysIdle`, derivado do history vs. `asOf`) e o executivo responsável.
 * Nunca é categoria de "atraso": a headline descreve posição.
 */
export type Intervention = {
  id: string
  headline: string
  reason: string
  executive: string
  value: number
  daysIdle: number
  opportunityId: string
}

/** Abertura narrativa da Central: saudação + síntese da POSIÇÃO do recorte (sem comparativos inventados). */
export type AgentOpening = {
  greeting: string
  synthesis: string[]
  supportedQuestions: SupportedQuestion[]
}

/** Evidência citada pela Resposta em foco: um destino navegável do fluxo. */
export type EvidenceRef = {
  label: string
  view: CommercialView
  opportunityId?: string
}

/** Resposta em foco: conclusão → evidências → limites → próximo passo. */
export type FocusAnswer = {
  questionId: string
  questionLabel: string
  conclusion: string
  evidence: EvidenceRef[]
  limits: string[]
  nextStep: EvidenceRef
}
