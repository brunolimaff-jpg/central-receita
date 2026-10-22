import source from './real-branches.json'
import { COMMERCIAL_SNAPSHOT } from './mock-data'
import type { FilialRow } from './model'
import type { CommercialSnapshot } from './types'

export const REAL_BRANCH_TOTAL = source.total
export const REAL_BRANCH_NAMES = [...new Set(source.branches.map((row) => row.branch))]

// Teste: somente os nomes são associados às oportunidades demonstrativas.
// A distribuição das oportunidades não representa a carteira real de cada filial.
const aliases = new Map(COMMERCIAL_SNAPSHOT.periods.month.branchTargets.map((row, i) => [row.branch, REAL_BRANCH_NAMES[i] ?? row.branch]))
const rename = (branch: string) => aliases.get(branch) ?? branch
export const TEST_SNAPSHOT: CommercialSnapshot = {
  ...COMMERCIAL_SNAPSHOT,
  periods: Object.fromEntries(Object.entries(COMMERCIAL_SNAPSHOT.periods).map(([period, data]) => [period, {
    ...data,
    branchTargets: [...data.branchTargets.map((row) => ({ ...row, branch: rename(row.branch) })), ...REAL_BRANCH_NAMES.slice(data.branchTargets.length).map((branch) => ({ branch, target: 0 }))],
    realizedDeals: data.realizedDeals.map((row) => ({ ...row, branch: rename(row.branch) })),
    forecastOpportunities: data.forecastOpportunities.map((row) => ({ ...row, branch: rename(row.branch) })),
  }])) as CommercialSnapshot['periods'],
}

export function realBranches(branch = 'all'): FilialRow[] {
  return source.branches.filter((row) => branch === 'all' || row.branch === branch).map((row) => ({
    branch: row.branch,
    meta: row.meta ?? 0,
    realizado: row.realizado ?? 0,
    forecastAtual: row.forecastAtual ?? 0,
    atingimento: row.meta && row.realizado !== null ? row.realizado / row.meta : 0,
    missing: (['meta', 'realizado', 'forecastAtual'] as const).filter((key) => row[key] === null),
  }))
}
