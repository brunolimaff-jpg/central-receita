import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const Module = require('node:module')
const ts = require('typescript')
for (const extension of ['.ts', '.tsx']) {
  Module._extensions[extension] = (mod, filename) => {
    const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText
    mod._compile(output, filename)
  }
}

const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { OpportunityScreen } = require('../src/features/comercial-v3/screens/opportunity-screen.tsx')
const { COMMERCIAL_SNAPSHOT } = require('../src/features/comercial-v3/mock-data.ts')
const { selectOpportunityModel } = require('../src/features/comercial-v3/model.ts')

const oportunidade = selectOpportunityModel(
  COMMERCIAL_SNAPSHOT,
  'opp-002',
  'month',
)
const compromisso = {
  id: 'demo-visita',
  opportunityId: 'opp-002',
  kind: 'visit',
  subject: 'Revisar o plano comercial na visita',
  at: '2026-09-18T14:00:00-04:00',
  responsible: 'Responsável da demonstração',
  status: 'scheduled',
  source: 'Exemplos sintéticos de demonstração',
}
const life = {
  id: 'life-opp-002',
  opportunityId: 'opp-002',
  accountLabel: oportunidade.account,
  actions: [{
    id: 'registro-1',
    at: '2026-09-10T10:00:00-04:00',
    label: 'Registro comercial recebido da fonte',
    registeredBy: null,
  }],
  actionsAvailability: 'available',
  commitments: [compromisso],
  commitmentsAvailability: 'demo',
  nextCommitment: compromisso,
  relationship: {
    cnpj: null,
    contacts: [],
    availability: 'unavailable',
    winLossHistoryAvailability: 'unavailable',
    contractedProductsAvailability: 'unavailable',
  },
  provenance: {
    source: 'Snapshot local',
    asOf: '2026-09-17T10:00:00-04:00',
    isSynthetic: true,
    commitmentsSource: 'Exemplos sintéticos de demonstração; não registros da carteira real',
    notice: 'Cenário simulado',
  },
}
const nav = { href: (view) => `/?view=${view}`, branchHref: (branch) => `/?view=branch&branch=${branch}` }
const render = (model, override = {}) => renderToStaticMarkup(createElement(OpportunityScreen, {
  oportunidade: model,
  life,
  nav,
  from: 'opportunities',
  ...override,
}))

test('o detalhe mantém valores e coloca ações e compromissos dentro da oportunidade', () => {
  const html = render(oportunidade)
  assert.ok(html.includes('Forecast atual'))
  assert.ok(html.includes('Composição comercial total'))
  assert.ok(html.includes('Registro comercial recebido da fonte'))
  assert.ok(html.includes('Autor do registro não informado'))
  assert.ok(html.includes('Revisar o plano comercial na visita'))
  assert.ok(html.includes('Agendado'))
  assert.ok(html.includes('Próximo'))
  assert.ok(html.includes('Responsável da demonstração'))
  assert.ok(html.includes('Exemplos sintéticos de demonstração; não registros da carteira real'))
  assert.ok(html.includes('href="#opportunity-actions"'))
  assert.ok(html.includes('href="#opportunity-commitments"'))
  assert.ok(html.includes('<details'))
  assert.ok(!html.includes('<details open'), 'a conta deve começar como contexto opcional')
  assert.ok(html.includes('CNPJ indisponível'))
  assert.ok(html.includes('Contatos indisponíveis'))
  assert.ok(html.includes('Histórico de ganhos e perdas indisponível'))
  assert.ok(html.includes('Produtos contratados indisponíveis'))
})

test('uma agenda indisponível explica a pendência e não afirma ausência de atividade', () => {
  const html = render(oportunidade, {
    life: { ...life, commitments: [], commitmentsAvailability: 'unavailable', nextCommitment: null },
  })
  assert.ok(html.includes('Agenda desta oportunidade indisponível'))
  assert.ok(html.includes('A fonte de compromissos ainda não está conectada'))
  assert.ok(!html.includes('Sem compromisso'))
  assert.ok(!html.includes('Revisar o plano comercial na visita'))
})

test('oportunidade não encontrada não recebe ações ou agenda de outra oportunidade', () => {
  const html = render(null)
  assert.ok(!html.includes('Registro comercial recebido da fonte'))
  assert.ok(!html.includes('Revisar o plano comercial na visita'))
})

test('um modelo de vida de outra oportunidade não vaza para o detalhe atual', () => {
  const html = render(oportunidade, { life: { ...life, opportunityId: 'opp-outra' } })
  assert.ok(!html.includes('Registro comercial recebido da fonte'))
  assert.ok(!html.includes('Revisar o plano comercial na visita'))
})

test('o título identifica a oportunidade e deixa a conta como contexto complementar', () => {
  const html = render(oportunidade)
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, '') ?? ''
  assert.ok(heading.includes('Oportunidade'), `título atual: ${heading}`)
  assert.ok(heading.includes(oportunidade.id), `título atual: ${heading}`)
  assert.ok(html.includes(oportunidade.account), 'o nome da conta continua acessível')
})
