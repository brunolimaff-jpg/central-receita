/**
 * Regras do painel de resultado do mês (CENTRAL-001-HOME).
 *
 * Puras: nenhuma tela, nenhum fetch. Cada bloco fala de um universo só e
 * declara a origem: Demo, Teste, Planejamento ou Export. MRR é apenas a
 * recorrência mensal; habilitação e serviço (NR) ficam em linha separada e
 * nunca somam ao MRR. Percentual sempre calculado do par valor/meta e exibido
 * junto do absoluto — nunca média de percentuais.
 */
import { matrizMrr, type CorteMrr, type LeituraCorte } from './central-vendas-mrr.ts'
import { isClosedStage } from './forecast-month.ts'
import { formatarMilhoes, formatarPercentualInteiro } from './format.ts'
import type { ImportedRecord } from './manual-import.ts'
import type { OrigemRealizado, SemanaRow } from './model'
import type { CommercialFilters } from './types'
import { VERTICAIS, type VerticalId } from './org-2027.ts'
import { mesDaReferencia } from './trajectory-model.ts'

export type OrigemBloco = 'demo' | 'teste' | 'planejamento' | 'export'

export function filtrosMensaisDaHome(filtros: CommercialFilters): CommercialFilters {
  return { ...filtros, period: 'month' }
}

export const ROTULO_ORIGEM: Record<OrigemBloco, string> = {
  demo: 'Demo',
  teste: 'Carga de teste',
  planejamento: 'Planejamento',
  export: 'Export',
}

export type SeloBloco = {
  origem: OrigemBloco
  rotulo: string
  periodo: string
  referencia: string
  texto: string
}

/** `Demo · set/2026 · fotografia 19/09/2026`, por exemplo. */
export function seloDoBloco(origem: OrigemBloco, periodo: string, referencia: string): SeloBloco {
  const rotulo = ROTULO_ORIGEM[origem]
  return { origem, rotulo, periodo, referencia, texto: `${rotulo} · ${periodo} · ${referencia}` }
}

export function rotuloExport(visual: boolean, filiais: number): string {
  return `${visual ? 'Export sintético (modo visual)' : 'Export real'} · ${pluralizar(filiais, 'filial', 'filiais')}`
}

export function referenciaPlanejamento(visual: boolean): string {
  return `base declarada no planejamento${visual ? ' · valores fictícios' : ''}`
}

export type MrrENr = { mrr: number; nrHabilitacao: number; nrServicos: number; nrTotal: number }

/** MRR = só recorrência. NR = habilitação + serviço, com o total separado. */
export function separarMrrNr(origem: OrigemRealizado): MrrENr {
  const mrr = origem.recorrente
  const nrHabilitacao = origem.habilitacao
  const nrServicos = origem.servicos
  return { mrr, nrHabilitacao, nrServicos, nrTotal: nrHabilitacao + nrServicos }
}

export type Atingimento = { percentual: number | null; absoluto: number | null }

/** Percentual e absoluto do mesmo par valor/meta; meta zero não vira 100%. */
export function atingimento(valor: number | null, meta: number | null): Atingimento {
  if (valor === null || meta === null || meta <= 0) return { percentual: null, absoluto: null }
  return { percentual: valor / meta, absoluto: valor - meta }
}

/**
 * `71% · faltam R$ 3,4 mi` — o percentual nunca aparece sozinho. O sinal do
 * absoluto é sempre `realizado − meta`: negativo falta, positivo passou.
 */
export function textoAtingimento(percentual: number | null, absoluto: number, formatar: (valor: number) => string = formatarMilhoes): string {
  if (percentual === null) return 'sem meta'
  const falta = absoluto < 0
    ? `faltam ${formatar(Math.abs(absoluto))}`
    : absoluto > 0
      ? `${formatar(absoluto)} acima`
      : `${formatar(0)} de diferença · na meta`
  return `${formatarPercentualInteiro(percentual)} · ${falta}`
}

/** Dado que a fonte não traz: aparece como texto, nunca como R$ 0 inventado. */
export const SEM_FONTE = ['clientes', 'ticket médio', 'novos clientes'] as const

/** `1 fechada e ganha` / `3 fechadas e ganhas` — a contagem concorda com o texto. */
export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

export type LinhaSegmento = {
  id: VerticalId | 'todos'
  nome: string
  base: number
  meta: number
  realizado: number
  percentual: number | null
  /** `realizado − meta`: negativo é o quanto falta, positivo é acima. */
  absoluto: number
  /** Peso no MRR total do corte; `null` quando não há base. */
  peso: number | null
  pesoAbsoluto: number
  semFonte: readonly string[]
}

function somarLeituras(leituras: LeituraCorte[]): LeituraCorte {
  const base = leituras.reduce((soma, item) => soma + item.base, 0)
  const meta = leituras.reduce((soma, item) => soma + item.meta, 0)
  const realizado = leituras.reduce((soma, item) => soma + item.realizado, 0)
  const forecast = leituras.reduce((soma, item) => soma + item.forecast, 0)
  return {
    base,
    meta,
    realizado,
    forecast,
    desempenho: meta > 0 ? realizado / meta : null,
    cobertura: meta > 0 ? forecast / meta : null,
    diferenca: meta - realizado,
  }
}

/**
 * Linhas por vertical a partir da matriz de planejamento (org-2027). O total é
 * a soma dos valores do mesmo corte — nunca a média dos percentuais.
 */
