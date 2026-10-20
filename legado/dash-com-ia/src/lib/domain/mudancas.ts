// Mudanças — diferença determinística entre o estado anterior (T-7, sintético)
// e o snapshot atual. Toda mudança abre a população que a explica.
// O estado anterior é gerado no seed com regras documentadas (Meta:
// 'estado_anterior'); este módulo apenas compara dois estados — não inventa.

import { fmtBRL, fmtDataCurta } from './format'
import { resolverEtapaOportunidade } from './crm-taxonomy'
import { rotuloEtapaTaxonomia } from './types'
import type { EstadoOportunidadeAnterior, ItemMudanca, MudancaConcentrada, MudancasDTO, OportunidadeDTO, Snapshot } from './types'

const MS_DIA = 86_400_000

interface EstadoAnterior {
  referencia: string
  regras: string[]
  oportunidades: EstadoOportunidadeAnterior[]
}

export function carregarEstadoAnterior(snap: Snapshot): EstadoAnterior | null {
  const bruto = snap.meta['estado_anterior']
  if (!bruto) return null
  try {
    const parsed = JSON.parse(bruto) as EstadoAnterior
    if (!parsed || !Array.isArray(parsed.oportunidades) || !parsed.referencia) return null
    return parsed
  } catch {
    return null
  }
}

function janelaForecast(oportunidades: Array<{ situacao: string; previsao_atual: string | null; valor_previsto: number }>, de: Date, ate: Date): number {
  let total = 0
  for (const o of oportunidades) {
    if (o.situacao !== 'Aberta' || !o.previsao_atual) continue
    const prev = new Date(o.previsao_atual)
    if (prev >= de && prev <= ate) total += o.valor_previsto
  }
  return total
}

function item(o: OportunidadeDTO, detalhe: string): ItemMudanca {
  return {
    oportunidade_id: o.oportunidade_id,
    nome: o.nome,
    conta_fantasia: o.conta_fantasia,
    responsavel_nome: o.responsavel_nome,
    valor: o.valor_previsto,
    detalhe,
  }
}

