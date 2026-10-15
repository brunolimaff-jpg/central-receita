export type ImportKind = 'opportunities' | 'orders'
type Cell = unknown
export type ImportIssue = { severity: 'error' | 'warning'; code: string; row?: number; field?: string; message: string }
export type ImportedRecord = {
  row: number; opportunityId: string; orderId: string; accountId: string; account: string
  stage: string; status: string; classification: string; representative: string; executive: string
  ownerGroup: string; forecastDate: string | null; closingDate: string | null; conferenceDate: string | null
  predictedValue: number | null; closedValue: number | null; maintenance: number | null
  product: string; module: string; modality: string
}
export type ImportBatch = {
  kind: ImportKind; records: ImportedRecord[]; issues: ImportIssue[]; errorCount: number; warningCount: number
  stats: { records: number; opportunities: number; orders: number; accounts: number; integratedOrders: number; sourceNewOrders: number }
  filename?: string; hash?: string; sheet?: string; importedAt?: string; savedAt?: string; referenceDate?: string
}
export type ImportWorkspace = { opportunities: ImportBatch | null; orders: ImportBatch | null }

const fields = {
  opportunities: {
    opportunityId: 'Oportunidade ID', accountId: 'Conta ID', account: 'Conta', stage: 'Etapa',
    forecastDate: 'Previsão de Fechamento', closingDate: 'Efetivação do Fechamento',
    predictedValue: 'Valor Previsto', closedValue: 'Valor Fechado', representative: 'Representante',
    executive: 'Responsável', orderId: 'Pedido', classification: 'CLASSIFICACAO DA CONTA', ownerGroup: 'Criado pelo grupo',
  },
  orders: {
    orderId: 'NUMERO PEDIDO', opportunityId: 'ID OPORTUNIDADE', accountId: 'ID CONTA', account: 'NOME FANTASIA CONTA',
    stage: 'ETAPA OPORTUNIDADE', status: 'STATUS OPORTUNIDADE', classification: 'CLASSIFICACAO DO PEDIDO',
    closingDate: 'DATA FECHAMENTO', conferenceDate: 'DATA CONFERENCIA', representative: 'UNIDADE NEGOCIO OPORTUNIDADE',
    executive: 'PROPRIETARIO OPORTUNIDADE', ownerGroup: 'GRUPO PROPRIETARIO', product: 'PRODUTO', module: 'PRODUTO - MODULO',
    modality: 'PRODUTO - MODALIDADE', maintenance: 'PRODUTO - VALOR MANUTENCAO',
  },
} as const

const normalize = (value: Cell) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toUpperCase()
const text = (value: Cell) => String(value ?? '').trim()

export const currentImportDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

export function isValidImportReference(value: string, latestDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > latestDate) return false
  const date = new Date(value + 'T12:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function isDuplicateImport(next: Pick<ImportBatch, 'hash' | 'referenceDate'>, previous?: Pick<ImportBatch, 'hash' | 'referenceDate'> | null): boolean {
  return Boolean(next.hash && next.hash === previous?.hash && next.referenceDate === previous.referenceDate)
}

