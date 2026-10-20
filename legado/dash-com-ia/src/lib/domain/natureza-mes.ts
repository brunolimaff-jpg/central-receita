import { resolverNaturezaVenda } from './crm-taxonomy'
import { estaNaCompetencia } from './forecast-pex'
import type { CompetenciaPex, TotalizadorPex } from './forecast-pex'
import type { NaturezaComercialMes, NaturezaComercialMesDTO, Snapshot } from './types'

const NATUREZAS_DO_BRIEFING: ReadonlyArray<{ natureza: NaturezaComercialMes; rotulo: NaturezaComercialMesDTO['rotulo'] }> = [
  { natureza: 'New Name / Novo Cliente', rotulo: 'New Name' },
  { natureza: 'Cross / Up Sell', rotulo: 'Cross / Up Sell' },
]

function totalizadorVazio(): TotalizadorPex {
  return { quantidade: 0, valor: 0, quantidade_sem_valor: 0 }
}

function somarValor(total: TotalizadorPex, valor: number | null): TotalizadorPex {
  if (valor === null || !Number.isFinite(valor)) {
    return { quantidade: total.quantidade + 1, valor: total.valor, quantidade_sem_valor: total.quantidade_sem_valor + 1 }
  }
  return { quantidade: total.quantidade + 1, valor: total.valor + valor, quantidade_sem_valor: total.quantidade_sem_valor }
}

export function resumirNaturezasDoMes(
  snapshot: Snapshot,
  competencia: CompetenciaPex,
  fusoHorario: string,
): NaturezaComercialMesDTO[] {
  return NATUREZAS_DO_BRIEFING.map(({ natureza, rotulo }) => {
    const taxonomia = resolverNaturezaVenda(natureza)
    const oportunidades = snapshot.oportunidades.filter((oportunidade) => {
      const taxonomiaOportunidade = oportunidade.natureza_venda_taxonomia
      return Boolean(
        taxonomiaOportunidade
        && taxonomiaOportunidade.rotulo === natureza
        && (taxonomiaOportunidade.estado_mapeamento === 'observado' || taxonomiaOportunidade.estado_mapeamento === 'autorizado_anterior'),
      )
    })

    let ganhosMes = totalizadorVazio()
    let abertasPrevistasMes = totalizadorVazio()
    let entradasCriadas = 0
    let perdidasMes = 0

    for (const oportunidade of oportunidades) {
      if (estaNaCompetencia(oportunidade.criada_em, competencia, fusoHorario)) entradasCriadas++

      if (oportunidade.situacao === 'Ganha' && estaNaCompetencia(oportunidade.fechamento_efetivo, competencia, fusoHorario)) {
        ganhosMes = somarValor(ganhosMes, oportunidade.valor_fechado)
      }
      if (oportunidade.situacao === 'Perdida' && estaNaCompetencia(oportunidade.fechamento_efetivo, competencia, fusoHorario)) {
        perdidasMes++
      }
      if (oportunidade.situacao === 'Aberta' && estaNaCompetencia(oportunidade.previsao_atual, competencia, fusoHorario)) {
        abertasPrevistasMes = somarValor(abertasPrevistasMes, oportunidade.valor_previsto)
      }
    }

    return {
      natureza,
      rotulo,
      estado_mapeamento: taxonomia.estado_mapeamento as NaturezaComercialMesDTO['estado_mapeamento'],
      fontes: taxonomia.fontes,
      entradas_criadas: entradasCriadas,
      ganhos_mes: ganhosMes,
      perdidas_mes: perdidasMes,
      abertas_previstas_mes: abertasPrevistasMes,
    }
  })
}
