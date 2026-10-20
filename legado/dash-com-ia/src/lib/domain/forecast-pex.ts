import { resolverEtapaOportunidade } from './crm-taxonomy'
import type { OportunidadeDTO, Snapshot } from './types'

export interface CompetenciaPex {
  ano: number
  mes: number
}

export interface TotalizadorPex {
  quantidade: number
  valor: number
  quantidade_sem_valor: number
}

export interface ForecastPexDTO {
  competencia: CompetenciaPex
  fuso_horario: string
  previsto_pex: TotalizadorPex
  fechadas_ganhas_no_mes: TotalizadorPex
  total_pex_mes: TotalizadorPex
  regra: string
  fonte: 'pdf_crm_integrado_mg'
}

export const FUSO_HORARIO_PEX_FIXTURE = 'America/Sao_Paulo'

const ETAPAS_ELEGIVEIS: Record<'privado' | 'publico', ReadonlySet<string>> = {
  privado: new Set(['Proposta', 'Negociação']),
  publico: new Set(['Proposta', 'Negociação/Habilitação/Certame']),
}

function validarCompetencia(competencia: CompetenciaPex): void {
  if (!Number.isInteger(competencia.ano) || competencia.ano < 1 || !Number.isInteger(competencia.mes) || competencia.mes < 1 || competencia.mes > 12) {
    throw new RangeError('Competência PEX inválida: informe ano inteiro e mês entre 1 e 12')
  }
}

function criarFormatadorCompetencia(fusoHorario: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: fusoHorario,
    year: 'numeric',
    month: 'numeric',
  })
}

function dataNaCompetencia(
  valor: string | null,
  competencia: CompetenciaPex,
  formatador: Intl.DateTimeFormat,
): boolean {
  if (!valor) return false
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (somenteData) {
    const dataValida = new Date(`${valor}T12:00:00.000Z`)
    if (!Number.isFinite(dataValida.getTime()) || dataValida.toISOString().slice(0, 10) !== valor) return false
    return Number(somenteData[1]) === competencia.ano && Number(somenteData[2]) === competencia.mes
  }
  const data = new Date(valor)
  if (!Number.isFinite(data.getTime())) return false
  const partes = formatador.formatToParts(data)
  const ano = Number(partes.find((parte) => parte.type === 'year')?.value)
  const mes = Number(partes.find((parte) => parte.type === 'month')?.value)
  return ano === competencia.ano && mes === competencia.mes
}

export function estaNaCompetencia(
  valor: string | null,
  competencia: CompetenciaPex,
  fusoHorario: string,
): boolean {
  validarCompetencia(competencia)
  return dataNaCompetencia(valor, competencia, criarFormatadorCompetencia(fusoHorario))
}

function adicionarValor(total: TotalizadorPex, valor: number | null): TotalizadorPex {
  if (valor === null || !Number.isFinite(valor)) {
    return { quantidade: total.quantidade + 1, valor: total.valor, quantidade_sem_valor: total.quantidade_sem_valor + 1 }
  }
  return { quantidade: total.quantidade + 1, valor: total.valor + valor, quantidade_sem_valor: total.quantidade_sem_valor }
}

function somarTotais(a: TotalizadorPex, b: TotalizadorPex): TotalizadorPex {
  return {
    quantidade: a.quantidade + b.quantidade,
    valor: a.valor + b.valor,
    quantidade_sem_valor: a.quantidade_sem_valor + b.quantidade_sem_valor,
  }
}

export function competenciaPexDaData(data: Date, fusoHorario: string): CompetenciaPex {
  if (!Number.isFinite(data.getTime())) throw new RangeError('Data inválida para determinar a competência PEX')
  const partes = criarFormatadorCompetencia(fusoHorario).formatToParts(data)
  const ano = Number(partes.find((parte) => parte.type === 'year')?.value)
  const mes = Number(partes.find((parte) => parte.type === 'month')?.value)
  return { ano, mes }
}

function oportunidadeElegivelPex(
  oportunidade: OportunidadeDTO,
  competencia: CompetenciaPex,
  formatador: Intl.DateTimeFormat,
): boolean {
  if (oportunidade.situacao !== 'Aberta' || oportunidade.probabilidade < 75) return false
  const etapa = resolverEtapaOportunidade(oportunidade.tipo_oportunidade, oportunidade.etapa)
  const etapasDoFunil = etapa.tipo_funil === 'privado' || etapa.tipo_funil === 'publico'
    ? ETAPAS_ELEGIVEIS[etapa.tipo_funil]
    : null
  return Boolean(
    etapasDoFunil?.has(etapa.etapa_bruta) &&
    etapa.estado_mapeamento === 'observado' &&
    dataNaCompetencia(oportunidade.previsao_atual, competencia, formatador),
  )
}

export function oportunidadesPrevistasPex(
  snapshot: Snapshot,
  competencia: CompetenciaPex,
  fusoHorario: string,
): OportunidadeDTO[] {
  validarCompetencia(competencia)
  const formatador = criarFormatadorCompetencia(fusoHorario)
  return snapshot.oportunidades.filter((oportunidade) => oportunidadeElegivelPex(oportunidade, competencia, formatador))
}

export function calcularForecastPex(
  snapshot: Snapshot,
  competencia: CompetenciaPex,
  fusoHorario: string,
): ForecastPexDTO {
  validarCompetencia(competencia)
  const formatador = criarFormatadorCompetencia(fusoHorario)
  let previsto: TotalizadorPex = { quantidade: 0, valor: 0, quantidade_sem_valor: 0 }
  let fechadasGanhas: TotalizadorPex = { quantidade: 0, valor: 0, quantidade_sem_valor: 0 }

  for (const oportunidade of oportunidadesPrevistasPex(snapshot, competencia, fusoHorario)) {
    previsto = adicionarValor(previsto, oportunidade.valor_previsto)
  }

  for (const oportunidade of snapshot.oportunidades) {
    if (oportunidade.situacao === 'Ganha' && dataNaCompetencia(oportunidade.fechamento_efetivo, competencia, formatador)) {
      fechadasGanhas = adicionarValor(fechadasGanhas, oportunidade.valor_fechado)
    }
  }

  return {
    competencia: { ...competencia },
    fuso_horario: fusoHorario,
    previsto_pex: previsto,
    fechadas_ganhas_no_mes: fechadasGanhas,
    total_pex_mes: somarTotais(previsto, fechadasGanhas),
    regra: 'Forecast do mês: Proposta ou Negociação no funil privado, ou Proposta ou Negociação/Habilitação/Certame no funil público, com probabilidade igual ou superior a 75% e previsão dentro da competência. Fechadas e Ganhas no mês compõem o realizado PEX. O realizado PEX não substitui Pedido conferido como receita oficial.',
    fonte: 'pdf_crm_integrado_mg',
  }
}
