import type { Top10Row } from './model'
import type { OpportunityDetail } from './opportunity-details'

export type AccountGroup = {
  key: string
  account: string | null
  opportunities: Top10Row[]
  responsaveis: string[]
}

/** Agrupa apenas pelo nome exato que o snapshot já associa à oportunidade. */
export function selectAccountGroups(
  rows: readonly Top10Row[],
  details: ReadonlyMap<string, OpportunityDetail>,
  query = '',
): AccountGroup[] {
  const groups = new Map<string, AccountGroup>()

  rows.forEach((row, index) => {
    const account = typeof row.account === 'string' ? row.account : ''
    const key = account.trim() === '' ? `missing:${row.id || index}` : `account:${account}`
    const group = groups.get(key) ?? { key, account: account.trim() === '' ? null : account, opportunities: [], responsaveis: [] }
    group.opportunities.push(row)
    const executive = typeof row.executive === 'string' ? row.executive.trim() : ''
    if (executive && !group.responsaveis.includes(executive)) group.responsaveis.push(executive)
    groups.set(key, group)
  })

  const term = query.trim().toLocaleLowerCase('pt-BR')
  const containsTerm = (value: unknown) =>
    typeof value === 'string' && value.toLocaleLowerCase('pt-BR').includes(term)

  return [...groups.values()]
    .filter((group) =>
      term === '' ||
      [
        group.account ?? 'Cliente indisponível',
        ...group.responsaveis,
        ...group.opportunities.flatMap((row) => {
          const id = typeof row.id === 'string' ? row.id : ''
          return [id, row.solution, row.branch, details.get(id)?.stage ?? '']
        }),
      ].some(containsTerm),
    )
    .sort((a, b) =>
      (a.account ?? 'Cliente indisponível').localeCompare(b.account ?? 'Cliente indisponível', 'pt-BR') ||
      a.key.localeCompare(b.key),
    )
}