export function linhasSegmento(segmento: VerticalId | 'todos', corte: CorteMrr): LinhaSegmento[] {
  const matriz = matrizMrr()
  const porVertical = VERTICAIS.map((vertical) => {
    const leituras = matriz.linhas
      .map((linha) => linha.celulas.find((celula) => celula.verticalId === vertical.id)?.porCorte[corte])
      .filter((leitura): leitura is LeituraCorte => leitura !== null)
    return { id: vertical.id, nome: vertical.nome, leitura: somarLeituras(leituras) }
  })
  const total = somarLeituras(porVertical.map((item) => item.leitura))
  const paraLinha = (id: VerticalId | 'todos', nome: string, leitura: LeituraCorte): LinhaSegmento => {
    const at = atingimento(leitura.realizado, leitura.meta)
    return {
      id,
      nome,
      base: leitura.base,
      meta: leitura.meta,
      realizado: leitura.realizado,
      percentual: at.percentual,
      absoluto: at.absoluto ?? 0,
      peso: total.base > 0 ? leitura.base / total.base : null,
      pesoAbsoluto: leitura.base,
      semFonte: SEM_FONTE,
    }
  }
  const linhas = porVertical
    .filter((item) => segmento === 'todos' || item.id === segmento)
    .map((item) => paraLinha(item.id, item.nome, item.leitura))
  if (segmento === 'todos') linhas.push(paraLinha('todos', 'Todos os segmentos', total))
  return linhas
}

export type ResumoExport = {
  meta: number
  integrado: number
  percentual: number | null
  absoluto: number
  filiais: number
}

/** Agregado exportado: pedido integrado não é receita nem MRR. */
export function resumoExport(total: { meta: number; realizado: number }, filiais: number): ResumoExport {
  const { percentual, absoluto } = atingimento(total.realizado, total.meta)
  return { meta: total.meta, integrado: total.realizado, percentual, absoluto: absoluto ?? 0, filiais }
}

export type SemanaResultado = { week: number; label: string; forecast: number | null; pace: number | null }

export function evolucaoSemanal(semanas: SemanaRow[]): SemanaResultado[] {
  return Array.from({ length: 5 }, (_, indice) => {
    const week = indice + 1
    const semana = semanas.find((item) => item.week === week)
    return { week, label: semana?.label ?? `Sem ${week}`, forecast: semana?.forecast ?? null, pace: semana?.pace ?? null }
  })
}

export const CORTES_URL: readonly CorteMrr[] = ['geral', 'base', 'novos']

export function normalizarCorte(valor: string | null | undefined): CorteMrr {
  return valor === 'base' || valor === 'novos' ? valor : 'geral'
}

export function normalizarSegmento(valor: string | null | undefined): VerticalId | 'todos' {
  return VERTICAIS.some((vertical) => vertical.id === valor) ? (valor as VerticalId) : 'todos'
}

/**
 * Leva o recorte do painel para a próxima tela. `geral` e `todos` são o
 * consolidado e não entram na URL (mesmo contrato de `solution`/`branch`).
 */
export function hrefComFiltros(base: string, segmento: VerticalId | 'todos', corte: CorteMrr): string {
  const [caminho, consulta = ''] = base.split('?')
  const params = new URLSearchParams(consulta)
  if (segmento === 'todos') params.delete('segmento')
  else params.set('segmento', segmento)
  if (corte === 'geral') params.delete('corte')
  else params.set('corte', corte)
  return `${caminho}?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Carga de teste (planilha importada na sessão)
// ---------------------------------------------------------------------------

export type ResumoCarga = {
  /** Competência lida da data de referência (`aaaa-mm`); `null` quando a data não é ISO válida. */
  mes: string | null
  ganhos: { total: number; quantidade: number }
  emAberto: { total: number; quantidade: number }
  /** Registros com data válida em outro mês — contados, nunca somados. */
  foraDoMes: number
  /** Registros sem data ou com data inválida — contados, nunca datados por conta própria. */
  semData: number
  /** Registros da competência sem valor na coluna lida — contados, fora do total. */
  semValor: number
  /** Linhas lidas do arquivo, incluindo as excluídas dos cartões. */
  total: number
}

/**
 * Lê a carga de teste **na competência da data de referência**. Ganho usa a
 * data de fechamento (Efetivação); oportunidade aberta usa a previsão de
 * fechamento. Registro de outro mês, sem data ou sem valor não entra no total —
 * é contado e declarado na tela, para a soma de um mês nunca virar a soma do
 * arquivo inteiro.
 */
export function lerCargaTeste(registros: readonly ImportedRecord[], referenceDate: string | null | undefined): ResumoCarga {
  const mes = mesDaReferencia(referenceDate)
  const resumo: ResumoCarga = {
    mes,
    ganhos: { total: 0, quantidade: 0 },
    emAberto: { total: 0, quantidade: 0 },
    foraDoMes: 0,
    semData: 0,
    semValor: 0,
    total: registros.length,
  }
  if (mes === null) return resumo
  for (const registro of registros) {
    const ganha = isClosedStage(registro.stage) && /ganha/i.test(registro.stage)
    if (!ganha && isClosedStage(registro.stage)) continue
    const data = ganha ? registro.closingDate : registro.forecastDate
    const mesDoRegistro = mesDaReferencia(data)
    if (mesDoRegistro === null) { resumo.semData += 1; continue }
    if (mesDoRegistro !== mes) { resumo.foraDoMes += 1; continue }
    const valor = ganha ? registro.closedValue : registro.predictedValue
    if (valor === null) { resumo.semValor += 1; continue }
    const destino = ganha ? resumo.ganhos : resumo.emAberto
    destino.total += valor
    destino.quantidade += 1
  }
  return resumo
}
