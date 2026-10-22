import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTrajectory, montarPonte, ponteReconcilia } from '../src/features/comercial-v3/trajectory-model.ts'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { resumoViraPonto, trajectorySnapshotFrom } from '../src/features/comercial-v3/trajectory-snapshot.ts'

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

test('tolerância de R$ 0,01: resíduo de ±0,01 publica; ±0,011 não publica', () => {
  // Componentes constantes somam 500; os totais variam para deixar resíduo conhecido.
  const componentes = { entrou: 800, saiu: -400, alterou: 100 }
  const casos = [
    { totalAtual: 1500.01, resíduo: 0.01, publicada: true },
    { totalAtual: 1499.99, resíduo: -0.01, publicada: true },
    { totalAtual: 1500.011, resíduo: 0.011, publicada: false },
    { totalAtual: 1499.989, resíduo: -0.011, publicada: false },
  ]
  for (const { totalAtual, resíduo, publicada } of casos) {
    const args = { totalAnterior: 1000, totalAtual, ...componentes }
    assert.equal(ponteReconcilia(args), publicada, `resíduo de ${resíduo}`)
    const ponte = montarPonte(args)
    assert.equal(ponte.publicada, publicada, `lances de resíduo de ${resíduo}`)
    assert.deepEqual(ponte.lances.map(lance => [lance.movimento, lance.valor]),
      publicada ? [['Entrou', 800], ['Saiu', -400], ['Alterou valor', 100]] : [],
      `lances de resíduo de ${resíduo}`)
  }
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

/* ---------- Ticket 05: ponte entre cargas ---------- */

test('ponte com deltas consistentes: publicada e a soma fecha', () => {
  const previous = [
    rec({ opportunityId: '1', predictedValue: 1000 }),
    rec({ opportunityId: '2', predictedValue: 400 }),
  ]
  const current = [
    rec({ opportunityId: '1', predictedValue: 1100 }),
    rec({ opportunityId: '3', predictedValue: 800 }),
  ]
  const { ponte } = build(current, { previous })
  assert.equal(ponte.publicada, true)
  assert.equal(ponte.totalAnterior, 1400)
  assert.equal(ponte.totalAtual, 1900)
  assert.deepEqual(ponte.lances.map(lance => [lance.movimento, lance.valor]), [['Entrou', 800], ['Saiu', -400], ['Alterou valor', 100]])
  assert.equal(ponte.lances.reduce((soma, lance) => soma + lance.valor, 0), ponte.totalAtual - ponte.totalAnterior)
})

test('ponte com delta forjado: não publica e não expõe lances', () => {
  const ponte = montarPonte({ totalAnterior: 1000, totalAtual: 1500, entrou: 800, saiu: -400, alterou: 999 })
  assert.equal(ponte.publicada, false)
  assert.deepEqual(ponte.lances, [])
  assert.equal(ponte.totalAnterior, 1000)
  assert.equal(ponte.totalAtual, 1500)
})

test('ponte com uma carga: não existe', () => {
  assert.equal(build([rec()]).ponte, null)
})

test('ponte com movimento zero: lance omitido, totais presentes', () => {
  const previous = [rec({ opportunityId: '1', predictedValue: 1000 })]
  const current = [rec({ opportunityId: '1', predictedValue: 1000 }), rec({ opportunityId: '2', predictedValue: 300 })]
  const { ponte } = build(current, { previous })
  assert.equal(ponte.publicada, true)
  assert.deepEqual(ponte.lances.map(lance => lance.movimento), ['Entrou'])
  assert.equal(ponte.totalAtual, 1300)
})

test('ponte com valor nulo: não publica', () => {
  const previous = [rec({ opportunityId: '1', predictedValue: null })]
  const { ponte } = build([rec({ opportunityId: '1', predictedValue: 100 })], { previous })
  assert.equal(ponte.publicada, false)
  assert.deepEqual(ponte.lances, [])
})

/* ---------- COR01: C com três pontos na ponte producer → histórico → gate da página ---------- */

const MES = '2026-10'

/** O producer real: `trajectorySnapshotFrom` sobre a régua do forecast. */
const producerSnapshot = (current, previous = null) =>
  trajectorySnapshotFrom(
    calculateForecastMonth(current, previous, MES, REFERENCE_DATE, 'mês'),
    previous ? calculateForecastMonth(previous, null, MES, REFERENCE_DATE, 'mês') : null,
  )

/** Carga 1: sem carga anterior, o movimento fica nulo; previsto e realizado são conhecidos. */
const carga1 = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 110 }),
  rec({ opportunityId: '9', stage: 'Fechada e Ganha', forecastDate: null, predictedValue: null, closedValue: 10, closingDate: '2026-10-05' })]
const carga2 = [rec({ opportunityId: '1', forecastDate: '2026-10-12', predictedValue: 220 }),
  rec({ opportunityId: '9', stage: 'Fechada e Ganha', forecastDate: null, predictedValue: null, closedValue: 20, closingDate: '2026-10-12' })]
const carga3 = [rec({ opportunityId: '1', forecastDate: '2026-10-19', predictedValue: 330 }),
  rec({ opportunityId: '9', stage: 'Fechada e Ganha', forecastDate: null, predictedValue: null, closedValue: 30, closingDate: '2026-10-19' })]

