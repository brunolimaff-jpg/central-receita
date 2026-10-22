import type { ImportedRecord } from './manual-import'
import type { ForecastMonthResult } from './forecast-month'
import type { NewNameModelResult } from './new-name-model'

/**
 * Linhas de movimento das seções da página corrida (Forecast, Oportunidades, New Name).
 *
 * Funções puras: cada seção chama a função com a carga atual e a anterior e recebe as linhas
 * que alimentam os cartões, o anel de impacto e a tabela. Nenhum número nasce aqui além de
 * somas e diferenças dos registros da carga (docs/REGRAS-NEGOCIO.md).
 *
 * Δ valor: impacto sinalizado no recorte da seção.
 * - Forecast e New Name: Entrou +valor; Saiu, Postergou e Perdeu −valor anterior; Ganhou +valor fechado.
 * - Oportunidades (carteira aberta): Entrou +valor; Saiu −valor anterior; Alterou valor e
 *   Postergou mostram a variação de valor (atual − anterior), sem contar a data como impacto.
 */

export type MovementLabel = 'Entrou' | 'Saiu' | 'Postergou' | 'Alterou valor' | 'Ganhou' | 'Perdeu'

export type MovementRow = {
  key: string
  account: string
  branch: string
  movement: MovementLabel
  /** Impacto sinalizado; `null` quando o valor não foi informado na carga. */
  delta: number | null
  /** Valor atual, ou o anterior quando a oportunidade saiu. */
  value: number | null
  /** Previsão (ou efetivação) atual, ou a anterior quando não há atual. */
  date: string | null
  previousDate: string | null
  previousValue: number | null
  stage: string
  opportunityId: string
  executive: string
}

export type MovementCardGroup = {
  key: string
  count: number
  /** Soma sinalizada do grupo; `null` se algum registro do grupo não tem valor. */
  value: number | null
  /** Peso absoluto (soma de |Δ|) usado no anel de impacto. */
  weight: number
  net: number
}

const sumSigned = (rows: MovementRow[]): number | null =>
  rows.some(row => row.delta === null) ? null : rows.reduce((sum, row) => sum + (row.delta ?? 0), 0)

/** Agrupa linhas em cartões. Cada cartão junta um ou mais rótulos (ex.: Saiu + Postergou). */
export function groupMovements(
  rows: MovementRow[],
  cards: ReadonlyArray<{ key: string; labels: readonly MovementLabel[] }>,
): MovementCardGroup[] {
  return cards.map(card => {
    const group = rows.filter(row => card.labels.includes(row.movement))
    const net = group.reduce((sum, row) => sum + (row.delta ?? 0), 0)
    return {
      key: card.key,
      count: group.length,
      value: sumSigned(group),
      weight: group.reduce((sum, row) => sum + Math.abs(row.delta ?? 0), 0),
      net,
    }
  })
}

/** Ordena por maior impacto absoluto; linhas sem valor vão para o fim. */
export function sortByImpact(rows: MovementRow[]): MovementRow[] {
  return [...rows].sort((a, b) => {
    if (a.delta === null) return b.delta === null ? 0 : 1
    if (b.delta === null) return -1
    return Math.abs(b.delta) - Math.abs(a.delta)
  })
}

const byId = (records: ImportedRecord[]) => new Map(records.map(record => [record.opportunityId, record]))

/** Forecast do mês: Entrou, Saiu (com Postergou), Ganhou e Perdeu, a partir do cálculo `calculateForecastMonth`. */
export function forecastMovementRows(result: ForecastMonthResult, current: ImportedRecord[]): MovementRow[] {
  const now = byId(current)
  const postponedIds = new Set(result.postponed?.records.map(record => record.opportunityId) ?? [])
  const rows: MovementRow[] = []
  for (const record of result.entered?.records ?? []) {
    rows.push(rowFrom(record, 'Entrou', record.predictedValue, +1, record.forecastDate, null, null))
  }
  for (const before of result.exited?.records ?? []) {
    const after = now.get(before.opportunityId)
    /*
     * Quem fechou continua em Saiu: deixou o previsto aberto, e é isso que a
     * regra chama de saída (REGRAS-NEGOCIO §movimentos). O desfecho aparece em
     * Ganhou/Perdeu como classificação, não como uma segunda parcela do saldo —
     * o saldo vem da ponte, Entrou + Saiu + Alterou. Antes esta linha era
     * descartada, e a tela mostrava "Saiu R$ 0" ao lado de uma ponte com saída.
     */
    rows.push(rowFrom(
      after ?? before,
      postponedIds.has(before.opportunityId) ? 'Postergou' : 'Saiu',
      before.predictedValue,
      -1,
      after?.forecastDate ?? before.forecastDate,
      before.forecastDate,
      before.predictedValue,
    ))
  }
  for (const record of result.won.records) rows.push(rowFrom(record, 'Ganhou', record.closedValue, +1, record.closingDate, null, null))
  for (const record of result.lost.records) rows.push(rowFrom(record, 'Perdeu', record.closedValue, -1, record.closingDate, null, null))
  return sortByImpact(rows)
}

