import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { calcularMudancas } from '@/lib/domain/mudancas'
import { filtrarSnapshot } from '@/lib/domain/contexto'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const snap = filtrarSnapshot(await carregarSnapshot(), url.searchParams)
    const dias = [30, 60, 90].includes(Number(url.searchParams.get('janela'))) ? Number(url.searchParams.get('janela')) : 30
    const mudancas = calcularMudancas(snap, new Date(), dias)
    if (!mudancas) {
      return NextResponse.json({ erro: 'Estado anterior não disponível neste snapshot' }, { status: 503 })
    }
    return NextResponse.json(mudancas)
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao calcular mudanças', detalhe: String(e) }, { status: 500 })
  }
}
