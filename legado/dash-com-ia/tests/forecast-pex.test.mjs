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

const { calcularForecastPex } = require('../src/lib/domain/forecast-pex.ts')
const { rotuloAtualizacaoSnapshot } = require('../src/lib/domain/format.ts')
const { resolverEtapaOportunidade } = require('../src/lib/domain/crm-taxonomy.ts')
const { funil, indicadoresVisao, visaoComercial } = require('../src/lib/domain/metrics.ts')

const privada = 'Vendas Instituição Privada'
const publica = 'Vendas Instituição Pública'
const fuso = 'America/Sao_Paulo'
const competencia = { ano: 2026, mes: 9 }
const hoje = new Date('2026-09-23T15:00:00.000Z')

function oportunidade(id, opcoes = {}) {
  const tipo = opcoes.tipo ?? privada
  const etapa = opcoes.etapa ?? 'Proposta'
  return {
    oportunidade_id: id,
    tipo_oportunidade: tipo,
    etapa,
    etapa_taxonomia: resolverEtapaOportunidade(tipo, etapa),
    situacao: opcoes.situacao ?? 'Aberta',
    probabilidade: opcoes.probabilidade ?? 75,
    previsao_atual: opcoes.previsao_atual === undefined ? '2026-09-20T12:00:00.000Z' : opcoes.previsao_atual,
    fechamento_efetivo: opcoes.fechamento_efetivo ?? null,
    valor_previsto: opcoes.valor_previsto ?? 1000,
    valor_fechado: opcoes.valor_fechado ?? null,
  }
}

function snapshot(oportunidades) {
  return {
    meta: {
      snapshot_em: hoje.toISOString(),
      estado_anterior: JSON.stringify({ referencia: '2026-09-16T15:00:00.000Z', regras: [], oportunidades: [] }),
    },
    usuarios: [], contas: [], oportunidades, acoes: [], compromissos: [], propostas: [],
    ocorrencias: [], qics: [], concorrentes: [], pedidos: [],
  }
}

test('PEX mensal aplica probabilidade e pares exatos de tipo e etapa', () => {
  const snap = snapshot([
    oportunidade(1, { etapa: 'Proposta', valor_previsto: 100 }),
    oportunidade(2, { etapa: 'Negociação', valor_previsto: 200 }),
    oportunidade(3, { etapa: 'Negociação', probabilidade: 74, valor_previsto: 300 }),
    oportunidade(4, { tipo: publica, etapa: 'Proposta', valor_previsto: 400 }),
    oportunidade(5, { tipo: publica, etapa: 'Negociação/Habilitação/Certame', valor_previsto: 500 }),
    oportunidade(6, { tipo: publica, etapa: 'Negociação', valor_previsto: 600 }),
    oportunidade(7, { tipo: publica, etapa: 'Análise de Documentos', probabilidade: 95, valor_previsto: 700 }),
    oportunidade(8, { tipo: 'Tipo desconhecido', etapa: 'Proposta', probabilidade: 99, valor_previsto: 800 }),
    oportunidade(9, { etapa: 'Fechamento', probabilidade: 99, valor_previsto: 900 }),
  ])

  const resultado = calcularForecastPex(snap, competencia, fuso)
  assert.deepEqual(resultado.competencia, competencia)
  assert.equal(resultado.fuso_horario, fuso)
  assert.deepEqual(resultado.previsto_pex, { quantidade: 4, valor: 1200, quantidade_sem_valor: 0 })
  assert.equal(resultado.fonte, 'pdf_crm_integrado_mg')
  assert.match(resultado.regra, /75%|75 por cento/i)
})

test('PEX competência usa fronteiras do mês no fuso da filial', () => {
  const snap = snapshot([
    oportunidade(10, { previsao_atual: '2026-09-01T02:59:59.999Z', valor_previsto: 100 }),
    oportunidade(11, { previsao_atual: '2026-09-01T03:00:00.000Z', valor_previsto: 200 }),
    oportunidade(12, { previsao_atual: '2026-10-01T02:59:59.999Z', valor_previsto: 300 }),
    oportunidade(13, { previsao_atual: '2026-10-01T03:00:00.000Z', valor_previsto: 400 }),
    oportunidade(14, { previsao_atual: '2026-09-01', valor_previsto: 500 }),
  ])

  const resultado = calcularForecastPex(snap, competencia, fuso)
  assert.deepEqual(resultado.previsto_pex, { quantidade: 3, valor: 1000, quantidade_sem_valor: 0 })
})

