export interface MovimentoForecast {
  dias: number
  delta: number
}

export function mancheteMudancaForecast(
  movimento: MovimentoForecast | null | undefined,
  formatarMoeda: (valor: number) => string,
  erro = false,
): string {
  if (erro) return 'Não foi possível carregar o movimento da projeção móvel'
  if (!movimento) return 'O movimento da projeção móvel ainda não está disponível'
  if (movimento.delta < 0) {
    return `Projeção móvel dos próximos ${movimento.dias} dias caiu ${formatarMoeda(Math.abs(movimento.delta))} desde a leitura anterior`
  }
  if (movimento.delta > 0) {
    return `Projeção móvel dos próximos ${movimento.dias} dias cresceu ${formatarMoeda(movimento.delta)} desde a leitura anterior`
  }
  return `Projeção móvel dos próximos ${movimento.dias} dias ficou estável desde a leitura anterior`
}
