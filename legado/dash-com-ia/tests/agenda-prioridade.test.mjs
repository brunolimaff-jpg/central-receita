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

const { agruparMutiraoPorMotivo, montarAgendaExecutiva } = require('../src/lib/domain/agora.ts')
const { resolverEtapaOportunidade, resolverNaturezaVenda } = require('../src/lib/domain/crm-taxonomy.ts')

const competencia = { ano: 2026, mes: 9 }
const hoje = new Date('2026-09-23T15:00:00.000Z')
const privada = 'Vendas Instituição Privada'
const publica = 'Vendas Instituição Pública'

function oportunidade(id, opcoes = {}) {
  const tipo = opcoes.tipo ?? privada
  const etapa = opcoes.etapa ?? 'Proposta'
  const natureza = opcoes.natureza ?? 'Base'
  return {
    oportunidade_id: id,
    conta_id: id + 1000,
    conta_fantasia: `Conta ${id}`,
    conta_id_erp: null,
    nome: `Oportunidade ${id}`,
    descricao: null,
    responsavel_id: 7,
    responsavel_nome: 'Executiva teste',
    classificacao_fixture: natureza,
    natureza_venda_taxonomia: resolverNaturezaVenda(natureza),
    tipo_oportunidade: tipo,
    subtipo_oportunidade: null,
    filial: 'MG',
    etapa,
    etapa_taxonomia: resolverEtapaOportunidade(tipo, etapa),
    situacao: opcoes.situacao ?? 'Aberta',
    probabilidade: opcoes.probabilidade ?? 75,
    origem: 'Fixture',
    suborigem: null,
    previsao_inicial: '2026-09-20T12:00:00.000Z',
    previsao_atual: opcoes.previsao_atual === undefined ? '2026-10-15T12:00:00.000Z' : opcoes.previsao_atual,
    fechamento_efetivo: null,
    valor_previsto: opcoes.valor_previsto ?? 1000,
    valor_fechado: null,
    motivo_fechamento: null,
    motivo_perda: null,
    criada_em: '2026-08-01T12:00:00.000Z',
    marcador_teste: null,
  }
}

function acao(id, oportunidadeId, data) {
  return {
    acao_id: id,
    oportunidade_id: oportunidadeId,
    data_acao: data,
    acao_pedido: false,
    tipo_acao: 'Reunião',
    muda_oportunidade: false,
    muda_status: false,
    notificado: false,
    observacoes_acao: null,
    usuario_cadastro_id: 7,
    usuario_cadastro_nome: 'Executiva teste',
    data_cadastro: data,
    usuario_alteracao_id: null,
    usuario_alteracao_nome: null,
    data_alteracao: null,
  }
}

function compromisso(id, oportunidadeId, data) {
  return {
    compromisso_id: id,
    oportunidade_id: oportunidadeId,
    conta_id: oportunidadeId + 1000,
    data_hora: data,
    assunto: 'Próximo passo',
    atividade: 'Reunião',
    descricao: null,
    responsavel_id: 7,
    responsavel_nome: 'Executiva teste',
    situacao: 'Agendado',
    aceite: 'Sim',
  }
}

function snapshot(oportunidades, acoes = [], compromissos = []) {
  const contas = oportunidades.map((o) => ({
    conta_id: o.conta_id,
    conta_id_erp: o.conta_id_erp,
    razao_social: `Razão social ${o.conta_id}`,
    fantasia: o.conta_fantasia,
    cnpj_ficticio: '',
    segmento: 'Fixture',
    filial: 'MG',
    municipio: 'Belo Horizonte',
    uf: 'MG',
    responsavel_id: o.responsavel_id,
    responsavel_nome: o.responsavel_nome,
    criado_em: '2026-01-01T12:00:00.000Z',
  }))
  return {
    meta: { snapshot_em: hoje.toISOString(), estado_anterior: '' },
    usuarios: [], contas, oportunidades, acoes, compromissos,
    propostas: [], ocorrencias: [], qics: [], concorrentes: [], pedidos: [],
  }
}

