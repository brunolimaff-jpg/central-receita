import type { ImportedRecord } from './manual-import'

/**
 * Modelo de New Name (docs/PLANO-VISAO-EXECUTIVA.md §New Name e docs/REGRAS-NEGOCIO.md §New Name).
 *
 * Funções puras sobre pedidos (`ImportedRecord[]`) e oportunidades (`ImportedRecord[]`).
 * Nenhum estado global ou data implícita: a data de referência é sempre parâmetro (`YYYY-MM-DD`).
 *
 * Regras principais:
 * 1. Pedidos com classificação "Novo" no mês corrente e na semana (seg–dom da data de referência).
 * 2. Contas distintas: contagem de contas únicas (`accountId`).
 * 3. Substatus do pedido: mapeado a partir de status (integrado, em conferência, conferido,
 *    devolvido, cancelado). Recebe de-para com default documentado. Qualquer status desconhecido
 *    fica "Não classificado", nunca é encaixado à força.
 * 4. Realizado oficial: somente pedidos conferidos no período contam como realizado oficial.
 *    Integrados, em conferência, devolvidos e cancelados não somam.
 * 5. Entrou / Saiu: comparado por `orderId` contra a carga anterior. Retorna `null` se não houver
 *    carga anterior ("A comparação começa na próxima importação").
 * 6. Perdidas / Postergadas: derivadas das oportunidades New Name quando fornecidas.
 * 7. "Novo a validar": separado do total principal se houver sinal disponível na classificação
 *    (ex.: "Novo a validar" ou termos contendo "validar"). Se a planilha contiver apenas "Novo",
 *    todos os pedidos entram no total principal e "Novo a validar" fica com 0 registros, aguardando
 *    validação com a operação (Fabi).
 */

export type OrderSubstatus =
  | 'integrado'
  | 'em conferência'
  | 'conferido'
  | 'devolvido'
  | 'cancelado'
  | 'Não classificado'

export type NewNamePeriod = 'semana' | 'mês'

export type NewNameClassification = 'confirmado' | 'pela_fonte' | 'a_validar' | 'outro'

/**
 * De-para padrão para os substatus de pedido.
 *
 * Os nomes reais ainda serão validados com a operação (Fabi, REGRAS-NEGOCIO §Decisões em aberto).
 * Status que não casarem com este de-para ou de-para customizado recebem "Não classificado".
 */
export const DEFAULT_STATUS_MAPPING: Record<string, OrderSubstatus> = {
  INTEGRADO: 'integrado',
  'INTEGRADO COM ERP': 'integrado',
  'EM CONFERENCIA': 'em conferência',
  'EM CONFERÊNCIA': 'em conferência',
  'AGUARDANDO CONFERENCIA': 'em conferência',
  'AGUARDANDO CONFERÊNCIA': 'em conferência',
  CONFERIDO: 'conferido',
  DEVOLVIDO: 'devolvido',
  CANCELADO: 'cancelado',
}

const normalize = (value: string | null | undefined): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()

/**
 * Resolve o substatus do pedido a partir do status bruto.
 * Se o status não for reconhecido, devolve "Não classificado" (nunca força encaixe).
 */
export function resolveOrderSubstatus(
  rawStatus: string | null | undefined,
  mapping: Record<string, OrderSubstatus> | ((status: string) => OrderSubstatus) = DEFAULT_STATUS_MAPPING
): OrderSubstatus {
  if (!rawStatus || !rawStatus.trim()) return 'Não classificado'
  if (typeof mapping === 'function') {
    return mapping(rawStatus) ?? 'Não classificado'
  }
  const exact = mapping[rawStatus]
  if (exact) return exact
  const norm = normalize(rawStatus)
  const byNorm = mapping[norm]
  if (byNorm) return byNorm

  // Prefixos/substrings padrão quando usando o mapa default
  if (mapping === DEFAULT_STATUS_MAPPING) {
    if (norm.startsWith('INTEGRADO')) return 'integrado'
    if (norm.includes('CONFERENCIA') || norm.includes('AGUARDANDO CONFERENCIA')) return 'em conferência'
    if (norm.startsWith('CONFERIDO')) return 'conferido'
    if (norm.startsWith('DEVOLVIDO')) return 'devolvido'
    if (norm.startsWith('CANCELADO')) return 'cancelado'
  }

  return 'Não classificado'
}

