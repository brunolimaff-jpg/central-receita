// Agora — a Caixa de Atenção Executiva: a home da Central.
// Não abre com KPIs: abre com as 3–5 situações que justificam atenção hoje.
// Cada situação traz impacto, população, regra, limitação, decisão pendente
// e CTA para revisar os casos. Inclui a pauta determinística de reunião.

import { calcularMudancas } from './mudancas'
import { gerarCasos } from './casos'
import { regrasRadar } from './radar'
import { FUSO_HORARIO_PEX_FIXTURE, competenciaPexDaData, oportunidadesPrevistasPex } from './forecast-pex'
import { fmtBRL, fmtDataCurta, fmtInt } from './format'
import type { CompetenciaPex } from './forecast-pex'
import type { AcaoSimulada, AgoraDTO, ExemploAtencao, GrupoFila, GrupoMutiraoPorMotivo, ItemFilaExecutiva, MotivoFila, MotivoMutirao, SecaoPauta, Severidade, SituacaoAtencao, Snapshot } from './types'

const MAX_SITUACOES = 5
export const LIMITACAO_PERDA_RITMO_AGENDA = 'O snapshot não registra a data de entrada em cada etapa nem o percentil superior do ciclo. As medianas do PDF (Base 18, New Name 31, Cross 58 dias) são referências descritivas; a agenda não as usa como limiar.'

function exemplosDe(regra: ReturnType<typeof regrasRadar>, codigo: string, limite = 3): ExemploAtencao[] {
  const r = regra.find((x) => x.codigo === codigo)
  if (!r) return []
  return r.oportunidades.slice(0, limite).map((o) => ({
    oportunidade_id: o.oportunidade_id,
    nome: o.nome,
    conta_fantasia: o.conta_fantasia,
    contexto: o.contexto,
    valor: o.valor_previsto,
  }))
}

const ORDEM_GRUPOS: Record<GrupoFila, number> = { parado: 0, fecha_mes: 1, perda_ritmo: 2, mutirao: 3 }
const ORDEM_MOTIVOS: MotivoFila[] = ['sem_atividade_registrada', 'fecha_mes', 'perda_ritmo', 'previsao_vencida', 'previsao_vazia', 'sem_compromisso']
const ROTULOS_GRUPOS: Record<GrupoFila, string> = {
  parado: 'parado',
  fecha_mes: 'fecha o mês',
  perda_ritmo: 'perda de ritmo',
  mutirao: 'mutirão',
}

function fontesFila(etapa: Snapshot['oportunidades'][number]['etapa_taxonomia'], natureza: Snapshot['oportunidades'][number]['natureza_venda_taxonomia']) {
  const fontes = new Set(etapa.fontes)
  for (const fonte of natureza.fontes) fontes.add(fonte)
  fontes.add('pdf_crm_integrado_mg')
  fontes.add('fixture')
  const ordem = ['pdf_crm_integrado_mg', 'briefing_anterior', 'fixture'] as const
  return ordem.filter((fonte) => fontes.has(fonte))
}

function regraFila(motivos: MotivoFila[], diasSemAtividade: number | null): string {
  const regras: Record<MotivoFila, string> = {
    previsao_vazia: 'Não há previsão atual registrada na Oportunidade; gestão diária, p. 12.',
    previsao_vencida: 'A previsão atual ficou antes da data do snapshot, com a Oportunidade ainda aberta; painel diário, p. 12, e regra R1.',
    sem_compromisso: 'Etapa avançada observada sem compromisso futuro Agendado; gestão diária, p. 12, e regra R4 do fixture.',
    sem_atividade_registrada: `Não há movimentação (ação, compromisso, proposta ou ocorrência) registrada nos últimos ${diasSemAtividade ?? '—'} dias; gestão diária, p. 12 (faixa 20+).`,
    fecha_mes: 'Régua PEX: fase e tipo exatos, probabilidade ≥75% e previsão na competência selecionada; PDF pp. 5 e 38.',
    perda_ritmo: 'Não há evidência suficiente no snapshot para disparar perda de ritmo; mediana do ciclo não é limiar.',
  }
  return motivos.map((motivo) => regras[motivo]).join(' ')
}

function grupoFila(motivos: MotivoFila[]): GrupoFila {
  if (motivos.includes('sem_atividade_registrada')) return 'parado'
  if (motivos.includes('fecha_mes')) return 'fecha_mes'
  if (motivos.includes('perda_ritmo')) return 'perda_ritmo'
  return 'mutirao'
}

