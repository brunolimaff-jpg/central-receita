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

const { resolverNaturezaVenda, resolverEtapaOportunidade } = require('../src/lib/domain/crm-taxonomy.ts')
const { visaoComercial } = require('../src/lib/domain/metrics.ts')

const competencia = { ano: 2026, mes: 9 }
const fuso = 'America/Sao_Paulo'
const hoje = new Date('2026-09-23T15:00:00.000Z')
const tipoPrivado = 'Vendas Instituição Privada'

function oportunidade(id, natureza, opcoes = {}) {
  const etapa = opcoes.etapa ?? 'Proposta'
  return {
    oportunidade_id: id,
    conta_id: 1,
    conta_fantasia: 'Conta Sintética',
    conta_id_erp: null,
    nome: `Oportunidade ${id}`,
    descricao: null,
    responsavel_id: 1,
    responsavel_nome: 'Executivo Sintético',
    classificacao_fixture: natureza,
    natureza_venda_taxonomia: opcoes.taxonomia ?? resolverNaturezaVenda(natureza),
    tipo_oportunidade: tipoPrivado,
    subtipo_oportunidade: null,
    filial: 'Matriz — Sorriso',
    etapa,
    etapa_taxonomia: resolverEtapaOportunidade(tipoPrivado, etapa),
    situacao: opcoes.situacao ?? 'Aberta',
    probabilidade: opcoes.probabilidade ?? 75,
    origem: 'Indicação',
    suborigem: null,
    previsao_inicial: '2026-09-20T12:00:00.000Z',
    previsao_atual: opcoes.previsao_atual ?? null,
    fechamento_efetivo: opcoes.fechamento_efetivo ?? null,
    valor_previsto: opcoes.valor_previsto ?? 1000,
    valor_fechado: opcoes.valor_fechado ?? null,
    motivo_fechamento: null,
    motivo_perda: null,
    criada_em: opcoes.criada_em ?? '2026-08-15T12:00:00.000Z',
    marcador_teste: null,
  }
}

function snapshot(oportunidades) {
  return {
    meta: {
      snapshot_em: hoje.toISOString(),
      estado_anterior: JSON.stringify({ referencia: '2026-09-16T15:00:00.000Z', regras: [], oportunidades: [] }),
    },
    usuarios: [],
    contas: [{ conta_id: 1, fantasia: 'Conta Sintética', segmento: 'Fixture' }],
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

test('Visão separa New Name e Cross por competência, estado e tipo de valor', () => {
  const snap = snapshot([
    oportunidade(1, 'New Name / Novo Cliente', {
      criada_em: '2026-10-01T02:30:00.000Z',
      previsao_atual: '2026-10-01T02:45:00.000Z',
      valor_previsto: 1000,
    }),
    oportunidade(2, 'New Name / Novo Cliente', {
      situacao: 'Perdida',
      criada_em: '2026-09-02T12:00:00.000Z',
      fechamento_efetivo: '2026-09-15T12:00:00.000Z',
      previsao_atual: null,
      valor_previsto: 1500,
    }),
    oportunidade(3, 'New Name / Novo Cliente', {
      taxonomia: { ...resolverNaturezaVenda('New Name / Novo Cliente'), estado_mapeamento: 'fixture', fontes: ['fixture'] },
      criada_em: '2026-09-03T12:00:00.000Z',
      previsao_atual: '2026-09-12T12:00:00.000Z',
      valor_previsto: 3000,
    }),
    oportunidade(4, 'Cross / Up Sell', {
      situacao: 'Ganha',
      fechamento_efetivo: '2026-09-15T12:00:00.000Z',
      valor_previsto: 99999,
      valor_fechado: 2500,
    }),
    oportunidade(5, 'Cross / Up Sell', {
      situacao: 'Ganha',
      fechamento_efetivo: '2026-09-16T12:00:00.000Z',
      valor_previsto: 9999,
      valor_fechado: null,
    }),
    oportunidade(6, 'Cross / Up Sell', {
      previsao_atual: '2026-10-01T02:59:59.999Z',
      valor_previsto: 700,
    }),
    oportunidade(7, 'Cross / Up Sell', {
      taxonomia: { ...resolverNaturezaVenda('Cross / Up Sell'), estado_mapeamento: 'fixture', fontes: ['fixture'] },
      previsao_atual: '2026-09-12T12:00:00.000Z',
      valor_previsto: 5000,
    }),
    oportunidade(8, 'Base', { previsao_atual: '2026-09-12T12:00:00.000Z', valor_previsto: 4000 }),
  ])

  const resultado = visaoComercial(snap, competencia, fuso, hoje, 30)
  assert.deepEqual(resultado.naturezas_mes, [
    {
      natureza: 'New Name / Novo Cliente',
      rotulo: 'New Name',
      estado_mapeamento: 'autorizado_anterior',
      fontes: ['briefing_anterior', 'fixture'],
      entradas_criadas: 2,
      ganhos_mes: { quantidade: 0, valor: 0, quantidade_sem_valor: 0 },
      perdidas_mes: 1,
      abertas_previstas_mes: { quantidade: 1, valor: 1000, quantidade_sem_valor: 0 },
    },
    {
      natureza: 'Cross / Up Sell',
      rotulo: 'Cross / Up Sell',
      estado_mapeamento: 'autorizado_anterior',
      fontes: ['briefing_anterior', 'fixture'],
      entradas_criadas: 0,
      ganhos_mes: { quantidade: 2, valor: 2500, quantidade_sem_valor: 1 },
      perdidas_mes: 0,
      abertas_previstas_mes: { quantidade: 1, valor: 700, quantidade_sem_valor: 0 },
    },
  ])
})
