/**
 * Snapshot mockado da Visão Comercial V3 — fonte única de toda métrica da tela.
 *
 * Fonte: 05_IMPLEMENTATION_PLAN_V3.md
 * - Task 2 Steps 1-5 (l.165-241): fixture travada e grão do mock.
 * - "Mock data contract locked by this plan" (l.1015-1039).
 * - 00_SPEC_VISAO_COMERCIAL_V3.md §2 (l.29-68): taxonomia congelada.
 *
 * Valores em R$ milhões. O mês é a base; trimestre e 3 meses são a mesma
 * fotografia em escala 3x (o contrato testa proporcionalidade, não valores novos).
 * Cada número aqui reconcilia com tests/comercial-v3-model.test.mjs:
 * Meta 12,0 / Realizado 8,4 / Forecast oficial 11,0 / Forecast atual 10,2.
 */

import type {
  CommercialPeriod,
  CommercialPeriodData,
  CommercialSnapshot,
  DealOrigin,
  ForecastMovement,
  OpportunityHistoryEvent,
} from './types'

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Data de corte congelada pelo contrato: sábado 19/set, semana 3 em andamento. */
export const SNAPSHOT_AS_OF = '2026-09-19T09:12:00-04:00'

const ANTES = (dia: number) => `2026-09-${String(dia).padStart(2, '0')}T10:00:00-04:00`

type DealSeed = {
  id: string
  account: string
  branch: string
  solution: string
  origin: DealOrigin
  recurring: number
  enablement: number
  services: number
}

/**
 * Realizado do mês por negociação fechada. Somas travadas:
 * total 8,4 · New Name 5,1 · Cross 3,3 · recorrente 6,2 · habilitação 1,1 · serviços 1,1 ·
 * ERP 3,99 · por filial SP 2,0 / RS 1,5 / MG 1,2 / PR 0,9 / SC 0,8 / GO 0,7 / BA 0,6 / Outras 0,7.
 */
const DEALS: DealSeed[] = [
  { id: 'rd-001', account: 'Varejo Ômega', branch: 'SP', solution: 'ERP', origin: 'New Name', recurring: 1.4, enablement: 0.15, services: 0.1 },
  { id: 'rd-002', account: 'Distribuidora Sigma', branch: 'SP', solution: 'ERP', origin: 'Cross', recurring: 0.15, enablement: 0, services: 0 },
  { id: 'rd-003', account: 'Clínica Norte', branch: 'SP', solution: 'HCM', origin: 'Cross', recurring: 0.05, enablement: 0.05, services: 0.1 },
  { id: 'rd-004', account: 'Agro Vale', branch: 'RS', solution: 'ERP', origin: 'New Name', recurring: 0.6, enablement: 0.1, services: 0.05 },
  { id: 'rd-005', account: 'Transporte Andrade', branch: 'RS', solution: 'Logística', origin: 'Cross', recurring: 0.55, enablement: 0, services: 0.2 },
  { id: 'rd-006', account: 'Educare MG', branch: 'MG', solution: 'HCM', origin: 'New Name', recurring: 0.55, enablement: 0.15, services: 0.1 },
  { id: 'rd-007', account: 'Metalúrgica Beta', branch: 'MG', solution: 'ERP', origin: 'Cross', recurring: 0.25, enablement: 0.1, services: 0.05 },
  { id: 'rd-008', account: 'TechPar Curitiba', branch: 'PR', solution: 'ERP', origin: 'New Name', recurring: 0.45, enablement: 0.14, services: 0 },
  { id: 'rd-009', account: 'Consultoria Delta', branch: 'PR', solution: 'Serviços', origin: 'Cross', recurring: 0, enablement: 0.15, services: 0.16 },
  { id: 'rd-010', account: 'Porto Sul Terminals', branch: 'SC', solution: 'Logística', origin: 'New Name', recurring: 0.8, enablement: 0, services: 0 },
  { id: 'rd-011', account: 'GoBens Alimentos', branch: 'GO', solution: 'HCM', origin: 'Cross', recurring: 0.5, enablement: 0.1, services: 0.1 },
  { id: 'rd-012', account: 'Bahia Mineração', branch: 'BA', solution: 'ERP', origin: 'Cross', recurring: 0.3, enablement: 0.1, services: 0.05 },
  { id: 'rd-013', account: 'Salvador Facilities', branch: 'BA', solution: 'Serviços', origin: 'New Name', recurring: 0, enablement: 0, services: 0.15 },
  { id: 'rd-014', account: 'Rondon Log', branch: 'Outras', solution: 'Logística', origin: 'Cross', recurring: 0.34, enablement: 0, services: 0 },
  { id: 'rd-015', account: 'Serra Azul Saúde', branch: 'Outras', solution: 'HCM', origin: 'New Name', recurring: 0.26, enablement: 0.06, services: 0.04 },
]

