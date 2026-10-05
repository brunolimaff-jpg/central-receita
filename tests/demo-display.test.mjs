import test from 'node:test'
import assert from 'node:assert/strict'

let display
try {
  display = await import('../src/features/comercial-v3/demo-display.ts')
} catch {
  display = null
}

test('detalhe da filial preserva os totais reais e a ausência de dados', () => {
  assert.ok(display, 'o presenter da demo precisa existir')

  const model = {
    meta: 1.5,
    realizado: 0.9,
    forecastAtual: 1.2,
    atingimento: 0.6,
  }
  const real = {
    branch: 'Senior Filial SPI',
    meta: 10,
    realizado: 1.3,
    forecastAtual: 1.4,
    atingimento: 0.13,
    missing: [],
  }

  assert.deepEqual(display.branchSummaryValues(model, real), {
    meta: 10,
    realizado: 1.3,
    forecastAtual: 1.4,
    atingimento: 0.13,
    missing: [],
    source: 'real',
  })

  assert.deepEqual(
    display.branchSummaryValues(model, { ...real, meta: 0, forecastAtual: 0, missing: ['meta', 'forecastAtual'] }),
    {
      meta: null,
      realizado: 1.3,
      forecastAtual: null,
      atingimento: null,
      missing: ['meta', 'forecastAtual'],
      source: 'real',
    },
  )
})

test('semana sem fechamento não apresenta forecast como realizado', () => {
  assert.ok(display, 'o presenter da demo precisa existir')
  assert.equal(display.weekForecastValue({ closed: false, forecast: 10.2 }), null)
  assert.equal(display.weekForecastValue({ closed: true, forecast: 10.2 }), 10.2)
})

test('rótulos da demo são adequados ao Site hospedado', () => {
  assert.ok(display, 'o presenter da demo precisa existir')
  assert.equal(display.FORECAST_OFFICIAL_LABEL, 'Forecast oficial')
  assert.doesNotMatch(display.AGENT_DEMO_FOOTER, /local/i)
  assert.doesNotMatch(display.AGENT_DEMO_SNAPSHOT, /local/i)
})
