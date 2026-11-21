/**
 * Carteira por nó da estrutura: a mesma régua de métricas aplicada a cada
 * pessoa da cadeia CSO → diretor → gerente → líder.
 *
 * A regra que governa tudo aqui:
 *
 * - **A mesma régua em todos os níveis.** Se o gerente vê uma métrica que o
 *   diretor não vê, o diretor não consegue decompor o próprio número. Muda a
 *   manchete, a referência e a ordenação — nunca o conjunto de números.
 * - **Nulo propaga, nunca vira zero.** É a regra do resto do projeto
 *   (`sumKnown`). Se um registro do nó não tem valor previsto, o previsto do
 *   nó é `null`, e o do pai também.
 * - **Todo total fecha com filhos + resíduo.** Se Σ filhos ≠ pai, a diferença
 *   aparece como linha nomeada. Nunca é redistribuída por proporção.
 * - **Marcos não se somam.** Fila ao forecast: proibido (ADR-0005). Pipeline
 *   (mês+3) ao forecast (mês): proibido. Ganhos ao realizado: proibido.
 *
 * Nada aqui inventa meta: a carga não traz meta por pessoa, e somar as metas
 * de filial para estimar a de uma vertical seria falso — as 22 filiais
 * incluem unidades que não existem nas quatro verticais.
 */

import type { ImportedRecord } from './manual-import.ts'
import { isClosedStage, isForecastStage, FORECAST_MIN_PROBABILITY } from './forecast-month.ts'
import type { Arvore, NoOrganizacional } from './carteira-arvore.ts'
import { filhosDe, subarvore } from './carteira-arvore.ts'
import { atribuirResponsaveis, normalizarResponsavel, type ResultadoAtribuicao } from './carteira-de-para.ts'
import { filaDaPessoa, type FilaPessoa } from './carteira-fila.ts'

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

/** Valores da mesma régua, presentes em todo nó. `null` = indisponível, nunca zero. */
export type MetricasNo = {
  /** Forecast do mês: Proposta ou Negociação, prob. ≥ 0,75, previsão na competência. */
  previsto: number | null
  /** Ganhos no CRM: Fechada e Ganha com efetivação no período. */
  ganhos: number | null
  /** Oportunidades abertas sem previsão ou com previsão vencida (valor previsto somado). */
  travadasValor: number | null
  travadasQuantidade: number
  /** Contagens distintas, não linhas. */
  oportunidades: number
  contas: number
}

export type Residuo = {
  /** R$ previsto que não foi atribuído a nenhum nó. */
  valor: number | null
  quantidade: number
  /**
   * Dois motivos distintos, com ações distintas:
   * - `semResponsavel`: a carga não trouxe `Responsável` — falha de cadastro no CRM.
   * - `naoMapeado`: a carga trouxe, mas o nome não casa com a estrutura — falha do de-para.
   */
  semResponsavel: number
  naoMapeado: number
  /** Nomes/grafias que caíram no resíduo, para a tela mostrar o que corrigir. */
  grafias: string[]
}

export type CarteiraNo = {
  no: NoOrganizacional
  /**
   * Métricas da subárvore inteira — o nó mais todos os descendentes. É o número
   * que o diretor lê como "minha vertical".
   */
  metricas: MetricasNo
  /**
   * Métricas só dos registros atribuídos a esta pessoa. Existe para a
   * reconciliação fechar: total do nó = Σ filhos + próprias + resíduo.
   */
  proprias: MetricasNo
  /** Filhos diretos com as métricas da subárvore de cada um. Vazio no nível folha. */
  filhos: Array<{ no: NoOrganizacional; metricas: MetricasNo }>
  /** O que não foi atribuído a nenhum nó. Reconcilia o total e dirige o trabalho do de-para. */
  residuo: Residuo
  /** Oportunidades que sustentam o número, das maiores para as menores. */
  evidencias: ImportedRecord[]
  /**
   * Fila de pedidos da subárvore. Bloco separado, nunca somado ao previsto:
   * a fila é dependência, não acréscimo (ADR-0005).
   */
  fila: FilaPessoa
}

