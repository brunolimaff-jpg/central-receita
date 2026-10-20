import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Contrato da vertical de drill-down (plano Tasks 6 a 9, l.549-789).
 *
 * Cobre o que as Tasks 6-9 exigem e não é numérico: as telas existem com os nomes
 * do plano, o movimento do Forecast sobrevive ao ida-e-volta pela URL, o detalhe
 * de Oportunidade é tela completa (nunca Sheet/Dialog), o retorno tem rótulo
 * contextual por origem e a sidebar só desabilita o que o plano permite desabilitar.
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

const raiz = fileURLToPath(new URL('..', import.meta.url))
const pastaV3 = join(raiz, 'src', 'features', 'comercial-v3')

function arquivos(diretorio) {
  return readdirSync(diretorio).flatMap((entrada) => {
    const caminho = join(diretorio, entrada)
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho]
  })
}

const fontes = arquivos(pastaV3).filter((caminho) => /\.(ts|tsx)$/.test(caminho))
const conteudo = fontes.map((caminho) => readFileSync(caminho, 'utf8')).join('\n')
const ler = (...partes) => readFileSync(join(pastaV3, ...partes), 'utf8')

const { parseCommercialContext, buildCommercialHref } = require('../src/features/comercial-v3/context.ts')

test('as telas das Tasks 6 a 9 existem com os nomes do plano', () => {
  const exigidos = [
    'agent.ts',
    'screens/agent-screen.tsx',
    'components/agent-briefing.tsx',
    'components/agent-conversation.tsx',
    'screens/forecast-screen.tsx',
    'components/forecast-summary.tsx',
    'components/forecast-movement-list.tsx',
    'components/forecast-opportunity-list.tsx',
    'screens/branch-screen.tsx',
    'components/branch-summary.tsx',
    'components/branch-opportunity-table.tsx',
    'screens/opportunities-screen.tsx',
    'screens/opportunity-screen.tsx',
    'screens/journey-screen.tsx',
    'screens/system-screen.tsx',
    'screens/accounts-screen.tsx',
    'components/opportunity-summary.tsx',
    'components/opportunity-revenue.tsx',
    'components/opportunity-timeline.tsx',
  ]

  const relativos = fontes.map((caminho) =>
    caminho.replace(pastaV3, '').replace(/\\/g, '/').replace(/^\//, ''),
  )
  for (const exigido of exigidos) {
    assert.ok(relativos.includes(exigido), `arquivo ausente na vertical: ${exigido}`)
  }
})

test('a Oportunidade abre como tela completa, nunca em Sheet ou Dialog', () => {
  for (const proibido of ['ui/sheet', 'ui/dialog', 'ui/drawer', 'Sheet', 'DialogContent', 'vaul']) {
    assert.equal(conteudo.includes(proibido), false, `a V3 não pode usar ${proibido}`)
  }
  const tela = ler('screens', 'opportunity-screen.tsx')
  assert.ok(tela.includes('OpportunitySummary'))
  assert.ok(tela.includes('OpportunityRevenue'))
  assert.ok(tela.includes('OpportunityTimeline'))
})

test('a Oportunidade mostra todos os campos exigidos pela Task 9 Step 1', () => {
  const resumo = ler('components', 'opportunity-summary.tsx')
  for (const campo of [
    'Conta',
    'Solução',
    'Executivo',
    'Filial',
    'HEAD',
    'Estágio',
    'Movimento observado',
    'Forecast na foto',
    'Forecast atual',
    'Δ valor',
  ]) {
    assert.ok(resumo.includes(campo), `campo ausente no detalhe: ${campo}`)
  }

  const receita = ler('components', 'opportunity-revenue.tsx')
  assert.ok(receita.includes('OPORTUNIDADE_COPY.recorrente'))
  assert.ok(receita.includes('OPORTUNIDADE_COPY.habilitacao'))
  assert.ok(receita.includes('OPORTUNIDADE_COPY.servicos'))
  // A recorrência é o único componente marcado como destaque visual (Task 9 Step 2).
  assert.equal((receita.match(/destaque: true/g) ?? []).length, 1)

  const historico = ler('components', 'opportunity-timeline.tsx')
  assert.ok(historico.includes('formatarInstante'), 'a timeline precisa formatar o instante do histórico')
})

test('o movimento do Forecast sobrevive ao ida-e-volta pela URL', () => {
  const contexto = parseCommercialContext(
    new URLSearchParams('view=forecast&period=month&solution=ERP&branch=RS&movement=Postergou'),
  )
  assert.equal(contexto.movement, 'Postergou')

  const href = buildCommercialHref('opportunity', contexto, {
    opportunityId: 'opp-005',
    from: 'forecast',
    movement: contexto.movement,
  })
  assert.ok(href.includes('movement=Postergou'), `href sem movimento: ${href}`)
  assert.ok(href.includes('from=forecast'))
  assert.ok(href.includes('op=opp-005'))
  assert.ok(href.includes('solution=ERP') && href.includes('branch=RS'))

  const volta = parseCommercialContext(new URLSearchParams(href.slice(2)))
  assert.equal(volta.movement, 'Postergou')
  assert.equal(volta.from, 'forecast')
  assert.equal(volta.view, 'opportunity')
})

test('movimento inválido não vira recorte e a lista tem view própria', () => {
  assert.equal(parseCommercialContext(new URLSearchParams('view=forecast&movement=Inventado')).movement, undefined)
  assert.equal(
    parseCommercialContext(new URLSearchParams('view=opportunities&branch=PR')).view,
    'opportunities',
  )
  assert.equal(
    parseCommercialContext(new URLSearchParams('view=opportunities&branch=PR')).branch,
    'PR',
  )
})

test('o retorno tem rótulo contextual por origem', () => {
  const copia = ler('copy.ts')
  for (const rotulo of [
    'Voltar à visão executiva',
    'Voltar ao forecast',
    'Voltar à filial',
    'Voltar às oportunidades',
    'Voltar ao agente',
    'Voltar à jornada',
    'Voltar ao sistema de receita',
    'Voltar às contas',
  ]) {
    assert.ok(copia.includes(rotulo), `rótulo de retorno ausente: ${rotulo}`)
  }

  const tela = ler('screens', 'opportunity-screen.tsx')
  assert.ok(tela.includes('VOLTAR_POR_ORIGEM'), 'o detalhe precisa usar o retorno contextual')
})

test('a sidebar liga as novas telas e mantém Relatórios e Explorar pendentes', () => {
  const sidebar = ler('components', 'commercial-sidebar.tsx')
  assert.ok(sidebar.includes("view: 'opportunities'"), 'Oportunidades precisa ser navegável')
  assert.ok(sidebar.includes("view: 'journey'"), 'Jornada precisa ser navegável')
  assert.ok(sidebar.includes("view: 'system'"), 'Sistema de Receita precisa ser navegável')
  assert.ok(sidebar.includes("view: 'accounts'"), 'Contas precisa ser navegável')
  assert.ok(sidebar.includes("aria-disabled=\"true\""), 'itens pendentes precisam de aria-disabled')
  for (const pendente of ['Relatórios', 'Explorar']) {
    assert.ok(sidebar.includes(pendente), `item ausente na sidebar: ${pendente}`)
  }
  assert.ok(sidebar.includes("view: 'home'") && sidebar.includes("view: 'forecast'"))
})

test('as telas novas declaram escopo demonstrativo e reaproveitam dados V3', () => {
  const jornada = ler('screens', 'journey-screen.tsx')
  const sistema = ler('screens', 'system-screen.tsx')
  const contas = ler('screens', 'accounts-screen.tsx')

  assert.ok(jornada.includes('Demonstrativo fixo'), 'a jornada conceitual precisa declarar o mock fixo')
  assert.ok(jornada.includes('TopOpportunitiesTable'), 'a jornada deve expor oportunidades do recorte V3')
  assert.ok(jornada.includes('VOLTAR_POR_ORIGEM.home'), 'a Jornada deve voltar para a Visão Executiva')
  assert.ok(jornada.includes('filterOpportunityRows') && jornada.includes('query'))
  assert.ok(jornada.includes('Win') && jornada.includes('Pedido'), 'Win e Pedido precisam continuar separados')
  assert.ok(sistema.includes('KpiStrip') && sistema.includes('BranchRail'))
  assert.ok(contas.includes('Cenário simulado'), 'Contas precisa declarar o escopo do mock')
  assert.ok(contas.includes('selectAccountGroups') && contas.includes('query'), 'Contas precisa agrupar clientes e aplicar a busca')
  assert.ok(contas.includes("from: 'accounts'"), 'o detalhe precisa voltar a Contas')
  assert.ok(contas.includes('Cliente indisponível'), 'campos ausentes precisam ter estado explícito')
})

test('a lista de Oportunidades tem busca própria e a Home não perde o q', () => {
  const lista = ler('screens', 'opportunities-screen.tsx')
  assert.ok(lista.includes('type="search"'), 'a lista precisa de campo de busca')
  assert.ok(lista.includes('OPORTUNIDADES_COPY.buscaLabel'))
  assert.ok(lista.includes('nav.onListQuery'))

  const app = ler('commercial-v3-app.tsx')
  assert.ok(app.includes("searchParams.get('busca')"), 'a busca da lista precisa viver na URL')
  assert.ok(app.includes('onListQuery'))
})

test('o agente divulga o estado local e não faz rede nem writeback', () => {
  const conversa = ler('components', 'agent-conversation.tsx')
  assert.ok(conversa.includes('AGENTE_COPY.rodape'))
  assert.ok(ler('copy.ts').includes('Preview local · respostas simuladas · nenhuma alteração é gravada.'))

  for (const proibido of ['fetch(', 'axios', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'async ']) {
    assert.equal(conteudo.includes(proibido), false, `a V3 não pode conter ${proibido}`)
  }
})

test('a filial sem seleção não escolhe filial automaticamente', () => {
  const tela = ler('screens', 'branch-screen.tsx')
  assert.ok(tela.includes('ALL_FILTERS'), 'o estado "Todas as filiais" precisa ser tratado')
  assert.ok(tela.includes('BranchTiles'), 'a visão de Filiais precisa oferecer os tiles')
  assert.ok(tela.includes('FILIAIS_COPY.desconhecidaTitulo'))
  assert.ok(tela.includes('FILIAIS_COPY.voltar'), 'o estado vazio precisa da CTA de volta')
})

test('a raiz segue compondo só o app V3 e nada do legado entrou', () => {
  const pagina = readFileSync(join(raiz, 'src', 'app', 'page.tsx'), 'utf8')
  assert.ok(pagina.includes('features/comercial-v3/commercial-v3-app'))
  assert.equal(pagina.includes('revenue-home'), false)
  assert.equal(pagina.includes('components/central'), false)
})
