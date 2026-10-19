import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { horizonMonths } from '../src/features/comercial-v3/pipeline-model.ts'
import { isNewNameOpportunity } from '../src/features/comercial-v3/new-name-model.ts'
import { normalizeImport } from '../src/features/comercial-v3/manual-import.ts'
import { validateRecord } from '../backend/worker.js'

const record = (id, values = {}) => ({ row: id + 1, opportunityId: String(id), orderId: '', accountId: '1', account: `Conta ${id}`, stage: 'Negociação', status: '', classification: '', representative: '', executive: '', ownerGroup: '', forecastDate: '2026-10-12', closingDate: null, conferenceDate: null, predictedValue: 100, closedValue: null, maintenance: null, product: '', module: '', modality: '', ...values })

test('com probabilidade na carga, o forecast aplica o corte de 75%', () => {
  const current = [record(1, { probability: 0.75 }), record(2, { probability: 0.5 }), record(3, { probability: null }), record(4, { probability: 0.9 })]
  const result = calculateForecastMonth(current, null, '2026-10', '2026-10-14', 'mês')
  assert.equal(result.probabilityAvailable, true)
  assert.deepEqual(result.predicted.records.map(r => r.opportunityId), ['1', '4'])
  assert.equal(result.open, 200)
})

test('sem coluna de probabilidade, o corte não se aplica e a tela é avisada', () => {
  const result = calculateForecastMonth([record(1), record(2)], null, '2026-10', '2026-10-14', 'mês')
  assert.equal(result.probabilityAvailable, false)
  assert.equal(result.predicted.count, 2)
})

test('Em aberto mais Realizado fecha o Previsto para o mês', () => {
  const current = [record(1), record(2, { stage: 'Fechada e Ganha', forecastDate: null, closingDate: '2026-10-03', predictedValue: null, closedValue: 40 })]
  const result = calculateForecastMonth(current, null, '2026-10', '2026-10-14', 'mês')
  assert.equal(result.projected, result.open + result.realized.value)
})

test('importação lê "Prob." como fração de 0 a 1, aceitando percentual', () => {
  const header = ['Oportunidade ID', 'Conta ID', 'Conta', 'Etapa', 'Previsão de Fechamento', 'Efetivação do Fechamento', 'Valor Previsto', 'Valor Fechado', 'Representante', 'Prob.']
  const batch = normalizeImport('opportunities', [header, ['10', '1', 'A', 'Proposta', '2026-10-20', '', 100, '', 'R', 0.8], ['11', '2', 'B', 'Proposta', '2026-10-20', '', 100, '', 'R', 75], ['12', '3', 'C', 'Proposta', '2026-10-20', '', 100, '', 'R', '']])
  assert.equal(batch.errorCount, 0)
  assert.deepEqual(batch.records.map(r => r.probability), [0.8, 0.75, null])
})

test('servidor aceita registro com e sem probabilidade e recusa valor fora de 0 a 1', () => {
  const base = record(5)
  assert.equal(Object.hasOwn(validateRecord(base, 'opportunities'), 'probability'), false)
  assert.equal(validateRecord({ ...base, probability: 0.75 }, 'opportunities').probability, 0.75)
  assert.throws(() => validateRecord({ ...base, probability: 75 }, 'opportunities'))
})

test('horizonte do pipeline não pula mês quando a referência cai no dia 31', () => {
  assert.deepEqual(horizonMonths('2026-01-31'), ['2026-01', '2026-02', '2026-03', '2026-04'])
  assert.deepEqual(horizonMonths('2026-11-30'), ['2026-11', '2026-12', '2027-01', '2027-02'])
})

test('oportunidade sem classificação não conta como New Name', () => {
  assert.equal(isNewNameOpportunity(record(1, { classification: '' })), false)
  assert.equal(isNewNameOpportunity(record(1, { classification: 'Novo' })), true)
  assert.equal(isNewNameOpportunity(record(1, { classification: 'Base' })), false)
})
