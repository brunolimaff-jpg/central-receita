import { TopOpportunitiesTable } from './top-opportunities-table'
import { FORECAST_COPY } from '../copy'
import { formatarOportunidades } from '../format'
import type { Top10Row } from '../model'
import type { CommercialHrefExtra, CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import type { ForecastMovement } from '../types'

/**
 * População de oportunidades do Forecast (plano Task 7 Steps 2 e 4, l.646-662).
 *
 * A lista reflete o movimento selecionado — quando não há movimento escolhido,
 * mostra o recorte inteiro ordenado por impacto absoluto. Cada linha abre a tela
 * completa de Oportunidade com `from=forecast` **e** o movimento ativo, para o
 * retorno cair exatamente no mesmo estado.
 */

type ForecastOpportunityListProps = {
  rows: Top10Row[]
  detalhes: Map<string, OpportunityDetail>
  movement: ForecastMovement | null
  nav: CommercialNav
  /** Solução ativa no recorte; o cabeçalho da lista mostra o produto com o nome. */
  solucao?: string
}

export function ForecastOpportunityList({
  rows,
  detalhes,
  movement,
  nav,
  solucao,
}: ForecastOpportunityListProps) {
  const subtitulo = movement
    ? `Movimento: ${movement} · ${formatarOportunidades(rows.length)}. Clique em uma linha para abrir a oportunidade.`
    : `${FORECAST_COPY.semMovimento} ${formatarOportunidades(rows.length)}.`

  return (
    <TopOpportunitiesTable
      rows={rows}
      detalhes={detalhes}
      nav={nav}
      titulo={FORECAST_COPY.listaTitulo}
      subtitulo={subtitulo}
      solucao={solucao}
      hrefDe={(linha) => {
        const extra: CommercialHrefExtra = { opportunityId: linha.id, from: 'forecast' }
        if (movement) extra.movement = movement
        return nav.href('opportunity', extra)
      }}
    />
  )
}
