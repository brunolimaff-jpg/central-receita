/**
 * Copy de UI da Visão Comercial V3, em pt-BR, separada do modelo
 * (plano Task 1: rótulos não vivem em types.ts nem em model.ts).
 *
 * Fonte: 00_SPEC_VISAO_COMERCIAL_V3.md §18 (l.560-628, Adendo que substitui a
 * §4.3 e governa em divergência) e §2 (l.29-68, taxonomia congelada);
 * 03_TOM_DE_VOZ_SENIOR_RESUMO.md (sem tom de cobrança).
 */

import type { CommercialPeriod, CommercialView, ForecastMovement, SupportedQuestion } from './types'
import type { KpiKey } from './model'
import { AGENT_DEMO_FOOTER, AGENT_DEMO_SNAPSHOT } from './demo-display'

export const HOME_COPY = {
  greeting: 'Visão Executiva',
  greetingEmoji: '👋',
  briefingTitle: 'Resumo de hoje',
  briefingSubtitle: 'Principais movimentos e sinais do período.',
  agentCta: 'Abrir agente comercial',
} as const

export const KPI_LABELS: Record<KpiKey, string> = {
  meta: 'Meta do mês',
  realizado: 'Ganhos no CRM',
  forecastOficial: 'Forecast oficial',
  forecastAtual: 'Forecast atual',
  deltaMeta: 'Δ vs. meta',
}

export const VIEW_LABELS: Record<CommercialView, string> = {
  home: 'Visão Executiva',
  diretorias: 'Diretorias',
  agent: 'Agente Comercial',
  journey: 'Jornada',
  system: 'Sistema de Receita',
  forecast: 'Forecast',
  opportunities: 'Oportunidades',
  accounts: 'Contas',
  'new-name': 'New Name',
  cross: 'Cross',
  branch: 'Filiais',
  opportunity: 'Oportunidade',
  config: 'Configurações',
}

export const PERIOD_LABELS: Record<CommercialPeriod, string> = {
  month: 'Mês',
  quarter: 'Trimestre',
  threeMonths: '3 meses',
}

/**
 * Rótulo do botão de voltar por origem da navegação (plano Task 9 Step 3, l.760-767).
 * O destino é sempre explícito na URL via `from`; nunca o histórico do navegador.
 */
export const VOLTAR_POR_ORIGEM: Record<CommercialView, string> = {
  home: 'Voltar à visão executiva',
  diretorias: 'Voltar às diretorias',
  agent: 'Voltar ao agente',
  journey: 'Voltar à jornada',
  system: 'Voltar ao sistema de receita',
  forecast: 'Voltar ao forecast',
  opportunities: 'Voltar às oportunidades',
  accounts: 'Voltar às contas',
  'new-name': 'Voltar a New Name',
  cross: 'Voltar ao Cross',
  branch: 'Voltar à filial',
  opportunity: 'Voltar à visão executiva',
  config: 'Voltar às configurações',
}

export const FILTER_LABELS = {
  filial: 'Todas as filiais',
  solucao: 'Todas as soluções',
} as const

export const BLOCOS_HOME = {
  evolucao: 'Evolução do mês',
  movimentos: 'Movimentos do forecast',
  newNamesCross: 'New Names × Cross',
  receita: 'Composição da receita',
  top10: 'Top 10 do mês',
  filiais: 'Filiais no mês',
  destaques: 'Destaques do mês',
} as const

export const MOVIMENTO_FRASES: Record<string, string> = {
  Saiu: 'saiu do forecast do mês',
  Postergou: 'postergou para outro período',
  'Alterou valor': 'teve valor alterado',
  Entrou: 'entrou no forecast',
}

