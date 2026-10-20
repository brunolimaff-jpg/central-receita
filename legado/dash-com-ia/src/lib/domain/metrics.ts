// Métricas e briefing executivo — funções puras e determinísticas sobre o snapshot.
// Regra de ouro: datas inválidas (fechamento antes da criação, registros marcados
// como inconsistentes) não entram em métricas de ciclo/aging.

import { fmtBRL, fmtInt, fmtPct } from './format'
import { regrasRadar, resumoAtencao } from './radar'
import { resolverEtapaOportunidade } from './crm-taxonomy'
import { calcularForecastPex } from './forecast-pex'
import type { CompetenciaPex } from './forecast-pex'
import { resumirNaturezasDoMes } from './natureza-mes'
import type { Indicador, ItemFunil, MudancaRecente, Snapshot, VisaoDTO } from './types'

export function pipeline(snap: Snapshot) {
  const abertas = snap.oportunidades.filter((o) => o.situacao === 'Aberta')
  return {
    quantidade: abertas.length,
    valor: abertas.reduce((s, o) => s + o.valor_previsto, 0),
  }
}

export function previsaoPeriodo(snap: Snapshot, hoje: Date, dias = 30) {
  const limite = new Date(hoje.getTime() + dias * 86400000)
  const alvo = snap.oportunidades.filter(
    (o) => o.situacao === 'Aberta' && o.previsao_atual && new Date(o.previsao_atual) >= hoje && new Date(o.previsao_atual) <= limite
  )
  return { quantidade: alvo.length, valor: alvo.reduce((s, o) => s + o.valor_previsto, 0) }
}

// Ganhas/perdidas por período — usa apenas fechamentos com data consistente (≥ criação)
export function fechamentosPorPeriodo(snap: Snapshot, hoje: Date, dias: number) {
  const inicio = new Date(hoje.getTime() - dias * 86400000)
  const ganhas = snap.oportunidades.filter(
    (o) => o.situacao === 'Ganha' && o.fechamento_efetivo && dataValida(o) && new Date(o.fechamento_efetivo) >= inicio
  )
  const perdidas = snap.oportunidades.filter(
    (o) => o.situacao === 'Perdida' && o.fechamento_efetivo && dataValida(o) && new Date(o.fechamento_efetivo) >= inicio
  )
  return { ganhas, perdidas }
}

export function winRate(snap: Snapshot, hoje: Date, dias = 90) {
  const { ganhas, perdidas } = fechamentosPorPeriodo(snap, hoje, dias)
  const valorGanho = ganhas.reduce((s, o) => s + (o.valor_fechado ?? 0), 0)
  const valorPerdido = perdidas.reduce((s, o) => s + o.valor_previsto, 0)
  const total = ganhas.length + perdidas.length
  return {
    ganhas: ganhas.length,
    perdidas: perdidas.length,
    valor_ganho: valorGanho,
    valor_perdido: valorPerdido,
    taxa_contagem: total > 0 ? (ganhas.length / total) * 100 : null,
    taxa_valor: valorGanho + valorPerdido > 0 ? (valorGanho / (valorGanho + valorPerdido)) * 100 : null,
  }
}

// Um registro é válido para métricas de ciclo quando as datas fazem sentido.
// Registros marcados como inconsistentes (seed) ou com fechamento anterior à
// criação são deliberadamente excluídos.
export function dataValida(o: { fechamento_efetivo: string | null; criada_em: string; marcador_teste: string | null }): boolean {
  if (o.marcador_teste) return false
  if (!o.fechamento_efetivo) return true
  return new Date(o.fechamento_efetivo) >= new Date(o.criada_em)
}

export function registrosComDataInvalida(snap: Snapshot) {
  return snap.oportunidades.filter((o) => !dataValida(o))
}

export function cicloMedioDias(snap: Snapshot, hoje: Date, dias = 90) {
  const { ganhas } = fechamentosPorPeriodo(snap, hoje, dias)
  const validas = ganhas.filter((o) => o.fechamento_efetivo && dataValida(o))
  if (!validas.length) return { dias: null, amostra: 0, excluidas: ganhas.length - validas.length }
  const ciclos = validas.map((o) =>
    Math.round((new Date(o.fechamento_efetivo!).getTime() - new Date(o.criada_em).getTime()) / 86400000)
  )
  return {
    dias: Math.round(ciclos.reduce((s, c) => s + c, 0) / ciclos.length),
    amostra: validas.length,
    excluidas: ganhas.length - validas.length,
  }
}