/**
 * Classifica pedidos/oportunidades entre "confirmado", "pela_fonte", "a_validar" ou "outro".
 * "NOVO" puro vem só da exportação, sem confirmação institucional: fica "pela fonte".
 * Só "NOVO CONFIRMADO" (ou "NEW NAME", sinal de confirmação) é "confirmado".
 * Se o sinal "validar" estiver presente, separa do total principal.
 */
export function classifyNewName(rawClassification: string | null | undefined): NewNameClassification {
  if (!rawClassification) return 'outro'
  const norm = normalize(rawClassification)
  if (norm.includes('VALIDAR')) return 'a_validar'
  if (norm === 'NOVO CONFIRMADO' || norm === 'NEW NAME') return 'confirmado'
  if (norm === 'NOVO' || norm.startsWith('NOVO')) return 'pela_fonte'
  return 'outro'
}

export function isNewNameOpportunity(record: ImportedRecord): boolean {
  if (!record.classification) return false
  const norm = normalize(record.classification)
  return norm.includes('NOVO') || norm.includes('NEW NAME') || /NN/.test(norm)
}

const iso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const inRange = (date: string | null, start: string, end: string): boolean =>
  Boolean(date && date >= start && date <= end)

/**
 * Soma valores propagando `null` se qualquer registro tiver valor ausente (regra sumKnown).
 * Evita zero silencioso quando há valores desconhecidos na fonte.
 */
export const sumKnown = (
  records: ImportedRecord[],
  accessor: (record: ImportedRecord) => number | null = r => r.maintenance
): number | null =>
  records.some(r => accessor(r) === null)
    ? null
    : records.reduce((sum, r) => sum + (accessor(r) ?? 0), 0)

/**
 * Retorna o intervalo do período selecionado (mês corrente ou semana seg–dom).
 * A semana é limitada à fronteira do mês corrente para preservar o escopo do mês da Central de Receita.
 */
export function getNewNamePeriodRange(referenceDate: string, period: NewNamePeriod): { start: string; end: string } {
  const month = referenceDate.slice(0, 7)
  const monthStart = `${month}-01`
  const monthEnd = iso(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0))
  if (period === 'mês') {
    return { start: monthStart, end: monthEnd }
  }

  const anchor = new Date(`${referenceDate}T12:00:00Z`)
  const day = anchor.getUTCDay()
  anchor.setUTCDate(anchor.getUTCDate() - (day === 0 ? 6 : day - 1))
  let start = iso(anchor)
  anchor.setUTCDate(anchor.getUTCDate() + 6)
  let end = iso(anchor)

  if (start < monthStart) start = monthStart
  if (end > monthEnd) end = monthEnd

  return { start, end }
}

export type NewNameOrder = {
  orderId: string
  opportunityId: string
  accountId: string
  account: string
  stage: string
  status: string
  substatus: OrderSubstatus
  classification: string
  date: string | null
  closingDate: string | null
  conferenceDate: string | null
  maintenance: number | null
  product: string
  isToValidate: boolean
  records: ImportedRecord[]
}

export type NewNameListItem = {
  id: string
  orderId: string
  opportunityId?: string
  accountId: string
  account: string
  product: string
  substatus: string
  date: string | null
  value: number | null
  kind: 'order' | 'lost' | 'postponed'
}

export type NewNameMovement = {
  count: number
  value: number | null
  items: NewNameListItem[]
}

export type NewNameIndicators = {
  newAccounts: number
  orders: number
  maintenanceTotal: number | null
  realizedValue: number | null
  realizedCount: number
  realizedAccounts: number
  toValidateCount: number
  toValidateValue: number | null
  toValidateAccounts: number
  /** Pedidos do período classificados só pela fonte ("NOVO"), sem confirmação institucional. */
  sourceOnlyCount: number
  /** Pedidos do período sem classificação na fonte; ficam fora do New Name. */
  unclassifiedOrders: number
}

export type NewNameModelResult = {
  period: { start: string; end: string; type: NewNamePeriod }
  referenceDate: string
  indicators: NewNameIndicators
  orders: NewNameOrder[]
  toValidateOrders: NewNameOrder[]
  movements: {
    entered: NewNameMovement | null
    exited: NewNameMovement | null
    won: NewNameMovement
    lost: NewNameMovement
    postponed: NewNameMovement | null
  }
  allListItems: NewNameListItem[]
  /** Mesmo valor de indicators.unclassifiedOrders. */
  unclassifiedOrders: number
}

