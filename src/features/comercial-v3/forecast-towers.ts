import type { ImportedRecord } from './manual-import'

/**
 * Forecast em dois recortes: a estrutura de agora (filial da carga) e a de 2027
 * (torres). Em 2027 toda oportunidade cai em um segmento e, quando o produto
 * pertence a uma, também em uma horizontal — as duas leituras somam o mesmo
 * previsto por caminhos diferentes, nunca uma dentro da outra.
 *
 * A torre sai das colunas produto, módulo e modalidade da planilha. O que não
 * corresponde a nenhum segmento vai para Demais Segmentos; o que não corresponde a
 * nenhuma horizontal fica "Sem horizontal", visível em vez de sumir.
 */

export const SEGMENTOS = ['Demais Segmentos', 'Agronegócio', 'Construção', 'Indústria'] as const
export const HORIZONTAIS = ['ERP', 'HCM', 'Logística'] as const
export const SEM_HORIZONTAL = 'Sem horizontal'
export const SEM_FILIAL = 'Sem filial'

export type Segmento = (typeof SEGMENTOS)[number]
export type Horizontal = (typeof HORIZONTAIS)[number]

const REGRAS_SEGMENTO: Array<[RegExp, Segmento]> = [
  [/ind[úu]stria|manufatura/i, 'Indústria'],
  [/agro|gatec/i, 'Agronegócio'],
  [/constru[çc][ãa]o|obra prima|hypnobox/i, 'Construção'],
]

/** Organograma 2027: ERP + Senior Capital; HCM + GRS + Wiipo; Soluções de Logística. */
const REGRAS_HORIZONTAL: Array<[RegExp, Horizontal]> = [
  [/\bHCM\b|\bGRS\b|wiipo|konviva|jobconvo|gest[ãa]o de pessoas|folha|\bRH\b/i, 'HCM'],
  [/log[íi]stica|\bTMS\b|\bWMS\b|transporte|armaz[ée]m/i, 'Logística'],
  [/\bERP\b|senior capital|gest[ãa]o empresarial/i, 'ERP'],
]

const texto = (record: Pick<ImportedRecord, 'product' | 'module' | 'modality'>) =>
  [record.product, record.module, record.modality].filter(Boolean).join(' ')

export function segmentoDe(record: Pick<ImportedRecord, 'product' | 'module' | 'modality'>): Segmento {
  const alvo = texto(record)
  return REGRAS_SEGMENTO.find(([padrao]) => padrao.test(alvo))?.[1] ?? 'Demais Segmentos'
}

export function horizontalDe(record: Pick<ImportedRecord, 'product' | 'module' | 'modality'>): Horizontal | null {
  const alvo = texto(record)
  return REGRAS_HORIZONTAL.find(([padrao]) => padrao.test(alvo))?.[1] ?? null
}

export type LinhaRecorte = {
  rotulo: string
  /** Previsto do mês na régua do Forecast; `null` quando algum valor falta. */
  previsto: number | null
  ganho: number
  oportunidades: number
}

/**
 * Agrupa previsto e ganhos pelo mesmo recorte. `ordem` fixa as linhas que
 * aparecem mesmo zeradas; rótulos fora dela entram depois, por previsto.
 */
export function agruparPor(
  previstos: ImportedRecord[],
  ganhos: ImportedRecord[],
  chave: (record: ImportedRecord) => string,
  ordem: readonly string[] = [],
): LinhaRecorte[] {
  const linhas = new Map<string, LinhaRecorte>(ordem.map(rotulo => [rotulo, { rotulo, previsto: 0, ganho: 0, oportunidades: 0 }]))
  const linha = (rotulo: string) => {
    if (!linhas.has(rotulo)) linhas.set(rotulo, { rotulo, previsto: 0, ganho: 0, oportunidades: 0 })
    return linhas.get(rotulo)!
  }
  for (const record of previstos) {
    const item = linha(chave(record))
    item.oportunidades += 1
    item.previsto = item.previsto === null || record.predictedValue === null ? null : item.previsto + record.predictedValue
  }
  for (const record of ganhos) linha(chave(record)).ganho += record.closedValue ?? record.predictedValue ?? 0
  const fixas = ordem.map(rotulo => linhas.get(rotulo)!)
  const extras = [...linhas.values()].filter(item => !ordem.includes(item.rotulo))
    .sort((a, b) => (b.previsto ?? 0) - (a.previsto ?? 0) || a.rotulo.localeCompare(b.rotulo, 'pt-BR'))
  return [...fixas, ...extras]
}

export const filialDe = (record: ImportedRecord) => record.representative?.trim() || SEM_FILIAL
export const horizontalOuSem = (record: ImportedRecord) => horizontalDe(record) ?? SEM_HORIZONTAL
