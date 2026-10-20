import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { responder } from '@/lib/domain/agente'
import { filtrarSnapshot } from '@/lib/domain/contexto'

// "Pergunte à Receita" — agente simulado, somente leitura, sem LLM.
// Respostas determinísticas sobre os dados locais (mesma leitura da interface).
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const pergunta = typeof body?.pergunta === 'string' ? body.pergunta : ''
    if (!pergunta.trim()) {
      return NextResponse.json({ erro: 'Envie { "pergunta": "..." }' }, { status: 400 })
    }
    const parametros = new URL(request.url).searchParams
    const contexto = body?.contexto && typeof body.contexto === 'object' ? body.contexto : {}
    for (const chave of ['filial', 'classificacao']) {
      const valor = contexto[chave]
      if (typeof valor === 'string') parametros.set(chave, valor)
    }
    const janelaForecastDias = [30, 60, 90].includes(Number(contexto.janelaForecast)) ? Number(contexto.janelaForecast) : 30
    const snap = filtrarSnapshot(await carregarSnapshot(), parametros)
    return NextResponse.json(responder(pergunta, snap, new Date(), janelaForecastDias))
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao processar a pergunta', detalhe: String(e) }, { status: 500 })
  }
}
