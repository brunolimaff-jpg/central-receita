import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { caixaAtencao } from '@/lib/domain/agora'
import { filtrarSnapshot } from '@/lib/domain/contexto'
import { competenciaPexDaData, FUSO_HORARIO_PEX_FIXTURE } from '@/lib/domain/forecast-pex'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const agora = new Date()
    const anoParametro = url.searchParams.get('ano')
    const mesParametro = url.searchParams.get('mes')
    let competencia = competenciaPexDaData(agora, FUSO_HORARIO_PEX_FIXTURE)
    if (anoParametro !== null || mesParametro !== null) {
      const ano = Number(anoParametro)
      const mes = Number(mesParametro)
      if (!Number.isInteger(ano) || ano < 1 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
        return NextResponse.json({ erro: 'Competência da agenda inválida; informe ano e mês entre 1 e 12.' }, { status: 400 })
      }
      competencia = { ano, mes }
    }
    const dias = [30, 60, 90].includes(Number(url.searchParams.get('janela'))) ? Number(url.searchParams.get('janela')) : 30
    const snap = filtrarSnapshot(await carregarSnapshot(), url.searchParams)
    return NextResponse.json(caixaAtencao(snap, agora, dias, competencia))
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao montar a caixa de atenção', detalhe: String(e) }, { status: 500 })
  }
}
