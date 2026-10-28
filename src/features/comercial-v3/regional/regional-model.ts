/**
 * Modelo da Visão Regional (gerente regional: Centro-Oeste + estados).
 *
 * Inteligência migrada do "Painel Centro-Oeste" (artefato HTML, out/2026), onde os
 * números chegavam pré-calculados. Aqui as regras viram funções puras e testáveis.
 * Regras de negócio registradas em docs/adr/0006-visao-regional.md.
 *
 * Fluxos: MRR = manutenção (recorrente). NRR = licença + serviço (não recorrente).
 */

export type Tier = 'A' | 'B+' | 'B' | 'C' | 'D'
export type Fluxo = 'mrr' | 'nrr'
export type Rubrica = 'licenca' | 'manutencao' | 'servico'
export type Farol = 'verde' | 'amarelo' | 'vermelho'
export type Categoria = 'Commit' | 'Best case' | 'Pipeline' | 'Omitido'

export type RegionalOpp = {
  id: string
  filial: string
  exec: string
  cliente: string
  /** Cliente novo (New Name) ou base. */
  novo: boolean
  /** Data prevista de fechamento (AAAA-MM-DD). */
  data: string
  tier: Tier
  /** Probabilidade calibrada da oportunidade (0..1). */
  pb: number
  mrr: number
  nrr: number
  nota: string
  proximaAcao: string | null
  proximaAcaoData: string | null
  /** Última atualização no CRM (AAAA-MM-DD). */
  atualizadaEm: string
  /** Status no CRM; "Em andamento" para o forecast aberto. */
  status: 'Em andamento' | 'Perdida' | 'Ganha'
  /** Estava no forecast congelado do início do mês. */
  congelada: boolean
}

export type RubricaResultado = { meta: number; ganho: number }

export type RegionalFilial = {
  sigla: string
  nome: string
  metaClientesNovos: number
  clientesNovos: number
  rubricas: Record<Rubrica, RubricaResultado>
}

export type RegionalExec = { nome: string; filial: string; metaMrr: number; metaNrr: number }

/** Mês fechado, usado como régua de calibração. */
export type RegionalHistMes = {
  mes: string
  fluxo: Fluxo
  meta: number
  ganho: number
  /** Valor do forecast congelado no início do mês. */
  congelado: number
  /** Ganho que veio do congelado. */
  ganhoDoCongelado: number
  /** Ganho fechado fora do congelado (não planejado). */
  foraDoCongelado: number
}

/** Oportunidade de mês fechado, para conversão por faixa e por sinal de nota. */
export type RegionalHistOpp = { fluxo: Fluxo; valor: number; ganha: boolean; nota: string }

export type RegionalExecHist = { exec: string; mes: string; meta: number; ganho: number }

export type RegionalSnapshot = {
  asOf: string
  competencia: string
  /** Último dia útil que integra no ERP. */
  ultimoDiaUtil: string
  persona: { nome: string; papel: string; filiais: string[] }
  filiais: RegionalFilial[]
  execs: RegionalExec[]
  opps: RegionalOpp[]
  hist: RegionalHistMes[]
  histOpps: RegionalHistOpp[]
  execHist: RegionalExecHist[]
}

// ---------------------------------------------------------------------------
// Regras básicas

export const FAROL_VERDE = 1
export const FAROL_AMARELO = 0.7
export const ALVO_MINIMO = 0.7
/** Fração do que está em andamento e não fecha que rola para o mês seguinte (média ago/set). */
export const TAXA_ROLAGEM = 0.58
export const CONVERSAO_EXIGIDA_VERDE = 0.35
export const CONVERSAO_EXIGIDA_AMARELA = 0.6
export const DIAS_SEM_ATUALIZACAO = 30

export function farolOf(pct: number): Farol {
  if (pct >= FAROL_VERDE) return 'verde'
  if (pct >= FAROL_AMARELO) return 'amarelo'
  return 'vermelho'
}

export function categoriaOf(tier: Tier): Categoria {
  if (tier === 'A') return 'Commit'
  if (tier === 'B+' || tier === 'B') return 'Best case'
  if (tier === 'C') return 'Pipeline'
  return 'Omitido'
}

export const CATEGORIAS: Categoria[] = ['Commit', 'Best case', 'Pipeline', 'Omitido']

export function valorFluxo(o: Pick<RegionalOpp, 'mrr' | 'nrr'>, fluxo: Fluxo) {
  return fluxo === 'mrr' ? o.mrr : o.nrr
}

export function rubricasDoFluxo(fluxo: Fluxo): Rubrica[] {
  return fluxo === 'mrr' ? ['manutencao'] : ['licenca', 'servico']
}

/** Nome da rubrica para a tela. Fonte única: o mapa de calor e a filial usam o mesmo. */
export const ROTULO_RUBRICA: Record<Rubrica, string> = {
  manutencao: 'Manutenção',
  licenca: 'Licença',
  servico: 'Serviço',
}

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
/** Razão comum: 0 de 0 é ausência de resultado, não zero. Usar só onde o denominador é contagem. */
const div = (a: number, b: number) => (b === 0 ? 0 : a / b)
/**
 * Razão contra a **meta**. Sem meta não existe percentual: o retorno é `null`,
 * nunca 0. Zero diria "atingiu nada", que é uma afirmação — e falsa, porque a
 * filial sem meta não pode atingir nem deixar de atingir. É a mesma regra de
 * `sumKnown`: nulo propaga, nunca vira zero.
 */
const razaoDaMeta = (valor: number, meta: number): number | null => (meta > 0 ? valor / meta : null)

// ---------------------------------------------------------------------------
// Escopo

