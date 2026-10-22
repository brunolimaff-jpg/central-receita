import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { ambienteLocal, bancoSinteticoLocal, ehMetaDaCentral } from '../scripts/central-runtime.mjs'

test('o ambiente dos launchers aponta sempre para o SQLite sintético do projeto', () => {
  assert.equal(bancoSinteticoLocal, 'file:../db/custom.db')
  assert.equal(ambienteLocal({ PATH: 'preservado' }).DATABASE_URL, bancoSinteticoLocal)
  assert.equal(ambienteLocal({ DATABASE_URL: bancoSinteticoLocal }).DATABASE_URL, bancoSinteticoLocal)
})

test('os launchers recusam origem de banco diferente sem revelar o valor configurado', () => {
  const origemSensivel = 'file:../outro-cliente/database.db'
  assert.throws(() => ambienteLocal({ DATABASE_URL: origemSensivel }), (erro) => {
    assert.match(erro.message, /somente o SQLite sintético local/i)
    assert.equal(erro.message.includes(origemSensivel), false)
    return true
  })
})

test('o endpoint só é reutilizado quando assina a Central e os dados sintéticos', () => {
  const esperado = {
    produto: 'Central de Receita',
    tipo_dados: 'sinteticos',
    versao: 'v1.0.0-mock',
    contagens: {
      contas: 30,
      oportunidades: 97,
      acoes: 678,
      compromissos: 98,
      propostas: 66,
      ocorrencias: 0,
      qics: 0,
      concorrentes: 0,
      pedidos: 15,
    },
  }
  assert.equal(ehMetaDaCentral(esperado), true)
  assert.equal(ehMetaDaCentral({ status: 'ok' }), false)
  assert.equal(ehMetaDaCentral({ ...esperado, tipo_dados: 'corporativos' }), false)
  assert.equal(ehMetaDaCentral({ ...esperado, contagens: { ...esperado.contagens, oportunidades: '97' } }), false)
})

test('os launchers locais usam Turbopack no checkout sincronizado pelo OneDrive', () => {
  const devLocal = readFileSync(new URL('../scripts/dev-local.mjs', import.meta.url), 'utf8')
  const iniciarCentral = readFileSync(new URL('../scripts/start-central-local.mjs', import.meta.url), 'utf8')
  for (const launcher of [devLocal, iniciarCentral]) {
    assert.match(launcher, /--turbo/)
    assert.doesNotMatch(launcher, /--webpack/)
  }
})
