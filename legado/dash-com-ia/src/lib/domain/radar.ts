// Radar Comercial — somente sinais determinísticos sobre o que está registrado.
// Princípio: "ausência de registro ≠ ausência de trabalho". Os sinais descrevem
// o que o CRM registra, nunca o que o executivo fez ou deixou de fazer.

import { fmtBRL, fmtDiasAtras } from './format'
import type { OportunidadeDTO, ReferenciaOportunidade, RegraRadar, SinalOportunidade, Snapshot } from './types'

export const LIMITE_SEM_ACAO_ATENCAO = 21 // dias
export const LIMITE_SEM_ACAO_CRITICA = 45 // dias
export const LIMITE_SLIP_DIAS = 60 // deslocamento de previsão
export const LIMITE_GANHA_SEM_PEDIDO_DIAS = 30
export const LIMITE_PEDIDO_NAO_CONFERIDO_DIAS = 15
export const PROB_INCONSISTENTE = 70

function etapaAvancadaObservada(o: OportunidadeDTO): boolean {
  const etapa = o.etapa_taxonomia
  if (etapa.estado_mapeamento !== 'observado') return false
  return etapa.tipo_funil === 'privado'
    ? etapa.rotulo === 'Proposta' || etapa.rotulo === 'Negociação'
    : etapa.tipo_funil === 'publico' && (etapa.rotulo === 'Proposta' || etapa.rotulo === 'Negociação/Habilitação/Certame')
}

// ---------- Índices derivados (mesma leitura para todos os consumidores) ----------
export interface IndiceSnapshot {
  hoje: Date
  ultimaAcao: Map<number, string> // oportunidade_id → data da última ação registrada
  compromissosFuturos: Set<number> // oportunidade_id com compromisso Agendado no futuro
  pedidos: Map<number, { numero: string; data: string; conferido: boolean; valor: number }>
  contaDe: Map<number, { fantasia: string }>
}

export function construirIndice(snap: Snapshot, hoje = new Date()): IndiceSnapshot {
  const ultimaAcao = new Map<number, string>()
  for (const a of snap.acoes) {
    const atual = ultimaAcao.get(a.oportunidade_id)
    if (!atual || a.data_acao > atual) ultimaAcao.set(a.oportunidade_id, a.data_acao)
  }
  const compromissosFuturos = new Set<number>()
  for (const c of snap.compromissos) {
    if (c.situacao === 'Agendado' && new Date(c.data_hora) > hoje) compromissosFuturos.add(c.oportunidade_id)
  }
  const pedidos = new Map<number, { numero: string; data: string; conferido: boolean; valor: number }>()
  for (const p of snap.pedidos) {
    pedidos.set(p.oportunidade_id, { numero: p.numero, data: p.data_pedido, conferido: p.conferido, valor: p.valor })
  }
  const contaDe = new Map<number, { fantasia: string }>()
  for (const c of snap.contas) contaDe.set(c.conta_id, { fantasia: c.fantasia })
  return { hoje, ultimaAcao, compromissosFuturos, pedidos, contaDe }
}

export function diasDesdeUltimaAcao(idx: IndiceSnapshot, oportunidade_id: number): number | null {
  const ultima = idx.ultimaAcao.get(oportunidade_id)
  if (!ultima) return null
  return Math.round((idx.hoje.getTime() - new Date(ultima).getTime()) / 86400000)
}

// ---------- Regras determinísticas ----------
export interface DefinicaoRegra {
  codigo: string
  nome: string
  severidade: 'critica' | 'atencao' | 'info'
  regra: string
  limitacao: string
  avalia: (o: OportunidadeDTO, idx: IndiceSnapshot) => { atende: boolean; contexto: string; severidade?: 'critica' | 'atencao' | 'info' } | null
}

