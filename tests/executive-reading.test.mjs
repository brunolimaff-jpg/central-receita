import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseImportCsv } from '../src/features/comercial-v3/manual-import-csv.ts'
import { normalizeImport } from '../src/features/comercial-v3/manual-import.ts'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { forecastMovementRows, groupMovements } from '../src/features/comercial-v3/movement-rows.ts'
import { calculateNewNameModel } from '../src/features/comercial-v3/new-name-model.ts'
import { forecastFocusFromHash, forecastHashFor, HASH_FORECAST, HASH_FORECAST_GANHOU } from '../src/features/comercial-v3/forecast-focus.ts'

/**
 * Leitura separada e navegação da Visão Executiva.
 *
 * Fixtures sintéticos com data de referência 22/10/2026; a semana vai de 19/10
 * a 25/10. Passam pelo importador real, então também provam que o CSV de
 * validação visual é aceito pelo produto.
 */

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')
const referenceDate = '2026-10-22'
const month = '2026-10'

const oportunidades = normalizeImport('opportunities', parseImportCsv(fixture('oportunidades-sinteticas-20261022.csv')))
const pedidos = normalizeImport('orders', parseImportCsv(fixture('pedidos-sinteticos-20261022.csv')))

test('fixtures sintéticos entram sem erro de leitura', () => {
  assert.equal(oportunidades.errorCount, 0)
  assert.equal(pedidos.errorCount, 0)
  assert.equal(oportunidades.records.length, 5)
  assert.equal(pedidos.records.length, 4)
})

test('Forecast no mês mantém ganho, aberto elegível e perda; a semana recorta só o movimento', () => {
  const mensal = calculateForecastMonth(oportunidades.records, null, month, referenceDate, 'mês')
  assert.equal(mensal.realized.value, 6500)
  assert.equal(mensal.predicted.value, 7500)
  assert.equal(mensal.projected, 14000)
  assert.equal(mensal.open, 7500)
  assert.equal(mensal.won.value, 6500)
  assert.equal(mensal.lost.value, 900)

  const semanal = calculateForecastMonth(oportunidades.records, null, month, referenceDate, 'semana')
  assert.equal(semanal.realized.value, 2500)
  assert.equal(semanal.predicted.value, 1500)
  // Sem carga anterior, Entrou e Saiu continuam desconhecidos — nunca zero.
  assert.equal(semanal.entered, null)
  assert.equal(semanal.exited, null)
})

test('cartões de movimento do Forecast no mês e na semana batem com o recorte', () => {
  const cartoes = [
    { key: 'Entrou', labels: ['Entrou'] },
    { key: 'Saiu', labels: ['Saiu', 'Postergou'] },
    { key: 'Ganhou', labels: ['Ganhou'] },
    { key: 'Perdeu', labels: ['Perdeu'] },
  ]
  const mensal = calculateForecastMonth(oportunidades.records, null, month, referenceDate, 'mês')
  const gruposMes = groupMovements(forecastMovementRows(mensal, oportunidades.records), cartoes)
  assert.equal(gruposMes.find(g => g.key === 'Ganhou').value, 6500)
  assert.equal(gruposMes.find(g => g.key === 'Ganhou').count, 2)
  assert.equal(gruposMes.find(g => g.key === 'Perdeu').value, -900)
  assert.equal(gruposMes.find(g => g.key === 'Entrou').count, 0)
  assert.equal(mensal.entered, null)

  const semanal = calculateForecastMonth(oportunidades.records, null, month, referenceDate, 'semana')
  const gruposSemana = groupMovements(forecastMovementRows(semanal, oportunidades.records), cartoes)
  assert.equal(gruposSemana.find(g => g.key === 'Ganhou').value, 2500)
  assert.equal(gruposSemana.find(g => g.key === 'Ganhou').count, 1)
  assert.equal(gruposSemana.find(g => g.key === 'Perdeu').value, 0)
})

test('New Name separa pedido conferido do não conferido e não inventa contagem', () => {
  const mensal = calculateNewNameModel({ orders: pedidos.records, referenceDate })
  assert.equal(mensal.indicators.orders, 3)
  assert.equal(mensal.indicators.newAccounts, 3)
  assert.equal(mensal.indicators.realizedCount, 2)
  assert.equal(mensal.indicators.realizedAccounts, 2)
  assert.equal(mensal.indicators.realizedValue, 1700)
  assert.equal(mensal.indicators.maintenanceTotal, 2500)
  assert.equal(mensal.unclassifiedOrders, 1)

  const semanal = calculateNewNameModel({ orders: pedidos.records, referenceDate, period: 'semana' })
  assert.equal(semanal.indicators.orders, 1)
  assert.equal(semanal.indicators.realizedCount, 1)
  assert.equal(semanal.indicators.realizedValue, 500)
})

test('manutenção ausente vira null, nunca zero silencioso', () => {
  const comNulo = pedidos.records.map(record => record.orderId === '9003' ? { ...record, maintenance: null } : record)
  const modelo = calculateNewNameModel({ orders: comNulo, referenceDate })
  assert.equal(modelo.indicators.realizedCount, 2)
  assert.equal(modelo.indicators.realizedValue, null)
})

test('pedidos vazios devolvem zero conhecido, e só de um lado não quebra a leitura', () => {
  const vazio = calculateNewNameModel({ orders: [], referenceDate })
  assert.equal(vazio.indicators.newAccounts, 0)
  assert.equal(vazio.indicators.realizedCount, 0)
  assert.equal(vazio.indicators.realizedValue, 0)
  assert.equal(vazio.orders.length, 0)
  assert.equal(vazio.unclassifiedOrders, 0)

  const soOportunidades = calculateForecastMonth(oportunidades.records, null, month, referenceDate, 'mês')
  assert.equal(soOportunidades.projected, 14000)
})

test('hash do Forecast abre Ganhou no mês e ignora âncoras de outras seções', () => {
  assert.deepEqual(forecastFocusFromHash('#forecast-ganhou'), { movement: 'Ganhou', period: 'mês' })
  assert.deepEqual(forecastFocusFromHash('#forecast'), { movement: null, period: 'mês' })
  assert.equal(forecastFocusFromHash('#new-name'), null)
  assert.equal(forecastFocusFromHash(''), null)
  assert.equal(forecastFocusFromHash(HASH_FORECAST_GANHOU).movement, 'Ganhou')
  assert.equal(forecastFocusFromHash(HASH_FORECAST).movement, null)
})

test('trocar de Ganhou para outro movimento limpa o hash do recorte', () => {
  assert.equal(forecastHashFor('Ganhou'), HASH_FORECAST_GANHOU)
  assert.equal(forecastHashFor('Perdeu'), HASH_FORECAST)
  assert.equal(forecastHashFor('Entrou'), HASH_FORECAST)
  assert.equal(forecastHashFor(null), HASH_FORECAST)
})

test('seleção semanal não publica um link que promete Ganhou no mês', () => {
  assert.equal(forecastHashFor('Ganhou', 'semana'), HASH_FORECAST)
  assert.equal(forecastHashFor('Ganhou', 'mês'), HASH_FORECAST_GANHOU)
})
