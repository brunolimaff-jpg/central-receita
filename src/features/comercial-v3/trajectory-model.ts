import { calculateForecastMonth, FORECAST_MIN_PROBABILITY, isForecastStage } from './forecast-month.ts'
import type { ImportedRecord } from './manual-import'

/** Resumo numérico de uma carga, em reais; é o que o histórico guarda para os regimes B e C. */
export type TrajectorySnapshot = {
  forecastTotal: number
  entered: number
  exited: number
  changed: number
  realized: number
}

export type TrajectoryPoint = {
  /** ISO, sempre uma data real. */
  date: string
  /** `05/10`. */
  label: string
  /** Reais, acumulado. */
  forecast: number | null
  /** Reais, acumulado. */
  realized: number | null
}

export type TrajectorySeries = {
  kind: 'previsto' | 'realizado' | 'restante'
  rotulo: string
  tracejado: boolean
  points: TrajectoryPoint[]
}

export type TrajectoryModel = {
  regime: 'vazio' | 'A' | 'B' | 'C'
  series: TrajectorySeries[]
  ticks: string[]
  /** Reais. */
  previsto: number | null
  /** Reais. */
  realizado: number | null
  /** Reais com data declarada. */
  datado: number | null
  semData: number
  /** Decomposição entre a carga anterior e a atual; `null` sem carga anterior. */
  ponte: TrajectoryBridge | null
}

export type BridgeStep = { movimento: 'Entrou' | 'Saiu' | 'Alterou valor'; valor: number }

export type TrajectoryBridge = {
  /** Reais. */
  totalAnterior: number | null
  /** Reais. */
  totalAtual: number | null
  /** Só `true` quando os lances fecham com a diferença dos totais. */
  publicada: boolean
  /** Vazio quando não publicada; lances de valor zero são omitidos. */
  lances: BridgeStep[]
}

/** Em reais: R$ 0,01. A carga não converte unidade, e arredondamento de planilha cabe aqui. */
const TOLERANCIA_RECONCILIACAO = 0.01

