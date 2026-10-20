import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BLOCOS_HOME } from '../copy'
import { formatarComSinal, formatarMilhoes } from '../format'
import type { Movimentos } from '../model'
import type { CommercialNav } from '../nav'
import { FORECAST_MOVEMENTS } from '../types'

export function ForecastMovementFlow({ movimentos, nav }: { movimentos: Movimentos; nav: CommercialNav }) {
  const maior = Math.max(...FORECAST_MOVEMENTS.map((item) => Math.abs(movimentos.byMovement[item].value)), 0.1)
  return (
    <section className="h-full min-w-0 rounded-[14px] border border-[#dfe8ef] bg-white p-5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <h2 className="text-[16px] font-bold tracking-tight text-[#0d2340]">{BLOCOS_HOME.movimentos}</h2>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-[#f6f9fe] px-3 py-2.5">
        <div><p className="text-[11px] text-[#50647d]">Foto oficial</p><p className="num whitespace-nowrap text-[19px] font-bold text-[#33466c]">{formatarMilhoes(movimentos.oficial)}</p></div>
        <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-[#8ea0c5]" />
        <div className="text-right"><p className="text-[11px] text-[#50647d]">Forecast atual</p><p className="num whitespace-nowrap text-[19px] font-bold text-[#086b6b]">{formatarMilhoes(movimentos.atual)}</p></div>
      </div>
      <ul className="mt-2 divide-y divide-[#edf2f6]">
        {FORECAST_MOVEMENTS.map((movimento) => {
          const item = movimentos.byMovement[movimento]
          const positivo = item.value >= 0
          return <li key={movimento}><Link href={nav.movementHref(movimento)} aria-label={`Abrir forecast com o movimento ${movimento}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-md py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] hover:bg-[#f6f9fe]">
            <span className="text-[12px] font-semibold text-[#33466c]">{movimento}<small className="ml-2 font-normal text-[#50647d]">{item.count} op.</small></span>
            <strong className={`num whitespace-nowrap text-[13px] ${positivo ? 'text-[#008b75]' : 'text-[#b8294a]'}`}>{formatarComSinal(item.value)}</strong>
            <span aria-hidden className="col-span-2 mt-1 h-1.5 rounded-full bg-[#edf2f6]"><span className={`block h-full rounded-full ${positivo ? 'bg-[#2ac4aa]' : 'bg-[#ef4c64]'}`} style={{ width: `${Math.abs(item.value) / maior * 100}%` }} /></span>
          </Link></li>
        })}
      </ul>
    </section>
  )
}
