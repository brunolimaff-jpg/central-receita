'use client'

import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChartNoAxesCombined } from 'lucide-react'
import { formatarMilhoes } from '../format'
import type { SemanaRow } from '../model'
import { suavizar } from './weekly-forecast-scene'

/** Posição semanal do snapshot; nenhuma série de delta por oportunidade é inferida. */
export function OpportunitiesForecastChart({ semanas }: { semanas: SemanaRow[] }) {
  const gradient = useId()
  const [pointerWeek, setPointerWeek] = useState<number | null>(null)
  const [focusedWeek, setFocusedWeek] = useState<number | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const currentIndex = semanas.findIndex((week) => week.current)
  const defaultIndex = currentIndex >= 0 ? currentIndex : semanas.findLastIndex((week) => week.closed)
  const pointerIndex = semanas.findIndex((week) => week.week === pointerWeek)
  const focusIndex = semanas.findIndex((week) => week.week === focusedWeek)
  const selectedIndex = semanas.findIndex((week) => week.week === selectedWeek)
  const activeIndex = pointerIndex >= 0 ? pointerIndex : focusIndex >= 0 ? focusIndex : selectedIndex >= 0 ? selectedIndex : defaultIndex
  const active = semanas[activeIndex]
  const shouldReduceMotion = useReducedMotion()
  const transition = shouldReduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 300, damping: 34 }
  const maximum = Math.max(...semanas.map((week) => week.forecast), 1) * 1.2
  const x = (index: number) => 46 + index * 474 / Math.max(semanas.length - 1, 1)
  const y = (value: number) => 157 - value / maximum * 126
  const closedPoints = semanas.flatMap((week, index) => week.closed ? [[x(index), y(week.forecast)] as [number, number]] : [])
  const path = suavizar(closedPoints)
  const last = closedPoints.at(-1)

  return (
    <section className="revenue-panel min-w-0 rounded-[14px] border border-white/90 bg-white/95 p-4">
      <div className="flex items-start gap-2.5"><ChartNoAxesCombined aria-hidden className="size-5 shrink-0 text-[#009b83]" /><div><h2 className="text-[14px] font-bold text-[#0d2340]">Evolução do forecast</h2><p className="mt-1 text-[11px] text-[#6c7e91]">Posição semanal demonstrativa · histórico por oportunidade indisponível.</p></div></div>
      {semanas.length > 0 ? <>
        <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 text-[11px] text-[#405872]"><span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-4 bg-[#008b82]" />Forecast no fechamento</span><span aria-live="polite" className="num">{active ? <motion.span key={active.week} initial={shouldReduceMotion ? false : { opacity: 0.7, y: 2 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="inline-block">{`${active.label} · ${active.closed ? formatarMilhoes(active.forecast) : 'Corte pendente'}`}</motion.span> : 'Selecione uma semana'}</span></div>
        <svg viewBox="0 0 554 190" className="mt-1 h-[170px] w-full" role="img" aria-label="Trajetória do forecast nas semanas com fechamento disponível">
          <defs><linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#39bdaa" stopOpacity="0.32" /><stop offset="1" stopColor="#39bdaa" stopOpacity="0.03" /></linearGradient></defs>
          {[0, 1, 2, 3, 4].map((tick) => <g key={tick}><line x1="40" x2="532" y1={157 - tick * 31.5} y2={157 - tick * 31.5} stroke="#dce7f1" strokeDasharray="3 3" /><text x="30" y={161 - tick * 31.5} textAnchor="end" fill="#52677f" fontSize="11" fontWeight="600">{(maximum * tick / 4).toFixed(1).replace('.', ',')}</text></g>)}
          {semanas.map((week, index) => <line key={week.week} x1={x(index)} x2={x(index)} y1="25" y2="157" stroke="#e2ebf3" strokeDasharray="3 3" />)}
          {last && <path d={`${path} L ${last[0]} 157 L ${closedPoints[0][0]} 157 Z`} fill={`url(#${gradient})`} />}
          <path d={path} fill="none" stroke="#007f7b" strokeWidth="3" strokeLinecap="round" />
          {active?.closed && <motion.line initial={false} animate={{ x1: x(activeIndex), x2: x(activeIndex) }} transition={transition} y1="20" y2="157" stroke="#009b83" strokeDasharray="4 3" />}
          {semanas.map((week, index) => week.closed && <g key={week.week}><circle cx={x(index)} cy={y(week.forecast)} r="5" fill="white" stroke="#009b83" strokeWidth="2" /><circle cx={x(index)} cy={y(week.forecast)} r="2" fill="#009b83" /></g>)}
          {active?.closed && <motion.circle initial={false} animate={{ cx: x(activeIndex), cy: y(active.forecast) }} transition={transition} r="8" fill="white" stroke="#009b83" strokeWidth="3" />}
          <text x="12" y="96" transform="rotate(-90 12 96)" textAnchor="middle" fill="#52677f" fontSize="11" fontWeight="600">R$ (mi)</text>
        </svg>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${semanas.length}, minmax(0, 1fr))` }}>{semanas.map((week, index) => <button key={week.week} type="button" onPointerEnter={(event) => { if (event.pointerType !== 'touch') setPointerWeek(week.week) }} onPointerLeave={() => setPointerWeek(null)} onFocus={() => setFocusedWeek(week.week)} onBlur={() => setFocusedWeek(null)} onClick={() => setSelectedWeek(week.week)} onKeyDown={(event) => { if (event.key === 'Escape') { setSelectedWeek(null); setPointerWeek(null); setFocusedWeek(null) } }} aria-pressed={week.week === selectedWeek} className={`rounded-[6px] px-1 py-1.5 text-center text-[11px] hover:bg-[#edf8f5] focus-visible:outline-2 focus-visible:outline-[#086b6b] ${index === activeIndex ? 'bg-[#edf8f5] font-bold text-[#00856f]' : 'text-[#52677f]'}`}><span className="block">{week.label}{week.current ? ' · atual' : ''}</span><span className="num mt-0.5 block">{week.rangeLabel}</span><span className="mt-0.5 block text-[11px]">{week.closed ? `Corte dia ${week.cutoffDay}` : 'Corte pendente'}</span></button>)}</div>
      </> : <p className="flex min-h-[210px] items-center justify-center text-[12px] text-[#63748a]">Histórico semanal indisponível neste recorte.</p>}
    </section>
  )
}
