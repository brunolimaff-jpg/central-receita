import type { ForecastPeriod } from './forecast-month'

/**
 * Recorte que a Visão Executiva consegue abrir no Forecast da página corrida.
 *
 * O estado da seção é local; a URL recebe apenas um hash significativo para o
 * recorte que a Home oferece (`Ganhou`). Não é parâmetro global de filtro: não
 * promete filial nem solução.
 */
export type ForecastFocusMovement = 'Ganhou'

export type ForecastFocus = {
  movement: ForecastFocusMovement | null
  period: ForecastPeriod
}

export const HASH_FORECAST = '#forecast'
export const HASH_FORECAST_GANHOU = '#forecast-ganhou'

/**
 * Hash que descreve a seleção atual. Só "Ganhou" tem hash próprio; qualquer
 * outro movimento (ou nenhum) usa a âncora da seção, sem prometer o recorte.
 */
export function forecastHashFor(movement: string | null, period: ForecastPeriod = 'mês'): string {
  return movement === 'Ganhou' && period === 'mês' ? HASH_FORECAST_GANHOU : HASH_FORECAST
}

/**
 * Lê o hash sem confundir âncoras de outras seções com recorte do Forecast.
 * `null` significa "este hash não é do Forecast"; a tela ignora.
 */
export function forecastFocusFromHash(hash: string): ForecastFocus | null {
  const limpo = hash.trim().replace(/^#/, '')
  if (limpo === 'forecast-ganhou') return { movement: 'Ganhou', period: 'mês' }
  if (limpo === 'forecast') return { movement: null, period: 'mês' }
  return null
}