export type CalculateNewNameOptions = {
  orders: ImportedRecord[]
  referenceDate: string
  period?: NewNamePeriod
  opportunities?: ImportedRecord[] | null
  previousOrders?: ImportedRecord[] | null
  previousOpportunities?: ImportedRecord[] | null
  statusMapping?: Record<string, OrderSubstatus> | ((status: string) => OrderSubstatus)
}

function orderToListItem(order: NewNameOrder): NewNameListItem {
  return {
    id: order.orderId,
    orderId: order.orderId,
    opportunityId: order.opportunityId,
    accountId: order.accountId,
    account: order.account || `Conta ${order.accountId}`,
    product: order.product || '—',
    substatus: order.substatus,
    date: order.date,
    value: order.maintenance,
    kind: 'order',
  }
}

function oppToListItem(kind: 'lost' | 'postponed') {
  return (opp: ImportedRecord): NewNameListItem => ({
    id: opp.opportunityId,
    orderId: opp.orderId || opp.opportunityId,
    opportunityId: opp.opportunityId,
    accountId: opp.accountId,
    account: opp.account || `Conta ${opp.accountId}`,
    product: opp.product || opp.module || (kind === 'lost' ? 'Oportunidade perdida' : 'Oportunidade postergada'),
    substatus: kind === 'lost' ? 'Perdida' : 'Postergada',
    date: kind === 'lost' ? opp.closingDate : opp.forecastDate,
    value: kind === 'lost' ? (opp.closedValue ?? opp.predictedValue) : opp.predictedValue,
    kind,
  })
}

function groupRecordsByOrder(
  records: ImportedRecord[],
  statusMapping: Record<string, OrderSubstatus> | ((status: string) => OrderSubstatus)
): NewNameOrder[] {
  const map = new Map<string, ImportedRecord[]>()
  for (const record of records) {
    const key = record.orderId || record.opportunityId || String(record.row)
    const existing = map.get(key)
    if (existing) existing.push(record)
    else map.set(key, [record])
  }

  const result: NewNameOrder[] = []
  for (const [orderId, items] of map.entries()) {
    const first = items[0]
    const closingDate = items.find(i => Boolean(i.closingDate))?.closingDate ?? null
    const conferenceDate = items.find(i => Boolean(i.conferenceDate))?.conferenceDate ?? null

    /*
     * A exportação do CRM mede o mês pela conferência, não pelo fechamento:
     * na carga real, 31% das linhas têm fechamento fora de outubro e conferência
     * em outubro. Usar o fechamento jogava esses pedidos para o mês errado e
     * zerava o New Name. A conferência vem primeiro; o fechamento é o fallback
     * quando o pedido ainda não foi conferido.
     */
    const date = conferenceDate ?? closingDate

    /*
     * Sinais de conferência: neste CRM a coluna DATA CONFERENCIA preenchida é o
     * sinal, não o texto do status (a carga real só traz "Integrado com ERP").
     * Devolvido e cancelado mantêm o próprio estado, que exclui o pedido do
     * realizado. A decisão final continua com a Fabi (REGRAS-NEGOCIO §abertas).
     */
    const bruto = resolveOrderSubstatus(first.status, statusMapping)
    const substatus: OrderSubstatus = conferenceDate && bruto !== 'devolvido' && bruto !== 'cancelado'
      ? 'conferido'
      : bruto

    const classificationType = classifyNewName(first.classification)

    const products = [...new Set(items.map(i => i.product).filter(Boolean))].join(', ') || first.product || ''
    const hasNullMaintenance = items.some(i => i.maintenance === null)
    const maintenance = hasNullMaintenance ? null : items.reduce((sum, i) => sum + (i.maintenance ?? 0), 0)

    result.push({
      orderId,
      opportunityId: first.opportunityId,
      accountId: first.accountId,
      account: first.account || first.accountId,
      stage: first.stage,
      status: first.status,
      substatus,
      classification: first.classification,
      date,
      closingDate,
      conferenceDate,
      maintenance,
      product: products,
      isToValidate: classificationType === 'a_validar',
      records: items,
    })
  }

  return result
}