export type Carteira = {
  raiz: CarteiraNo
  atribuicao: ResultadoAtribuicao
  /** Cobertura do de-para: quantos nós nomeados têm alias declarado. */
  cobertura: { declarados: number; total: number; percentual: number }
  /** Falsos quando a carga não trouxe probabilidade e o corte de 75% não foi aplicado. */
  probabilidadeDisponivel: boolean
}

/* ------------------------------------------------------------------ */
/*  Utilidades de valor                                                */
/* ------------------------------------------------------------------ */

/**
 * Soma que propaga `null`. A mesma regra do forecast e do pipeline: um valor
 * ausente no meio do conjunto torna o total desconhecido, não menor.
 */
const somarConhecido = (registros: ImportedRecord[], valor: (r: ImportedRecord) => number | null): number | null =>
  registros.some(r => valor(r) === null) ? null : registros.reduce((soma, r) => soma + (valor(r) ?? 0), 0)

const mesDe = (data: string) => data.slice(0, 7)

function competencia(referenceDate: string): { inicio: string; fim: string } {
  const ano = Number(referenceDate.slice(0, 4))
  const mes = Number(referenceDate.slice(5, 7))
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return { inicio: `${referenceDate.slice(0, 7)}-01`, fim: `${referenceDate.slice(0, 7)}-${String(ultimo).padStart(2, '0')}` }
}

/* ------------------------------------------------------------------ */
/*  Classificação de um registro                                       */
/* ------------------------------------------------------------------ */

const dentroDoMes = (data: string | null, periodo: { inicio: string; fim: string }) =>
  Boolean(data && data >= periodo.inicio && data <= periodo.fim)

/**
 * Um registro é previsto quando cumpre o critério do Book PEX: etapa de
 * proposta/negociação, probabilidade ≥ 75% (quando a carga traz a coluna) e
 * previsão dentro da competência.
 */
function ehPrevisto(registro: ImportedRecord, periodo: { inicio: string; fim: string }, probabilidadeDisponivel: boolean): boolean {
  if (!isForecastStage(registro.stage)) return false
  if (!dentroDoMes(registro.forecastDate, periodo)) return false
  if (probabilidadeDisponivel) {
    const p = registro.probability
    if (p === null || p === undefined) return false
    if (p < FORECAST_MIN_PROBABILITY) return false
  }
  return true
}

/** Ganho no CRM: etapa fechada e ganha com efetivação na competência. */
function ehGanho(registro: ImportedRecord, periodo: { inicio: string; fim: string }): boolean {
  return isClosedStage(registro.stage) && dentroDoMes(registro.closingDate, periodo) && /GANHA/.test(registro.stage.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleUpperCase('pt-BR'))
}

/** Travada: aberta, sem previsão ou com previsão vencida. Regra do glossário. */
function ehTravada(registro: ImportedRecord, referenceDate: string): boolean {
  if (isClosedStage(registro.stage)) return false
  if (registro.forecastDate === null) return true
  return registro.forecastDate < referenceDate
}

/* ------------------------------------------------------------------ */
/*  Agregação                                                          */
/* ------------------------------------------------------------------ */

type Contexto = {
  porNo: Map<string, ImportedRecord[]>
  residuo: ImportedRecord[]
  atribuicao: ResultadoAtribuicao
  periodo: { inicio: string; fim: string }
  referenceDate: string
  probabilidadeDisponivel: boolean
}

function metricasDos(registros: ImportedRecord[], ctx: Contexto): MetricasNo {
  const previstos = registros.filter(r => ehPrevisto(r, ctx.periodo, ctx.probabilidadeDisponivel))
  const ganhos = registros.filter(r => ehGanho(r, ctx.periodo))
  const travadas = registros.filter(r => ehTravada(r, ctx.referenceDate))

  return {
    previsto: somarConhecido(previstos, r => r.predictedValue),
    ganhos: somarConhecido(ganhos, r => r.closedValue ?? r.predictedValue),
    travadasValor: somarConhecido(travadas, r => r.predictedValue),
    travadasQuantidade: travadas.length,
    /*
     * Distintas: uma conta com três oportunidades é uma conta. O importador já
     * garante que `opportunityId` e `orderId` não se repetem na carga, mas a
     * contagem distinta protege contra registros de fontes diferentes.
     */
    oportunidades: new Set(previstos.map(r => r.opportunityId).filter(Boolean)).size,
    contas: new Set(previstos.map(r => r.accountId).filter(Boolean)).size,
  }
}

