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

const { COMMERCIAL_SNAPSHOT } = require('../src/features/comercial-v3/mock-data.ts')
const {
  filterOpportunityRows,
  selectAgentBriefing,
  selectBranchModel,
  selectBranchOptions,
  selectCommercialView,
  selectForecastModel,
  selectHomeModel,
  selectOpportunityModel,
  selectSolutionOptions,
} = require('../src/features/comercial-v3/model.ts')
const { selectOpportunityDetails } = require('../src/features/comercial-v3/opportunity-details.ts')

const MES = { period: 'month', solution: 'all', branch: 'all' }

/** Compara valores monetários em milhões tolerando ruído de ponto flutuante. */
function perto(atual, esperado, tolerancia = 1e-9) {
  assert.ok(
    Math.abs(atual - esperado) <= tolerancia,
    `esperado ${esperado}, recebido ${atual}`,
  )
}

function kpi(modelo, key) {
  const encontrado = modelo.kpis.find((item) => item.key === key)
  assert.ok(encontrado, `KPI ${key} ausente`)
  return encontrado
}

test('fatia mensal padrão reconcilia o contrato congelado', () => {
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)

  perto(kpi(home, 'meta').value, 12.0)
  perto(kpi(home, 'realizado').value, 8.4)
  perto(kpi(home, 'forecastOficial').value, 11.0)
  perto(kpi(home, 'forecastAtual').value, 10.2)
  perto(kpi(home, 'deltaMeta').value, -1.8)

  perto(home.movimentos.net, -0.8)
  perto(home.movimentos.oficial, 11.0)
  perto(home.movimentos.atual, 10.2)

  perto(home.origem.realizado, 8.4)
  perto(home.origem.newNames, 5.1)
  perto(home.origem.cross, 3.3)
  perto(home.origem.recorrente, 6.2)
  perto(home.origem.habilitacao, 1.1)
  perto(home.origem.servicos, 1.1)

  assert.deepEqual(home.kpis.map((item) => item.key), [
    'meta',
    'realizado',
    'forecastOficial',
    'forecastAtual',
    'deltaMeta',
  ])
  assert.equal(kpi(home, 'meta').caption, '100%')
  assert.equal(kpi(home, 'realizado').caption, '70% da meta')
  assert.equal(kpi(home, 'forecastOficial').caption, '92% da meta')
  assert.equal(kpi(home, 'forecastAtual').caption, '-7,3% vs. oficial')
  assert.equal(kpi(home, 'deltaMeta').caption, '-15%')
})

test('movimentos do forecast fecham valor, quantidade e absoluto', () => {
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)
  const { byMovement, grossAbs } = home.movimentos

  perto(byMovement.Saiu.value, -0.9)
  perto(byMovement.Postergou.value, -0.6)
  perto(byMovement['Alterou valor'].value, -0.3)
  perto(byMovement.Entrou.value, 1.0)
  perto(grossAbs, 2.8)
  perto(home.movimentos.net, -0.8)

  const negativo = Object.values(byMovement).filter((item) => item.value < 0)
  assert.equal(negativo.length, 3)
  assert.equal(
    Object.values(byMovement).reduce((total, item) => total + item.count, 0),
    10,
  )

  assert.deepEqual(home.movimentos.steps.map((step) => step.key), [
    'oficial',
    'Saiu',
    'Postergou',
    'Alterou valor',
    'Entrou',
    'atual',
  ])
  perto(home.movimentos.steps[0].value, 11.0)
  perto(home.movimentos.steps[home.movimentos.steps.length - 1].value, 10.2)
})

