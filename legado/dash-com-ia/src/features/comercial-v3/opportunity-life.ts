import { selectOpportunityModel } from './model'
import { ALL_FILTERS, type CommercialFilters, type CommercialPeriod, type CommercialSnapshot } from './types'

export type OpportunityAction = {
  id: string
  at: string | null
  label: string | null
  registeredBy: string | null
}

export type OpportunityCommitment = {
  id: string
  opportunityId: string
  kind: 'visit' | 'meeting' | 'call' | 'cross'
  subject: string
  at: string
  responsible: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  source: string
}

export type OpportunityLifeModel = {
  id: string
  opportunityId: string
  accountLabel: string | null
  actions: OpportunityAction[]
  actionsAvailability: 'available' | 'unavailable'
  commitments: OpportunityCommitment[]
  commitmentsAvailability: 'demo' | 'unavailable'
  nextCommitment: OpportunityCommitment | null
  relationship: {
    cnpj: null
    contacts: []
    availability: 'unavailable'
    winLossHistoryAvailability: 'unavailable'
    contractedProductsAvailability: 'unavailable'
  }
  provenance: {
    source: string
    asOf: string | null
    isSynthetic: true
    commitmentsSource: string | null
    notice: string
  }
}

const DEMO_SOURCE = 'Exemplos sintéticos de demonstração; não registros da carteira real'

// Amostra fechada por ID. Não acrescenta fatos ao snapshot nem classifica a oportunidade como Cross.
const DEMO_COMMITMENTS = [
  { id: 'demo-opp-005-call', kind: 'call', subject: 'Ligação de acompanhamento', at: '2026-09-21T09:00:00-04:00' },
  { id: 'demo-opp-005-meeting', kind: 'meeting', subject: 'Reunião de acompanhamento', at: '2026-09-22T14:00:00-04:00' },
  { id: 'demo-opp-005-visit', kind: 'visit', subject: 'Visita ao cliente', at: '2026-09-23T10:00:00-04:00' },
  { id: 'demo-opp-005-cross', kind: 'cross', subject: 'Compromisso de Cross', at: '2026-09-24T15:00:00-04:00' },
] satisfies Array<Pick<OpportunityCommitment, 'id' | 'kind' | 'subject' | 'at'>>

const textOrNull = (value: string | undefined): string | null => value?.trim() || null
const dateOrNull = (value: string | undefined): string | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || !Number.isFinite(Date.parse(value))) return null
  const calendarDate = value.slice(0, 10)
  return new Date(`${calendarDate}T00:00:00Z`).toISOString().slice(0, 10) === calendarDate ? value : null
}

/** Vida da oportunidade; history oferece registros, nunca autoria, resultado ou causa inferidos. */
export function selectOpportunityLife(
  snapshot: CommercialSnapshot,
  opportunityId: string,
  period: CommercialPeriod = 'month',
  filters?: Pick<CommercialFilters, 'branch' | 'solution'>,
): OpportunityLifeModel | null {
  if (!Array.isArray(snapshot?.periods?.[period]?.forecastOpportunities)) return null
  const opportunity = selectOpportunityModel(snapshot, opportunityId, period)
  if (!opportunity) return null
  const branch = filters?.branch ?? ALL_FILTERS
  const solution = filters?.solution ?? ALL_FILTERS
  if (branch !== ALL_FILTERS && branch !== opportunity.branch) return null
  if (solution !== ALL_FILTERS && solution !== opportunity.solution) return null

  const asOf = dateOrNull(snapshot.asOf)
  const history = Array.isArray(opportunity.history) ? opportunity.history : []
  const actions: OpportunityAction[] = history.map((event, index) => ({
    id: `${opportunity.id}:history:${index}`,
    at: dateOrNull(event.at),
    label: textOrNull(event.label),
    registeredBy: null,
  })).sort((a, b) => {
    if (a.at === null) return b.at === null ? 0 : 1
    if (b.at === null) return -1
    return Date.parse(b.at) - Date.parse(a.at)
  })

  const commitments: OpportunityCommitment[] = opportunity.id === 'opp-005'
    ? DEMO_COMMITMENTS.map((item) => ({
      ...item,
      opportunityId: opportunity.id,
      responsible: textOrNull(opportunity.executive),
      status: 'scheduled',
      source: DEMO_SOURCE,
    }))
    : []
  commitments.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.status.localeCompare(b.status))

  return {
    id: opportunity.id,
    opportunityId: opportunity.id,
    accountLabel: textOrNull(opportunity.account),
    actions,
    actionsAvailability: actions.length > 0 ? 'available' : 'unavailable',
    commitments,
    commitmentsAvailability: commitments.length > 0 ? 'demo' : 'unavailable',
    nextCommitment: asOf === null ? null : commitments.find((item) =>
      item.status === 'scheduled' && Date.parse(item.at) > Date.parse(asOf),
    ) ?? null,
    relationship: {
      cnpj: null,
      contacts: [],
      availability: 'unavailable',
      winLossHistoryAvailability: 'unavailable',
      contractedProductsAvailability: 'unavailable',
    },
    provenance: {
      source: 'Snapshot sintético V3 · eventos do histórico da oportunidade',
      asOf,
      isSynthetic: true,
      commitmentsSource: commitments.length > 0 ? DEMO_SOURCE : null,
      notice: commitments.length > 0
        ? DEMO_SOURCE
        : 'Agenda indisponível nesta amostra; não comprova ausência de atividade real.',
    },
  }
}
