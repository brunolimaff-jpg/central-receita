import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

// Executa os módulos reais do domínio sem depender do runtime Next indisponível.
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

const { resolverEtapaOportunidade, resolverNaturezaVenda, filtrarOportunidadesPorEtapa } = require('../src/lib/domain/crm-taxonomy.ts')
const { calcularMudancas } = require('../src/lib/domain/mudancas.ts')
const { REGRAS, construirIndice, regrasRadar } = require('../src/lib/domain/radar.ts')
const { gerarCasos } = require('../src/lib/domain/casos.ts')
const { responder } = require('../src/lib/domain/agente.ts')
const { construirDetalhe } = require('../src/lib/domain/detalhe.ts')
const { rotuloNaturezaVendaTaxonomia } = require('../src/lib/domain/types.ts')

const hoje = new Date('2026-09-23T12:00:00.000Z')
const privada = 'Vendas Instituição Privada'
const publica = 'Vendas Instituição Pública'

function oportunidade(id, etapa, tipo = privada, classificacao = 'Base') {
  return {
    oportunidade_id: id, conta_id: 1, conta_fantasia: 'Conta teste', conta_id_erp: null,
    nome: `Oportunidade ${id}`, descricao: null, responsavel_id: 7,
    responsavel_nome: 'Executiva teste', classificacao_fixture: classificacao,
    natureza_venda_taxonomia: resolverNaturezaVenda(classificacao), tipo_oportunidade: tipo,
    subtipo_oportunidade: null, filial: 'MG', etapa,
    etapa_taxonomia: resolverEtapaOportunidade(tipo, etapa), situacao: 'Aberta',
    probabilidade: 75, origem: 'Teste', suborigem: null,
    previsao_inicial: '2026-09-25T12:00:00.000Z', previsao_atual: '2026-09-25T12:00:00.000Z',
    fechamento_efetivo: null, valor_previsto: 1000, valor_fechado: null,
    motivo_fechamento: null, motivo_perda: null, criada_em: '2026-09-01T12:00:00.000Z',
    marcador_teste: null,
  }
}

function snapshot(opps, anterior = []) {
  return {
    meta: {
      snapshot_em: hoje.toISOString(),
      estado_anterior: JSON.stringify({ referencia: '2026-09-16T12:00:00.000Z', regras: [], oportunidades: anterior }),
    },
    usuarios: [], contas: [], oportunidades: opps, acoes: [], compromissos: [],
    propostas: [], ocorrencias: [], qics: [], concorrentes: [], pedidos: [],
  }
}

