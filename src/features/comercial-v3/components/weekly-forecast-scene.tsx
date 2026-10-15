'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { formatarMilhoes, formatarMilhoesExpandido, formatarPercentualInteiro } from '../format'
import type { SemanaRow } from '../model'

const WIDTH = 820
const HEIGHT = 236
const PLOT_LEFT = 44
const PLOT_RIGHT = 792
const PLOT_TOP = 22
const PLOT_BOTTOM = 174

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

type WeeklyForecastSceneProps = {
  semanas: SemanaRow[]
  semanaAtual: number | null
  meta: number
  forecastAtual: number
  realizado: number
}

export function WeeklyForecastScene({
  semanas,
  semanaAtual,
  meta,
  forecastAtual,
  realizado,
}: WeeklyForecastSceneProps) {
  const indiceAtual = semanaAtual === null ? semanas.findIndex((semana) => !semana.closed) : semanas.findIndex((semana) => semana.week === semanaAtual)
  const [semanaPointer, setSemanaPointer] = useState<number | null>(null)
  const [semanaFocada, setSemanaFocada] = useState<number | null>(null)
  const [semanaEscolhida, setSemanaEscolhida] = useState<number | null>(null)
  const indicePointer = semanas.findIndex((semana) => semana.week === semanaPointer)
  const indiceFoco = semanas.findIndex((semana) => semana.week === semanaFocada)
  const indiceEscolhido = semanas.findIndex((semana) => semana.week === semanaEscolhida)
  const indiceSelecionado = indicePointer >= 0 ? indicePointer : indiceFoco >= 0 ? indiceFoco : indiceEscolhido >= 0 ? indiceEscolhido : indiceAtual
  const semanaSelecionada = semanas[indiceSelecionado]
  const viewportRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ left: 8, width: 264 })
  const shouldReduceMotion = useReducedMotion()
  const transition = shouldReduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 300, damping: 34 }
  const maiorValor = Math.max(meta, forecastAtual, ...semanas.map((semana) => Math.max(semana.forecast, semana.pace)), 1)
  const maxEixo = Math.max(3, Math.ceil(maiorValor / 3) * 3)
  const eixoX = (indice: number) => PLOT_LEFT + (indice + 0.5) * (PLOT_RIGHT - PLOT_LEFT) / Math.max(semanas.length, 1)
  const eixoY = (valor: number) => PLOT_BOTTOM - (valor / maxEixo) * (PLOT_BOTTOM - PLOT_TOP)
  const pontosForecast = semanas.map((semana, indice) => [eixoX(indice), eixoY(semana.forecast)] as [number, number])
  const pontosPace = semanas.map((semana, indice) => [eixoX(indice), eixoY(semana.pace)] as [number, number])
  const fechados = pontosForecast.filter((_, indice) => semanas[indice].closed)
  const linhaForecast = suavizar(fechados)
  const areaForecast = fechados.length
    ? linhaForecast + ' L ' + fechados[fechados.length - 1][0] + ' ' + PLOT_BOTTOM + ' L ' + fechados[0][0] + ' ' + PLOT_BOTTOM + ' Z'
    : ''
  const marcador = indiceSelecionado >= 0 && semanaSelecionada?.closed ? pontosForecast[indiceSelecionado] : null
  const valorSelecionado = semanaSelecionada?.forecast ?? forecastAtual
  const desvioMeta = meta > 0 ? (valorSelecionado - meta) / meta : 0
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const updatePosition = () => {
      const width = Math.min(264, Math.max(0, viewport.clientWidth - 16))
      const viewportRect = viewport.getBoundingClientRect()
      const svgRect = svgRef.current?.getBoundingClientRect()
      const scrollLeft = viewport.scrollLeft
      const center = marcador && svgRect
        ? svgRect.left - viewportRect.left + svgRect.width * marcador[0] / WIDTH
        : viewport.clientWidth / 2
      const minLeft = scrollLeft + 8
      const maxLeft = Math.max(minLeft, scrollLeft + viewport.clientWidth - width - 8)
      setTooltipPosition({ left: Math.max(minLeft, Math.min(center + scrollLeft - width / 2, maxLeft)), width })
    }
    updatePosition()
    const observer = new ResizeObserver(updatePosition)
    observer.observe(viewport)
    viewport.addEventListener('scroll', updatePosition, { passive: true })
    return () => {
      observer.disconnect()
      viewport.removeEventListener('scroll', updatePosition)
    }
  }, [marcador?.[0]])

  return (
    <div className="grid min-w-0 items-stretch gap-2.5 min-[1550px]:grid-cols-[minmax(0,1fr)_150px]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#33466c]" aria-label="Significado das linhas">
          <span className="flex items-center gap-2"><span aria-hidden className="w-6 border-t-[3px] border-[#009b83]" />Forecast no corte fechado</span>
          <span className="flex items-center gap-2"><span aria-hidden className="w-6 border-t-2 border-dashed border-[#8299b3]" />Ritmo proporcional da meta</span>
        </div>
        <div
          ref={viewportRef}
          role="region"
          aria-label="Gráfico semanal do forecast, com rolagem horizontal quando necessário"
          tabIndex={0}
          className="relative min-w-0 overflow-x-auto overflow-y-hidden scroll-discreta focus-visible:outline-2 focus-visible:outline-[#086b6b]"
        >
          {semanas.length > 0 ? (
            <svg
              ref={svgRef}
              role="group"
              aria-label="Forecast acumulado e ritmo da meta nos cortes de sexta-feira"
              viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT}
              className="block h-[224px] w-full min-w-[520px] overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="forecast-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18b995" stopOpacity=".28" />
                  <stop offset="100%" stopColor="#18b995" stopOpacity=".025" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map((tick) => {
                const value = maxEixo * tick / 4
                const y = eixoY(value)
                return (
                  <g key={tick}>
                    <line x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y} stroke="#dce6e9" strokeDasharray="3 5" />
                    <text x="3" y={y + 4} fill="#52677f" fontSize="11" fontWeight="600">{Number.isInteger(value) ? value : value.toFixed(1).replace('.', ',')}</text>
                  </g>
                )
              })}
              <text x="3" y="14" fill="#52677f" fontSize="11" fontWeight="600">R$ mi</text>
              {semanas.map((semana, indice) => (
                <line
                  key={'cut-' + semana.week}
                  x1={PLOT_LEFT + (indice * (PLOT_RIGHT - PLOT_LEFT) / semanas.length)}
                  y1={PLOT_TOP}
                  x2={PLOT_LEFT + (indice * (PLOT_RIGHT - PLOT_LEFT) / semanas.length)}
                  y2={PLOT_BOTTOM}
                  stroke="#bdcdd2"
                  strokeDasharray="2 6"
                />
              ))}
              <path d={areaForecast} fill="url(#forecast-area)" />
              <path d={suavizar(pontosPace)} fill="none" stroke="#8299b3" strokeWidth="2" strokeDasharray="6 5" />
              <path d={linhaForecast} fill="none" stroke="#009b83" strokeWidth="3" strokeLinecap="round" />
              {pontosForecast.map(([x, y], indice) => semanas[indice].closed ? (
                <circle
                  key={'pin-' + semanas[indice].week}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#009b83"
                  stroke="white"
                  strokeWidth="2.5"
                  tabIndex={0}
                  role="button"
                  aria-label={'Inspecionar ' + semanas[indice].label + ', ' + semanas[indice].rangeLabel + ', ' + formatarMilhoes(semanas[indice].forecast)}
                  aria-pressed={semanaEscolhida === semanas[indice].week}
                  onPointerEnter={(event) => { if (event.pointerType !== 'touch') setSemanaPointer(semanas[indice].week) }}
                  onPointerLeave={() => setSemanaPointer(null)}
                  onFocus={() => setSemanaFocada(semanas[indice].week)}
                  onBlur={() => setSemanaFocada(null)}
                  onClick={() => setSemanaEscolhida(semanas[indice].week)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSemanaEscolhida(semanas[indice].week)
                    }
                    if (event.key === 'Escape') {
                      setSemanaEscolhida(null)
                      setSemanaPointer(null)
                      setSemanaFocada(null)
                    }
                  }}
                  className="cursor-pointer focus-visible:outline-2 focus-visible:outline-[#086b6b]"
                />
              ) : null)}
              {marcador && (
                <g aria-hidden="true" pointerEvents="none">
                  <motion.line initial={false} y1={PLOT_TOP} y2={PLOT_BOTTOM} animate={{ x1: marcador[0], x2: marcador[0] }} transition={transition} stroke="#ed5267" strokeWidth="1.5" />
                  <motion.circle initial={false} r="11" animate={{ cx: marcador[0], cy: marcador[1] }} transition={transition} fill="white" stroke="#ed5267" strokeWidth="3.5" />
                  <motion.circle initial={false} r="3.5" animate={{ cx: marcador[0], cy: marcador[1] }} transition={transition} fill="#ed5267" />
                </g>
              )}
            </svg>
          ) : (
            <div className="grid h-[224px] place-items-center rounded-[10px] bg-white/45 px-4 text-center text-[12px] text-[#5c6f87]">
              Histórico semanal indisponível para esta combinação de filtros.
            </div>
          )}
          {semanaSelecionada && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={false}
              animate={{ x: tooltipPosition.left }}
              transition={transition}
              style={{ left: 0, width: tooltipPosition.width }}
              className="pointer-events-none absolute top-2 z-10 box-border min-w-0 rounded-[10px] border border-white/90 bg-white/95 px-3 py-2 shadow-[0_8px_24px_rgba(48,88,112,0.12)]"
            >
              <motion.div
                key={semanaSelecionada.week}
                initial={shouldReduceMotion ? false : { opacity: 0.7, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
              >
                <small className="block break-words text-[11px] leading-4 text-[#52677f]">{semanaSelecionada.rangeLabel}</small>
                <strong className="num mt-0.5 block break-words text-[16px] font-bold leading-5 text-[#10294c]">
                  {semanaSelecionada.closed ? formatarMilhoesExpandido(valorSelecionado) : 'Corte pendente'}
                </strong>
                <span className={'num mt-0.5 block break-words text-[11px] font-bold leading-4 ' + (semanaSelecionada.closed ? (desvioMeta < 0 ? 'text-[#d33d54]' : 'text-[#00856f]') : 'text-[#8a5a00]')}>
                  {semanaSelecionada.closed ? formatarPercentualInteiro(desvioMeta) + ' vs. meta' : 'Aguardando fechamento de sexta'}
                </span>
                <small className="mt-0.5 block break-words text-[12px] leading-4 text-[#43556b]">Ritmo da meta: {formatarMilhoesExpandido(semanaSelecionada.pace)}</small>
                <small className="block break-words text-[11px] leading-4 text-[#52677f]">Realizado integrado: posição atual, sem série semanal.</small>
              </motion.div>
            </motion.div>
          )}
        </div>
        <p className="mt-2 text-xs leading-5 text-[#52677f]">Demonstração · linha verde: previsão nos cortes concluídos. Tracejada: progresso esperado da meta, não o congelado. Passe o mouse, use Tab ou selecione uma sexta-feira para comparar os valores.</p>
        <div aria-label="Inspecionar cortes semanais" className="grid grid-cols-4 gap-0.5 px-1">
          {semanas.map((semana, indice) => (
            <button
              key={semana.week}
              type="button"
              onPointerEnter={(event) => { if (event.pointerType !== 'touch') setSemanaPointer(semana.week) }}
              onPointerLeave={() => setSemanaPointer(null)}
              onFocus={() => setSemanaFocada(semana.week)}
              onBlur={() => setSemanaFocada(null)}
              onClick={() => setSemanaEscolhida(semana.week)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSemanaEscolhida(null)
                  setSemanaPointer(null)
                  setSemanaFocada(null)
                }
              }}
              aria-pressed={semanaEscolhida === semana.week}
              aria-label={'Inspecionar ' + semana.label + ', ' + semana.rangeLabel}
              className="border-l border-dashed border-[#b9cbd0] px-1 pt-1 text-center text-[11px] transition-colors hover:bg-white/55 focus-visible:outline-2 focus-visible:outline-[#086b6b] last:border-r"
            >
              <strong className={semana.current ? 'block text-[11px] text-[#087d6a]' : 'block text-[11px] text-[#405872]'}>
                {semana.rangeLabel.replace('Sex, ', 'Sex ')}
              </strong>
              {!semana.closed && <span className="block text-[11px] text-[#8a5a00]">Pendente</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-[#e8eef0] pt-2 lg:grid-cols-1 lg:content-center lg:gap-3 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
        <Metric label="Meta do período" value={meta} color="text-[#415674]" />
        <Metric label="Forecast atual" value={forecastAtual} color="text-[#008c77]" />
        <div className="min-w-0">
          <span className="text-[11px] leading-4 text-[#52677f]">Realizado · posição atual</span>
          <strong className="num block truncate text-[15px] font-bold text-[#10294c]">{formatarMilhoes(realizado)}</strong>
          <small className="block text-[11px] leading-4 text-[#52677f]">Sem série semanal comprovada</small>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="min-w-0">
      <span className="text-[11px] leading-4 text-[#52677f]">{label}</span>
      <strong className={'num block truncate text-[15px] font-bold ' + color}>{formatarMilhoes(value)}</strong>
    </div>
  )
}
