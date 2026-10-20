// Gestão — cockpit macro de unidades do briefing (funções puras sobre o snapshot).
// O ranking compara TODAS as unidades: ignora o recorte de filial ativo — quem
// aplica o recorte é o clique na unidade na UI. A variação por unidade usa o
// estado anterior (Meta 'estado_anterior') via join oportunidade_id → opp atual
// → filial; oportunidades do estado anterior sem correspondente no snapshot
// atual ficam FORA da variação — a soma das variações por unidade pode não
// fechar exatamente com o delta global de /api/mudancas (teto declarado, não
// corrigido).

import { previsaoPeriodo } from './metrics'
import { regrasRadar } from './radar'
import { carregarEstadoAnterior } from './mudancas'
import type { RegraRadar } from './types'
import type {
  EntraSemanaDTO,
  EntradaDiaDTO,
  EntradaTopDTO,
  GestaoDTO,
  ItemExigeVoceDTO,
  SinalUnidadeDTO,
  Snapshot,
  UnidadeResumoDTO,
} from './types'

const MS_DIA = 86_400_000
const JANELA_ENTRA_DIAS = 7

const LIMITACAO_RANKING =
  'Ranking compara todas as unidades e ignora o recorte de filial ativo; oportunidades do estado anterior sem correspondente no snapshot atual ficam fora da variação por unidade — a soma pode divergir do delta global.'

export function nomeCurtoUnidade(filial: string): string {
  const separador = filial.indexOf(' — ')
  return separador >= 0 ? filial.slice(separador + 3) : filial
}

export function resumoGestao(snap: Snapshot, hoje = new Date()): GestaoDTO {
  // UMA chamada do motor do radar para o cockpit inteiro (sinais por unidade + exige você).
  const regras = regrasRadar(snap, hoje)
  return {
    por_unidade: resumoPorUnidade(snap, hoje, regras),
    entra_semana: entradasDaSemana(snap, hoje),
    exige_voce: exigeVoce(snap, hoje, regras),
    limitacao_ranking: LIMITACAO_RANKING,
  }
}

export function resumoPorUnidade(snap: Snapshot, hoje = new Date(), regras = regrasRadar(snap, hoje)): UnidadeResumoDTO[] {
  // Unidade existe com ≥1 conta no snapshot (zero real de pipeline, não omissão).
  // opp.filial deriva da conta no carregamento (fallback 'Não comprovado'); se
  // aparecer sem conta, entra como linha própria honesta do ranking.
  const filiais = new Set<string>()
  for (const conta of snap.contas) filiais.add(conta.filial)
  for (const o of snap.oportunidades) filiais.add(o.filial)

  const limite = new Date(hoje.getTime() + JANELA_ENTRA_DIAS * MS_DIA)
  const porFilial = new Map<string, { pipeline_qtd: number; pipeline_valor: number; entra_7d_qtd: number; entra_7d_valor: number }>()
  for (const filial of filiais) porFilial.set(filial, { pipeline_qtd: 0, pipeline_valor: 0, entra_7d_qtd: 0, entra_7d_valor: 0 })
  for (const o of snap.oportunidades) {
    const alvo = porFilial.get(o.filial)
    if (!alvo) continue
    if (o.situacao !== 'Aberta') continue // mesmo critério de pipeline (metrics.ts:13)
    alvo.pipeline_qtd += 1
    alvo.pipeline_valor += o.valor_previsto
    if (o.previsao_atual) {
      // mesmo critério de previsaoPeriodo (metrics.ts:21): [hoje, hoje+7d]
      const prev = new Date(o.previsao_atual)
      if (prev >= hoje && prev <= limite) {
        alvo.entra_7d_qtd += 1
        alvo.entra_7d_valor += o.valor_previsto
      }
    }
  }

  const sinais = sinaisPorUnidade(snap, hoje, regras)
  const anterior = carregarEstadoAnterior(snap)
  // ponytail: o estado anterior não tem filial — a atribuição à unidade é o join
  // oportunidade_id → opp atual → o.filial. Opps do estado anterior sem
  // correspondente no snapshot atual ficam fora (teto declarado no cabeçalho).
  // Sem estado anterior: null em todas — a UI omite a coluna (zero real ≠ indisponível).
  const anteriorPorId = anterior ? new Map(anterior.oportunidades.map((e) => [e.oportunidade_id, e])) : null
  const pipelineAnteriorPorFilial = new Map<string, number>()
  if (anteriorPorId) {
    for (const o of snap.oportunidades) {
      const ant = anteriorPorId.get(o.oportunidade_id)
      if (!ant || ant.situacao !== 'Aberta') continue
      pipelineAnteriorPorFilial.set(o.filial, (pipelineAnteriorPorFilial.get(o.filial) ?? 0) + ant.valor_previsto)
    }
  }

  return [...porFilial.entries()]
    .map(([filial, v]) => ({
      filial,
      pipeline_qtd: v.pipeline_qtd,
      pipeline_valor: v.pipeline_valor,
      entra_7d_qtd: v.entra_7d_qtd,
      entra_7d_valor: v.entra_7d_valor,
      variacao_pipeline: anteriorPorId ? v.pipeline_valor - (pipelineAnteriorPorFilial.get(filial) ?? 0) : null,
      sinais: sinais.get(filial) ?? [],
    }))
    .sort((a, b) => b.pipeline_valor - a.pipeline_valor || a.filial.localeCompare(b.filial, 'pt-BR'))
}

