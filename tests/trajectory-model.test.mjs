import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTrajectory, ponteReconcilia } from '../src/features/comercial-v3/trajectory-model.ts'

const REFERENCE_DATE = '2026-10-20'

/** Fábrica no estilo de movement-rows: um registro de oportunidade por linha da planilha. */
const rec = (overrides = {}) => ({
  row: 1, opportunityId: 'OP-1', orderId: '', accountId: 'C-1', account: 'Conta 1',
  stage: 'Proposta', status: '', classification: '', representative: 'Filial Sul', executive: 'Ana',
  ownerGroup: '', forecastDate: '2026-10-05', closingDate: null, conferenceDate: null,
  predictedValue: 100, closedValue: null, maintenance: null, product: '', module: '', modality: '',
  ...overrides,
})

const build = (opportunities, { previous = null, history = [] } = {}) =>
  buildTrajectory({ opportunities, previous, referenceDate: REFERENCE_DATE, history })

const pontos = (model, kind) => model.series.find(serie => serie.kind === kind)?.points ?? []

test('sem carga: regime vazio e nenhuma série', () => {
  const model = build([])
  assert.equal(model.regime, 'vazio')
  assert.deepEqual(model.series, [])
  assert.deepEqual(model.ticks, [])
  assert.equal(model.previsto, null)
  assert.equal(model.realizado, null)
  assert.equal(model.semData, 0)
})

test('uma carga com três datas distintas: regime A e previsto acumulado crescente em reais', () => {
  const model = build([
    rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 15000 }),
    rec({ opportunityId: '2', forecastDate: '2026-10-12', predictedValue: 25000 }),
    rec({ opportunityId: '3', forecastDate: '2026-10-19', predictedValue: 10000 }),
  ])
  assert.equal(model.regime, 'A')
  assert.equal(model.previsto, 50000)
  assert.equal(model.datado, 50000)
  assert.equal(model.realizado, 0)
  assert.equal(model.semData, 0)
  const previsto = pontos(model, 'previsto')
  assert.deepEqual(previsto.map(ponto => ponto.date), ['2026-10-05', '2026-10-12', '2026-10-19'])
  assert.deepEqual(previsto.map(ponto => ponto.label), ['05/10', '12/10', '19/10'])
  assert.deepEqual(previsto.map(ponto => ponto.forecast), [15000, 40000, 50000])
  assert.deepEqual(model.ticks, ['05/10', '12/10', '19/10'])
})

test('uma de três sem forecastDate: conta em semData e não vira ponto', () => {
  const model = build([
    rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 }),
    rec({ opportunityId: '2', forecastDate: '2026-10-12', predictedValue: 200 }),
    rec({ opportunityId: '3', forecastDate: null, predictedValue: 50 }),
  ])
  assert.equal(model.semData, 1)
  assert.deepEqual(pontos(model, 'previsto').map(ponto => ponto.date), ['2026-10-05', '2026-10-12'])
  assert.equal(model.previsto, 350)
  assert.equal(model.datado, 300)
  const restante = model.series.find(serie => serie.kind === 'restante')
  assert.equal(restante.tracejado, true)
  assert.deepEqual(restante.points.map(ponto => ponto.forecast), [300, 350])
})

test('duas cargas: regime B', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 })]
  const model = build([rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 120 })], { previous })
  assert.equal(model.regime, 'B')
  assert.equal(model.previsto, 120)
})

test('ponte fecha (valores em reais, diferença de R$ 0,00)', () => {
  assert.equal(ponteReconcilia({ totalAnterior: 1000, totalAtual: 1500, entrou: 800, saiu: -400, alterou: 100 }), true)
})

test('ponte com diferença de R$ 0,02 não fecha', () => {
  assert.equal(ponteReconcilia({ totalAnterior: 1000, totalAtual: 1500.02, entrou: 800, saiu: -400, alterou: 100 }), false)
})

test('ponte com um componente nulo não reconcilia: nulo nunca vira zero', () => {
  assert.equal(ponteReconcilia({ totalAnterior: 1000, totalAtual: 1500, entrou: null, saiu: -400, alterou: 100 }), false)
  assert.equal(ponteReconcilia({ totalAnterior: null, totalAtual: 1500, entrou: 800, saiu: -400, alterou: 100 }), false)
  assert.equal(ponteReconcilia({ totalAnterior: 1000, totalAtual: null, entrou: 800, saiu: -400, alterou: 100 }), false)
  assert.equal(ponteReconcilia({ totalAnterior: 1000, totalAtual: 1500, entrou: 800, saiu: null, alterou: 100 }), false)
  assert.equal(ponteReconcilia({ totalAnterior: 1000, totalAtual: 1500, entrou: 800, saiu: -400, alterou: null }), false)
})

test('três cargas com snapshot: regime C e um ponto por carga', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 })]
  const history = [
    { at: '2026-10-18T10:00:00Z', snapshot: { forecastTotal: 120, entered: 0, exited: 0, changed: 0, realized: 0 } },
    { at: '2026-10-12T10:00:00Z', snapshot: { forecastTotal: 110, entered: 0, exited: 0, changed: 0, realized: 0 } },
    { at: '2026-10-05T10:00:00Z', snapshot: { forecastTotal: 100, entered: 0, exited: 0, changed: 0, realized: 0 } },
  ]
  const model = build([rec()], { previous, history })
  assert.equal(model.regime, 'C')
  const previsto = pontos(model, 'previsto')
  assert.equal(previsto.length, 3)
  assert.deepEqual(previsto.map(ponto => ponto.label), ['05/10', '12/10', '18/10'])
  assert.deepEqual(previsto.map(ponto => ponto.forecast), [100, 110, 120])
})

