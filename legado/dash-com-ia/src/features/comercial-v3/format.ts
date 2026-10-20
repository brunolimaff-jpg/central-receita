/**
 * Formatação numérica da Visão Comercial V3 (pt-BR).
 *
 * Fonte: 00_SPEC_VISAO_COMERCIAL_V3.md §7 (padrão de números) e o preview
 * aprovado `v3/Central-de-Receita-V3-FINAL-HTML/index.html` (l.412-413), que
 * imprime milhões com uma casa decimal e sinal explícito nos deltas.
 *
 * Este módulo é só apresentação: nenhum número nasce aqui, todos vêm do
 * `CommercialSnapshot` por meio dos seletores de `model.ts`.
 */

const UMA_CASA = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const DUAS_CASAS = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const VALOR_OPORTUNIDADE = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
})

/** O fixture mede milhões; o detalhe mostra reais para conservar a comparação. */
export function formatarValorOportunidade(valorEmMilhoes: number): string {
  return VALOR_OPORTUNIDADE.format(valorEmMilhoes * 1_000_000)
}

/** `R$ 12,0 mi` — o sinal nunca aparece aqui; use `formatarComSinal` para deltas. */
export function formatarMilhoes(valor: number): string {
  const absoluto = Math.abs(valor)
  const numero = absoluto < 0.1 ? DUAS_CASAS.format(absoluto) : UMA_CASA.format(absoluto)
  return `R$ ${numero} mi`
}

/** `+R$ 0,6 mi` / `-R$ 0,9 mi` / `R$ 0,0 mi` — deltas com sinal explícito. */
export function formatarComSinal(valor: number): string {
  const sinal = valor > 0 ? '+' : valor < 0 ? '-' : ''
  return `${sinal}${formatarMilhoes(valor)}`
}

/** `78%` — percentual inteiro, usado em participações, atingimento e desvios contra meta. */
export function formatarPercentualInteiro(razao: number): string {
  return `${Math.round(razao * 100)}%`
}

/**
 * `-7,3%` / `+9,1%` — razão com uma casa e sinal explícito, no mesmo espírito de
 * `formatarComSinal`. Usado no delta percentual do Forecast (plano Task 7 Step 1, l.643).
 */
export function formatarPercentualComSinal(razao: number): string {
  const sinal = razao > 0 ? '+' : razao < 0 ? '-' : ''
  return `${sinal}${(Math.abs(razao) * 100).toFixed(1).replace('.', ',')}%`
}

/**
 * `02/09 · 10:00` — instante do histórico mockado (preview `index.html` l.389).
 *
 * Lê o literal ISO do snapshot em vez de converter fuso: o valor renderiza igual no
 * servidor e no cliente, sem divergência de hidratação e sem depender do fuso da máquina.
 */
export function formatarInstante(instante: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(instante)
  if (!partes) return instante
  return `${partes[3]}/${partes[2]} · ${partes[4]}:${partes[5]}`
}

/** `3 oportunidades` / `1 oportunidade` — contagem com o plural correto, sem string fixa. */
export function formatarOportunidades(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'oportunidade' : 'oportunidades'}`
}
