import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { historyEntry, trajectorySnapshotFrom } from '../src/features/comercial-v3/trajectory-snapshot.ts'

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
