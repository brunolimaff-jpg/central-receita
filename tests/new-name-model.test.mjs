import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateNewNameModel,
  resolveOrderSubstatus,
  classifyNewName,
  getNewNamePeriodRange,
  selectNewNameListItems,
  DEFAULT_STATUS_MAPPING,
} from '../src/features/comercial-v3/new-name-model.ts'

const makeOrderRecord = (id, values = {}) => ({
  row: Number(id) || 1,
  opportunityId: `opp-${id}`,
  orderId: String(id),
  accountId: '1',
  account: `Conta ${id}`,
  stage: 'Fechada e Ganha',
  status: 'Integrado com ERP',
  classification: 'Novo',
  representative: 'Filial SP',
  executive: 'Executivo 1',
  ownerGroup: 'Inside Sales',
  forecastDate: null,
  closingDate: '2026-10-14',
  conferenceDate: null,
  predictedValue: null,
  closedValue: null,
  maintenance: 100,
  product: 'Gestão Empresarial',
  module: 'ERP',
  modality: 'Cloud',
  ...values,
})

const makeOppRecord = (id, values = {}) => ({
  row: Number(id) || 1,
  opportunityId: String(id),
  orderId: '',
  accountId: '1',
  account: `Conta ${id}`,
  stage: 'Negociação',
  status: '',
  classification: 'Novo',
  representative: 'Filial SP',
  executive: 'Executivo 1',
  ownerGroup: 'Inside Sales',
  forecastDate: '2026-10-14',
  closingDate: null,
  conferenceDate: null,
  predictedValue: 500,
  closedValue: null,
  maintenance: null,
  product: 'CRM',
  module: 'Vendas',
  modality: 'Cloud',
  ...values,
})

const referenceDate = '2026-10-14' // Quarta-feira

test('calcula período seg-dom para semana e mês completo', () => {
  const mes = getNewNamePeriodRange(referenceDate, 'mês')
  assert.deepEqual(mes, { start: '2026-10-01', end: '2026-10-31' })

  const semana = getNewNamePeriodRange(referenceDate, 'semana')
  // 14/10/2026 é quarta-feira -> segunda 12/10 a domingo 18/10
  assert.deepEqual(semana, { start: '2026-10-12', end: '2026-10-18' })
})

test('vazio: arrays vazios não quebram e devolvem contagens zeradas e nulos preservados', () => {
  const result = calculateNewNameModel([], referenceDate)
  assert.equal(result.indicators.orders, 0)
  assert.equal(result.indicators.newAccounts, 0)
  assert.equal(result.indicators.maintenanceTotal, 0)
  assert.equal(result.indicators.realizedValue, 0)
  assert.equal(result.indicators.realizedCount, 0)
  assert.equal(result.movements.entered, null)
  assert.equal(result.movements.exited, null)
  assert.equal(result.movements.won.count, 0)
  assert.equal(result.movements.lost.count, 0)
  assert.equal(result.movements.postponed, null)
  assert.deepEqual(result.allListItems, [])
})

test('sem carga anterior: Entrou e Saiu ficam null (nunca inventa números)', () => {
  const orders = [makeOrderRecord(1), makeOrderRecord(2)]
  const result = calculateNewNameModel(orders, referenceDate, { previousOrders: null })
  assert.equal(result.movements.entered, null)
  assert.equal(result.movements.exited, null)
  assert.equal(result.indicators.orders, 2)
})

test('status desconhecido fica "Não classificado" e nunca é encaixado à força', () => {
  assert.equal(resolveOrderSubstatus('Integrado com ERP'), 'integrado')
  assert.equal(resolveOrderSubstatus('Aguardando Conferência'), 'em conferência')
  assert.equal(resolveOrderSubstatus('Conferido'), 'conferido')
  assert.equal(resolveOrderSubstatus('Devolvido'), 'devolvido')
  assert.equal(resolveOrderSubstatus('Cancelado'), 'cancelado')

  // Status desconhecidos
  assert.equal(resolveOrderSubstatus('Aguardando aprovação diretoria'), 'Não classificado')
  assert.equal(resolveOrderSubstatus('Em trânsito'), 'Não classificado')
  assert.equal(resolveOrderSubstatus(''), 'Não classificado')
  assert.equal(resolveOrderSubstatus(null), 'Não classificado')
  assert.equal(resolveOrderSubstatus(undefined), 'Não classificado')
})