/**
 * Recorta o snapshot às filiais pedidas. `null` ou lista vazia = todas.
 *
 * O que o recorte pode filtrar e o que não pode:
 *
 * - `filiais`, `execs`, `opps`, `execHist` têm filial própria: filtram direto.
 * - `hist` e `histOpps` são meses **fechados** e não carregam filial nem
 *   executivo. Ficam como estão — e isso precisa ser dito na tela, porque a
 *   "Régua de calibração" ao lado do seletor é do negócio inteiro, não da
 *   filial escolhida. Antes ela parecia ser da filial: o farol mudava e a
 *   régua não, sem aviso.
 *
 * `escopoDoRecorte` devolve a diferença para a tela poder avisar.
 */
export function recortar(s: RegionalSnapshot, filiais: string[] | null): RegionalSnapshot {
  if (!filiais || filiais.length === 0) return s
  const ok = new Set(filiais)
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

/**
 * O histórico de meses fechados é do negócio inteiro. Com uma filial escolhida,
 * a régua de calibração continua global — `parcial` avisa a tela disso.
 */
export function escopoDoRecorte(filiais: string[] | null): { parcial: boolean; filiais: string[]; aviso: string | null } {
  const ativo = Boolean(filiais && filiais.length > 0)
  return {
    parcial: ativo,
    filiais: filiais ?? [],
    aviso: ativo
      ? `Calibração e sinais de nota usam os meses fechados do negócio inteiro: o histórico não traz filial. O recorte não vale para eles.`
      : null,
  }
}

export function abertas(s: Pick<RegionalSnapshot, 'opps'>) {
  return s.opps.filter(o => o.status === 'Em andamento')
}

// ---------------------------------------------------------------------------
// Resultado

export type BlocoResultado = {
  meta: number
  ganho: number
  /** `null` quando não há meta. Ausente não é zero. */
  pct: number | null
  /** `null` quando não há meta: sem meta não há farol. */
  farol: Farol | null
  falta: number | null
}

function bloco(meta: number, ganho: number): BlocoResultado {
  const pct = razaoDaMeta(ganho, meta)
  return { meta, ganho, pct, farol: pct === null ? null : farolOf(pct), falta: meta > 0 ? Math.max(0, meta - ganho) : null }
}

export function resultadoFilial(f: RegionalFilial, fluxo: Fluxo): BlocoResultado {
  const rs = rubricasDoFluxo(fluxo).map(r => f.rubricas[r])
  return bloco(soma(rs.map(r => r.meta)), soma(rs.map(r => r.ganho)))
}

export function resultadoRubrica(f: RegionalFilial, r: Rubrica): BlocoResultado {
  return bloco(f.rubricas[r].meta, f.rubricas[r].ganho)
}

export function resultadoTotal(s: Pick<RegionalSnapshot, 'filiais'>, fluxo: Fluxo): BlocoResultado {
  const bs = s.filiais.map(f => resultadoFilial(f, fluxo))
  return bloco(soma(bs.map(b => b.meta)), soma(bs.map(b => b.ganho)))
}

// ---------------------------------------------------------------------------
// Forecast

export type ResumoCategoria = { categoria: Categoria; bruto: number; esperado: number; n: number }

export function porCategoria(opps: RegionalOpp[], fluxo: Fluxo): ResumoCategoria[] {
  /*
   * Omitido (tier D) fica fora do conjunto, não dentro de uma categoria zerada.
   * A regra é declarada em REGRAS e no glossário: "D não entra em nenhum
   * cenário". Antes, uma opp D com probabilidade > 0 somava ao cenário Base —
   * o mock escondia isso porque todo D vinha com pb 0.
   */
  return CATEGORIAS.map(categoria => {
    const os = opps.filter(o => categoria !== 'Omitido' && o.status === 'Em andamento' && categoriaOf(o.tier) === categoria && valorFluxo(o, fluxo) > 0)
    return {
      categoria,
      n: os.length,
      bruto: soma(os.map(o => valorFluxo(o, fluxo))),
      esperado: soma(os.map(o => valorFluxo(o, fluxo) * o.pb)),
    }
  })
}

/** Fração média do mês fechada fora do congelado, em relação à meta. */
export function taxaForaDoCongelado(hist: RegionalHistMes[], fluxo: Fluxo) {
  const hs = hist.filter(h => h.fluxo === fluxo)
  return div(soma(hs.map(h => div(h.foraDoCongelado, h.meta))), hs.length)
}

export type ForecastFluxo = {
  fluxo: Fluxo
  meta: number
  ganho: number
  andamento: number
  esperado: number
  /** Fechamento estimado fora do congelado (não planejado). */
  fora: number
  base: number
  /** `null` quando não há meta. */
  pctBase: number | null
  farolBase: Farol | null
  categorias: ResumoCategoria[]
  /** Rolagem prevista para o mês seguinte. */
  rola: number
  perde: number
}

/** Fração do mês útil que ainda resta (asOf até o último dia útil, base 22 dias úteis). */
export function fracaoRestante(s: Pick<RegionalSnapshot, 'asOf' | 'ultimoDiaUtil'>) {
  return Math.min(1, Math.max(0, (diasEntre(s.asOf, s.ultimoDiaUtil) + 1) / 22))
}

export function forecastFluxo(s: RegionalSnapshot, fluxo: Fluxo, fracaoMesRestante = fracaoRestante(s)): ForecastFluxo {
  const r = resultadoTotal(s, fluxo)
  const categorias = porCategoria(s.opps, fluxo)
  const andamento = soma(categorias.map(c => c.bruto))
  const esperado = soma(categorias.map(c => c.esperado))
  const fora = r.meta * taxaForaDoCongelado(s.hist, fluxo) * fracaoMesRestante
  const base = r.ganho + esperado + fora
  const naoFecha = andamento - esperado
  return {
    fluxo,
    meta: r.meta,
    ganho: r.ganho,
    andamento,
    esperado,
    fora,
    base,
    pctBase: razaoDaMeta(base, r.meta),
    farolBase: razaoDaMeta(base, r.meta) === null ? null : farolOf(razaoDaMeta(base, r.meta)!),
    categorias,
    rola: TAXA_ROLAGEM * naoFecha,
    perde: (1 - TAXA_ROLAGEM) * naoFecha,
  }
}

export type ConversaoExigida = {
  alvo: number
  necessario: number
  /** `null` quando não há Best case: não há o que converter. Zero diria "não precisa". */
  semFora: number | null
  comFora: number | null
  assumida: number | null
  farol: Farol | null
  /** Commit sozinho já cobre o alvo. */
  coberto: boolean
}

/** Quanto do Best case precisa converter para chegar ao alvo (padrão 70% da meta). */
export function conversaoExigida(f: ForecastFluxo, alvo = ALVO_MINIMO): ConversaoExigida {
  const commit = f.categorias.find(c => c.categoria === 'Commit')!
  const best = f.categorias.find(c => c.categoria === 'Best case')!
  const necessario = alvo * f.meta - f.ganho
  const coberto = necessario - commit.esperado <= 0
  /*
   * Sem Best case no pipeline não existe conversão a exigir — e não existe
   * veredito. Antes, 0 ÷ 0 devolvia 0 e a tela pintava verde: dizia "alcançável"
   * para uma carteira que não tem o que converter. `null` diz "não há Best case".
   */
  if (best.bruto <= 0) {
    return { alvo, necessario, semFora: null, comFora: null, assumida: null, farol: null, coberto }
  }
  const semFora = (necessario - commit.esperado) / best.bruto
  const comFora = (necessario - commit.esperado - f.fora) / best.bruto
  const exigida = Math.max(0, comFora)
  const farol: Farol = exigida <= CONVERSAO_EXIGIDA_VERDE ? 'verde' : exigida <= CONVERSAO_EXIGIDA_AMARELA ? 'amarelo' : 'vermelho'
  return { alvo, necessario, semFora, comFora, assumida: best.esperado / best.bruto, farol, coberto }
}

export type Calibracao = { mes: string; cobertura: number; conversao: number; rendimento: number; atingimento: number; shareFora: number }

export function calibracao(hist: RegionalHistMes[], fluxo: Fluxo): { meses: Calibracao[]; rendimentoMedio: number; coberturaNecessaria: number } {
  const meses = hist.filter(h => h.fluxo === fluxo).map(h => {
    const cobertura = div(h.congelado, h.meta)
    const atingimento = div(h.ganho, h.meta)
    return {
      mes: h.mes,
      cobertura,
      conversao: div(h.ganhoDoCongelado, h.congelado),
      rendimento: div(atingimento, cobertura),
      atingimento,
      shareFora: div(h.foraDoCongelado, h.ganho),
    }
  })
  const rendimentoMedio = div(soma(meses.map(m => m.rendimento)), meses.length)
  return { meses, rendimentoMedio, coberturaNecessaria: div(1, rendimentoMedio) }
}

// ---------------------------------------------------------------------------
// Simulação (Monte Carlo): cada cliente é uma decisão independente.

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Simulacao = { p10: number; p50: number; p90: number; probAlvo: number; probMeta: number; rodadas: number }

export function simular(s: RegionalSnapshot, fluxo: Fluxo, rodadas = 4000, seed = 2510): Simulacao {
  const f = forecastFluxo(s, fluxo)
  const decisoes = new Map<string, { valor: number; pb: number }>()
  for (const o of abertas(s)) {
    const v = valorFluxo(o, fluxo)
    if (v <= 0 || o.pb <= 0) continue
    const d = decisoes.get(o.cliente)
    // Várias opps do mesmo cliente: uma decisão, probabilidade da maior.
    if (d) { d.valor += v; d.pb = Math.max(d.pb, o.pb) } else decisoes.set(o.cliente, { valor: v, pb: o.pb })
  }
  const ds = [...decisoes.values()]
  const rnd = mulberry32(seed)
  const res: number[] = []
  for (let i = 0; i < rodadas; i++) {
    let t = f.ganho + f.fora
    for (const d of ds) if (rnd() < d.pb) t += d.valor
    res.push(t)
  }
  res.sort((a, b) => a - b)
  const q = (p: number) => res[Math.min(res.length - 1, Math.floor(p * res.length))]
  return {
    p10: q(0.1),
    p50: q(0.5),
    p90: q(0.9),
    probAlvo: div(res.filter(v => v >= ALVO_MINIMO * f.meta).length, rodadas),
    probMeta: div(res.filter(v => v >= f.meta).length, rodadas),
    rodadas,
  }
}

// ---------------------------------------------------------------------------
// Limpeza do forecast

export type FlagLimpeza =
  | 'Nota diz perdido'
  | 'Duplicidade provável'
  | 'Mesma decisão em várias opps'
  | 'Valor zerado'
  | 'Sem atualização'
  | 'Recuperação judicial'
  | 'Cliente indica 2027'
  | 'Sem próxima ação'

export const FLAGS_LIMPEZA: { flag: FlagLimpeza; acao: string }[] = [
  { flag: 'Nota diz perdido', acao: 'Reclassificar como perdida.' },
  { flag: 'Duplicidade provável', acao: 'Consolidar na menor opp e encerrar a outra.' },
  { flag: 'Mesma decisão em várias opps', acao: 'Tratar como uma decisão; não somar chances.' },
  { flag: 'Valor zerado', acao: 'Preencher valor ou retirar do forecast.' },
  { flag: 'Sem atualização', acao: 'Atualizar com data e decisor ou postergar.' },
  { flag: 'Recuperação judicial', acao: 'Retirar do forecast até aprovação de crédito.' },
  { flag: 'Cliente indica 2027', acao: 'Postergar para 2027 com dono.' },
  { flag: 'Sem próxima ação', acao: 'Virar Postergado com data e dono até quarta.' },
]

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

export function flagsLimpeza(s: Pick<RegionalSnapshot, 'opps' | 'asOf'>): Map<string, FlagLimpeza[]> {
  const out = new Map<string, FlagLimpeza[]>()
  const add = (id: string, f: FlagLimpeza) => {
    const l = out.get(id) ?? []
    if (!l.includes(f)) l.push(f)
    out.set(id, l)
  }
  const os = abertas(s)
  const porCliente = new Map<string, RegionalOpp[]>()
  for (const o of os) porCliente.set(o.cliente, [...(porCliente.get(o.cliente) ?? []), o])
  for (const grupo of porCliente.values()) {
    if (grupo.length < 2) continue
    const execs = new Set(grupo.map(o => o.exec))
    const notas = new Set(grupo.map(o => norm(o.nota)))
    const dup = execs.size > 1 && notas.size < grupo.length
    for (const o of grupo) add(o.id, dup ? 'Duplicidade provável' : 'Mesma decisão em várias opps')
  }
  for (const o of os) {
    const n = norm(o.nota)
    if (/\bperd(a|ido|emos)\b|fechou com concorrente/.test(n)) add(o.id, 'Nota diz perdido')
    if (o.mrr + o.nrr === 0) add(o.id, 'Valor zerado')
    if (diasEntre(o.atualizadaEm, s.asOf) > DIAS_SEM_ATUALIZACAO) add(o.id, 'Sem atualização')
    if (/recuperacao judicial/.test(n)) add(o.id, 'Recuperação judicial')
    if (/2027/.test(n) || o.data.startsWith('2027')) add(o.id, 'Cliente indica 2027')
    if (o.tier === 'C' && (!o.proximaAcao || !o.proximaAcaoData)) add(o.id, 'Sem próxima ação')
  }
  return out
}

/** Valor esperado que a limpeza retira do forecast (opps com flag que zera a chance). */
export function impactoLimpeza(s: RegionalSnapshot, fluxo: Fluxo) {
  const flags = flagsLimpeza(s)
  const zera: FlagLimpeza[] = ['Nota diz perdido', 'Valor zerado', 'Recuperação judicial', 'Cliente indica 2027']
  return soma(abertas(s).filter(o => (flags.get(o.id) ?? []).some(f => zera.includes(f))).map(o => valorFluxo(o, fluxo) * o.pb))
}

// ---------------------------------------------------------------------------
// Faixas de valor e sinais de nota (régua histórica)

export const FAIXAS: Record<Fluxo, number[]> = { mrr: [1000, 3000, 8000], nrr: [5000, 20000, 50000, 100000] }

export function rotuloFaixa(fluxo: Fluxo, i: number) {
  const lim = FAIXAS[fluxo]
  const k = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))
  if (i === 0) return `até ${k(lim[0])}`
  if (i === lim.length) return `acima de ${k(lim[lim.length - 1])}`
  return `${k(lim[i - 1])}–${k(lim[i])}`
}