function limitacaoFila(diasSemAtividade: number | null): string {
  const partes = ['Leitura sobre fixture sintético; não sincroniza com CRM.']
  if (diasSemAtividade === null) partes.push('Não há uma data de movimentação válida para medir o intervalo; não se presume ausência de trabalho.')
  else partes.push(`Não há movimentação registrada há ${diasSemAtividade} dias; isso não prova ausência de trabalho fora do sistema.`)
  return partes.join(' ')
}

function criterioOrdenacao(grupo: GrupoFila, diasSemAtividade: number | null): string {
  const tempo = diasSemAtividade === null
    ? 'sem data de movimentação registrada (depois dos itens datados)'
    : `${diasSemAtividade} dias desde a última movimentação registrada (descendente)`
  return `grupo ${ROTULOS_GRUPOS[grupo]}; ${tempo}; valor previsto (descendente); ID (crescente)`
}

function ultimaMovimentacaoRegistrada(snap: Snapshot, ate: Date): Map<number, number> {
  const datas = new Map<number, number>()
  const registrar = (oportunidadeId: number, valor: string) => {
    const tempo = new Date(valor).getTime()
    if (Number.isFinite(tempo) && tempo <= ate.getTime() && tempo > (datas.get(oportunidadeId) ?? Number.NEGATIVE_INFINITY)) datas.set(oportunidadeId, tempo)
  }
  for (const item of snap.acoes) registrar(item.oportunidade_id, item.data_acao)
  for (const item of snap.compromissos) registrar(item.oportunidade_id, item.data_hora)
  for (const item of snap.propostas) registrar(item.oportunidade_id, item.data_emissao)
  for (const item of snap.ocorrencias) registrar(item.oportunidade_id, item.data)
  return datas
}

function diasDesdeMovimentacaoRegistrada(
  ultimaPorOportunidade: Map<number, number>,
  oportunidadeId: number,
  criadaEm: string,
  hoje: Date,
): number | null {
  const ultima = ultimaPorOportunidade.get(oportunidadeId)
  const referencia = ultima ?? new Date(criadaEm).getTime()
  if (!Number.isFinite(referencia) || referencia > hoje.getTime()) return null
  return Math.round((hoje.getTime() - referencia) / 86400000)
}

