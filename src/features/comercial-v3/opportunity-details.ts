/**
 * Detalhe por oportunidade: Estágio e Origem.
 *
 * `Top10Row` (model.ts:57-70) carrega só o que a tabela ordena e mede, e
 * `paraLinha` (model.ts:230-245) não projeta `stage` nem `origin`. O plano
 * Task 5 Step 4 (l.503-505) exige as duas colunas no Top 10, então o detalhe é
 * resolvido por um índice puro sobre o mesmo snapshot — nenhum agregado nasce
 * aqui, nenhuma população paralela é criada e o modelo congelado não é tocado.
 */

import type { CommercialFilters, CommercialSnapshot, DealOrigin } from './types'

export type OpportunityDetail = {
  stage: string
  origin: DealOrigin
}

/**
 * Índice `id → detalhe` da competência selecionada. O snapshot é a única fonte,
 * e os ids das oportunidades são únicos dentro do período, então a busca vale
 * para qualquer recorte de solução/filial já aplicado nos seletores.
 */
export function selectOpportunityDetails(
  snapshot: CommercialSnapshot,
  filters: CommercialFilters,
): Map<string, OpportunityDetail> {
  const indice = new Map<string, OpportunityDetail>()
  for (const oportunidade of snapshot.periods[filters.period].forecastOpportunities) {
    indice.set(oportunidade.id, { stage: oportunidade.stage, origin: oportunidade.origin })
  }
  return indice
}
