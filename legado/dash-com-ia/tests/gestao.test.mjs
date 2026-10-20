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

const { resolverEtapaOportunidade, resolverNaturezaVenda } = require('../src/lib/domain/crm-taxonomy.ts')
const { resumoGestao, resumoPorUnidade, entradasDaSemana, exigeVoce, nomeCurtoUnidade } = require('../src/lib/domain/gestao.ts')
const { regrasRadar } = require('../src/lib/domain/radar.ts')

// Snapshot sintético puro (sem HTTP, sem servidor): 3 unidades — duas com
// pipeline (e sinais distintos) e uma com zero real de pipeline.
const hoje = new Date('2026-09-28T12:00:00.000Z')
const TIPO_PRIVADO = 'Vendas Instituição Privada'
const MS_DIA = 86_400_000
const emDias = (n) => new Date(hoje.getTime() + n * MS_DIA).toISOString()

const CONTAS = [
  { conta_id: 1, fantasia: 'Cliente A', filial: 'Filial — A' },
  { conta_id: 2, fantasia: 'Cliente B', filial: 'Matriz — B' },
  { conta_id: 3, fantasia: 'Cliente C', filial: 'Filial — C' },
]

function oportunidade(id, conta_id, opcoes = {}) {
  const etapa = opcoes.etapa ?? 'Qualificação'
  const conta = CONTAS.find((c) => c.conta_id === conta_id)
  const previsao = opcoes.previsao_atual ?? null
  return {
    oportunidade_id: id,
    conta_id,
    conta_fantasia: conta.fantasia,
    conta_id_erp: null,
    nome: `Oportunidade ${id}`,
    descricao: null,
    responsavel_id: 1,
    responsavel_nome: 'Executivo Sintético',
    classificacao_fixture: null,
    natureza_venda_taxonomia: resolverNaturezaVenda(''),
    tipo_oportunidade: TIPO_PRIVADO,
    subtipo_oportunidade: null,
    filial: conta.filial,
    etapa,
    etapa_taxonomia: resolverEtapaOportunidade(TIPO_PRIVADO, etapa),
    situacao: opcoes.situacao ?? 'Aberta',
    probabilidade: opcoes.probabilidade ?? 50,
    origem: 'Indicação',
    suborigem: null,
    previsao_inicial: previsao ?? '2026-08-15T12:00:00.000Z',
    previsao_atual: previsao,
    fechamento_efetivo: null,
    valor_previsto: opcoes.valor_previsto ?? 1000,
    valor_fechado: null,
    motivo_fechamento: null,
    motivo_perda: null,
    criada_em: '2026-08-15T12:00:00.000Z',
    marcador_teste: null,
  }
}

function estadoAnteriorBase() {
  return {
    referencia: '2026-09-21T12:00:00.000Z',
    regras: [],
    oportunidades: [
      { oportunidade_id: 1, etapa: 'Qualificação', tipo_oportunidade: TIPO_PRIVADO, situacao: 'Aberta', probabilidade: 50, previsao_atual: emDias(2), valor_previsto: 120000 },
      { oportunidade_id: 2, etapa: 'Qualificação', tipo_oportunidade: TIPO_PRIVADO, situacao: 'Aberta', probabilidade: 50, previsao_atual: emDias(20), valor_previsto: 70000 },
      { oportunidade_id: 4, etapa: 'Qualificação', tipo_oportunidade: TIPO_PRIVADO, situacao: 'Aberta', probabilidade: 50, previsao_atual: emDias(5), valor_previsto: 90000 },
      { oportunidade_id: 5, etapa: 'Qualificação', tipo_oportunidade: TIPO_PRIVADO, situacao: 'Aberta', probabilidade: 50, previsao_atual: emDias(40), valor_previsto: 25000 },
      // Teto documentado: opp do estado anterior SEM correspondente no snapshot atual.
      { oportunidade_id: 999, etapa: 'Qualificação', tipo_oportunidade: TIPO_PRIVADO, situacao: 'Aberta', probabilidade: 50, previsao_atual: emDias(3), valor_previsto: 500000 },
    ],
  }
}

