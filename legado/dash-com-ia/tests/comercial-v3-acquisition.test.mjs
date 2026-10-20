import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const Module = require('node:module')
const ts = require('typescript')
Module._extensions['.ts'] = (mod, filename) => {
  const source = readFileSync(filename, 'utf8')
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  mod._compile(output, filename)
}

const raiz = fileURLToPath(new URL('..', import.meta.url))
const feature = `${raiz}/src/features/comercial-v3`
const ler = (...partes) => readFileSync(`${feature}/${partes.join('/')}`, 'utf8')
const { selectOriginExamples } = require('../src/features/comercial-v3/acquisition.ts')
const { buildCommercialHref, parseCommercialContext } = require('../src/features/comercial-v3/context.ts')

const rows = [
  { rank: 1, id: 'nn-1', account: 'Conta Alfa', solution: 'HCM', executive: 'Ana', head: null, branch: 'SP', movement: 'Entrou', delta: 0.3, recurring: 0.2, current: 0.3, prev: 0 },
  { rank: 2, id: 'cross-1', account: 'Conta Beta', solution: 'ERP', executive: 'Beto', head: null, branch: 'RS', movement: null, delta: 0, recurring: 0.4, current: 0.4, prev: 0.4 },
]
const details = new Map([
  ['nn-1', { stage: 'Proposta', origin: 'New Name' }],
  ['cross-1', { stage: 'Negociação', origin: 'Cross' }],
])

test('amostras usam o rótulo dos dados de teste sem reclassificar oportunidades', () => {
  assert.deepEqual(selectOriginExamples(rows, details, '', 'New Name'), [rows[0]])
  assert.deepEqual(selectOriginExamples(rows, details, 'beta', 'Cross'), [rows[1]])
  assert.deepEqual(selectOriginExamples(rows, details, 'beta', 'New Name'), [])
})

test('recortes vazios e detalhes ausentes não fabricam amostras', () => {
  assert.deepEqual(selectOriginExamples([], details, '', 'Cross'), [])
  assert.deepEqual(selectOriginExamples(rows, new Map(), '', 'New Name'), [])
  assert.deepEqual(selectOriginExamples(rows, details, 'não existe', 'Cross'), [])
})

test('ida ao detalhe e retorno preservam filtros, buscas e a origem da área', () => {
  for (const view of ['new-name', 'cross']) {
    const state = { period: 'quarter', solution: 'ERP', branch: 'RS', query: 'Conta Beta', busca: 'proposta' }
    const detalheHref = buildCommercialHref('opportunity', state, { opportunityId: 'cross-1', from: view })
    const detalheParams = new URLSearchParams(detalheHref.slice(2))
    const detalhe = parseCommercialContext(detalheParams)

    assert.equal(detalhe.from, view)
    assert.equal(detalhe.opportunityId, 'cross-1')
    assert.equal(detalhe.period, state.period)
    assert.equal(detalhe.solution, state.solution)
    assert.equal(detalhe.branch, state.branch)
    assert.equal(detalheParams.get('q'), state.query)
    assert.equal(detalheParams.get('busca'), state.busca)

    const retornoHref = buildCommercialHref(view, state)
    const retornoParams = new URLSearchParams(retornoHref.slice(2))
    assert.equal(retornoParams.get('view'), view)
    assert.equal(retornoParams.get('q'), state.query)
    assert.equal(retornoParams.get('busca'), state.busca)
    assert.equal(retornoParams.get('solution'), state.solution)
    assert.equal(retornoParams.get('branch'), state.branch)
  }
})

test('as duas áreas declaram indisponibilidade real e exibem retorno e drill próprios', () => {
  const newName = ler('screens', 'new-name-screen.tsx')
  const cross = ler('screens', 'cross-screen.tsx')
  const table = ler('components', 'acquisition-example-table.tsx')

  assert.match(newName, /Fonte independente pendente/)
  assert.equal((newName.match(/Classificação indisponível/g) ?? []).length, 1)
  assert.match(newName, /fonte independente/i)
  assert.match(newName, /nav\.href\('home'\)/)
  assert.match(cross, /Condição de cliente/)
  assert.match(cross, /Produto ou módulo novo/)
  assert.match(cross, /Representante executivo/)
  assert.match(cross, /Upsell/)
  assert.equal((cross.match(/Classificação indisponível/g) ?? []).length, 1)
  assert.match(cross, /Grupo econômico, canal e origem informada/)
  assert.match(cross, /nav\.href\('home'\)/)
  assert.match(table, /Não há exemplos demonstrativos neste recorte/)
  assert.doesNotMatch(`${newName}\n${cross}\n${table}`, /fixture|\bmock\b/i)
  assert.doesNotMatch(table, /Classificação indisponível|Rótulo/)
  assert.match(table, /\['Conta', 'Solução', 'Executivo', 'Estágio', 'Forecast atual'\]/)
  assert.match(table, /nav\.href\('opportunity', \{ opportunityId: row\.id, from: view \}\)/)
})
