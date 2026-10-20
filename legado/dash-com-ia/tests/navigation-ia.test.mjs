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

const { AREA_PRIMARIA_POR_TELA, TELAS_VALIDAS, criarHrefTela, lerContextoGlobal, podeAbrirAssistenteEmBalao, resolverRetornoDetalhe, resolverTela, resolverTelaOrigem, restringirContextoPorTela } = require('../src/lib/domain/navigation.ts')

test('mantém as rotas antigas e inclui Visões', () => {
  assert.deepEqual(TELAS_VALIDAS, [
    'agora', 'mudancas', 'casos', 'visao', 'oportunidades', 'winloss',
    'radar', 'agente', 'fontes', 'validacoes', 'detalhe', 'visoes',
  ])
  for (const tela of TELAS_VALIDAS) assert.equal(resolverTela(tela), tela)
  assert.equal(resolverTela(null), 'agora')
  assert.equal(resolverTela('tela-inexistente'), 'agora')
})

test('associa cada tela à área primária sem perder o detalhe contextual', () => {
  assert.equal(AREA_PRIMARIA_POR_TELA.agora, 'briefing')
  assert.equal(AREA_PRIMARIA_POR_TELA.agente, 'perguntar')
  assert.equal(AREA_PRIMARIA_POR_TELA.visao, 'explorar')
  assert.equal(AREA_PRIMARIA_POR_TELA.mudancas, 'explorar')
  assert.equal(AREA_PRIMARIA_POR_TELA.oportunidades, 'explorar')
  assert.equal(AREA_PRIMARIA_POR_TELA.winloss, 'explorar')
  assert.equal(AREA_PRIMARIA_POR_TELA.radar, 'explorar')
  assert.equal(AREA_PRIMARIA_POR_TELA.casos, 'explorar')
  assert.equal(AREA_PRIMARIA_POR_TELA.detalhe, 'explorar')
  assert.equal(AREA_PRIMARIA_POR_TELA.visoes, 'visoes')
  assert.equal(AREA_PRIMARIA_POR_TELA.fontes, 'fontes')
  assert.equal(AREA_PRIMARIA_POR_TELA.validacoes, 'fontes')
})

test('gera deep link compatível com oportunidade, origem e foco', () => {
  assert.equal(
    criarHrefTela('detalhe', 339001, { de: 'casos', foco: 'R4' }),
    '/?tela=detalhe&op=339001&de=casos&foco=R4',
  )
  assert.equal(resolverTelaOrigem('casos'), 'casos')
  assert.equal(resolverTelaOrigem('fila'), 'oportunidades')
  assert.equal(resolverTelaOrigem('inventada'), null)
})

test('lê somente filtros globais suportados da URL', () => {
  assert.deepEqual(
    lerContextoGlobal(new URLSearchParams('busca=%20Conta%20&filial=MG&classificacao=Base&janela=60')),
    { busca: 'Conta', filial: 'MG', classificacao: 'Base', janelaForecast: 60 },
  )
  assert.deepEqual(lerContextoGlobal(new URLSearchParams('janela=12&filial=')), {})
})

test('mantém janela e busca somente nas jornadas que as consomem', () => {
  const radar = restringirContextoPorTela(new URLSearchParams('tela=radar&janela=30&busca=Conta&filial=MG&classificacao=Base'))
  assert.equal(radar.get('janela'), null)
  assert.equal(radar.get('busca'), null)
  assert.equal(radar.get('filial'), 'MG')
  assert.equal(radar.get('classificacao'), 'Base')

  const detalheForecast = restringirContextoPorTela(new URLSearchParams('tela=detalhe&de=mudancas&op=339001&janela=60&busca=Conta'))
  assert.equal(detalheForecast.get('janela'), '60')
  assert.equal(detalheForecast.get('busca'), null)

  const detalheOportunidade = restringirContextoPorTela(new URLSearchParams('tela=detalhe&de=fila&op=339001&janela=60&busca=Conta'))
  assert.equal(detalheOportunidade.get('janela'), null)
  assert.equal(detalheOportunidade.get('busca'), 'Conta')
})

test('retorno do detalhe conserva foco e converte fila em Oportunidades', () => {
  const retornoCaso = resolverRetornoDetalhe('casos', 'R4')
  assert.equal(criarHrefTela(retornoCaso.tela, undefined, retornoCaso.contexto), '/?tela=casos&foco=R4')
  const retornoFila = resolverRetornoDetalhe('fila', null)
  assert.equal(retornoFila.tela, 'oportunidades')
})

test('balão contextual não é oferecido quando a conversa completa já está aberta', () => {
  assert.equal(podeAbrirAssistenteEmBalao('agente'), false)
  assert.equal(podeAbrirAssistenteEmBalao('agora'), true)
  assert.equal(podeAbrirAssistenteEmBalao('visoes'), true)
})
