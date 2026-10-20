import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Contrato de fonte da V3 (plano Task 3 Step 5, l.341-350).
 *
 * Garante que a V3 não reintroduz `Todos os HEADs`, mantém `Todas as filiais`
 * como filtro organizacional e que a raiz `/` não volta a importar as telas do
 * dashboard legado.
 */

const raiz = fileURLToPath(new URL('..', import.meta.url))
const pastaV3 = join(raiz, 'src', 'features', 'comercial-v3')

function arquivos(diretorio) {
  return readdirSync(diretorio).flatMap((entrada) => {
    const caminho = join(diretorio, entrada)
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho]
  })
}

const fontesV3 = arquivos(pastaV3).filter((caminho) => /\.(ts|tsx)$/.test(caminho))
const conteudoV3 = fontesV3.map((caminho) => readFileSync(caminho, 'utf8')).join('\n')
const paginaRaiz = readFileSync(join(raiz, 'src', 'app', 'page.tsx'), 'utf8')

test('a V3 existe como feature isolada com arquivos de tela', () => {
  assert.ok(fontesV3.length >= 15, `esperado o pacote V3 completo, encontrado ${fontesV3.length} arquivos`)
  assert.ok(fontesV3.some((caminho) => caminho.endsWith('commercial-v3-app.tsx')))
  assert.ok(fontesV3.some((caminho) => caminho.endsWith('screens\\home-screen.tsx') || caminho.endsWith('screens/home-screen.tsx')))
})

test('o filtro organizacional é Todas as filiais e Todos os HEADs não existe', () => {
  assert.ok(conteudoV3.includes('Todas as filiais'), 'a V3 precisa manter `Todas as filiais`')
  assert.equal(conteudoV3.includes('Todos os HEADs'), false, 'a V3 não pode conter `Todos os HEADs`')
})

test('a raiz `/` compõe apenas o app V3', () => {
  assert.ok(paginaRaiz.includes('features/comercial-v3/commercial-v3-app'))
  assert.equal(paginaRaiz.includes('revenue-home'), false, 'a raiz não pode importar a Home V2')
  assert.equal(paginaRaiz.includes('components/central'), false, 'a raiz não pode importar o legado')
})

test('a V3 não importa legado nem o Sheet de detalhe', () => {
  assert.equal(conteudoV3.includes('revenue-home'), false)
  assert.equal(conteudoV3.includes('components/central'), false)
  assert.equal(conteudoV3.includes('ui/sheet'), false, 'a oportunidade abre como tela completa, não em Sheet')
})

test('o detalhe de Oportunidade da V3 não alcança o caminho legado de Sheet', () => {
  // Plano Task 9 Step 5 (l.773-775): o Sheet legado continua no repositório, mas a
  // V3 não pode entrar nele. Nenhuma tela V3 monta painel lateral nem importa o
  // componente legado de detalhe; o detalhe é `view=opportunity` em tela cheia.
  const app = readFileSync(join(pastaV3, 'commercial-v3-app.tsx'), 'utf8')
  assert.ok(app.includes("view === 'opportunity'"), 'a raiz precisa rotear o detalhe como tela')
  assert.ok(app.includes('OpportunityScreen'))
  for (const legado of ['Sheet', 'DetailSheet', 'OpportunitySheet', 'opportunity-sheet']) {
    assert.equal(conteudoV3.includes(legado), false, `caminho legado de Sheet na V3: ${legado}`)
  }
})

test('a raiz roteia todas as telas da vertical sem criar rota nova', () => {
  const app = readFileSync(join(pastaV3, 'commercial-v3-app.tsx'), 'utf8')
  for (const tela of [
    'HomeScreen',
    'AgentScreen',
    'ForecastScreen',
    'OpportunitiesScreen',
    'BranchScreen',
    'OpportunityScreen',
  ]) {
    assert.ok(app.includes(tela), `tela não roteada na raiz: ${tela}`)
  }
  assert.equal(app.includes('ViewPending'), false, 'a superfície provisória foi substituída pelas telas reais')
})

test('a sidebar expõe exatamente os rótulos aprovados', () => {
  for (const rotulo of [
    'Visão Executiva',
    'Forecast',
    'Oportunidades',
    'Contas',
    'Relatórios',
    'Explorar',
  ]) {
    assert.ok(conteudoV3.includes(rotulo), `rótulo ausente na navegação: ${rotulo}`)
  }
})