export function montarAgendaExecutiva(snap: Snapshot, competencia: CompetenciaPex): ItemFilaExecutiva[] {
  const hoje = new Date(snap.meta['snapshot_em'] ?? '')
  if (!Number.isFinite(hoje.getTime())) throw new RangeError('snapshot_em inválido para ordenar a agenda executiva')
  const regras = regrasRadar(snap, hoje)
  const idsSemCompromisso = new Set(regras.find((r) => r.codigo === 'R4')?.oportunidades.map((o) => o.oportunidade_id) ?? [])
  const idsPrevisaoVencida = new Set(regras.find((r) => r.codigo === 'R1')?.oportunidades.map((o) => o.oportunidade_id) ?? [])
  const idsFechaMes = new Set(oportunidadesPrevistasPex(snap, competencia, FUSO_HORARIO_PEX_FIXTURE).map((o) => o.oportunidade_id))
  const ultimaPorOportunidade = ultimaMovimentacaoRegistrada(snap, hoje)
  const itens: ItemFilaExecutiva[] = []

  for (const oportunidade of snap.oportunidades.filter((o) => o.situacao === 'Aberta')) {
    const diasSemAtividade = diasDesdeMovimentacaoRegistrada(ultimaPorOportunidade, oportunidade.oportunidade_id, oportunidade.criada_em, hoje)
    const motivos: MotivoFila[] = []
    if (!oportunidade.previsao_atual) motivos.push('previsao_vazia')
    else if (idsPrevisaoVencida.has(oportunidade.oportunidade_id)) motivos.push('previsao_vencida')
    if (idsSemCompromisso.has(oportunidade.oportunidade_id)) motivos.push('sem_compromisso')
    if (diasSemAtividade !== null && diasSemAtividade >= 20) motivos.push('sem_atividade_registrada')
    if (idsFechaMes.has(oportunidade.oportunidade_id)) motivos.push('fecha_mes')
    motivos.sort((a, b) => ORDEM_MOTIVOS.indexOf(a) - ORDEM_MOTIVOS.indexOf(b))
    if (motivos.length === 0) continue

    const grupo = grupoFila(motivos)
    const limitacao = limitacaoFila(diasSemAtividade)
    const acoes: AcaoSimulada[] = ['abrir']
    if (motivos.includes('sem_atividade_registrada') || motivos.includes('previsao_vazia') || motivos.includes('previsao_vencida') || motivos.includes('sem_compromisso')) acoes.push('retomar')
    if (motivos.includes('previsao_vazia') || motivos.includes('previsao_vencida') || motivos.includes('fecha_mes')) acoes.push('reprogramar')
    itens.push({
      grupo,
      oportunidade_id: oportunidade.oportunidade_id,
      conta_id: oportunidade.conta_id,
      conta_nome: oportunidade.conta_fantasia,
      responsavel_id: oportunidade.responsavel_id,
      responsavel_nome: oportunidade.responsavel_nome,
      etapa_taxonomia: oportunidade.etapa_taxonomia,
      natureza_venda_taxonomia: oportunidade.natureza_venda_taxonomia,
      fontes: fontesFila(oportunidade.etapa_taxonomia, oportunidade.natureza_venda_taxonomia),
      motivos,
      impacto: oportunidade.valor_previsto,
      dias_desde_ultima_atividade: diasSemAtividade,
      criterio_ordenacao: criterioOrdenacao(grupo, diasSemAtividade),
      regra: regraFila(motivos, diasSemAtividade),
      limitacao,
      acao_simulada: acoes,
    })
  }

  return itens.sort((a, b) => ORDEM_GRUPOS[a.grupo] - ORDEM_GRUPOS[b.grupo]
    || (b.dias_desde_ultima_atividade ?? -1) - (a.dias_desde_ultima_atividade ?? -1)
    || b.impacto - a.impacto
    || a.oportunidade_id - b.oportunidade_id)
}

export function agruparMutiraoPorMotivo(itens: ItemFilaExecutiva[]): GrupoMutiraoPorMotivo[] {
  const ordem: MotivoMutirao[] = ['previsao_vazia', 'previsao_vencida', 'sem_compromisso']
  return ordem
    .map((motivo) => ({
      motivo,
      oportunidade_ids: [...new Set(itens.filter((item) => item.motivos.includes(motivo)).map((item) => item.oportunidade_id))]
        .sort((a, b) => a - b),
    }))
    .filter((grupo) => grupo.oportunidade_ids.length > 0)
}

