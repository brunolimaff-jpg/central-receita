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

const { adicionarMensagem, getMensagens, getServerSnapshotMensagens, subscribeMensagens } = require('../src/lib/domain/agente-sessao.ts')

test('conversa compartilhada preserva estado da sessão e notifica os assinantes', () => {
  const inicial = getMensagens()
  assert.equal(inicial.length, 1)
  assert.equal(inicial[0].papel, 'agente')
  assert.strictEqual(getServerSnapshotMensagens(), getServerSnapshotMensagens())

  let notificacoes = 0
  const cancelar = subscribeMensagens(() => { notificacoes += 1 })
  const usuario = adicionarMensagem({ papel: 'usuario', texto: 'O que mudou?' })
  const agente = adicionarMensagem({ papel: 'agente', texto: 'Leitura local.', resposta: undefined })
  cancelar()

  assert.equal(usuario.id, 1)
  assert.equal(agente.id, 2)
  assert.equal(getMensagens().length, 3)
  assert.equal(notificacoes, 2)
})
