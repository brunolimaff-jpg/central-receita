import test from 'node:test'
import assert from 'node:assert/strict'

let importer
try { importer = await import('../src/features/comercial-v3/manual-import.ts') } catch { /* missing feature is the first failure */ }
const oppHeaders = ['Oportunidade ID', 'Conta ID', 'Conta', 'Etapa', 'Previsão de Fechamento', 'Valor Previsto', 'Valor Fechado', 'Representante', 'Pedido', 'Email Geral']
const orderHeaders = ['NUMERO PEDIDO', 'ID OPORTUNIDADE', 'ID CONTA', 'NOME FANTASIA CONTA', 'STATUS OPORTUNIDADE', 'CLASSIFICACAO DO PEDIDO', 'DATA FECHAMENTO', 'PRODUTO - VALOR MANUTENCAO', 'UNIDADE NEGOCIO OPORTUNIDADE']

test('distribuição por data mantém valor ausente diferente de zero e respeita o recorte', () => {
  const batch = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'Teste A', 'Negociação', '06/10/2026', 0, null, 'Unidade teste'],
    [102, 12, 'Teste B', 'Negociação', '06/10/2026', null, null, 'Unidade teste'],
    [103, 13, 'Teste C', 'Negociação', '07/10/2026', 50.25, null, 'Unidade teste'],
    [104, 14, 'Teste D', 'Fechada e Perdida', '07/10/2026', 999, null, 'Unidade teste']])
  const groups = importer.groupForecastDates(importer.selectImportedForecast(batch, '2026-10', '').records)
  assert.deepEqual(groups.map(({date, count, value}) => ({date, count, value})), [
    { date: '2026-10-06', count: 2, value: null }, { date: '2026-10-07', count: 1, value: 50.25 }])
  assert.equal(groups[0].records[0].predictedValue, 0)
  assert.deepEqual(importer.groupForecastDates([]), [])
})

test('normaliza a carteira sem guardar contato e distingue vazio de zero', () => {
  assert.ok(importer, 'o importador ainda não existe')
  const batch = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'Conta de teste', 'Negociação', '31/10/2026', 0, null, 'Representante teste', null, 'contato@example.invalid'],
    [102, 12, 'Outra conta de teste', 'Fechada e Perdida', '01/01/1000', null, 500, 'Representante teste']])
  assert.equal(batch.errorCount, 0)
  assert.equal(batch.records[0].predictedValue, 0)
  assert.equal(batch.records[1].predictedValue, null)
  assert.equal(batch.records[1].forecastDate, null)
  assert.equal(batch.records[0].forecastDate, '2026-10-31')
  assert.doesNotMatch(JSON.stringify(batch.records), /contato@example/)
  // `01/01/1000` é a sentinela de "sem data" do CRM: ausência de dado, não erro.
  assert.equal(batch.issues.filter(issue => issue.code === 'invalid-date').length, 0)
})

test('bloqueia IDs duplicados, cabeçalho ausente e planilha vazia', () => {
  assert.ok(importer)
  assert.ok(importer.normalizeImport('opportunities', []).errorCount > 0)
  assert.ok(importer.normalizeImport('opportunities', [['Conta'], ['Teste']]).errorCount > 0)
  assert.ok(importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'Teste', 'Negociação'], [101, 11, 'Teste', 'Negociação']]).errorCount > 0)
})

test('itens repetidos continuam sendo um pedido e Novo continua classificação da fonte', () => {
  assert.ok(importer)
  const batch = importer.normalizeImport('orders', [orderHeaders,
    [201, 101, 11, 'Teste', 'Integrado com ERP', 'Novo', '30/09/2026', 100, 'Unidade teste'],
    [201, 101, 11, 'Teste', 'Integrado com ERP', 'Novo', '30/09/2026', 100, 'Unidade teste']])
  assert.equal(batch.errorCount, 0)
  assert.equal(batch.stats.records, 2)
  assert.equal(batch.stats.orders, 1)
  assert.equal(batch.stats.sourceNewOrders, 1)
  assert.equal(batch.stats.integratedOrders, 1)
  assert.equal(batch.records[0].classification, 'Novo')
  assert.ok(!('mrr' in batch.stats))
  assert.ok(!('newNames' in batch.stats))
})