const snapshot = (forecastTotal, realized = 0) => ({ forecastTotal, entered: 0, exited: 0, changed: 0, realized })

test('cinco cargas com duas sem snapshot: três pontos válidos, regime C', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 })]
  const history = [
    { at: '2026-10-09T10:00:00Z', snapshot: snapshot(300, 30) },
    { at: '2026-10-07T10:00:00Z' },
    { at: '2026-10-05T10:00:00Z', snapshot: snapshot(200, 20) },
    { at: '2026-10-03T10:00:00Z' },
    { at: '2026-10-01T10:00:00Z', snapshot: snapshot(100, 10) },
  ]
  const model = build([rec()], { previous, history })
  assert.equal(model.regime, 'C')
  const previsto = pontos(model, 'previsto')
  assert.equal(previsto.length, 3)
  assert.deepEqual(previsto.map(ponto => ponto.label), ['01/10', '05/10', '09/10'])
  assert.deepEqual(previsto.map(ponto => ponto.forecast), [100, 200, 300])
  assert.deepEqual(pontos(model, 'realizado').map(ponto => ponto.realized), [10, 20, 30])
  assert.deepEqual(model.ticks, ['01/10', '05/10', '09/10'])
})

test('três cargas com duas sem snapshot: cai para o regime B', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 })]
  const history = [
    { at: '2026-10-09T10:00:00Z', snapshot: snapshot(300) },
    { at: '2026-10-07T10:00:00Z' },
    { at: '2026-10-05T10:00:00Z' },
  ]
  const model = build([rec()], { previous, history })
  assert.equal(model.regime, 'B')
})

test('quatro cargas com duas sem snapshot: dois pontos válidos ainda não bastam para o regime C', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 })]
  const history = [
    { at: '2026-10-09T10:00:00Z', snapshot: snapshot(300) },
    { at: '2026-10-07T10:00:00Z' },
    { at: '2026-10-05T10:00:00Z', snapshot: snapshot(200) },
    { at: '2026-10-03T10:00:00Z' },
  ]
  const model = build([rec()], { previous, history })
  assert.equal(model.regime, 'B')
})

test('duas cargas no mesmo dia: dois pontos distintos no mesmo X, com a hora no rótulo', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 })]
  const history = [
    { at: '2026-10-05T16:40:00Z', snapshot: snapshot(120, 12) },
    { at: '2026-10-01T09:00:00Z', snapshot: snapshot(80, 8) },
    { at: '2026-10-05T09:10:00Z', snapshot: snapshot(100, 10) },
  ]
  const model = build([rec()], { previous, history })
  assert.equal(model.regime, 'C')
  const previsto = pontos(model, 'previsto')
  assert.equal(previsto.length, 3)
  assert.deepEqual(previsto.map(ponto => ponto.date), ['2026-10-01', '2026-10-05', '2026-10-05'])
  assert.deepEqual(previsto.map(ponto => ponto.label), ['01/10', '05/10 09:10', '05/10 16:40'])
  assert.deepEqual(previsto.map(ponto => ponto.forecast), [80, 100, 120])
  assert.deepEqual(model.ticks, ['01/10', '05/10 09:10', '05/10 16:40'])
})

test('dez cargas: no máximo seis marcas no eixo, primeira e última sempre presentes', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 })]
  const history = Array.from({ length: 10 }, (_, index) => ({
    at: `2026-10-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
    snapshot: snapshot(100 + index),
  }))
  const model = build([rec()], { previous, history })
  assert.equal(model.regime, 'C')
  assert.equal(pontos(model, 'previsto').length, 10)
  assert.equal(model.ticks.length, 6)
  assert.equal(model.ticks[0], '01/10')
  assert.equal(model.ticks.at(-1), '10/10')
  assert.deepEqual(model.ticks, ['01/10', '03/10', '05/10', '06/10', '08/10', '10/10'])
})

test('realizado usa closedValue pela closingDate das oportunidades ganhas', () => {
  const model = build([
    rec({ opportunityId: '1', stage: 'Fechada e Ganha', forecastDate: null, predictedValue: null, closedValue: 4000, closingDate: '2026-10-03' }),
    rec({ opportunityId: '2', stage: 'fechada e ganha', forecastDate: null, predictedValue: null, closedValue: 6000, closingDate: '2026-10-15' }),
    rec({ opportunityId: '3', stage: 'Fechada e Perdida', forecastDate: null, predictedValue: null, closedValue: 9999, closingDate: '2026-10-16' }),
  ])
  assert.equal(model.realizado, 10000)
  const realizado = pontos(model, 'realizado')
  assert.deepEqual(realizado.map(ponto => ponto.date), ['2026-10-03', '2026-10-15'])
  assert.deepEqual(realizado.map(ponto => ponto.realized), [4000, 10000])
  assert.equal(model.previsto, 0)
})

test('valor previsto nulo contamina o acumulado a partir daquele dia, nunca vira zero', () => {
  const model = build([
    rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 100 }),
    rec({ opportunityId: '2', forecastDate: '2026-10-12', predictedValue: null }),
    rec({ opportunityId: '3', forecastDate: '2026-10-19', predictedValue: 50 }),
  ])
  assert.equal(model.previsto, null)
  assert.equal(model.datado, null)
  assert.deepEqual(pontos(model, 'previsto').map(ponto => ponto.forecast), [100, null, null])
})
