import type { ImportedRecord } from './manual-import'
import { cachedNormalizer } from './text-normalize.ts'

export type ForecastPeriod = 'semana' | 'mês'
type Movement = { count: number; value: number | null; records: ImportedRecord[] }
/**
 * Decomposição do previsto entre as duas cargas, no período pedido. É a única
 * régua do saldo: Entrou + Saiu + Alterou fecha com a variação do total. Ganhou
 * e Perdeu são desfecho (etapa e data), não parcela a somar outra vez.
 */
export type ForecastBridge = {
  totalAnterior: number | null
  totalAtual: number | null
  entrou: number | null
  /** Sinalizado: saída entra negativa. */
  saiu: number | null
  alterou: number | null
  /**
   * `false` quando a carga anterior é de outra competência: os totais de cada
   * mês continuam corretos, mas a diferença entre eles não mede movimento e
   * não pode virar saldo.
   */
  comparavel: boolean
}
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
  /** Presente só quando há carga anterior; ausente na primeira carga. */
  bridge: ForecastBridge | null
}

const normalize = cachedNormalizer(stage => stage.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR'))
/** Book PEX Filiais: Proposta ou Negociação com chance de 75% ou mais e previsão no mês. */
export const FORECAST_MIN_PROBABILITY = 0.75
/** Texto único do aviso, usado pelo Forecast e pela Visão Executiva. */
export const FORECAST_PROBABILITY_NOTICE = 'Previsão sem o corte de 75%: a exportação não trouxe a probabilidade.'
export const isForecastStage = (stage: string) => ['PROPOSTA', 'NEGOCIACAO'].some(prefix => normalize(stage).startsWith(prefix))
export const isClosedStage = (stage: string) => ['FECHADA E GANHA', 'FECHADA E PERDIDA'].includes(normalize(stage))
const inRange = (date: string | null, start: string, end: string) => Boolean(date && date >= start && date <= end)
const sumKnown = (records: ImportedRecord[], value: (record: ImportedRecord) => number | null) => records.some(record => value(record) === null) ? null : records.reduce((sum, record) => sum + (value(record) ?? 0), 0)
const movement = (records: ImportedRecord[], value: (record: ImportedRecord) => number | null = record => record.predictedValue): Movement => ({ count: records.length, value: sumKnown(records, value), records })
/** Negativo só quando o valor é conhecido; `null` continua desconhecido. */
const negateKnown = (value: number | null) => value === null ? null : 0 - value
/**
 * Variação de valor de quem está aberto nas duas cargas. `null` quando algum
 * dos lados não traz valor — a lacuna contamina a conta em vez de virar zero.
 */
function variacaoDaCarteira(current: ImportedRecord[], previousById: Map<string, ImportedRecord>): number | null {
  let variacao: number | null = 0
  for (const record of current) {
    const antes = previousById.get(record.opportunityId)
    if (!antes) continue
    if (record.predictedValue === null || antes.predictedValue === null) return null
    variacao += record.predictedValue - antes.predictedValue
  }
  return variacao
}
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** `2026-10-22` → `2026-10`; `null` se não for ISO válido. */
const competenciaDe = (referenceDate: string | null | undefined): string | null => {
  if (!referenceDate || !/^\d{4}-\d{2}-\d{2}$/.test(referenceDate)) return null
  const date = new Date(`${referenceDate}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === referenceDate ? referenceDate.slice(0, 7) : null
}

/**
 * `previousReferenceDate` é a data de referência da carga anterior. Sem ela, a
 * comparação herda o mês atual — é o que o app fazia antes de a competência
 * existir no histórico. Com ela e de outro mês, a ponte não é comparável: os
 * totais valem, a diferença não mede movimento.
 */
export function calculateForecastMonth(current: ImportedRecord[], previous: ImportedRecord[] | null, month: string, referenceDate: string, period: ForecastPeriod, previousReferenceDate?: string | null): ForecastMonthResult {
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
  /*
   * A janela do período vale para os quatro movimentos. Antes, só Ganhou e
   * Perdeu passavam por `inRange`; Entrou e Saiu ficavam presos ao mês, e a
   * tela mostrava quatro cartões de períodos diferentes. Comparar as duas
   * fotografias dentro da mesma janela mantém a leitura coerente.
   */
  const elegiveisNaJanela = (records: ImportedRecord[]) => openForMonth(records).filter(record => inRange(record.forecastDate, start, end))
  const openCurrent = elegiveisNaJanela(current)
  const predictedRecords = openCurrent
  const won = current.filter(record => normalize(record.stage) === 'FECHADA E GANHA' && inRange(record.closingDate, start, end))
  const lost = current.filter(record => normalize(record.stage) === 'FECHADA E PERDIDA' && inRange(record.closingDate, start, end))
  const currentById = new Map(openCurrent.map(record => [record.opportunityId, record]))
  const currentRecordsById = new Map(current.map(record => [record.opportunityId, record]))
  const previousWindow = elegiveisNaJanela(previous ?? [])
  const previousById = new Map(previousWindow.map(record => [record.opportunityId, record]))
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
  /*
   * A ponte é a régua do saldo: quem entrou, quem saiu e quem mudou de valor
   * explicam a diferença entre as duas cargas. Quem fechou já saiu do previsto
   * aberto — por isso conta em Saiu, e o desfecho (Ganhou/Perdeu) é lido
   * separado, sem somar duas vezes.
   */
  const competenciaAnterior = previousReferenceDate === undefined || previousReferenceDate === null
    ? month
    : competenciaDe(previousReferenceDate)
  const comparavel = competenciaAnterior !== null && competenciaAnterior === month
  const bridge = previous === null ? null : {
    totalAnterior: sumKnown(previousWindow, record => record.predictedValue),
    totalAtual: predictedValue,
    // Movimento só faz sentido entre cargas do mesmo mês; fora dele, fica null.
    entrou: comparavel && entered ? sumKnown(entered, record => record.predictedValue) : null,
    saiu: !comparavel ? null : exited && exited.length ? negateKnown(sumKnown(exited, record => record.predictedValue)) : (exited ? 0 : null),
    alterou: comparavel ? variacaoDaCarteira(predictedRecords, previousById) : null,
    comparavel,
  } satisfies ForecastBridge
  /*
   * Entre competências diferentes, o movimento não existe — só os totais de
   * cada mês. Devolver `entered`/`exited` mesmo assim deixava a tabela listar
   * entradas e saídas que o cartão já marcava como indisponíveis. Ganhou e
   * Perdeu continuam: são desfecho da carga atual, não comparação.
   */
  const movimentoComparavel = comparavel
  return {
    period: { start, end }, predicted: movement(predictedRecords), realized: movementForClosed(realizedRecords), projected,
    open: predictedValue, missing: predictedValue, probabilityAvailable,
    notice: probabilityAvailable ? null : FORECAST_PROBABILITY_NOTICE,
    entered: movimentoComparavel && entered ? movement(entered) : null,
    exited: movimentoComparavel && exited ? movement(exited) : null,
    postponed: movimentoComparavel && postponed ? movement(postponed) : null,
    otherExited: movimentoComparavel && otherExited ? movement(otherExited) : null,
    won: movementForClosed(won), lost: movementForClosed(lost), bridge,
  }
}
