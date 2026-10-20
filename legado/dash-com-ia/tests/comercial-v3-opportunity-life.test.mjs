import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const Module = require('node:module')
const ts = require('typescript')
Module._extensions['.ts'] = (mod, filename) => {
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  mod._compile(output, filename)
}

const { COMMERCIAL_SNAPSHOT } = require('../src/features/comercial-v3/mock-data.ts')
const { TEST_SNAPSHOT } = require('../src/features/comercial-v3/test-data.ts')
const { selectOpportunityLife: select } = require('../src/features/comercial-v3/opportunity-life.ts')

test('ações preservam os eventos, ordenam por instante e não inventam autoria ou resultado', () => {
  const life = select(COMMERCIAL_SNAPSHOT, 'opp-002', 'month')

  assert.equal(life.opportunityId, 'opp-002')
  assert.equal(life.accountLabel, 'Banco Iota')
  assert.equal(life.actionsAvailability, 'available')
  assert.deepEqual(life.actions.map(({ at, label, registeredBy }) => ({ at, label, registeredBy })), [
    { at: '2026-09-09T10:00:00-04:00', label: 'Movimento: Saiu', registeredBy: null },
    { at: '2026-09-02T10:00:00-04:00', label: 'Entrou no forecast oficial', registeredBy: null },
  ])
  assert.equal(new Set(life.actions.map(({ id }) => id)).size, 2)
  assert.ok(life.actions.every((action) => !('result' in action) && !('kind' in action) && !('cause' in action)))
})

test('ID e recorte filtram o detalhe sem associar pelo nome da conta', () => {
  for (const id of ['', 'opp-inexistente', 'Banco Iota', '2']) {
    assert.equal(select(COMMERCIAL_SNAPSHOT, id, 'month'), null)
  }
  assert.equal(select(COMMERCIAL_SNAPSHOT, 'opp-002', 'month', { branch: 'RS', solution: 'all' }), null)
  assert.equal(select(COMMERCIAL_SNAPSHOT, 'opp-002', 'month', { branch: 'all', solution: 'HCM' }), null)
  assert.ok(select(COMMERCIAL_SNAPSHOT, 'opp-002', 'month', { branch: 'SP', solution: 'ERP' }))
  assert.ok(select(COMMERCIAL_SNAPSHOT, 'opp-002', 'month', { branch: 'all', solution: 'all' }))
})

test('filtro vazio fornecido não libera uma oportunidade fora de um recorte válido', () => {
  assert.equal(select(COMMERCIAL_SNAPSHOT, 'opp-002', 'month', { branch: '', solution: 'all' }), null)
  assert.equal(select(COMMERCIAL_SNAPSHOT, 'opp-002', 'month', { branch: 'all', solution: '' }), null)
})

test('o período seleciona a própria população e não reutiliza o detalhe do mês', () => {
  const snapshot = structuredClone(COMMERCIAL_SNAPSHOT)
  snapshot.periods.quarter.forecastOpportunities = []

  assert.equal(select(snapshot, 'opp-002', 'quarter'), null)
  assert.ok(select(snapshot, 'opp-002', 'month'))
  assert.equal(select(snapshot, 'opp-002', 'inexistente'), null)
  assert.equal(select(null, 'opp-002', 'month'), null)
})

test('ausência de amostras de compromissos não significa ausência de atividade real', () => {
  for (const opportunityId of ['opp-002', 'opp-003']) {
    const life = select(COMMERCIAL_SNAPSHOT, opportunityId, 'month')

    assert.deepEqual(life.commitments, [])
    assert.equal(life.commitmentsAvailability, 'unavailable')
    assert.equal(life.nextCommitment, null)
    assert.equal(life.provenance.commitmentsSource, null)
    assert.match(life.provenance.notice, /indisponível/i)
  }
})

test('compromissos são exemplos explícitos para uma única oportunidade com responsável existente', () => {
  const life = select(TEST_SNAPSHOT, 'opp-005', 'month', { branch: 'Senior Filial SP', solution: 'ERP' })

  assert.equal(life.opportunityId, 'opp-005')
  assert.equal(life.accountLabel, 'Cooperativa Mu')
  assert.equal(life.commitmentsAvailability, 'demo')
  assert.deepEqual(life.commitments.map(({ kind }) => kind), ['call', 'meeting', 'visit', 'cross'])
  assert.deepEqual(life.commitments.map(({ at }) => at), [
    '2026-09-21T09:00:00-04:00',
    '2026-09-22T14:00:00-04:00',
    '2026-09-23T10:00:00-04:00',
    '2026-09-24T15:00:00-04:00',
  ])
  assert.equal(new Set(life.commitments.map(({ id }) => id)).size, 4)
  assert.ok(life.commitments.every((item) => item.id.startsWith('demo-opp-005-')
    && item.opportunityId === 'opp-005'
    && item.responsible === 'Alice Fontes'
    && item.status === 'scheduled'
    && /sintéticos de demonstração; não registros da carteira real/i.test(item.source)))
  assert.equal(life.nextCommitment.kind, 'call')
  assert.equal(life.provenance.isSynthetic, true)
  assert.equal(life.provenance.asOf, '2026-09-19T09:12:00-04:00')
})

