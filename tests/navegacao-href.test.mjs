/**
 * Navegação por URL — a camada onde os defeitos de Territórios moraram.
 *
 * Os testes de `territorios.test.mjs` cobrem `nivelDe`, que sempre esteve certo.
 * O que faltava era o `href`: o clique mandava `branch` no `extra`, e
 * `buildCommercialHref` o descartava. Passava o typecheck — a checagem de
 * propriedade excedente não vale para spread — e passavam os 41 testes, porque
 * nenhum tocava esta função.
 *
 * Cada teste aqui corresponde a um caminho que a tela usa de verdade.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCommercialHref, destinoForecastLegado, parseCommercialContext } from '../src/features/comercial-v3/context.ts'
import { nivelDe } from '../src/features/comercial-v3/regional/territorios-model.ts'
import { ALL_FILTERS } from '../src/features/comercial-v3/types.ts'
import { sidebarHref } from '../src/features/comercial-v3/nav.ts'

test('atalhos da Home só usam âncoras das seções presentes', () => {
  const href = view => view === 'forecast' ? '/forecast?period=month' : `/?view=${view}`
  assert.equal(sidebarHref('home', true, href), '#home')
  assert.equal(sidebarHref('new-name', true, href), '#new-name')
  assert.equal(sidebarHref('forecast', true, href), '/forecast?period=month')
  assert.equal(sidebarHref('forecast', false, href), '/forecast?period=month')
  assert.equal(sidebarHref('opportunities', true, href), '/?view=opportunities')
  assert.equal(sidebarHref('diretorias', true, href), '/?view=territorios#diretorias')
  assert.equal(sidebarHref('home', false, href), '/?view=home')
})

const ctx = (extra = {}) => ({ period: 'month', solution: ALL_FILTERS, branch: ALL_FILTERS, ...extra })
const params = href => new URL(href, 'http://localhost').searchParams

test('Forecast tem rota própria sem view nem âncora e preserva filtros e movimento', () => {
  const href = buildCommercialHref('forecast', ctx({ branch: 'Filial fictícia', solution: 'ERP' }), { from: 'home', movement: 'Entrou' })
  assert.ok(href.startsWith('/forecast?'))
  assert.equal(params(href).get('view'), null)
  assert.equal(params(href).get('branch'), 'Filial fictícia')
  assert.equal(params(href).get('solution'), 'ERP')
  assert.equal(params(href).get('movement'), 'Entrou')
  assert.equal(params(href).get('from'), 'home')
  assert.equal(href.includes('#'), false)
})

test('redirecionamento legado remove somente view e preserva os demais parâmetros', () => {
  const consulta = new URLSearchParams('view=forecast&period=quarter&solution=ERP&branch=Ficticia&from=home&movement=Saiu&demo=1&extra=a&extra=b')
  const destino = destinoForecastLegado(consulta)
  assert.ok(destino.startsWith('/forecast?'))
  const esperado = new URLSearchParams(consulta)
  esperado.delete('view')
  assert.equal(params(destino).toString(), esperado.toString())
  assert.equal(consulta.get('view'), 'forecast')
  assert.equal(destinoForecastLegado(new URLSearchParams('view=forecast')), '/forecast')
  assert.equal(destinoForecastLegado(new URLSearchParams('view=home')), null)
})

for (const movement of ['Ganhou', 'Perdeu']) {
  test(`filtro ${movement} preserva seleção ao compartilhar e recarregar o Forecast`, () => {
    const href = buildCommercialHref('forecast', ctx(), { movement })
    assert.ok(href.startsWith('/forecast?'))
    assert.equal(parseCommercialContext(params(href)).movement, movement)
    const contexto = parseCommercialContext(params(href))
    assert.equal(parseCommercialContext(params(buildCommercialHref('forecast', contexto))).movement, movement)
  })
}

test('filtro desconhecido continua ausente e limpar filtro remove o parâmetro', () => {
  assert.equal(parseCommercialContext(params('/forecast?movement=Inexistente')).movement, undefined)
  const href = buildCommercialHref('forecast', ctx({ movement: 'Ganhou' }), { movement: null })
  assert.equal(params(href).has('movement'), false)
  assert.equal(parseCommercialContext(params(href)).movement, undefined)
})

test('sidebar usa a rota real de Forecast em ambos os modos', () => {
  for (const corrida of [false, true]) {
    const href = sidebarHref('forecast', corrida, (view, extra) => buildCommercialHref(view, ctx(), extra))
    assert.equal(href, '/forecast?period=month&from=home')
  }
})

test('troca de período preserva segmento e corte de Territórios', () => {
  const atual = parseCommercialContext(new URLSearchParams('view=territorios&segmento=agro&corte=novos'))
  for (const period of ['month', 'quarter', 'threeMonths']) {
    const destino = parseCommercialContext(params(buildCommercialHref('territorios', { ...atual, period })))
    assert.equal(destino.period, period)
    assert.equal(destino.segmento, 'agro')
    assert.equal(destino.corte, 'novos')
  }
})

/* ------------------------------------------------------------------ */
/*  Descer: o clique na filial precisa chegar na filial                */
/* ------------------------------------------------------------------ */

