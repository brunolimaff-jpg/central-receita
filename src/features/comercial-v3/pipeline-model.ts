import type { ImportedRecord } from './manual-import'
import { cachedNormalizer } from './text-normalize.ts'

/**
 * Pipeline (docs/REGRAS-NEGOCIO.md §Pipeline): quantidade e valor por etapa da
 * carteira aberta, horizonte do mês corrente mais três meses e oportunidades
 * travadas (sem previsão ou com previsão vencida). Funções puras: nenhum número
 * nasce de estado externo ou de `new Date()` implícito — a data de referência é
 * sempre parâmetro, no formato `YYYY-MM-DD`.
 */

export type StageAggregate = { stage: string; count: number; value: number | null }
export type HorizonMonth = { month: string; count: number; value: number | null }
export type PipelineOverview = {
  open: ImportedRecord[]
  byStage: StageAggregate[]
  horizon: HorizonMonth[]
  withoutForecast: ImportedRecord[]
  overdue: ImportedRecord[]
  largest: ImportedRecord[]
}

/**
 * Etapas que encerram a oportunidade, fora da carteira aberta.
 *
 * Default alinhado ao `forecast-month.ts` e à planilha da Fabi: "Fechada e
 * Ganha" e "Fechada e Perdida" (com acento; a comparação normaliza). Os nomes
 * reais ainda dependem de validação com a Fabi (REGRAS-NEGOCIO, decisões em
 * aberto) — por isso a lista entra como parâmetro.
 */
export const DEFAULT_CLOSED_STAGES = ['Fechada e Ganha', 'Fechada e Perdida']

const normalize = cachedNormalizer(stage => stage.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR'))

export function isOpenStage(stage: string, closedStages: string[] = DEFAULT_CLOSED_STAGES): boolean {
  const value = normalize(stage)
  return Boolean(value) && !closedStages.some(closed => normalize(closed) === value)
}

/** Soma em que um valor ausente propaga `null`, igual a `sumKnown` do forecast-month: nunca vira zero silencioso. */
const sumKnown = (records: ImportedRecord[]): number | null =>
  records.some(record => record.predictedValue === null) ? null : records.reduce((sum, record) => sum + (record.predictedValue ?? 0), 0)

const monthOf = (date: string) => date.slice(0, 7)

/** Meses do horizonte: mês da data de referência mais os três seguintes (`YYYY-MM`). */
export function horizonMonths(referenceDate: string): string[] {
  const base = Number(referenceDate.slice(0, 4)) * 12 + Number(referenceDate.slice(5, 7)) - 1
  return Array.from({ length: 4 }, (_, index) => {
    const total = base + index
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
  })
}

export function buildPipelineOverview(records: ImportedRecord[], referenceDate: string, closedStages: string[] = DEFAULT_CLOSED_STAGES): PipelineOverview {
  const open = records.filter(record => isOpenStage(record.stage, closedStages))

  const stageMap = new Map<string, ImportedRecord[]>()
  for (const record of open) {
    const group = stageMap.get(record.stage)
    if (group) group.push(record); else stageMap.set(record.stage, [record])
  }
  const byStage: StageAggregate[] = [...stageMap.entries()]
    .map(([stage, rows]) => ({ stage, count: rows.length, value: sumKnown(rows) }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity) || b.count - a.count)

  const horizon = horizonMonths(referenceDate).map(month => {
    const rows = open.filter(record => record.forecastDate !== null && monthOf(record.forecastDate) === month)
    return { month, count: rows.length, value: sumKnown(rows) }
  })

  const withoutForecast = open.filter(record => record.forecastDate === null)
  const overdue = open.filter(record => record.forecastDate !== null && record.forecastDate < referenceDate)

  const largest = [...open].sort((a, b) => (b.predictedValue ?? -Infinity) - (a.predictedValue ?? -Infinity))

  return { open, byStage, horizon, withoutForecast, overdue, largest }
}
