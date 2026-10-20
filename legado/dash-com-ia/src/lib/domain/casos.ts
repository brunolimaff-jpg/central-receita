// Casos de Decisão — a camada decisória da Central, acima da oportunidade.
// Um caso não altera o CRM: deriva deterministicamente dos sinais ativos do
// radar e agrega a evidência necessária para decidir.
//
// Construção: 1 sinal ativo (oportunidade × regra) = 1 caso.
// Estado simulado (sem persistência): derivado da evidência registrada —
//   · "em análise"       → ação registrada nos últimos 7 dias
//   · "acompanhamento"   → existe compromisso futuro agendado
//   · "aguardando revisão" → demais casos

import { construirIndice, regrasRadar } from './radar'
import { fmtDataCurta, fmtDiasAtras } from './format'
import type { CasoDecisao, CasosDTO, CompromissoDTO, Snapshot } from './types'

const MS_DIA = 86_400_000

export function gerarCasos(snap: Snapshot, hoje = new Date()): CasosDTO {
  const idx = construirIndice(snap, hoje)
  const regras = regrasRadar(snap, hoje)
  const oppPorId = new Map(snap.oportunidades.map((o) => [o.oportunidade_id, o]))

  const propostasValidas = new Set<number>()
  for (const p of snap.propostas) if (p.valida) propostasValidas.add(p.oportunidade_id)

  const compromissoFuturo = new Map<number, CompromissoDTO>()
  for (const c of snap.compromissos) {
    if (c.situacao !== 'Agendado' || new Date(c.data_hora) <= hoje) continue
    const atual = compromissoFuturo.get(c.oportunidade_id)
    if (!atual || new Date(c.data_hora) < new Date(atual.data_hora)) compromissoFuturo.set(c.oportunidade_id, c)
  }

  const casos: CasoDecisao[] = []
  let seq = 0
  const ordemSeveridade = (s: string) => (s === 'critica' ? 0 : 1)

  // Ordena regras por severidade e, dentro de cada uma, oportunidades por valor.
  const regrasOrdenadas = [...regras]
    .filter((r) => r.quantidade > 0)
    .sort((a, b) => ordemSeveridade(a.severidade) - ordemSeveridade(b.severidade) || b.valor_exposto - a.valor_exposto)

  for (const r of regrasOrdenadas) {
    for (const ref of r.oportunidades) {
      seq++
      const o = oppPorId.get(ref.oportunidade_id)
      if (!o) continue
      const ultima = idx.ultimaAcao.get(o.oportunidade_id)
      const diasUltima = ultima ? Math.round((hoje.getTime() - new Date(ultima).getTime()) / MS_DIA) : null
      const acaoMaisRecente = ultima
        ? [...snap.acoes].filter((a) => a.oportunidade_id === o.oportunidade_id && a.data_acao === ultima).sort((a, b) => b.acao_id - a.acao_id)[0]
        : undefined
      const comp = compromissoFuturo.get(o.oportunidade_id)
      const diasAberto = Math.round((hoje.getTime() - new Date(o.criada_em).getTime()) / MS_DIA)

      const estado: CasoDecisao['estado'] =
        diasUltima !== null && diasUltima <= 7 ? 'em análise' : comp ? 'acompanhamento' : 'aguardando revisão'

      casos.push({
        caso_id: `C-${String(seq).padStart(4, '0')}`,
        sinal_codigo: r.codigo,
        sinal_nome: r.nome,
        severidade: r.severidade,
        oportunidade_id: o.oportunidade_id,
        oportunidade_nome: o.nome,
        conta_fantasia: o.conta_fantasia,
        etapa: o.etapa,
        etapa_taxonomia: o.etapa_taxonomia,
        responsavel_nome: o.responsavel_nome,
        impacto: o.valor_previsto,
        contexto: ref.contexto,
        evidencia: {
          ultima_acao: acaoMaisRecente ? `${acaoMaisRecente.tipo_acao} (${fmtDiasAtras(diasUltima)})` : null,
          ultima_acao_ha_dias: diasUltima,
          compromisso_futuro: comp ? `${comp.assunto} · ${fmtDataCurta(comp.data_hora)}` : null,
          proposta_valida: propostasValidas.has(o.oportunidade_id),
          dias_em_aberto: diasAberto,
        },
        decisao_pendente: r.decisao_pendente,
        estado,
      })
    }
  }

  const criticos = casos.filter((c) => c.severidade === 'critica').length
  return {
    casos,
    resumo: {
      total: casos.length,
      impacto_total: casos.reduce((s, c) => s + c.impacto, 0),
      criticos,
      aguardando: casos.filter((c) => c.estado === 'aguardando revisão').length,
      em_analise: casos.filter((c) => c.estado === 'em análise').length,
      acompanhamento: casos.filter((c) => c.estado === 'acompanhamento').length,
    },
  }
}