export function faixaDe(fluxo: Fluxo, valor: number) {
  const lim = FAIXAS[fluxo]
  const i = lim.findIndex(l => valor <= l)
  return i === -1 ? lim.length : i
}

export type Faixa = { rotulo: string; n: number; conversaoValor: number; fria: boolean; abertoAgora: number }

/** Conversão em valor por faixa; "fria" = menor conversão entre faixas com amostra >= 15. */
export function conversaoPorFaixa(s: RegionalSnapshot, fluxo: Fluxo, amostraMin = 15): Faixa[] {
  const hs = s.histOpps.filter(h => h.fluxo === fluxo)
  const faixas = FAIXAS[fluxo].map((_, i) => i).concat(FAIXAS[fluxo].length).map(i => {
    const g = hs.filter(h => faixaDe(fluxo, h.valor) === i)
    const total = soma(g.map(h => h.valor))
    const ganho = soma(g.filter(h => h.ganha).map(h => h.valor))
    const aberto = soma(abertas(s).filter(o => valorFluxo(o, fluxo) > 0 && faixaDe(fluxo, valorFluxo(o, fluxo)) === i).map(o => valorFluxo(o, fluxo)))
    return { rotulo: rotuloFaixa(fluxo, i), n: g.length, conversaoValor: div(ganho, total), fria: false, abertoAgora: aberto }
  })
  const elegiveis = faixas.filter(f => f.n >= amostraMin)
  if (elegiveis.length > 1) {
    const min = elegiveis.reduce((a, b) => (b.conversaoValor < a.conversaoValor ? b : a))
    min.fria = true
  }
  return faixas
}