const label = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`

/** Duas cargas no mesmo dia ganham a hora no rótulo; sem isso seriam dois X iguais e indistinguíveis. */
function rotulosDeCarga(times: string[]): string[] {
  const porDia = new Map<string, number>()
  for (const at of times) porDia.set(at.slice(0, 10), (porDia.get(at.slice(0, 10)) ?? 0) + 1)
  return times.map(at => {
    const day = at.slice(0, 10)
    const hora = at.slice(11, 16)
    return porDia.get(day)! > 1 && hora ? `${label(day)} ${hora}` : label(day)
  })
}

/** No máximo seis marcas, escolhidas por índice; a primeira e a última sempre entram. */
function marcasDeEixo(labels: string[]): string[] {
  if (labels.length <= 6) return labels
  return Array.from({ length: 6 }, (_, index) => labels[Math.round(index * (labels.length - 1) / 5)])
}

/** `null` se qualquer valor da lista for nulo — nulo contamina, nunca vira zero. */
const somaConhecida = (values: Array<number | null>): number | null =>
  values.some(value => value === null) ? null : values.reduce<number>((sum, value) => sum + (value as number), 0)

const soma = (accumulated: number | null, value: number | null) => accumulated === null || value === null ? null : accumulated + value

/** Soma por data acumulando no tempo; lacuna é `null`, nunca zero. */
function acumularPorData(records: ImportedRecord[], dateOf: (record: ImportedRecord) => string, valueOf: (record: ImportedRecord) => number | null) {
  const groups = new Map<string, Array<number | null>>()
  for (const record of records) {
    const date = dateOf(record)
    const group = groups.get(date)
    if (group) group.push(valueOf(record)); else groups.set(date, [valueOf(record)])
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, value: somaConhecida(values) }))
}

/** Série acumulada na linha do tempo: cada data carrega o acumulado de tudo até ela. */
function serieAcumulada(dates: string[], byDate: Map<string, number | null>) {
  let accumulated: number | null = 0
  return dates.map(date => {
    accumulated = byDate.has(date) ? soma(accumulated, byDate.get(date)!) : accumulated
    return { date, label: label(date), forecast: accumulated, realized: accumulated }
  })
}

export function buildTrajectory(args: {
  opportunities: ImportedRecord[]
  previous: ImportedRecord[] | null
  referenceDate: string
  history: Array<{ at: string; snapshot?: TrajectorySnapshot }>
}): TrajectoryModel {
  if (args.opportunities.length === 0) {
    return { regime: 'vazio', series: [], ticks: [], previsto: null, realizado: null, datado: null, semData: 0, ponte: null }
  }
  const month = args.referenceDate.slice(0, 7)
  const forecast = calculateForecastMonth(args.opportunities, args.previous, month, args.referenceDate, 'mês')
  const withSnapshot = args.history.filter(entry => entry.snapshot != null)
  // Regime C exige três pontos válidos; com menos, a comparação entre duas cargas basta.
  const regime: TrajectoryModel['regime'] = args.previous === null ? 'A' : withSnapshot.length >= 3 ? 'C' : 'B'

  /*
   * A régua vem de `calculateForecastMonth` (Proposta/Negociação, chance ≥75% e mês).
   * Só os elegíveis sem data escapam dela, porque o forecast os descarta; eles contam
   * em `semData`, entram no total previsto e formam o traço "restante".
   */
  const chanceOk = (record: ImportedRecord) =>
    !forecast.probabilityAvailable || (typeof record.probability === 'number' && record.probability >= FORECAST_MIN_PROBABILITY)
  const semDataRecords = args.opportunities.filter(record => isForecastStage(record.stage) && chanceOk(record) && record.forecastDate === null)
  const datado = forecast.predicted.value
  const previsto = somaConhecida([datado, somaConhecida(semDataRecords.map(record => record.predictedValue))])
  const realizado = forecast.realized.value
  const totals = { previsto, realizado, datado, semData: semDataRecords.length, ponte: ponteDaCarga(forecast, args.previous, month, args.referenceDate) }

  if (regime === 'C') {
    const snapshots = [...withSnapshot].sort((a, b) => a.at.localeCompare(b.at))
    const labels = rotulosDeCarga(snapshots.map(entry => entry.at))
    const points = (field: 'forecast' | 'realized', pick: (snapshot: TrajectorySnapshot) => number) =>
      snapshots.map((entry, index) => ({
        date: entry.at.slice(0, 10),
        label: labels[index],
        forecast: field === 'forecast' ? pick(entry.snapshot!) : null,
        realized: field === 'realized' ? pick(entry.snapshot!) : null,
      }))
    return {
      regime, ...totals,
      series: [
        { kind: 'previsto', rotulo: 'Previsto', tracejado: false, points: points('forecast', snapshot => snapshot.forecastTotal) },
        { kind: 'realizado', rotulo: 'Ganhos no CRM', tracejado: false, points: points('realized', snapshot => snapshot.realized) },
      ],
      ticks: marcasDeEixo(labels),
    }
  }

  const previstosPorData = acumularPorData(forecast.predicted.records, record => record.forecastDate!, record => record.predictedValue)
  const realizadosPorData = acumularPorData(forecast.realized.records, record => record.closingDate!, record => record.closedValue)
  const forecastByDate = new Map(previstosPorData.map(point => [point.date, point.value]))
  const realizedByDate = new Map(realizadosPorData.map(point => [point.date, point.value]))
  const dates = [...new Set([...forecastByDate.keys(), ...realizedByDate.keys()])].sort((a, b) => a.localeCompare(b))

  // Cada série acumula só a própria grandeza; a outra fica nula para o componente escolher o traço.
  const previstoPoints = serieAcumulada(dates, forecastByDate).map(point => ({ ...point, realized: null }))
  const realizadoPoints = serieAcumulada(dates, realizedByDate).map(point => ({ ...point, forecast: null }))

  const series: TrajectorySeries[] = [
    { kind: 'previsto', rotulo: 'Previsto', tracejado: false, points: previstoPoints },
    { kind: 'realizado', rotulo: 'Ganhos no CRM', tracejado: false, points: realizadoPoints.filter(point => realizedByDate.has(point.date)) },
  ]
  const restante = previsto === null || datado === null ? null : previsto - datado
  if (restante !== null && restante > 0) {
    // O que não tem data entra depois do último ponto conhecido, sem voltar no tempo.
    const ateReferencia = previstoPoints.filter(point => point.date <= args.referenceDate)
    const ultimo = ateReferencia.at(-1)
    series.push({ kind: 'restante', rotulo: 'Sem data', tracejado: true, points: [
      ...(ultimo && ultimo.date < args.referenceDate ? [ultimo] : []),
      { date: args.referenceDate, label: label(args.referenceDate), forecast: previsto, realized: null },
    ] })
  }
  return { regime, ...totals, series, ticks: dates.map(label) }
}

/**
 * Componentes da ponte pela mesma régua do forecast: total de cada carga é o
 * previsto do mês dela; Entrou e Saiu vêm do próprio `calculateForecastMonth`;
 * Alterou é a variação de valor de quem está nas duas.
 */
function ponteDaCarga(forecast: ReturnType<typeof calculateForecastMonth>, previous: ImportedRecord[] | null, month: string, referenceDate: string): TrajectoryBridge | null {
  if (previous === null) return null
  const anterior = calculateForecastMonth(previous, null, month, referenceDate, 'mês').predicted
  const antes = new Map(anterior.records.map(record => [record.opportunityId, record.predictedValue]))
  const variacoes = forecast.predicted.records.filter(record => antes.has(record.opportunityId)).map(record => {
    const valorAntes = antes.get(record.opportunityId)!
    return record.predictedValue === null || valorAntes === null ? null : record.predictedValue - valorAntes
  })
  const saiu = forecast.exited?.value ?? null
  return montarPonte({
    totalAnterior: anterior.value,
    totalAtual: forecast.predicted.value,
    entrou: forecast.entered?.value ?? null,
    saiu: saiu === null ? null : -saiu,
    alterou: somaConhecida(variacoes),
  })
}

/** Publica os lances só se `ponteReconcilia` aceitar; senão, ficam só os totais. */
export function montarPonte(args: Parameters<typeof ponteReconcilia>[0]): TrajectoryBridge {
  const publicada = ponteReconcilia(args)
  const lances: BridgeStep[] = !publicada ? [] : ([
    { movimento: 'Entrou', valor: args.entrou! },
    { movimento: 'Saiu', valor: args.saiu! },
    { movimento: 'Alterou valor', valor: args.alterou! },
  ] as BridgeStep[]).filter(lance => lance.valor !== 0)
  return { totalAnterior: args.totalAnterior, totalAtual: args.totalAtual, publicada, lances }
}

/**
 * Subtítulo e selo da seção por regime. `anteriorEm` é o `importedAt`/`savedAt`
 * da carga anterior; sem ele, o regime B não inventa data.
 */
export function cabecalhoTrajetoria(model: TrajectoryModel, anteriorEm: string | null): {
  contexto: string
  selo: { texto: string; tom: 'marca' | 'info' } | null
} {
  if (model.regime === 'vazio') return { contexto: 'Importe a planilha de oportunidades para acompanhar o mês.', selo: null }
  if (model.regime === 'A') return { contexto: 'Acumulado do mês pela data de fechamento e de conferência.', selo: { texto: '1 carga', tom: 'marca' } }
  if (model.regime === 'B') {
    return {
      contexto: anteriorEm ? `Comparado à carga de ${label(anteriorEm.slice(0, 10))}.` : 'Comparado à carga anterior.',
      selo: { texto: '2 cargas', tom: 'marca' },
    }
  }
  // Em C, cada ponto do previsto é uma carga.
  const labels = model.series.find(serie => serie.kind === 'previsto')?.points.map(point => point.label) ?? []
  return {
    contexto: `Evolução em ${labels.length} cargas, de ${labels[0]} a ${labels.at(-1)}.`,
    selo: { texto: `${labels.length} cargas`, tom: 'info' },
  }
}

/**
 * A ponte entre duas cargas só publica quando a soma dos componentes fecha com a
 * diferença dos totais, em reais, com tolerância de R$ 0,01. Nulo não vira zero.
 */
export function ponteReconcilia(args: {
  totalAnterior: number | null
  totalAtual: number | null
  entrou: number | null
  saiu: number | null
  alterou: number | null
}): boolean {
  const { totalAnterior, totalAtual, entrou, saiu, alterou } = args
  if (totalAnterior === null || totalAtual === null || entrou === null || saiu === null || alterou === null) return false
  // O epsilon só absorve o resíduo binário; o limite continua sendo R$ 0,01.
  return Math.abs((totalAtual - totalAnterior) - (entrou + saiu + alterou)) <= TOLERANCIA_RECONCILIACAO + 1e-9
}
