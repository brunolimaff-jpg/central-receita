// Detalhe da oportunidade — a leitura mais completa do produto.
// Compõe: estado atual, vida comercial (timeline unificada), compromissos,
// proposta válida, ocorrências, QIC, concorrentes, Win/Loss e pedido posterior.

import { construirIndice, DECISOES_PENDENTES, diasDesdeUltimaAcao, REGRAS, sinaisDaOportunidade } from './radar'
import type { DetalheOportunidade, EventoTimeline, OportunidadeLinha, SinalDetalhe, Snapshot } from './types'
import { fioDaReceita } from './jornada-fixtures'

export function linhaDeOportunidade(snap: Snapshot, oportunidade_id: number, hoje = new Date()): OportunidadeLinha | null {
  const o = snap.oportunidades.find((x) => x.oportunidade_id === oportunidade_id)
  if (!o) return null
  const idx = construirIndice(snap, hoje)
  const diasEmAberto = Math.round((hoje.getTime() - new Date(o.criada_em).getTime()) / 86400000)
  const diasSemAcao = diasDesdeUltimaAcao(idx, o.oportunidade_id)
  let vencidaHa: number | null = null
  let diasAte: number | null = null
  if (o.previsao_atual) {
    const d = Math.round((new Date(o.previsao_atual).getTime() - hoje.getTime()) / 86400000)
    if (d < 0) vencidaHa = -d
    else diasAte = d
  }
  return {
    ...o,
    dias_em_aberto: o.situacao === 'Aberta' ? diasEmAberto : null,
    dias_desde_ultima_acao: diasSemAcao,
    previsao_vencida_ha_dias: vencidaHa,
    dias_ate_previsao: diasAte,
    sinais: sinaisDaOportunidade(snap, o.oportunidade_id, hoje).map((s) => s.codigo),
  }
}

