import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

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

const {
  DEFAULT_COMMERCIAL_CONTEXT,
  buildCommercialHref,
  parseCommercialContext,
} = require('../src/features/comercial-v3/context.ts')
const { globalSearchDestination, sidebarViewFor } = require('../src/features/comercial-v3/nav.ts')

test('contexto padrão da Visão Comercial é home/mês/todos', () => {
  assert.deepEqual(parseCommercialContext(new URLSearchParams('')), {
    view: 'home',
    period: 'month',
    solution: 'all',
    branch: 'all',
  })
  assert.deepEqual(DEFAULT_COMMERCIAL_CONTEXT, {
    view: 'home',
    period: 'month',
    solution: 'all',
    branch: 'all',
  })
})

test('lê a URL sem descartar nenhum filtro ativo', () => {
  const contexto = parseCommercialContext(
    new URLSearchParams('view=agent&period=month&solution=ERP&branch=SP'),
  )
  assert.deepEqual(contexto, {
    view: 'agent',
    period: 'month',
    solution: 'ERP',
    branch: 'SP',
  })
})

test('lê op e from quando presentes', () => {
  const contexto = parseCommercialContext(
    new URLSearchParams('view=opportunity&period=quarter&solution=HCM&branch=RS&op=opp-001&from=forecast'),
  )
  assert.equal(contexto.opportunityId, 'opp-001')
  assert.equal(contexto.from, 'forecast')
  assert.equal(contexto.period, 'quarter')
  assert.equal(contexto.solution, 'HCM')
  assert.equal(contexto.branch, 'RS')
})

test('monta href preservando período, solução, filial, op e origem', () => {
  const contexto = parseCommercialContext(
    new URLSearchParams('view=agent&period=month&solution=ERP&branch=SP'),
  )
  assert.equal(
    buildCommercialHref('opportunity', contexto, { opportunityId: 'opp-001', from: 'home' }),
    '/?view=opportunity&period=month&solution=ERP&branch=SP&op=opp-001&from=home',
  )
})

test('filtros no valor padrão são omitidos sem perder informação', () => {
  const href = buildCommercialHref('home', { period: 'month', solution: 'all', branch: 'all' })
  assert.equal(href, '/?view=home&period=month')
  assert.deepEqual(
    parseCommercialContext(new URLSearchParams(href.slice(2))),
    { view: 'home', period: 'month', solution: 'all', branch: 'all' },
  )
})

test('view e período inválidos caem em home e month', () => {
  const contexto = parseCommercialContext(
    new URLSearchParams('view=inventada&period=decada&solution=ERP&branch=MG'),
  )
  assert.equal(contexto.view, 'home')
  assert.equal(contexto.period, 'month')
  assert.equal(contexto.solution, 'ERP')
  assert.equal(contexto.branch, 'MG')
})

test('origem inválida não vira origem', () => {
  const contexto = parseCommercialContext(new URLSearchParams('view=opportunity&from=inventada&op='))
  assert.equal(contexto.from, undefined)
  assert.equal(contexto.opportunityId, undefined)
  assert.deepEqual(Object.keys(contexto).sort(), ['branch', 'period', 'solution', 'view'])
})

test('filial permanece independente de qualquer campo de HEAD', () => {
  const comHead = parseCommercialContext(new URLSearchParams('branch=SP&head=Rafael+Nunes&headFilial=MG'))
  assert.equal(comHead.branch, 'SP')
  assert.deepEqual(Object.keys(comHead).sort(), ['branch', 'period', 'solution', 'view'])

  const soHead = parseCommercialContext(new URLSearchParams('head=Rafael+Nunes'))
  assert.equal(soHead.branch, 'all')
})

test('filtros vazios ou em branco voltam para all', () => {
  const contexto = parseCommercialContext(new URLSearchParams('solution=&branch=%20%20'))
  assert.equal(contexto.solution, 'all')
  assert.equal(contexto.branch, 'all')
})

test('as áreas preservam filtros, busca e retorno na URL', () => {
  for (const view of ['journey', 'system', 'accounts', 'new-name', 'cross']) {
    const href = buildCommercialHref(
      view,
      {
        period: 'quarter',
        solution: 'ERP',
        branch: 'RS',
        query: 'Grupo Sul',
        busca: 'pedido integrado',
        movement: 'Postergou',
      },
      { from: view },
    )
    const params = new URLSearchParams(href.slice(2))
    assert.equal(parseCommercialContext(params).view, view)
    assert.equal(parseCommercialContext(params).period, 'quarter')
    assert.equal(parseCommercialContext(params).solution, 'ERP')
    assert.equal(parseCommercialContext(params).branch, 'RS')
    assert.equal(params.get('from'), view)
    assert.equal(params.get('q'), 'Grupo Sul')
    assert.equal(params.get('busca'), 'pedido integrado')
    assert.equal(params.get('movement'), 'Postergou')
  }
})

test('o menu acompanha a origem do detalhe de oportunidade e cai para Home sem origem no menu', () => {
  for (const view of ['journey', 'system', 'accounts', 'new-name', 'cross', 'forecast', 'opportunities']) {
    assert.equal(sidebarViewFor('opportunity', view), view)
  }
  assert.equal(sidebarViewFor('opportunity', 'agent'), 'home')
  assert.equal(sidebarViewFor('opportunity'), 'home')
  assert.equal(sidebarViewFor('branch'), 'home')
  assert.equal(sidebarViewFor('branch', 'system'), 'system')
  assert.equal(sidebarViewFor('agent'), null)
})

test('busca global mantém áreas com resultados e envia views sem busca para Oportunidades', () => {
  assert.equal(globalSearchDestination('journey'), 'journey')
  assert.equal(globalSearchDestination('home'), 'opportunities')
  assert.equal(globalSearchDestination('opportunities'), 'opportunities')
  assert.equal(globalSearchDestination('system'), 'opportunities')
  assert.equal(globalSearchDestination('forecast'), 'opportunities')
  assert.equal(globalSearchDestination('opportunity'), 'opportunities')
  assert.equal(globalSearchDestination('accounts'), 'accounts')
  assert.equal(globalSearchDestination('new-name'), 'new-name')
  assert.equal(globalSearchDestination('cross'), 'cross')
})
