import { NextResponse } from 'next/server'
import { carregarSnapshot } from '@/lib/domain/snapshot'

export async function GET() {
  try {
    const snap = await carregarSnapshot()
    return NextResponse.json({
      produto: 'Central de Receita',
      tipo_dados: 'sinteticos',
      versao: snap.meta.versao ?? 'v1.0.0-mock',
      snapshot_em: snap.meta.snapshot_em ?? null,
      semente: snap.meta.semente ?? null,
      aviso: snap.meta.aviso ?? 'Dados sintéticos.',
      filiais: [...new Set(snap.contas.map((conta) => conta.filial))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      contagens: {
        contas: snap.contas.length,
        oportunidades: snap.oportunidades.length,
        acoes: snap.acoes.length,
        compromissos: snap.compromissos.length,
        propostas: snap.propostas.length,
        ocorrencias: snap.ocorrencias.length,
        qics: snap.qics.length,
        concorrentes: snap.concorrentes.length,
        pedidos: snap.pedidos.length,
      },
    })
  } catch (e) {
    return NextResponse.json({ erro: 'Falha ao carregar snapshot', detalhe: String(e) }, { status: 500 })
  }
}
