import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'

const record = (id, values = {}) => ({ row: id, opportunityId: String(id), orderId: '', accountId: '1', account: `Conta ${id}`, stage: 'Negociação', status: '', classification: '', representative: '', executive: '', ownerGroup: '', forecastDate: '2026-10-12', closingDate: null, conferenceDate: null, predictedValue: 100, closedValue: null, maintenance: null, product: '', module: '', modality: '', ...values })
const calculate = (current, previous, period = 'mês') => calculateForecastMonth(current, previous, '2026-10', '2026-10-14', period)

test('calcula previsto, realizado e movimentos no mês e na semana seg-dom', () => {
  const current = [record(1), record(2, { stage: 'Fechada e Ganha', forecastDate: null, closingDate: '2026-10-13', predictedValue: null, closedValue: 250 }), record(3, { stage: 'Fechada e Perdida', forecastDate: null, closingDate: '2026-10-14', predictedValue: null, closedValue: 50 }), record(5)]
  const result = calculate(current, [record(1), record(4)])
  assert.equal(result.predicted.value, 200)
  assert.equal(result.realized.value, 250)
  assert.equal(result.open, 200)
  assert.equal(result.missing, 200)
  assert.deepEqual(result.entered.records.map(r => r.opportunityId), ['5'])
  assert.deepEqual(result.exited.records.map(r => r.opportunityId), ['4'])
  assert.equal(result.otherExited.count, 1)
  assert.equal(result.projected, 450)
  assert.equal(result.won.count, 1)
  assert.equal(result.lost.count, 1)
  const week = calculate(current, [], 'semana')
  assert.deepEqual(week.period, { start: '2026-10-12', end: '2026-10-18' })
  assert.equal(week.predicted.count, 2)
  assert.equal(week.realized.value, 250)
})

test('classifica postergação e outras saídas pela carga de referência recebida', () => {
  const current = [
    record(7, { forecastDate: '2026-11-12' }),
    record(9, { stage: 'Fechada e Perdida', forecastDate: null, closingDate: '2026-10-13', predictedValue: null, closedValue: 20 }),
  ]
  const result = calculate(current, [record(7), record(8), record(9)])
  assert.deepEqual(result.exited.records.map(r => r.opportunityId), ['7', '8', '9'])
  assert.deepEqual(result.postponed.records.map(r => r.opportunityId), ['7'])
  assert.deepEqual(result.otherExited.records.map(r => r.opportunityId), ['8'])
  assert.equal(result.lost.records[0].opportunityId, '9')
  assert.equal(result.exited.count, result.postponed.count + result.otherExited.count + 1)
})

test('vazio, nulos, datas fora do período e ausência de anterior', () => {
  const result = calculate([record(1, { predictedValue: null, forecastDate: null, closingDate: null }), record(2, { forecastDate: '2026-11-01' })], null)
  assert.equal(result.predicted.count, 0)
  assert.equal(result.predicted.value, 0)
  assert.equal(result.realized.count, 0)
  assert.equal(result.entered, null)
  assert.equal(result.exited, null)
  assert.equal(result.missing, 0)
  assert.equal(calculate([], [], 'mês').lost.count, 0)
})