export const REGRAS: DefinicaoRegra[] = [
  {
    codigo: 'R1',
    nome: 'Previsão vencida',
    severidade: 'critica',
    regra: 'situacao = "Aberta" e previsao_atual < hoje',
    limitacao: 'Mede a data registrada na previsão atual. Não afirma que o trabalho parou — apenas que a data prevista passou sem fechamento registrado.',
    avalia: (o, idx) => {
      if (o.situacao !== 'Aberta' || !o.previsao_atual) return null
      const dias = Math.round((idx.hoje.getTime() - new Date(o.previsao_atual).getTime()) / 86400000)
      if (dias <= 0) return null
      return { atende: true, contexto: `previsão venceu ${fmtDiasAtras(dias)}` }
    },
  },
  {
    codigo: 'R2',
    nome: 'Muitos dias sem ação registrada',
    severidade: 'atencao',
    regra: 'situacao = "Aberta" e dias desde a última ação registrada > 21 (crítica se > 45)',
    limitacao: 'Ação registrada não prova todo o trabalho realizado fora do CRM. O sinal apenas indica ausência de registro no período.',
    avalia: (o, idx) => {
      if (o.situacao !== 'Aberta') return null
      const dias = diasDesdeUltimaAcao(idx, o.oportunidade_id)
      if (dias === null || dias <= LIMITE_SEM_ACAO_ATENCAO) return null
      const semRegistro = dias > LIMITE_SEM_ACAO_CRITICA ? 'critica' : 'atencao'
      return { atende: true, contexto: `sem ação registrada ${fmtDiasAtras(dias)}`, severidade: semRegistro }
    },
  },
  {
    codigo: 'R3',
    nome: 'Previsão deslocada (slip)',
    severidade: 'atencao',
    regra: 'situacao = "Aberta" e (previsao_atual − previsao_inicial) > 60 dias',
    limitacao: 'Mede apenas o deslocamento entre datas registradas. Não avalia a causa do deslocamento.',
    avalia: (o) => {
      if (o.situacao !== 'Aberta' || !o.previsao_atual) return null
      const slip = Math.round((new Date(o.previsao_atual).getTime() - new Date(o.previsao_inicial).getTime()) / 86400000)
      if (slip <= LIMITE_SLIP_DIAS) return null
      return { atende: true, contexto: `previsão deslocada ${slip} dias da inicial` }
    },
  },
  {
    codigo: 'R4',
    nome: 'Etapa avançada sem compromisso futuro',
    severidade: 'atencao',
    regra: 'situacao = "Aberta", etapa avançada observada no funil privado ou público e nenhum compromisso Agendado no futuro',
    limitacao: 'Compromissos podem existir fora da agenda registrada. Só as etapas avançadas observadas no PDF entram; Fechamento e etapas não mapeadas ficam fora.',
    avalia: (o, idx) => {
      if (o.situacao !== 'Aberta') return null
      if (!etapaAvancadaObservada(o)) return null
      if (idx.compromissosFuturos.has(o.oportunidade_id)) return null
      return { atende: true, contexto: `em ${o.etapa_taxonomia.rotulo} sem próximo compromisso registrado` }
    },
  },
  {
    codigo: 'R5',
    nome: 'Ganha sem pedido posterior',
    severidade: 'atencao',
    regra: 'situacao = "Ganha", sem pedido vinculado e fechamento efetivo há mais de 30 dias',
    limitacao: 'Win ≠ Pedido. O pedido pode existir fora do sistema ou ter sido emitido por outro fluxo. O sinal indica ausência de registro.',
    avalia: (o, idx) => {
      if (o.situacao !== 'Ganha' || !o.fechamento_efetivo) return null
      if (idx.pedidos.has(o.oportunidade_id)) return null
      const dias = Math.round((idx.hoje.getTime() - new Date(o.fechamento_efetivo).getTime()) / 86400000)
      if (dias <= LIMITE_GANHA_SEM_PEDIDO_DIAS) return null
      return { atende: true, contexto: `ganha ${fmtDiasAtras(dias)} sem pedido registrado` }
    },
  },
  {
    codigo: 'R6',
    nome: 'Pedido não conferido',
    severidade: 'atencao',
    regra: 'pedido vinculado com conferido = falso e data do pedido há mais de 15 dias',
    limitacao: 'A conferência pode ocorrer por processo externo. O sinal apenas expõe o estado registrado.',
    avalia: (o, idx) => {
      const pedido = idx.pedidos.get(o.oportunidade_id)
      if (!pedido || pedido.conferido) return null
      const dias = Math.round((idx.hoje.getTime() - new Date(pedido.data).getTime()) / 86400000)
      if (dias <= LIMITE_PEDIDO_NAO_CONFERIDO_DIAS) return null
      return { atende: true, contexto: `pedido ${pedido.numero} sem conferência ${fmtDiasAtras(dias)}` }
    },
  },
  {
    codigo: 'R7',
    nome: 'Probabilidade inconsistente com previsão',
    severidade: 'atencao',
    regra: 'situacao = "Aberta", previsão vencida e probabilidade ≥ 70%',
    limitacao: 'Probabilidade é julgamento do vendedor; previsão é data registrada. O sinal aponta a divergência entre os dois campos.',
    avalia: (o, idx) => {
      if (o.situacao !== 'Aberta' || o.probabilidade < PROB_INCONSISTENTE || !o.previsao_atual) return null
      const dias = Math.round((idx.hoje.getTime() - new Date(o.previsao_atual).getTime()) / 86400000)
      if (dias <= 0) return null
      return { atende: true, contexto: `probabilidade ${o.probabilidade}% com previsão vencida ${fmtDiasAtras(dias)}` }
    },
  },
]