export function caixaAtencao(
  snap: Snapshot,
  hoje = new Date(),
  janelaForecastDias = 30,
  competenciaPex = competenciaPexDaData(hoje, FUSO_HORARIO_PEX_FIXTURE),
): AgoraDTO {
  const mudancas = calcularMudancas(snap, hoje, janelaForecastDias)
  const regras = regrasRadar(snap, hoje)
  const casos = gerarCasos(snap, hoje)
  const anteriorEm = mudancas?.anterior_em ?? snap.meta['snapshot_em'] ?? hoje.toISOString()

  const situacoes: SituacaoAtencao[] = []

  // --- Situação de mudança: forecast dos próximos 30 dias ---
  if (mudancas && mudancas.forecast_periodo.delta !== 0) {
    const forecast = mudancas.forecast_periodo
    const caiu = forecast.delta < 0
    const top = mudancas.concentracao.itens
      .slice(0, 3)
      .map((i) => ({
        oportunidade_id: i.oportunidade_id,
        nome: i.nome,
        conta_fantasia: i.conta_fantasia,
        contexto: i.contribuicao > 0 ? `entrada de ${fmtBRL(i.contribuicao)}` : `saída de ${fmtBRL(Math.abs(i.contribuicao))}`,
        valor: i.valor,
      }))
    situacoes.push({
      ordem: 0,
      origem: 'mudanca',
      codigo: 'M1',
      severidade: caiu ? 'critica' : 'info',
      titulo: `Projeção móvel dos próximos ${janelaForecastDias} dias ${caiu ? 'perdeu' : 'ganhou'} ${fmtBRL(Math.abs(forecast.delta))} desde ${fmtDataCurta(mudancas.anterior_em)}`,
      subtitulo: `${fmtBRL(forecast.anterior)} → ${fmtBRL(forecast.atual)} na janela de ${janelaForecastDias} dias de cada referência · pipeline do período: ${mudancas.pipeline.delta >= 0 ? '+' : '−'}${fmtBRL(Math.abs(mudancas.pipeline.delta))}`,
      quantidade: mudancas.concentracao.quantidade_explicam,
      impacto: Math.abs(forecast.delta),
      responsaveis: new Set(mudancas.concentracao.itens.map((i) => i.responsavel_nome)).size,
      concentracao_etapas: `${mudancas.concentracao.quantidade_explicam} oportunidades explicam ${mudancas.concentracao.pct_explicada}% da variação`,
      por_que_apareceu:
        'comparação entre o estado anterior sintético (T-7) e o snapshot atual: entradas, saídas e deslocamentos de previsão alteraram a janela de 30 dias',
      limitacao:
        `o estado anterior é uma simulação documentada do seed; a janela de ${janelaForecastDias} dias é medida em cada referência — os limites do período não são idênticos`,
      decisao_pendente: 'reforecast das oportunidades que explicam a variação',
      cta: { tela: 'mudancas', rotulo: 'Revisar mudanças' },
      exemplos: top,
    })
  }

  // --- Situações do radar, em linguagem de decisão ---
  const titulos: Record<string, { titulo: string; subtitulo: string }> = {
    R1: {
      titulo: 'precisam de revisão de previsão',
      subtitulo: 'previsão atual anterior à data de referência, oportunidade ainda aberta',
    },
    R2: {
      titulo: 'registros sem ação há mais de 21 dias',
      subtitulo: 'leitura de registro — não afirma ausência de trabalho',
    },
    R3: {
      titulo: 'em deslocamento de previsão acumulado',
      subtitulo: 'previsão atual deslocada mais de 60 dias da inicial',
    },
    R4: {
      titulo: 'em etapa avançada sem compromisso futuro',
      subtitulo: 'agenda do sistema sem próximo compromisso registrado',
    },
    R5: {
      titulo: 'ganhos aguardam pedido registrado',
      subtitulo: 'Win ≠ Pedido — fechamento sem pedido vinculado há mais de 30 dias',
    },
    R6: {
      titulo: 'pedidos aguardam conferência',
      subtitulo: 'pedido registrado, conferência pendente há mais de 15 dias',
    },
    R7: {
      titulo: 'probabilidades divergem da previsão',
      subtitulo: 'probabilidade alta com previsão vencida',
    },
  }

  for (const r of regras) {
    if (r.quantidade === 0) continue
    const t = titulos[r.codigo]
    if (!t) continue
    const prefixo = r.codigo === 'R5' || r.codigo === 'R6' ? fmtInt(r.quantidade) : fmtBRL(r.valor_exposto)
    situacoes.push({
      ordem: 0,
      origem: 'radar',
      codigo: r.codigo,
      severidade: r.severidade,
      titulo: `${prefixo} ${t.titulo}`,
      subtitulo: t.subtitulo,
      quantidade: r.quantidade,
      impacto: r.valor_exposto,
      responsaveis: r.responsaveis,
      concentracao_etapas: r.concentracao_etapas,
      por_que_apareceu: r.regra,
      limitacao: r.limitacao,
      decisao_pendente: r.decisao_pendente,
      cta: { tela: 'casos', rotulo: 'Revisar população' },
      exemplos: exemplosDe(regras, r.codigo),
    })
  }

  // Priorização: mudança de forecast primeiro; depois criticidade e impacto.
  situacoes.sort((a, b) => {
    if (a.origem !== b.origem) return a.origem === 'mudanca' ? -1 : 1
    const sev = (s: Severidade) => (s === 'critica' ? 0 : s === 'atencao' ? 1 : 2)
    return sev(a.severidade) - sev(b.severidade) || b.impacto - a.impacto
  })
  const selecionadas = situacoes.slice(0, MAX_SITUACOES).map((s, i) => ({ ...s, ordem: i + 1 }))
  const itensAgendaExecutiva = montarAgendaExecutiva(snap, competenciaPex)

  // --- Pauta determinística de reunião ---
  const pipelineAberto = snap.oportunidades.filter((o) => o.situacao === 'Aberta')
  const valorAberto = pipelineAberto.reduce((s, o) => s + o.valor_previsto, 0)
  const pauta: SecaoPauta[] = [
    {
      titulo: 'Resultado atual',
      linhas: [
        `Pipeline aberto: ${fmtBRL(valorAberto)} em ${fmtInt(pipelineAberto.length)} oportunidades.`,
        mudancas
          ? `Na semana: ${fmtInt(mudancas.resumo.saidas_ganhas)} ganha(s) (${fmtBRL(mudancas.resumo.saidas_ganhas_valor)}) e ${fmtInt(mudancas.resumo.saidas_perdidas)} perda(s) (${fmtBRL(mudancas.resumo.saidas_perdidas_valor)}).`
          : 'Sem estado anterior para comparar.',
      ],
      quantidade: 2,
    },
    {
      titulo: 'O que mudou desde a última leitura',
      linhas: mudancas
        ? [
            `Entradas: ${fmtInt(mudancas.resumo.entradas)} (${fmtBRL(mudancas.resumo.entradas_valor)}) · saídas: ${fmtInt(mudancas.resumo.saidas_ganhas + mudancas.resumo.saidas_perdidas)}.`,
            `Deslocamentos de previsão: ${fmtInt(mudancas.resumo.deslocamentos)} · avanços de etapa: ${fmtInt(mudancas.resumo.avancos)}.`,
            `Variação do pipeline: ${mudancas.pipeline.delta >= 0 ? '+' : '−'}${fmtBRL(Math.abs(mudancas.pipeline.delta))}.`,
          ]
        : ['Estado anterior indisponível.'],
      quantidade: 3,
    },
    {
      titulo: 'Projeção móvel: entradas, saídas e deslocamentos',
      linhas: mudancas
        ? [
            `Projeção móvel ${janelaForecastDias} dias: ${fmtBRL(mudancas.forecast_periodo.anterior)} → ${fmtBRL(mudancas.forecast_periodo.atual)} (${mudancas.forecast_periodo.delta >= 0 ? '+' : '−'}${fmtBRL(Math.abs(mudancas.forecast_periodo.delta))}).`,
            `${mudancas.concentracao.quantidade_explicam} oportunidades explicam ${mudancas.concentracao.pct_explicada}% da variação do pipeline.`,
          ]
        : ['Estado anterior indisponível.'],
      quantidade: 2,
    },
    {
      titulo: 'Populações que exigem atenção',
      linhas: regras
        .filter((r) => r.quantidade > 0)
        .slice(0, 5)
        .map((r) => `${r.codigo} · ${r.nome}: ${fmtInt(r.quantidade)} oportunidades · ${fmtBRL(r.valor_exposto)} · ${r.concentracao_etapas}`),
      quantidade: 5,
    },
    {
      titulo: 'Casos que concentram impacto',
      linhas: [...casos.casos]
        .sort((a, b) => (a.severidade === 'critica' ? -1 : 1) - (b.severidade === 'critica' ? -1 : 1) || b.impacto - a.impacto)
        .slice(0, 5)
        .map((c) => `${c.caso_id} · ${c.oportunidade_nome} (${c.conta_fantasia}) · ${c.sinal_codigo} · ${fmtBRL(c.impacto)} · decidir: ${c.decisao_pendente}`),
      quantidade: 5,
    },
    {
      titulo: 'Decisões pendentes',
      linhas: [
        `${fmtInt(casos.resumo.total)} casos abertos · ${fmtInt(casos.resumo.aguardando)} aguardando revisão · ${fmtInt(casos.resumo.em_analise)} em análise · ${fmtInt(casos.resumo.acompanhamento)} em acompanhamento.`,
        `Impacto total sob decisão: ${fmtBRL(casos.resumo.impacto_total)}.`,
      ],
      quantidade: 2,
    },
  ]

  return {
    situacoes: selecionadas,
    pauta,
    agenda_executiva: {
      competencia: competenciaPex,
      fuso_horario: FUSO_HORARIO_PEX_FIXTURE,
      itens: itensAgendaExecutiva,
      mutirao_por_motivo: agruparMutiraoPorMotivo(itensAgendaExecutiva),
      limitacao_perda_ritmo: LIMITACAO_PERDA_RITMO_AGENDA,
    },
    janela_forecast_dias: janelaForecastDias,
    snapshot_em: snap.meta['snapshot_em'] ?? hoje.toISOString(),
    anterior_em: anteriorEm,
  }
}
