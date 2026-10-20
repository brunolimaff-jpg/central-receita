import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Contrato da primeira dobra da Home (plano Task 4 Step 1, l.381-384):
 * copy aprovada do hero, exatamente um CTA primário `Abrir agente`, KPIs na
 * ordem contratada e a Home composta pelos blocos das duas dobras.
 *
 * Nota: a fundação exporta a copy do hero como `HERO_COPY` em `copy.ts`
 * (não existe `COMMERCIAL_COPY` no checkout); o contrato é o mesmo — a
 * implementação precisa referenciar a copy central, sem repetir string literal.
 */

const raiz = fileURLToPath(new URL('..', import.meta.url))
const pastaV3 = join(raiz, 'src', 'features', 'comercial-v3')

function arquivos(diretorio) {
  return readdirSync(diretorio).flatMap((entrada) => {
    const caminho = join(diretorio, entrada)
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho]
  })
}

const ler = (...partes) => readFileSync(join(pastaV3, ...partes), 'utf8')
const conteudoV3 = arquivos(pastaV3)
  .filter((caminho) => /\.(ts|tsx)$/.test(caminho))
  .map((caminho) => readFileSync(caminho, 'utf8'))
  .join('\n')

const copia = ler('copy.ts')
const hero = ler('components', 'agent-hero.tsx')
const home = ler('screens', 'home-screen.tsx')

test('saudação e ações da Home vivem centralizadas em copy.ts', () => {
  for (const frase of [
    'Bom dia, Giovanne',
    'Briefing de hoje',
    'Principais movimentos e sinais do período.',
    'Abrir agente comercial',
  ]) {
    assert.ok(copia.includes(frase), `copy aprovada ausente: ${frase}`)
  }
})

test('a Home centraliza saudação e entrada no agente após compactar os sinais', () => {
  assert.ok(home.includes('HOME_COPY.greeting'))
  assert.ok(home.includes('HOME_COPY.agentCta'))
  // O comportamento do recorte e dos sinais é verificado pelo render real em home-scope-ui.
})

test('existe exatamente um CTA primário de entrada no agente em toda a V3', () => {
  const ocorrencias = conteudoV3.split('Abrir agente comercial').length - 1
  assert.equal(ocorrencias, 1)
})

test('os KPIs aparecem na ordem contratada', () => {
  const ordem = ['Meta do mês', 'Realizado', 'Forecast oficial', 'Forecast atual', 'Δ vs. meta']
  const posicoes = ordem.map((rotulo) => copia.indexOf(`'${rotulo}'`))
  posicoes.forEach((posicao, indice) => {
    assert.ok(posicao >= 0, `rótulo de KPI ausente: ${ordem[indice]}`)
  })
  for (let indice = 1; indice < posicoes.length; indice += 1) {
    assert.ok(
      posicoes[indice - 1] < posicoes[indice],
      `ordem de KPI violada entre ${ordem[indice - 1]} e ${ordem[indice]}`,
    )
  }
})

test('a Home resume os indicadores, trajetória, briefing e filiais sem repetir tabelas e distribuição', () => {
  for (const bloco of [
    'AgentHero',
    'KpiStrip',
    'BranchRail',
  ]) {
    assert.ok(home.includes(bloco), `bloco ausente na Home: ${bloco}`)
  }
  for (const removido of ['HomeOriginSummary', 'TopOpportunitiesTable', 'MonthHighlights']) {
    assert.equal(home.includes(removido), false, `a Home não deve repetir ${removido}`)
  }
  for (const area of ["['Contas', 'accounts']", "['New Name', 'new-name']", "['Cross', 'cross']"]) {
    assert.ok(home.includes(area), `atalho da Home ausente: ${area}`)
  }
  assert.ok(home.includes('HeroBriefingCard'), 'a primeira dobra mantém o briefing lateral')
  assert.ok(hero.includes('WeeklyForecastScene') && hero.includes('asOf'), 'o hero precisa da leitura semanal e da data do snapshot')
})
