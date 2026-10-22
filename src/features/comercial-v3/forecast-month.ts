import type { ImportedRecord } from './manual-import'

export type ForecastPeriod = 'semana' | 'mês'
type Movement = { count: number; value: number | null; records: ImportedRecord[] }
export type ForecastMonthResult = {
  period: { start: string; end: string }
  predicted: Movement
  realized: Movement
  projected: number | null
  /** Valor em aberto na régua (Previsto para o mês − Ganhos no CRM). */
  open: number | null
  /** @deprecated use `open`. */
  missing: number | null
  /** A carga traz a coluna de probabilidade; quando true, o corte de 75% foi aplicado. */
  probabilityAvailable: boolean
  /** Aviso de tela quando o corte de 75% não pôde ser aplicado; nulo quando foi. */
  notice: string | null
  entered: Movement | null
  exited: Movement | null
  postponed: Movement | null
  otherExited: Movement | null
  won: Movement
  lost: Movement
}

const normalize = (stage: string) => stage.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR')
/** Book PEX Filiais: Proposta ou Negociação com chance de 75% ou mais e previsão no mês. */
export const FORECAST_MIN_PROBABILITY = 0.75
/** Texto único do aviso, usado pelo Forecast e pela Visão Executiva. */
export const FORECAST_PROBABILITY_NOTICE = 'Previsão sem o corte de 75%: a exportação não trouxe a probabilidade.'
export const isForecastStage = (stage: string) => ['PROPOSTA', 'NEGOCIACAO'].some(prefix => normalize(stage).startsWith(prefix))
export const isClosedStage = (stage: string) => ['FECHADA E GANHA', 'FECHADA E PERDIDA'].includes(normalize(stage))
const inRange = (date: string | null, start: string, end: string) => Boolean(date && date >= start && date <= end)
const sumKnown = (records: ImportedRecord[], value: (record: ImportedRecord) => number | null) => records.some(record => value(record) === null) ? null : records.reduce((sum, record) => sum + (value(record) ?? 0), 0)
const movement = (records: ImportedRecord[], value: (record: ImportedRecord) => number | null = record => record.predictedValue): Movement => ({ count: records.length, value: sumKnown(records, value), records })
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function calculateForecastMonth(current: ImportedRecord[], previous: ImportedRecord[] | null, month: string, referenceDate: string, period: ForecastPeriod): ForecastMonthResult {
  const monthStart = `${month}-01`
  const monthEnd = iso(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0))
  let start = monthStart
  let end = monthEnd
  if (period === 'semana') {
    const anchor = new Date(`${referenceDate}T12:00:00Z`)
    const day = anchor.getUTCDay()
    anchor.setUTCDate(anchor.getUTCDate() - (day === 0 ? 6 : day - 1))
    start = iso(anchor)
    anchor.setUTCDate(anchor.getUTCDate() + 6)
    end = iso(anchor)
    // Forecast is always scoped to the selected month, including weeks crossing a month boundary.
    if (start < monthStart) start = monthStart
    if (end > monthEnd) end = monthEnd
  }
  const hasProbability = (records: ImportedRecord[]) => records.some(record => typeof record.probability === 'number')
  const probabilityAvailable = hasProbability(current)
  const meetsChance = (record: ImportedRecord, applies: boolean) => !applies || (typeof record.probability === 'number' && record.probability >= FORECAST_MIN_PROBABILITY)
  const openForMonth = (records: ImportedRecord[]) => {
    const applies = hasProbability(records)
    return records.filter(record => isForecastStage(record.stage) && record.forecastDate?.startsWith(month) && meetsChance(record, applies))
  }
  const openCurrent = openForMonth(current)
  const predictedRecords = openCurrent.filter(record => inRange(record.forecastDate, start, end))
  const won = current.filter(record => normalize(record.stage) === 'FECHADA E GANHA' && inRange(record.closingDate, start, end))
  const lost = current.filter(record => normalize(record.stage) === 'FECHADA E PERDIDA' && inRange(record.closingDate, start, end))
  const currentById = new Map(openForMonth(current).map(record => [record.opportunityId, record]))
  const currentRecordsById = new Map(current.map(record => [record.opportunityId, record]))
  const previousById = new Map(openForMonth(previous ?? []).map(record => [record.opportunityId, record]))
  const entered = previous === null ? null : [...currentById].filter(([id]) => !previousById.has(id)).map(([, record]) => record)
  const exited = previous === null ? null : [...previousById].filter(([id]) => !currentById.has(id)).map(([, record]) => record)
  const postponed = exited?.filter(record => {
    const now = currentRecordsById.get(record.opportunityId)
    return Boolean(now && !isClosedStage(now.stage) && now.forecastDate && now.forecastDate > monthEnd)
  }) ?? null
  const otherExited = exited?.filter(record => {
    const now = currentRecordsById.get(record.opportunityId)
    return !now || (!isClosedStage(now.stage) && !(now.forecastDate && now.forecastDate > monthEnd))
  }) ?? null
  const movementForClosed = (records: ImportedRecord[]): Movement => movement(records, record => record.closedValue)
  const realizedRecords = won.filter(record => inRange(record.closingDate, start, end))
  const predictedValue = sumKnown(predictedRecords, record => record.predictedValue)
  const periodRealized = sumKnown(realizedRecords, record => record.closedValue)
  const projected = predictedValue === null || periodRealized === null ? null : predictedValue + periodRealized
  return {
    period: { start, end }, predicted: movement(predictedRecords), realized: movementForClosed(realizedRecords), projected,
    open: predictedValue, missing: predictedValue, probabilityAvailable,
    notice: probabilityAvailable ? null : FORECAST_PROBABILITY_NOTICE,
    entered: entered ? movement(entered) : null, exited: exited ? movement(exited) : null,
    postponed: postponed ? movement(postponed) : null, otherExited: otherExited ? movement(otherExited) : null,
    won: movementForClosed(won), lost: movementForClosed(lost),
  }
}
