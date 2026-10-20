import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { fontesERegras } from '@/lib/domain/proveniencia'
import { filtrarSnapshot } from '@/lib/domain/contexto'

export async function GET(request: Request) {
  try {
    const snap = filtrarSnapshot(await carregarSnapshot(), new URL(request.url).searchParams)
    return NextResponse.json(fontesERegras(snap))
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao montar fontes e regras', detalhe: String(e) }, { status: 500 })
  }
}
