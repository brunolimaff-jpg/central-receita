import { filterOpportunityRows, type Top10Row } from './model'
import type { OpportunityDetail } from './opportunity-details'
import type { DealOrigin } from './types'

/**
 * Seleciona exemplos de teste pelo rótulo informado nos dados. Esse rótulo não
 * classifica oportunidades reais nem substitui a fonte própria de aquisição.
 */
export function selectOriginExamples(
  rows: Top10Row[],
  details: ReadonlyMap<string, OpportunityDetail>,
  query: string,
  origin: DealOrigin,
): Top10Row[] {
  return filterOpportunityRows(rows, details, query).filter((row) => details.get(row.id)?.origin === origin)
}