export const SINAIS_NOTA: { sinal: string; padrao: RegExp }[] = [
  { sinal: 'Cita assinatura', padrao: /assinatura|assinar|docusign/ },
  { sinal: 'Aguarda retorno do cliente', padrao: /aguarda(ndo)? retorno/ },
  { sinal: 'Cita diretoria ou decisor', padrao: /diretoria|decisor|ceo|cfo/ },
]

export function sinaisDeNota(s: RegionalSnapshot, fluxo: Fluxo) {
  const hs = s.histOpps.filter(h => h.fluxo === fluxo)
  const conv = (g: RegionalHistOpp[]) => div(g.filter(h => h.ganha).length, g.length)
  return SINAIS_NOTA.map(({ sinal, padrao }) => {
    const com = hs.filter(h => padrao.test(norm(h.nota)))
    const sem = hs.filter(h => !padrao.test(norm(h.nota)))
    return { sinal, com: conv(com), sem: conv(sem), nCom: com.length, abertasHoje: abertas(s).filter(o => padrao.test(norm(o.nota))).length }
  })
}

// ---------------------------------------------------------------------------
// Executivos: concentração e nine box

export type ExecLinha = {
  nome: string
  filial: string
  metaMes: number
  ganhoMes: number
  esperado: number
  andamento: number
  /** Atingimento médio dos meses fechados + mês atual projetado. */
  atingimento: number
  /** Pipeline aberto ÷ falta para a meta do mês. */
  cobertura: number
  /** Nota de higiene: fração das opps sem flag de limpeza. */
  higiene: number
  n: number
}