function snapshot(oportunidades, estadoAnterior) {
  const meta = { snapshot_em: hoje.toISOString() }
  if (estadoAnterior !== undefined) meta.estado_anterior = JSON.stringify(estadoAnterior)
  return {
    meta,
    usuarios: [],
    contas: CONTAS,
    oportunidades,
    acoes: [],
    compromissos: [],
    propostas: [],
    ocorrencias: [],
    qics: [],
    concorrentes: [],
    pedidos: [],
  }
}

function oportunidadesBase() {
  return [
    // Filial — A: 100k na janela (+2d) + 80k fora (+20d) + 30k vencida (R1 e R7: prob 80).
    oportunidade(1, 1, { previsao_atual: emDias(2), valor_previsto: 100000 }),
    oportunidade(2, 1, { previsao_atual: emDias(20), valor_previsto: 80000 }),
    oportunidade(3, 1, { previsao_atual: emDias(-3), valor_previsto: 30000, probabilidade: 80 }),
    // Matriz — B: 90k na janela (+5d) + 20k fora (+40d) → sem nenhum sinal.
    oportunidade(4, 2, { previsao_atual: emDias(5), valor_previsto: 90000 }),
    oportunidade(5, 2, { previsao_atual: emDias(40), valor_previsto: 20000 }),
    // Filial — C: nenhuma oportunidade → pipeline zero real.
  ]
}

function snapshotBase(estadoAnterior = estadoAnteriorBase()) {
  return snapshot(oportunidadesBase(), estadoAnterior)
}

test('resumoPorUnidade soma pipeline e entra-7d por filial, com zero real e unidade sem sinal', () => {
  const unidades = resumoPorUnidade(snapshotBase(), hoje)
  const a = unidades.find((u) => u.filial === 'Filial — A')
  const b = unidades.find((u) => u.filial === 'Matriz — B')
  const c = unidades.find((u) => u.filial === 'Filial — C')

  // Soma manual sobre o snapshot: A = 100.000 + 80.000 + 30.000; entra-7d = só opp1 (100.000, +2d).
  assert.equal(a.pipeline_qtd, 3)
  assert.equal(a.pipeline_valor, 210000)
  assert.equal(a.entra_7d_qtd, 1)
  assert.equal(a.entra_7d_valor, 100000)
  assert.equal(b.pipeline_qtd, 2)
  assert.equal(b.pipeline_valor, 110000)
  assert.equal(b.entra_7d_valor, 90000)

  // Zero real: a unidade com conta e sem oportunidades APARECE no ranking.
  assert.ok(c)
  assert.equal(c.pipeline_qtd, 0)
  assert.equal(c.pipeline_valor, 0)
  assert.equal(c.entra_7d_qtd, 0)
  assert.equal(c.entra_7d_valor, 0)

  // Unidade sem sinal: B não tem sinais; A tem R1 (vencida) e R7 (prob 80 com vencida).
  assert.equal(b.sinais.length, 0)
  assert.deepEqual(
    a.sinais.map((s) => [s.codigo, s.quantidade, s.valor_exposto]),
    [['R1', 1, 30000], ['R7', 1, 30000]],
  )
})

test('ordenacao: pipeline_valor desc com desempate localeCompare pt-BR', () => {
  const unidades = resumoPorUnidade(snapshotBase(), hoje)
  assert.deepEqual(unidades.map((u) => u.filial), ['Filial — A', 'Matriz — B', 'Filial — C'])

  // Empate de valor: 'Filial — A' vem antes de 'Matriz — B' por localeCompare
  // (Filial — C segue no fim com pipeline zero, pois as contas do snapshot são as mesmas).
  const empatadas = resumoPorUnidade(snapshot([
    oportunidade(1, 1, { previsao_atual: emDias(10), valor_previsto: 100000 }),
    oportunidade(2, 2, { previsao_atual: emDias(10), valor_previsto: 100000 }),
  ]), hoje)
  assert.deepEqual(empatadas.map((u) => u.filial), ['Filial — A', 'Matriz — B', 'Filial — C'])
})