test('fila registra movimentação antiga e mantém previsão/compromisso no mutirão', () => {
  const o = oportunidade(1, { previsao_atual: null, natureza: 'C4L' })
  const itens = montarAgendaExecutiva(snapshot([o]), competencia)
  const item = itens.find((fila) => fila.oportunidade_id === 1)

  assert.ok(item)
  assert.equal(item.grupo, 'parado')
  assert.deepEqual(new Set(item.motivos), new Set(['previsao_vazia', 'sem_compromisso', 'sem_atividade_registrada']))
  assert.equal(item.dias_desde_ultima_atividade, 53)
  assert.equal(item.etapa_taxonomia.etapa_bruta, 'Proposta')
  assert.equal(item.etapa_taxonomia.estado_mapeamento, 'observado')
  assert.ok(item.fontes.includes('pdf_crm_integrado_mg'))
  assert.ok(item.fontes.includes('fixture'))
  assert.match(item.regra, /p\. 12/i)
  assert.match(item.limitacao, /não prova.*trabalho/i)
  assert.deepEqual(item.natureza_venda_taxonomia.fontes, ['briefing_anterior', 'fixture'])
  assert.ok(item.acao_simulada.includes('abrir'))
  assert.ok(item.acao_simulada.includes('retomar'))
  assert.ok(item.acao_simulada.includes('reprogramar'))
})

test('New Name não prova que a conta seja um prospect sem oportunidade', () => {
  const newNameComAtividade = oportunidade(2, {
    etapa: 'Primeiro Contato de Venda',
    natureza: 'New Name / Novo Cliente',
    previsao_atual: '2026-10-20T12:00:00.000Z',
  })
  const semHistorico = oportunidade(3, {
    etapa: 'Primeiro Contato de Venda',
    natureza: 'New Name / Novo Cliente',
    previsao_atual: '2026-10-20T12:00:00.000Z',
  })
  const itens = montarAgendaExecutiva(snapshot([newNameComAtividade, semHistorico], [acao(1, 2, '2026-08-25T15:00:00.000Z')]), competencia)

  const newNameItem = itens.find((fila) => fila.oportunidade_id === 2)
  assert.deepEqual(newNameItem?.motivos, ['sem_atividade_registrada'])
  assert.equal(newNameItem?.natureza_venda_taxonomia.rotulo, 'New Name / Novo Cliente')
  assert.deepEqual(newNameItem?.natureza_venda_taxonomia.fontes, ['briefing_anterior', 'fixture'])
  assert.ok(itens.find((fila) => fila.oportunidade_id === 3)?.motivos.includes('sem_atividade_registrada'))
})

test('compromisso registrado recente atualiza a movimentação mesmo sem ação', () => {
  const o = oportunidade(31, { etapa: 'Primeiro Contato de Venda', previsao_atual: '2026-10-20T12:00:00.000Z' })
  const itens = montarAgendaExecutiva(snapshot([o], [], [compromisso(31, 31, '2026-09-22T15:00:00.000Z')]), competencia)

  assert.equal(itens.some((item) => item.oportunidade_id === 31), false)
})

test('compromisso futuro não apaga o último movimento passado da oportunidade', () => {
  const o = oportunidade(32, { etapa: 'Primeiro Contato de Venda', previsao_atual: '2026-10-20T12:00:00.000Z' })
  const itens = montarAgendaExecutiva(snapshot([o], [], [compromisso(32, 32, '2026-09-25T15:00:00.000Z')]), competencia)
  const item = itens.find((fila) => fila.oportunidade_id === 32)

  assert.ok(item)
  assert.ok(item.motivos.includes('sem_atividade_registrada'))
  assert.equal(item.dias_desde_ultima_atividade, 53)
})

test('fecha no mês reutiliza elegibilidade PEX exata de tipo, etapa e probabilidade', () => {
  const publicoElegivel = oportunidade(4, {
    tipo: publica,
    etapa: 'Negociação/Habilitação/Certame',
    previsao_atual: '2026-09-29T12:00:00.000Z',
  })
  const publicoEtapaParecida = oportunidade(5, {
    tipo: publica,
    etapa: 'Negociação',
    previsao_atual: '2026-09-29T12:00:00.000Z',
  })
  const privadoAbaixoDaRegua = oportunidade(6, {
    etapa: 'Proposta',
    probabilidade: 74,
    previsao_atual: '2026-09-29T12:00:00.000Z',
  })
  const previstoVencido = oportunidade(24, { etapa: 'Proposta', previsao_atual: '2026-09-20T12:00:00.000Z' })
  const futuros = [
    compromisso(1, 4, '2026-09-28T12:00:00.000Z'),
    compromisso(2, 5, '2026-09-28T12:00:00.000Z'),
    compromisso(3, 6, '2026-09-28T12:00:00.000Z'),
    compromisso(4, 24, '2026-09-24T12:00:00.000Z'),
  ]
  const acoesRecentes = [
    acao(5, 4, '2026-09-22T12:00:00.000Z'),
    acao(6, 5, '2026-09-22T12:00:00.000Z'),
    acao(7, 6, '2026-09-22T12:00:00.000Z'),
    acao(8, 24, '2026-09-22T12:00:00.000Z'),
  ]
  const itens = montarAgendaExecutiva(snapshot([publicoElegivel, publicoEtapaParecida, privadoAbaixoDaRegua, previstoVencido], acoesRecentes, futuros), competencia)

  const elegivel = itens.find((fila) => fila.oportunidade_id === 4)
  assert.ok(elegivel)
  assert.equal(elegivel.grupo, 'fecha_mes')
  assert.ok(elegivel.motivos.includes('fecha_mes'))
  assert.match(elegivel.regra, /PEX.*75%/i)
  const vencido = itens.find((fila) => fila.oportunidade_id === 24)
  assert.ok(vencido?.motivos.includes('previsao_vencida'))
  assert.ok(vencido?.motivos.includes('fecha_mes'))
  assert.equal(itens.some((fila) => fila.oportunidade_id === 5 && fila.motivos.includes('fecha_mes')), false)
  assert.equal(itens.some((fila) => fila.oportunidade_id === 6 && fila.motivos.includes('fecha_mes')), false)
})

