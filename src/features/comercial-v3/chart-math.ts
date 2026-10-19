export function nearestChartPoint(x: number, positions: number[]): number {
  if (!Number.isFinite(x) || positions.length === 0) return -1
  return positions.reduce((best, position, index) => Math.abs(position - x) < Math.abs(positions[best] - x) ? index : best, 0)
}

export function countAxisMaximum(values: number[]): number {
  return Math.max(4, Math.ceil(Math.max(0, ...values.filter(Number.isFinite)) / 4) * 4)
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

export function stepChartPath(points: Array<[number, number]>): string {
  if (points.length === 0) return ''
  return `M ${points[0][0]} ${points[0][1]}` + points.slice(1).map(([x, y]) => ` H ${x} V ${y}`).join('')
}

