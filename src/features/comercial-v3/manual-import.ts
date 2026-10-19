/*
 * Mensagens da importação, na voz da Senior (v3/…/03_TOM_DE_VOZ_SENIOR_RESUMO.md):
 * o que aconteceu, a causa provável e o que fazer agora — sem culpar a Fabi e
 * sem termo de sistema. Vivem aqui, e não em módulo próprio, porque os testes
 * carregam este arquivo direto no Node, que não resolve import sem extensão.
 */
const MSG = {
  planilhaVazia:
    'Esta planilha não tem linhas de dados. Exporte de novo pelo CRM depois de aplicar o filtro do período e selecione o arquivo.',
  colunaAusente: (coluna: string) =>
    `A planilha não tem a coluna “${coluna}”. Confira se ela é a exportação completa do CRM e selecione o arquivo de novo.`,
  cabecalhoDuplicado: (coluna: string) =>
    `A coluna “${coluna}” aparece duas vezes na planilha. Exporte de novo pelo CRM e selecione o arquivo.`,
  dataInvalida: (coluna: string, linha: number) =>
    `A data da coluna “${coluna}” na linha ${linha} não foi reconhecida. O restante da carga segue; este registro fica sem data.`,
  valorInvalido: (coluna: string, linha: number) =>
    `O valor da coluna “${coluna}” na linha ${linha} não foi reconhecido como número. O restante da carga segue; este registro fica sem valor.`,
  identificadorInvalido: (coluna: string, linha: number) =>
    `O identificador da coluna “${coluna}” na linha ${linha} está vazio ou tem caracteres que o CRM não usa. Confira a linha na planilha e exporte de novo.`,
} as const

export type ImportKind = 'opportunities' | 'orders'
type Cell = unknown
export type ImportIssue = { severity: 'error' | 'warning'; code: string; row?: number; field?: string; message: string }
export type ImportedRecord = {
  row: number; opportunityId: string; orderId: string; accountId: string; account: string
  stage: string; status: string; classification: string; representative: string; executive: string
  ownerGroup: string; forecastDate: string | null; closingDate: string | null; conferenceDate: string | null
  predictedValue: number | null; closedValue: number | null; maintenance: number | null
  product: string; module: string; modality: string
  /** Chance de 0 a 1; ausente em cargas antigas ou quando a planilha não traz a coluna "Prob.". */
  probability?: number | null
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
    probability: 'Prob.',
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

/**
 * Limites de texto que o servidor exige (worker.js, cleanText). Conta, Representante e
 * Respons\u00e1vel aceitam 512; os demais campos de texto aceitam 256. Validar aqui evita que a
 * pr\u00e9via diga "0 erros" e a grava\u00e7\u00e3o seja recusada com 422.
 */
const textLimits: Array<[keyof ImportedRecord, number]> = [
  ['account', 512], ['representative', 512], ['executive', 512],
  ['stage', 256], ['status', 256], ['classification', 256], ['ownerGroup', 256],
  ['product', 256], ['module', 256], ['modality', 256],
]

/**
 * Interpreta n\u00fameros como o CRM pt-BR exporta: o ponto separa milhar e a v\u00edrgula separa decimal.
 * `15.000` \u2192 15000, `1.234,56` \u2192 1234.56, `10,50` \u2192 10.5. Um ponto seguido de exatamente tr\u00eas
 * d\u00edgitos (ou grupos de tr\u00eas) \u00e9 separador de milhar; um ponto com um ou dois d\u00edgitos \u00e9 decimal
 * (`1234.56` \u2192 1234.56). Casos genuinamente amb\u00edguos viram inv\u00e1lido em vez de adivinhar.
 */
export function parseImportNumber(input: string): number {
  const match = /^([+-]?)([\d.,]+)$/.exec(input.trim())
  if (!match) return NaN
  const sign = match[1] === '-' ? '-' : ''
  const body = match[2]
  const build = (normalized: string) => Number(sign + normalized)
  if (body.includes(',')) {
    if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(body) || /^\d+,\d{1,2}$/.test(body)) return build(body.replaceAll('.', '').replace(',', '.'))
    return NaN
  }
  if (body.includes('.')) {
    if (/^\d{1,3}(\.\d{3})+$/.test(body)) return build(body.replaceAll('.', ''))
    if (/^\d+\.\d{1,2}$/.test(body)) return build(body)
    return NaN
  }
  return /^\d+$/.test(body) ? build(body) : NaN
}

export const currentImportDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