export function normalizeImport(kind: ImportKind, rows: Cell[][]): ImportBatch {
  const result: ImportBatch = { kind, records: [], issues: [], errorCount: 0, warningCount: 0,
    stats: { records: 0, opportunities: 0, orders: 0, accounts: 0, integratedOrders: 0, sourceNewOrders: 0 } }
  const issue = (severity: ImportIssue['severity'], code: string, message: string, row?: number, field?: string) => {
    if (severity === 'error') result.errorCount++; else result.warningCount++
    if (result.issues.length < 50) result.issues.push({ severity, code, message, row, field })
  }
  const tooWideRow = rows.findIndex(row => row.length > 100)
  if (rows.length < 2 || rows.length > 50001 || tooWideRow >= 0) {
    issue('error', 'size', 'Use um arquivo com cabeçalho e até 50.000 linhas de dados e 100 colunas.', tooWideRow >= 0 ? tooWideRow + 1 : undefined)
    return result
  }
  const headers = rows[0].map(normalize)
  const mapping: Record<string, string> = fields[kind]
  const required = kind === 'orders'
    ? ['orderId', 'opportunityId', 'accountId', 'account', 'status', 'classification', 'closingDate', 'maintenance', 'representative']
    : ['opportunityId', 'accountId', 'account', 'stage', 'forecastDate', 'predictedValue', 'closedValue', 'representative']
  for (const key of required) {
    if (!headers.includes(normalize(mapping[key]))) issue('error', 'missing-column', 'Coluna obrigatória ausente.', 1, mapping[key])
  }
  for (const field of Object.values(mapping)) {
    if (headers.filter(header => header === normalize(field)).length > 1) issue('error', 'duplicate-column', 'Cabeçalho duplicado.', 1, field)
  }
  if (result.errorCount) return result
  const positions = Object.fromEntries(Object.entries(mapping).map(([key, field]) => [key, headers.indexOf(normalize(field))]))
  const opportunities = new Set<string>()
  const orderAccounts = new Map<string, string>()
  rows.slice(1).forEach((values, index) => {
    if (values.every(value => value === null || value === undefined || text(value) === '')) return
    const row = index + 2
    const get = (key: string): Cell => positions[key] === undefined || positions[key] < 0 ? null : values[positions[key]]
    const date = (key: string): string | null => {
      const raw = get(key)
      if (raw === null || raw === undefined || raw === '') return null
      let iso = raw instanceof Date && Number.isFinite(raw.getTime()) ? raw.toISOString().slice(0, 10) : ''
      const str = text(raw)
      if (!iso && /^\d{4}-\d{2}-\d{2}$/.test(str)) iso = str
      const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str)
      if (!iso && br) iso = `${br[3]}-${br[2]}-${br[1]}`
      const parsed = new Date(iso + 'T12:00:00Z')
      if (!iso || Number(iso.slice(0, 4)) < 1900 || Number(iso.slice(0, 4)) > 2100 || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) {
        issue('warning', 'invalid-date', 'Data inválida ou especial; ficou indisponível na leitura.', row, mapping[key])
        return null
      }
      return iso
    }
    const number = (key: string): number | null => {
      const raw = get(key)
      if (raw === null || raw === undefined || raw === '') return null
      let value: number = NaN
      if (typeof raw === 'number') value = raw
      if (typeof raw === 'string') {
        const str = raw.trim()
        if (/^-?\d+(\.\d+)?$/.test(str)) value = Number(str)
        else if (/^-?(\d{1,3}(\.\d{3})*|\d+),\d{1,2}$/.test(str)) value = Number(str.replaceAll('.', '').replace(',', '.'))
      }
      if (!Number.isFinite(value)) issue('warning', 'invalid-number', 'Valor não numérico; ficou indisponível na leitura.', row, mapping[key])
      return Number.isFinite(value) ? value : null
    }
    const record: ImportedRecord = {
      row, opportunityId: text(get('opportunityId')), orderId: text(get('orderId')), accountId: text(get('accountId')),
      account: text(get('account')), stage: text(get('stage')), status: text(get('status')), classification: text(get('classification')),
      representative: text(get('representative')), executive: text(get('executive')), ownerGroup: text(get('ownerGroup')),
      forecastDate: date('forecastDate'), closingDate: date('closingDate'), conferenceDate: date('conferenceDate'),
      predictedValue: number('predictedValue'), closedValue: number('closedValue'), maintenance: number('maintenance'),
      product: text(get('product')), module: text(get('module')), modality: text(get('modality')),
    }
    for (const key of kind === 'orders' ? ['opportunityId', 'orderId', 'accountId'] as const : ['opportunityId', 'accountId'] as const) {
      if (!/^\d+$/.test(record[key]) || /^0+$/.test(record[key])) issue('error', 'invalid-id', 'Identificador ausente ou inválido.', row, mapping[key])
    }
    if (kind === 'opportunities' && opportunities.has(record.opportunityId)) issue('error', 'duplicate-id', 'ID de oportunidade repetido; revise a exportação.', row, mapping.opportunityId)
    if (kind === 'opportunities' && !record.stage) issue('warning', 'missing-stage', 'Etapa ausente; a oportunidade não entra na carteira aberta do mês.', row, mapping.stage)
    opportunities.add(record.opportunityId)
    if (record.orderId && orderAccounts.has(record.orderId) && orderAccounts.get(record.orderId) !== record.accountId) {
      issue('error', 'conflicting-account', 'O mesmo pedido aponta para contas diferentes.', row, mapping.accountId)
    }
    if (record.orderId) orderAccounts.set(record.orderId, record.accountId)
    result.records.push(record)
  })
  if (!result.records.length) issue('error', 'empty', 'A planilha não contém linhas de dados.')
  const grouped = new Map<string, ImportedRecord[]>()
  for (const record of result.records) {
    if (!record.orderId) continue
    const group = grouped.get(record.orderId)
    if (group) group.push(record); else grouped.set(record.orderId, [record])
  }
  result.stats = {
    records: result.records.length, opportunities: opportunities.size, orders: grouped.size,
    accounts: new Set(result.records.map(record => record.accountId)).size,
    integratedOrders: kind === 'orders' ? [...grouped.values()].filter(group => group.every(record => normalize(record.status) === 'INTEGRADO COM ERP')).length : 0,
    sourceNewOrders: kind === 'orders' ? [...grouped.values()].filter(group => group.every(record => normalize(record.classification) === 'NOVO')).length : 0,
  }
  return result
}

export function reconcileImports(opportunities: ImportBatch | null, orders: ImportBatch | null) {
  const result = { matchedOrders: 0, unmatchedOrders: 0, conflictingAccounts: 0 }
  if (!opportunities || !orders) return result
  const accounts = new Map(opportunities.records.map(record => [record.opportunityId, record.accountId]))
  const groups = new Map<string, ImportedRecord[]>()
  for (const record of orders.records) {
    const group = groups.get(record.orderId)
    if (group) group.push(record); else groups.set(record.orderId, [record])
  }
  for (const group of groups.values()) {
    if (group.some(record => accounts.has(record.opportunityId) && accounts.get(record.opportunityId) !== record.accountId)) result.conflictingAccounts++
    else if (group.some(record => !accounts.has(record.opportunityId))) result.unmatchedOrders++
    else result.matchedOrders++
  }
  return result
}

export function selectImportedForecast(batch: ImportBatch, month: string, representative: string) {
  const records = batch.records.filter(record => record.stage && record.forecastDate?.startsWith(month) &&
    !normalize(record.stage).startsWith('FECHADA') && (!representative || record.representative === representative))
  return { records, accounts: new Set(records.map(record => record.accountId)).size,
    predictedValue: records.some(record => record.predictedValue === null) ? null : records.reduce((sum, record) => sum + (record.predictedValue ?? 0), 0) }
}

/** Due-date distribution of one snapshot, not a historical revenue curve. */
export function groupForecastDates(records: ImportedRecord[]) {
  const dates = [...new Set(records.map(record => record.forecastDate).filter((date): date is string => Boolean(date)))].sort()
  return dates.map(date => {
    const rows = records.filter(record => record.forecastDate === date)
    return { date, records: rows, count: rows.length,
      value: rows.some(record => record.predictedValue === null) ? null : rows.reduce((sum, record) => sum + (record.predictedValue ?? 0), 0) }
  })
}
