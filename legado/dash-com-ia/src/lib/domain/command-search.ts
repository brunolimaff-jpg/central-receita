export function pontuarBuscaComando(value: string, search: string, keywords: string[] = []): number {
  const termos = normalizar(search).split(/\s+/).filter(Boolean)
  if (termos.length === 0) return 1

  const texto = normalizar([value, ...keywords].join(' '))
  return termos.every((termo) => texto.includes(termo)) ? 1 : 0
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