/** Metas por filial. Soma 12,0. `branch` é filial — nunca HEAD (spec §2). */
const BRANCH_TARGETS: Array<{ branch: string; target: number }> = [
  { branch: 'SP', target: 2.4 },
  { branch: 'RS', target: 2.0 },
  { branch: 'MG', target: 1.8 },
  { branch: 'PR', target: 1.5 },
  { branch: 'SC', target: 1.2 },
  { branch: 'GO', target: 1.0 },
  { branch: 'BA', target: 0.8 },
  { branch: 'Outras', target: 1.3 },
]

type OppSeed = {
  id: string
  account: string
  solution: string
  executive: string
  head?: string
  branch: string
  origin: DealOrigin
  stage: string
  forecastOfficial: number
  forecastCurrent: number
  movement: ForecastMovement | null
  recurring: number
  enablement: number
  services: number
}

/**
 * Forecast do mês: 18 oportunidades. Somas travadas:
 * oficial 11,0 · atual 10,2 · movimentos Saiu −0,9 (2) · Postergou −0,6 (3) ·
 * Alterou valor −0,3 (2) · Entrou +1,0 (3) · líquido −0,8 · bruto 2,8.
 * Top 10 por abs(delta): 0,6 · 0,55 · 0,384 · 0,35 · 0,3 · 0,2 · 0,15 · 0,15 · 0,1 · 0,016 (top 5 = 78%).
 * ERP: 7 oportunidades somando 4,4 de forecast atual. SP: 3 oportunidades somando 2,0,
 * todas com HEAD Patrícia Melo — que também atende RS, provando FILIAL != HEAD.
 */
