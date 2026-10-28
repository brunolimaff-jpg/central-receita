/**
 * Territórios — o módulo de navegação da liderança comercial, em três níveis.
 *
 * CSO → território → filial. O nível não é um parâmetro: é derivado do que foi
 * aberto. `territorio` ausente é o consolidado; `territorio` presente sem
 * filial é o território; os dois juntos são a filial. Guardar "nivel" à parte
 * permitiria o estado impossível "filial sem território".
 *
 * **O que este módulo é e o que não é.** Ele navega e compara. Análise de
 * cenário, simulação e calibração pertencem ao Forecast; saneamento de
 * pendências, a Oportunidades; aqui ficam a comparação entre territórios e o
 * plano de intervenção do gestor. Duplicar a análise aqui daria dois lugares
 * com a mesma régua divergindo com o tempo.
 *
 * **Escopo é só de interface.** O recorte por território acontece na tela. Não
 * há identidade no Worker, então qualquer pessoa com a URL vê qualquer
 * território. A tela diz isso; fingir controle de acesso seria pior que não ter.
 */

import {
  forecastFluxo,
  resultadoFilial,
  resultadoTotal,
  type Fluxo,
  type RegionalFilial,
  type RegionalSnapshot,
} from './regional-model.ts'

/* ------------------------------------------------------------------ */
/*  Territórios                                                        */
/* ------------------------------------------------------------------ */

export type Nivel = 'cso' | 'territorio' | 'filial'

/**
 * Um território é um **recorte declarado de filiais**, não uma divisão
 * corporativa. O organograma de 2027 desenha cinco territórios por UF; a carga
 * desta demonstração traz filiais por praça. Chamar o recorte fictício de
 * território real seria afirmar uma estrutura que não foi verificada.
 *
 * Por isso cada território carrega `procedencia`: de onde vem o recorte e o que
 * ele não prova.
 */
export type Territorio = {
  id: string
  nome: string
  /** Siglas de filial que compõem o território nesta demonstração. */
  filiais: string[]
  /** Uma frase sobre o que distingue este território. Sem invenção de região. */
  destaque: string
  procedencia: string
  /**
   * `true` só no Centro-Oeste: é o primeiro território com desenho próprio,
   * migrado do painel do Matheus. Os outros usam o desenho padrão até haver
   * necessidade demonstrada — a issue #23 proíbe inventar customização.
   */
  desenhoProprio: boolean
}

/**
 * O recorte desta demonstração. Nenhum destes nomes afirma divisão oficial: são
 * agrupamentos de filiais do cenário fictício, e a tela diz isso em cada nível.
 */
export const TERRITORIOS: Territorio[] = [
  {
    id: 'centro-oeste',
    nome: 'Centro-Oeste',
    filiais: ['DF', 'GO', 'MS', 'MT'],
    destaque: 'Território com desenho próprio: mapa de calor por filial e rubrica como leitura principal.',
    procedencia: 'Recorte fictício de quatro filiais da demonstração. Não é divisão corporativa verificada.',
    desenhoProprio: true,
  },
  {
    id: 'norte',
    nome: 'Norte',
    filiais: ['RO', 'TO'],
    destaque: 'Duas filiais em praças distintas: ler valor absoluto antes do percentual.',
    procedencia: 'Recorte fictício de duas filiais da demonstração. Não é divisão corporativa verificada.',
    desenhoProprio: false,
  },
]

export function territorioPorId(id: string | null | undefined): Territorio | null {
  if (!id) return null
  return TERRITORIOS.find(t => t.id === id) ?? null
}

/**
 * Deriva o nível do que está aberto. Um `territorio` que não existe não vira
 * nível nenhum: quem chama cai no CSO, e a tela mostra o recorte válido em vez
 * de uma tela vazia sem explicação.
 */
export function nivelDe(territorioId: string | null | undefined, filial: string | null | undefined): Nivel {
  const t = territorioPorId(territorioId)
  if (!t) return 'cso'
  return filial && t.filiais.includes(filial) ? 'filial' : 'territorio'
}

/* ------------------------------------------------------------------ */
/*  Recorte                                                            */
/* ------------------------------------------------------------------ */

/**
 * Recorta o snapshot às filiais do território. Não mexe no histórico — ele é do
 * negócio inteiro e não tem filial; `recortar` já documenta isso, e a tela
 * herda o aviso.
 */
export function recortarTerritorio(s: RegionalSnapshot, territorio: Territorio | null): RegionalSnapshot {
  if (!territorio) return s
  const ok = new Set(territorio.filiais)
  const execs = s.execs.filter(e => ok.has(e.filial))
  const nomes = new Set(execs.map(e => e.nome))
  return {
    ...s,
    filiais: s.filiais.filter(f => ok.has(f.sigla)),
    execs,
    opps: s.opps.filter(o => ok.has(o.filial)),
    execHist: s.execHist.filter(h => nomes.has(h.exec)),
  }
}

/* ------------------------------------------------------------------ */
/*  Linha de território, para a Visão CSO                              */
/* ------------------------------------------------------------------ */

/**
 * Uma linha por território, com a mesma régua de todos os níveis.
 *
 * `pct` e `farol` são `null` quando a soma das filiais não tem meta. Zero de
 * meta é ausência, nunca "atingiu nada" — a regra que a issue #21 fixou.
 */
