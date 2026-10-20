import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { visaoComercial } from '@/lib/domain/metrics'
import { resumoGestao } from '@/lib/domain/gestao'
import { filtrarSnapshot } from '@/lib/domain/contexto'
import { competenciaPexDaData, FUSO_HORARIO_PEX_FIXTURE } from '@/lib/domain/forecast-pex'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const anoParametro = url.searchParams.get('ano')
    const mesParametro = url.searchParams.get('mes')
    const agora = new Date()
    let competencia = competenciaPexDaData(agora, FUSO_HORARIO_PEX_FIXTURE)
    if (anoParametro !== null || mesParametro !== null) {
      const ano = Number(anoParametro)
      const mes = Number(mesParametro)
      if (!Number.isInteger(ano) || ano < 1 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
        return NextResponse.json({ erro: 'Competência PEX inválida; informe ano e mês entre 1 e 12.' }, { status: 400 })
      }
      competencia = { ano, mes }
    }
    const dias = [30, 60, 90].includes(Number(url.searchParams.get('janela'))) ? Number(url.searchParams.get('janela')) : 30
    const snapCompleto = await carregarSnapshot()
    const snap = filtrarSnapshot(snapCompleto, url.searchParams)
    // ponytail: /api/visao passa a rodar o motor do radar 1× (O(regras×oportunidades)) a mais
    // por request — e o bloco de gestão é calculado sobre o snapshot SEM o filtro de filial:
    // ranking é comparação global; quem aplica o recorte de filial é o clique na unidade.
    let snapGestao = snap
    if (url.searchParams.get('filial')) {
      const paramsSemFilial = new URLSearchParams(url.searchParams)
      paramsSemFilial.delete('filial')
      snapGestao = filtrarSnapshot(snapCompleto, paramsSemFilial)
    }
    return NextResponse.json({
      ...visaoComercial(snap, competencia, FUSO_HORARIO_PEX_FIXTURE, agora, dias),
      gestao: resumoGestao(snapGestao, agora),
    })
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao montar a visão comercial', detalhe: String(e) }, { status: 500 })
  }
}
