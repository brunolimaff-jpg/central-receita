/**
 * Catálogo oficial das linhas de produto da Senior.
 *
 * Módulo puro, sem React: o casamento entre o texto livre da solução (como vem
 * na planilha) e o produto oficial vive aqui, e não dentro do componente. Os
 * arquivos vêm do Senior Design System (`assets/Segmentos e produtos`) e foram
 * copiados sem redesenho para `public/brand/produtos`.
 *
 * O guia da marca exige que o ícone venha sempre acompanhado do nome. Por isso
 * o catálogo só responde qual produto representa o texto — quem exibe decide o
 * par ícone + nome, e texto sem correspondência continua sendo só texto.
 */

export const PRODUTOS = [
  'erp',
  'hcm',
  'tms',
  'wms',
  'acesso-seguranca',
  'logistica',
  'industria',
  'agronegocio',
  'construcao',
  'servicos',
] as const

export type ProdutoId = (typeof PRODUTOS)[number]

/** Proporção largura/altura de cada arquivo, para não distorcer o traço. */
const PROPORCAO: Record<ProdutoId, number> = {
  erp: 88 / 76,
  hcm: 110 / 84,
  tms: 108 / 104,
  wms: 100 / 80,
  'acesso-seguranca': 80 / 92,
  logistica: 1,
  industria: 1,
  agronegocio: 1,
  construcao: 1,
  servicos: 1,
}

/** Sinônimos aceitos na coluna de solução da carga. */
const ALIASES: Array<[RegExp, ProdutoId]> = [
  [/\bERP\b/i, 'erp'],
  [/\bHCM\b|gest[ãa]o de pessoas|folha/i, 'hcm'],
  [/\bWMS\b|armaz[ée]m/i, 'wms'],
  [/\bTMS\b|transporte|frota/i, 'tms'],
  [/acesso|seguran[çc]a/i, 'acesso-seguranca'],
  [/log[íi]stica/i, 'logistica'],
  [/ind[úu]stria|manufatura/i, 'industria'],
  [/agro|agroneg[óo]cio/i, 'agronegocio'],
  [/constru[çc][ãa]o/i, 'construcao'],
  [/servi[çc]os/i, 'servicos'],
]

/** Nome da solução → produto. `null` quando não há correspondência. */
export function produtoDaSolucao(solucao: string | null | undefined): ProdutoId | null {
  const texto = solucao?.trim()
  if (!texto) return null
  return ALIASES.find(([padrao]) => padrao.test(texto))?.[1] ?? null
}

/** Caminho público do ícone e a proporção original do arquivo. */
export function iconeDoProduto(id: ProdutoId): { src: string; proporcao: number } {
  return { src: `/brand/produtos/${id}.png`, proporcao: PROPORCAO[id] }
}
