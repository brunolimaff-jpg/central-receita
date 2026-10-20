/**
 * Agente Comercial local simulado (plano Task 6 Steps 1-2, l.562-579).
 *
 * Casamento por palavra-chave sobre o `AgentBriefingModel` — o mesmo modelo que
 * alimenta KPIs, movimentos, Top 10 e filiais da Home. Nenhum provedor, nenhuma
 * chamada de rede, nenhum trabalho assíncrono escondido e nenhuma escrita:
 * toda resposta é uma frase montada com valores que já estão no briefing.
 *
 * Regra da spec §18.5 (l.649-653): não responder como fato quando o mock não
 * sustenta a resposta. Por isso a leitura de filial fala de cobertura de meta,
 * que é o que o snapshot mede, e não de "variação da filial".
 */

import { AGENTE_COPY } from './copy'
import {
  formatarComSinal,
  formatarMilhoes,
  formatarOportunidades,
  formatarPercentualInteiro,
} from './format'
import type { AgentBriefingModel } from './model'
import { FORECAST_MOVEMENTS, type ForecastMovement } from './types'

export type AgentIntent = 'forecast' | 'oportunidades' | 'filiais' | 'origem' | 'semana' | 'desconhecida'

export type AgentAnswer = {
  intent: AgentIntent
  text: string
}

/** Perguntas rápidas oferecidas na tela: uma por intenção suportada. */
export const AGENT_PROMPTS: ReadonlyArray<{ question: string; intent: AgentIntent }> = [
  { question: 'O que mudou hoje?', intent: 'forecast' },
  { question: 'Quais oportunidades concentram o desvio?', intent: 'oportunidades' },
  { question: 'Quais filiais pedem atenção?', intent: 'filiais' },
  { question: 'Como New Names e Cross participam?', intent: 'origem' },
  { question: 'O que mudou na semana atual?', intent: 'semana' },
]

const ROTULO_MOVIMENTO: Record<ForecastMovement, string> = {
  Saiu: 'saídas',
  Postergou: 'postergações',
  'Alterou valor': 'alterações de valor',
  Entrou: 'entradas',
}

/**
 * Ordem de precedência importa: `quais filiais mais mudaram?` casa em `filial`
 * antes de `mudou`, e `o que mudou na semana atual?` casa em `semana` antes de
 * `mudou`. Por isso as intenções específicas vêm primeiro.
 */
const INTENCOES: ReadonlyArray<{ intent: AgentIntent; termos: readonly string[] }> = [
  { intent: 'semana', termos: ['semana', 'semanal'] },
  { intent: 'filiais', termos: ['filial', 'filiais'] },
  {
    intent: 'origem',
    termos: ['new name', 'newname', 'new names', 'cross', 'recorrente', 'mensalidade', 'habilita'],
  },
  {
    intent: 'oportunidades',
    termos: ['oportunidade', 'oportunidades', 'desvio', 'concentram', 'top 5', 'top5', 'top 10', 'top10'],
  },
  {
    intent: 'forecast',
    termos: [
      'forecast',
      'previsao',
      'fotografia',
      'oficial',
      'movimento',
      'mudou',
      'mudanca',
      'mudancas',
      'saiu',
      'saida',
      'saidas',
      'postergou',
      'postergacao',
      'alterou',
      'entrou',
      'entrada',
      'entradas',
      'hoje',
    ],
  },
]

/** Sem acento e em minúsculas: o usuário não precisa digitar o acento exato. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Intenção detectada por palavra-chave; pergunta vazia ou fora do retrato cai em `desconhecida`. */
export function detectAgentIntent(question: string): AgentIntent {
  const texto = normalizar(question)
  if (texto === '') return 'desconhecida'
  for (const { intent, termos } of INTENCOES) {
    if (termos.some((termo) => texto.includes(termo))) return intent
  }
  return 'desconhecida'
}