const OPPS: OppSeed[] = [
  // SP — 3 oportunidades, Σ atual 2,0
  { id: 'opp-001', account: 'Governo Épsilon', solution: 'HCM', executive: 'Camila Duarte', head: 'Patrícia Melo', branch: 'SP', origin: 'New Name', stage: 'Proposta', forecastOfficial: 0, forecastCurrent: 0.6, movement: 'Entrou', recurring: 0.45, enablement: 0.05, services: 0.1 },
  { id: 'opp-002', account: 'Banco Iota', solution: 'ERP', executive: 'Renan Campos', head: 'Patrícia Melo', branch: 'SP', origin: 'New Name', stage: 'Contrato', forecastOfficial: 0.55, forecastCurrent: 0, movement: 'Saiu', recurring: 0, enablement: 0, services: 0 },
  { id: 'opp-003', account: 'Indústria Kappa', solution: 'ERP', executive: 'Camila Duarte', head: 'Patrícia Melo', branch: 'SP', origin: 'Cross', stage: 'Negociação', forecastOfficial: 1.4, forecastCurrent: 1.4, movement: null, recurring: 1.2, enablement: 0.1, services: 0.1 },
  // RS — 3 oportunidades, Σ atual 1,7
  { id: 'opp-004', account: 'Varejo Lambda', solution: 'Logística', executive: 'Bruno Serra', head: 'Rafael Nunes', branch: 'RS', origin: 'New Name', stage: 'Proposta', forecastOfficial: 0, forecastCurrent: 0.384, movement: 'Entrou', recurring: 0.3, enablement: 0.034, services: 0.05 },
  { id: 'opp-005', account: 'Cooperativa Mu', solution: 'ERP', executive: 'Alice Fontes', head: 'Patrícia Melo', branch: 'RS', origin: 'Cross', stage: 'Negociação', forecastOfficial: 0.9, forecastCurrent: 0.75, movement: 'Postergou', recurring: 0.6, enablement: 0.1, services: 0.05 },
  { id: 'opp-006', account: 'Saneamento Nu', solution: 'Serviços', executive: 'Bruno Serra', head: 'Rafael Nunes', branch: 'RS', origin: 'New Name', stage: 'Contrato', forecastOfficial: 0.566, forecastCurrent: 0.566, movement: null, recurring: 0.4, enablement: 0.066, services: 0.1 },
  // MG — 2 oportunidades, Σ atual 1,5
  { id: 'opp-007', account: 'Farmacêutica Xi', solution: 'HCM', executive: 'Diego Prado', head: 'Rafael Nunes', branch: 'MG', origin: 'New Name', stage: 'Proposta', forecastOfficial: 0, forecastCurrent: 0.016, movement: 'Entrou', recurring: 0.01, enablement: 0, services: 0.006 },
  { id: 'opp-008', account: 'Energia Omicron', solution: 'HCM', executive: 'Diego Prado', head: 'Sofia Reis', branch: 'MG', origin: 'Cross', stage: 'Negociação', forecastOfficial: 1.484, forecastCurrent: 1.484, movement: null, recurring: 1.2, enablement: 0.084, services: 0.2 },
  // PR — 2 oportunidades, Σ atual 1,2
  { id: 'opp-009', account: 'Varejo Pi', solution: 'HCM', executive: 'Helena Dias', head: 'Sofia Reis', branch: 'PR', origin: 'Cross', stage: 'Contrato', forecastOfficial: 0.35, forecastCurrent: 0, movement: 'Saiu', recurring: 0, enablement: 0, services: 0 },
  { id: 'opp-010', account: 'Madeireira Rho', solution: 'Logística', executive: 'Helena Dias', head: 'Sofia Reis', branch: 'PR', origin: 'New Name', stage: 'Negociação', forecastOfficial: 1.2, forecastCurrent: 1.2, movement: null, recurring: 1.0, enablement: 0.1, services: 0.1 },
  // SC — 2 oportunidades, Σ atual 1,0
  { id: 'opp-011', account: 'Têxtil Sigma', solution: 'HCM', executive: 'Igor Martins', head: 'Sofia Reis', branch: 'SC', origin: 'New Name', stage: 'Proposta', forecastOfficial: 0.9, forecastCurrent: 0.7, movement: 'Alterou valor', recurring: 0.55, enablement: 0.05, services: 0.1 },
  { id: 'opp-012', account: 'Frigo Tau', solution: 'ERP', executive: 'Igor Martins', head: 'Rafael Nunes', branch: 'SC', origin: 'Cross', stage: 'Negociação', forecastOfficial: 0.3, forecastCurrent: 0.3, movement: null, recurring: 0.25, enablement: 0, services: 0.05 },
  // GO — 2 oportunidades, Σ atual 0,8
  { id: 'opp-013', account: 'Agro Upsilon', solution: 'ERP', executive: 'Marina Lima', head: 'Sofia Reis', branch: 'GO', origin: 'New Name', stage: 'Proposta', forecastOfficial: 0.8, forecastCurrent: 0.65, movement: 'Postergou', recurring: 0.5, enablement: 0.05, services: 0.1 },
  { id: 'opp-014', account: 'Construtora Fi', solution: 'Logística', executive: 'Marina Lima', head: 'Rafael Nunes', branch: 'GO', origin: 'Cross', stage: 'Contrato', forecastOfficial: 0.15, forecastCurrent: 0.15, movement: null, recurring: 0.12, enablement: 0, services: 0.03 },
  // BA — 2 oportunidades, Σ atual 0,7
  { id: 'opp-015', account: 'Recife Chi', solution: 'Serviços', executive: 'Tomás Rocha', head: 'Sofia Reis', branch: 'BA', origin: 'New Name', stage: 'Negociação', forecastOfficial: 0.4, forecastCurrent: 0.1, movement: 'Postergou', recurring: 0.08, enablement: 0, services: 0.02 },
  { id: 'opp-016', account: 'Petro Psi', solution: 'HCM', executive: 'Tomás Rocha', head: 'Rafael Nunes', branch: 'BA', origin: 'Cross', stage: 'Proposta', forecastOfficial: 0.6, forecastCurrent: 0.6, movement: null, recurring: 0.5, enablement: 0.05, services: 0.05 },
  // Outras — 2 oportunidades, Σ atual 1,3
  { id: 'opp-017', account: 'Saneamento Omega-2', solution: 'ERP', executive: 'Yara Nunes', head: 'Sofia Reis', branch: 'Outras', origin: 'New Name', stage: 'Negociação', forecastOfficial: 1.2, forecastCurrent: 1.1, movement: 'Alterou valor', recurring: 0.9, enablement: 0.1, services: 0.1 },
  { id: 'opp-018', account: 'Saúde Local', solution: 'ERP', executive: 'Yara Nunes', head: 'Rafael Nunes', branch: 'Outras', origin: 'Cross', stage: 'Contrato', forecastOfficial: 0.2, forecastCurrent: 0.2, movement: null, recurring: 0.16, enablement: 0, services: 0.04 },
]

/**
 * Follow-ups do período das oportunidades paradas em Proposta (antes da
 * Negociação). O último evento do history define os "dias sem avanço" das
 * intervenções sugeridas do bloco "Exige você" (revisão geral, ticket 01):
 * datas distintas produzem daysIdle plausíveis e diferentes entre contas.
 * Todos os dias ficam entre 10 e 16/set — sempre anteriores ao asOf de 19/set.
 */
