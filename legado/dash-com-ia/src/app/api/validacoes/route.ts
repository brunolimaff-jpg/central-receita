import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { executarValidacoes } from '@/lib/domain/validacoes'
import { filtrarSnapshot } from '@/lib/domain/contexto'

// Executa as validações de invariantes do contrato (determinísticas, sob demanda).
export async function GET(request: Request) {
  try {
    const snap = filtrarSnapshot(await carregarSnapshot(), new URL(request.url).searchParams)
    return NextResponse.json(executarValidacoes(snap))
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao executar validações', detalhe: String(e) }, { status: 500 })
  }
}
