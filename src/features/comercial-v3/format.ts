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

const VALOR_OPORTUNIDADE = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
})

const ESPACO_COMUM = String.fromCharCode(32)
const ESPACO_NAO_SEPARAVEL = String.fromCharCode(160)

/** O fixture mede milhões; o detalhe mostra reais para conservar a comparação. */
export function formatarValorOportunidade(valorEmMilhoes: number): string {
  return VALOR_OPORTUNIDADE.format(valorEmMilhoes * 1_000_000)
}

/** Expand the fixture's millions into BRL without the compact display rounding. */
export function formatarMilhoesExpandido(valorEmMilhoes: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorEmMilhoes * 1_000_000)
}

/**
 * Valor em milhões (entrada do fixture) mostrado na regra compacta: `R$ 80 mil` abaixo de 1 mi,
 * `R$ 1,2 mi` acima. O sinal nunca aparece aqui; use `formatarComSinal` para deltas.
 */
export function formatarMilhoes(valor: number): string {
  return formatarRealCompacto(Math.abs(valor) * 1_000_000)
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

/**
 * Valor em reais compacto: `R$ 80 mil` abaixo de 1 mi, `R$ 1,2 mi` acima, `—` quando a carga
 * não traz o valor. Nunca arredonda valor pequeno para `R$ 0,00 mi`.
 */
export function formatarRealCompacto(valor: number | null): string {
  if (valor === null) return '—'
  const abs = Math.abs(valor)
  const sinal = valor < 0 ? '−' : ''
  // 999.500 e acima já sobem para milhões, para não exibir "R$ 1.000 mil".
  if (abs >= 999_500) return `${sinal}R$ ${(abs / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  // Intl usa espaço não separável (U+00A0) em "R$ 0"; troca por espaço comum para saída única.
  const bruto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(abs)
  return `${sinal}${bruto.split(ESPACO_NAO_SEPARAVEL).join(ESPACO_COMUM)}`
}

/**
 * Saldo de movimento, com sinal. Abaixo de R$ 10 mil fica em reais, sem
 * arredondar para milhar: o saldo existe para reconciliar com a curva, e
 * "−R$ 3 mil" no lugar de "−R$ 2.500" faria a conta não fechar na mesma tela.
 */
export function formatarSaldo(valor: number | null): string {
  if (valor === null) return '—'
  if (valor === 0) return formatarRealCompacto(0)
  const sinal = valor > 0 ? '+' : '−'
  const abs = Math.abs(valor)
  if (abs < 10_000) {
    return `${sinal}${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(abs).split(ESPACO_NAO_SEPARAVEL).join(ESPACO_COMUM)}`
  }
  return `${sinal}${formatarRealCompacto(abs)}`
}

/** `+R$ 80 mil` / `−R$ 1,2 mi` / `R$ 0` / `—`: valor com sinal para cartões e colunas Δ. */
export function formatarRealComSinal(valor: number | null): string {
  if (valor === null) return '—'
  if (valor === 0) return formatarRealCompacto(0)
  return `${valor > 0 ? '+' : '−'}${formatarRealCompacto(Math.abs(valor))}`
}

/** `3 oportunidades` / `1 oportunidade` — contagem com o plural correto, sem string fixa. */
export function formatarOportunidades(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'oportunidade' : 'oportunidades'}`
}