export function calcularMudancas(snap: Snapshot, hoje = new Date(), janelaDias = 30): MudancasDTO | null {
  const anterior = carregarEstadoAnterior(snap)
  if (!anterior) return null

  const refAnterior = new Date(anterior.referencia)
  const mapaAnterior = new Map(anterior.oportunidades.map((e) => [e.oportunidade_id, e]))

  const entradas: ItemMudanca[] = []
  const saidasGanhas: ItemMudanca[] = []
  const saidasPerdidas: ItemMudanca[] = []
  const deslocamentos: ItemMudanca[] = []
  const avancos: ItemMudanca[] = []

  for (const o of snap.oportunidades) {
    const ant = mapaAnterior.get(o.oportunidade_id)
    if (!ant) {
      entradas.push(item(o, `criada ${fmtDataCurta(o.criada_em)} · ${rotuloEtapaTaxonomia(o.etapa_taxonomia)} · origem ${o.origem} (fixture)`))
      continue
    }
    // Saída: estava Aberta na referência e não está mais.
    // O valor da saída é o valor_previsto que deixou o pipeline aberto; o
    // valor realizado (fechado) vai no detalhe — aritmética do diff fecha.
    if (ant.situacao === 'Aberta' && o.situacao !== 'Aberta') {
      const motivo = o.situacao === 'Ganha' ? o.motivo_fechamento : o.motivo_perda
      const etapaAnterior = resolverEtapaOportunidade(ant.tipo_oportunidade ?? null, ant.etapa)
      const detalhe = `${o.situacao.toLowerCase()} ${fmtDataCurta(o.fechamento_efetivo)}${motivo ? ` · ${motivo}` : ''} · antes em ${rotuloEtapaTaxonomia(etapaAnterior)}${o.situacao === 'Ganha' && o.valor_fechado !== null && o.valor_fechado !== o.valor_previsto ? ` · valor fechado ${fmtBRL(o.valor_fechado)}` : ''}`
      const saida = item(o, detalhe)
      if (o.situacao === 'Ganha') saidasGanhas.push(saida)
      else saidasPerdidas.push(saida)
    }
    if (o.situacao !== 'Aberta' || ant.situacao !== 'Aberta') continue

    // Deslocamento de previsão (apenas abertas, ambas com previsão).
    if (o.previsao_atual && ant.previsao_atual && o.previsao_atual !== ant.previsao_atual) {
      const slip = Math.round((new Date(o.previsao_atual).getTime() - new Date(ant.previsao_atual).getTime()) / MS_DIA)
      deslocamentos.push(item(o, `previsão ${fmtDataCurta(ant.previsao_atual)} → ${fmtDataCurta(o.previsao_atual)} (deslocada ${slip}d)`))
    }
    // Avanço de etapa.
    if (o.etapa !== ant.etapa) {
      const etapaAnterior = resolverEtapaOportunidade(ant.tipo_oportunidade ?? null, ant.etapa)
      avancos.push(item(o, `${rotuloEtapaTaxonomia(etapaAnterior)} → ${rotuloEtapaTaxonomia(o.etapa_taxonomia)} · prob. ${ant.probabilidade}% → ${o.probabilidade}%`))
    }
  }

  const abertasAnteriores = anterior.oportunidades.filter((e) => e.situacao === 'Aberta')
  const abertasAtuais = snap.oportunidades.filter((o) => o.situacao === 'Aberta')
  const pipelineAnterior = abertasAnteriores.reduce((s, e) => s + e.valor_previsto, 0)
  const pipelineAtual = abertasAtuais.reduce((s, o) => s + o.valor_previsto, 0)

  const entradasValor = entradas.reduce((s, e) => s + e.valor, 0)
  const saidasGanhasValor = saidasGanhas.reduce((s, e) => s + e.valor, 0)
  const saidasPerdidasValor = saidasPerdidas.reduce((s, e) => s + e.valor, 0)

  // A janela de Forecast é medida em relação a cada referência do snapshot.
  const forecastAnterior = janelaForecast(
    abertasAnteriores.map((e) => ({ situacao: e.situacao, previsao_atual: e.previsao_atual, valor_previsto: e.valor_previsto })),
    refAnterior,
    new Date(refAnterior.getTime() + janelaDias * MS_DIA),
  )
  const forecastAtual = janelaForecast(abertasAtuais, hoje, new Date(hoje.getTime() + janelaDias * MS_DIA))
  const forecast30Anterior = janelaForecast(
    abertasAnteriores.map((e) => ({ situacao: e.situacao, previsao_atual: e.previsao_atual, valor_previsto: e.valor_previsto })),
    refAnterior,
    new Date(refAnterior.getTime() + 30 * MS_DIA),
  )
  const forecast30Atual = janelaForecast(abertasAtuais, hoje, new Date(hoje.getTime() + 30 * MS_DIA))

  const movimentosForecast: MudancaConcentrada[] = []
  const contribuicaoForecast = (estado: { situacao: string; previsao_atual: string | null; valor_previsto: number } | undefined, referencia: Date) => {
    if (!estado || estado.situacao !== 'Aberta' || !estado.previsao_atual) return 0
    const previsao = new Date(estado.previsao_atual)
    return previsao >= referencia && previsao <= new Date(referencia.getTime() + janelaDias * MS_DIA) ? estado.valor_previsto : 0
  }
  for (const o of snap.oportunidades) {
    const ant = mapaAnterior.get(o.oportunidade_id)
    const anteriorValor = contribuicaoForecast(ant, refAnterior)
    const atualValor = contribuicaoForecast(o, hoje)
    const delta = atualValor - anteriorValor
    if (delta === 0) continue
    movimentosForecast.push({
      ...item(o, `Projeção móvel na janela: ${fmtBRL(anteriorValor)} → ${fmtBRL(atualValor)}`),
      valor: Math.abs(delta),
      contribuicao: delta,
      acumulado_pct: 0,
    })
  }
  movimentosForecast.sort((a, b) => Math.abs(b.contribuicao) - Math.abs(a.contribuicao))
  const totalMovimentoForecast = movimentosForecast.reduce((total, movimento) => total + Math.abs(movimento.contribuicao), 0)
  let acumuladoForecast = 0
  for (const movimento of movimentosForecast) {
    acumuladoForecast += Math.abs(movimento.contribuicao)
    movimento.acumulado_pct = totalMovimentoForecast > 0 ? Math.round((acumuladoForecast / totalMovimentoForecast) * 100) : 0
  }
  let quantidadeExplicaForecast = 0
  for (const movimento of movimentosForecast) {
    quantidadeExplicaForecast++
    if (movimento.acumulado_pct >= 80) break
  }
  const itensForecast = totalMovimentoForecast > 0 ? movimentosForecast.slice(0, quantidadeExplicaForecast) : []
  const pctExplicadaForecast = itensForecast.at(-1)?.acumulado_pct ?? 0

  // Concentração da variação do pipeline: entradas (+) e saídas (−),
  // ordenadas por |contribuição|, com acumulado em % do total movimentado.
  const contribucoes: MudancaConcentrada[] = [
    ...entradas.map((e) => ({ ...e, contribuicao: e.valor, acumulado_pct: 0 })),
    ...saidasGanhas.map((e) => ({ ...e, contribuicao: -e.valor, acumulado_pct: 0 })),
    ...saidasPerdidas.map((e) => ({ ...e, contribuicao: -e.valor, acumulado_pct: 0 })),
  ].sort((a, b) => Math.abs(b.contribuicao) - Math.abs(a.contribuicao))
  const totalMovimentado = contribucoes.reduce((s, c) => s + Math.abs(c.contribuicao), 0)
  let acumulado = 0
  for (const c of contribucoes) {
    acumulado += Math.abs(c.contribuicao)
    c.acumulado_pct = totalMovimentado > 0 ? Math.round((acumulado / totalMovimentado) * 100) : 0
  }
  const quantidadeExplicam = (() => {
    let n = 0
    let pct = 0
    for (const c of contribucoes) {
      n++
      pct = c.acumulado_pct
      if (pct >= 80) break
    }
    return totalMovimentado > 0 ? n : 0
  })()
  const pctExplicada = quantidadeExplicam > 0 ? contribucoes[quantidadeExplicam - 1]?.acumulado_pct ?? 0 : 0

  const ordenarPorValor = (arr: ItemMudanca[]) => [...arr].sort((a, b) => b.valor - a.valor)
  const ordenarPorSlip = (arr: ItemMudanca[]) =>
    [...arr].sort((a, b) => (Number(b.detalhe.match(/deslocada (\-?\d+)d/)?.[1] ?? 0) - Number(a.detalhe.match(/deslocada (\-?\d+)d/)?.[1] ?? 0)))

  return {
    anterior_em: anterior.referencia,
    atual_em: snap.meta['snapshot_em'] ?? hoje.toISOString(),
    pipeline: { anterior: pipelineAnterior, atual: pipelineAtual, delta: pipelineAtual - pipelineAnterior },
    forecast_30d: { anterior: forecast30Anterior, atual: forecast30Atual, delta: forecast30Atual - forecast30Anterior },
    forecast_periodo: {
      dias: janelaDias,
      anterior: forecastAnterior,
      atual: forecastAtual,
      delta: forecastAtual - forecastAnterior,
      concentracao: {
        quantidade_explicam: itensForecast.length,
        pct_explicada: pctExplicadaForecast,
        itens: itensForecast,
      },
    },
    resumo: {
      entradas: entradas.length,
      entradas_valor: entradasValor,
      saidas_ganhas: saidasGanhas.length,
      saidas_ganhas_valor: saidasGanhasValor,
      saidas_perdidas: saidasPerdidas.length,
      saidas_perdidas_valor: saidasPerdidasValor,
      deslocamentos: deslocamentos.length,
      deslocamentos_valor: deslocamentos.reduce((s, d) => s + d.valor, 0),
      avancos: avancos.length,
      avancos_valor: avancos.reduce((s, d) => s + d.valor, 0),
    },
    concentracao: {
      quantidade_explicam: quantidadeExplicam,
      pct_explicada: pctExplicada,
      itens: contribucoes.slice(0, 8),
    },
    entradas: ordenarPorValor(entradas),
    saidas_ganhas: ordenarPorValor(saidasGanhas),
    saidas_perdidas: ordenarPorValor(saidasPerdidas),
    deslocamentos: ordenarPorSlip(deslocamentos),
    avancos: ordenarPorValor(avancos),
  }
}
