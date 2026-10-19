'use client'

import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChartNoAxesCombined } from 'lucide-react'
import { countAxisMaximum, dateChartPositions, lineChartPath, nearestChartPoint, stepChartPath } from '../chart-math'
import { formatarMilhoes } from '../format'
import type { SemanaRow } from '../model'

type OpportunitiesForecastChartProps = {
  semanas: SemanaRow[]
  mode?: 'weekly' | 'dueDates'
  onSelectWeek?: (week: number) => void
  onClearSelection?: () => void
}

const WIDTH = 554
const HEIGHT = 190
const PLOT_LEFT = 46
const PLOT_RIGHT = 532
const PLOT_TOP = 25
const PLOT_BOTTOM = 157

export function OpportunitiesForecastChart({ semanas, mode = 'weekly', onSelectWeek, onClearSelection }: OpportunitiesForecastChartProps) {
  const dueDates = mode === 'dueDates'
  const [pointerWeek, setPointerWeek] = useState<number | null>(null)
  const [focusedWeek, setFocusedWeek] = useState<number | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const reducedMotion = useReducedMotion()
  const transition = { duration: reducedMotion ? 0 : 0.12 }
  const values = semanas.map(({ forecast }) => forecast)
  const maximum = dueDates
    ? countAxisMaximum(values)
    : Math.max(...values.filter(Number.isFinite), 1) * 1.15
  const chartX = (index: number) => PLOT_LEFT + index * (PLOT_RIGHT - PLOT_LEFT) / Math.max(semanas.length - 1, 1)
  const datePositions = dueDates && semanas.length > 0 && semanas.every(({ date }) => date)
    ? dateChartPositions(semanas.map(({ date }) => date as string), PLOT_LEFT, PLOT_RIGHT)
    : null
  const x = (index: number) => datePositions?.[index] ?? chartX(index)
  const y = (value: number) => PLOT_BOTTOM - Math.max(0, Math.min(maximum, value)) / maximum * (PLOT_BOTTOM - PLOT_TOP)
  const points = semanas.map((week, index) => [x(index), y(week.forecast)] as [number, number])
  const closedPoints = points.filter((_, index) => semanas[index].closed)
  const path = dueDates ? stepChartPath(points) : lineChartPath(closedPoints)
  const currentIndex = semanas.findIndex((week) => week.current)
  const defaultIndex = currentIndex >= 0 ? currentIndex : semanas.findLastIndex((week) => week.closed)
  const indexForWeek = (week: number | null) => semanas.findIndex((item) => item.week === week)
  const pointerIndex = indexForWeek(pointerWeek)
  const focusIndex = indexForWeek(focusedWeek)
  const selectedIndex = indexForWeek(selectedWeek)
  const activeIndex = pointerIndex >= 0 ? pointerIndex : focusIndex >= 0 ? focusIndex : selectedIndex >= 0 ? selectedIndex : defaultIndex
  const active = semanas[activeIndex]
  const marker = active && (dueDates || active.closed) ? points[activeIndex] : null
  const valueLabel = (value: number) => dueDates
    ? `${value.toLocaleString('pt-BR')} ${value === 1 ? 'oportunidade' : 'oportunidades'}`
    : formatarMilhoes(value)
  const inspectAtPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') return
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    if (point.x < PLOT_LEFT || point.x > PLOT_RIGHT || point.y < PLOT_TOP || point.y > PLOT_BOTTOM) {
      setPointerWeek(null)
      return
    }
    const index = nearestChartPoint(point.x, points.map(([pointX]) => pointX))
    setPointerWeek(index >= 0 ? semanas[index].week : null)
  }
  const selectAtPoint = (clientX: number, clientY: number, svg: SVGSVGElement) => {
    const matrix = svg.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
    if (point.x < PLOT_LEFT || point.x > PLOT_RIGHT || point.y < PLOT_TOP || point.y > PLOT_BOTTOM) return
    const index = nearestChartPoint(point.x, points.map(([pointX]) => pointX))
    if (index < 0) return
    const week = semanas[index].week
    setSelectedWeek(week)
    onSelectWeek?.(week)
  }
  const navigatePoint = (event: KeyboardEvent<SVGSVGElement>) => {
    setPointerWeek(null)
    if (event.key === 'Escape') {
      setSelectedWeek(null)
      setPointerWeek(null)
      setFocusedWeek(null)
      onClearSelection?.()
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      const keyboardIndex = focusIndex >= 0 ? focusIndex : activeIndex
      if (keyboardIndex >= 0) {
        event.preventDefault()
        const week = semanas[keyboardIndex].week
        setSelectedWeek(week)
        onSelectWeek?.(week)
      }
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const startingIndex = focusIndex >= 0 ? focusIndex : activeIndex
    const next = startingIndex < 0
      ? 0
      : Math.max(0, Math.min(semanas.length - 1, startingIndex + (event.key === 'ArrowRight' ? 1 : -1)))
    setFocusedWeek(semanas[next]?.week ?? null)
  }

  return (
    <section className="revenue-panel min-w-0 rounded-[14px] border border-white/90 bg-white/95 p-4">
      <div className="flex items-start gap-2.5">
        <ChartNoAxesCombined aria-hidden className="size-5 shrink-0 text-[#009b83]" />
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold text-[#0d2340]">{dueDates ? 'Previsão por data de fechamento' : 'Evolução do forecast'}</h2>
          <p className="mt-1 text-[13px] text-[#6c7e91]">
            {dueDates ? 'Oportunidades acumuladas por data prevista · selecione uma data para conferir os registros.' : 'Posição semanal demonstrativa · histórico por oportunidade indisponível.'}
          </p>
        </div>
      </div>

      {semanas.length > 0 ? <>
        <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 text-[12px] text-[#405872]">
          <span>{dueDates ? 'Contagem acumulada · oportunidades' : 'Forecast nos cortes concluídos · R$ mi'}</span>
          <span aria-live="polite" className="num font-semibold text-[#0d2340]">
            {active ? `${active.rangeLabel || active.label} · ${dueDates || active.closed ? valueLabel(active.forecast) : 'Corte pendente'}` : 'Nenhum corte concluído'}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="group"
          tabIndex={0}
          aria-label={dueDates ? 'Quantidade acumulada de oportunidades por data prevista; posições no tempo seguem as datas reais.' : 'Trajetória do forecast nas semanas com fechamento disponível.'}
          onPointerMove={inspectAtPointer}
          onPointerLeave={() => setPointerWeek(null)}
          onFocus={() => { setPointerWeek(null); if (focusedWeek === null && activeIndex >= 0) setFocusedWeek(semanas[activeIndex].week) }}
          onBlur={() => setFocusedWeek(null)}
          onClick={(event) => selectAtPoint(event.clientX, event.clientY, event.currentTarget)}
          onKeyDown={navigatePoint}
          className="mx-auto mt-1 block h-auto w-full max-w-[680px] focus-visible:outline-2 focus-visible:outline-[#086b6b]"
        >
          {[0, 1, 2, 3, 4].map((tick) => {
            const value = maximum * tick / 4
            const tickY = y(value)
            return <g key={tick}>
              <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={tickY} y2={tickY} stroke="#dce7f1" strokeDasharray="3 3" />
              <text x={PLOT_LEFT - 8} y={tickY + 4} textAnchor="end" fill="#52677f" fontSize="11" fontWeight="600">{dueDates ? Math.round(value) : value.toFixed(1).replace('.', ',')}</text>
            </g>
          })}
          {semanas.map((week, index) => <line key={week.week} x1={x(index)} x2={x(index)} y1={PLOT_TOP} y2={PLOT_BOTTOM} stroke="#e2ebf3" strokeDasharray="3 3" />)}
          <path d={path} fill="none" stroke="#007f7b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {marker && <g aria-hidden="true" pointerEvents="none">
            <motion.line initial={false} animate={{ x1: marker[0], x2: marker[0] }} transition={transition} y1={PLOT_TOP} y2={PLOT_BOTTOM} stroke="#ed5267" strokeDasharray="4 3" />
            <motion.circle initial={false} animate={{ cx: marker[0], cy: marker[1] }} transition={transition} r="7" fill="white" stroke="#ed5267" strokeWidth="3" />
          </g>}
          {dueDates && semanas.map((week, index) => index === 0 || index === semanas.length - 1 ? <text key={`date-axis-${week.week}`} x={x(index)} y={HEIGHT - 5} textAnchor={semanas.length === 1 ? 'middle' : index === 0 ? 'start' : 'end'} fill="#52677f" fontSize="10" fontWeight="600">{week.rangeLabel || week.label}</text> : null)}
          {!dueDates && closedPoints.length === 0 && <text x={(PLOT_LEFT + PLOT_RIGHT) / 2} y={(PLOT_TOP + PLOT_BOTTOM) / 2} textAnchor="middle" fill="#63748a" fontSize="12">Sem cortes concluídos</text>}
        </svg>
        <div
          className={dueDates ? 'flex min-w-0 max-w-full gap-1 overflow-x-auto scroll-discreta' : 'grid gap-1'}
          style={dueDates ? undefined : { gridTemplateColumns: `repeat(${semanas.length}, minmax(0, 1fr))` }}
          aria-label={dueDates ? 'Inspecionar datas de fechamento' : 'Inspecionar cortes semanais'}
        >
          {semanas.map((week, index) => <button
            key={week.week}
            type="button"
            onPointerEnter={(event) => { if (event.pointerType !== 'touch') setPointerWeek(week.week) }}
            onPointerLeave={() => setPointerWeek(null)}
            onFocus={() => { setPointerWeek(null); setFocusedWeek(week.week) }}
            onBlur={() => setFocusedWeek(null)}
            onClick={() => { setSelectedWeek(week.week); onSelectWeek?.(week.week) }}
            onKeyDown={(event) => { if (event.key === 'Escape') { setSelectedWeek(null); setPointerWeek(null); setFocusedWeek(null); onClearSelection?.() } }}
            aria-pressed={week.week === selectedWeek}
            aria-label={`Inspecionar ${week.rangeLabel || week.label}: ${dueDates || week.closed ? valueLabel(week.forecast) : 'corte pendente'}`}
            className={`min-w-16 flex-1 rounded-[6px] px-1 py-1.5 text-center text-[12px] hover:bg-[#edf8f5] focus-visible:outline-2 focus-visible:outline-[#086b6b] ${index === activeIndex ? 'bg-[#edf8f5] font-bold text-[#00856f]' : 'text-[#52677f]'}`}
          >
            <span className="block whitespace-nowrap">{week.rangeLabel || week.label}</span>
            {!dueDates && <span className="mt-0.5 block text-[11px]">{week.closed ? valueLabel(week.forecast) : 'Corte pendente'}</span>}
          </button>)}
        </div>
      </> : <p className="flex min-h-[140px] items-center justify-center text-[12px] text-[#63748a]">Histórico indisponível neste recorte.</p>}
    </section>
  )
}
