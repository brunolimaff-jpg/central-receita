/**
 * Central de Vendas — leitura de MRR e matriz Territórios × Verticais.
 *
 * **Cenário demonstrativo.** A base de cada célula vem do organograma de 2027
 * (`org-2027.ts`): o MRR declarado por território e vertical. Meta, realizado,
 * forecast e a parcela de negócios novos são derivados sintéticos, identificados
 * na tela — nenhum deles vem de carga, CRM ou ERP.
 *
 * A matriz não reconcilia com a base declarada: a abertura por vertical soma
 * menos que o total do organograma, e o resíduo é exposto no rodapé em vez de
 * redistribuído. É a mesma regra de `carteira-territorio.ts`.
 *
 * Nada aqui inventa território a partir de oportunidade: a carga traz unidade de
 * negócio, não UF, então o vínculo oportunidade → território continua indisponível.
 */

import { MRR_TOTAL, TERRITORIOS, VERTICAIS, type VerticalId } from './org-2027.ts'

export type CorteMrr = 'geral' | 'base' | 'novos'
export type MetricaMatriz = 'desempenho' | 'cobertura' | 'diferenca'

export const CORTES: ReadonlyArray<{ id: CorteMrr; rotulo: string; nota: string }> = [
  { id: 'geral', rotulo: 'Geral', nota: 'Base declarada mais os negócios novos do cenário.' },
  { id: 'base', rotulo: 'Base', nota: 'Só a base declarada no organograma de 2027.' },
  { id: 'novos', rotulo: 'Novos', nota: 'Só os negócios novos do cenário demonstrativo.' },
]

export const METRICAS: ReadonlyArray<{ id: MetricaMatriz; rotulo: string; nota: string }> = [
  { id: 'desempenho', rotulo: 'Desempenho', nota: 'Realizado dividido pela meta da célula.' },
  { id: 'cobertura', rotulo: 'Cobertura', nota: 'Forecast atual dividido pela meta da célula.' },
  { id: 'diferenca', rotulo: 'Diferença', nota: 'Meta menos realizado: quanto falta na célula.' },
]

/** Meta do mês = base do corte × 1,10 (alvo de crescimento do cenário). */
const META_MENSAL = 1.1

/** Desempenho por território × vertical, na ordem de TERRITORIOS e VERTICAIS. */
const DESEMPENHO: number[][] = [
  [0.97, 0.92, 0.99, 0.94],
  [0.88, 0.95, 1.01, 0.9],
  [1.04, 0.98, 0.93, 1.02],
  [0.91, 1.05, 0.96, 0.87],
  [1.0, 0.95, 1.04, 0.98],
]

/** Cobertura (forecast ÷ meta) por território × vertical. */
const COBERTURA: number[][] = [
  [1.03, 0.97, 1.02, 0.99],
  [0.93, 1.01, 1.05, 0.95],
  [1.08, 1.02, 0.97, 1.06],
  [0.96, 1.09, 1.01, 0.92],
  [1.0, 0.95, 1.04, 0.98],
]

/** Negócios novos como fração da base declarada, por território × vertical. */
const NOVOS: number[][] = [
  [0.06, 0.09, 0.07, 0.12],
  [0.1, 0.07, 0.06, 0.14],
  [0.05, 0.08, 0.09, 0.11],
  [0.07, 0.1, 0.08, 0.13],
  [0.12, 0.15, 0.11, 0.18],
]

export type LeituraCorte = {
  base: number
  meta: number
  realizado: number
  forecast: number
  /** `realizado ÷ meta`; `null` quando a meta não é positiva. */
  desempenho: number | null
  /** `forecast ÷ meta`; `null` quando a meta não é positiva. */
  cobertura: number | null
  /** `meta − realizado`, positivo quando falta para a meta. */
  diferenca: number
}

export type CelulaMrr = {
  verticalId: VerticalId
  verticalNome: string
  cor: string
  /** `null` no território sem base própria: mostrar R$ 0 diria "vendeu nada". */
  porCorte: Record<CorteMrr, LeituraCorte | null>
}