test('Top 10 ordena por impacto absoluto e explica 78% do movimento', () => {
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)
  const deltas = home.top10.map((linha) => linha.delta)
  const esperados = [0.6, -0.55, 0.384, -0.35, -0.3, -0.2, -0.15, -0.15, -0.1, 0.016]

  assert.equal(deltas.length, 10)
  deltas.forEach((delta, indice) => perto(delta, esperados[indice]))

  for (let indice = 1; indice < deltas.length; indice += 1) {
    assert.ok(
      Math.abs(deltas[indice - 1]) >= Math.abs(deltas[indice]),
      `ordem do Top 10 viola abs(deltaForecast) em ${indice}`,
    )
  }

  assert.ok(deltas.some((delta) => delta > 0), 'Top 10 precisa incluir impacto positivo')
  assert.ok(deltas.some((delta) => delta < 0), 'Top 10 precisa incluir impacto negativo')

  const abs = deltas.map((delta) => Math.abs(delta))
  const top5 = abs.slice(0, 5).reduce((total, valor) => total + valor, 0)
  const todos = abs.reduce((total, valor) => total + valor, 0)
  perto(top5 / todos, 0.78, 1e-9)

  assert.equal(home.top10.map((linha) => linha.rank).join(','), '1,2,3,4,5,6,7,8,9,10')
  assert.ok(
    home.populacaoForecast > home.top10.length,
    'Top 10 não pode ser a população total do forecast',
  )
})

test('filiais reconciliam realizado, meta e forecast atual', () => {
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)
  const porFilial = Object.fromEntries(home.filiais.map((linha) => [linha.branch, linha]))

  const esperado = {
    SP: [2.0, 2.4, 2.0],
    RS: [1.5, 2.0, 1.7],
    MG: [1.2, 1.8, 1.5],
    PR: [0.9, 1.5, 1.2],
    SC: [0.8, 1.2, 1.0],
    GO: [0.7, 1.0, 0.8],
    BA: [0.6, 0.8, 0.7],
    Outras: [0.7, 1.3, 1.3],
  }

  for (const [branch, valores] of Object.entries(esperado)) {
    assert.ok(porFilial[branch], `filial ${branch} ausente no rail`)
    perto(porFilial[branch].realizado, valores[0])
    perto(porFilial[branch].meta, valores[1])
    perto(porFilial[branch].forecastAtual, valores[2])
  }

  perto(home.filiais.reduce((total, linha) => total + linha.realizado, 0), 8.4)
  perto(home.filiais.reduce((total, linha) => total + linha.meta, 0), 12.0)
  perto(home.filiais.reduce((total, linha) => total + linha.forecastAtual, 0), 10.2)
  perto(porFilial.SP.atingimento, 2.0 / 2.4)
})

test('as duas filiais em atenção são as de menor forecast atual sobre meta', () => {
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)
  const coberturas = home.filiais
    .map((linha) => ({ branch: linha.branch, cobertura: linha.forecastAtual / linha.meta }))
    .sort((a, b) => a.cobertura - b.cobertura)

  assert.equal(home.atencao.length, 2)
  assert.deepEqual(
    home.atencao.map((sinal) => sinal.branch).sort(),
    [coberturas[0].branch, coberturas[1].branch].sort(),
  )
  perto(home.atencao[0].cobertura, 0.8, 1e-9)
})

test('semana atual é derivada de snapshot.asOf e das faixas do mock', () => {
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)

  assert.equal(COMMERCIAL_SNAPSHOT.asOf, '2026-09-19T09:12:00-04:00')
  assert.equal(home.semanaAtual, 3)
  assert.deepEqual(
    home.semanas.map((semana) => [semana.week, semana.label, semana.rangeLabel]),
    [
      [1, 'Sem 1', 'Sex, 04/set'],
      [2, 'Sem 2', 'Sex, 11/set'],
      [3, 'Sem 3', 'Sex, 18/set'],
      [4, 'Sem 4', 'Sex, 25/set'],
    ],
  )
  assert.equal(home.semanas.filter((semana) => semana.current).length, 1)
  assert.equal(home.semanas.find((semana) => semana.current).week, 3)
  perto(home.semanas[2].forecast, 10.2)
  perto(home.semanas[3].forecast, kpi(home, 'forecastAtual').value)
  perto(home.semanas[3].pace, 10.0)
})

test('filtro de filial reduz populações sem derivar filial de HEAD', () => {
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, { ...MES, branch: 'SP' })

  perto(kpi(home, 'realizado').value, 2.0)
  perto(kpi(home, 'forecastAtual').value, 2.0)
  assert.equal(home.filiais.length, 1)
  assert.equal(home.filiais[0].branch, 'SP')
  assert.equal(home.populacaoForecast, 3)
  assert.ok(home.top10.every((linha) => linha.branch === 'SP'))

  const completo = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)
  assert.ok(home.populacaoForecast < completo.populacaoForecast)
  assert.ok(kpi(home, 'realizado').value < kpi(completo, 'realizado').value)
})

