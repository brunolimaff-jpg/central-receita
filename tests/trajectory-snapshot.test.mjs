import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { trajectorySnapshotFrom } from '../src/features/comercial-v3/trajectory-snapshot.ts'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const month = today.slice(0, 7)

/** Fábrica do recorte elegível: Proposta/Negociação com previsão no mês. */
function rec(overrides = {}) {
  return {
    row: 1, opportunityId: '1', orderId: '', accountId: '10', account: 'Conta teste', stage: 'Negociação',
    status: '', classification: '', representative: 'Unidade', executive: 'Executivo', ownerGroup: '',
    forecastDate: today, closingDate: null, conferenceDate: null, predictedValue: 1000, closedValue: null,
    maintenance: null, product: '', module: '', modality: '', ...overrides,
  }
}

const won = (overrides = {}) => rec({ stage: 'Fechada e Ganha', closingDate: today, predictedValue: null, closedValue: 4000, ...overrides })

function snapshot(current, previous = null) {
  const now = calculateForecastMonth(current, previous, month, today, 'mês')
  const before = previous === null ? null : calculateForecastMonth(previous, null, month, today, 'mês')
  return trajectorySnapshotFrom(now, before)
}

test('a primeira carga guarda previsto e realizado; o movimento fica nulo sem carga anterior', () => {
  assert.deepEqual(snapshot([rec({ predictedValue: 15000 }), won()]), {
    forecastTotal: 15000, entered: null, exited: null, changed: null, realized: 4000,
  })
})

test('com duas cargas, o snapshot decompõe entrou, saiu (sinalizado) e a variação de quem ficou', () => {
  const previous = [rec({ opportunityId: '1', predictedValue: 15000 }), rec({ opportunityId: '2', predictedValue: 7000 })]
  const current = [rec({ opportunityId: '1', predictedValue: 12000 }), rec({ opportunityId: '3', predictedValue: 5000 }), won()]
  const result = snapshot(current, previous)
  assert.deepEqual(result, {
    forecastTotal: 17000, entered: 5000, exited: -7000, changed: -3000, realized: 4000,
  })
  // A identidade da ponte: total anterior + entrou + saiu + alterou = total atual.
  assert.equal(22000 + result.entered + result.exited + result.changed, result.forecastTotal)
})

test('valor previsto desconhecido contamina o total e a variação; nunca vira zero', () => {
  const previous = [rec({ opportunityId: '1', predictedValue: 15000 })]
  const current = [rec({ opportunityId: '1', predictedValue: null })]
  const result = snapshot(current, previous)
  assert.equal(result.forecastTotal, null)
  assert.equal(result.changed, null)
})

test('valor desconhecido na carga anterior também contamina a variação', () => {
  const previous = [rec({ opportunityId: '1', predictedValue: null })]
  const current = [rec({ opportunityId: '1', predictedValue: 15000 })]
  assert.equal(snapshot(current, previous).changed, null)
})

test('o realizado soma closedValue das ganhas pela closingDate do mês, como o card da Visão Executiva', () => {
  const current = [won({ opportunityId: '1', closedValue: 4000 }), won({ opportunityId: '2', closedValue: 2500, closingDate: '2000-01-10' })]
  assert.equal(snapshot(current).realized, 4000)
})

test('os números ficam em reais, sem conversão de unidade', () => {
  const previous = [rec({ opportunityId: '1', predictedValue: 1500000 })]
  const current = [rec({ opportunityId: '1', predictedValue: 1200000 })]
  const result = snapshot(current, previous)
  assert.equal(result.forecastTotal, 1200000)
  assert.equal(result.changed, -300000)
})

test('carga sem momento anterior com movimento é lida como primeira carga, não como zero', () => {
  const current = [rec({ predictedValue: 15000 })]
  const now = calculateForecastMonth(current, null, month, today, 'mês')
  assert.deepEqual(trajectorySnapshotFrom(now, null), {
    forecastTotal: 15000, entered: null, exited: null, changed: null, realized: 0,
  })
})

/* ---------- COR02: comparar cargas exige o mês de referência de cada uma ---------- */

test('COR02: carga anterior de outro mês não gera movimento: nulo, nunca zero', () => {
  const outubro = [rec({ opportunityId: '1', forecastDate: '2026-10-01', predictedValue: 1000 })]
  const setembro = [rec({ opportunityId: '1', forecastDate: '2026-09-20', predictedValue: 900 })]
  const atual = calculateForecastMonth(outubro, setembro, '2026-10', '2026-10-01', 'mês')
  const anterior = calculateForecastMonth(setembro, null, '2026-09', '2026-09-30', 'mês')
  const resultado = trajectorySnapshotFrom(atual, anterior, '2026-09-30')
  assert.equal(resultado.forecastTotal, 1000)
  assert.equal(resultado.entered, null)
  assert.equal(resultado.exited, null)
  assert.equal(resultado.changed, null)
})

test('COR02: a carga anterior é avaliada no mês dela, não no mês atual', () => {
  const outubro = [rec({ opportunityId: '1', forecastDate: '2026-10-01', predictedValue: 1000 })]
  const setembro = [rec({ opportunityId: '1', forecastDate: '2026-09-20', predictedValue: 900 })]
  // A régua atual continua no mês; a anterior agora é lida no mês dela.
  const atual = calculateForecastMonth(outubro, setembro, '2026-10', '2026-10-01', 'mês')
  const anterior = calculateForecastMonth(setembro, null, '2026-09', '2026-09-30', 'mês')
  assert.equal(anterior.predicted.value, 900, 'setembro é lido em setembro')
  assert.equal(atual.predicted.value, 1000)
})

test('COR02: mesmo mês em dias diferentes compara normalmente (20/10 → 21/10)', () => {
  const anterior = calculateForecastMonth([rec({ opportunityId: '1', forecastDate: '2026-10-20', predictedValue: 1000 })], null, '2026-10', '2026-10-20', 'mês')
  const atual = calculateForecastMonth([rec({ opportunityId: '1', forecastDate: '2026-10-20', predictedValue: 1050 })], [rec({ opportunityId: '1', forecastDate: '2026-10-20', predictedValue: 1000 })], '2026-10', '2026-10-21', 'mês')
  const resultado = trajectorySnapshotFrom(atual, anterior, '2026-10-20')
  assert.equal(resultado.entered, 0)
  assert.equal(resultado.exited, 0)
  assert.equal(resultado.changed, 50)
})
