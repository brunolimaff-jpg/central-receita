import { revenueHomeMock } from './mock-data'
import type { RevenueHomeData } from './types'

export async function getRevenueHomeData(): Promise<RevenueHomeData> {
  // Primeiro contrato da Home: dados sintéticos e explícitos.
  // Quando o modelo estiver validado, esta função vira a única fronteira para SQL real.
  return revenueHomeMock
}
