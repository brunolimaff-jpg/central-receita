'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { lineChartPath, nearestChartPoint } from '../chart-math'
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
  const inspecting = indicePointer >= 0 || indiceFoco >= 0 || indiceEscolhido >= 0
  const shouldReduceMotion = useReducedMotion()
  const transition = { duration: shouldReduceMotion ? 0 : 0.12 }
  const maiorValor = Math.max(meta, forecastAtual, ...semanas.map((semana) => Math.max(semana.forecast, semana.pace)), 1)
  const maxEixo = Math.max(3, Math.ceil(maiorValor / 3) * 3)
  const eixoX = (indice: number) => PLOT_LEFT + (indice + 0.5) * (PLOT_RIGHT - PLOT_LEFT) / Math.max(semanas.length, 1)
  const eixoY = (valor: number) => PLOT_BOTTOM - (valor / maxEixo) * (PLOT_BOTTOM - PLOT_TOP)
  const pontosForecast = semanas.map((semana, indice) => [eixoX(indice), eixoY(semana.forecast)] as [number, number])
  const pontosPace = semanas.map((semana, indice) => [eixoX(indice), eixoY(semana.pace)] as [number, number])
  const fechados = pontosForecast.filter((_, indice) => semanas[indice].closed)
  const linhaForecast = lineChartPath(fechados)
  const marcador = indiceSelecionado >= 0 && semanaSelecionada?.closed ? pontosForecast[indiceSelecionado] : null
  const valorSelecionado = semanaSelecionada?.forecast ?? forecastAtual
  const desvioMeta = meta > 0 ? (valorSelecionado - meta) / meta : null
  return (
    <div className="grid min-w-0 items-stretch gap-2.5 min-[1550px]:grid-cols-[minmax(0,1fr)_150px]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#33466c]" aria-label="Significado das linhas">
          <span className="flex items-center gap-2"><span aria-hidden className="w-6 border-t-[3px] border-[#009b83]" />Forecast no corte fechado</span>
          <span className="flex items-center gap-2"><span aria-hidden className="w-6 border-t-2 border-dashed border-[#8299b3]" />Ritmo proporcional da meta</span>
        </div>
        <div
          role="region"
          aria-label="Gráfico semanal do forecast, com rolagem horizontal quando necessário"
          tabIndex={0}
          className="relative min-w-0 overflow-x-auto overflow-y-hidden scroll-discreta focus-visible:outline-2 focus-visible:outline-[#086b6b]"
          onPointerLeave={() => setSemanaPointer(null)}
        >
          {semanas.length > 0 ? (
            <svg
              role="group"
              aria-label="Forecast em cada corte e ritmo da meta nas sextas-feiras"
              onPointerMove={event => {
                if (event.pointerType === 'touch') return
                const matrix = event.currentTarget.getScreenCTM()
                if (!matrix) return
                const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
                if (point.x < PLOT_LEFT || point.x > PLOT_RIGHT || point.y < PLOT_TOP || point.y > PLOT_BOTTOM) {
                  setSemanaPointer(null)
                  return
                }
                const index = nearestChartPoint(point.x, pontosForecast.map(([x]) => x))
                setSemanaPointer(index >= 0 ? semanas[index].week : null)
              }}
              viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT}
              className="mx-auto block h-auto w-full min-w-[520px] max-w-[900px] overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
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
              <path d={lineChartPath(pontosPace)} fill="none" stroke="#8299b3" strokeWidth="2" strokeDasharray="6 5" />
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
                  onFocus={() => { setSemanaPointer(null); setSemanaFocada(semanas[indice].week) }}
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
              {marcador && inspecting && (
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
        </div>
        <div role="status" aria-live="polite" className="mt-2 min-h-[40px] rounded-[9px] border border-[#e8eef0] bg-white/75 px-3 py-2">
          {inspecting && semanaSelecionada ? <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-[11px] text-[#52677f]">{semanaSelecionada.rangeLabel}</span>
            <strong className="num text-[13px] font-bold text-[#10294c]">{semanaSelecionada.closed ? formatarMilhoesExpandido(valorSelecionado) : 'Corte pendente'}</strong>
            <span className={'num text-[11px] font-bold ' + (semanaSelecionada.closed ? (desvioMeta === null ? 'text-[#52677f]' : desvioMeta < 0 ? 'text-[#d33d54]' : 'text-[#00856f]') : 'text-[#8a5a00]')}>
              {semanaSelecionada.closed ? desvioMeta === null ? 'Meta indisponível' : formatarPercentualInteiro(desvioMeta) + ' vs. meta' : 'Aguardando fechamento de sexta'}
            </span>
            <small className="text-[11px] text-[#43556b]">Ritmo da meta: {formatarMilhoesExpandido(semanaSelecionada.pace)}</small>
            <small className="text-[10px] text-[#52677f]">Realizado integrado: posição atual, sem série semanal.</small>
          </div> : <p className="text-[11px] leading-5 text-[#52677f]">Passe o mouse, use Tab ou selecione um corte para inspecionar forecast, ritmo da meta e posição integrada atual.</p>}
        </div>
        <p className="mt-2 text-xs leading-5 text-[#52677f]">Demonstração · linha verde: forecast nos cortes concluídos. Tracejada: ritmo esperado da meta, não o forecast oficial.</p>
        <div aria-label="Inspecionar cortes semanais" className="grid grid-cols-4 gap-0.5 px-1">
          {semanas.map((semana, indice) => (
            <button
              key={semana.week}
              type="button"
              onPointerEnter={(event) => { if (event.pointerType !== 'touch') setSemanaPointer(semana.week) }}
              onPointerLeave={() => setSemanaPointer(null)}
              onFocus={() => { setSemanaPointer(null); setSemanaFocada(semana.week) }}
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

      <div className="grid grid-cols-3 gap-2 border-t border-[#e8eef0] pt-2 min-[1550px]:grid-cols-1 min-[1550px]:content-center min-[1550px]:gap-3 min-[1550px]:border-l min-[1550px]:border-t-0 min-[1550px]:pl-3 min-[1550px]:pt-0">
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