test('variacao_pipeline: número via join oportunidade_id; null sem estado anterior; opp do EA sem correspondente fica fora', () => {
  const unidades = resumoPorUnidade(snapshotBase(), hoje)
  const a = unidades.find((u) => u.filial === 'Filial — A')
  const b = unidades.find((u) => u.filial === 'Matriz — B')
  const c = unidades.find((u) => u.filial === 'Filial — C')
  // A: atual 210.000 − anterior (opp1 120.000 + opp2 70.000) = +20.000. A opp999
  // do EA (500.000) não tem correspondente no snapshot atual e NÃO entra no cálculo.
  assert.equal(a.variacao_pipeline, 20000)
  // B: atual 110.000 − anterior (90.000 + 25.000) = −5.000.
  assert.equal(b.variacao_pipeline, -5000)
  assert.equal(c.variacao_pipeline, 0)

  // Sem meta.estado_anterior: null em todas as unidades (a UI omite a coluna).
  const semAnterior = resumoPorUnidade(snapshot(oportunidadesBase()), hoje)
  assert.ok(semAnterior.every((u) => u.variacao_pipeline === null))
})

test('entradasDaSemana: janela de 7 dias, por_dia com 7 posições e top ≤5 por valor', () => {
  const semana = entradasDaSemana(snapshotBase(), hoje)
  assert.equal(semana.janela_dias, 7)
  assert.equal(semana.total_qtd, 2)
  assert.equal(semana.total_valor, 190000)
  assert.equal(semana.por_dia.length, 7)
  assert.equal(semana.por_dia[0].data, emDias(0))
  // Dias com entrada: opp1 no dia +2 e opp4 no dia +5; os demais são zero real.
  assert.deepEqual({ quantidade: semana.por_dia[2].quantidade, valor: semana.por_dia[2].valor }, { quantidade: 1, valor: 100000 })
  assert.deepEqual({ quantidade: semana.por_dia[5].quantidade, valor: semana.por_dia[5].valor }, { quantidade: 1, valor: 90000 })
  assert.equal(semana.por_dia.reduce((s, d) => s + d.quantidade, 0), semana.total_qtd)
  assert.equal(semana.por_dia.reduce((s, d) => s + d.valor, 0), semana.total_valor)
  // Top ordenado por valor desc; vencida (opp3) e fora da janela (opp2, opp5) não entram.
  assert.deepEqual(semana.top.map((t) => t.oportunidade_id), [1, 4])
  assert.deepEqual(semana.top.map((t) => t.valor_previsto), [100000, 90000])
  assert.ok(semana.top.every((t) => t.oportunidade_id !== 3))
})

test('exigeVoce: conservação — agregado por (filial, código) bate com regrasRadar no snapshot inteiro', () => {
  const snap = snapshotBase()
  const regras = regrasRadar(snap, hoje)
  const itens = exigeVoce(snap, hoje)

  assert.equal(itens.reduce((s, i) => s + i.quantidade, 0), regras.reduce((s, r) => s + r.quantidade, 0))
  assert.equal(itens.reduce((s, i) => s + i.valor_exposto, 0), regras.reduce((s, r) => s + r.valor_exposto, 0))

  const r1 = itens.find((i) => i.filial === 'Filial — A' && i.codigo === 'R1')
  assert.equal(r1.quantidade, 1)
  assert.equal(r1.valor_exposto, 30000)
  assert.deepEqual(r1.oportunidades.map((o) => o.oportunidade_id), [3])
  assert.ok(r1.decisao_pendente.length > 0)

  // Ordenado por valor_exposto desc.
  const valores = itens.map((i) => i.valor_exposto)
  assert.deepEqual(valores, [...valores].sort((x, y) => y - x))
})

test('resumoGestao orquestra o DTO e nomeCurtoUnidade corta no separador em dash', () => {
  const gestao = resumoGestao(snapshotBase(), hoje)
  assert.equal(gestao.por_unidade.length, 3)
  assert.equal(gestao.entra_semana.total_qtd, 2)
  assert.equal(gestao.exige_voce.length, 2)
  assert.ok(gestao.limitacao_ranking.includes('recorte de filial'))

  assert.equal(nomeCurtoUnidade('Filial — Sinop'), 'Sinop')
  assert.equal(nomeCurtoUnidade('Matriz — Sorriso'), 'Sorriso')
  assert.equal(nomeCurtoUnidade('Unidade sem separador'), 'Unidade sem separador')
})