test('recebe de-para de status customizado como parâmetro e preserva estado desconhecido', () => {
  const customMapping = {
    'Aguardando Financeiro': 'em conferência',
    'Aprovado pelo Diretor': 'conferido',
  }
  assert.equal(resolveOrderSubstatus('Aguardando Financeiro', customMapping), 'em conferência')
  assert.equal(resolveOrderSubstatus('Aprovado pelo Diretor', customMapping), 'conferido')
  assert.equal(resolveOrderSubstatus('Integrado com ERP', customMapping), 'Não classificado')

  const customFn = status => (status === 'VIP' ? 'conferido' : 'Não classificado')
  assert.equal(resolveOrderSubstatus('VIP', customFn), 'conferido')
  assert.equal(resolveOrderSubstatus('Outro', customFn), 'Não classificado')
})

test('realizado oficial conta apenas conferido; integrado, em conferência, cancelado e devolvido ficam de fora', () => {
  const orders = [
    makeOrderRecord(1, { status: 'Conferido', conferenceDate: '2026-10-14', maintenance: 300 }),
    makeOrderRecord(2, { status: 'Integrado com ERP', maintenance: 200 }),
    makeOrderRecord(3, { status: 'Aguardando Conferência', maintenance: 150 }),
    makeOrderRecord(4, { status: 'Devolvido', maintenance: 100 }),
    makeOrderRecord(5, { status: 'Cancelado', maintenance: 80 }),
    makeOrderRecord(6, { status: 'Status Estranho', maintenance: 50 }),
  ]
  const result = calculateNewNameModel(orders, referenceDate, { period: 'mês' })

  // Total de pedidos Novo no período = 6
  assert.equal(result.indicators.orders, 6)
  // Realizado oficial = apenas o pedido 1 (Conferido)
  assert.equal(result.indicators.realizedCount, 1)
  assert.equal(result.indicators.realizedValue, 300)
  // Manutenção total dos pedidos Novo
  assert.equal(result.indicators.maintenanceTotal, 880)
})

test('contas distintas agrega múltiplos pedidos da mesma conta em 1 conta', () => {
  const orders = [
    makeOrderRecord(1, { accountId: 'conta-A', account: 'Empresa A', maintenance: 100 }),
    makeOrderRecord(2, { accountId: 'conta-A', account: 'Empresa A', maintenance: 200 }),
    makeOrderRecord(3, { accountId: 'conta-B', account: 'Empresa B', maintenance: 150 }),
  ]
  const result = calculateNewNameModel(orders, referenceDate)
  assert.equal(result.indicators.orders, 3)
  assert.equal(result.indicators.newAccounts, 2)
  assert.equal(result.indicators.maintenanceTotal, 450)
})

test('múltiplos itens do mesmo orderId somam manutenção e concatenam produtos', () => {
  const rows = [
    makeOrderRecord('100', { row: 1, product: 'ERP', maintenance: 200 }),
    makeOrderRecord('100', { row: 2, product: 'RH', maintenance: 300 }),
  ]
  const result = calculateNewNameModel(rows, referenceDate)
  assert.equal(result.indicators.orders, 1)
  assert.equal(result.orders[0].product, 'ERP, RH')
  assert.equal(result.orders[0].maintenance, 500)
  assert.equal(result.indicators.maintenanceTotal, 500)
})

