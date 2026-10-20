// Carregamento do snapshot sintético a partir do SQLite (Prisma).
// Leitura determinística: mesma base, mesmo instante → mesmo resultado.
// Cache local em memória (TTL curto) para evitar leituras repetidas na mesma rajada.

import { db } from '@/lib/db'
import { resolverEtapaOportunidade, resolverNaturezaVenda } from './crm-taxonomy'
import type {
  AcaoDTO,
  CompromissoDTO,
  ConcorrenteDTO,
  ContaDTO,
  OcorrenciaDTO,
  OportunidadeDTO,
  PedidoDTO,
  PropostaDTO,
  QicDTO,
  Snapshot,
} from './types'

const TTL_MS = 10_000
let cache: { snap: Snapshot; em: number } | null = null

const iso = (d: Date) => d.toISOString()

export async function carregarSnapshot(): Promise<Snapshot> {
  if (cache && Date.now() - cache.em < TTL_MS) return cache.snap

  const [metaRaw, usuarios, contasRaw, oppsRaw, acoesRaw, compsRaw, propsRaw, ocorrsRaw, qicsRaw, concsRaw, pedsRaw] =
    await Promise.all([
      db.meta.findMany(),
      db.usuario.findMany({ orderBy: { usuario_id: 'asc' } }),
      db.conta.findMany({ orderBy: { conta_id: 'asc' } }),
      db.oportunidade.findMany({ orderBy: { oportunidade_id: 'asc' } }),
      db.acao.findMany({ orderBy: [{ oportunidade_id: 'asc' }, { data_acao: 'asc' }] }),
      db.compromisso.findMany({ orderBy: { data_hora: 'desc' } }),
      db.proposta.findMany({ orderBy: [{ oportunidade_id: 'asc' }, { data_emissao: 'asc' }] }),
      db.ocorrencia.findMany({ orderBy: { data: 'desc' } }),
      db.qic.findMany({ orderBy: { qic_id: 'asc' } }),
      db.concorrente.findMany({ orderBy: { concorrente_id: 'asc' } }),
      db.pedido.findMany({ orderBy: { pedido_id: 'asc' } }),
    ])

  const meta: Record<string, string> = {}
  for (const m of metaRaw) meta[m.chave] = m.valor

  const nomePorId = new Map(usuarios.map((u) => [u.usuario_id, u.nome]))
  const contas: ContaDTO[] = contasRaw.map((c) => ({
    conta_id: c.conta_id,
    conta_id_erp: c.conta_id_erp,
    razao_social: c.razao_social,
    fantasia: c.fantasia,
    cnpj_ficticio: c.cnpj_ficticio,
    segmento: c.segmento,
    filial: c.filial,
    municipio: c.municipio,
    uf: c.uf,
    responsavel_id: c.responsavel_id,
    responsavel_nome: nomePorId.get(c.responsavel_id) ?? '—',
    criado_em: iso(c.criado_em),
  }))
  const contaPorId = new Map(contas.map((c) => [c.conta_id, c]))

  const oportunidades: OportunidadeDTO[] = oppsRaw.map((o) => {
    const conta = contaPorId.get(o.conta_id)
    return {
      oportunidade_id: o.oportunidade_id,
      conta_id: o.conta_id,
      conta_fantasia: conta?.fantasia ?? '—',
      conta_id_erp: conta?.conta_id_erp ?? null,
      nome: o.nome,
      descricao: o.descricao,
      responsavel_id: o.responsavel_id,
      responsavel_nome: nomePorId.get(o.responsavel_id) ?? '—',
      classificacao_fixture: o.classificacao_fixture,
      natureza_venda_taxonomia: resolverNaturezaVenda(o.classificacao_fixture ?? ''),
      tipo_oportunidade: o.tipo_oportunidade,
      subtipo_oportunidade: o.subtipo_oportunidade,
      filial: conta?.filial ?? 'Não comprovado',
      etapa: o.etapa,
      etapa_taxonomia: resolverEtapaOportunidade(o.tipo_oportunidade, o.etapa),
      situacao: o.situacao as OportunidadeDTO['situacao'],
      probabilidade: o.probabilidade,
      origem: o.origem,
      suborigem: o.suborigem,
      previsao_inicial: iso(o.previsao_inicial),
      previsao_atual: o.previsao_atual ? iso(o.previsao_atual) : null,
      fechamento_efetivo: o.fechamento_efetivo ? iso(o.fechamento_efetivo) : null,
      valor_previsto: o.valor_previsto,
      valor_fechado: o.valor_fechado,
      motivo_fechamento: o.motivo_fechamento,
      motivo_perda: o.motivo_perda,
      criada_em: iso(o.criada_em),
      marcador_teste: o.marcador_teste,
    }
  })

  const acoes: AcaoDTO[] = acoesRaw.map((a) => ({
    acao_id: a.acao_id,
    oportunidade_id: a.oportunidade_id,
    data_acao: iso(a.data_acao),
    acao_pedido: a.acao_pedido,
    tipo_acao: a.tipo_acao,
    muda_oportunidade: a.muda_oportunidade,
    muda_status: a.muda_status,
    notificado: a.notificado,
    observacoes_acao: a.observacoes_acao,
    usuario_cadastro_id: a.usuario_cadastro_id,
    usuario_cadastro_nome: a.usuario_cadastro_nome,
    data_cadastro: iso(a.data_cadastro),
    usuario_alteracao_id: a.usuario_alteracao_id,
    usuario_alteracao_nome: a.usuario_alteracao_nome,
    data_alteracao: a.data_alteracao ? iso(a.data_alteracao) : null,
  }))

  const compromissos: CompromissoDTO[] = compsRaw.map((c) => ({
    compromisso_id: c.compromisso_id,
    oportunidade_id: c.oportunidade_id,
    conta_id: c.conta_id,
    data_hora: iso(c.data_hora),
    assunto: c.assunto,
    atividade: c.atividade,
    descricao: c.descricao,
    responsavel_id: c.responsavel_id,
    responsavel_nome: c.responsavel_nome,
    situacao: c.situacao,
    aceite: c.aceite,
  }))

  const propostas: PropostaDTO[] = propsRaw.map((p) => ({
    proposta_id: p.proposta_id,
    oportunidade_id: p.oportunidade_id,
    numero: p.numero,
    versao: p.versao,
    data_emissao: iso(p.data_emissao),
    valor: p.valor,
    situacao: p.situacao,
    valida: p.valida,
  }))

  const ocorrencias: OcorrenciaDTO[] = ocorrsRaw.map((o) => ({
    ocorrencia_id: o.ocorrencia_id,
    oportunidade_id: o.oportunidade_id,
    tipo: o.tipo,
    situacao: o.situacao,
    data: iso(o.data),
  }))

  const qics: QicDTO[] = qicsRaw.map((q) => ({
    qic_id: q.qic_id,
    oportunidade_id: q.oportunidade_id,
    identificador: q.identificador,
    situacao: q.situacao,
  }))

  const concorrentes: ConcorrenteDTO[] = concsRaw.map((c) => ({
    concorrente_id: c.concorrente_id,
    oportunidade_id: c.oportunidade_id,
    nome: c.nome,
    situacao: c.situacao,
  }))

  const pedidos: PedidoDTO[] = pedsRaw.map((p) => ({
    pedido_id: p.pedido_id,
    oportunidade_id: p.oportunidade_id,
    numero: p.numero,
    data_pedido: iso(p.data_pedido),
    valor: p.valor,
    conferido: p.conferido,
    data_conferencia: p.data_conferencia ? iso(p.data_conferencia) : null,
  }))

  const snap: Snapshot = {
    meta,
    usuarios: usuarios.map((u) => ({ usuario_id: u.usuario_id, nome: u.nome, email: u.email, cargo: u.cargo })),
    contas,
    oportunidades,
    acoes,
    compromissos,
    propostas,
    ocorrencias,
    qics,
    concorrentes,
    pedidos,
  }

  cache = { snap, em: Date.now() }
  return snap
}