export function linhasExec(s: RegionalSnapshot): ExecLinha[] {
  const flags = flagsLimpeza(s)
  return s.execs.map(e => {
    const os = abertas(s).filter(o => o.exec === e.nome)
    const ganhas = s.opps.filter(o => o.exec === e.nome && o.status === 'Ganha')
    const metaMes = e.metaMrr + e.metaNrr
    const ganhoMes = soma(ganhas.map(o => o.mrr + o.nrr))
    const andamento = soma(os.map(o => o.mrr + o.nrr))
    const esperado = soma(os.map(o => (o.mrr + o.nrr) * o.pb))
    const hs = s.execHist.filter(h => h.exec === e.nome)
    const ats = hs.map(h => div(h.ganho, h.meta)).concat(div(ganhoMes + esperado, metaMes))
    return {
      nome: e.nome,
      filial: e.filial,
      metaMes,
      ganhoMes,
      esperado,
      andamento,
      atingimento: div(soma(ats), ats.length),
      cobertura: div(andamento, Math.max(metaMes - ganhoMes, metaMes * 0.1)),
      higiene: os.length ? div(os.filter(o => !(flags.get(o.id)?.length)).length, os.length) : 1,
      n: os.length,
    }
  })
}

/** Fração do esperado do mês carregada pelos 3 maiores executivos. */
export function concentracaoTop3(linhas: ExecLinha[]) {
  const tot = soma(linhas.map(l => l.ganhoMes + l.esperado))
  const top = [...linhas].sort((a, b) => b.ganhoMes + b.esperado - (a.ganhoMes + a.esperado)).slice(0, 3)
  return { share: div(soma(top.map(l => l.ganhoMes + l.esperado)), tot), nomes: top.map(l => l.nome) }
}

/** Eixo Y: atingimento. Eixo X: cobertura de pipeline. 0 = baixo, 1 = médio, 2 = alto. */
export const NINEBOX_LIMITES = { atingimento: [0.7, 1], cobertura: [1.5, 2.5] }

export function nivel(v: number, [a, b]: number[]): 0 | 1 | 2 {
  return v < a ? 0 : v < b ? 1 : 2
}

/** Nome e ação de liderança de cada quadrante. Chave: `${y}${x}`. */
export const NINEBOX_QUADRANTES: Record<string, { nome: string; acao: string }> = {
  '22': { nome: 'Referência', acao: 'Dar casos difíceis e usar como par de outros executivos.' },
  '21': { nome: 'Entrega, pipeline justo', acao: 'Abrir prospecção agora para não secar no próximo mês.' },
  '20': { nome: 'Entrega sem reserva', acao: 'Risco de queda: dobrar geração de pipeline com BDR.' },
  '12': { nome: 'Potencial a converter', acao: 'Revisar estágio e próxima ação das maiores opps; acompanhar assinatura.' },
  '11': { nome: 'Núcleo estável', acao: 'Manter cadência semanal e cobrar data de assinatura.' },
  '10': { nome: 'Pipeline curto', acao: 'Plano de prospecção com meta semanal de oportunidades novas.' },
  '02': { nome: 'Pipeline sem conversão', acao: 'Liderança entra nas negociações; limpar opps sem decisor.' },
  '01': { nome: 'Atenção', acao: 'Plano de recuperação de 30 dias com metas de atividade.' },
  '00': { nome: 'Crítico', acao: 'Conversa de desempenho e redistribuição de contas.' },
}

export type NineBoxCelula = { y: 0 | 1 | 2; x: 0 | 1 | 2; nome: string; acao: string; execs: ExecLinha[] }

export function ninebox(linhas: ExecLinha[]): NineBoxCelula[] {
  const cel: NineBoxCelula[] = []
  for (const y of [2, 1, 0] as const) for (const x of [0, 1, 2] as const) {
    const q = NINEBOX_QUADRANTES[`${y}${x}`]
    cel.push({ y, x, ...q, execs: linhas.filter(l => nivel(l.atingimento, NINEBOX_LIMITES.atingimento) === y && nivel(l.cobertura, NINEBOX_LIMITES.cobertura) === x) })
  }
  return cel
}

// ---------------------------------------------------------------------------
// Plano da semana

export const CADENCIA: { dia: string; foco: string; entrega: string }[] = [
  { dia: 'Seg', foco: 'Contratos para assinatura e limpeza do forecast.', entrega: 'Forecast limpo até 12h.' },
  { dia: 'Ter', foco: 'Visitas presenciais e decisores.', entrega: 'Quem não tem data de assinatura sobe para a liderança.' },
  { dia: 'Qua', foco: 'Reuniões de diretoria.', entrega: 'Cada reunião termina com data de assinatura ou motivo de perda.' },
  { dia: 'Qui', foco: 'Segunda rodada do que foi enviado e não voltou.', entrega: 'Assina até sexta ou vira Postergado com data e dono.' },
  { dia: 'Sex', foco: 'Integração no ERP e fechamentos fora do congelado.', entrega: 'Foto final do mês.' },
]

export type Aposta = { opp: RegionalOpp; dia: string; papel: string; esperado: number }

