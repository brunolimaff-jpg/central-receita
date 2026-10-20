import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const Module = require('node:module')
const ts = require('typescript')
for (const ext of ['.ts', '.tsx']) {
  Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, file)
}
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { HomeScreen } = require('../src/features/comercial-v3/screens/home-screen.tsx')
const { COMMERCIAL_SNAPSHOT } = require('../src/features/comercial-v3/mock-data.ts')
const { selectHomeModel, selectAgentBriefing } = require('../src/features/comercial-v3/model.ts')
const filters = { period: 'month', solution: 'all', branch: 'SP' }
const nav = { href: (view) => `/?view=${view}`, branchHref: (branch) => `/?view=branch&branch=${branch}` }

test('Home da filial usa uma base demonstrativa e sinais compactos antes do aprofundamento', () => {
  const html = renderToStaticMarkup(createElement(HomeScreen, {
    model: selectHomeModel(COMMERCIAL_SNAPSHOT, filters),
    briefing: selectAgentBriefing(COMMERCIAL_SNAPSHOT, filters),
    asOf: COMMERCIAL_SNAPSHOT.asOf, mes: 'setembro de 2026', nav, realBranchesEnabled: true,
  }))
  assert.ok(html.includes('Status da filial'))
  assert.ok(html.includes('Sinais do recorte comercial'))
  assert.ok(html.includes('view=opportunities'))
  assert.ok(html.includes('view=agent'))
  assert.equal(html.includes('Total consolidado da exportação'), false)
  assert.equal(html.includes('Dados reais · totais por filial'), false)
  assert.ok(html.includes('Trajetória semanal indisponível neste recorte'))
  assert.equal(html.includes('Inspecionar cortes semanais'), false)
})
