'use client'

import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { formatarRealCompacto } from '../format'

/**
 * Gráficos compactos das seções (rosca de composição e colunas).
 *
 * Complementam a Trajetória da Home: cada seção ganha uma leitura visual
 * própria em vez de repetir a mesma grade de cartões. Cores só por token.
 */

export type Fatia = { rotulo: string; valor: number | null; cor: string }

/** Rosca de composição: as fatias somam o total exibido no centro. */
export function DonutChart({ fatias, centro, legendaCentro, tamanho = 148 }: {
  fatias: Fatia[]
  centro: string
  legendaCentro: string
  tamanho?: number
}) {
  const reduzir = useReducedMotion()
  const raio = 42
  const circunferencia = 2 * Math.PI * raio
  const total = fatias.reduce((soma, fatia) => soma + Math.max(0, fatia.valor ?? 0), 0)
  let acumulado = 0
  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={fatias.map(f => `${f.rotulo} ${formatarRealCompacto(f.valor)}`).join(', ')}>
          <circle cx="50" cy="50" r={raio} fill="none" stroke="var(--surface-sunken)" strokeWidth="11" />
          {total > 0 && fatias.map((fatia) => {
            const parte = Math.max(0, fatia.valor ?? 0) / total
            const inicio = acumulado
            acumulado += parte
            if (parte === 0) return null
            return (
              <motion.circle
                key={fatia.rotulo}
                cx="50" cy="50" r={raio} fill="none" stroke={fatia.cor} strokeWidth="11" strokeLinecap="butt"
                strokeDasharray={`${parte * circunferencia} ${circunferencia}`}
                strokeDashoffset={-inicio * circunferencia}
                initial={reduzir ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: inicio * 0.4 }}
              />
            )
          })}
        </svg>
        <span className="absolute inset-0 grid place-content-center text-center">
          <strong className="num block text-[20px] font-bold leading-none text-ink-strong">{centro}</strong>
          <small className="mt-1 block text-[11px] text-ink-muted">{legendaCentro}</small>
        </span>
      </div>
      <ul className="grid min-w-[12rem] flex-1 gap-2.5">
        {fatias.map(fatia => (
          <li key={fatia.rotulo} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 text-ink-muted">
              <i aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: fatia.cor }} />
              <span className="truncate">{fatia.rotulo}</span>
            </span>
            <span className="num shrink-0 whitespace-nowrap font-semibold text-ink-strong">{formatarRealCompacto(fatia.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export type Coluna = { rotulo: string; valor: number | null; detalhe?: string; destaque?: boolean }

/** Colunas verticais com valor acima e rótulo abaixo. */
export function ColumnChart({ colunas, altura = 150, vazio = 'Sem valores nesta carga.' }: {
  colunas: Coluna[]
  altura?: number
  vazio?: string
}) {
  const reduzir = useReducedMotion()
  const id = useId()
  const maior = Math.max(0, ...colunas.map(coluna => coluna.valor ?? 0))
  if (colunas.length === 0 || maior === 0) return <p className="text-[13px] text-ink-muted">{vazio}</p>
  return (
    <div role="list" aria-labelledby={id} className="flex items-end gap-3" style={{ height: altura + 44 }}>
      {colunas.map((coluna, indice) => {
        const proporcao = Math.max(0, coluna.valor ?? 0) / maior
        return (
          <div role="listitem" key={coluna.rotulo} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5 h-full">
            <span className="num text-[12px] font-semibold text-ink-strong">{formatarRealCompacto(coluna.valor)}</span>
            <motion.span
              aria-hidden
              className="block w-full max-w-14 rounded-t-[8px]"
              style={{
                height: Math.max(4, proporcao * altura),
                background: coluna.destaque
                  ? 'linear-gradient(180deg, var(--verde-claro), var(--verde-institucional))'
                  : 'linear-gradient(180deg, color-mix(in srgb, var(--verde-claro) 45%, white), color-mix(in srgb, var(--verde-institucional) 55%, white))',
                transformOrigin: 'bottom',
              }}
              initial={reduzir ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 22, delay: indice * 0.06 }}
            />
            <span className="w-full truncate text-center text-[12px] capitalize text-ink-muted" title={coluna.detalhe ?? coluna.rotulo}>{coluna.rotulo}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Granularidade das barras (semana, mês ou trimestre) dentro do cartão do gráfico; compacto para caber na ação do painel. */
export function SeletorGranularidade({ valor, onChange, rotulo, textos }: {
  valor: 'semana' | 'mês' | 'tri'
  onChange: (valor: 'semana' | 'mês' | 'tri') => void
  rotulo: string
  /** O que cada barra vale nesse modo ("Dias", "Semanas"…); evita repetir o "Semana" do período. */
  textos: Record<'semana' | 'mês' | 'tri', string>
}) {
  const opcoes = (['semana', 'mês', 'tri'] as const).map(chave => ({ valor: chave, texto: textos[chave] }))
  return (
    <div role="group" aria-label={rotulo} className="inline-flex rounded-[9px] bg-surface-sunken/80 p-0.5">
      {opcoes.map(opcao => (
        <button
          key={opcao.valor}
          type="button"
          aria-pressed={valor === opcao.valor}
          onClick={() => onChange(opcao.valor)}
          className={`h-7 rounded-[7px] px-2.5 text-[12px] font-semibold transition-premium ${valor === opcao.valor ? 'bg-white text-brand-escuro shadow-sm' : 'text-ink-muted hover:text-ink-strong'}`}
        >
          {opcao.texto}
        </button>
      ))}
    </div>
  )
}