/**
 * Carteira aberta: Entrou, Saiu, Postergou (muda a data) e Alterou valor (muda o valor previsto).
 * `isOpen` decide se a etapa está aberta (quem chama passa `isOpenStage` de pipeline-model).
 * Retorna `null` sem carga anterior: a comparação começa na próxima importação.
 */
export function pipelineMovementRows(
  current: ImportedRecord[],
  previous: ImportedRecord[] | null,
  isOpen: (stage: string) => boolean,
): MovementRow[] | null {
  if (previous === null) return null
  const open = (records: ImportedRecord[]) => new Map(records.filter(record => isOpen(record.stage)).map(record => [record.opportunityId, record]))
  const nowOpen = open(current)
  const beforeOpen = open(previous)
  const rows: MovementRow[] = []
  for (const [id, before] of beforeOpen) {
    if (nowOpen.has(id)) continue
    rows.push(rowFrom(before, 'Saiu', before.predictedValue, -1, before.forecastDate, before.forecastDate, before.predictedValue))
  }
  for (const [id, record] of nowOpen) {
    const before = beforeOpen.get(id)
    if (!before) {
      rows.push(rowFrom(record, 'Entrou', record.predictedValue, +1, record.forecastDate, null, null))
      continue
    }
    if (before.forecastDate && record.forecastDate && record.forecastDate > before.forecastDate) {
      rows.push(rowFrom(record, 'Postergou', { value: record.predictedValue, delta: variation(record, before), date: record.forecastDate, previousDate: before.forecastDate, previousValue: before.predictedValue }))
      continue
    }
    if (before.predictedValue !== record.predictedValue) {
      rows.push(rowFrom(record, 'Alterou valor', { value: record.predictedValue, delta: variation(record, before), date: record.forecastDate, previousDate: before.forecastDate, previousValue: before.predictedValue }))
    }
  }
  return sortByImpact(rows)
}

/** Variação de valor entre a carga anterior e a atual; `null` se algum dos dois não tem valor. */
function variation(record: ImportedRecord, before: ImportedRecord): number | null {
  if (record.predictedValue === null || before.predictedValue === null) return null
  return record.predictedValue - before.predictedValue
}

/** New Name: Entrou, Saiu, Ganhou, Perdeu e Postergou a partir do modelo; filial vem da carga de pedidos. */
export function newNameMovementRows(model: NewNameModelResult, orders: ImportedRecord[]): MovementRow[] {
  const branchByKey = new Map<string, string>()
  for (const order of orders) {
    for (const key of [order.orderId, order.opportunityId]) {
      if (key && !branchByKey.has(key)) branchByKey.set(key, order.representative)
    }
  }
  const rowsOf = (items: Array<{ id: string; orderId: string; opportunityId?: string; account: string; product: string; date: string | null; value: number | null; substatus: string }> | undefined, movement: MovementLabel, sign: 1 | -1) =>
    (items ?? []).map(item => ({
      key: `${movement}-${item.id}`,
      account: item.account,
      branch: branchByKey.get(item.orderId) ?? branchByKey.get(item.opportunityId ?? '') ?? '—',
      movement,
      delta: item.value === null ? null : sign * item.value,
      value: item.value,
      date: item.date,
      previousDate: null,
      previousValue: null,
      stage: item.substatus,
      opportunityId: item.opportunityId ?? '',
      executive: '—',
    }))
  const { movements } = model
  return sortByImpact([
    ...rowsOf(movements.entered?.items, 'Entrou', 1),
    ...rowsOf(movements.exited?.items, 'Saiu', -1),
    ...rowsOf(movements.postponed?.items, 'Postergou', -1),
    ...rowsOf(movements.won.items, 'Ganhou', 1),
    ...rowsOf(movements.lost.items, 'Perdeu', -1),
  ])
}

type RowFields = { value: number | null; delta: number | null; date: string | null; previousDate: string | null; previousValue: number | null }

/**
 * Linha de movimento a partir de um registro. Para Entrou, Saiu, Ganhou e Perdeu o Δ é o
 * próprio valor com sinal; Postergou e Alterou valor passam o Δ de variação explicitamente.
 */
function rowFrom(record: ImportedRecord, movement: MovementLabel, fields: RowFields | number | null, sign?: 1 | -1, date?: string | null, previousDate: string | null = null, previousValue: number | null = null): MovementRow {
  const resolved: RowFields = typeof fields === 'object' && fields !== null
    ? fields
    : { value: fields, delta: fields === null || sign === undefined ? null : sign * fields, date: date ?? null, previousDate, previousValue }
  return {
    key: `${movement}-${record.opportunityId}-${record.row}`,
    account: record.account || record.accountId || 'Conta indisponível',
    branch: record.representative || '—',
    movement,
    delta: resolved.delta,
    value: resolved.value,
    date: resolved.date,
    previousDate: resolved.previousDate,
    previousValue: resolved.previousValue,
    stage: record.stage || 'Etapa indisponível',
    opportunityId: record.opportunityId,
    executive: record.executive || '—',
  }
}
