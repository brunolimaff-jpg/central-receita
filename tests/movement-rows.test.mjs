import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { isOpenStage } from '../src/features/comercial-v3/pipeline-model.ts'
import { forecastMovementRows, groupMovements, newNameMovementRows, pipelineMovementRows, sortByImpact } from '../src/features/comercial-v3/movement-rows.ts'

const rec = (overrides = {}) => ({
  row: 1, opportunityId: 'OP-1', orderId: '', accountId: 'C-1', account: 'Conta 1',
  stage: 'Proposta', status: '', classification: '', representative: 'Filial Sul', executive: 'Ana',
  ownerGroup: '', forecastDate: '2026-10-20', closingDate: null, conferenceDate: null,
  predictedValue: 100, closedValue: null, maintenance: null, product: '', module: '', modality: '',
  ...overrides,
})

const CARTOES = [
  { key: 'Entrou', labels: ['Entrou'] },
  { key: 'Saiu', labels: ['Saiu', 'Postergou'] },
  { key: 'Ganhou', labels: ['Ganhou'] },
  { key: 'Perdeu', labels: ['Perdeu'] },
]

test('pipeline sem carga anterior não inventa movimento', () => {
  assert.equal(pipelineMovementRows([rec()], null, isOpenStage), null)
})

test('pipeline: Entrou, Saiu, Postergou e Alterou valor com Δ de cada caso', () => {
  const anterior = [
    rec({ opportunityId: 'SAI', predictedValue: 300 }),
    rec({ opportunityId: 'POS', predictedValue: 200, forecastDate: '2026-11-10' }),
    rec({ opportunityId: 'ALT', predictedValue: 100 }),
  ]
  const atual = [
    rec({ opportunityId: 'SAI', stage: 'Fechada e Ganha', predictedValue: null, closedValue: 300 }),
    rec({ opportunityId: 'POS', predictedValue: 200, forecastDate: '2026-12-02' }),
    rec({ opportunityId: 'ALT', predictedValue: 150 }),
    rec({ opportunityId: 'NOVA', predictedValue: 80 }),
  ]
  const linhas = pipelineMovementRows(atual, anterior, isOpenStage)
  const porId = Object.fromEntries(linhas.map(linha => [linha.opportunityId, linha]))
  assert.equal(porId.SAI.movement, 'Saiu')
  assert.equal(porId.SAI.delta, -300)
  assert.equal(porId.NOVA.movement, 'Entrou')
  assert.equal(porId.NOVA.delta, 80)
  assert.equal(porId.POS.movement, 'Postergou')
  assert.equal(porId.POS.delta, 0)
  assert.equal(porId.POS.previousDate, '2026-11-10')
  assert.equal(porId.ALT.movement, 'Alterou valor')
  assert.equal(porId.ALT.delta, 50)
  assert.equal(porId.ALT.value, 150)
})

test('pipeline: valor ausente vira Δ null, sem zero silencioso', () => {
  const linhas = pipelineMovementRows([rec({ opportunityId: 'X', predictedValue: null })], [rec({ opportunityId: 'X', predictedValue: 90 })], isOpenStage)
  assert.equal(linhas[0].movement, 'Alterou valor')
  assert.equal(linhas[0].delta, null)
})

test('forecast: Entrou, Saiu, Ganhou com sinal; ordenado pelo maior impacto', () => {
  const anterior = [rec({ opportunityId: 'SAI', predictedValue: 300 })]
  const atual = [
    rec({ opportunityId: 'NOVA', predictedValue: 200, forecastDate: '2026-10-05', stage: 'Negociação' }),
    rec({ opportunityId: 'GANHA', stage: 'Fechada e Ganha', predictedValue: null, closedValue: 150, closingDate: '2026-10-10', forecastDate: null }),
  ]
  const result = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-16', 'mês')
  const linhas = forecastMovementRows(result, atual)
  assert.deepEqual(linhas.map(linha => [linha.movement, linha.delta]), [['Saiu', -300], ['Entrou', 200], ['Ganhou', 150]])
})

test('forecast sem carga anterior: Entrou e Saiu ficam indisponíveis, Ganhou continua', () => {
  const atual = [rec({ opportunityId: 'GANHA', stage: 'Fechada e Ganha', predictedValue: null, closedValue: 40, closingDate: '2026-10-03', forecastDate: null })]
  const result = calculateForecastMonth(atual, null, '2026-10', '2026-10-16', 'mês')
  const linhas = forecastMovementRows(result, atual)
  assert.deepEqual(linhas.map(linha => linha.movement), ['Ganhou'])
})

test('cartões: Saiu junta a postergação; grupo com valor ausente fica null', () => {
  const linhas = [
    { key: 'a', movement: 'Saiu', delta: -100 },
    { key: 'b', movement: 'Postergou', delta: -50 },
    { key: 'c', movement: 'Entrou', delta: null },
  ]
  const grupos = Object.fromEntries(groupMovements(linhas, CARTOES).map(grupo => [grupo.key, grupo]))
  assert.equal(grupos.Saiu.count, 2)
  assert.equal(grupos.Saiu.value, -150)
  assert.equal(grupos.Saiu.weight, 150)
  assert.equal(grupos.Entrou.value, null)
  assert.equal(grupos.Ganhou.count, 0)
  assert.equal(grupos.Ganhou.value, 0)
})

test('sortByImpact: maior |Δ| primeiro e nulos por último', () => {
  const ordenadas = sortByImpact([{ key: 'n', delta: null }, { key: 'p', delta: 10 }, { key: 'q', delta: -30 }])
  assert.deepEqual(ordenadas.map(linha => linha.key), ['q', 'p', 'n'])
})

test('New Name: Saiu negativo e filial vinda da carga de pedidos', () => {
  const orders = [rec({ orderId: 'PED-9', opportunityId: 'OP-9', representative: 'Filial Norte' })]
  const model = {
    movements: {
      entered: { count: 1, value: 60, items: [{ id: 'PED-9', orderId: 'PED-9', opportunityId: 'OP-9', account: 'Conta 9', product: 'ERP', date: '2026-10-02', value: 60, substatus: 'integrado', kind: 'order' }] },
      exited: { count: 1, value: 40, items: [{ id: 'PED-8', orderId: 'PED-8', account: 'Conta 8', product: 'RH', date: null, value: 40, substatus: 'integrado', kind: 'order' }] },
      won: { count: 0, value: 0, items: [] },
      lost: { count: 0, value: 0, items: [] },
      postponed: null,
    },
  }
  const linhas = newNameMovementRows(model, orders)
  const porChave = Object.fromEntries(linhas.map(linha => [linha.movement, linha]))
  assert.equal(porChave.Entrou.delta, 60)
  assert.equal(porChave.Entrou.branch, 'Filial Norte')
  assert.equal(porChave.Saiu.delta, -40)
  assert.equal(porChave.Saiu.branch, '—')
})