function filterOrdersForPeriod(
  orders: NewNameOrder[],
  start: string,
  end: string
): { confirmed: NewNameOrder[]; toValidate: NewNameOrder[] } {
  const confirmed: NewNameOrder[] = []
  const toValidate: NewNameOrder[] = []

  for (const order of orders) {
    const classificationType = classifyNewName(order.classification)
    if (classificationType === 'outro') continue

    // `order.date` já é conferência (com fechamento como fallback), então a
    // regra de período é uma só para todo pedido.
    const inPeriod = inRange(order.date, start, end)

    if (!inPeriod) continue

    if (classificationType === 'a_validar') {
      toValidate.push(order)
    } else {
      confirmed.push(order)
    }
  }

  return { confirmed, toValidate }
}

/**
 * Calcula o modelo New Name completo para o período.
 * Pode ser chamado como objeto de opções ou como `(orders, referenceDate, options)`.
 */
export function calculateNewNameModel(
  optionsOrOrders: CalculateNewNameOptions | ImportedRecord[],
  maybeReferenceDate?: string,
  maybeOptions: Omit<CalculateNewNameOptions, 'orders' | 'referenceDate'> = {}
): NewNameModelResult {
  const options: CalculateNewNameOptions = Array.isArray(optionsOrOrders)
    ? {
        orders: optionsOrOrders,
        referenceDate: maybeReferenceDate ?? '',
        ...maybeOptions,
      }
    : optionsOrOrders

  const {
    orders: rawOrders,
    referenceDate,
    period = 'mês',
    opportunities = null,
    previousOrders = null,
    previousOpportunities = null,
    statusMapping = DEFAULT_STATUS_MAPPING,
  } = options

  const safeRefDate = referenceDate || '1970-01-01'
  const { start, end } = getNewNamePeriodRange(safeRefDate, period)

  const groupedCurrent = groupRecordsByOrder(rawOrders, statusMapping)
  const { confirmed: currentOrders, toValidate: currentToValidate } = filterOrdersForPeriod(
    groupedCurrent,
    start,
    end
  )

  const distinctAccounts = new Set(currentOrders.map(o => o.accountId).filter(Boolean)).size
  const unclassifiedOrders = groupedCurrent.filter(o => !o.classification.trim() && inRange(o.date, start, end)).length
  const sourceOnlyCount = currentOrders.filter(o => classifyNewName(o.classification) === 'pela_fonte').length
  const ordersCount = currentOrders.length

  const maintenanceTotal = currentOrders.some(o => o.maintenance === null)
    ? null
    : currentOrders.reduce((sum, o) => sum + (o.maintenance ?? 0), 0)

  // Realizado oficial: somente pedidos conferidos no período
  const realizedOrders = currentOrders.filter(o => o.substatus === 'conferido')
  const realizedCount = realizedOrders.length
  const realizedAccounts = new Set(realizedOrders.map(o => o.accountId).filter(Boolean)).size
  const realizedValue = realizedOrders.some(o => o.maintenance === null)
    ? null
    : realizedOrders.reduce((sum, o) => sum + (o.maintenance ?? 0), 0)

  // Grupo "Novo a validar": mantido separado do total principal
  const toValidateCount = currentToValidate.length
  const toValidateAccounts = new Set(currentToValidate.map(o => o.accountId).filter(Boolean)).size
  const toValidateValue = currentToValidate.some(o => o.maintenance === null)
    ? null
    : currentToValidate.reduce((sum, o) => sum + (o.maintenance ?? 0), 0)

  // Movimentos de pedidos
  const wonOrders = currentOrders.filter(o => o.substatus !== 'cancelado')
  const wonValue = wonOrders.some(o => o.maintenance === null)
    ? null
    : wonOrders.reduce((sum, o) => sum + (o.maintenance ?? 0), 0)
  const won: NewNameMovement = {
    count: wonOrders.length,
    value: wonValue,
    items: wonOrders.map(orderToListItem),
  }

  // Entrou / Saiu por orderId contra carga anterior (null se não houver carga anterior)
  let entered: NewNameMovement | null = null
  let exited: NewNameMovement | null = null

  if (previousOrders !== null && previousOrders !== undefined) {
    const groupedPrev = groupRecordsByOrder(previousOrders, statusMapping)
    const { confirmed: prevOrders } = filterOrdersForPeriod(groupedPrev, start, end)

    const prevMap = new Map(prevOrders.map(o => [o.orderId, o]))
    const currentMap = new Map(currentOrders.map(o => [o.orderId, o]))

    const enteredList = currentOrders.filter(o => !prevMap.has(o.orderId))
    const enteredVal = enteredList.some(o => o.maintenance === null)
      ? null
      : enteredList.reduce((sum, o) => sum + (o.maintenance ?? 0), 0)
    entered = {
      count: enteredList.length,
      value: enteredVal,
      items: enteredList.map(orderToListItem),
    }

    const exitedList = prevOrders.filter(o => !currentMap.has(o.orderId))
    const exitedVal = exitedList.some(o => o.maintenance === null)
      ? null
      : exitedList.reduce((sum, o) => sum + (o.maintenance ?? 0), 0)
    exited = {
      count: exitedList.length,
      value: exitedVal,
      items: exitedList.map(orderToListItem),
    }
  }

  // Perdidas / Postergadas a partir de oportunidades New Name
  let lost: NewNameMovement = { count: 0, value: opportunities ? 0 : null, items: [] }
  let postponed: NewNameMovement | null = null

  if (opportunities && opportunities.length > 0) {
    const isLostStage = (stage: string) => normalize(stage).includes('PERDIDA')
    const lostOpps = opportunities.filter(
      opp => isNewNameOpportunity(opp) && isLostStage(opp.stage) && inRange(opp.closingDate, start, end)
    )
    const lostVal = lostOpps.some(o => (o.closedValue ?? o.predictedValue) === null)
      ? null
      : lostOpps.reduce((sum, o) => sum + ((o.closedValue ?? o.predictedValue) ?? 0), 0)

    lost = {
      count: lostOpps.length,
      value: lostVal,
      items: lostOpps.map(oppToListItem('lost')),
    }
  }

  if (previousOpportunities !== null && previousOpportunities !== undefined) {
    const isOpenForecast = (stage: string) => {
      const norm = normalize(stage)
      return norm.startsWith('PROPOSTA') || norm.startsWith('NEGOCIACAO')
    }
    const prevOpen = previousOpportunities.filter(
      o => isNewNameOpportunity(o) && isOpenForecast(o.stage) && inRange(o.forecastDate, start, end)
    )
    const currentOppMap = new Map((opportunities ?? []).map(o => [o.opportunityId, o]))

    const postponedOpps = prevOpen.filter(prevOpp => {
      const current = currentOppMap.get(prevOpp.opportunityId)
      return Boolean(current && current.forecastDate && current.forecastDate > end)
    })

    const postponedVal = postponedOpps.some(o => o.predictedValue === null)
      ? null
      : postponedOpps.reduce((sum, o) => sum + (o.predictedValue ?? 0), 0)

    postponed = {
      count: postponedOpps.length,
      value: postponedVal,
      items: postponedOpps.map(oppToListItem('postponed')),
    }
  }

  const allListItems = currentOrders.map(orderToListItem)

  return {
    period: { start, end, type: period },
    referenceDate: safeRefDate,
    indicators: {
      newAccounts: distinctAccounts,
      orders: ordersCount,
      maintenanceTotal,
      realizedValue,
      realizedCount,
      realizedAccounts,
      toValidateCount,
      toValidateValue,
      toValidateAccounts,
      sourceOnlyCount,
      unclassifiedOrders,
    },
    orders: currentOrders,
    toValidateOrders: currentToValidate,
    movements: {
      entered,
      exited,
      won,
      lost,
      postponed,
    },
    unclassifiedOrders,
    allListItems,
  }
}

export function selectNewNameListItems(
  result: NewNameModelResult,
  filter: 'todos' | 'ganhou' | 'entrou' | 'saiu' | 'perdeu' | 'postergou'
): NewNameListItem[] {
  switch (filter) {
    case 'ganhou':
      return result.movements.won.items
    case 'entrou':
      return result.movements.entered?.items ?? []
    case 'saiu':
      return result.movements.exited?.items ?? []
    case 'perdeu':
      return result.movements.lost.items
    case 'postergou':
      return result.movements.postponed?.items ?? []
    case 'todos':
    default:
      return result.allListItems
  }
}