test('um pedido não pode apontar para contas conflitantes', () => {
  assert.ok(importer)
  const batch = importer.normalizeImport('orders', [orderHeaders,
    [201, 101, 11, 'Teste', 'Integrado com ERP'], [201, 101, 12, 'Outra conta', 'Integrado com ERP']])
  assert.ok(batch.errorCount > 0)
})

test('a reconciliação usa o ID e informa divergência de conta', () => {
  assert.ok(importer)
  const opp = importer.normalizeImport('opportunities', [oppHeaders, [101, 11, 'Teste', 'Negociação']])
  const orders = importer.normalizeImport('orders', [orderHeaders,
    [201, 101, 11, 'Teste', 'Integrado com ERP'], [202, 102, 12, 'Outro', 'Integrado com ERP'],
    [203, 101, 13, 'Divergente', 'Integrado com ERP']])
  assert.deepEqual(importer.reconcileImports(opp, orders), { matchedOrders: 1, unmatchedOrders: 1, conflictingAccounts: 1 })
})

test('recorte mensal conta oportunidades abertas e não transforma carteira em forecast oficial', () => {
  assert.ok(importer)
  const batch = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'Teste', 'Negociação', '31/10/2026', 1000],
    [102, 12, 'Outra', 'Fechada e Ganha', '31/10/2026', 2000],
    [103, 13, 'Futura', 'Proposta', '30/11/2026', 3000],
    [104, 14, 'Sem etapa', '', '31/10/2026', 4000]])
  const result = importer.selectImportedForecast(batch, '2026-10', '')
  assert.equal(result.records.length, 1)
  assert.equal(result.accounts, 1)
  assert.equal(result.predictedValue, 1000)
  assert.ok(!('official' in result))
  assert.ok(batch.issues.some(issue => issue.code === 'missing-stage'))
})

test('os mesmos bytes com referência corrigida permitem uma nova prévia sem adicionar linhas', () => {
  assert.ok(importer)
  const existing = { hash: 'same-file', referenceDate: '2026-10-04' }
  assert.equal(importer.isDuplicateImport({ hash: 'same-file', referenceDate: '2026-10-04' }, existing), true)
  assert.equal(importer.isDuplicateImport({ hash: 'same-file', referenceDate: '2026-10-05' }, existing), false)
})

test('a referência rejeita datas impossíveis, especiais ou posteriores ao retrato atual', () => {
  assert.ok(importer)
  assert.equal(importer.isValidImportReference('2026-10-05', '2026-10-05'), true)
  for (const value of ['', '2026-02-31', '1000-01-01', '2026-10-06']) assert.equal(importer.isValidImportReference(value, '2026-10-05'), false)
})

test('valor pt-BR: ponto é separador de milhar e vírgula é decimal', () => {
  assert.ok(importer)
  assert.equal(importer.parseImportNumber('15.000'), 15000)
  assert.equal(importer.parseImportNumber('1.234,56'), 1234.56)
  assert.equal(importer.parseImportNumber('10,50'), 10.5)
  assert.equal(importer.parseImportNumber('1234.56'), 1234.56)
  assert.equal(importer.parseImportNumber('1.234.567,89'), 1234567.89)
  assert.equal(importer.parseImportNumber('100'), 100)
  assert.equal(importer.parseImportNumber('-15.000'), -15000)
})

test('valor genuinamente ambíguo vira inválido com aviso em vez de adivinhar', () => {
  assert.ok(importer)
  assert.ok(Number.isNaN(importer.parseImportNumber('12.3456')))
  assert.ok(Number.isNaN(importer.parseImportNumber('1,234')))
  const batch = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'Teste', 'Negociação', '31/10/2026', '12.3456', null, 'Unidade teste']])
  assert.equal(batch.records[0].predictedValue, null)
  assert.ok(batch.issues.some(issue => issue.code === 'invalid-number' && issue.field === 'Valor Previsto'))
})

