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

const { alternarVisaoSalva, getServerSnapshotVisoesSalvas, getVisoesSalvas, limparVisoesSalvas } = require('../src/lib/domain/visoes-sessao.ts')

test('atalhos salvos alternam sem duplicar e podem ser limpos na sessão', () => {
  limparVisoesSalvas()
  assert.deepEqual(getVisoesSalvas(), [])
  alternarVisaoSalva('forecast-30')
  alternarVisaoSalva('fila-new-name')
  assert.deepEqual(getVisoesSalvas(), ['forecast-30', 'fila-new-name'])
  alternarVisaoSalva('forecast-30')
  assert.deepEqual(getVisoesSalvas(), ['fila-new-name'])
  limparVisoesSalvas()
  assert.deepEqual(getVisoesSalvas(), [])
})

test('snapshot vazio de sessão mantém identidade estável para React', () => {
  assert.strictEqual(getServerSnapshotVisoesSalvas(), getServerSnapshotVisoesSalvas())
})