/**
 * Traduz o código de erro devolvido pelo servidor (worker.js) para uma explicação legível,
 * sem vazar valores de célula nem dados comerciais sensíveis. Mantém a mensagem em pt-BR, voz
 * ativa, dizendo o que ocorreu e o próximo passo sem culpar a operadora.
 */
const rejectionReasons: Record<string, string> = {
  invalid_record_shape: 'o formato de uma linha não é o esperado',
  invalid_row: 'a numeração de uma linha está fora do intervalo aceito',
  invalid_text_field: 'um texto tem caracteres inválidos ou passa do limite de tamanho',
  invalid_id: 'um identificador não é numérico ou está zerado',
  invalid_date: 'uma data não é válida',
  invalid_number: 'um valor não é numérico ou excede o limite aceito',
  invalid_record_count: 'a quantidade de linhas não é aceita',
  invalid_issues: 'a lista de problemas da leitura excede o limite',
  unresolved_import_errors: 'a leitura ainda tem erros bloqueadores',
  invalid_stats: 'os totais informados não conferem',
  invalid_filename: 'o nome do arquivo não é aceito',
  invalid_hash: 'a impressão digital do arquivo não é aceita',
  invalid_source_metadata: 'a aba ou a data de referência da fonte não é aceita',
  invalid_import_time: 'o horário de leitura não é aceito',
  invalid_saved_time: 'o horário de gravação não é aceito',
  invalid_issue: 'um problema da leitura tem formato inválido',
  invalid_batch_shape: 'o conjunto de dados de uma fonte não tem o formato esperado',
  duplicate_opportunity_id: 'há oportunidade repetida na carga',
  conflicting_order_accounts: 'um mesmo pedido aponta para contas diferentes',
  invalid_workspace: 'nenhuma fonte foi informada na carga',
  invalid_request: 'a referência enviada não é aceita',
  conflicting_reconciliation: 'há divergência de conta entre pedidos e oportunidades',
  source_removal_not_supported: 'uma fonte não pode ser removida em uma nova carga',
  source_hash_content_mismatch: 'o conteúdo de uma fonte mudou sem mudar a impressão digital',
  source_reference_mismatch: 'a data de referência de uma fonte difere da carga',
  no_source_changed: 'nenhuma fonte foi alterada em relação à carga atual',
  revision_conflict: 'outra pessoa atualizou os dados',
}

