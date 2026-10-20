import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { gerarCasos } from '@/lib/domain/casos'
import { filtrarSnapshot } from '@/lib/domain/contexto'

export async function GET(request: Request) {
  try {
    const snap = filtrarSnapshot(await carregarSnapshot(), new URL(request.url).searchParams)
    return NextResponse.json(gerarCasos(snap, new Date()))
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao gerar casos', detalhe: String(e) }, { status: 500 })
  }
}