test('próximo compromisso usa estritamente o asOf e nunca o relógio da máquina', () => {
  const snapshot = structuredClone(COMMERCIAL_SNAPSHOT)
  snapshot.asOf = '2026-09-21T13:00:00Z'
  assert.equal(select(snapshot, 'opp-005', 'month').nextCommitment.kind, 'meeting')

  snapshot.asOf = '2026-09-25T09:00:00-04:00'
  assert.equal(select(snapshot, 'opp-005', 'month').nextCommitment, null)

  snapshot.asOf = ''
  const unavailable = select(snapshot, 'opp-005', 'month')
  assert.equal(unavailable.provenance.asOf, null)
  assert.equal(unavailable.nextCommitment, null)
})

test('conta complementar permanece indisponível mesmo quando o nome coincide com um realizado', () => {
  const snapshot = structuredClone(COMMERCIAL_SNAPSHOT)
  snapshot.periods.month.forecastOpportunities.find(({ id }) => id === 'opp-002').account = 'Varejo Ômega'
  const life = select(snapshot, 'opp-002', 'month')

  assert.deepEqual(life.relationship, {
    cnpj: null,
    contacts: [],
    availability: 'unavailable',
    winLossHistoryAvailability: 'unavailable',
    contractedProductsAvailability: 'unavailable',
  })
})

test('campos ausentes ficam nulos e histórico vazio permanece indisponível', () => {
  const snapshot = structuredClone(COMMERCIAL_SNAPSHOT)
  const opportunity = snapshot.periods.month.forecastOpportunities.find(({ id }) => id === 'opp-005')
  opportunity.account = ''
  opportunity.executive = ''
  opportunity.history = []
  const life = select(snapshot, 'opp-005', 'month')

  assert.equal(life.accountLabel, null)
  assert.deepEqual(life.actions, [])
  assert.equal(life.actionsAvailability, 'unavailable')
  assert.equal(life.commitments.length, 4)
  assert.ok(life.commitments.every(({ responsible }) => responsible === null))
})

test('ordena ações pelo instante com timezone e conserva registros sem data ou descrição', () => {
  const snapshot = structuredClone(COMMERCIAL_SNAPSHOT)
  snapshot.periods.month.forecastOpportunities.find(({ id }) => id === 'opp-003').history = [
    { at: '2026-09-10T10:00:00Z', label: 'Registro anterior' },
    { at: '', label: '' },
    { at: '2026-09-10T09:00:00-04:00', label: 'Registro recente' },
  ]
  const life = select(snapshot, 'opp-003', 'month')

  assert.deepEqual(life.actions.map(({ label }) => label), ['Registro recente', 'Registro anterior', null])
  assert.equal(life.actions[2].at, null)
})

test('datas exigem calendário válido e fuso explícito sem apagar o registro', () => {
  const cases = [
    { at: '2026-02-30T10:00:00Z', accepted: null, nextKind: null },
    { at: '2026-09-10', accepted: null, nextKind: null },
    { at: '2026-09-10T10:00:00', accepted: null, nextKind: null },
    { at: '2024-02-29T23:59:59-04:00', accepted: '2024-02-29T23:59:59-04:00', nextKind: 'call' },
    { at: '6000-09-10T10:00:00Z', accepted: '6000-09-10T10:00:00Z', nextKind: null },
  ]
  for (const { at, accepted, nextKind } of cases) {
    const snapshot = structuredClone(COMMERCIAL_SNAPSHOT)
    snapshot.asOf = at
    snapshot.periods.month.forecastOpportunities.find(({ id }) => id === 'opp-005').history = [
      { at, label: 'Registro preservado com a data original da fonte' },
    ]
    const life = select(snapshot, 'opp-005', 'month')

    assert.equal(life.actions.length, 1)
    assert.equal(life.actions[0].at, accepted, at)
    assert.equal(life.actions[0].label, 'Registro preservado com a data original da fonte')
    assert.equal(life.provenance.asOf, accepted, at)
    assert.equal(life.nextCommitment?.kind ?? null, nextKind, at)
    assert.equal(snapshot.asOf, at)
  }
})

test('seleção e alteração do resultado não modificam snapshot nem a amostra de demonstração', () => {
  const snapshot = structuredClone(COMMERCIAL_SNAPSHOT)
  const before = structuredClone(snapshot)
  const life = select(snapshot, 'opp-005', 'month')
  life.actions[0].label = 'Alteração isolada do resultado'
  life.commitments[0].subject = 'Alteração isolada do resultado'
  life.commitments[0].responsible = 'Outro responsável'

  assert.deepEqual(snapshot, before)
  const again = select(snapshot, 'opp-005', 'month')
  assert.equal(again.actions[0].label, 'Movimento: Postergou')
  assert.equal(again.commitments[0].subject, 'Ligação de acompanhamento')
  assert.equal(again.commitments[0].responsible, 'Alice Fontes')
})