/** Maiores decisões abertas (Commit e Best case) distribuídas na semana, sem flag que zere a chance. */
export function apostas(s: RegionalSnapshot, limite = 15): { lista: Aposta[]; coberturaMrr: number; coberturaNrr: number } {
  const flags = flagsLimpeza(s)
  const bloqueia: FlagLimpeza[] = ['Nota diz perdido', 'Valor zerado', 'Recuperação judicial', 'Cliente indica 2027']
  const candidatas = abertas(s)
    .filter(o => (o.tier === 'A' || o.tier === 'B+' || o.tier === 'B') && !(flags.get(o.id) ?? []).some(f => bloqueia.includes(f)))
    .sort((a, b) => (b.mrr * 6 + b.nrr) * b.pb - (a.mrr * 6 + a.nrr) * a.pb)
    // Um cliente = uma decisão: só a maior opp de cada cliente vira aposta.
    .filter((o, i, xs) => xs.findIndex(x => x.cliente === o.cliente) === i)
    .slice(0, limite)
  const lista = candidatas.map(o => {
    const n = norm(o.nota)
    const dia = o.tier === 'A' ? (/assin/.test(n) ? 'Seg' : 'Ter') : /diretoria|decisor/.test(n) ? 'Qua' : /aguarda/.test(n) ? 'Qui' : 'Ter'
    const papel = o.tier === 'A' ? 'Garantir assinatura e integração até sexta.' : o.pb >= 0.35 ? 'Gerente entra na reunião com o decisor.' : 'Cobrar data de assinatura ou motivo de perda.'
    return { opp: o, dia, papel, esperado: (o.mrr + o.nrr) * o.pb }
  })
  const totalMrr = forecastFluxo(s, 'mrr').esperado
  const totalNrr = forecastFluxo(s, 'nrr').esperado
  const ordem = CADENCIA.map(c => c.dia)
  lista.sort((a, b) => ordem.indexOf(a.dia) - ordem.indexOf(b.dia))
  return {
    lista,
    coberturaMrr: div(soma(lista.map(a => a.opp.mrr * a.opp.pb)), totalMrr),
    coberturaNrr: div(soma(lista.map(a => a.opp.nrr * a.opp.pb)), totalNrr),
  }
}

// ---------------------------------------------------------------------------
// Leitura do gerente: regras textuais geradas a partir dos números

export function leitura(s: RegionalSnapshot): string[] {
  const out: string[] = []
  const mrr = forecastFluxo(s, 'mrr')
  const nrr = forecastFluxo(s, 'nrr')
  const ce = conversaoExigida(mrr)
  // Percentual sem meta é ausência: a frase diz "sem meta", nunca "0%".
  const pct = (v: number | null) => (v === null || !Number.isFinite(v) ? 'sem meta' : `${Math.round(v * 100)}%`)
  out.push(`MRR no cenário Base fecha em ${pct(mrr.pctBase)} da meta; NRR em ${pct(nrr.pctBase)}. Em andamento não é previsão: só ${pct(mrr.esperado / Math.max(mrr.andamento, 1))} do MRR aberto é esperado.`)
  out.push(ce.coberto
    ? 'O Commit sozinho cobre 70% da meta de MRR. O foco é integrar no ERP até o último dia útil.'
    : ce.comFora === null || ce.assumida === null
      ? 'Sem Best case no pipeline não há conversão a exigir: o que falta tem de vir de fora do forecast.'
      : `Para chegar a 70% do MRR, o Best case precisa converter ${pct(Math.max(0, ce.comFora))}; o modelo assume ${pct(ce.assumida)}.`)
  // Filial sem meta vai para o fim: não é "a pior", é a que não pode ser comparada.
  const filiais = s.filiais.map(f => ({ f, r: resultadoFilial(f, 'mrr') }))
    .sort((a, b) => (a.r.pct ?? Infinity) - (b.r.pct ?? Infinity))
  if (filiais.length > 1) {
    const pior = filiais[0]
    out.push(`${pior.f.sigla} é a filial mais distante: ${pct(pior.r.pct)} do MRR. Ler o valor absoluto além do percentual: meta menor faz o % parecer melhor.`)
  }
  const conc = concentracaoTop3(linhasExec(s))
  out.push(`Os 3 maiores executivos carregam ${pct(conc.share)} do mês (${conc.nomes.join(', ')}). Dar cobertura de liderança a essas contas.`)
  const cal = calibracao(s.hist, 'mrr')
  out.push(`O forecast congelado explica só parte do Ganho final. Reservar capacidade para o não planejado, com dono. Cobertura necessária para 100%: ~${cal.coberturaNecessaria.toFixed(1)}x.`)
  out.push('Assinar não é integrar. Só conta o que integra no ERP até o último dia útil.')
  return out
}

// ---------------------------------------------------------------------------
// Mapas de calor

/**
 * Escala única do mapa de calor, derivada do mesmo farol dos chips.
 *
 * Antes havia duas: o mapa tinha 5 faixas e o farol, 3. No mesmo percentual a
 * célula saía salmão e o chip vermelho, lado a lado. Aqui são as três faixas do
 * farol — a cor do mapa passa a ser a mesma afirmação que o chip.
 *
 * A função vive no modelo, e não na tela, para poder ser testada: a issue #21
 * pede teste das faixas, de zero e de indisponível.
 */
export type TomCalor = 'indisponivel' | 'vermelho' | 'amarelo' | 'verde'

export function tomDoCalor(valor: number | null): TomCalor {
  // Ausência antes de tudo: `null` não é "atingiu zero".
  if (valor === null || !Number.isFinite(valor)) return 'indisponivel'
  if (valor >= FAROL_VERDE) return 'verde'
  if (valor >= FAROL_AMARELO) return 'amarelo'
  return 'vermelho'
}

/**
 * Texto da célula. Ausente nunca vira "0%" — vira o símbolo de indisponível.
 */
export function rotuloDoCalor(valor: number | null): string {
  return valor === null || !Number.isFinite(valor) ? '—' : `${Math.round(valor * 100)}%`
}

export type CelulaCalor = {
  linha: string
  coluna: string
  /** Percentual da meta, ou valor absoluto nos mapas de valor. `null` = indisponível. */
  valor: number | null
  rotulo: string
  /** O mesmo tom no mapa e no farol. */
  tom: TomCalor
}

