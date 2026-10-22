import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { historyEntry, trajectorySnapshotFrom, trajectorySnapshotForWorkspace } from '../src/features/comercial-v3/trajectory-snapshot.ts'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const month = today.slice(0, 7)

function rec(overrides = {}) {
  return {
    row: 1, opportunityId: '1', orderId: '', accountId: '10', account: 'Conta teste', stage: 'Negociação',
    status: '', classification: '', representative: 'Unidade', executive: 'Executivo', ownerGroup: '',
    forecastDate: today, closingDate: null, conferenceDate: null, predictedValue: 1000, closedValue: null,
    maintenance: null, product: '', module: '', modality: '', ...overrides,
  }
}

const snapshotOf = (current, previous = null) => trajectorySnapshotFrom(
  calculateForecastMonth(current, previous, month, today, 'mês'),
  previous ? calculateForecastMonth(previous, null, month, today, 'mês') : null,
)

test('no modo local, a entrada nova do histórico carrega o snapshot da carga', () => {
  const entry = historyEntry({
    at: `${today}T13:02:00.000Z`, referenceDate: today, sources: ['Oportunidades.xlsx'],
    snapshot: snapshotOf([rec({ predictedValue: 12000 })], [rec({ predictedValue: 15000 })]),
  })
  assert.deepEqual(entry, {
    at: `${today}T13:02:00.000Z`, referenceDate: today, sources: ['Oportunidades.xlsx'],
    snapshot: { forecastTotal: 12000, entered: 0, exited: 0, changed: -3000, realized: 0 },
  })
})

test('sem snapshot, a entrada continua válida e apenas omite o campo', () => {
  const entry = historyEntry({ at: `${today}T13:02:00.000Z`, referenceDate: today, sources: ['Pedidos.xlsx'], snapshot: null })
  assert.deepEqual(entry, { at: `${today}T13:02:00.000Z`, referenceDate: today, sources: ['Pedidos.xlsx'] })
  assert.equal('snapshot' in entry, false)
})

/* ---------- Produtor real do workspace (mesmo caminho do cliente local) ---------- */

const batch = (kind, { hash = 'a', referenceDate = today, records = [rec()] } = {}) => ({
  kind, records, issues: [], errorCount: 0, warningCount: 0, filename: `${kind}.xlsx`,
  hash: hash.repeat(64), sheet: 'Sheet1', referenceDate,
  stats: { records: records.length, opportunities: records.length, orders: records.length, accounts: records.length, integratedOrders: 0, sourceNewOrders: 0 },
})

test('só pedidos mudou: a foto de oportunidades preservada não gera snapshot', () => {
  const opportunities = batch('opportunities', { referenceDate: '2026-10-20' })
  const current = { opportunities, orders: batch('orders', { hash: 'b', referenceDate: '2026-09-30' }) }
  assert.equal(trajectorySnapshotForWorkspace(current, { opportunities }), null)
})

test('oportunidades com conteúdo novo geram snapshot; a competência é a da própria foto', () => {
  const previous = { opportunities: batch('opportunities', { referenceDate: '2026-10-20' }) }
  const current = { opportunities: batch('opportunities', { hash: 'c', referenceDate: '2026-09-30', records: [rec({ forecastDate: '2026-09-20', predictedValue: 700 })] }) }
  const snapshot = trajectorySnapshotForWorkspace(current, previous)
  assert.equal(snapshot.forecastTotal, 700)
  assert.equal(snapshot.entered, null, 'setembro contra outubro não inventa movimento')
})

test('mesmo hash com nova referência confirmada de oportunidades é foto nova', () => {
  const previous = { opportunities: batch('opportunities', { referenceDate: '2026-10-20' }) }
  const current = { opportunities: batch('opportunities', { referenceDate: '2026-10-21' }) }
  assert.notEqual(trajectorySnapshotForWorkspace(current, previous), null)
})

test('mesmo hash e mesma referência não duplicam o ponto', () => {
  const opportunities = batch('opportunities', { referenceDate: '2026-10-20' })
  assert.equal(trajectorySnapshotForWorkspace({ opportunities }, { opportunities }), null)
})

test('sem oportunidades no workspace não há snapshot; null continua null', () => {
  assert.equal(trajectorySnapshotForWorkspace({ opportunities: null }, null), null)
  const prev = { opportunities: batch('opportunities', { referenceDate: '2026-10-20' }) }
  const current = { opportunities: batch('opportunities', { hash: 'c', referenceDate: '2026-10-20', records: [rec({ predictedValue: null })] }) }
  assert.equal(trajectorySnapshotForWorkspace(current, prev).forecastTotal, null)
})
