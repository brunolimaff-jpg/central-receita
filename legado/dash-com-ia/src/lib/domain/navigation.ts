export const TELAS_VALIDAS = [
  'agora',
  'mudancas',
  'casos',
  'visao',
  'oportunidades',
  'winloss',
  'radar',
  'agente',
  'fontes',
  'validacoes',
  'detalhe',
  'visoes',
] as const

export type Tela = (typeof TELAS_VALIDAS)[number]
export type AreaPrimaria = 'briefing' | 'perguntar' | 'explorar' | 'visoes' | 'fontes'

export const AREA_PRIMARIA_POR_TELA: Record<Tela, AreaPrimaria> = {
  agora: 'briefing',
  agente: 'perguntar',
  mudancas: 'explorar',
  casos: 'explorar',
  visao: 'explorar',
  oportunidades: 'explorar',
  winloss: 'explorar',
  radar: 'explorar',
  detalhe: 'explorar',
  visoes: 'visoes',
  fontes: 'fontes',
  validacoes: 'fontes',
}

export type TelaOrigem = 'agora' | 'casos' | 'radar' | 'mudancas' | 'winloss' | 'fila' | 'visao' | 'oportunidades'

const TELAS_ORIGEM_VALIDAS: readonly TelaOrigem[] = ['agora', 'casos', 'radar', 'mudancas', 'winloss', 'fila', 'visao', 'oportunidades']

export type ContextoOrigem = {
  de?: TelaOrigem
  foco?: string
}

export interface RetornoDetalhe {
  tela: Tela
  contexto: ContextoOrigem
}

export type IrPara = (tela: Tela, op?: number, contexto?: ContextoOrigem) => void

export type ContextoGlobal = {
  busca?: string
  filial?: string
  classificacao?: string
  janelaForecast?: 30 | 60 | 90
}

export type AtualizarContexto = (patch: Partial<ContextoGlobal>, tela?: Tela) => void

export function lerContextoGlobal(params: URLSearchParams): ContextoGlobal {
  const contexto: ContextoGlobal = {}
  const busca = params.get('busca')?.trim()
  const filial = params.get('filial')
  const classificacao = params.get('classificacao')
  const janela = Number(params.get('janela'))
  if (busca) contexto.busca = busca
  if (filial) contexto.filial = filial
  if (classificacao) contexto.classificacao = classificacao
  if (janela === 30 || janela === 60 || janela === 90) contexto.janelaForecast = janela
  return contexto
}

export function restringirContextoPorTela(params: URLSearchParams): URLSearchParams {
  const tela = resolverTela(params.get('tela'))
  const origem = tela === 'detalhe' ? resolverTelaOrigem(params.get('de')) : null
  const telaContexto = origem ?? tela
  const telasComJanela: readonly Tela[] = ['agora', 'mudancas', 'visao', 'agente']
  const telasComBusca: readonly Tela[] = ['oportunidades', 'detalhe']
  if (!telasComJanela.includes(telaContexto)) params.delete('janela')
  if (!telasComBusca.includes(telaContexto)) params.delete('busca')
  return params
}

export function resolverTela(valor: string | null): Tela {
  return TELAS_VALIDAS.find((tela) => tela === valor) ?? 'agora'
}

export function resolverTelaOrigem(valor: string | null): Tela | null {
  if (!valor || !TELAS_ORIGEM_VALIDAS.includes(valor as TelaOrigem)) return null
  return valor === 'fila' ? 'oportunidades' : (valor as Tela)
}

export function resolverRetornoDetalhe(de: string | null | undefined, foco: string | null | undefined): RetornoDetalhe {
  return {
    tela: resolverTelaOrigem(de ?? null) ?? 'oportunidades',
    contexto: foco ? { foco } : {},
  }
}

export function podeAbrirAssistenteEmBalao(tela: Tela): boolean {
  return tela !== 'agente'
}

export function criarHrefTela(tela: Tela, oportunidadeId?: number, contexto?: ContextoOrigem): string {
  const params = new URLSearchParams()
  if (tela !== 'agora') params.set('tela', tela)
  if (tela === 'detalhe' && oportunidadeId !== undefined) params.set('op', String(oportunidadeId))
  if (tela === 'detalhe' && contexto?.de) params.set('de', contexto.de)
  if (contexto?.foco) params.set('foco', contexto.foco)
  const query = params.toString()
  return query ? `/?${query}` : '/'
}