export type LinhaTerritorio = {
  territorio: Territorio
  /** Ganho do fluxo no território. */
  ganho: number
  /** Cenário Base do fluxo: ganho + esperado + fora do congelado. */
  base: number
  meta: number
  pctBase: number | null
  farolBase: 'verde' | 'amarelo' | 'vermelho' | null
  /** Quantas filiais do território têm meta cadastrada. */
  filiaisComMeta: number
  /**
   * Filiais do território, todas. É diferente de `filiaisComMeta`: uma filial
   * sem meta continua existindo no território, só não entra na comparação.
   * Contar só as comparáveis fazia o total do território encolher quando uma
   * filial ficava sem meta — sumia uma filial em vez de sumir uma comparação.
   */
  filiais: number
  /** A filial mais distante da meta, no fluxo. `null` quando nenhuma tem meta. */
  piorFilial: { sigla: string; pct: number } | null
  /** Valor absoluto que falta para 70% da meta. `null` sem meta. */
  faltaParaAlvo: number | null
}

export function linhasDeTerritorio(s: RegionalSnapshot, fluxo: Fluxo): LinhaTerritorio[] {
  return TERRITORIOS.map(territorio => {
    const recorte = recortarTerritorio(s, territorio)
    const f = forecastFluxo(recorte, fluxo)
    const comMeta = recorte.filiais.filter(fil => {
      const r = resultadoFilial(fil, fluxo)
      return r.meta > 0
    })
    const comparaveis = recorte.filiais
      .map(fil => ({ sigla: fil.sigla, pct: resultadoFilial(fil, fluxo).pct }))
      .filter((x): x is { sigla: string; pct: number } => x.pct !== null)
      .sort((a, b) => a.pct - b.pct)
    return {
      territorio,
      ganho: f.ganho,
      base: f.base,
      meta: resultadoTotal(recorte, fluxo).meta,
      pctBase: f.pctBase,
      farolBase: f.farolBase,
      filiaisComMeta: comMeta.length,
      filiais: recorte.filiais.length,
      piorFilial: comparaveis[0] ?? null,
      faltaParaAlvo: f.meta > 0 ? Math.max(0, 0.7 * f.meta - f.base) : null,
    }
  })
}

/* ------------------------------------------------------------------ */
/*  Visão CSO                                                          */
/* ------------------------------------------------------------------ */

export type VisaoCso = {
  fluxo: Fluxo
  /** Consolidado de todas as filiais do snapshot. */
  total: { ganho: number; base: number; meta: number; pctBase: number | null }
  /** Por território, na ordem de quem está mais longe do alvo primeiro. */
  territorios: LinhaTerritorio[]
  /** Linhas com base acima de 70% da meta. Serve para "N de M dentro do alvo". */
  noAlvo: number
  /**
   * O que merece atenção gerencial hoje, derivado das mesmas linhas. Nunca
   * inventa indicador: cada frase sai de um número que está na tela.
   */
  atencao: string[]
  /**
   * Todo o recorte é fictício. `escopoReal` é `false` porque não há identidade
   * no Worker: qualquer pessoa com a URL vê qualquer território.
   */
  escopoReal: false
  avisoEscopo: string
}

export function visaoCso(s: RegionalSnapshot, fluxo: Fluxo): VisaoCso {
  const total = resultadoTotal(s, fluxo)
  const f = forecastFluxo(s, fluxo)
  const territorios = linhasDeTerritorio(s, fluxo).sort((a, b) => {
    // Sem meta vai para o fim: não é "o pior", é o que não pode ser comparado.
    if (a.pctBase === null && b.pctBase === null) return 0
    if (a.pctBase === null) return 1
    if (b.pctBase === null) return -1
    return a.pctBase - b.pctBase
  })

  const atencao: string[] = []
  const semMeta = territorios.filter(t => t.filiaisComMeta < t.filiais)
  for (const t of semMeta) {
    atencao.push(`${t.territorio.nome}: ${t.filiais - t.filiaisComMeta} de ${t.filiais} filiais sem meta cadastrada — não entram na comparação.`)
  }
  const maisLonge = territorios.find(t => t.piorFilial !== null && t.pctBase !== null && t.pctBase < 0.7)
  if (maisLonge?.piorFilial) {
    atencao.push(`Pior filial do recorte: ${maisLonge.piorFilial.sigla}, em ${Math.round(maisLonge.piorFilial.pct * 100)}% da meta do fluxo.`)
  }
  const comAlvo = territorios.filter(t => t.pctBase !== null)
  const noAlvo = comAlvo.filter(t => (t.pctBase ?? 0) >= 0.7).length
  if (comAlvo.length > 0) {
    atencao.push(`${noAlvo} de ${comAlvo.length} territórios chegam a 70% da meta no cenário Base.`)
  }
  if (atencao.length === 0) atencao.push('Nenhum desvio acima do limite de atenção neste recorte.')

  return {
    fluxo,
    total: { ganho: total.ganho, base: f.base, meta: total.meta, pctBase: f.pctBase },
    territorios,
    noAlvo,
    atencao,
    escopoReal: false,
    avisoEscopo:
      'O recorte por território é só de tela. Ainda não há identidade no servidor: qualquer pessoa com o endereço abre qualquer território. Escopo de gerente não é controle de acesso.',
  }
}

/* ------------------------------------------------------------------ */
/*  Nível filial                                                       */
/* ------------------------------------------------------------------ */

/**
 * Uma filial dentro de um território. Reaproveita `RegionalFilial` do modelo
 * regional, que é de onde vêm rubrica, ganho e meta — não há segundo cálculo.
 */
export function filialDoTerritorio(s: RegionalSnapshot, territorioId: string, sigla: string): RegionalFilial | null {
  const t = territorioPorId(territorioId)
  if (!t || !t.filiais.includes(sigla)) return null
  return s.filiais.find(f => f.sigla === sigla) ?? null
}
