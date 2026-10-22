import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const Module = require('node:module')
const ts = require('typescript')
Module._extensions['.ts'] = (mod, filename) => {
  const source = readFileSync(filename, 'utf8')
  mod._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename)
}
const { buildCommercialHref, parseCommercialContext, commercialReturnHref } = require('../src/features/comercial-v3/context.ts')
const { formatarValorOportunidade } = require('../src/features/comercial-v3/format.ts')
const filters = { period: 'month', solution: 'ERP', branch: 'SP', movement: 'Saiu' }

test('detalhe retorna ao recorte e à origem anterior da lista', () => {
  const origin = '/?view=opportunities&period=month&solution=ERP&branch=SP&from=branch&busca=Banco'
  const detail = buildCommercialHref('opportunity', filters, { opportunityId: 'opp-002', from: 'opportunities', returnTo: origin })
  const context = parseCommercialContext(new URLSearchParams(detail.slice(2)))
  assert.equal(commercialReturnHref(context), origin)
  assert.equal(context.opportunityId, 'opp-002')
})

test('limpar movimento remove explicitamente o filtro, preservando filial e solução', () => {
  const href = buildCommercialHref('forecast', filters, { movement: null })
  const params = new URLSearchParams(href.slice(2))
  assert.equal(params.has('movement'), false)
  assert.equal(params.get('branch'), 'SP')
  assert.equal(params.get('solution'), 'ERP')
})

test('o retorno não aceita domínio externo nem retorno ao próprio detalhe', () => {
  for (const destination of ['https://example.com/', '//example.com/', '/?view=opportunity&op=opp-002', '/?view=inventada']) {
    const context = parseCommercialContext(new URLSearchParams({ view: 'opportunity', period: 'month', from: 'forecast', returnTo: destination }))
    assert.equal(context.returnTo, undefined)
    assert.equal(commercialReturnHref(context), '/?view=forecast&period=month')
  }
})

test('retorno sem origem válida cai na Home, sem criar origem igual ao destino', () => {
  const context = parseCommercialContext(new URLSearchParams('view=opportunity&from=opportunity&branch=SP'))
  assert.equal(commercialReturnHref(context), '/?view=home&period=month&branch=SP')
})

test('valores do detalhe conservam a diferença financeira sem arredondar milhões', () => {
  assert.equal(formatarValorOportunidade(0.9), 'R$ 900.000')
  assert.equal(formatarValorOportunidade(0.75), 'R$ 750.000')
  assert.equal(formatarValorOportunidade(-0.15), '-R$ 150.000')
})