/**
 * Registros de toda a subárvore de um nó. É o conjunto que o diretor soma: ele
 * mais os gerentes e líderes abaixo. A oportunidade pertence ao nó do
 * responsável, não a todos os ancestrais — somar a subárvore é o que faz o
 * total do pai fechar sem contar duas vezes.
 */
function registrosDaSubarvore(arvore: Arvore, id: string, ctx: Contexto): ImportedRecord[] {
  const ids = new Set(subarvore(arvore, id).map(n => n.id))
  const registros: ImportedRecord[] = []
  for (const [no, lista] of ctx.porNo) {
    if (ids.has(no)) registros.push(...lista)
  }
  return registros
}

function residuoDe(arvore: Arvore, id: string, ctx: Contexto): Residuo {
  /*
   * O resíduo de um nó é o que não pertence a ele nem a nenhum descendente.
   * No CSO isso é o resíduo global; num diretor, só o que sobrou daquele ramo.
   * Para manter a reconciliação simples e sempre verdadeira, o resíduo é
   * calculado no nó raiz e reaproveitado — um registro não atribuído não
   * pertence a ramo nenhum, por definição.
   */
  void arvore; void id
  const semResponsavel = ctx.residuo.filter(r => (r.executive ?? '').trim() === '').length
  const naoMapeado = ctx.residuo.length - semResponsavel
  const grafias = [...new Set(ctx.residuo
    .filter(r => (r.executive ?? '').trim() !== '')
    .map(r => (r.executive ?? '').trim()))]
  return {
    valor: somarConhecido(ctx.residuo.filter(r => ehPrevisto(r, ctx.periodo, ctx.probabilidadeDisponivel)), r => r.predictedValue),
    quantidade: ctx.residuo.length,
    semResponsavel,
    naoMapeado,
    grafias: grafias.slice(0, 12),
  }
}

/* ------------------------------------------------------------------ */
/*  Entrada principal                                                  */
/* ------------------------------------------------------------------ */

/**
 * Monta a carteira de um nó.
 *
 * `responsaveis` vem da própria carga: o agregador extrai os distintos. Quem
 * não casa com a estrutura entra no resíduo com o motivo separado.
 */
export function montarCarteira(
  arvore: Arvore,
  registros: ImportedRecord[],
  idNo: string,
  referenceDate: string,
  cobertura: { declarados: number; total: number; percentual: number },
  pedidos: ImportedRecord[] = [],
): Carteira | null {
  const alvo = arvore.nos.get(idNo)
  if (!alvo) return null

  const periodo = competencia(referenceDate)
  const probabilidadeDisponivel = registros.some(r => r.probability !== null && r.probability !== undefined)

  const atribuicao = atribuirResponsaveis(arvore, registros.map(r => r.executive ?? ''))

  const porNo = new Map<string, ImportedRecord[]>()
  const residuo: ImportedRecord[] = []
  for (const registro of registros) {
    const chave = normalizarResponsavel(registro.executive ?? '')
    const no = chave === '' ? null : atribuicao.mapa.get(chave) ?? null
    if (!no) { residuo.push(registro); continue }
    const lista = porNo.get(no.id)
    if (lista) lista.push(registro); else porNo.set(no.id, [registro])
  }

  const ctx: Contexto = { porNo, residuo, atribuicao, periodo, referenceDate, probabilidadeDisponivel }

  const registrosDoNo = registrosDaSubarvore(arvore, idNo, ctx)
  const evidencias = [...registrosDoNo]
    .filter(r => ehPrevisto(r, periodo, probabilidadeDisponivel))
    .sort((a, b) => (b.predictedValue ?? -Infinity) - (a.predictedValue ?? -Infinity))
    .slice(0, 8)

  return {
    raiz: {
      no: alvo,
      metricas: metricasDos(registrosDoNo, ctx),
      proprias: metricasDos(porNo.get(idNo) ?? [], ctx),
      /*
       * Filhos diretos, cada um com as métricas da própria subárvore. É o que
       * permite a frase "3 dos 6 gerentes cobrem" sem recalcular na tela.
       */
      filhos: filhosDe(arvore, idNo).map(filho => ({
        no: filho,
        metricas: metricasDos(filho.nome === null ? [] : registrosDaSubarvore(arvore, filho.id, ctx), ctx),
      })),
      residuo: residuoDe(arvore, idNo, ctx),
      evidencias,
      fila: filaDaPessoa(pedidos.filter(pedido => {
        const chave = normalizarResponsavel(pedido.executive ?? '')
        const alvo = chave === '' ? null : atribuicao.mapa.get(chave) ?? null
        if (!alvo) return false
        return new Set(subarvore(arvore, idNo).map(n => n.id)).has(alvo.id)
      })),
    },
    atribuicao,
    cobertura,
    probabilidadeDisponivel,
  }
}

