import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { construirDetalhe } from '@/lib/domain/detalhe'
import { sinaisDaOportunidade } from '@/lib/domain/radar'
import { filtrarSnapshot } from '@/lib/domain/contexto'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const oportunidadeId = Number(id)
    if (!Number.isInteger(oportunidadeId)) {
      return NextResponse.json({ erro: 'Identificador inválido' }, { status: 400 })
    }
    const snap = filtrarSnapshot(await carregarSnapshot(), new URL(request.url).searchParams)
    const detalhe = construirDetalhe(snap, oportunidadeId)
    if (!detalhe) {
      return NextResponse.json({ erro: `Oportunidade ${oportunidadeId} não encontrada` }, { status: 404 })
    }
    const sinais = sinaisDaOportunidade(snap, oportunidadeId)
    return NextResponse.json({ ...detalhe, sinais_detalhados: sinais })
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao montar o detalhe da oportunidade', detalhe: String(e) }, { status: 500 })
  }
}
