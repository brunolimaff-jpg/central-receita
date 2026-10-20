import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { regrasRadar, sinaisPorOportunidade } from '@/lib/domain/radar'
import { linhaDeOportunidade } from '@/lib/domain/detalhe'
import { filtrarSnapshot } from '@/lib/domain/contexto'
import { filtrarOportunidadesPorEtapa } from '@/lib/domain/crm-taxonomy'

// Fila de oportunidades com filtros determinísticos.
// Parâmetros: situacao, etapa, sinal, responsavel (id), busca, ordenar.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const situacao = url.searchParams.get('situacao') ?? 'todas'
    const etapa = url.searchParams.get('etapa') ?? 'todas'
    const sinal = url.searchParams.get('sinal') ?? 'todos'
    const responsavel = url.searchParams.get('responsavel') ?? 'todos'
    const busca = (url.searchParams.get('busca') ?? '').trim().toLowerCase()
    const ordenar = url.searchParams.get('ordenar') ?? 'valor'

    const snap = filtrarSnapshot(await carregarSnapshot(), url.searchParams)
    const hoje = new Date()
    const sinaisMapa = sinaisPorOportunidade(snap, hoje)

    let linhas = snap.oportunidades
      .map((o) => linhaDeOportunidade(snap, o.oportunidade_id, hoje))
      .filter((x): x is NonNullable<typeof x> => x !== null)

    if (situacao !== 'todas') linhas = linhas.filter((o) => o.situacao === situacao)
    linhas = filtrarOportunidadesPorEtapa(linhas, etapa)
    if (responsavel !== 'todos') linhas = linhas.filter((o) => String(o.responsavel_id) === responsavel)
    if (sinal !== 'todos') {
      linhas = linhas.filter((o) => (sinaisMapa.get(o.oportunidade_id) ?? []).some((c) => c.replace('!', '') === sinal))
    }
    if (busca) {
      linhas = linhas.filter(
        (o) =>
          o.nome.toLowerCase().includes(busca) ||
          o.conta_fantasia.toLowerCase().includes(busca) ||
          String(o.oportunidade_id).includes(busca) ||
          o.responsavel_nome.toLowerCase().includes(busca)
      )
    }

    if (ordenar === 'valor') linhas.sort((a, b) => b.valor_previsto - a.valor_previsto)
    else if (ordenar === 'previsao') linhas.sort((a, b) => (a.previsao_atual ?? '9999') < (b.previsao_atual ?? '9999') ? -1 : 1)
    else if (ordenar === 'risco') linhas.sort((a, b) => (b.previsao_vencida_ha_dias ?? -1) - (a.previsao_vencida_ha_dias ?? -1))
    else if (ordenar === 'recente') linhas.sort((a, b) => (a.dias_desde_ultima_acao ?? 9999) - (b.dias_desde_ultima_acao ?? 9999))

    const totalValor = linhas.filter((o) => o.situacao === 'Aberta').reduce((s, o) => s + o.valor_previsto, 0)

    return NextResponse.json({
      total: linhas.length,
      valor_aberto: totalValor,
      filtros: { situacao, etapa, sinal, responsavel, busca, ordenar },
      oportunidades: linhas,
    })
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao listar oportunidades', detalhe: String(e) }, { status: 500 })
  }
}