export const AGENTE_COPY = {
  titulo: 'Agente Comercial',
  saudacao: 'Olá. Vamos analisar o cenário demonstrativo.',
  cargo: 'Diretoria Comercial',
  entrada: 'Pergunte sobre o mês, uma filial ou uma conta.',
  acompanhando: 'Filiais que estou acompanhando para você',
  briefingEyebrow: 'Briefing do dia',
  briefingSnapshot: AGENT_DEMO_SNAPSHOT,
  sinaisTitulo: 'O que mais explica o retrato de hoje',
  sinaisSubtitulo: 'Sinais derivados do mesmo mock usado pela Home.',
  conversaTitulo: 'Pergunte sobre o retrato',
  conversaSubtitulo: 'Interação simulada. Nenhum writeback é realizado.',
  abertura:
    'Seu briefing está carregado. Posso aprofundar forecast, semana atual, New Names × Cross, filiais ou as oportunidades que mais explicam o mês.',
  inputLabel: 'Pergunta para o agente',
  inputPlaceholder: 'Pergunte sobre o retrato de hoje',
  enviar: 'Enviar',
  voltar: 'Voltar à visão executiva',
  /** Divulgação permanente de estado local (plano Task 6 Step 4, l.597-600). */
  rodape: AGENT_DEMO_FOOTER,
  /** Resposta para pergunta fora do retrato (plano Task 6 Step 1, l.573-574). */
  limitacao:
    'Não encontrei essa resposta no retrato atual. Posso detalhar forecast, oportunidades, filiais, New Names x Cross ou a semana corrente.',
} as const

/**
 * Copy da Casa do assistente (revisão geral, ticket 01): abertura narrativa,
 * perguntas suportadas, intervenções sugeridas e Resposta em foco.
 *
 * Os textos com `{placeholders}` são preenchidos por `model.ts` — nenhum número
 * nasce na copy (mesma regra do restante da feature). A síntese descreve a
 * POSIÇÃO do recorte, nunca movimento entre meses que o snapshot não guarda.
 */
