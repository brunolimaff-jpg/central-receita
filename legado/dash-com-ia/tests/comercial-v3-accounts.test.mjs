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

const { selectAccountGroups } = require('../src/features/comercial-v3/accounts-data.ts')
const { buildCommercialHref } = require('../src/features/comercial-v3/context.ts')

function row(id, account, executive, solution = 'ERP', branch = 'SP') {
  return {
    rank: 1,
    id,
    account,
    solution,
    executive,
    head: null,
    branch,
    movement: null,
    delta: 0,
    recurring: 0.1,
    current: 0.2,
    prev: 0.2,
  }
}

test('agrupa pelo nome exato do cliente e mantém responsáveis e oportunidades', () => {
  const rows = [
    row('op-1', 'Grupo Sul', 'Ana'),
    row('op-2', 'Grupo Sul', 'Bruno', 'HCM'),
    row('op-3', 'Grupo Sul Tech', 'Caio'),
  ]
  const grupos = selectAccountGroups(rows, new Map())

  assert.equal(grupos.length, 2)
  assert.deepEqual(grupos.find((grupo) => grupo.account === 'Grupo Sul')?.responsaveis, ['Ana', 'Bruno'])
  assert.deepEqual(grupos.find((grupo) => grupo.account === 'Grupo Sul')?.opportunities.map((opp) => opp.id), ['op-1', 'op-2'])
})

test('busca encontra cliente, responsável, identificador, solução e etapa', () => {
  const rows = [row('op-4', 'Conta Alfa', 'Marina', 'HCM')]
  const details = new Map([['op-4', { stage: 'Proposta', origin: 'Cross' }]])

  for (const termo of ['Conta Alfa', 'Marina', 'op-4', 'HCM', 'proposta']) {
    assert.equal(selectAccountGroups(rows, details, ` ${termo} `).length, 1, termo)
  }
  assert.equal(selectAccountGroups(rows, details, 'cliente inexistente').length, 0)
})

test('recorte e busca vazios produzem estados sem clientes', () => {
  assert.deepEqual(selectAccountGroups([], new Map()), [])
  assert.deepEqual(selectAccountGroups([row('op-5', 'Conta Beta', 'Rafa')], new Map(), 'sem resultado'), [])

  const indisponivel = selectAccountGroups([row('', '', '')], new Map(), 'indisponível')
  assert.equal(indisponivel[0].account, null)
  assert.deepEqual(indisponivel[0].responsaveis, [])
})

test('drill de oportunidade e retorno a Contas preservam filtros, busca e origem', () => {
  const contexto = {
    period: 'quarter',
    solution: 'ERP',
    branch: 'RS',
    query: 'Grupo Sul',
    busca: 'oportunidade 339001',
  }
  const detalhe = buildCommercialHref('opportunity', contexto, { opportunityId: 'op-1', from: 'accounts' })
  const retorno = buildCommercialHref('accounts', contexto, { from: 'accounts' })

  for (const href of [detalhe, retorno]) {
    const params = new URLSearchParams(href.slice(2))
    assert.equal(params.get('period'), 'quarter')
    assert.equal(params.get('solution'), 'ERP')
    assert.equal(params.get('branch'), 'RS')
    assert.equal(params.get('q'), 'Grupo Sul')
    assert.equal(params.get('busca'), 'oportunidade 339001')
    assert.equal(params.get('from'), 'accounts')
  }
  assert.equal(new URLSearchParams(detalhe.slice(2)).get('op'), 'op-1')
})
