'use client'

import Link from 'next/link'
import { formatarMilhoes } from '../format'
import type { Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import type { CommercialView } from '../types'

type AcquisitionExampleTableProps = {
  rows: Top10Row[]
  details: Map<string, OpportunityDetail>
  nav: CommercialNav
  query: string
  view: Extract<CommercialView, 'new-name' | 'cross'>
}

export function AcquisitionExampleTable({ rows, details, nav, query, view }: AcquisitionExampleTableProps) {
  return (
    <section aria-labelledby={`${view}-examples-title`} className="revenue-panel min-w-0 overflow-hidden rounded-[14px] bg-white/95">
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3.5">
        <div>
          <h2 id={`${view}-examples-title`} className="text-[16px] font-bold tracking-[-0.02em] text-[#0d2340]">
            Exemplos do cenário demonstrativo
          </h2>
          <p className="mt-0.5 pb-2 text-[12px] text-[#63748a]">
            Oportunidades do recorte atual para visualizar a área.
          </p>
        </div>
        <span className="rounded-full bg-[#eef2f6] px-2.5 py-1 text-[12px] font-semibold text-[#52677f]">
          {rows.length} {rows.length === 1 ? 'oportunidade' : 'oportunidades'} neste recorte
        </span>
      </div>

      <div role="region" aria-label="Exemplos demonstrativos de oportunidades" tabIndex={0} className="min-w-0 overflow-x-auto focus-visible:outline-2 focus-visible:outline-[#086b6b]">
        <table className="w-full min-w-[700px] border-collapse text-[12px]">
          <caption className="sr-only">Oportunidades do cenário demonstrativo no recorte atual.</caption>
          <thead>
            <tr className="bg-[#f8fbfd] text-left text-[11px] font-bold text-[#5b6d82]">
              {['Conta', 'Solução', 'Executivo', 'Estágio', 'Forecast atual'].map((label) => (
                <th key={label} scope="col" className="border-b border-[#dfe8ef] px-3 py-2.5">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[12px] text-[#63748a]">
                  <p>{query ? `Nenhum exemplo deste recorte corresponde a “${query}”.` : 'Não há exemplos demonstrativos neste recorte.'}</p>
                  {query && (
                    <button type="button" onClick={() => nav.onQuery('')} className="mt-2 rounded-[6px] px-2 py-1 font-semibold text-[#086b6b] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]">
                      Limpar busca
                    </button>
                  )}
                </td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-[#eef3f6] text-[#30465f] last:border-0">
                <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-[#0d2340]">
                  <Link href={nav.href('opportunity', { opportunityId: row.id, from: view })} className="rounded-[4px] underline decoration-transparent underline-offset-2 hover:decoration-[#009b83] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]">
                    {row.account}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{row.solution}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{row.executive}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{details.get(row.id)?.stage ?? 'Não informado'}</td>
                <td className="num whitespace-nowrap px-3 py-2.5">{formatarMilhoes(row.current)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