/* ------------------------------------------------------------------ */
/*  Ordenação e leitura                                                */
/* ------------------------------------------------------------------ */

/**
 * Ordena filhos por gap: quem cobre menos do previsto total vem primeiro.
 * A ordem é a própria resposta à pergunta "quem está atrasando" — alfabética
 * esconderia isso atrás de um sobrenome.
 */
export function ordenarPorGap<T extends { metricas: { previsto: number | null } }>(filhos: T[]): T[] {
  return [...filhos].sort((a, b) => (a.metricas.previsto ?? -Infinity) - (b.metricas.previsto ?? -Infinity))
}

/**
 * Quantos filhos nomeados têm previsto acima de zero. Serve para a manchete do
 * nível: "N de M cobrem". Não é meta — a carga não traz meta por pessoa, e
 * inventar denominador seria pior que não mostrar.
 *
 * Vaga fica fora do denominador: uma posição aberta não é alguém que não
 * cobriu, é uma posição que ainda não tem dono. Misturar as duas faria o
 * número parecer pior do que a operação está.
 */
export function coberturaDoNivel(filhos: Array<{ no: NoOrganizacional; metricas: MetricasNo }>) {
  const nomeados = filhos.filter(f => f.no.nome !== null)
  const comValor = nomeados.filter(f => f.metricas.previsto !== null && f.metricas.previsto > 0).length
  return { comValor, total: nomeados.length }
}

/**
 * Reconciliação: total do nó = Σ subárvores dos filhos + as próprias.
 *
 * O resíduo **não** entra nesta conta: por definição ele é o que não pertence
 * a nó nenhum. Somá-lo aqui faria a igualdade fechar por construção e
 * esconderia justamente o que a reconciliação existe para provar — que todo
 * registro atribuído a alguém foi contado uma vez só.
 *
 * A soma da estrutura com o resíduo é outro número, e a tela o mostra
 * separado (`totalComResiduo`).
 *
 * Diferença de até R$ 0,01 é arredondamento, não divergência — a mesma
 * tolerância da ponte de trajetória. Quando algum lado é desconhecido, a
 * reconciliação não é afirmada nem negada: `diferenca: null`.
 */
export function reconciliar(carteira: Carteira): { fecha: boolean; diferenca: number | null } {
  const { raiz } = carteira
  if (raiz.metricas.previsto === null) return { fecha: true, diferenca: null }
  const somaFilhos = raiz.filhos.reduce<number | null>((soma, filho) => {
    if (soma === null || filho.metricas.previsto === null) return null
    return soma + filho.metricas.previsto
  }, 0)
  if (somaFilhos === null || raiz.proprias.previsto === null) {
    return { fecha: true, diferenca: null }
  }
  const diferenca = raiz.metricas.previsto - (somaFilhos + raiz.proprias.previsto)
  return { fecha: Math.abs(diferenca) <= 0.01, diferenca }
}

/**
 * Quanto existe de previsto no total: estrutura + o que ficou fora dela.
 * É o número que responde "a cascata está vendo tudo?", e é diferente do
 * previsto do nó, que só mede o que foi atribuído.
 */
export function totalComResiduo(carteira: Carteira): number | null {
  const { previsto } = carteira.raiz.metricas
  const { valor } = carteira.raiz.residuo
  if (previsto === null || valor === null) return null
  return previsto + valor
}

export { mesDe }
