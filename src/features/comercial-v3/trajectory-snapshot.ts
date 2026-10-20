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
): TrajectorySnapshot {
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

/** Entrada nova do histórico local: o snapshot entra só quando existe, para cargas antigas seguirem iguais. */
export function historyEntry(
  entry: Omit<ImportHistoryEntry, 'snapshot'> & { snapshot: TrajectorySnapshot | null },
): ImportHistoryEntry {
  const { snapshot, ...rest } = entry
  return snapshot ? { ...rest, snapshot } : rest
}