export function slippagemMedia(snap: Snapshot) {
  const abertas = snap.oportunidades.filter((o) => o.situacao === 'Aberta' && o.previsao_atual)
  if (!abertas.length) return { dias: null, amostra: 0 }
  const slips = abertas.map((o) =>
    Math.round((new Date(o.previsao_atual!).getTime() - new Date(o.previsao_inicial).getTime()) / 86400000)
  )
  return { dias: Math.round(slips.reduce((s, c) => s + c, 0) / slips.length), amostra: abertas.length }
}

export function funil(snap: Snapshot): ItemFunil[] {
  const abertas = snap.oportunidades.filter((o) => o.situacao === 'Aberta')
  const grupos = new Map<string, ItemFunil>()
  for (const oportunidade of abertas) {
    const etapa_taxonomia = resolverEtapaOportunidade(oportunidade.tipo_oportunidade, oportunidade.etapa)
    const chave = `${etapa_taxonomia.tipo_funil}\u0000${etapa_taxonomia.etapa_bruta}`
    const existente = grupos.get(chave)
    grupos.set(chave, {
      etapa: etapa_taxonomia.etapa_bruta,
      etapa_taxonomia,
      quantidade: (existente?.quantidade ?? 0) + 1,
      valor: (existente?.valor ?? 0) + oportunidade.valor_previsto,
    })
  }
  const ordemFunil = { privado: 0, publico: 1, nao_identificado: 2 }
  return [...grupos.values()].sort((a, b) => {
    const modalidade = ordemFunil[a.etapa_taxonomia.tipo_funil] - ordemFunil[b.etapa_taxonomia.tipo_funil]
    return modalidade || a.etapa.localeCompare(b.etapa, 'pt-BR')
  })
}

export function origens(snap: Snapshot) {
  const abertas = snap.oportunidades.filter((o) => o.situacao === 'Aberta')
  const porOrigem = new Map<string, { quantidade: number; valor: number }>()
  for (const o of abertas) {
    const atual = porOrigem.get(o.origem) ?? { quantidade: 0, valor: 0 }
    porOrigem.set(o.origem, { quantidade: atual.quantidade + 1, valor: atual.valor + o.valor_previsto })
  }
  return [...porOrigem.entries()]
    .map(([origem, v]) => ({ origem, ...v }))
    .sort((a, b) => b.valor - a.valor)
}

export function topContas(snap: Snapshot, n = 5) {
  const abertas = snap.oportunidades.filter((o) => o.situacao === 'Aberta')
  const porConta = new Map<number, { fantasia: string; segmento: string; quantidade: number; valor: number }>()
  for (const o of abertas) {
    const conta = snap.contas.find((c) => c.conta_id === o.conta_id)
    if (!conta) continue
    const atual = porConta.get(conta.conta_id) ?? {
      fantasia: conta.fantasia,
      segmento: conta.segmento,
      quantidade: 0,
      valor: 0,
    }
    atual.quantidade += 1
    atual.valor += o.valor_previsto
    porConta.set(conta.conta_id, atual)
  }
  return [...porConta.entries()]
    .map(([conta_id, v]) => ({ conta_id, ...v }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, n)
}

export function mudancasRecentes(snap: Snapshot, hoje: Date, n = 10): MudancaRecente[] {
  const inicio = new Date(hoje.getTime() - 14 * 86400000)
  const oppPorId = new Map(snap.oportunidades.map((o) => [o.oportunidade_id, o]))
  const eventos: MudancaRecente[] = []
  for (const a of snap.acoes) {
    const o = oppPorId.get(a.oportunidade_id)
    if (!o) continue
    const data = new Date(a.data_acao)
    if (data < inicio) continue
    if (a.muda_status) {
      eventos.push({
        data: a.data_acao,
        oportunidade_id: o.oportunidade_id,
        oportunidade_nome: o.nome,
        conta_fantasia: o.conta_fantasia,
        tipo: 'Situação',
        descricao: `${a.tipo_acao} — ${a.observacoes_acao ?? 'sem observações'}`,
        responsavel: a.usuario_cadastro_nome,
      })
    } else if (a.muda_oportunidade) {
      eventos.push({
        data: a.data_acao,
        oportunidade_id: o.oportunidade_id,
        oportunidade_nome: o.nome,
        conta_fantasia: o.conta_fantasia,
        tipo: 'Etapa',
        descricao: `${a.tipo_acao} — ${a.observacoes_acao ?? 'sem observações'}`,
        responsavel: a.usuario_cadastro_nome,
      })
    } else if (a.acao_pedido) {
      eventos.push({
        data: a.data_acao,
        oportunidade_id: o.oportunidade_id,
        oportunidade_nome: o.nome,
        conta_fantasia: o.conta_fantasia,
        tipo: 'Pedido',
        descricao: `${a.observacoes_acao ?? 'pedido registrado'}`,
        responsavel: a.usuario_cadastro_nome,
      })
    }
  }
  return eventos.sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, n)
}

