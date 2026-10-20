/**
 * Ícones oficiais das linhas de produto da Senior.
 *
 * Os arquivos vêm do Senior Design System (`assets/Segmentos e produtos`) e
 * foram copiados sem redesenho para `public/brand/produtos`. O ícone nunca é o
 * único rótulo: ele acompanha o nome do produto, como manda o próprio guia.
 *
 * O casamento é feito pelo texto da solução que vem da carga. Fora do mapa,
 * devolve `null` — quem chama decide se mostra só o texto, em vez de inventar
 * um ícone que não representa o produto.
 */

export type ProdutoId =
  | 'erp'
  | 'hcm'
  | 'tms'
  | 'wms'
  | 'acesso-seguranca'
  | 'logistica'
  | 'industria'
  | 'agronegocio'
  | 'construcao'
  | 'servicos'

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

export function produtoDaSolucao(solucao: string | null | undefined): ProdutoId | null {
  const texto = solucao?.trim()
  if (!texto) return null
  return ALIASES.find(([padrao]) => padrao.test(texto))?.[1] ?? null
}

export function ProductIcon({ solucao, tamanho = 18, className = '' }: {
  solucao: string | null | undefined
  /** Altura em px. A largura sai da proporção original do arquivo. */
  tamanho?: number
  className?: string
}) {
  const produto = produtoDaSolucao(solucao)
  if (!produto) return null
  const largura = Math.round(tamanho * PROPORCAO[produto])
  return (
    // eslint-disable-next-line @next/next/no-img-element -- export estático sem otimizador de imagem
    <img
      src={`/brand/produtos/${produto}.png`}
      alt=""
      aria-hidden
      width={largura}
      height={tamanho}
      loading="lazy"
      decoding="async"
      /*
       * `inline-block` explícito: quando o pai é `inline-flex`, um `img` com
       * `display: block` (herdado de utilitário) quebra a linha e o ícone cai
       * abaixo do texto. O ícone precisa ser irmão inline do nome, sempre.
       */
      className={`inline-block shrink-0 object-contain align-middle ${className}`}
      style={{ height: tamanho, width: 'auto' }}
    />
  )
}
