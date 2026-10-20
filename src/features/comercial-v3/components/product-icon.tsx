/**
 * Ícones oficiais das linhas de produto da Senior.
 *
 * O casamento entre o texto da solução e o produto oficial vive no catálogo
 * (`product-catalog.ts`); este arquivo só desenha. O PNGs vêm do Senior Design
 * System e foram copiados sem redesenho para `public/brand/produtos`.
 *
 * O guia da marca exige que o ícone apareça sempre junto do nome. Por isso
 * `ProductLabel` é o modo padrão de exibição: ele decide o par e não oferece
 * caminho para o ícone sozinho. `ProductIcon` continua exportado para o filtro,
 * onde o nome é o texto visível do próprio `<select>`.
 */

import { iconeDoProduto, produtoDaSolucao } from '../product-catalog'

export function ProductIcon({ solucao, tamanho = 18, className = '', prioridade = false }: {
  solucao: string | null | undefined
  /** Altura em px. A largura sai da proporção original do arquivo. */
  tamanho?: number
  className?: string
  /** Acima da dobra, o arquivo carrega sem adiar: o filtro do cabeçalho. */
  prioridade?: boolean
}) {
  const produto = produtoDaSolucao(solucao)
  if (!produto) return null
  const { src, proporcao } = iconeDoProduto(produto)
  const largura = Math.round(tamanho * proporcao)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- export estático sem otimizador de imagem
    <img
      src={src}
      alt=""
      aria-hidden
      width={largura}
      height={tamanho}
      loading={prioridade ? 'eager' : 'lazy'}
      fetchPriority={prioridade ? 'high' : 'auto'}
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

/**
 * Ícone + nome, na mesma linha. Solução sem produto correspondente vira só o
 * texto — nunca um glifo inventado, nunca a imagem sozinha.
 */
export function ProductLabel({ solucao, tamanho = 18, className = '' }: {
  solucao: string | null | undefined
  tamanho?: number
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <ProductIcon solucao={solucao} tamanho={tamanho} />
      {solucao}
    </span>
  )
}