export function jornadaDescricao(snap: Snapshot) {
  const total = snap.oportunidades.length
  const porEtapa = (etapa: string) => snap.oportunidades.filter((o) => o.etapa === etapa).length
  const ganhas = snap.oportunidades.filter((o) => o.situacao === 'Ganha').length
  const perdidas = snap.oportunidades.filter((o) => o.situacao === 'Perdida').length
  return [
    { etapa: 'Originação / SQL', descricao: 'entrada de demanda e qualificação', quantidade: porEtapa('Originação') + porEtapa('SQL') },
    { etapa: 'Conta', descricao: 'contexto e histórico da cliente', quantidade: snap.contas.length },
    { etapa: 'Oportunidade', descricao: 'unidade de condução comercial', quantidade: total },
    { etapa: 'Condução', descricao: 'etapas de Qualificação a Fechamento', quantidade: porEtapa('Qualificação') + porEtapa('Proposta') + porEtapa('Negociação') + porEtapa('Fechamento') },
    { etapa: 'Forecast', descricao: 'previsão e probabilidade registradas', quantidade: snap.oportunidades.filter((o) => o.previsao_atual).length },
    { etapa: 'Win/Loss', descricao: 'fechamentos ganhos e perdidos', quantidade: ganhas + perdidas },
    { etapa: 'Aprendizado', descricao: 'motivos e ciclo para aprendizado', quantidade: snap.oportunidades.filter((o) => o.motivo_fechamento || o.motivo_perda).length },
  ]
}

export function briefingExecutivo(snap: Snapshot, hoje: Date, janelaForecastDias = 30): string[] {
  const p = pipeline(snap)
  const wr = winRate(snap, hoje, 90)
  const atencao = resumoAtencao(snap, hoje)
  const vencidas = regrasRadar(snap, hoje).find((r) => r.codigo === 'R1')
  const semAcao = regrasRadar(snap, hoje).find((r) => r.codigo === 'R2')
  const ciclo = cicloMedioDias(snap, hoje, 90)
  const slip = slippagemMedia(snap)
  const ganhasSemPedido = regrasRadar(snap, hoje).find((r) => r.codigo === 'R5')

  const partes: string[] = []
  partes.push(
    `Pipeline aberto de ${fmtBRL(p.valor)} em ${fmtInt(p.quantidade)} oportunidades. A projeção móvel dos próximos ${janelaForecastDias} dias concentra ${fmtBRL(previsaoPeriodo(snap, hoje, janelaForecastDias).valor)}.`
  )
  partes.push(
    `Atenção imediata: ${fmtInt(vencidas?.quantidade ?? 0)} previsões vencidas expõem ${fmtBRL(vencidas?.valor_exposto ?? 0)}; ${fmtInt(semAcao?.quantidade ?? 0)} oportunidades estão há mais de 21 dias sem ação registrada — leitura de registro, não de esforço.`
  )
  partes.push(
    `Nos últimos 90 dias: ${fmtInt(wr.ganhas)} ganhas (${fmtBRL(wr.valor_ganho)}) e ${fmtInt(wr.perdidas)} perdidas (${fmtBRL(wr.valor_perdido)}), taxa de ganho por valor de ${fmtPct(wr.taxa_valor)}. Ciclo médio das ganhas: ${ciclo.dias ?? '—'} dias${ciclo.excluidas > 0 ? ` (${ciclo.excluidas} registros com datas inconsistentes fora da métrica)` : ''}.`
  )
  partes.push(
    `Previsões atuais deslocam em média ${slip.dias ?? '—'} dias da inicial. ${fmtInt(ganhasSemPedido?.quantidade ?? 0)} oportunidades ganhas há mais de 30 dias seguem sem pedido registrado — Win ≠ Pedido.`
  )
  partes.push(
    `Prioridade sugerida: reforecast das ${fmtInt(vencidas?.quantidade ?? 0)} previsões vencidas, agenda para as oportunidades em etapa avançada sem próximo compromisso e conferência dos pedidos pendentes.`
  )
  return partes
}