test('PEX conta somente oportunidades Fechadas e Ganhas pela data de fechamento na competência', () => {
  const snap = snapshot([
    oportunidade(20, { situacao: 'Ganha', fechamento_efetivo: '2026-09-01T02:59:59.999Z', valor_fechado: 100 }),
    oportunidade(21, { situacao: 'Ganha', fechamento_efetivo: '2026-09-01T03:00:00.000Z', valor_fechado: 300, valor_previsto: 9000 }),
    oportunidade(22, { situacao: 'Ganha', fechamento_efetivo: '2026-10-01T03:00:00.000Z', valor_fechado: 500 }),
    oportunidade(23, { situacao: 'Perdida', fechamento_efetivo: '2026-09-20T12:00:00.000Z', valor_fechado: 700 }),
  ])

  const resultado = calcularForecastPex(snap, competencia, fuso)
  assert.deepEqual(resultado.fechadas_ganhas_no_mes, { quantidade: 1, valor: 300, quantidade_sem_valor: 0 })
  assert.deepEqual(resultado.total_pex_mes, { quantidade: 1, valor: 300, quantidade_sem_valor: 0 })
})

test('ganho sem valor_fechado mantém quantidade e sinaliza o valor ausente', () => {
  const snap = snapshot([
    oportunidade(30, { situacao: 'Ganha', fechamento_efetivo: '2026-09-20T12:00:00.000Z', valor_previsto: 7777, valor_fechado: null }),
  ])

  const resultado = calcularForecastPex(snap, competencia, fuso)
  assert.deepEqual(resultado.fechadas_ganhas_no_mes, { quantidade: 1, valor: 0, quantidade_sem_valor: 1 })
  assert.deepEqual(resultado.total_pex_mes, { quantidade: 1, valor: 0, quantidade_sem_valor: 1 })
})

test('competência inválida é rejeitada explicitamente', () => {
  assert.throws(() => calcularForecastPex(snapshot([]), { ano: 2026, mes: 13 }, fuso), /competência|mês/i)
})

test('Visão separa funis e não apresenta SQL/Originação como etapas observadas', () => {
  const snap = snapshot([
    oportunidade(35, { etapa: 'SQL' }),
    oportunidade(36, { tipo: privada, etapa: 'Proposta' }),
    oportunidade(37, { tipo: publica, etapa: 'Proposta' }),
    oportunidade(38, { etapa: 'Originação' }),
  ])
  const etapas = funil(snap)
  const propostas = etapas.filter((item) => item.etapa === 'Proposta')
  const sql = etapas.find((item) => item.etapa === 'SQL')
  const origem = etapas.find((item) => item.etapa === 'Originação')

  assert.equal(propostas.length, 2)
  assert.deepEqual(new Set(propostas.map((item) => item.etapa_taxonomia.tipo_funil)), new Set(['privado', 'publico']))
  assert.ok(propostas.every((item) => item.etapa_taxonomia.estado_mapeamento === 'observado'))
  assert.equal(sql?.etapa_taxonomia.estado_mapeamento, 'nao_mapeado')
  assert.deepEqual(sql?.etapa_taxonomia.fontes, ['briefing_anterior', 'fixture'])
  assert.equal(origem?.etapa_taxonomia.estado_mapeamento, 'nao_mapeado')
})

test('Visão mantém PEX mensal separado da projeção móvel', () => {
  const snap = snapshot([oportunidade(40, { valor_previsto: 100 })])
  const indicador = indicadoresVisao(snap, hoje, 30).find((item) => item.rotulo.includes('30 dias'))
  const visao = visaoComercial(snap, competencia, fuso, hoje, 30)

  assert.equal(indicador?.rotulo, 'Projeção móvel 30 dias')
  assert.deepEqual(visao.forecast_pex.competencia, competencia)
  assert.match(visao.indicadores.find((item) => item.rotulo === 'Projeção móvel 30 dias')?.contexto ?? '', /janela móvel/i)
})

test('carimbo de proveniência da Visão usa o timestamp devolvido pela leitura', () => {
  const timestamp = '2026-08-10T15:30:00.000Z'
  const rotulo = rotuloAtualizacaoSnapshot(timestamp)
  assert.equal(rotulo, 'Snapshot 10/08/26')
  assert.notEqual(rotulo, 'Snapshot 22 set 2026 · 12:58')
})
