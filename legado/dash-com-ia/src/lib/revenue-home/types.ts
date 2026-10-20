export type Tone = 'positive' | 'attention' | 'critical' | 'neutral'

export interface PulseCopy {
  title: string
  summary: string
}

export interface RevenueMetric {
  id: string
  label: string
  value: number | null
  displayValue?: string
  deltaLabel?: string
  tone?: Tone
  note?: string
}

export interface DecisionAction {
  id: string
  label: string
  emphasis?: 'primary' | 'secondary'
}

export interface DecisionItem {
  id: string
  account: string
  exposure: number
  opportunityCount: number
  status: string
  title: string
  explanation: string
  decisionWindow: string
  evidence: 'completa' | 'parcial' | 'incompleta'
  tone: 'attention' | 'critical'
  actions: DecisionAction[]
}

export interface RevenueMovement {
  id: string
  title: string
  description: string
  when: string
  tone: 'positive' | 'attention' | 'critical'
}

export interface UpcomingMovement {
  id: string
  weekday: string
  dateLabel: string
  title: string
  account: string
  amount: number
  nextMove: string
}

export interface RevenueStage {
  id: string
  label: string
  state: string
  tone: 'stable' | 'attention' | 'critical'
}

export interface RevenueHomeData {
  pulse: PulseCopy
  metrics: RevenueMetric[]
  decisions: DecisionItem[]
  movements: RevenueMovement[]
  upcoming: UpcomingMovement[]
  stages: RevenueStage[]
}