test('nulos: manutenção nula propaga null no somatório (regra sumKnown)', () => {
  const orders = [
    makeOrderRecord(1, { maintenance: 100 }),
    makeOrderRecord(2, { maintenance: null }),
  ]
  const result = calculateNewNameModel(orders, referenceDate)
  assert.equal(result.indicators.orders, 2)
  assert.equal(result.indicators.maintenanceTotal, null)
})

test('Entrou e Saiu por orderId contra carga anterior', () => {
  const previous = [makeOrderRecord(1), makeOrderRecord(2), makeOrderRecord(3)]
  const current = [makeOrderRecord(2), makeOrderRecord(3), makeOrderRecord(4)]

  const result = calculateNewNameModel(current, referenceDate, { previousOrders: previous })
  assert.equal(result.movements.entered.count, 1)
  assert.deepEqual(result.movements.entered.items.map(i => i.orderId), ['4'])

  assert.equal(result.movements.exited.count, 1)
  assert.deepEqual(result.movements.exited.items.map(i => i.orderId), ['1'])
})

test('Perdidas e Postergadas derivadas de oportunidades New Name quando fornecidas', () => {
  const orders = [makeOrderRecord(1)]
  const currentOpps = [
    makeOppRecord(10, { stage: 'Fechada e Perdida', closingDate: '2026-10-13', closedValue: 400 }),
    makeOppRecord(11, { stage: 'Proposta', forecastDate: '2026-11-15', predictedValue: 600 }), // postergou para nov
  ]
  const previousOpps = [
    makeOppRecord(11, { stage: 'Proposta', forecastDate: '2026-10-20', predictedValue: 600 }), // estava em out
  ]

  const result = calculateNewNameModel(orders, referenceDate, {
    opportunities: currentOpps,
    previousOpportunities: previousOpps,
  })

  assert.equal(result.movements.lost.count, 1)
  assert.equal(result.movements.lost.value, 400)
  assert.equal(result.movements.lost.items[0].orderId, '10')

  assert.equal(result.movements.postponed.count, 1)
  assert.equal(result.movements.postponed.value, 600)
  assert.equal(result.movements.postponed.items[0].orderId, '11')
})

test('classificação "Novo a validar" fica separada do total principal', () => {
  const orders = [
    makeOrderRecord(1, { classification: 'Novo', maintenance: 500 }),
    makeOrderRecord(2, { classification: 'Novo a validar', maintenance: 250 }),
  ]
  const result = calculateNewNameModel(orders, referenceDate)

  // Principal só inclui pedido 1
  assert.equal(result.indicators.orders, 1)
  assert.equal(result.indicators.maintenanceTotal, 500)

  // Pedido 2 fica isolado no grupo toValidate
  assert.equal(result.indicators.toValidateCount, 1)
  assert.equal(result.indicators.toValidateValue, 250)
  assert.equal(result.toValidateOrders[0].orderId, '2')
})

test('seletor de filtro da lista devolve os itens esperados para cada movimento', () => {
  const previous = [makeOrderRecord(1)]
  const current = [makeOrderRecord(2, { status: 'Conferido' })]
  const result = calculateNewNameModel(current, referenceDate, { previousOrders: previous })

  assert.equal(selectNewNameListItems(result, 'todos').length, 1)
  assert.equal(selectNewNameListItems(result, 'ganhou').length, 1)
  assert.equal(selectNewNameListItems(result, 'entrou').length, 1)
  assert.equal(selectNewNameListItems(result, 'saiu').length, 1)
  assert.equal(selectNewNameListItems(result, 'perdeu').length, 0)
  assert.equal(selectNewNameListItems(result, 'postergou').length, 0)
})

test('recorte semanal vs mensal respeita as fronteiras', () => {
  const orders = [
    makeOrderRecord(1, { closingDate: '2026-10-05' }), // segunda anterior à semana da ref (12 a 18)
    makeOrderRecord(2, { closingDate: '2026-10-14' }), // dentro da semana
  ]

  const mensal = calculateNewNameModel(orders, referenceDate, { period: 'mês' })
  assert.equal(mensal.indicators.orders, 2)

  const semanal = calculateNewNameModel(orders, referenceDate, { period: 'semana' })
  assert.equal(semanal.indicators.orders, 1)
  assert.equal(semanal.orders[0].orderId, '2')
})