test('o CSV do CRM pt-BR lê quinze mil como 15000, não como 15', () => {
  assert.ok(importer)
  const batch = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'Teste', 'Negociação', '31/10/2026', '15.000', null, 'Unidade teste'],
    [102, 12, 'Teste', 'Negociação', '31/10/2026', '1.234,56', null, 'Unidade teste']])
  assert.equal(batch.records[0].predictedValue, 15000)
  assert.equal(batch.records[1].predictedValue, 1234.56)
  assert.ok(!batch.issues.some(issue => issue.code === 'invalid-number'))
})

test('data com hora é aceita e a parte de horário é descartada', () => {
  assert.ok(importer)
  const batch = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'Teste', 'Negociação', '31/10/2026 00:00:00', 100, null, 'Unidade teste'],
    [102, 12, 'Teste', 'Negociação', '2026-10-31T00:00:00', 100, null, 'Unidade teste'],
    [103, 13, 'Teste', 'Negociação', '2026-10-31T00:00:00.000Z', 100, null, 'Unidade teste']])
  assert.equal(batch.errorCount, 0)
  assert.deepEqual(batch.records.map(record => record.forecastDate), ['2026-10-31', '2026-10-31', '2026-10-31'])
  assert.ok(!batch.issues.some(issue => issue.code === 'invalid-date'))
})

test('Prob. aceita o sufixo de porcentagem', () => {
  assert.ok(importer)
  const header = ['Oportunidade ID', 'Conta ID', 'Conta', 'Etapa', 'Previsão de Fechamento', 'Valor Previsto', 'Valor Fechado', 'Representante', 'Prob.']
  const batch = importer.normalizeImport('opportunities', [header,
    ['10', '1', 'A', 'Proposta', '2026-10-20', 100, '', 'R', '75%'],
    ['11', '2', 'B', 'Proposta', '2026-10-20', 100, '', 'R', '0,5'],
    ['12', '3', 'C', 'Proposta', '2026-10-20', 100, '', 'R', 0.8]])
  assert.equal(batch.errorCount, 0)
  assert.deepEqual(batch.records.map(record => record.probability), [0.75, 0.5, 0.8])
})

test('Pedido em oportunidades precisa ser só dígitos ou vazio', () => {
  assert.ok(importer)
  const batch = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'Teste', 'Negociação', '31/10/2026', 100, null, 'Unidade teste', 'PED-1'],
    [102, 12, 'Teste', 'Negociação', '31/10/2026', 100, null, 'Unidade teste', ''],
    [103, 13, 'Teste', 'Negociação', '31/10/2026', 100, null, 'Unidade teste', '201']])
  assert.ok(batch.issues.some(issue => issue.code === 'invalid-id' && issue.field === 'Pedido' && issue.row === 2))
  assert.ok(!batch.issues.some(issue => issue.code === 'invalid-id' && issue.row === 3))
  assert.ok(!batch.issues.some(issue => issue.code === 'invalid-id' && issue.row === 4))
})

test('texto acima do limite do servidor é erro identificado na prévia', () => {
  assert.ok(importer)
  const longStage = 'E'.repeat(257)
  const longAccount = 'C'.repeat(513)
  const batch = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, longAccount, longStage, '31/10/2026', 100, null, 'Unidade teste']])
  assert.ok(batch.issues.some(issue => issue.code === 'field-too-long' && issue.field === 'Etapa' && issue.row === 2))
  assert.ok(batch.issues.some(issue => issue.code === 'field-too-long' && issue.field === 'Conta' && issue.row === 2))
  const ok = importer.normalizeImport('opportunities', [oppHeaders,
    [101, 11, 'C'.repeat(512), 'E'.repeat(256), '31/10/2026', 100, null, 'Unidade teste']])
  assert.ok(!ok.issues.some(issue => issue.code === 'field-too-long'))
})