/**
 * Duas leituras na mesma tabela, cada coluna dizendo o que mede.
 *
 * **Rubricas leem ganho.** O Base não pode ser aberto por rubrica com o dado
 * que existe: a oportunidade traz MRR e NRR, não licença e serviço separados.
 * Ratear o Base pela meta daria às três colunas o mesmo número do fluxo — três
 * colunas repetindo duas. Então a rubrica mostra o que é verdade nela: o ganho.
 *
 * **Fluxos leem Base.** É a coluna que responde "onde o mês vai aterrissar", e é
 * a que o painel do Matheus usava como manchete. Ler ganho aqui faria o mapa
 * inteiro ficar vermelho no dia 28, quando quase nada integrou ainda.
 *
 * O agrupamento vai no modelo para a tela não precisar saber os índices.
 *
 * Célula sem meta sai `indisponivel`, não vermelha.
 */
export type GrupoCalor = { rotulo: string; de: number; ate: number }

export function calorFilialRubrica(s: RegionalSnapshot): { colunas: string[]; linhas: string[]; celulas: CelulaCalor[]; grupos: GrupoCalor[] } {
  const colunas = ['Manutenção', 'Licença', 'Serviço', 'MRR Base', 'NRR Base']
  const grupos: GrupoCalor[] = [
    { rotulo: 'Ganho por rubrica', de: 0, ate: 2 },
    { rotulo: 'Cenário Base', de: 3, ate: 4 },
  ]
  const celulas: CelulaCalor[] = []
  const add = (linha: string, coluna: string, valor: number | null) =>
    celulas.push({ linha, coluna, valor, rotulo: rotuloDoCalor(valor), tom: tomDoCalor(valor) })
  for (const f of s.filiais) {
    const r = recortar(s, [f.sigla])
    const mrr = forecastFluxo(r, 'mrr')
    const nrr = forecastFluxo(r, 'nrr')
    add(f.sigla, 'Manutenção', razaoDaMeta(f.rubricas.manutencao.ganho, f.rubricas.manutencao.meta))
    add(f.sigla, 'Licença', razaoDaMeta(f.rubricas.licenca.ganho, f.rubricas.licenca.meta))
    add(f.sigla, 'Serviço', razaoDaMeta(f.rubricas.servico.ganho, f.rubricas.servico.meta))
    add(f.sigla, 'MRR Base', mrr.pctBase)
    add(f.sigla, 'NRR Base', nrr.pctBase)
  }
  return { colunas, linhas: s.filiais.map(f => f.sigla), celulas, grupos }
}

/** Esperado (valor × probabilidade) por filial × data prevista, nos dias restantes do mês e depois. */
export function calorFilialDia(s: RegionalSnapshot, fluxo: Fluxo): { colunas: string[]; linhas: string[]; celulas: CelulaCalor[] } {
  const os = abertas(s).filter(o => valorFluxo(o, fluxo) > 0)
  const colunas = [...new Set(os.map(o => o.data))].sort()
  const celulas: CelulaCalor[] = []
  for (const f of s.filiais) for (const d of colunas) {
    const doDia = os.filter(o => o.filial === f.sigla && o.data === d)
    /*
     * Dia sem oportunidade não tem valor esperado — e "não tem" é diferente de
     * "tem zero". A célula fica `null`, cinza, e some da escala.
     */
    const v = doDia.length === 0 ? null : soma(doDia.map(o => valorFluxo(o, fluxo) * o.pb))
    celulas.push({ linha: f.sigla, coluna: d, valor: v, rotulo: '', tom: v === null ? 'indisponivel' : 'verde' })
  }
  return { colunas, linhas: s.filiais.map(f => f.sigla), celulas }
}

/** Fluxo do forecast de outubro: do Ganho até o cenário Base (cascata). */
export function cascata(f: ForecastFluxo) {
  const cat = (c: Categoria) => f.categorias.find(x => x.categoria === c)!.esperado
  return [
    { rotulo: 'Ganhos no CRM', valor: f.ganho },
    { rotulo: 'Commit esperado', valor: cat('Commit') },
    { rotulo: 'Best case esperado', valor: cat('Best case') },
    { rotulo: 'Pipeline esperado', valor: cat('Pipeline') },
    { rotulo: 'Fora do congelado', valor: f.fora },
  ]
}

// ---------------------------------------------------------------------------
// Regras e cálculos: fonte única para a aba "Regras e cálculos" e para a documentação.

export type Regra = { grupo: string; nome: string; formula: string; regra: string }

