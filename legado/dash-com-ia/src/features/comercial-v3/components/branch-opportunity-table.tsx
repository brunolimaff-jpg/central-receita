import { TopOpportunitiesTable } from './top-opportunities-table'
import { FILIAIS_COPY } from '../copy'
import type { Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'

/**
 * Oportunidades da filial (plano Task 8 Step 2, l.704-706).
 *
 * Mesma tabela de 12 colunas do Top 10, ordenada por `abs(deltaForecast)` vinda do
 * seletor da filial. Cada linha abre a tela completa de Oportunidade com
 * `from=branch`, e o retorno cai de volta na filial com os filtros ativos.
 */

type BranchOpportunityTableProps = {
  rows: Top10Row[]
  detalhes: Map<string, OpportunityDetail>
  nav: CommercialNav
  acao?: React.ReactNode
}

export function BranchOpportunityTable({ rows, detalhes, nav, acao }: BranchOpportunityTableProps) {
  return (
    <TopOpportunitiesTable
      rows={rows}
      detalhes={detalhes}
      nav={nav}
      titulo={FILIAIS_COPY.oportunidadesTitulo}
      subtitulo={FILIAIS_COPY.oportunidadesSubtitulo}
      acao={acao}
      hrefDe={(linha) => nav.href('opportunity', { opportunityId: linha.id, from: 'branch' })}
    />
  )
}