const historicoReal = () => [
  { at: '2026-10-18T10:00:00Z', snapshot: producerSnapshot(carga3, carga2) },
  { at: '2026-10-12T10:00:00Z', snapshot: producerSnapshot(carga2, carga1) },
  { at: '2026-10-05T10:00:00Z', snapshot: producerSnapshot(carga1) },
]

test('COR01: três cargas reais com a primeira sem movimento chegam ao gate da página como C com três pontos', () => {
  const history = historicoReal()
  assert.equal(history[2].snapshot.entered, null, 'a primeira carga mantém movimento nulo')

  // O MESMO gate que a página aplica antes de chamar o modelo.
  const model = build(carga3, { previous: carga2, history: history.filter(entrada => resumoViraPonto(entrada.snapshot)) })
  assert.equal(model.regime, 'C')
  const previsto = pontos(model, 'previsto')
  assert.deepEqual(previsto.map(ponto => ponto.label), ['05/10', '12/10', '18/10'])
  assert.deepEqual(previsto.map(ponto => ponto.forecast), [110, 220, 330])
  assert.deepEqual(pontos(model, 'realizado').map(ponto => ponto.realized), [10, 20, 30])
  assert.equal(model.previsto, 330)
})

test('COR01: carga sem previsto conhecido não vira ponto nem zero; cai para B', () => {
  const semPrevisto = [rec({ opportunityId: '1', forecastDate: '2026-10-12', predictedValue: null })]
  const history = [
    { at: '2026-10-18T10:00:00Z', snapshot: producerSnapshot(carga3, carga2) },
    { at: '2026-10-12T10:00:00Z', snapshot: producerSnapshot(semPrevisto) },
    { at: '2026-10-05T10:00:00Z', snapshot: producerSnapshot(carga1) },
  ]
  assert.equal(history[1].snapshot.forecastTotal, null)
  const validos = history.filter(entrada => resumoViraPonto(entrada.snapshot))
  assert.equal(validos.length, 2, 'carga sem previsto conhecido não vira ponto nem zero')
})

/* ---------- COR02: a comparação é entre cargas do MESMO mês de referência ---------- */

test('COR02: cargas no mesmo mês em dias diferentes comparam normalmente (20/10 e 21/10)', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 1000 })]
  const current = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 1200 })]
  const model = build(current, { previous })
  assert.equal(model.regime, 'B')
  assert.equal(model.ponte.publicada, true)
  assert.equal(model.ponte.totalAnterior, 1000)
  assert.equal(model.ponte.totalAtual, 1200)
  assert.deepEqual(model.ponte.lances.map(lance => [lance.movimento, lance.valor]), [['Alterou valor', 200]])
})

test('COR02: carga anterior de outro mês bloqueia a ponte e não inventa movimentos', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-09-30', predictedValue: 1000 })]
  const current = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 1200 })]
  const model = buildTrajectory({ opportunities: current, previous, previousReferenceDate: '2026-09-30', referenceDate: REFERENCE_DATE, history: [] })
  assert.equal(model.regime, 'B')
  assert.equal(model.ponte.publicada, false)
  assert.deepEqual(model.ponte.lances, [])
  assert.equal(model.previsto, 1200)
})

test('COR02: virada de mês 30/09 → 01/10 bloqueia; 21/10 → 21/10 e 20/10 → 21/10 não', () => {
  const setembro = [rec({ opportunityId: '1', forecastDate: '2026-09-20', predictedValue: 900 })]
  const outubro = [rec({ opportunityId: '1', forecastDate: '2026-10-20', predictedValue: 1000 })]
  assert.equal(buildTrajectory({ opportunities: outubro, previous: setembro, previousReferenceDate: '2026-09-30', referenceDate: REFERENCE_DATE, history: [] }).ponte.publicada, false)

  const vigesimo = [rec({ opportunityId: '1', forecastDate: '2026-10-20', predictedValue: 1000 })]
  const vigesimoPrimeiro = [rec({ opportunityId: '1', forecastDate: '2026-10-20', predictedValue: 1050 })]
  assert.equal(buildTrajectory({ opportunities: vigesimoPrimeiro, previous: vigesimo, previousReferenceDate: '2026-10-21', referenceDate: REFERENCE_DATE, history: [] }).ponte.publicada, true)
})

test('COR02: a referência da carga anterior vem explícita; sem ela, o mês atual continua valendo', () => {
  const anterior = [rec({ opportunityId: '1', forecastDate: '2026-09-20', predictedValue: 1000 })]
  const atual = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 1100 })]
  // Chamadores antigos não passam a referência: o contrato é opcional e mantém o mês atual.
  assert.equal(build(atual, { previous: anterior }).regime, 'B')
  const comParametro = buildTrajectory({ opportunities: atual, previous: anterior, previousReferenceDate: '2026-09-20', referenceDate: REFERENCE_DATE, history: [] })
  assert.equal(comParametro.ponte.publicada, false)
  assert.equal(comParametro.ponte.totalAtual, 1100)
})

test('COR02: mês de referência ausente ou inválido não presume comparação', () => {
  const previous = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 1000 })]
  const current = [rec({ opportunityId: '1', forecastDate: '2026-10-05', predictedValue: 1200 })]
  for (const invalido of ['', '2026-1', 'outubro', '2026-13-01']) {
    const model = buildTrajectory({ opportunities: current, previous, previousReferenceDate: invalido, referenceDate: REFERENCE_DATE, history: [] })
    assert.equal(model.ponte.publicada, false, `referência anterior "${invalido}" não compara`)
  }
})