export function indicadoresVisao(snap: Snapshot, hoje: Date, janelaForecastDias = 30): Indicador[] {
  const p = pipeline(snap)
  const prev30 = previsaoPeriodo(snap, hoje, janelaForecastDias)
  const wr = winRate(snap, hoje, 90)
  const fecho30 = fechamentosPorPeriodo(snap, hoje, 30)
  const atencao = resumoAtencao(snap, hoje)
  const vencidas = regrasRadar(snap, hoje).find((r) => r.codigo === 'R1')
  return [
    { rotulo: 'Pipeline aberto', valor: fmtBRL(p.valor), contexto: `${fmtInt(p.quantidade)} oportunidades`, tom: 'neutro' },
    { rotulo: `Projeção móvel ${janelaForecastDias} dias`, valor: fmtBRL(prev30.valor), contexto: `${fmtInt(prev30.quantidade)} com previsão na janela móvel, sem ponderação por probabilidade`, tom: 'neutro' },
    {
      rotulo: 'Previsões vencidas',
      valor: fmtInt(vencidas?.quantidade ?? 0),
      contexto: `${fmtBRL(vencidas?.valor_exposto ?? 0)} expostos`,
      tom: (vencidas?.quantidade ?? 0) > 0 ? 'critico' : 'positivo',
    },
    {
      rotulo: 'Taxa de ganho (90d)',
      valor: fmtPct(wr.taxa_valor),
      contexto: `${fmtInt(wr.ganhas)}G / ${fmtInt(wr.perdidas)}P por valor`,
      tom: 'neutro',
    },
    {
      rotulo: 'Ganhas 30 dias',
      valor: fmtBRL(fecho30.ganhas.reduce((s, o) => s + (o.valor_fechado ?? 0), 0)),
      contexto: `${fmtInt(fecho30.ganhas.length)} fechamentos`,
      tom: 'positivo',
    },
    {
      rotulo: 'Perdidas 30 dias',
      valor: fmtBRL(fecho30.perdidas.reduce((s, o) => s + o.valor_previsto, 0)),
      contexto: `${fmtInt(fecho30.perdidas.length)} perdas`,
      tom: 'atencao',
    },
    {
      rotulo: 'Em atenção (Radar)',
      valor: fmtInt(atencao.oportunidades_atencao),
      contexto: `${fmtInt(atencao.criticas)} sinais críticos`,
      tom: atencao.criticas > 0 ? 'atencao' : 'positivo',
    },
    { rotulo: 'Sinais ativos', valor: fmtInt(atencao.sinais_distintos), contexto: 'combinações oportunidade × regra', tom: 'neutro' },
  ]
}

export function visaoComercial(
  snap: Snapshot,
  competenciaPex: CompetenciaPex,
  fusoHorario: string,
  hoje = new Date(),
  janelaForecastDias = 30,
): VisaoDTO {
  return {
    briefing: briefingExecutivo(snap, hoje, janelaForecastDias),
    indicadores: indicadoresVisao(snap, hoje, janelaForecastDias),
    forecast_pex: calcularForecastPex(snap, competenciaPex, fusoHorario),
    naturezas_mes: resumirNaturezasDoMes(snap, competenciaPex, fusoHorario),
    funil: funil(snap),
    origens: origens(snap),
    topContas: topContas(snap),
    atencao: resumoAtencao(snap, hoje),
    mudancas_recentes: mudancasRecentes(snap, hoje),
    jornada: jornadaDescricao(snap),
    snapshot_em: snap.meta.snapshot_em ?? new Date().toISOString(),
  }
}
