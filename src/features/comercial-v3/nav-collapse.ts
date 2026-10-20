/**
 * Preferência de largura da coluna de navegação.
 *
 * O estado vive na coluna, mas o recorte comercial (período, filial, solução)
 * não depende dele: recolher é só ganhar área de leitura, nunca trocar filtro.
 * Módulo puro, sem DOM — a leitura e a gravação no navegador ficam com o shell.
 */

export type NavCollapse = 'expandida' | 'recolhida'

/** Chave única no armazenamento local do navegador. */
export const CHAVE_NAVEGACAO = 'central-receita:navegacao'

/** Abaixo deste ponto a primeira visita começa recolhida (mesmo valor do breakpoint antigo). */
const LARGURA_RECOLHIDA = 1180

/**
 * Valor da primeira visita. Reproduz o comportamento antigo do breakpoint, que
 * agora vale só como ponto de partida: a escolha do usuário sempre vence.
 */
export function collapseInicial(largura: number): NavCollapse {
  return largura <= LARGURA_RECOLHIDA ? 'recolhida' : 'expandida'
}

/**
 * Lê a preferência gravada. Valor ausente ou de outra versão cai no inicial
 * por largura, para uma gravação corrompida nunca travar a navegação.
 */
export function lerPreferencia(bruto: string | null, largura: number): NavCollapse {
  return bruto === 'expandida' || bruto === 'recolhida' ? bruto : collapseInicial(largura)
}

/** Serializa o estado para gravação. */
export function gravarPreferencia(estado: NavCollapse): string {
  return estado
}
