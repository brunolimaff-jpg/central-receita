export function calculateJourneyConversion(value: number, previousValue: number): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(previousValue) || value < 0 || previousValue <= 0) return null
  return Math.round(value / previousValue * 100)
}

export function largestJourneyConversionDrop(stages: Array<{ label: string; conversion: number | null }>): {
  from: string
  to: string
  fromRate: number
  toRate: number
  delta: number
} | null {
  const measured = stages.filter((stage): stage is { label: string; conversion: number } => Number.isFinite(stage.conversion))
  let largest: ReturnType<typeof largestJourneyConversionDrop> = null

  for (let index = 1; index < measured.length; index++) {
    const previous = measured[index - 1]
    const current = measured[index]
    const delta = current.conversion - previous.conversion
    if (delta < 0 && (!largest || delta < largest.delta)) {
      largest = { from: previous.label, to: current.label, fromRate: previous.conversion, toRate: current.conversion, delta }
    }
  }

  return largest
}

export function calculateJourneyDaysChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || current < 0 || previous <= 0) return null
  return Math.round((current / previous - 1) * 100)
}
