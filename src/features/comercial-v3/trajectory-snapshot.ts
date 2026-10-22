import type { ForecastMonthResult } from './forecast-month'
import type { ImportHistoryEntry, TrajectorySnapshot } from './manual-import-client'

/**
 * Resumo numérico de uma carga, guardado no histórico para a trajetória comparar
 * cargas passadas sem reler os registros completos.
 *
 * Valores em reais. `null` quando algum registro da conta não traz valor — a
 * mesma regra de `calculateForecastMonth` (`sumKnown`): nulo contamina, nunca
 * vira zero. `exited` é sinalizado (negativo), como os deltas de
 * `movement-rows`, para que `entrou + saiu + alterou` some à variação do total.
 */
export function trajectorySnapshotFrom(
  current: ForecastMonthResult,
  previous: ForecastMonthResult | null,
  previousReferenceDate?: string,
): TrajectorySnapshot {
  /*
   * Só cargas do mesmo mês de referência são comparáveis. Referência da anterior
   * ausente segue o mês atual (compatibilidade com cargas antigas); referência
   * presente e inválida bloqueia o movimento — nulo, nunca zero.
   */
  const monthCurrent = current.period.start.slice(0, 7)
  if (previousReferenceDate !== undefined) {
    const monthPrevious = mesDaData(previousReferenceDate)
    if (monthPrevious === null || monthPrevious !== monthCurrent) {
      return { forecastTotal: current.predicted.value, entered: null, exited: null, changed: null, realized: current.realized.value }
    }
  }
  let changed: number | null = null
  if (previous) {
    const previousById = new Map(previous.predicted.records.map(record => [record.opportunityId, record]))
    changed = 0
    for (const record of current.predicted.records) {
      const earlier = previousById.get(record.opportunityId)
      if (!earlier) continue
      if (record.predictedValue === null || earlier.predictedValue === null) { changed = null; break }
      changed += record.predictedValue - earlier.predictedValue
    }
  }
  return {
    forecastTotal: current.predicted.value,
    entered: current.entered ? current.entered.value : null,
    exited: current.exited && current.exited.value !== null ? 0 - current.exited.value : null,
    changed,
    realized: current.realized.value,
  }
}

/** `2026-10-21` → `2026-10`; `null` se a data não for ISO válida. */
const mesDaData = (date: string): string | null =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 7) : null

/**
 * Gate da página, compartilhado com o modelo: diz se o resumo de uma carga pode
 * virar ponto da série. Só previsto e realizado precisam ser conhecidos; o
 * movimento fica nulo na primeira carga e continua nulo — não é motivo para
 * descartar o ponto nem vira zero.
 */
export function resumoViraPonto(
  snapshot: ImportHistoryEntry['snapshot'],
): snapshot is TrajectorySnapshot {
  return snapshot !== undefined && snapshot.forecastTotal !== null && snapshot.realized !== null
}

/** Entrada nova do histórico local: o snapshot entra só quando existe, para cargas antigas seguirem iguais. */
export function historyEntry(
  entry: Omit<ImportHistoryEntry, 'snapshot'> & { snapshot: TrajectorySnapshot | null },
): ImportHistoryEntry {
  const { snapshot, ...rest } = entry
  return snapshot ? { ...rest, snapshot } : rest
}
