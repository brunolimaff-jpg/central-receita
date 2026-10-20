/**
 * Contexto de navegação da Visão Comercial V3 — navegação e filtros na URL.
 *
 * Fonte: 05_IMPLEMENTATION_PLAN_V3.md Task 1 Steps 1-4 (l.75-123).
 * Consome apenas `URLSearchParams`; não depende de `src/lib/domain/navigation.ts` (legado V2).
 * Todas as telas vivem na raiz (`/?view=...`), então nenhuma rota nova é criada em `src/app`.
 */

import {
  ALL_FILTERS,
  COMMERCIAL_PERIODS,
  COMMERCIAL_VIEWS,
  FORECAST_MOVEMENTS,
  type CommercialContext,
  type CommercialPeriod,
  type CommercialView,
  type ForecastMovement,
} from './types'

/** Default exigido pelo plano (l.78-79): home / mês / todas as soluções / todas as filiais. */
export const DEFAULT_COMMERCIAL_CONTEXT: CommercialContext = {
  view: 'home',
  period: 'month',
  solution: ALL_FILTERS,
  branch: ALL_FILTERS,
}

function pertence<T extends string>(valores: readonly T[], valor: string | null): valor is T {
  return valor !== null && (valores as readonly string[]).includes(valor)
}

/** `null`, vazio ou só espaços viram "sem filtro"; o valor bruto é preservado quando informado. */
function lerFiltro(valor: string | null): string {
  const texto = (valor ?? '').trim()
  return texto === '' ? ALL_FILTERS : texto
}

/**
 * Lê o contexto da URL. View e período inválidos caem em `home` e `month`;
 * solução e filial ficam como vieram (a tela decide o estado vazio).
 * `branch` é lido apenas de `branch`: nenhum campo de HEAD participa da derivação (spec §2, l.42-48).
 */
export function parseCommercialContext(params: URLSearchParams): CommercialContext {
  const view = params.get('view')
  const period = params.get('period')

  const contexto: CommercialContext = {
    view: pertence(COMMERCIAL_VIEWS, view) ? view : DEFAULT_COMMERCIAL_CONTEXT.view,
    period: pertence(COMMERCIAL_PERIODS, period) ? period : DEFAULT_COMMERCIAL_CONTEXT.period,
    solution: lerFiltro(params.get('solution')),
    branch: lerFiltro(params.get('branch')),
  }

  const from = params.get('from')
  if (pertence(COMMERCIAL_VIEWS, from)) contexto.from = from

  const opportunityId = (params.get('op') ?? '').trim()
  if (opportunityId !== '') contexto.opportunityId = opportunityId

  const movement = params.get('movement')
  if (pertence(FORECAST_MOVEMENTS, movement)) contexto.movement = movement

  const returnTo = retornoLocal(params.get('returnTo'))
  if (returnTo) contexto.returnTo = returnTo

  return contexto
}

/**
 * Monta o href da raiz preservando o contexto. `view` e `period` sempre aparecem;
 * solução e filial só aparecem quando filtram algo, o que mantém a URL curta sem perder estado.
 * `movement` só é serializado quando informado — o recorte de movimento pertence ao Forecast.
 */
export function buildCommercialHref(
  view: CommercialView,
  context: Pick<CommercialContext, 'period' | 'solution' | 'branch'> & { query?: string; busca?: string; movement?: ForecastMovement | null },
  extra?: { from?: CommercialView; opportunityId?: string; movement?: ForecastMovement | null; returnTo?: string },
): string {
  const params = new URLSearchParams()
  params.set('view', view)
  params.set('period', context.period)
  if (context.solution && context.solution !== ALL_FILTERS) params.set('solution', context.solution)
  if (context.branch && context.branch !== ALL_FILTERS) params.set('branch', context.branch)
  if (extra?.opportunityId) params.set('op', extra.opportunityId)
  if (extra?.from) params.set('from', extra.from)
  const movement = extra?.movement === undefined ? context.movement : extra.movement
  if (movement) params.set('movement', movement)
  if (context.query) params.set('q', context.query)
  if (context.busca) params.set('busca', context.busca)
  const returnTo = retornoLocal(extra?.returnTo)
  if (returnTo) params.set('returnTo', returnTo)
  return `/?${params.toString()}`
}

/** Aceita apenas uma leitura local válida, sem retorno recursivo ao detalhe. */
function retornoLocal(href: string | null | undefined): string | undefined {
  if (!href?.startsWith('/?') || href.length > 3000) return undefined
  const params = new URLSearchParams(href.slice(2))
  const view = params.get('view')
  if (!pertence(COMMERCIAL_VIEWS, view) || view === 'opportunity' || params.has('returnTo')) return undefined
  return href
}

export function commercialReturnHref(context: CommercialContext): string {
  const saved = retornoLocal(context.returnTo)
  if (saved) return saved
  return buildCommercialHref(context.from && context.from !== 'opportunity' ? context.from : 'home', context)
}