// UMA chamada de regrasRadar alimenta todas as unidades (sem sub-snapshots).
// ponytail: a severidade do dot é a BASE da regra — a escalada (ex.: R2 > 45 dias)
// existe só no motor e não é exposta; mesmo teto já aceito na trilha (agora.tsx).
// Valores de sinais NÃO somam entre regras (podem se sobrepor); a UI conta, não soma.
function sinaisPorUnidade(snap: Snapshot, hoje: Date, regras: RegraRadar[]): Map<string, SinalUnidadeDTO[]> {
  const filialPorId = new Map(snap.oportunidades.map((o) => [o.oportunidade_id, o.filial]))
  const acumulo = new Map<string, Map<string, SinalUnidadeDTO>>()
  for (const regra of regras) {
    if (regra.quantidade === 0) continue
    for (const opp of regra.oportunidades) {
      const filial = filialPorId.get(opp.oportunidade_id)
      if (!filial) continue
      const porCodigo = acumulo.get(filial) ?? new Map<string, SinalUnidadeDTO>()
      const atual = porCodigo.get(regra.codigo)
      if (atual) {
        atual.quantidade += 1
        atual.valor_exposto += opp.valor_previsto
      } else {
        porCodigo.set(regra.codigo, {
          codigo: regra.codigo,
          severidade: regra.severidade,
          quantidade: 1,
          valor_exposto: opp.valor_previsto,
        })
      }
      acumulo.set(filial, porCodigo)
    }
  }
  const resultado = new Map<string, SinalUnidadeDTO[]>()
  for (const [filial, porCodigo] of acumulo) resultado.set(filial, [...porCodigo.values()])
  return resultado
}

export function entradasDaSemana(snap: Snapshot, hoje = new Date()): EntraSemanaDTO {
  const total = previsaoPeriodo(snap, hoje, JANELA_ENTRA_DIAS)
  const limite = new Date(hoje.getTime() + JANELA_ENTRA_DIAS * MS_DIA)
  // mesmo critério de previsaoPeriodo (metrics.ts:21) — a função devolve só
  // totais, então o filtro é repetido aqui para montar por_dia e top.
  const alvo = snap.oportunidades.filter((o) => {
    if (o.situacao !== 'Aberta' || !o.previsao_atual) return false
    const prev = new Date(o.previsao_atual)
    return prev >= hoje && prev <= limite
  })

  const por_dia: EntradaDiaDTO[] = []
  for (let i = 0; i < JANELA_ENTRA_DIAS; i++) {
    por_dia.push({ data: new Date(hoje.getTime() + i * MS_DIA).toISOString(), quantidade: 0, valor: 0 })
  }
  for (const o of alvo) {
    // ponytail: opp exatamente no limite (hoje+7d) cai no último dia — conserva a soma com o total.
    const indice = Math.min(JANELA_ENTRA_DIAS - 1, Math.max(0, Math.floor((new Date(o.previsao_atual!).getTime() - hoje.getTime()) / MS_DIA)))
    por_dia[indice].quantidade += 1
    por_dia[indice].valor += o.valor_previsto
  }

  const top: EntradaTopDTO[] = alvo
    .map((o) => ({
      oportunidade_id: o.oportunidade_id,
      nome: o.nome,
      conta_fantasia: o.conta_fantasia,
      filial: o.filial,
      valor_previsto: o.valor_previsto,
      previsao_atual: o.previsao_atual!,
    }))
    .sort((a, b) => b.valor_previsto - a.valor_previsto || a.oportunidade_id - b.oportunidade_id)
    .slice(0, 5)

  return {
    janela_dias: 7,
    hoje: hoje.toISOString(),
    total_qtd: total.quantidade,
    total_valor: total.valor,
    por_dia,
    top,
  }
}

export function exigeVoce(snap: Snapshot, hoje = new Date(), regras = regrasRadar(snap, hoje)): ItemExigeVoceDTO[] {
  const filialPorId = new Map(snap.oportunidades.map((o) => [o.oportunidade_id, o.filial]))
  const itens = new Map<string, ItemExigeVoceDTO>()
  for (const regra of regras) {
    for (const opp of regra.oportunidades) {
      const filial = filialPorId.get(opp.oportunidade_id)
      if (!filial) continue
      const chave = `${filial}\u0000${regra.codigo}`
      const atual = itens.get(chave)
      if (atual) {
        atual.quantidade += 1
        atual.valor_exposto += opp.valor_previsto
        atual.oportunidades.push(opp)
      } else {
        itens.set(chave, {
          filial,
          codigo: regra.codigo,
          severidade: regra.severidade,
          quantidade: 1,
          valor_exposto: opp.valor_previsto,
          decisao_pendente: regra.decisao_pendente,
          // mesmos objetos ReferenciaOportunidade da regra, já ordenados por valor (radar.ts:197)
          oportunidades: [opp],
        })
      }
    }
  }
  return [...itens.values()].sort(
    (a, b) => b.valor_exposto - a.valor_exposto || a.filial.localeCompare(b.filial, 'pt-BR') || a.codigo.localeCompare(b.codigo),
  )
}
