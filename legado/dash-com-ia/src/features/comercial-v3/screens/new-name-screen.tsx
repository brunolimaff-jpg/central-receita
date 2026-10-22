import { UserRoundPlus } from 'lucide-react'
import { selectOriginExamples } from '../acquisition'
import { AcquisitionExampleTable } from '../components/acquisition-example-table'
import { ViewToolbar } from '../components/view-toolbar'
import type { Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'

type NewNameScreenProps = {
  rows: Top10Row[]
  detalhes: Map<string, OpportunityDetail>
  query: string
  nav: CommercialNav
}

export function NewNameScreen({ rows, detalhes, query, nav }: NewNameScreenProps) {
  const examples = selectOriginExamples(rows, detalhes, query, 'New Name')

  return (
    <div className="revenue-page grid min-w-0 gap-3.5">
      <ViewToolbar
        trilha={[{ label: 'Visão Executiva', href: nav.href('home') }, { label: 'New Name' }]}
        voltar={{ label: 'Voltar à visão executiva', href: nav.href('home') }}
      />

      <header className="px-1 pb-1">
        <h1 className="revenue-heading flex items-center gap-3 text-[28px] font-bold leading-tight tracking-[-.035em] text-[#0d2340]">
          New Name <UserRoundPlus aria-hidden className="text-[#00968c]" size={26} />
        </h1>
      </header>

      <section aria-label="Disponibilidade da classificação New Name" className="revenue-panel grid min-w-0 gap-3 rounded-[14px] border border-[#dfe8ef] bg-white/95 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <span className="inline-flex rounded-full bg-[#eef2f6] px-2.5 py-1 text-[12px] font-semibold text-[#52677f]">Classificação indisponível</span>
          <h2 className="mt-2 text-[16px] font-bold text-[#0d2340]">Fonte independente pendente</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#52677f]">
            Os exemplos abaixo ilustram a área e não validam a classificação.
          </p>
        </div>
        <div className="rounded-[10px] bg-[#f6f9fc] p-3.5">
          <h2 className="text-[13px] font-bold text-[#0d2340]">Critério</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#52677f]">
            Uma fonte própria, separada da origem informada na oportunidade, define New Name.
          </p>
        </div>
      </section>

      <AcquisitionExampleTable rows={examples} details={detalhes} nav={nav} query={query} view="new-name" />
    </div>
  )
}