export type LinhaMrr = {
  numero: number
  territorioId: string
  nome: string
  ufs: string
  cor: string
  semBasePropria: boolean
  celulas: CelulaMrr[]
  totais: Record<CorteMrr, LeituraCorte | null>
}

export type MatrizMrr = {
  colunas: Array<{ id: VerticalId; nome: string; cor: string }>
  linhas: LinhaMrr[]
  totais: Record<CorteMrr, LeituraCorte | null>
  somaDaMatriz: number
  totalDeclarado: number
  diferencaDaMatriz: number
  aviso: string
}

/** `territorio-01` … `territorio-05`: o mesmo identificador da tela de Territórios. */
export function idDoTerritorio(numero: number): string {
  return `territorio-${String(numero).padStart(2, '0')}`
}

function leitura(base: number, desempenho: number, cobertura: number): LeituraCorte {
  const meta = base * META_MENSAL
  const realizado = meta * desempenho
  const forecast = meta * cobertura
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

/** Soma de leituras; `null` quando nenhuma das partes tem base. */
function somar(partes: Array<LeituraCorte | null>): LeituraCorte | null {
  const validas = partes.filter((parte): parte is LeituraCorte => parte !== null)
  if (validas.length === 0) return null
  const base = validas.reduce((soma, parte) => soma + parte.base, 0)
  const meta = validas.reduce((soma, parte) => soma + parte.meta, 0)
  const realizado = validas.reduce((soma, parte) => soma + parte.realizado, 0)
  const forecast = validas.reduce((soma, parte) => soma + parte.forecast, 0)
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
 * Matriz completa. Tudo é determinístico: os mesmos dados de `org-2027.ts` e as
 * mesmas tabelas acima produzem sempre os mesmos números, o que permite testar a
 * regra sem navegador.
 */
export function matrizMrr(): MatrizMrr {
  const linhas = TERRITORIOS.map((territorio) => {
    const i = TERRITORIOS.findIndex((item) => item.numero === territorio.numero)
    const semBasePropria = territorio.porVertical === null
    const celulas = VERTICAIS.map((vertical, j) => {
      if (!territorio.porVertical) {
        return {
          verticalId: vertical.id,
          verticalNome: vertical.nome,
          cor: vertical.cor,
          porCorte: { geral: null, base: null, novos: null },
        }
      }
      const base = territorio.porVertical[vertical.id].mrr
      const novos = base * NOVOS[i][j]
      const daBase = leitura(base, DESEMPENHO[i][j], COBERTURA[i][j])
      const deNovos = leitura(novos, Math.max(0, DESEMPENHO[i][j] - 0.06), Math.max(0, COBERTURA[i][j] - 0.04))
      const doGeral = somar([daBase, deNovos])
      return {
        verticalId: vertical.id,
        verticalNome: vertical.nome,
        cor: vertical.cor,
        porCorte: { geral: doGeral, base: daBase, novos: deNovos },
      }
    })
    const totais: Record<CorteMrr, LeituraCorte | null> = {
      geral: somar(celulas.map((celula) => celula.porCorte.geral)),
      base: somar(celulas.map((celula) => celula.porCorte.base)),
      novos: somar(celulas.map((celula) => celula.porCorte.novos)),
    }
    return {
      numero: territorio.numero,
      territorioId: idDoTerritorio(territorio.numero),
      nome: territorio.nome,
      ufs: territorio.ufs,
      cor: territorio.cor,
      semBasePropria,
      celulas,
      totais,
    }
  })

  const totais: Record<CorteMrr, LeituraCorte | null> = {
    geral: somar(linhas.map((linha) => linha.totais.geral)),
    base: somar(linhas.map((linha) => linha.totais.base)),
    novos: somar(linhas.map((linha) => linha.totais.novos)),
  }
  const somaDaMatriz = linhas.reduce(
    (soma, linha) => soma + linha.celulas.reduce((parcial, celula) => parcial + (celula.porCorte.base?.base ?? 0), 0),
    0,
  )

  return {
    colunas: VERTICAIS.map((vertical) => ({ id: vertical.id, nome: vertical.nome, cor: vertical.cor })),
    linhas,
    totais,
    somaDaMatriz,
    totalDeclarado: MRR_TOTAL,
    diferencaDaMatriz: MRR_TOTAL - somaDaMatriz,
    aviso:
      'Base declarada no organograma de 2027, não medida na carga. Meta, realizado, forecast e negócios novos são sintéticos. A soma da matriz não fecha com o total declarado: o resíduo aparece no rodapé e não foi redistribuído. Nenhuma oportunidade importada pode ser atribuída a território hoje — a carga traz unidade de negócio, não UF.',
  }
}

// ---------------------------------------------------------------------------
// Leitura de MRR da Home
// ---------------------------------------------------------------------------

/**
 * Estado da leitura da carga na Home. Um só por vez: a tela nunca mistura
 * "carregando" com "sem carga", nem mostra cenário fictício enquanto consulta
 * ou quando a consulta falhou.
 */
export type EstadoHome = 'carregando' | 'erro' | 'sem-carga' | 'com-carga'

export function estadoDaHome({ temCarga, carregando, falha }: {
  temCarga: boolean
  carregando: boolean
  falha: string | null
}): EstadoHome {
  if (temCarga) return 'com-carga'
  if (carregando) return 'carregando'
  if (falha) return 'erro'
  return 'sem-carga'
}

/**
 * Dados fictícios só aparecem na Home **sem carga confirmada**. Durante a
 * consulta, em erro e com carga real, a leitura é outra — ou nenhuma.
 */
export function mostraLeituraSintetica(estado: EstadoHome): boolean {
  return estado === 'sem-carga'
}

/**
 * O bloco semanal só existe com carga (declara "sem fonte") ou no cenário, sem
 * carga. Em carregamento e em falha não há série para mostrar — e o cenário não
 * aparece no erro, pela mesma regra da leitura sintética.
 */
export function mostraBlocoSemanal(estado: EstadoHome): boolean {
  return estado === 'sem-carga' || estado === 'com-carga'
}

/**
 * Valores em **milhões de reais**, a mesma unidade do fixture comercial
 * (`selectHomeModel`). O formato da tela (`formatarMilhoes`) espera milhões.
 */
export type ResumoMrrMes = {
  meta: number
  realizado: number
  forecastAtual: number
  /** Forecast congelado: a fotografia validada que não muda durante a leitura. */
  forecastCongelado: number
  /** `realizado − meta`: negativo é o quanto falta hoje. */
  diferenca: number
  /** `forecastAtual − meta`. */
  diferencaDoForecast: number
  atingimento: number | null
  cobertura: number | null
}

type KpiLike = { key: string; value: number }

export function resumoMrrMes(kpis: ReadonlyArray<KpiLike>): ResumoMrrMes {
  const valor = (key: string) => kpis.find((kpi) => kpi.key === key)?.value ?? 0
  const meta = valor('meta')
  const realizado = valor('realizado')
  const forecastAtual = valor('forecastAtual')
  const forecastCongelado = valor('forecastOficial')
  return {
    meta,
    realizado,
    forecastAtual,
    forecastCongelado,
    diferenca: realizado - meta,
    diferencaDoForecast: forecastAtual - meta,
    atingimento: meta > 0 ? realizado / meta : null,
    cobertura: meta > 0 ? forecastAtual / meta : null,
  }
}

export type LeituraSemana = {
  week: number
  label: string
  rangeLabel: string
  forecast: number
  pace: number
  /** `forecast − pace`: positivo é previsão acima do ritmo necessário. */
  diferenca: number
  current: boolean
  closed: boolean
}

type SemanaLike = {
  week: number
  label: string
  rangeLabel: string
  forecast: number
  pace: number
  current: boolean
  closed: boolean
}

export function leituraSemanal(semanas: ReadonlyArray<SemanaLike>): LeituraSemana[] {
  return semanas.map((semana) => ({
    week: semana.week,
    label: semana.label,
    rangeLabel: semana.rangeLabel,
    forecast: semana.forecast,
    pace: semana.pace,
    diferenca: semana.forecast - semana.pace,
    current: semana.current,
    closed: semana.closed,
  }))
}