function respostaForecast(briefing: AgentBriefingModel): string {
  const { movimentos } = briefing
  const detalhe = FORECAST_MOVEMENTS.map((movimento) => {
    const resumo = movimentos.byMovement[movimento]
    return `${formatarComSinal(resumo.value)} em ${ROTULO_MOVIMENTO[movimento]} (${formatarOportunidades(resumo.count)})`
  }).join('; ')

  return `A fotografia oficial é ${formatarMilhoes(movimentos.oficial)} e o forecast atual está em ${formatarMilhoes(
    movimentos.atual,
  )}. O movimento líquido é de ${formatarComSinal(movimentos.net)}: ${detalhe}.`
}

function respostaOportunidades(briefing: AgentBriefingModel): string {
  const negativos = FORECAST_MOVEMENTS.filter(
    (movimento) => briefing.movimentos.byMovement[movimento].value < 0,
  )
    .map(
      (movimento) =>
        `${movimento.toLowerCase()} (${formatarComSinal(briefing.movimentos.byMovement[movimento].value)})`,
    )
    .join(' · ')

  const concentracao = `${briefing.top5Count} das ${briefing.top10Count} oportunidades do Top 10 explicam ${formatarPercentualInteiro(
    briefing.top5Share,
  )} do movimento absoluto do mês.`

  return negativos === ''
    ? concentracao
    : `${concentracao} ${briefing.tiposNegativos} tipos de movimento pressionam o forecast: ${negativos}.`
}

function respostaFiliais(briefing: AgentBriefingModel): string {
  if (briefing.atencao.length === 0) {
    return 'O recorte atual não tem filial com meta definida para medir cobertura de forecast.'
  }

  const detalhe = briefing.atencao
    .map(
      (sinal) =>
        `${sinal.branch} está em ${formatarPercentualInteiro(sinal.cobertura)} do forecast atual sobre a meta (${formatarMilhoes(
          sinal.realizado,
        )} realizado de ${formatarMilhoes(sinal.meta)})`,
    )
    .join('; ')

  return `No recorte atual, ${detalhe}. O retrato mede cobertura de meta por filial — não a variação de cada filial — e não cria cobrança.`
}

function respostaOrigem(briefing: AgentBriefingModel): string {
  const { origem } = briefing
  if (origem.realizado <= 0) {
    return 'O recorte atual não tem realizado para comparar New Names e Cross.'
  }

  return `O realizado do período é ${formatarMilhoes(origem.realizado)}: New Names representa ${formatarMilhoes(
    origem.newNames,
  )} (${formatarPercentualInteiro(origem.newNames / origem.realizado)}) e Cross ${formatarMilhoes(
    origem.cross,
  )} (${formatarPercentualInteiro(origem.cross / origem.realizado)}). A receita recorrente soma ${formatarMilhoes(
    origem.recorrente,
  )} (${formatarPercentualInteiro(origem.recorrente / origem.realizado)} do realizado).`
}

function respostaSemana(briefing: AgentBriefingModel): string {
  const atual = briefing.semanas.find((semana) => semana.current)
  if (!atual) {
    return 'O recorte atual não tem leitura semanal: as semanas Sem 1 a Sem 4 existem na visão mensal.'
  }

  return `Na ${atual.label} (${atual.rangeLabel}), o forecast acumulado está em ${formatarMilhoes(
    atual.forecast,
  )} e o ritmo de meta em ${formatarMilhoes(atual.pace)}.`
}

/**
 * Responde uma pergunta com o briefing carregado. Pergunta fora do retrato devolve
 * a limitação natural — nunca um número inventado.
 */
export function answerAgentQuestion(
  question: string,
  briefing: AgentBriefingModel,
): AgentAnswer {
  const intent = detectAgentIntent(question)

  switch (intent) {
    case 'forecast':
      return { intent, text: respostaForecast(briefing) }
    case 'oportunidades':
      return { intent, text: respostaOportunidades(briefing) }
    case 'filiais':
      return { intent, text: respostaFiliais(briefing) }
    case 'origem':
      return { intent, text: respostaOrigem(briefing) }
    case 'semana':
      return { intent, text: respostaSemana(briefing) }
    default:
      return { intent: 'desconhecida', text: AGENTE_COPY.limitacao }
  }
}
