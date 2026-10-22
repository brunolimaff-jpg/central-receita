import type { Snapshot } from './types'

/** Aplica recortes globais às populações relacionadas sem misturar entidades. */
export function filtrarSnapshot(snap: Snapshot, parametros: URLSearchParams): Snapshot {
  const filial = parametros.get('filial')
  const classificacao = parametros.get('classificacao')
  if ((!filial || filial === 'todas') && (!classificacao || classificacao === 'todas')) return snap

  const filiaisPermitidas = new Set(
    snap.contas.filter((conta) => !filial || filial === 'todas' || conta.filial === filial).map((conta) => conta.conta_id),
  )
  const oportunidades = snap.oportunidades.filter((opp) =>
    filiaisPermitidas.has(opp.conta_id) && (!classificacao || classificacao === 'todas' || opp.classificacao_fixture === classificacao),
  )
  const ids = new Set(oportunidades.map((opp) => opp.oportunidade_id))
  const estadoAnterior = (() => {
    try {
      const anterior = JSON.parse(snap.meta.estado_anterior ?? 'null')
      if (!anterior || !Array.isArray(anterior.oportunidades)) return snap.meta.estado_anterior
      return JSON.stringify({ ...anterior, oportunidades: anterior.oportunidades.filter((item: { oportunidade_id?: number }) => ids.has(item.oportunidade_id ?? -1)) })
    } catch {
      return snap.meta.estado_anterior
    }
  })()

  return {
    ...snap,
    meta: { ...snap.meta, ...(estadoAnterior ? { estado_anterior: estadoAnterior } : {}) },
    contas: snap.contas.filter((conta) => oportunidades.some((opp) => opp.conta_id === conta.conta_id)),
    oportunidades,
    acoes: snap.acoes.filter((item) => ids.has(item.oportunidade_id)),
    compromissos: snap.compromissos.filter((item) => ids.has(item.oportunidade_id)),
    propostas: snap.propostas.filter((item) => ids.has(item.oportunidade_id)),
    ocorrencias: snap.ocorrencias.filter((item) => ids.has(item.oportunidade_id)),
    qics: snap.qics.filter((item) => ids.has(item.oportunidade_id)),
    concorrentes: snap.concorrentes.filter((item) => ids.has(item.oportunidade_id)),
    pedidos: snap.pedidos.filter((item) => ids.has(item.oportunidade_id)),
  }
}