export const ASSISTENTE_COPY = {
  saudacao: 'Bom dia, Giovane.',
  /** Nome completo do mês da competência, para a narrativa do período mensal. */
  mesesCompletos: [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
  narrativaPeriodo: {
    month: 'Posição de {mes}',
    quarter: 'Posição do trimestre',
    threeMonths: 'Posição dos últimos 3 meses',
  } as Record<CommercialPeriod, string>,
  abertura: {
    gapAbaixo:
      '{periodo}: forecast atual de {atual} contra meta de {meta} — faltam {gap} ({pct}) para a meta.',
    gapAcima: '{periodo}: forecast atual de {atual} supera a meta de {meta} em {gap} ({pct}).',
    gapNaMeta: '{periodo}: forecast atual de {atual} está empatado com a meta de {meta}.',
    realizado: 'Ganhos no CRM do recorte: {realizado} ({pct} da meta).',
    recorteFiltrado: 'Recorte filtrado: {filtros}.',
    recorteSemFiltro: 'Recorte sem filtro: todas as filiais e todas as soluções.',
    exigeVoce:
      'Exige você: {n} oportunidades somam {valor} paradas antes da Negociação; a mais antiga está há {dias} dias sem avanço.',
    exigeVoceVazio: 'Exige você: nenhuma oportunidade parada antes da Negociação neste recorte.',
  },
  intervencao: {
    headline: '{conta}: {dias} dias sem avanço em {etapa}',
    reason: '{valor} em {etapa}, antes da Negociação · executivo {executivo} · filial {filial}',
  },
  foco: {
    atencaoConclusao: '{n} oportunidades pedem você antes da Negociação: {lista}.',
    atencaoConclusaoVazia: 'Nenhuma oportunidade parada antes da Negociação neste recorte.',
    atencaoEvidencia: '{conta} — {executivo}',
    atencaoLimite:
      'Prioridades limitadas às oportunidades paradas antes da Negociação, com forecast atual positivo.',
    atencaoProximo: 'Abrir {conta}',
    atencaoProximoVazio: 'Voltar ao fluxo da Central',
    mudouConclusao:
      'Da fotografia oficial ({oficial}) ao forecast atual ({atual}): {detalhe} — movimento líquido {net}.',
    mudouDetalhe: '{rotulo} {valor} ({n} oportunidades)',
    mudouEvidenciaFluxo: 'Fluxo do forecast',
    mudouLimite:
      'Movimentos comparam a fotografia oficial com a posição atual do mês; não descrevem meses anteriores.',
    mudouProximo: 'Abrir o fluxo do forecast',
    gapConclusaoAbaixo:
      'Gap de {gap} para a meta ({pct}): forecast atual em {atual} contra meta de {meta}; os ganhos no CRM do recorte somam {realizado} ({pctRealizado} da meta).',
    gapConclusaoAcima:
      'Forecast atual em {atual} supera a meta de {meta} em {gap} ({pct}); os ganhos no CRM do recorte somam {realizado} ({pctRealizado} da meta).',
    gapEvidenciaForecast: 'Forecast do mês',
    gapEvidenciaEvolucao: 'Evolução do mês na Central',
    gapEvidenciaCobertura: 'Cobertura de forecast em {filial}',
    gapLimiteComposicao:
      'Ganhos no CRM e forecast atual são conjuntos distintos: a leitura não soma os dois sobre a meta.',
    gapProximo: 'Abrir o forecast do mês',
    limiteSimulado: 'Posição de cenário simulado; sem histórico de meses anteriores.',
  },
} as const

/** Substantivo de cada movimento para narrativas ("saídas −R$ 0,9 mi"). */
export const MOVIMENTO_SUBSTANTIVOS: Record<ForecastMovement, string> = {
  Saiu: 'saídas',
  Postergou: 'postergações',
  'Alterou valor': 'alterações de valor',
  Entrou: 'entradas',
}

/**
 * Perguntas suportadas pela Resposta em foco — conjunto explícito do mock
 * (REVISAO-GERAL-PLANO: "conjunto explícito de perguntas suportadas").
 * Ordem contratada com a UI: atenção, mudanças, gap.
 */
export const ASSISTENTE_PERGUNTAS: SupportedQuestion[] = [
  {
    id: 'exige-atencao',
    label: 'O que exige minha atenção?',
    hint: 'Oportunidades paradas antes da Negociação, com valor, executivo e dias sem avanço.',
  },
  {
    id: 'o-que-mudou',
    label: 'O que mudou?',
    hint: 'Movimentos do forecast desde a fotografia oficial do mês.',
  },
  {
    id: 'explique-o-gap',
    label: 'Explique o gap',
    hint: 'Forecast atual contra a meta, com os ganhos no CRM do recorte.',
  },
]

export const FORECAST_COPY = {
  subtitulo: 'Da fotografia oficial aos movimentos do mês.',
  fluxoTitulo: 'Fluxo do forecast',
  fluxoSubtitulo: 'Clique em um movimento para filtrar as oportunidades.',
  listaTitulo: 'Oportunidades do recorte',
  filiaisTitulo: 'Visão por filial',
  filiaisSubtitulo: 'Ganhos no CRM, meta e forecast atual.',
  semMovimento: 'Nenhum movimento selecionado: a lista mostra todas as oportunidades do recorte.',
  limparMovimento: 'Limpar movimento',
} as const

export const FILIAIS_COPY = {
  subtitulo:
    'Aprofunde o mês por estrutura comercial, sem assumir relação 1:1 entre filial e HEAD.',
  resumoTitulo: 'Resumo da filial',
  oportunidadesTitulo: 'Oportunidades que explicam o resultado',
  oportunidadesSubtitulo: 'Ordenadas por impacto absoluto no forecast da filial.',
  semFilialTitulo: 'Escolha uma filial para aprofundar',
  semFilialTexto:
    'O filtro organizacional é Filial: HEAD nunca substitui filial em nenhum nível. Selecione uma filial para ver meta, ganhos no CRM, forecast atual e as oportunidades que explicam o resultado.',
  desconhecidaTitulo: 'Filial não encontrada no snapshot',
  desconhecidaTexto:
    'Esta filial não existe na competência selecionada. Nenhuma filial foi escolhida automaticamente — volte e selecione uma filial válida.',
  voltar: 'Voltar à visão executiva',
} as const

export const OPORTUNIDADES_COPY = {
  titulo: 'Oportunidades do período',
  subtitulo: 'Ordenadas por impacto absoluto no forecast.',
  buscaLabel: 'Buscar oportunidades',
  buscaPlaceholder: 'Buscar conta, solução ou executivo',
  limparBusca: 'Limpar busca',
} as const

export const OPORTUNIDADE_COPY = {
  composicaoTitulo: 'Composição comercial',
  historico: 'Movimentos do período',
  historicoSubtitulo: 'Histórico mockado do período, sem writeback.',
  recorrente: 'Mensalidade / recorrente',
  habilitacao: 'Habilitação',
  servicos: 'Serviços',
  semMovimento: 'Sem movimentos desde a fotografia oficial',
  naoEncontradaTitulo: 'Oportunidade não encontrada',
  naoEncontradaTexto:
    'O identificador informado não existe na competência selecionada. Nenhuma oportunidade foi inventada como fallback.',
} as const

export const DESTAQUES_COPY = {
  atencaoTitulo: 'Exigem atenção',
  atencaoDescricao: 'menor forecast atual sobre meta',
} as const
