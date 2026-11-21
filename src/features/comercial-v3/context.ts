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
} from './types.ts'

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

  /*
   * Nó da estrutura na Carteira. Aceita qualquer identificador não vazio; quem
   * valida se o nó existe é a tela, que cai na raiz quando não reconhece — a
   * URL nunca é o lugar de provar que um nó existe.
   */
  const idNo = (params.get('no') ?? '').trim()
  if (idNo !== '') contexto.no = idNo

  /*
   * `view=regional` era o nome do módulo antes de virar Territórios. Traduzir
   * aqui, e não numa rota de redirect, mantém o link antigo funcionando sem
   * uma ida a mais ao servidor — e sem deixar a URL velha sobreviver na barra.
   */
  if (contexto.view === 'regional') contexto.view = 'territorios'
  if (contexto.from === 'regional') contexto.from = 'territorios'

  // Território aberto. Vazio é o consolidado; quem valida se existe é a tela.
  const territorio = (params.get('territorio') ?? '').trim()
  if (territorio !== '') contexto.territorio = territorio

  // Recorte do painel de resultado levado para Territórios. Quem valida os
  // identificadores é a tela; aqui só não se perde o filtro pelo caminho.
  const segmento = (params.get('segmento') ?? '').trim()
  if (segmento !== '') contexto.segmento = segmento
  const corte = (params.get('corte') ?? '').trim()
  if (corte !== '') contexto.corte = corte

  const returnTo = retornoLocal(params.get('returnTo'))
  if (returnTo) contexto.returnTo = returnTo

  return contexto
}

/**
 * Monta o href da raiz preservando o contexto. `view` e `period` sempre aparecem;
 * solução e filial só aparecem quando filtram algo, o que mantém a URL curta sem perder estado.
 * `movement` só é serializado quando informado — o recorte de movimento pertence ao Forecast.
 *
 * `extra.branch` existe para quando o destino muda a filial em vez de herdá-la:
 * descer para uma filial em Territórios e voltar para "Todas". Sem ele, o href
 * só repetia o branch atual e o nível não mudava; `ALL_FILTERS` limpa o parâmetro.
 */
export function buildCommercialHref(
  view: CommercialView,
  context: Pick<CommercialContext, 'period' | 'solution' | 'branch'> & { query?: string; busca?: string; movement?: ForecastMovement | null; segmento?: string; corte?: string },
  extra?: { from?: CommercialView; opportunityId?: string; movement?: ForecastMovement | null; returnTo?: string; no?: string; territorio?: string; branch?: string },
): string {
  const params = new URLSearchParams()
  params.set('view', view)
  params.set('period', context.period)
  if (context.solution && context.solution !== ALL_FILTERS) params.set('solution', context.solution)
  const filial = extra?.branch ?? context.branch
  if (filial && filial !== ALL_FILTERS) params.set('branch', filial)
  // O recorte do painel de resultado acompanha a navegação; a tela de destino
  // valida os identificadores e ignora o que não conhece.
  if (context.segmento && context.segmento !== ALL_FILTERS) params.set('segmento', context.segmento)
  if (context.corte && context.corte !== ALL_FILTERS) params.set('corte', context.corte)
  if (extra?.opportunityId) params.set('op', extra.opportunityId)
  if (extra?.no) params.set('no', extra.no)
  if (extra?.territorio) params.set('territorio', extra.territorio)
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
