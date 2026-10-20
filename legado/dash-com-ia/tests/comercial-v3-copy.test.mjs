import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

/**
 * Contrato da copy aprovada da V3 (plano Task 1 Steps 5-6, l.125-133).
 *
 * Fixa as strings acima da dobra aprovadas pela spec §18.1 (l.570-576) e o
 * rótulo do filtro organizacional, garantindo que elas existem em `copy.ts`
 * como fonte única — nenhum componente repete esses literais.
 */

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
  AGENTE_COPY,
  FILTER_LABELS,
  HOME_COPY,
  KPI_LABELS,
  PERIOD_LABELS,
} = require('../src/features/comercial-v3/copy.ts')

test('a Home segue a referência executiva e preserva acesso ao agente', () => {
  assert.equal(HOME_COPY.greeting, 'Bom dia, Giovanne')
  assert.equal(HOME_COPY.briefingTitle, 'Briefing de hoje')
  assert.equal(HOME_COPY.agentCta, 'Abrir agente comercial')
})
test('o filtro organizacional é Todas as filiais', () => {
  assert.equal(FILTER_LABELS.filial, 'Todas as filiais')
  assert.equal(FILTER_LABELS.solucao, 'Todas as soluções')
})

test('períodos e KPIs têm os rótulos contratados', () => {
  assert.deepEqual(PERIOD_LABELS, { month: 'Mês', quarter: 'Trimestre', threeMonths: '3 meses' })
  assert.deepEqual(Object.keys(KPI_LABELS), [
    'meta',
    'realizado',
    'forecastOficial',
    'forecastAtual',
    'deltaMeta',
  ])
  assert.equal(KPI_LABELS.deltaMeta, 'Δ vs. meta')
})

test('o cargo exibido é Diretoria Comercial', () => {
  assert.equal(AGENTE_COPY.cargo, 'Diretoria Comercial')
  assert.equal(AGENTE_COPY.titulo, 'Agente Comercial')
})