test('href de filial serializa o branch, mesmo sem branch no contexto', () => {
  // O clique em "DF" a partir do CSO: contexto sem filial, extra com DF.
  const href = buildCommercialHref('territorios', ctx(), { territorio: 'territorio-02', branch: 'DF' })
  assert.equal(params(href).get('branch'), 'DF')
  assert.equal(params(href).get('territorio'), 'territorio-02')
})

test('o href do clique abre o nível filial de verdade', () => {
  // A prova que importa: parsear o href e derivar o nível.
  const href = buildCommercialHref('territorios', ctx(), { territorio: 'territorio-02', branch: 'DF' })
  const contexto = parseCommercialContext(params(href))
  assert.equal(nivelDe(contexto.territorio, contexto.branch), 'filial')
})

test('extra.branch vence o branch do contexto', () => {
  // Trocar de filial sem sair dela: contexto em DF, clique em GO.
  const href = buildCommercialHref('territorios', ctx({ branch: 'DF' }), { territorio: 'territorio-02', branch: 'GO' })
  assert.equal(params(href).get('branch'), 'GO')
})

/* ------------------------------------------------------------------ */
/*  Subir: "Todas" e a trilha precisam limpar a filial                 */
/* ------------------------------------------------------------------ */

test('ALL_FILTERS no extra limpa o branch do contexto', () => {
  // "Todas" a partir da filial: contexto em DF, extra manda limpar.
  const href = buildCommercialHref('territorios', ctx({ branch: 'DF' }), { territorio: 'territorio-02', branch: ALL_FILTERS })
  assert.equal(params(href).get('branch'), null, 'ALL_FILTERS não pode virar branch=all na URL')
  assert.equal(params(href).get('territorio'), 'territorio-02')
})

test('subir da filial para o território devolve o nível território', () => {
  const href = buildCommercialHref('territorios', ctx({ branch: 'DF' }), { territorio: 'territorio-02', branch: ALL_FILTERS })
  const contexto = parseCommercialContext(params(href))
  assert.equal(nivelDe(contexto.territorio, contexto.branch), 'territorio')
})

test('ir para o CSO limpa território e filial de uma vez', () => {
  const href = buildCommercialHref('territorios', ctx({ branch: 'DF' }), { branch: ALL_FILTERS })
  const contexto = parseCommercialContext(params(href))
  assert.equal(contexto.branch, ALL_FILTERS)
  assert.equal(nivelDe(contexto.territorio, contexto.branch), 'cso')
})

/* ------------------------------------------------------------------ */
/*  O que não mudou                                                    */
/* ------------------------------------------------------------------ */

test('sem extra.branch, o href herda o branch do contexto', () => {
  // Navegar dentro da mesma filial não deve perder o filtro.
  const href = buildCommercialHref('forecast', ctx({ branch: 'DF' }))
  assert.equal(params(href).get('branch'), 'DF')
})

test('filial do contexto igual a ALL_FILTERS não vai para a URL', () => {
  const href = buildCommercialHref('home', ctx())
  assert.equal(params(href).get('branch'), null)
})

test('território inexistente cai no CSO depois do round-trip', () => {
  const href = buildCommercialHref('territorios', ctx(), { territorio: 'atlantida', branch: 'DF' })
  const contexto = parseCommercialContext(params(href))
  assert.equal(nivelDe(contexto.territorio, contexto.branch), 'cso')
})