test('ordena por grupo, dias desde ação, valor previsto e ID sem score composto', () => {
  const newName = (id, value) => oportunidade(id, {
    etapa: 'Primeiro Contato de Venda',
    natureza: 'New Name / Novo Cliente',
    previsao_atual: '2026-10-20T12:00:00.000Z',
    valor_previsto: value,
  })
  const parado9 = newName(9, 300)
  const parado10 = newName(10, 100)
  const parado11 = newName(11, 300)
  const fechamento = oportunidade(20, { previsao_atual: '2026-09-29T12:00:00.000Z', valor_previsto: 50 })
  const vazio = oportunidade(30, { etapa: 'Primeiro Contato de Venda', previsao_atual: null })
  const acoes = [
    acao(1, 9, '2026-08-25T15:00:00.000Z'),
    acao(2, 10, '2026-08-25T15:00:00.000Z'),
    acao(3, 11, '2026-08-25T15:00:00.000Z'),
    acao(4, 20, '2026-09-20T15:00:00.000Z'),
    acao(5, 30, '2026-09-20T15:00:00.000Z'),
  ]
  const itens = montarAgendaExecutiva(snapshot([parado10, fechamento, vazio, parado11, parado9], acoes), competencia)

  assert.deepEqual(itens.map((item) => item.oportunidade_id), [9, 11, 10, 20, 30])
  assert.deepEqual(itens.map((item) => item.grupo), ['parado', 'parado', 'parado', 'fecha_mes', 'mutirao'])
  assert.match(itens[0].criterio_ordenacao, /grupo.*dias.*valor previsto.*ID/i)
  assert.equal(itens[0].impacto, 300)
})

test('não cria perda de ritmo sem data de entrada na etapa ou p75 disponível', () => {
  const baseSemMovimento = oportunidade(40, { etapa: 'Primeiro Contato de Venda', previsao_atual: '2026-10-20T12:00:00.000Z' })
  const itens = montarAgendaExecutiva(snapshot([baseSemMovimento], [acao(4, 40, '2026-08-01T12:00:00.000Z')]), competencia)

  assert.equal(itens.some((item) => item.motivos.includes('perda_ritmo')), false)
})

test('mutirão agrupa IDs por motivo sem duplicar o registro da fila', () => {
  const vazia = oportunidade(60, { previsao_atual: null })
  const fecha = oportunidade(61, { previsao_atual: '2026-09-29T12:00:00.000Z' })
  const vencida = oportunidade(62, { previsao_atual: '2026-09-20T12:00:00.000Z' })
  const acoes = [acao(6, 61, '2026-09-22T12:00:00.000Z'), acao(7, 62, '2026-09-22T12:00:00.000Z')]
  const compromissos = [compromisso(61, 61, '2026-09-24T12:00:00.000Z'), compromisso(62, 62, '2026-09-24T12:00:00.000Z')]
  const itens = montarAgendaExecutiva(snapshot([vazia, fecha, vencida], acoes, compromissos), competencia)
  const agrupados = agruparMutiraoPorMotivo(itens)
  const porMotivo = new Map(agrupados.map((grupo) => [grupo.motivo, grupo.oportunidade_ids]))

  assert.deepEqual(porMotivo.get('previsao_vazia'), [60])
  assert.deepEqual(porMotivo.get('previsao_vencida'), [62])
  assert.deepEqual(porMotivo.get('sem_compromisso'), [60])
  assert.deepEqual(new Set(itens.map((item) => item.oportunidade_id)), new Set([60, 61, 62]))
})
