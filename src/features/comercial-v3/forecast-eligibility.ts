import type { ImportedRecord } from './manual-import'
import { FORECAST_MIN_PROBABILITY, FORECAST_PROBABILITY_NOTICE, isForecastStage } from './forecast-month.ts'

export type EstadoCriterio = 'atende' | 'nao-atende' | 'indisponivel'
export type CriterioForecast = 'etapa' | 'propostaSinalizada' | 'probabilidade' | 'previsaoFechamento'
export type ClassificacaoForecast = 'elegivel' | 'inelegivel' | 'indeterminado'
export type AvaliacaoForecast = {
  registro: ImportedRecord
  criterios: Record<CriterioForecast, EstadoCriterio>
  classificacao: ClassificacaoForecast
}
export type TotalForecast = {
  valor: number | null
  estado: 'valido' | 'degradado' | 'indisponivel'
  motivo: string | null
  quantidade: number
  registros: ImportedRecord[]
  semValor: number
  criteriosAplicados: CriterioForecast[]
}
export type ResultadoElegibilidadeForecast = {
  competencia: string
  avaliacoes: AvaliacaoForecast[]
  corporativo: TotalForecast & { criteriosIndisponiveis: Partial<Record<CriterioForecast, number>> }
  estimado: TotalForecast & { rotulo: string; semProbabilidade: number; aviso: string | null }
  elegiveisEstimados: ImportedRecord[]
  indeterminados: ImportedRecord[]
  contagens: Record<ClassificacaoForecast, number>
}

const criterios: CriterioForecast[] = ['etapa', 'propostaSinalizada', 'probabilidade', 'previsaoFechamento']
const nomes: Record<CriterioForecast, string> = {
  etapa: 'Etapa', propostaSinalizada: 'Proposta cadastrada e sinalizada para fechamento',
  probabilidade: 'Probabilidade', previsaoFechamento: 'Previsão de fechamento',
}
const atende = (condicao: boolean): EstadoCriterio => condicao ? 'atende' : 'nao-atende'
const probabilidadeConhecida = (registro: ImportedRecord) => typeof registro.probability === 'number' && Number.isFinite(registro.probability)
const validarCompetencia = (competencia: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)) throw new Error('Competência inválida: use AAAA-MM.')
}

export function avaliarElegibilidadeForecast(registro: ImportedRecord, competencia: string): AvaliacaoForecast {
  validarCompetencia(competencia)
  const criterios: AvaliacaoForecast['criterios'] = {
    etapa: registro.stage?.trim() ? atende(isForecastStage(registro.stage)) : 'indisponivel',
    propostaSinalizada: registro.proposalFlagged == null ? 'indisponivel' : atende(registro.proposalFlagged),
    probabilidade: probabilidadeConhecida(registro) ? atende(registro.probability! >= FORECAST_MIN_PROBABILITY) : 'indisponivel',
    previsaoFechamento: registro.forecastDate ? atende(registro.forecastDate.startsWith(`${competencia}-`)) : 'indisponivel',
  }
  const estados = Object.values(criterios)
  const classificacao = estados.includes('nao-atende') ? 'inelegivel' : estados.includes('indisponivel') ? 'indeterminado' : 'elegivel'
  return { registro, criterios, classificacao }
}

function totalizar(registros: ImportedRecord[], criteriosAplicados: CriterioForecast[]): TotalForecast {
  const semValor = registros.filter(registro => registro.predictedValue == null).length
  return {
    valor: semValor ? null : registros.reduce((soma, registro) => soma + registro.predictedValue!, 0),
    estado: semValor ? 'indisponivel' : 'valido',
    motivo: semValor ? `Valor previsto indisponível em ${semValor} registro(s).` : null,
    quantidade: registros.length, registros, semValor, criteriosAplicados,
  }
}

export function calcularElegibilidadeForecast(registros: ImportedRecord[], competencia: string): ResultadoElegibilidadeForecast {
  validarCompetencia(competencia)
  const avaliacoes = registros.map(registro => avaliarElegibilidadeForecast(registro, competencia))
  const indeterminados = avaliacoes.filter(avaliacao => avaliacao.classificacao === 'indeterminado')
  const criteriosIndisponiveis: Partial<Record<CriterioForecast, number>> = {}
  for (const avaliacao of indeterminados) {
    for (const criterio of criterios) {
      if (avaliacao.criterios[criterio] === 'indisponivel') criteriosIndisponiveis[criterio] = (criteriosIndisponiveis[criterio] ?? 0) + 1
    }
  }
  const corporativo = { ...totalizar(avaliacoes.filter(avaliacao => avaliacao.classificacao === 'elegivel').map(avaliacao => avaliacao.registro), [...criterios]), criteriosIndisponiveis }
  if (indeterminados.length) {
    corporativo.valor = null
    corporativo.estado = 'indisponivel'
    corporativo.motivo = criterios.filter(criterio => criteriosIndisponiveis[criterio]).map(criterio => `${nomes[criterio]} indisponível em ${criteriosIndisponiveis[criterio]} registro(s).`).join(' ')
  }
  const comProbabilidade = registros.some(probabilidadeConhecida)
  const candidatos = avaliacoes.filter(avaliacao => avaliacao.criterios.etapa === 'atende' && avaliacao.criterios.previsaoFechamento === 'atende')
  const elegiveisEstimados = candidatos.filter(avaliacao => !comProbabilidade || avaliacao.criterios.probabilidade === 'atende').map(avaliacao => avaliacao.registro)
  const estimado = {
    ...totalizar(elegiveisEstimados, comProbabilidade ? ['etapa', 'probabilidade', 'previsaoFechamento'] : ['etapa', 'previsaoFechamento']),
    rotulo: 'Forecast estimado (3 de 4 critérios)',
    semProbabilidade: candidatos.filter(avaliacao => avaliacao.criterios.probabilidade === 'indisponivel').length,
    aviso: comProbabilidade ? null : FORECAST_PROBABILITY_NOTICE,
  }
  if (!comProbabilidade && estimado.estado === 'valido') estimado.estado = 'degradado'
  return {
    competencia, avaliacoes, corporativo, estimado, elegiveisEstimados,
    indeterminados: indeterminados.map(avaliacao => avaliacao.registro),
    contagens: {
      elegivel: avaliacoes.filter(avaliacao => avaliacao.classificacao === 'elegivel').length,
      inelegivel: avaliacoes.filter(avaliacao => avaliacao.classificacao === 'inelegivel').length,
      indeterminado: indeterminados.length,
    },
  }
}
