import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { resultadoWinLoss } from '@/lib/domain/winloss'
import { filtrarSnapshot } from '@/lib/domain/contexto'

export async function GET(request: Request) {
  try {
    const snap = filtrarSnapshot(await carregarSnapshot(), new URL(request.url).searchParams)
    return NextResponse.json(resultadoWinLoss(snap, new Date()))
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao montar win/loss', detalhe: String(e) }, { status: 500 })
  }
}
