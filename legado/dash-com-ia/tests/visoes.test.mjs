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

const { VISOES_PREDEFINIDAS } = require('../src/lib/domain/visoes.ts')

test('presets apontam para leituras existentes e filtros observados do fixture', () => {
  assert.deepEqual(VISOES_PREDEFINIDAS.map(({ id, destino }) => [id, destino]), [
    ['forecast-30', 'mudancas'],
    ['fila-new-name', 'oportunidades'],
    ['revisao-cross', 'oportunidades'],
    ['resultado-vendas', 'winloss'],
  ])
  assert.deepEqual(VISOES_PREDEFINIDAS[0].contexto, { janelaForecast: 30 })
  assert.deepEqual(VISOES_PREDEFINIDAS[1].contexto, { classificacao: 'New Name / Novo Cliente' })
  assert.deepEqual(VISOES_PREDEFINIDAS[2].contexto, { classificacao: 'Cross / Up Sell' })
  assert.deepEqual(VISOES_PREDEFINIDAS[3].contexto, {})
})
