export function nearestChartPoint(x: number, positions: number[]): number {
  if (!Number.isFinite(x) || positions.length === 0) return -1
  return positions.reduce((best, position, index) => Math.abs(position - x) < Math.abs(positions[best] - x) ? index : best, 0)
}

export function countAxisMaximum(values: number[]): number {
  return Math.max(4, Math.ceil(Math.max(0, ...values.filter(Number.isFinite)) / 4) * 4)
}

/**
 * Régua de valores do eixo Y: parte do zero e topo legível em até cinco
 * divisões. Sem valores, devolve topo 1 para não dividir por zero.
 */
export function escalaDeValores(values: number[]): { topo: number; passo: number; divisoes: number } {
  const maior = Math.max(0, ...values.filter(Number.isFinite))
  if (maior <= 0) return { topo: 1, passo: 0.25, divisoes: 4 }
  const magnitude = 10 ** Math.floor(Math.log10(maior))
  const passos = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10].map(multiplicador => multiplicador * magnitude)
  const passo = passos.find(candidato => Math.ceil(maior / candidato) <= 5) ?? passos[passos.length - 1]
  const divisoes = Math.max(Math.ceil(maior / passo), 1)
  return { topo: passo * divisoes, passo, divisoes }
}

export function dateChartPositions(dates: string[], left: number, right: number): number[] {
  if (dates.length === 0) return []
  const times = dates.map(date => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data inválida no gráfico')
    const time = Date.parse(date + 'T00:00:00Z')
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) throw new Error('Data inválida no gráfico')
    return time
  })
  const first = times.reduce((minimum, time) => Math.min(minimum, time), Infinity)
  const last = times.reduce((maximum, time) => Math.max(maximum, time), -Infinity)
  const span = last - first
  return times.map(time => span === 0 ? (left + right) / 2 : left + (time - first) / span * (right - left))
}

export function lineChartPath(points: Array<[number, number]>): string {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
}

/** Curva de Bézier entre pontos consecutivos, com controle horizontal — a suavização do mês. */
export function suavizar(pontos: Array<[number, number]>): string {
  if (pontos.length === 0) return ''
  if (pontos.length === 1) return 'M ' + pontos[0][0] + ' ' + pontos[0][1]
  let caminho = 'M ' + pontos[0][0] + ' ' + pontos[0][1]
  for (let indice = 0; indice < pontos.length - 1; indice += 1) {
    const [x0, y0] = pontos[indice]
    const [x1, y1] = pontos[indice + 1]
    const passo = (x1 - x0) / 3
    caminho += ' C ' + (x0 + passo) + ' ' + y0 + ' ' + (x1 - passo) + ' ' + y1 + ' ' + x1 + ' ' + y1
  }
  return caminho
}

/**
 * Corta a linha onde falta valor: nulo é ausência, não zero. Cada segmento
 * contínuo é um traço próprio, e um ponto isolado continua sendo desenhado.
 */
export function lineChartSegments(points: Array<[number, number | null]>): Array<Array<[number, number]>> {
  const segments: Array<Array<[number, number]>> = []
  let current: Array<[number, number]> = []
  for (const [x, y] of points) {
    if (y === null) {
      if (current.length > 0) segments.push(current)
      current = []
    } else {
      current.push([x, y])
    }
  }
  if (current.length > 0) segments.push(current)
  return segments
}

/**
 * No máximo seis marcas de eixo, sempre com a primeira e a última. Com até seis
 * pontos, todas aparecem; acima disso, escolhe por índice.
 */
export function thinAxisPositions(count: number): number[] {
  if (count <= 0) return []
  if (count <= 6) return Array.from({ length: count }, (_, index) => index)
  return Array.from({ length: 6 }, (_, index) => Math.round(index * (count - 1) / 5))
}

export type ChartLabel = { id: string; x: number; y: number; valor: number }

/**
 * Anti-sobreposição dos rótulos diretos: dois rótulos a menos de 12px em ambos
 * os eixos colidem, e o de menor valor cede — aparece só no hover. Rótulos
 * aceitos servem de âncora para os seguintes.
 */
export function separarRotulos(labels: ChartLabel[], minDistance = 12): string[] {
  const visible: string[] = []
  const kept: ChartLabel[] = []
  const byValue = [...labels].sort((a, b) => b.valor - a.valor)
  for (const label of byValue) {
    const collides = kept.some(other => Math.abs(label.x - other.x) < minDistance && Math.abs(label.y - other.y) < minDistance)
    if (!collides) {
      kept.push(label)
      visible.push(label.id)
    }
  }
  return visible
}

export function stepChartPath(points: Array<[number, number]>): string {
  if (points.length === 0) return ''
  return `M ${points[0][0]} ${points[0][1]}` + points.slice(1).map(([x, y]) => ` H ${x} V ${y}`).join('')
}

