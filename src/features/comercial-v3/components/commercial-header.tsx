'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { FILTER_LABELS } from '../copy'
import type { CommercialNav } from '../nav'
import { ALL_FILTERS, type CommercialPeriod, type CommercialView } from '../types'
import { FilterSelect } from './filter-select'
import { PeriodTabs } from './period-tabs'

type CommercialHeaderProps = {
  view: CommercialView
  period: CommercialPeriod
  solution: string
  branch: string
  query: string
  monthLabel: string
  solutions: string[]
  branches: string[]
  nav: CommercialNav
}

export function CommercialHeader({
  view,
  period,
  solution,
  branch,
  query,
  monthLabel,
  solutions,
  branches,
  nav,
}: CommercialHeaderProps) {
  const [busca, setBusca] = useState(query)
  const [querySincronizada, setQuerySincronizada] = useState(query)

  if (query !== querySincronizada) {
    setQuerySincronizada(query)
    setBusca(query)
  }

  const buscaRotulo = view === 'journey'
    ? 'Buscar oportunidade na Jornada'
    : view === 'system' || view === 'accounts'
      ? 'Buscar na Visão Comercial'
      : 'Buscar conta, solução ou executivo'

  return (
    <header className="revenue-topbar flex flex-col items-stretch gap-2.5 xl:flex-row xl:items-center">
      <form
        role="search"
        onSubmit={(evento) => {
          evento.preventDefault()
          nav.onQuery(busca.trim())
        }}
        className="revenue-control flex h-11 min-w-0 w-full items-center gap-2.5 rounded-[13px] px-3.5 focus-within:border-[#8abbb5] focus-within:ring-2 focus-within:ring-[#086b6b]/70 xl:max-w-[480px] xl:flex-1"
      >
        <Search aria-hidden className="h-[18px] w-[18px] shrink-0 text-[#536781]" strokeWidth={1.8} />
        <label className="min-w-0 flex-1">
          <span className="sr-only">{buscaRotulo}</span>
          <input
            type="search"
            value={busca}
            suppressHydrationWarning
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder={buscaRotulo}
            className="h-9 w-full rounded-sm border-0 bg-transparent text-[12.5px] text-[#243b56] outline-none placeholder:text-[#708097] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#086b6b]"
          />
        </label>
        {busca.trim() !== '' && (
          <button
            type="submit"
            aria-label={view === 'system' || view === 'accounts' ? 'Buscar na Visão Comercial' : 'Buscar'}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#eef7f5] text-[#087d6a] transition-premium hover:bg-[#e1f2ee] focus-visible:outline-2 focus-visible:outline-[#086b6b]"
          >
            <Search aria-hidden className="h-4 w-4" />
          </button>
        )}
      </form>

      <div className="flex min-w-0 max-w-full items-center justify-between gap-2 overflow-x-auto scroll-discreta xl:ml-auto xl:justify-end xl:overflow-visible">
        <span className="revenue-control inline-flex h-10 shrink-0 items-center rounded-[11px] px-3 text-[11px] font-semibold text-[#33466c]">
          {period === 'month' ? monthLabel : period === 'quarter' ? 'Trimestre' : '3 meses'}
        </span>
        <div className="shrink-0">
          <PeriodTabs period={period} onPeriod={nav.onPeriod} />
        </div>
        <FilterSelect
          label="Solução"
          value={solution}
          onChange={nav.onSolution}
          options={[
            { value: ALL_FILTERS, label: FILTER_LABELS.solucao },
            ...solutions.map((item) => ({ value: item, label: item })),
          ]}
        />
        <FilterSelect
          label="Filial"
          value={branch}
          onChange={nav.onBranch}
          options={[
            { value: ALL_FILTERS, label: FILTER_LABELS.filial },
            ...branches.map((item) => ({ value: item, label: item })),
          ]}
        />
        <div aria-label={branch === ALL_FILTERS ? 'Cenário demonstrativo' : 'Recorte da filial ' + branch} className="revenue-control flex h-10 shrink-0 items-center gap-2 rounded-[12px] p-1.5">
          <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[#086b6b] text-[12px] font-bold text-white">{branch === ALL_FILTERS ? 'D' : 'F'}</span>
          <span className="hidden pr-1 leading-tight min-[1440px]:block">
            <strong className="block text-[12px] text-[#10294c]">{branch === ALL_FILTERS ? 'Demonstração' : 'Visão da filial'}</strong>
            <small className="mt-0.5 block text-[11px] text-[#50647d]">Recorte demonstrativo</small>
          </span>
        </div>
      </div>
    </header>
  )
}
