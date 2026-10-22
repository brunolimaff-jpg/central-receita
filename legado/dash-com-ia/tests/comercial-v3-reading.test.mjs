import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const Module = require('node:module')
const ts = require('typescript')
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (mod, filename) => {
  mod._compile(ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename)
}
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { COMMERCIAL_SNAPSHOT } = require('../src/features/comercial-v3/mock-data.ts')
const { selectHomeModel } = require('../src/features/comercial-v3/model.ts')
const { KpiStrip } = require('../src/features/comercial-v3/components/kpi-strip.tsx')
const { OriginMix } = require('../src/features/comercial-v3/components/origin-mix.tsx')
const filtros = { period: 'month', solution: 'all', branch: 'all' }

test('resumo conserva diferenças financeiras sem repetir cinco indicadores', () => {
  const { kpis } = selectHomeModel(COMMERCIAL_SNAPSHOT, filtros)
  const html = renderToStaticMarkup(React.createElement(KpiStrip, { kpis, resumo: true }))
  assert.equal((html.match(/<article/g) ?? []).length, 3)
  for (const valor of ['+R$ 3,6 mi', '+R$ 1,8 mi', '-R$ 0,8 mi']) assert.ok(html.includes(valor))
  const vazio = renderToStaticMarkup(React.createElement(KpiStrip, { kpis: [], resumo: true }))
  assert.equal(vazio.includes('NaN'), false)
})

test('New Name e Cross têm valores e bases explícitas, inclusive recorte vazio', () => {
  const { origem } = selectHomeModel(COMMERCIAL_SNAPSHOT, filtros)
  for (const [tipo, valor, percentual] of [['newNames', 'R$ 5,1 mi', '61%'], ['cross', 'R$ 3,3 mi', '39%']]) {
    const html = renderToStaticMarkup(React.createElement(OriginMix, { origem, tipo }))
    assert.ok(html.includes(valor)); assert.ok(html.includes(percentual)); assert.ok(html.includes('R$ 8,4 mi'))
  }
  const vazio = { realizado: 0, newNames: 0, cross: 0, recorrente: 0, habilitacao: 0, servicos: 0 }
  assert.equal(renderToStaticMarkup(React.createElement(OriginMix, { origem: vazio, tipo: 'cross' })).includes('NaN'), false)
})

test('sexta é corte parcial até haver fechamento; datas não atravessam fuso nem virada do mês', () => {
  const sexta = selectHomeModel({ ...COMMERCIAL_SNAPSHOT, asOf: '2026-09-18T23:30:00-04:00' }, filtros)
  assert.equal(sexta.semanas[2].closed, false)
  assert.equal(sexta.semanaAtual, 2)
  const sabado = selectHomeModel({ ...COMMERCIAL_SNAPSHOT, asOf: '2026-09-19T00:00:00-04:00' }, filtros)
  assert.equal(sabado.semanas[2].closed, true)
  const outubro = selectHomeModel({ ...COMMERCIAL_SNAPSHOT, asOf: '2026-10-01T00:00:00-04:00' }, filtros)
  assert.ok(outubro.semanas.every((item) => item.closed))
  for (const item of sabado.semanas) assert.equal(new Date(Date.UTC(2026, 8, item.cutoffDay)).getUTCDay(), 5)
})

test('menu acompanha seções na descida, volta ao início e mantém fallback vazio', () => {
  const { sectionAtOffset } = require('../src/features/comercial-v3/components/commercial-sidebar.tsx')
  const blocos = (deslocamento) => [
    { view: 'home', top: 90 - deslocamento },
    { view: 'forecast', top: 570 - deslocamento },
    { view: 'opportunities', top: 920 - deslocamento },
  ]
  assert.equal(sectionAtOffset(blocos(0)), 'home')
  assert.equal(sectionAtOffset(blocos(449)), 'home')
  assert.equal(sectionAtOffset(blocos(450)), 'forecast')
  assert.equal(sectionAtOffset(blocos(800)), 'opportunities')
  assert.equal(sectionAtOffset(blocos(500)), 'forecast')
  assert.equal(sectionAtOffset(blocos(0)), 'home')
  assert.equal(sectionAtOffset([]), 'home')
})

test('teste híbrido usa filiais reais e mantém a população de oportunidades mock', () => {
  const { TEST_SNAPSHOT, REAL_BRANCH_NAMES, realBranches, REAL_BRANCH_TOTAL } = require('../src/features/comercial-v3/test-data.ts')
  const source = require('../src/features/comercial-v3/real-branches.json')
  assert.equal(source.period, '2026-09')
  assert.equal(source.realizadoMeaning, 'pedidos integrados')
  assert.equal(realBranches().length, 22)
  assert.ok(REAL_BRANCH_TOTAL.forecastAtual === source.total.forecastAtual)
  for (const row of realBranches()) {
    const original = source.branches.find((item) => item.branch === row.branch)
    for (const key of ['meta', 'realizado', 'forecastAtual']) {
      assert.ok(original[key] === null ? row.missing.includes(key) : row[key] === original[key], 'campo real ou ausência deve ser preservado')
    }
    assert.equal(realBranches(row.branch).length, 1)
  }
  assert.equal(realBranches('filial-inexistente').length, 0)
  for (const period of ['month', 'quarter', 'threeMonths']) {
    const antes = COMMERCIAL_SNAPSHOT.periods[period].forecastOpportunities
    const depois = TEST_SNAPSHOT.periods[period].forecastOpportunities
    assert.equal(depois.length, antes.length)
    depois.forEach((row, i) => {
      assert.ok(REAL_BRANCH_NAMES.includes(row.branch))
      for (const key of ['id', 'account', 'forecastOfficial', 'forecastCurrent', 'delta']) assert.ok(row[key] === antes[i][key], 'renomear filial não muda oportunidade mock')
    })
  }
})

test('navegação conserva busca e movimento no caminho até o detalhe e de volta', () => {
  const { buildCommercialHref } = require('../src/features/comercial-v3/context.ts')
  const context = { period: 'month', solution: 'ERP', branch: 'filial de teste', query: 'conta', busca: 'Governo', movement: 'Saiu' }
  const detail = new URL(buildCommercialHref('opportunity', context, { from: 'forecast', opportunityId: 'opp-002' }), 'http://localhost')
  const back = new URL(buildCommercialHref('forecast', context), 'http://localhost')
  for (const params of [detail.searchParams, back.searchParams]) {
    assert.equal(params.get('busca'), 'Governo'); assert.equal(params.get('q'), 'conta'); assert.equal(params.get('movement'), 'Saiu'); assert.equal(params.get('solution'), 'ERP')
  }
})