test('filtro de solução reduz populações e mantém o grão coerente', () => {
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, { ...MES, solution: 'ERP' })
  const completo = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)

  perto(kpi(home, 'realizado').value, 3.99)
  perto(kpi(home, 'forecastAtual').value, 4.4)
  assert.equal(home.populacaoForecast, 7)
  assert.ok(home.populacaoForecast < completo.populacaoForecast)
  assert.ok(kpi(home, 'realizado').value < kpi(completo, 'realizado').value)
  assert.ok(kpi(home, 'forecastAtual').value < kpi(completo, 'forecastAtual').value)
})

test('HEAD nunca é usado para derivar filial', () => {
  const periodo = COMMERCIAL_SNAPSHOT.periods.month
  const filiaisDeclaradas = new Set(periodo.branchTargets.map((alvo) => alvo.branch))

  for (const oportunidade of periodo.forecastOpportunities) {
    assert.ok(filiaisDeclaradas.has(oportunidade.branch))
    if (oportunidade.head) assert.notEqual(oportunidade.head, oportunidade.branch)
  }

  const heads = new Map()
  for (const oportunidade of periodo.forecastOpportunities) {
    if (!oportunidade.head) continue
    heads.set(oportunidade.head, (heads.get(oportunidade.head) ?? new Set()).add(oportunidade.branch))
  }
  assert.ok(
    [...heads.values()].some((filiais) => filiais.size > 1),
    'o mock precisa provar que um HEAD atende mais de uma filial',
  )
})

test('toda oportunidade reconcilia delta e composição de receita', () => {
  const periodo = COMMERCIAL_SNAPSHOT.periods.month

  for (const oportunidade of periodo.forecastOpportunities) {
    perto(oportunidade.delta, oportunidade.forecastCurrent - oportunidade.forecastOfficial)
    perto(
      oportunidade.recurring + oportunidade.enablement + oportunidade.services,
      oportunidade.forecastCurrent,
    )
    if (oportunidade.movement) {
      assert.ok(
        oportunidade.delta !== 0,
        `movimento ${oportunidade.movement} sem impacto em ${oportunidade.id}`,
      )
    } else {
      perto(oportunidade.delta, 0)
    }
  }

  for (const negocio of periodo.realizedDeals) {
    assert.ok(negocio.recurring + negocio.enablement + negocio.services > 0)
  }
})

test('filial desconhecida ou agregada não vira filial escolhida', () => {
  assert.equal(selectBranchModel(COMMERCIAL_SNAPSHOT, 'all', { period: 'month', solution: 'all' }), null)
  assert.equal(selectBranchModel(COMMERCIAL_SNAPSHOT, 'ZZ', { period: 'month', solution: 'all' }), null)

  const sp = selectBranchModel(COMMERCIAL_SNAPSHOT, 'SP', { period: 'month', solution: 'all' })
  assert.ok(sp)
  assert.equal(sp.branch, 'SP')
  perto(sp.meta, 2.4)
  perto(sp.realizado, 2.0)
  perto(sp.forecastAtual, 2.0)
  assert.equal(sp.oportunidades.length, 3)
  assert.ok(sp.oportunidades.every((linha) => linha.branch === 'SP'))
  assert.deepEqual(sp.heads, ['Patrícia Melo'])
})

test('oportunidade desconhecida não inventa detalhe', () => {
  assert.equal(selectOpportunityModel(COMMERCIAL_SNAPSHOT, 'opp-999'), null)
  assert.equal(selectOpportunityModel(COMMERCIAL_SNAPSHOT, ''), null)

  const oportunidade = selectOpportunityModel(COMMERCIAL_SNAPSHOT, 'opp-001')
  assert.ok(oportunidade)
  assert.equal(oportunidade.account, 'Governo Épsilon')
  assert.equal(oportunidade.movement, 'Entrou')
  perto(oportunidade.delta, 0.6)
  assert.ok(oportunidade.history.length >= 2)
  assert.ok(oportunidade.history.every((evento) => evento.at < COMMERCIAL_SNAPSHOT.asOf))
})