test('o mês do New Name é medido pela conferência, não pelo fechamento', () => {
  // Caso real da exportação: fechamento em setembro, conferência em 01/10.
  // Antes, o pedido caía em setembro e o New Name zerava.
  const pedido = makeOrderRecord('10', { closingDate: '2026-09-30', conferenceDate: '2026-10-01' })
  const modelo = calculateNewNameModel([pedido], '2026-10-05', { period: 'mês' })
  assert.equal(modelo.indicators.newAccounts, 1)
  assert.equal(modelo.indicators.orders, 1)
})

test('data de conferência preenchida marca o pedido como conferido (sinal do CRM)', () => {
  // A carga real só traz "Integrado com ERP": o sinal de conferência é a data.
  const comData = makeOrderRecord('11', { conferenceDate: '2026-10-02' })
  const semData = makeOrderRecord('12', { conferenceDate: null })
  const modelo = calculateNewNameModel([comData, semData], '2026-10-05', { period: 'mês' })
  assert.equal(modelo.orders.find(o => o.orderId === '11').substatus, 'conferido')
  assert.equal(modelo.orders.find(o => o.orderId === '12').substatus, 'integrado')
  assert.equal(modelo.indicators.realizedCount, 1)
})

test('classificação "NOVO" da fonte não é confirmado e não muda os totais', () => {
  // "NOVO" vem da exportação, sem confirmação institucional: não pode ser "confirmado".
  assert.equal(classifyNewName('NOVO'), 'pela_fonte')
  assert.equal(classifyNewName('Novo'), 'pela_fonte')
  assert.notEqual(classifyNewName('NOVO'), 'confirmado')

  // Confirmação institucional continua sendo confirmado.
  assert.equal(classifyNewName('NOVO CONFIRMADO'), 'confirmado')
  assert.equal(classifyNewName('Novo confirmado'), 'confirmado')

  // Pedidos "NOVO" seguem no total principal e são rotulados como "pela fonte".
  const fonte = [makeOrderRecord(1, { classification: 'Novo', maintenance: 500 })]
  const confirmado = [makeOrderRecord(1, { classification: 'Novo Confirmado', maintenance: 500 })]
  const modeloFonte = calculateNewNameModel(fonte, referenceDate)
  const modeloConfirmado = calculateNewNameModel(confirmado, referenceDate)

  assert.equal(modeloFonte.indicators.orders, modeloConfirmado.indicators.orders)
  assert.equal(modeloFonte.indicators.maintenanceTotal, modeloConfirmado.indicators.maintenanceTotal)
  assert.equal(modeloFonte.indicators.newAccounts, modeloConfirmado.indicators.newAccounts)
  assert.equal(modeloFonte.orders[0].orderId, '1')
  assert.equal(modeloFonte.indicators.sourceOnlyCount, 1)
  assert.equal(modeloConfirmado.indicators.sourceOnlyCount, 0)

  // "Novo a validar" continua no grupo separado.
  assert.equal(classifyNewName('Novo a validar'), 'a_validar')
})

test('devolvido ou cancelado com data de conferência continua fora do realizado', () => {
  const devolvido = makeOrderRecord('13', { status: 'Devolvido', conferenceDate: '2026-10-02' })
  const cancelado = makeOrderRecord('14', { status: 'Cancelado', conferenceDate: '2026-10-03' })
  const modelo = calculateNewNameModel([devolvido, cancelado], '2026-10-05', { period: 'mês' })
  assert.equal(modelo.indicators.realizedCount, 0)
  assert.equal(modelo.orders.find(o => o.orderId === '13').substatus, 'devolvido')
})
