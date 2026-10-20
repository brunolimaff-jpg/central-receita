// Win/Loss — resultado e aprendizado dos fechamentos.
// Determinístico sobre o snapshot: métricas, listas de fechamentos e motivos
// usam a mesma janela móvel de 90 dias. Registros com datas inválidas (fechamento anterior à criação)
// são excluídos das métricas de ciclo e taxa — e contabilizados como tal.

import { fmtDataCurta, fmtDiasAtras } from './format'
import type { FechoDTO, MotivoAgregado, OportunidadeDTO, Snapshot, WinLossDTO } from './types'

const MS_DIA = 86_400_000
const JANELA_DIAS = 90

function fechoDe(o: OportunidadeDTO, snap: Snapshot): FechoDTO | null {
  if (o.situacao !== 'Ganha' && o.situacao !== 'Perdida') return null
  if (!o.fechamento_efetivo) return null
  const fech = new Date(o.fechamento_efetivo)
  const criada = new Date(o.criada_em)
  const valido = fech >= criada
  const ciclo = valido ? Math.round((fech.getTime() - criada.getTime()) / MS_DIA) : null

  // Última ação registrada antes do fechamento (exclui a própria ação de Ganho/Perda).
  const acoesAntes = snap.acoes
    .filter((a) => a.oportunidade_id === o.oportunidade_id && new Date(a.data_acao) < fech && a.tipo_acao !== 'Ganho' && a.tipo_acao !== 'Perda')
    .sort((a, b) => (a.data_acao === b.data_acao ? b.acao_id - a.acao_id : a.data_acao < b.data_acao ? -1 : 1))
  const ultima = acoesAntes[acoesAntes.length - 1]
  const pedido = snap.pedidos.find((p) => p.oportunidade_id === o.oportunidade_id) ?? null

  return {
    oportunidade_id: o.oportunidade_id,
    nome: o.nome,
    conta_fantasia: o.conta_fantasia,
    responsavel_nome: o.responsavel_nome,
    data_fechamento: o.fechamento_efetivo,
    valor_fechado: o.valor_fechado ?? o.valor_previsto,
    motivo: o.situacao === 'Ganha' ? o.motivo_fechamento : o.motivo_perda,
    ciclo_dias: ciclo,
    pedido: pedido ? { numero: pedido.numero, conferido: pedido.conferido } : null,
    ultima_acao_antes_fechamento: ultima
      ? `${ultima.tipo_acao} ${fmtDataCurta(ultima.data_acao)} (${fmtDiasAtras(Math.round((fech.getTime() - new Date(ultima.data_acao).getTime()) / MS_DIA))} antes)`
      : null,
  }
}

function agregar(fechos: FechoDTO[], extrator: (f: FechoDTO) => string | null): MotivoAgregado[] {
  const mapa = new Map<string, MotivoAgregado>()
  for (const f of fechos) {
    const motivo = extrator(f)
    if (!motivo) continue
    const atual = mapa.get(motivo) ?? { motivo, quantidade: 0, valor: 0 }
    atual.quantidade++
    atual.valor += f.valor_fechado
    mapa.set(motivo, atual)
  }
  return [...mapa.values()].sort((a, b) => b.valor - a.valor)
}

export function resultadoWinLoss(snap: Snapshot, hoje = new Date()): WinLossDTO {
  const limite = new Date(hoje.getTime() - JANELA_DIAS * MS_DIA)

  const fechamentos = snap.oportunidades
    .map((o) => fechoDe(o, snap))
    .filter((f): f is FechoDTO => f !== null)
    .sort((a, b) => (a.data_fechamento < b.data_fechamento ? 1 : -1))

  const ganhas = fechamentos.filter((f) => snap.oportunidades.find((o) => o.oportunidade_id === f.oportunidade_id)?.situacao === 'Ganha')
  const perdidas = fechamentos.filter((f) => snap.oportunidades.find((o) => o.oportunidade_id === f.oportunidade_id)?.situacao === 'Perdida')

  const ganhasJanela = ganhas.filter((f) => new Date(f.data_fechamento) >= limite)
  const perdidasJanela = perdidas.filter((f) => new Date(f.data_fechamento) >= limite)
  const valorGanhas = ganhasJanela.reduce((s, f) => s + f.valor_fechado, 0)
  const valorPerdidas = perdidasJanela.reduce((s, f) => s + f.valor_fechado, 0)
  const total = valorGanhas + valorPerdidas

  const ciclosValidos = ganhasJanela.filter((f) => f.ciclo_dias !== null)
  const excluidas = fechamentos.filter((f) => f.ciclo_dias === null).length

  const ganhasSemPedido = ganhasJanela.filter((f) => f.pedido === null).length
  const pedidosNaoConferidos = ganhasJanela.filter((f) => f.pedido !== null && !f.pedido.conferido).length

  return {
    janela_dias: JANELA_DIAS,
    resumo: {
      ganhas: ganhasJanela.length,
      valor_ganhas: valorGanhas,
      perdidas: perdidasJanela.length,
      valor_perdidas: valorPerdidas,
      taxa_ganho_valor: total > 0 ? Math.round((valorGanhas / total) * 100) : null,
      ciclo_medio_dias: ciclosValidos.length > 0 ? Math.round(ciclosValidos.reduce((s, f) => s + (f.ciclo_dias ?? 0), 0) / ciclosValidos.length) : null,
      ganhas_sem_pedido: ganhasSemPedido,
      pedidos_nao_conferidos: pedidosNaoConferidos,
      excluidas_datas_invalidas: excluidas,
    },
    ganhas: ganhasJanela,
    perdidas: perdidasJanela,
    motivos_perda: agregar(perdidasJanela, (f) => f.motivo),
    motivos_ganho: agregar(ganhasJanela, (f) => f.motivo),
  }
}