test('forecast expõe delta absoluto, percentual e população por movimento', () => {
  const forecast = selectForecastModel(COMMERCIAL_SNAPSHOT, MES)

  perto(forecast.oficial, 11.0)
  perto(forecast.atual, 10.2)
  perto(forecast.deltaAbsoluto, -0.8)
  perto(forecast.deltaPercentual, -0.8 / 11.0)
  assert.equal(forecast.oportunidades.length, 18)
  assert.equal(forecast.porMovimento.Saiu.length, 2)
  assert.equal(forecast.porMovimento.Postergou.length, 3)
  assert.equal(forecast.porMovimento['Alterou valor'].length, 2)
  assert.equal(forecast.porMovimento.Entrou.length, 3)
  perto(forecast.origem.newNames, 5.1)
})

test('briefing do agente reusa o mesmo modelo da Home', () => {
  const briefing = selectAgentBriefing(COMMERCIAL_SNAPSHOT, MES)
  const home = selectHomeModel(COMMERCIAL_SNAPSHOT, MES)

  assert.equal(briefing.tiposNegativos, 3)
  perto(briefing.top5Share, 0.78, 1e-9)
  assert.equal(briefing.atencao.length, 2)
  perto(briefing.deltaOficial, -0.8)
  perto(briefing.deltaMeta, -1.8)
  perto(briefing.origem.newNames, home.origem.newNames)
  perto(briefing.movimentos.grossAbs, home.movimentos.grossAbs)
  assert.deepEqual(briefing.kpis, home.kpis)
})

test('selectCommercialView agrega Home e Forecast do mesmo contexto', () => {
  const visao = selectCommercialView(COMMERCIAL_SNAPSHOT, MES)

  assert.deepEqual(visao.filtros, MES)
  assert.deepEqual(visao.home.kpis, selectHomeModel(COMMERCIAL_SNAPSHOT, MES).kpis)
  assert.deepEqual(
    visao.forecast.oportunidades.map((linha) => linha.id),
    selectForecastModel(COMMERCIAL_SNAPSHOT, MES).oportunidades.map((linha) => linha.id),
  )
})

test('opções de filtro saem do snapshot, não de lista fixa', () => {
  assert.deepEqual(selectSolutionOptions(COMMERCIAL_SNAPSHOT), ['ERP', 'HCM', 'Logística', 'Serviços'])
  assert.deepEqual(selectBranchOptions(COMMERCIAL_SNAPSHOT), [
    'SP',
    'RS',
    'MG',
    'PR',
    'SC',
    'GO',
    'BA',
    'Outras',
  ])
})

test('trimestre e 3 meses existem e mantêm a reconciliação interna', () => {
  for (const period of ['quarter', 'threeMonths']) {
    const home = selectHomeModel(COMMERCIAL_SNAPSHOT, { ...MES, period })
    perto(kpi(home, 'meta').value, kpi(home, 'realizado').value / 0.7, 1e-3)
    perto(kpi(home, 'deltaMeta').value, kpi(home, 'forecastAtual').value - kpi(home, 'meta').value, 1e-6)
    perto(home.origem.realizado, kpi(home, 'realizado').value, 1e-6)
    perto(home.movimentos.oficial - home.movimentos.atual, -home.movimentos.net, 1e-6)
    assert.equal(home.semanas.length, 0)
    assert.equal(home.semanaAtual, null)
    assert.equal(home.populacaoForecast, 18)
  }
})

test('busca textual filtra a população V3 por oportunidade e mantém vazio explícito', () => {
  const rows = selectForecastModel(COMMERCIAL_SNAPSHOT, MES).oportunidades
  const detalhes = selectOpportunityDetails(COMMERCIAL_SNAPSHOT, MES)
  const amostra = rows[0]
  const stage = detalhes.get(amostra.id).stage

  assert.deepEqual(filterOpportunityRows(rows, detalhes, ''), rows)
  assert.ok(filterOpportunityRows(rows, detalhes, amostra.account).some((row) => row.id === amostra.id))
  assert.ok(filterOpportunityRows(rows, detalhes, stage).some((row) => row.id === amostra.id))
  assert.deepEqual(filterOpportunityRows(rows, detalhes, 'termo sem correspondência'), [])
})