// Decisão pendente por regra — a pergunta de gestão que o sinal abre.
// O radar não decide; formula a decisão que a liderança precisa tomar.
export const DECISOES_PENDENTES: Record<string, string> = {
  R1: 'manter no mês, deslocar a previsão ou retirar da expectativa atual',
  R2: 'confirmar se há movimento em curso ou reativar o registro',
  R3: 'reforecast e validar a nova data com o cliente',
  R4: 'agendar o próximo compromisso ou decidir o seguimento',
  R5: 'verificar a emissão do pedido no ERP',
  R6: 'conferir o pedido e reconciliar com o financeiro',
  R7: 'alinhar probabilidade e previsão com o responsável',
}

// ---------- Consultas ----------
export function regrasRadar(snap: Snapshot, hoje = new Date()): RegraRadar[] {
  const idx = construirIndice(snap, hoje)
  const oppPorId = new Map(snap.oportunidades.map((o) => [o.oportunidade_id, o]))
  return REGRAS.map((r) => {
    const encontros: ReferenciaOportunidade[] = []
    for (const o of snap.oportunidades) {
      const res = r.avalia(o, idx)
      if (res?.atende) {
        encontros.push({
          oportunidade_id: o.oportunidade_id,
          nome: o.nome,
          conta_fantasia: o.conta_fantasia,
          etapa: o.etapa,
          etapa_taxonomia: o.etapa_taxonomia,
          situacao: o.situacao,
          valor_previsto: o.valor_previsto,
          contexto: res.contexto,
        })
      }
    }
    encontros.sort((a, b) => b.valor_previsto - a.valor_previsto)

    // Concentração: responsáveis distintos e etapas avançadas.
    const responsaveis = new Set<number>()
    let avancadas = 0
    for (const e of encontros) {
      const o = oppPorId.get(e.oportunidade_id)
      if (o) responsaveis.add(o.responsavel_id)
      if (o && etapaAvancadaObservada(o)) avancadas++
    }
    const pctAvancadas = encontros.length > 0 ? Math.round((avancadas / encontros.length) * 100) : 0
    const concentracao =
      encontros.length > 0
        ? `${pctAvancadas}% em etapa avançada observada no funil`
        : '—'

    return {
      codigo: r.codigo,
      nome: r.nome,
      severidade: r.severidade,
      regra: r.regra,
      limitacao: r.limitacao,
      decisao_pendente: DECISOES_PENDENTES[r.codigo] ?? 'revisar o registro',
      quantidade: encontros.length,
      valor_exposto: encontros.reduce((s, e) => s + e.valor_previsto, 0),
      responsaveis: responsaveis.size,
      concentracao_etapas: concentracao,
      oportunidades: encontros,
    }
  })
}

export function sinaisDaOportunidade(snap: Snapshot, oportunidade_id: number, hoje = new Date()): SinalOportunidade[] {
  const o = snap.oportunidades.find((x) => x.oportunidade_id === oportunidade_id)
  if (!o) return []
  const idx = construirIndice(snap, hoje)
  const sinais: SinalOportunidade[] = []
  for (const r of REGRAS) {
    const res = r.avalia(o, idx)
    if (res?.atende) {
      sinais.push({
        codigo: r.codigo,
        titulo: r.nome,
        severidade: res.severidade ?? r.severidade,
        detalhe: res.contexto,
      })
    }
  }
  return sinais
}

export function resumoAtencao(snap: Snapshot, hoje = new Date()) {
  const regras = regrasRadar(snap, hoje)
  const criticos = regras.filter((r) => r.severidade === 'critica').reduce((s, r) => s + r.quantidade, 0)
  const atencao = regras.filter((r) => r.severidade === 'atencao').reduce((s, r) => s + r.quantidade, 0)
  const vencidas = regras.find((r) => r.codigo === 'R1')
  const oportunidadesComSinal = new Set<string>()
  for (const r of regras) for (const o of r.oportunidades) oportunidadesComSinal.add(`${o.oportunidade_id}:${r.codigo}`)
  return {
    criticas: criticos,
    atencao,
    valor_em_risco: vencidas?.valor_exposto ?? 0,
    oportunidades_atencao: regras.reduce((s, r) => s + r.quantidade, 0),
    sinais_distintos: oportunidadesComSinal.size,
  }
}

// Sinais por oportunidade para a fila (map oportunidade_id → códigos)
export function sinaisPorOportunidade(snap: Snapshot, hoje = new Date()): Map<number, string[]> {
  const idx = construirIndice(snap, hoje)
  const mapa = new Map<number, string[]>()
  for (const o of snap.oportunidades) {
    const codigos: string[] = []
    for (const r of REGRAS) {
      const res = r.avalia(o, idx)
      if (res?.atende) {
        const escalada = res.severidade === 'critica' && r.severidade !== 'critica'
        codigos.push(escalada ? `${r.codigo}!` : r.codigo)
      }
    }
    if (codigos.length) mapa.set(o.oportunidade_id, codigos)
  }
  return mapa
}

export function descreverValor(detalhe: RegraRadar): string {
  return `${detalhe.quantidade} oportunidades · ${fmtBRL(detalhe.valor_exposto)}`
}