export const REGRAS: Regra[] = [
  { grupo: 'Base', nome: 'Fluxos', formula: 'MRR = manutenção · NRR = licença + serviço', regra: 'Toda análise roda separada por fluxo. Nunca somar MRR com NRR para farol.' },
  { grupo: 'Base', nome: 'Ganho', formula: 'Ganho = Σ valor das opps Ganhas e integradas com ERP no mês', regra: 'Assinar não é integrar. Só conta o que integra até o último dia útil (sábado não integra).' },
  { grupo: 'Base', nome: 'Farol', formula: 'pct = Ganho ÷ meta · verde ≥ 100% · amarelo ≥ 70% · vermelho < 70%', regra: 'Sem meta não há percentual nem farol: a tela mostra "sem meta", nunca 0%. Ler o valor absoluto além do %: meta menor faz o % parecer melhor.' },
  { grupo: 'Forecast', nome: 'Categorias', formula: 'Commit = A · Best case = B+ e B · Pipeline = C · Omitido = D', regra: 'D não entra em nenhum cenário — nem no bruto, nem no esperado, nem na contagem.' },
  { grupo: 'Leitura', nome: 'Mapa de calor', formula: 'rubricas = ganho ÷ meta · fluxos = cenário Base ÷ meta · cor = mesma faixa do farol (100% / 70%) · ausente = cinza "sem meta"', regra: 'Duas leituras na mesma tabela, com cabeçalho de grupo: a rubrica só pode medir ganho, porque a carga não abre o Base em licença e serviço. As colunas de fluxo medem o Base — onde o mês vai aterrissar. Zero e sem meta têm cores diferentes. A cor nunca é a única informação: cada célula traz o estado no title e a legenda nomeia as faixas.' },
  { grupo: 'Leitura', nome: 'Recorte', formula: 'filial filtra opps, executivos e execHist · não filtra hist nem histOpps', regra: 'O histórico de meses fechados não tem filial. Com uma filial escolhida, a calibração continua global e a tela avisa.' },
  { grupo: 'Forecast', nome: 'Esperado', formula: 'Esperado = Σ (valor × pb) das opps em andamento', regra: 'pb é a probabilidade calibrada por opp com o histórico de 2 meses. Em andamento não é previsão.' },
  { grupo: 'Forecast', nome: 'Fora do congelado', formula: 'Fora = meta × média(fora_do_congelado ÷ meta dos meses fechados) × fração do mês útil restante', regra: 'Reserva para o não planejado. Fração restante = (dias até o último dia útil + 1) ÷ 22.' },
  { grupo: 'Forecast', nome: 'Cenário Base', formula: 'Base = Ganho + Esperado + Fora', regra: 'Farol do Base usa a mesma régua do Ganho.' },
  { grupo: 'Forecast', nome: 'Conversão exigida', formula: 'necessário = 0,7 × meta − Ganho · sem fora = (necessário − Commit esperado) ÷ Best bruto · com fora = (necessário − Commit esperado − Fora) ÷ Best bruto · assumida = Best esperado ÷ Best bruto', regra: 'Verde até 35%, amarelo até 60%, vermelho acima. Se o Commit cobre o necessário, o foco é integrar.' },
  { grupo: 'Forecast', nome: 'Rolagem', formula: 'Rola = 58% × (em andamento − esperado) · Perde = 42% × (em andamento − esperado)', regra: '58% é a média de ago e set. Revisar a constante a cada mês fechado.' },
  { grupo: 'Forecast', nome: 'Simulação', formula: 'Monte Carlo, 4.000 rodadas, semente fixa. Cada cliente é uma decisão (soma dos valores, pb da maior opp). Resultado = Ganho + Fora + decisões sorteadas.', regra: 'P10/P50/P90 e chance de ≥ 70% e ≥ 100% da meta.' },
  { grupo: 'Calibração', nome: 'Cobertura', formula: 'Cobertura = congelado ÷ meta', regra: 'Medida no início do mês.' },
  { grupo: 'Calibração', nome: 'Conversão do congelado', formula: 'Conversão = ganho vindo do congelado ÷ congelado', regra: 'Régua histórica de 21% a 28%.' },
  { grupo: 'Calibração', nome: 'Rendimento', formula: 'Rendimento = (Ganho ÷ meta) ÷ cobertura · cobertura necessária para 100% ≈ 1 ÷ rendimento médio', regra: 'O congelado explica só parte do Ganho final.' },
  { grupo: 'Calibração', nome: 'Faixa de valor', formula: 'MRR: até 1k, 1–3k, 3–8k, acima de 8k · NRR: até 5k, 5–20k, 20–50k, 50–100k, acima de 100k · conversão = valor ganho ÷ valor total da faixa', regra: 'Faixa fria = menor conversão entre faixas com 15+ opps. É alerta, não regra.' },
  { grupo: 'Calibração', nome: 'Sinais de nota', formula: 'conversão com sinal vs sem sinal (contagem) nos meses fechados', regra: 'Sinal indica direção, não causa. Exigir data e decisor em toda nota.' },
  { grupo: 'Qualidade', nome: 'Limpeza do forecast', formula: 'Flags: nota diz perdido · duplicidade (mesmo cliente, executivos diferentes, mesma nota) · mesma decisão em várias opps · valor zerado · sem atualização há 30+ dias · recuperação judicial · cliente indica 2027 · C sem próxima ação com data', regra: 'Perdido, zerado, RJ e 2027 zeram a chance. C sem próxima ação vira Postergado com data e dono até quarta.' },
  { grupo: 'Qualidade', nome: 'Higiene do executivo', formula: 'Higiene = opps sem flag ÷ opps em andamento', regra: 'Forecast sem próxima ação não é forecast.' },
  { grupo: 'Executivos', nome: 'Atingimento', formula: 'média(Ganho ÷ meta de ago, set, e (Ganho + Esperado) ÷ meta de out)', regra: 'Eixo Y da nine box: baixo < 70%, médio < 100%, alto ≥ 100%.' },
  { grupo: 'Executivos', nome: 'Cobertura de pipeline', formula: 'Cobertura = em andamento ÷ max(meta − Ganho, 10% da meta)', regra: 'Eixo X da nine box: baixo < 1,5x, médio < 2,5x, alto ≥ 2,5x.' },
  { grupo: 'Executivos', nome: 'Concentração', formula: 'Top 3 = (Ganho + Esperado) dos 3 maiores ÷ total', regra: 'Acima de 50%: dar cobertura de liderança às contas desses executivos.' },
  { grupo: 'Plano', nome: 'Apostas da semana', formula: 'Até 15 opps A, B+ e B sem flag que zere a chance, ordenadas por (MRR × 6 + NRR) × pb, uma por cliente', regra: 'Dia: A com assinatura → Seg; A → Ter; diretoria/decisor → Qua; aguarda retorno → Qui. Cobertura = esperado das apostas ÷ esperado total.' },
  { grupo: 'Plano', nome: 'Cadência', formula: 'Seg limpeza · Ter decisores · Qua diretoria · Qui segunda rodada · Sex integração e foto final', regra: 'Toda reunião termina com data de assinatura ou motivo de perda.' },
]
