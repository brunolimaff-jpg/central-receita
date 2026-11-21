/**
 * Contrato de navegação das telas da Visão Comercial V3.
 *
 * Toda navegação e todo filtro vivem na URL (plano Task 1 Step 4, l.123;
 * Task 3 Step 2, l.303-313). As telas recebem este objeto pronto do
 * `CommercialV3App` em vez de montarem hrefs ou chamarem o router.
 */

import type { CommercialPeriod, CommercialView, ForecastMovement } from './types'

const SIDEBAR_VIEWS = ['home', 'journey', 'system', 'opportunities', 'accounts', 'new-name', 'cross', 'forecast', 'territorios', 'config'] as const
type SidebarView = (typeof SIDEBAR_VIEWS)[number]

/** Resolve a âncora visual do menu para as telas de drill-down. */
export function sidebarViewFor(view: CommercialView, from?: CommercialView): SidebarView | null {
  const destino = view === 'branch' || view === 'opportunity' ? from ?? 'home' : view
  if (SIDEBAR_VIEWS.includes(destino as SidebarView)) return destino as SidebarView
  return view === 'opportunity' || view === 'branch' ? 'home' : null
}

/** Home abre Oportunidades; as demais áreas com busca mantêm o contexto atual. */
export function globalSearchDestination(view: CommercialView): CommercialView {
  if (view === 'journey' || view === 'accounts' || view === 'new-name' || view === 'cross' || view === 'config') return view
  return 'opportunities'
}

/** Destino extra de um href: origem da navegação, oportunidade e movimento do Forecast. */
export type CommercialHrefExtra = {
  from?: CommercialView
  opportunityId?: string
  movement?: ForecastMovement | null
  returnTo?: string
  /** Território aberto em Territórios. Ausente = Visão CSO. */
  territorio?: string
  /**
   * Filial ativa em Territórios. Usa o mesmo parâmetro `branch` do resto do app,
   * então o filtro de filial e o nível aberto são a mesma coisa — dois
   * parâmetros permitiriam "filtro SP com filial DF aberta".
   */
  branch?: string
}

export type CommercialNav = {
  /** Href para uma tela preservando filtros e buscas ativos. */
  href: (view: CommercialView, extra?: CommercialHrefExtra) => string
  /** Href para o Forecast com o movimento selecionado (plano Task 7 Step 1, l.650). */
  movementHref: (movement: ForecastMovement) => string
  /**
   * Href para a Carteira num nó da estrutura. `no` ausente ou igual à raiz
   * devolve a URL sem o parâmetro, para o link do CSO ser o mesmo endereço da
   * carteira inteira.
   */
  carteiraHref: (noId?: string | null) => string
  /** Href para a tela da filial, preservando período e solução e registrando a origem. */
  branchHref: (branch: string, from?: CommercialView) => string
  onPeriod: (period: CommercialPeriod) => void
  onSolution: (solution: string) => void
  onBranch: (branch: string) => void
  /** Busca global, serializada como `q` na URL. */
  onQuery: (query: string) => void
  /** Busca da lista de Oportunidades, serializada como `busca` para não colidir com `q`. */
  onListQuery: (query: string) => void
}