test('Mudanças mantém estágio histórico sem tipo como não mapeado e identifica origem sintética', () => {
  const nova = oportunidade(1, 'Nova fase local')
  const atual = oportunidade(2, 'Proposta')
  const antiga = { oportunidade_id: 2, etapa: 'Defesa Técnica', situacao: 'Aberta',
    probabilidade: 50, previsao_atual: atual.previsao_atual, valor_previsto: 1000 }
  const dados = calcularMudancas(snapshot([nova, atual], [antiga]), hoje)
  assert.match(dados.entradas[0].detalhe, /Nova fase local.*não mapeada/i)
  assert.match(dados.entradas[0].detalhe, /origem Teste.*fixture/i)
  assert.match(dados.avancos[0].detalhe, /Defesa Técnica.*não mapeada.*Proposta/)
  assert.doesNotMatch(dados.avancos[0].detalhe, /Defesa Técnica \(observada/i)
})

test('histórico sem tipo não herda funil atual em saídas por ganho', () => {
  const atual = oportunidade(10, 'Proposta', privada)
  atual.situacao = 'Ganha'
  atual.fechamento_efetivo = '2026-09-22T12:00:00.000Z'
  const antiga = { oportunidade_id: 10, etapa: 'Negociação', situacao: 'Aberta',
    probabilidade: 75, previsao_atual: atual.previsao_atual, valor_previsto: 1000 }
  const dados = calcularMudancas(snapshot([atual], [antiga]), hoje)
  assert.match(dados.saidas_ganhas[0].detalhe, /antes em Negociação.*não mapeada/i)
})

test('R4 só aceita etapa observada no funil correto e exclui Fechamento e SQL', () => {
  const r4 = REGRAS.find((regra) => regra.codigo === 'R4')
  const opps = [
    oportunidade(1, 'Proposta', privada),
    oportunidade(2, 'Negociação', privada),
    oportunidade(3, 'Negociação/Habilitação/Certame', publica),
    oportunidade(4, 'Fechamento', privada),
    oportunidade(5, 'SQL', privada),
    oportunidade(6, 'Negociação', publica),
  ]
  const snap = snapshot(opps)
  const idx = construirIndice(snap, hoje)
  assert.deepEqual(opps.filter((o) => r4.avalia(o, idx)?.atende).map((o) => o.oportunidade_id), [1, 2, 3])
  assert.match(r4.avalia(opps[2], idx).contexto, /Negociação\/Habilitação\/Certame/)
  const referencias = regrasRadar(snap, hoje).find((r) => r.codigo === 'R4').oportunidades
  assert.deepEqual(referencias.map((o) => o.oportunidade_id), [1, 2, 3])
  assert.deepEqual(referencias[2].etapa_taxonomia, opps[2].etapa_taxonomia)
})

test('Casos conserva o rótulo bruto e explicita a falta de mapeamento', () => {
  const o = oportunidade(7, 'Fase local sem catálogo')
  o.previsao_atual = '2026-09-20T12:00:00.000Z'
  const caso = gerarCasos(snapshot([o]), hoje).casos.find((item) => item.sinal_codigo === 'R1')
  assert.ok(caso)
  assert.equal(caso.etapa, 'Fase local sem catálogo')
  assert.deepEqual(caso.etapa_taxonomia, o.etapa_taxonomia)
})

test('Pergunte mantém valor desconhecido visível e explica o estado do mapeamento', () => {
  const o = oportunidade(8, 'Fase local sem catálogo')
  const resposta = responder('Quais oportunidades têm forecast com previsão vencida?', snapshot([{ ...o, previsao_atual: '2026-09-20T12:00:00.000Z' }]), hoje)
  assert.equal(resposta.reconhecido, true)
  assert.match(resposta.blocos[0].linhas[0][3], /Fase local sem catálogo.*não mapeada/i)
})

test('Detalhe da oportunidade conserva bruto e resolução com fontes separadas', () => {
  const o = oportunidade(9, 'SQL', privada, 'C4L')
  const snap = snapshot([o])
  snap.contas.push({ conta_id: 1, fantasia: 'Conta teste' })
  const detalhe = construirDetalhe(snap, 9, hoje)
  assert.equal(detalhe.oportunidade.etapa, 'SQL')
  assert.deepEqual(detalhe.oportunidade.etapa_taxonomia, {
    tipo_funil: 'privado', etapa_bruta: 'SQL', rotulo: 'SQL',
    estado_mapeamento: 'nao_mapeado', fontes: ['briefing_anterior', 'fixture'],
  })
  assert.equal(detalhe.oportunidade.classificacao_fixture, 'C4L')
  assert.deepEqual(detalhe.oportunidade.natureza_venda_taxonomia.fontes, ['briefing_anterior', 'fixture'])
})

test('natureza da venda exibe estado e fonte distintos para Cross, Cross / Up Sell, C4L e desconhecido', () => {
  assert.match(rotuloNaturezaVendaTaxonomia(resolverNaturezaVenda('Cross')), /Cross.*observado.*PDF CRM Integrado MG/i)
  assert.match(rotuloNaturezaVendaTaxonomia(resolverNaturezaVenda('Cross / Up Sell')), /Cross \/ Up Sell.*briefing anterior.*fixture/i)
  assert.match(rotuloNaturezaVendaTaxonomia(resolverNaturezaVenda('C4L')), /C4L.*briefing anterior.*fixture/i)
  assert.match(rotuloNaturezaVendaTaxonomia(resolverNaturezaVenda('Nova natureza')), /Nova natureza.*não mapeada.*fonte não identificada/i)
})

test('Pergunte mostra fonte e estado da natureza em cada linha de oportunidade', () => {
  const opps = [
    oportunidade(11, 'Proposta', privada, 'Cross'),
    oportunidade(12, 'Proposta', privada, 'Cross / Up Sell'),
    oportunidade(13, 'Proposta', privada, 'C4L'),
    oportunidade(14, 'Proposta', privada, 'Nova natureza'),
  ]
  const resposta = responder('Top oportunidades', snapshot(opps), hoje)
  const tabela = resposta.blocos.find((b) => b.titulo === 'Maiores oportunidades abertas')
  assert.ok(tabela)
  const indice = tabela.colunas.indexOf('Natureza e fonte')
  assert.ok(indice >= 0)
  const porId = new Map(tabela.linhas.map((linha) => [linha[0], linha[indice]]))
  assert.match(porId.get('11'), /Cross.*observado.*PDF CRM Integrado MG/i)
  assert.match(porId.get('12'), /Cross \/ Up Sell.*briefing anterior.*fixture/i)
  assert.match(porId.get('13'), /C4L.*briefing anterior.*fixture/i)
  assert.match(porId.get('14'), /Nova natureza.*não mapeada.*fonte não identificada/i)
})

test('Pergunte detalha a natureza com estado e fontes', () => {
  const o = oportunidade(339001, 'Proposta', privada, 'Cross / Up Sell')
  const snap = snapshot([o])
  snap.contas.push({ conta_id: 1, fantasia: 'Conta teste', razao_social: 'Conta teste', conta_id_erp: null, filial: 'MG', responsavel_id: 7, responsavel_nome: 'Executiva teste' })
  const resposta = responder('Detalhe da oportunidade 339001', snap, hoje)
  assert.match(resposta.texto, /Cross \/ Up Sell.*autorizado pelo briefing anterior.*briefing anterior.*fixture/i)
})

test('Pergunte mantém funis privado e público separados mesmo com etapa Proposta igual', () => {
  const opps = [
    oportunidade(15, 'Proposta', privada),
    oportunidade(16, 'Proposta', publica),
    oportunidade(17, 'Proposta', publica),
    oportunidade(22, 'SQL', privada),
  ]
  opps[1].valor_previsto = 2000
  opps[2].valor_previsto = 3000
  const resposta = responder('Como está o funil?', snapshot(opps), hoje)
  assert.match(resposta.texto, /privado.*2 oportunidades.*público.*2 oportunidades/i)
  const privado = resposta.blocos.find((b) => /funil privado/i.test(b.titulo))
  const publico = resposta.blocos.find((b) => /funil público/i.test(b.titulo))
  assert.ok(privado)
  assert.ok(publico)
  const etapasPrivadas = new Map(privado.linhas.map((linha) => [linha[0], linha]))
  assert.equal(etapasPrivadas.get('Proposta')?.[1], '1')
  assert.equal(etapasPrivadas.get('SQL')?.[1], '1')
  assert.deepEqual(publico.linhas.map((linha) => linha.slice(0, 2)), [['Proposta', '2']])
  const sql = etapasPrivadas.get('SQL')
  assert.ok(sql)
  const fontes = privado.colunas.indexOf('Estado e fontes')
  assert.ok(fontes >= 0)
  assert.match(sql[fontes], /SQL.*não mapeada.*briefing anterior.*fixture/i)
  assert.doesNotMatch(sql[fontes], /observado.*PDF CRM Integrado MG/i)
})

test('filtro Não mapeada inclui SQL e Originação e exclui etapas observadas', () => {
  const opps = [
    oportunidade(18, 'SQL', privada),
    oportunidade(19, 'Originação', privada),
    oportunidade(20, 'Proposta', privada),
    oportunidade(21, 'Fase local', privada),
  ]
  assert.deepEqual(filtrarOportunidadesPorEtapa(opps, 'nao-mapeada').map((o) => o.oportunidade_id), [18, 19, 21])
  assert.equal(opps[0].etapa_taxonomia.estado_mapeamento, 'nao_mapeado')
  assert.deepEqual(opps[0].etapa_taxonomia.fontes, ['briefing_anterior', 'fixture'])
  assert.equal(opps[1].etapa_taxonomia.estado_mapeamento, 'nao_mapeado')
})