export function construirDetalhe(snap: Snapshot, oportunidade_id: number, hoje = new Date()): DetalheOportunidade | null {
  const oportunidade = linhaDeOportunidade(snap, oportunidade_id, hoje)
  if (!oportunidade) return null
  const conta = snap.contas.find((c) => c.conta_id === oportunidade.conta_id)!
  const acoes = snap.acoes.filter((a) => a.oportunidade_id === oportunidade_id).sort((a, b) => (a.data_acao < b.data_acao ? 1 : -1))
  const compromissos = snap.compromissos
    .filter((c) => c.oportunidade_id === oportunidade_id)
    .sort((a, b) => (a.data_hora < b.data_hora ? 1 : -1))
  const propostas = snap.propostas
    .filter((p) => p.oportunidade_id === oportunidade_id)
    .sort((a, b) => (a.data_emissao < b.data_emissao ? 1 : -1))
  const proposta_valida = propostas.find((p) => p.valida) ?? null
  const ocorrencias = snap.ocorrencias.filter((o) => o.oportunidade_id === oportunidade_id)
  const qic = snap.qics.find((q) => q.oportunidade_id === oportunidade_id) ?? null
  const concorrentes = snap.concorrentes.filter((c) => c.oportunidade_id === oportunidade_id)
  const pedido = snap.pedidos.find((p) => p.oportunidade_id === oportunidade_id) ?? null
  const irmas = snap.oportunidades
    .filter((o) => o.conta_id === oportunidade.conta_id && o.oportunidade_id !== oportunidade_id)
    .map((o) => ({ oportunidade_id: o.oportunidade_id, nome: o.nome, situacao: o.situacao, etapa: o.etapa, valor_previsto: o.valor_previsto }))

  // ---------- Linha do tempo unificada ----------
  const timeline: EventoTimeline[] = []
  for (const a of acoes) {
    timeline.push({
      data: a.data_acao,
      tipo_evento: 'acao',
      titulo: a.tipo_acao,
      descricao: a.observacoes_acao ?? '—',
      origem_dado: 'ação registrada no CRM (simulado)',
      meta: {
        registrado_por: a.usuario_cadastro_nome,
        acao_id: String(a.acao_id),
        ...(a.muda_oportunidade ? { muda_oportunidade: 'sim' } : {}),
        ...(a.muda_status ? { muda_status: 'sim' } : {}),
        ...(a.notificado ? { notificado: 'sim' } : {}),
        ...(a.acao_pedido ? { acao_pedido: 'sim' } : {}),
        ...(a.usuario_alteracao_nome ? { alterado_por: a.usuario_alteracao_nome } : {}),
      },
    })
  }
  for (const c of compromissos) {
    timeline.push({
      data: c.data_hora,
      tipo_evento: 'compromisso',
      titulo: `Compromisso — ${c.assunto}`,
      descricao: `${c.atividade} · ${c.situacao} · aceite: ${c.aceite}${c.descricao ? ` · ${c.descricao}` : ''}`,
      origem_dado: 'agenda de compromissos (simulada)',
      meta: { responsavel: c.responsavel_nome, compromisso_id: String(c.compromisso_id) },
    })
  }
  for (const p of propostas) {
    timeline.push({
      data: p.data_emissao,
      tipo_evento: 'proposta',
      titulo: `Proposta ${p.numero} (v${p.versao}) — ${p.situacao}`,
      descricao: `valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p.valor)}`,
      origem_dado: 'propostas da oportunidade (simulado)',
      meta: p.valida ? { valida: 'sim' } : {},
    })
  }
  for (const o of ocorrencias) {
    timeline.push({
      data: o.data,
      tipo_evento: 'ocorrencia',
      titulo: `Ocorrência — ${o.tipo}`,
      descricao: `situação: ${o.situacao}`,
      origem_dado: 'ocorrências (simulado)',
      meta: { ocorrencia_id: String(o.ocorrencia_id) },
    })
  }
  if (pedido) {
    const diasPosGanho = oportunidade.fechamento_efetivo
      ? Math.round((new Date(pedido.data_pedido).getTime() - new Date(oportunidade.fechamento_efetivo).getTime()) / 86400000)
      : null
    timeline.push({
      data: pedido.data_pedido,
      tipo_evento: 'pedido',
      titulo: `Pedido ${pedido.numero}`,
      descricao: `emitido ${diasPosGanho !== null ? `${diasPosGanho} dias após o fechamento` : ''} · ${pedido.conferido ? `conferido em ${pedido.data_conferencia ?? '—'}` : 'ainda não conferido'}`,
      origem_dado: 'pedidos (simulado) — evento posterior ao ganho',
      meta: pedido.conferido ? { conferido: 'sim' } : { conferido: 'não' },
    })
  }
  // Fechamento como evento (caso não exista ação de Ganho/Perda registrada)
  const temAcaoDeFechamento = acoes.some((a) => a.muda_status && (a.tipo_acao === 'Ganho' || a.tipo_acao === 'Perda'))
  if (oportunidade.fechamento_efetivo && !temAcaoDeFechamento) {
    timeline.push({
      data: oportunidade.fechamento_efetivo,
      tipo_evento: 'fechamento',
      titulo: oportunidade.situacao === 'Ganha' ? 'Fechamento — Ganha' : 'Fechamento — Perdida',
      descricao:
        oportunidade.situacao === 'Ganha'
          ? `valor fechado de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(oportunidade.valor_fechado ?? 0)}${oportunidade.motivo_fechamento ? ` · motivo: ${oportunidade.motivo_fechamento}` : ''}`
          : `motivo: ${oportunidade.motivo_perda ?? '—'}`,
      origem_dado: 'registro da oportunidade (simulado)',
      meta: {},
    })
  }
  // Criação como evento marco (caso não exista ação de Cadastro)
  if (!acoes.some((a) => a.tipo_acao === 'Cadastro')) {
    timeline.push({
      data: oportunidade.criada_em,
      tipo_evento: 'criacao',
      titulo: 'Criação da oportunidade',
      descricao: `origem: ${oportunidade.origem}${oportunidade.suborigem ? ` — ${oportunidade.suborigem}` : ''}`,
      origem_dado: 'registro da oportunidade (simulado)',
      meta: {},
    })
  }
  timeline.sort((a, b) => (a.data < b.data ? 1 : -1))

  // ---------- Observações de domínio ----------
  const observacoes: string[] = []
  if (conta.responsavel_id !== oportunidade.responsavel_id) {
    observacoes.push(
      `Responsável da conta (${conta.responsavel_nome}) ≠ responsável da oportunidade (${oportunidade.responsavel_nome}).`
    )
  }
  if (conta.conta_id_erp === null) {
    observacoes.push('Conta sem vínculo ERP (conta_id_erp nulo) — integração pendente no mock.')
  }
  if (propostas.length > 1 && proposta_valida) {
    observacoes.push(`Há ${propostas.length} propostas; somente ${proposta_valida.numero} está marcada como válida.`)
  }
  if (oportunidade.situacao === 'Ganha' && !pedido) {
    observacoes.push('Ganha sem pedido registrado — Win ≠ Pedido.')
  }
  if (oportunidade.situacao === 'Ganha' && pedido) {
    observacoes.push(
      `Ganha em ${new Date(oportunidade.fechamento_efetivo!).toLocaleDateString('pt-BR')} e pedido em ${new Date(pedido.data_pedido).toLocaleDateString('pt-BR')} — o pedido é evento posterior ao ganho.`
    )
  }
  if (pedido && !pedido.conferido) {
    observacoes.push('Pedido ainda não conferido — Pedido ≠ Pedido conferido.')
  }
  if (oportunidade.marcador_teste) {
    observacoes.push(`Registro marcado para teste: ${oportunidade.marcador_teste}. Excluído das métricas de ciclo.`)
  }
  observacoes.push('Estado atual ≠ histórico: os campos do topo refletem a última leitura; a linha do tempo reconstrói a vida comercial.')

  return {
    oportunidade,
    snapshot_em: snap.meta.snapshot_em ?? null,
    versao_snapshot: snap.meta.versao ?? 'Versão não comprovada',
    conta,
    acoes,
    compromissos,
    propostas,
    proposta_valida,
    ocorrencias,
    qic,
    concorrentes,
    pedido,
    fio_da_receita: fioDaReceita(oportunidade_id),
    timeline,
    irmas,
    observacoes,
    sinais_detalhe: sinaisDetalheDe(snap, oportunidade_id, hoje),
  }
}

// Sinais ativos com contexto, limitação e decisão pendente — alimenta o
// bloco "Por que você está vendo este caso" do drill-down.
export function sinaisDetalheDe(snap: Snapshot, oportunidade_id: number, hoje = new Date()): SinalDetalhe[] {
  const limitePorCodigo = new Map(REGRAS.map((r) => [r.codigo, r.limitacao]))
  return sinaisDaOportunidade(snap, oportunidade_id, hoje).map((s) => ({
    codigo: s.codigo,
    nome: s.titulo,
    severidade: s.severidade,
    contexto: s.detalhe,
    decisao_pendente: DECISOES_PENDENTES[s.codigo] ?? 'revisar o registro',
    limitacao: limitePorCodigo.get(s.codigo) ?? '',
  }))
}
