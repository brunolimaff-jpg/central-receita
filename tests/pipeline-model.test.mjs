import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPipelineOverview, horizonMonths, isOpenStage } from '../src/features/comercial-v3/pipeline-model.ts'

const record = (id, values = {}) => ({ row: id, opportunityId: String(id), orderId: '', accountId: '1', account: `Conta ${id}`, stage: 'Negociação', status: '', classification: '', representative: '', executive: '', ownerGroup: '', forecastDate: '2026-10-20', closingDate: null, conferenceDate: null, predictedValue: 100, closedValue: null, maintenance: null, product: '', module: '', modality: '', ...values })
const reference = '2026-10-14'

test('etapas fechadas saem da carteira aberta; lista customizada de etapas fecha outras', () => {
  const records = [record(1), record(2, { stage: 'Fechada e Ganha', forecastDate: null, predictedValue: null, closedValue: 500 }), record(3, { stage: 'Cancelada pelo cliente' })]
  const overview = buildPipelineOverview(records, reference)
  assert.deepEqual(overview.open.map(r => r.opportunityId), ['1', '3'])
  const custom = buildPipelineOverview(records, reference, ['Fechada e Ganha', 'Cancelada pelo cliente'])
  assert.deepEqual(custom.open.map(r => r.opportunityId), ['1'])
  assert.equal(isOpenStage(''), false)
})

test('agregado por etapa soma valor, ordena por valor e propaga nulo', () => {
  const overview = buildPipelineOverview([
    record(1, { stage: 'Qualificação' }),
    record(2, { stage: 'Qualificação', predictedValue: 50 }),
    record(3, { stage: 'Proposta', predictedValue: 900 }),
    record(4, { stage: 'Qualificação', predictedValue: null }),
  ], reference)
  assert.deepEqual(overview.byStage, [
    { stage: 'Proposta', count: 1, value: 900 },
    { stage: 'Qualificação', count: 3, value: null },
  ])
})

test('horizonte cobre o mês de referência mais três meses, sem vazar para fora', () => {
  const overview = buildPipelineOverview([
    record(1),
    record(2, { forecastDate: '2026-11-30' }),
    record(3, { forecastDate: '2027-01-05' }),
    record(4, { forecastDate: '2027-02-01' }),
  ], reference)
  assert.deepEqual(horizonMonths(reference), ['2026-10', '2026-11', '2026-12', '2027-01'])
  assert.deepEqual(overview.horizon, [
    { month: '2026-10', count: 1, value: 100 },
    { month: '2026-11', count: 1, value: 100 },
    { month: '2026-12', count: 0, value: 0 },
    { month: '2027-01', count: 1, value: 100 },
  ])
  // Fevereiro de 2027 fica fora do horizonte e fora da soma.
  assert.equal(overview.horizon.reduce((sum, month) => sum + month.count, 0), 3)
})

test('sem previsão e previsão vencida ficam separadas; vencida compara com a referência', () => {
  const overview = buildPipelineOverview([
    record(1, { forecastDate: null }),
    record(2, { forecastDate: '2026-10-13' }),
    record(3, { forecastDate: reference }),
    record(4, { stage: 'Fechada e Perdida', forecastDate: null }),
  ], reference)
  assert.deepEqual(overview.withoutForecast.map(r => r.opportunityId), ['1'])
  assert.deepEqual(overview.overdue.map(r => r.opportunityId), ['2'])
})

test('maiores oportunidades ordenam por valor com nulos por último; vazio não quebra', () => {
  const overview = buildPipelineOverview([
    record(1, { predictedValue: 10 }),
    record(2, { predictedValue: 700 }),
    record(3, { predictedValue: null }),
  ], reference)
  assert.deepEqual(overview.largest.map(r => r.opportunityId), ['2', '1', '3'])
  const empty = buildPipelineOverview([], reference)
  assert.deepEqual(empty.open, [])
  assert.deepEqual(empty.byStage, [])
  assert.deepEqual(empty.withoutForecast, [])
  assert.deepEqual(empty.overdue, [])
  assert.equal(empty.horizon[0].count, 0)
})
