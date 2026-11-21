/**
 * Lente de território — a segunda leitura da carteira, e a mais limitada.
 *
 * O território é um recorte **geográfico**, ortogonal à vertical: a mesma
 * pessoa pode vender em mais de um território, e o organograma diz que o
 * Território 05 não tem base própria (novos negócios via canais, base anexa ao
 * 02). Por isso ele nunca é um degrau da cascata — é um filtro, e um filtro
 * sobre dado que ainda não existe.
 *
 * O que a carga tem: filial (`UNIDADE NEGOCIO OPORTUNIDADE`), não UF, praça ou
 * região. Não há como derivar território de nenhum campo importado.
 *
 * O que este módulo faz, então, é limitado de propósito: mostra a **base
 * declarada no slide** de 2027 e diz, na tela, que ela não reconcilia com a
 * carga. A matriz de MRR por vertical e território soma R$ 51,85 mi contra
 * R$ 52 mi das margens — diferença de R$ 150 mil. Apresentar essa matriz
 * como se fosse dado medido seria pior que não mostrar nada.
 */

import { MRR_TOTAL, TERRITORIOS, VERTICAIS, type Territorio } from './org-2027.ts'

export type LenteTerritorio = {
  territorios: Array<{
    numero: number
    nome: string
    ufs: string
    cor: string
    /** Base declarada no slide. `null` quando o território não tem base própria. */
    mrr: number | null
    grupos: number | null
    /**
     * `false` para o Território 05: não tem base própria. Mostrar R$ 0 aqui
     * diria "vendeu nada", que é falso — a base dele está anexada ao 02.
     */
    temBasePropria: boolean
    /**
     * O que a linha do slide declara menos o que a abertura por vertical soma.
     * Não é zero: o Território 02 declara R$ 50 mil a mais e o 04, R$ 100 mil.
     * Mostrado na tela como resíduo da matriz, nunca redistribuído.
     */
    diferencaDaMatriz: number
    nota: string | null
  }>
  /**
   * Aviso que a tela é obrigada a mostrar junto da lente. Guardado no modelo
   * (e não só na tela) para que qualquer consumidor futuro herde a ressalva.
   */
  aviso: string
  /**
   * A soma das margens fecha com o total declarado (R$ 52 mi), mas a
   * **abertura por vertical** não fecha com nenhuma das duas margens: soma
   * R$ 51,85 mi. A diferença de R$ 150 mil é o que proíbe tratar vertical e
   * território como dois cortes do mesmo total.
   */
  reconciliacao: {
    totalDeclarado: number
    somaDasVerticais: number
    somaDaMatriz: number
    diferencaDaMatriz: number
    porVertical: Array<{ vertical: string; declarado: number; matriz: number; diferenca: number }>
  }
}

/**
 * Monta a lente a partir da estrutura de 2027.
 *
 * Todos os totais são calculados aqui, não afirmados em comentário: se o slide
 * mudar, a diferença aparece sozinha.
 */
export function lenteTerritorios(): LenteTerritorio {
  const territorios = TERRITORIOS.map((t: Territorio) => {
    const linha = t.porVertical === null ? null : Object.values(t.porVertical).reduce((soma, d) => soma + d.mrr, 0)
    return {
      numero: t.numero,
      nome: t.nome,
      ufs: t.ufs,
      cor: t.cor,
      // `porVertical: null` é a marca do território sem base própria no arquivo.
      mrr: t.porVertical === null ? null : t.mrr,
      grupos: t.porVertical === null ? null : t.grupos,
      temBasePropria: t.porVertical !== null,
      diferencaDaMatriz: linha === null ? 0 : t.mrr - linha,
      nota: t.nota ? t.nota.join('. ') : null,
    }
  })

  // Soma de cada coluna (vertical) percorrendo a matriz.
  const porVertical = VERTICAIS.map(vertical => {
    const matriz = TERRITORIOS.reduce((soma, t) => soma + (t.porVertical?.[vertical.id]?.mrr ?? 0), 0)
    return { vertical: vertical.nome, declarado: vertical.mrr, matriz, diferenca: vertical.mrr - matriz }
  })

  const somaDasVerticais = VERTICAIS.reduce((soma, v) => soma + v.mrr, 0)
  const somaDaMatriz = porVertical.reduce((soma, v) => soma + v.matriz, 0)

  return {
    territorios,
    aviso:
      'Base declarada no organograma de 2027, não medida na carga. A carga traz unidade de negócio, não UF, então nenhuma oportunidade pode ser atribuída a um território hoje. E a abertura por vertical não fecha com o total: a diferença aparece abaixo e não foi redistribuída.',
    reconciliacao: {
      totalDeclarado: MRR_TOTAL,
      somaDasVerticais,
      somaDaMatriz,
      diferencaDaMatriz: MRR_TOTAL - somaDaMatriz,
      porVertical,
    },
  }
}
