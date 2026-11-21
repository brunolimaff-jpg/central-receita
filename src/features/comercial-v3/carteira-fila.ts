/**
 * Fila de pedidos por pessoa — bloco separado da carteira.
 *
 * Regra dura do projeto (ADR-0005, glossário): a fila é **dependência, não
 * acréscimo**. Ela nunca soma ao forecast nem aos ganhos no CRM, e a tela
 * mostra os dois em blocos distintos, com rótulos distintos.
 *
 * O que dá para medir com a carga de hoje: pedidos cujo proprietário é a
 * pessoa, agrupados pelo estado que o glossário já define (em conferência,
 * conferido, devolvido…) e pelo valor de manutenção. O que **não** dá para
 * medir: o realizado de vendas por pessoa, porque o gate oficial (integração
 * com ERP) segue em aberto na issue #4 — e o Bruno avisou que o ERP está em
 * mudança. Por isso a fila aqui é de **pendências**, não de realizado.
 */

import type { ImportedRecord } from './manual-import.ts'
import { resolveOrderSubstatus, type OrderSubstatus } from './new-name-model.ts'

export type EstadoFila = {
  estado: OrderSubstatus
  quantidade: number
  valor: number | null
  /** Pedidos distintos, não linhas de item. */
  pedidos: number
}

export type FilaPessoa = {
  estados: EstadoFila[]
  /** Total de pedidos distintos na fila. */
  pedidos: number
  /** Valor somado só dos estados de pendência — o que ainda vai acontecer. */
  valorPendente: number | null
  /** Estado do gate do realizado. Presente para a tela poder dizer o que não mede. */
  nota: string
}

const somarConhecido = (registros: ImportedRecord[], valor: (r: ImportedRecord) => number | null): number | null =>
  registros.some(r => valor(r) === null) ? null : registros.reduce((soma, r) => soma + (valor(r) ?? 0), 0)

/** Estados em que o pedido ainda não concluiu — a fila propriamente dita. */
const PENDENTES: OrderSubstatus[] = ['em conferência', 'devolvido']

/**
 * Monta a fila de uma pessoa a partir dos pedidos atribuídos a ela.
 *
 * O valor de um pedido é o de manutenção (`maintenance`), a mesma rubrica do
 * New Name. Quando algum registro do estado não traz o valor, o total daquele
 * estado fica desconhecido — nulo propaga, nunca vira zero.
 */
export function filaDaPessoa(pedidos: ImportedRecord[]): FilaPessoa {
  const porEstado = new Map<OrderSubstatus, ImportedRecord[]>()
  for (const pedido of pedidos) {
    const estado = resolveOrderSubstatus(pedido.status)
    const lista = porEstado.get(estado)
    if (lista) lista.push(pedido); else porEstado.set(estado, [pedido])
  }

  const estados: EstadoFila[] = [...porEstado.entries()]
    .map(([estado, registros]) => ({
      estado,
      quantidade: registros.length,
      valor: somarConhecido(registros, r => r.maintenance ?? null),
      // Um pedido com N linhas é um pedido. A contagem distinta protege disso.
      pedidos: new Set(registros.map(r => r.orderId).filter(Boolean)).size,
    }))
    .sort((a, b) => (b.valor ?? -Infinity) - (a.valor ?? -Infinity))

  const pendentes = estados.filter(e => PENDENTES.includes(e.estado))

  return {
    estados,
    pedidos: new Set(pedidos.map(r => r.orderId).filter(Boolean)).size,
    valorPendente: pendentes.some(e => e.valor === null)
      ? null
      : pendentes.reduce((soma, e) => soma + (e.valor ?? 0), 0),
    nota: 'A fila não soma ao forecast. O realizado de vendas por pessoa depende do gate de integração, ainda em aberto.',
  }
}

/** Rótulo humano do estado, no vocabulário do glossário. */
export const ROTULO_ESTADO: Record<OrderSubstatus, string> = {
  'integrado': 'Integrado',
  'em conferência': 'Em conferência',
  'conferido': 'Conferido',
  'devolvido': 'Devolvido',
  'cancelado': 'Cancelado',
  'Não classificado': 'Não classificado',
}