const FOLLOWUPS: Record<string, Array<{ dia: number; label: string }>> = {
  'opp-001': [{ dia: 12, label: 'Proposta enviada ao comitê do cliente' }],
  'opp-004': [{ dia: 11, label: 'Revisão de proposta com a área técnica' }],
  'opp-007': [{ dia: 16, label: 'Follow-up de proposta enviado' }],
  'opp-011': [{ dia: 10, label: 'Proposta reapresentada com novo valor' }],
  'opp-013': [{ dia: 13, label: 'Reunião de alinhamento da proposta' }],
  'opp-016': [{ dia: 14, label: 'Proposta enviada ao cliente' }],
}

const historicoPadrao = (seed: OppSeed) => [
  { at: ANTES(2), label: 'Entrou no forecast oficial' },
  { at: ANTES(9), label: seed.movement === null ? 'Sem movimentos desde a fotografia oficial' : `Movimento: ${seed.movement}` },
  ...(FOLLOWUPS[seed.id] ?? []).map((followup) => ({ at: ANTES(followup.dia), label: followup.label })),
]

/** History em ordem cronológica: o último evento é o registro mais recente de avanço. */
function historicoDe(seed: OppSeed): OpportunityHistoryEvent[] {
  return historicoPadrao(seed).sort((a, b) => a.at.localeCompare(b.at))
}

const mesBase: CommercialPeriodData = {
  branchTargets: BRANCH_TARGETS,
  realizedDeals: DEALS.map((deal) => ({ ...deal })),
  forecastOpportunities: OPPS.map((seed) => ({
    id: seed.id,
    account: seed.account,
    solution: seed.solution,
    executive: seed.executive,
    ...(seed.head === undefined ? {} : { head: seed.head }),
    branch: seed.branch,
    origin: seed.origin,
    stage: seed.stage,
    forecastOfficial: seed.forecastOfficial,
    forecastCurrent: seed.forecastCurrent,
    movement: seed.movement,
    delta: seed.forecastCurrent - seed.forecastOfficial,
    recurring: seed.recurring,
    enablement: seed.enablement,
    services: seed.services,
    history: historicoDe(seed),
  })),
  // Leitura cumulativa do forecast na semana (spec §18.4: faixa 1-7 / 8-14 / 15-21 / 22-fim).
  weeklyForecast: [
    { week: 1, fromDay: 1, toDay: 7, value: 7.4 },
    { week: 2, fromDay: 8, toDay: 14, value: 9.1 },
    { week: 3, fromDay: 15, toDay: 21, value: 10.2 },
    { week: 4, fromDay: 22, toDay: 30, value: 10.2 },
  ],
  // Ritmo acumulado de meta (12,0 distribuído pelos 30 dias de setembro).
  weeklyTargetPace: [
    { week: 1, fromDay: 1, toDay: 7, value: 2.8 },
    { week: 2, fromDay: 8, toDay: 14, value: 5.6 },
    { week: 3, fromDay: 15, toDay: 21, value: 8.4 },
    { week: 4, fromDay: 22, toDay: 30, value: 12.0 },
  ],
}

/** Escala linear de uma fotografia de período (trimestre/3 meses = 3x o mês). */
function escalar(base: CommercialPeriodData, fator: number): CommercialPeriodData {
  return {
    branchTargets: base.branchTargets.map((alvo) => ({ branch: alvo.branch, target: alvo.target * fator })),
    realizedDeals: base.realizedDeals.map((deal) => ({
      ...deal,
      recurring: deal.recurring * fator,
      enablement: deal.enablement * fator,
      services: deal.services * fator,
    })),
    forecastOpportunities: base.forecastOpportunities.map((opp) => ({
      ...opp,
      forecastOfficial: opp.forecastOfficial * fator,
      forecastCurrent: opp.forecastCurrent * fator,
      delta: opp.delta * fator,
      recurring: opp.recurring * fator,
      enablement: opp.enablement * fator,
      services: opp.services * fator,
    })),
    weeklyForecast: [],
    weeklyTargetPace: [],
  }
}

export const COMMERCIAL_SNAPSHOT: CommercialSnapshot = {
  asOf: SNAPSHOT_AS_OF,
  competence: { year: 2026, month: 9 },
  periods: {
    month: mesBase,
    quarter: escalar(mesBase, 3),
    threeMonths: escalar(mesBase, 3),
  } satisfies Record<CommercialPeriod, CommercialPeriodData>,
}

/** Rótulo curto do mês da competência (ex.: 'set'), usado nas faixas semanais. */
export function mesCurto(month: number): string {
  return MESES_CURTOS[month - 1] ?? String(month)
}
