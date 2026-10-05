import type { BranchModel, FilialRow, SemanaRow } from './model'

export const FORECAST_OFFICIAL_LABEL = 'Forecast oficial'
export const AGENT_DEMO_FOOTER = 'Cenário demonstrativo · respostas simuladas · nenhuma alteração é gravada.'
export const AGENT_DEMO_SNAPSHOT = 'cenário demonstrativo'

type BranchValues = Pick<BranchModel, 'meta' | 'realizado' | 'forecastAtual' | 'atingimento'>

export function branchSummaryValues(model: BranchValues, real?: FilialRow) {
  if (!real) return { ...model, missing: [], source: 'synthetic' as const }

  const missing = real.missing ?? []
  const unavailable = (key: 'meta' | 'realizado' | 'forecastAtual') => missing.includes(key)
  const meta = unavailable('meta') ? null : real.meta
  const realizado = unavailable('realizado') ? null : real.realizado
  const forecastAtual = unavailable('forecastAtual') ? null : real.forecastAtual
  const atingimento = meta && realizado !== null ? realizado / meta : null

  return { meta, realizado, forecastAtual, atingimento, missing, source: 'real' as const }
}

export function weekForecastValue(week: Pick<SemanaRow, 'closed' | 'forecast'>): number | null {
  return week.closed ? week.forecast : null
}