/** Monta a mensagem do 422 combinando o código do servidor com um texto legível em pt-BR. */
export function importRejectionMessage(code: unknown): string {
  const base = 'A carga foi recusada. Revise os problemas e os vínculos antes de tentar novamente.'
  if (typeof code !== 'string' || !code) return base
  const reason = rejectionReasons[code] ?? 'o servidor recusou a carga por um motivo não detalhado'
  return `A carga foi recusada: ${reason}. Revise a prévia e os vínculos e tente novamente.`
}

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
  /*
   * Três causas diferentes caem no mesmo portão de tamanho, e cada uma pede uma
   * ação diferente. Antes, uma frase só misturava as três e virava instrução
   * contraditória ("não tem linhas... reduza o período").
   */
  const tooWideRow = rows.findIndex(row => row.length > 100)
  if (rows.length < 2) {
    issue('error', 'size', MSG.planilhaVazia)
    return result
  }
  if (rows.length > 50001) {
    issue('error', 'size', 'A planilha passou do limite de 50.000 linhas. Reduza o período no filtro do CRM, exporte de novo e selecione o arquivo.')
    return result
  }
  if (tooWideRow >= 0) {
    issue('error', 'size', 'A planilha tem mais de 100 colunas. Exporte de novo pelo CRM com as colunas padrão e selecione o arquivo.', tooWideRow + 1)
    return result
  }
  const headers = rows[0].map(normalize)
  const mapping: Record<string, string> = fields[kind]
  const required = kind === 'orders'
    ? ['orderId', 'opportunityId', 'accountId', 'account', 'status', 'classification', 'closingDate', 'maintenance', 'representative']
    : ['opportunityId', 'accountId', 'account', 'stage', 'forecastDate', 'predictedValue', 'closedValue', 'representative']
  for (const key of required) {
    if (!headers.includes(normalize(mapping[key]))) issue('error', 'missing-column', MSG.colunaAusente(mapping[key]), 1, mapping[key])
  }

  /*
   * Erro na fonte errada é engano comum: a operadora sobe a planilha de
   * oportunidades no slot de pedidos (ou o contrário). Nove erros de coluna
   * escondem a causa; uma frase que nomeia a troca resolve em um passo.
   */
  if (result.errorCount) {
    const outra = kind === 'orders' ? 'opportunities' : 'orders'
    const assinatura = outra === 'orders' ? ['NUMERO PEDIDO', 'STATUS OPORTUNIDADE'] : ['Oportunidade ID', 'Etapa', 'Previsão de Fechamento']
    const pareceOutraFonte = assinatura.filter(coluna => headers.includes(normalize(coluna))).length >= 2
    if (pareceOutraFonte) {
      const troca: ImportIssue = {
        severity: 'error',
        code: 'wrong-source',
        row: 1,
        message: kind === 'orders'
          ? 'Este arquivo parece ser a planilha de Oportunidades. Envie-o no campo de Oportunidades e escolha a planilha de Pedidos aqui.'
          : 'Este arquivo parece ser a planilha de Pedidos. Envie-o no campo de Pedidos e escolha a planilha de Oportunidades aqui.',
      }
      result.issues = [troca]
      result.errorCount = 1
      result.warningCount = 0
    }
  }
  for (const field of Object.values(mapping)) {
    if (headers.filter(header => header === normalize(field)).length > 1) issue('error', 'duplicate-column', MSG.cabecalhoDuplicado(field), 1, field)
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
      // O CRM pode anexar hora (`31/10/2026 00:00:00`, `2026-10-31T00:00:00`); a hora é descartada.
      const str = text(raw).replace(/[T\s]\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/, '').trim()
      /*
       * `01/01/1000` é a sentinela que este CRM grava quando não há data ("sem
       * efetivação"). Tratá-la como inválida gerava 169 avisos por carga e
       * obrigava a operadora a reconhecer ruído, escondendo avisos reais. Ela é
       * ausência de dado, não erro: vira null em silêncio.
       */
      if (/^0?1\/0?1\/1000$/.test(str) || str.startsWith('1000-01-01')) return null
      if (!iso && /^\d{4}-\d{2}-\d{2}$/.test(str)) iso = str
      const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str)
      if (!iso && br) iso = `${br[3]}-${br[2]}-${br[1]}`
      const parsed = new Date(iso + 'T12:00:00Z')
      if (!iso || Number(iso.slice(0, 4)) < 1900 || Number(iso.slice(0, 4)) > 2100 || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) {
        issue('warning', 'invalid-date', MSG.dataInvalida(mapping[key], row), row, mapping[key])
        return null
      }
      return iso
    }
    const number = (key: string): number | null => {
      const raw = get(key)
      if (raw === null || raw === undefined || raw === '') return null
      let value: number = NaN
      if (typeof raw === 'number') value = raw
      if (typeof raw === 'string') value = parseImportNumber(raw)
      if (!Number.isFinite(value)) issue('warning', 'invalid-number', MSG.valorInvalido(mapping[key], row), row, mapping[key])
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
    if (kind === 'opportunities') {
      // `Prob.` aceita fração (0 a 1), percentual sem símbolo (75) e percentual com `%` (75%).
      const rawChance = get('probability')
      let chance: number | null = null
      if (positions.probability >= 0 && rawChance !== null && rawChance !== undefined && rawChance !== '') {
        if (typeof rawChance === 'number') chance = rawChance
        else if (typeof rawChance === 'string') chance = parseImportNumber(rawChance.trim().replace(/%$/, ''))
        if (!Number.isFinite(chance)) { issue('warning', 'invalid-number', MSG.valorInvalido(mapping.probability, row), row, mapping.probability); chance = null }
      }
      record.probability = chance === null ? null : chance > 1 ? chance / 100 : chance
    }
    for (const key of kind === 'orders' ? ['opportunityId', 'orderId', 'accountId'] as const : ['opportunityId', 'accountId'] as const) {
      if (!/^\d{1,64}$/.test(record[key]) || /^0+$/.test(record[key])) issue('error', 'invalid-id', MSG.identificadorInvalido(mapping[key], row), row, mapping[key])
    }
    // Em oportunidades o servidor aceita `Pedido` só com dígitos ou vazio; o cliente precisa avisar
    // antes da gravação para a prévia não dizer "0 erros" e a carga ser recusada com 422.
    if (kind === 'opportunities' && record.orderId !== '' && (!/^\d{1,64}$/.test(record.orderId) || /^0+$/.test(record.orderId))) {
      issue('error', 'invalid-id', MSG.identificadorInvalido(mapping.orderId, row), row, mapping.orderId)
    }
    for (const [key, limit] of textLimits) {
      if (text(record[key]).length > limit) issue('error', 'field-too-long', `Texto acima do limite de ${limit} caracteres; reduza o valor na fonte.`, row, mapping[key])
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
