import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'
import { regrasRadar, resumoAtencao } from '@/lib/domain/radar'
import { filtrarSnapshot } from '@/lib/domain/contexto'

export async function GET(request: Request) {
  try {
    const snap = filtrarSnapshot(await carregarSnapshot(), new URL(request.url).searchParams)
    const hoje = new Date()
    return NextResponse.json({
      resumo: resumoAtencao(snap, hoje),
      regras: regrasRadar(snap, hoje),
      principio: 'Os sinais são determinísticos sobre o que está registrado. Ausência de registro ≠ ausência de trabalho.',
      snapshot_em: snap.meta.snapshot_em ?? null,
      versao: snap.meta.versao ?? 'Versão não comprovada',
    })
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao montar o radar', detalhe: String(e) }, { status: 500 })
  }
}
