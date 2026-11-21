import { GitFork } from 'lucide-react'
import { selectOriginExamples } from '../acquisition'
import { AcquisitionExampleTable } from '../components/acquisition-example-table'
import { AvisoPreliminar } from '../components/aviso-preliminar'
import { ViewToolbar } from '../components/view-toolbar'
import type { Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'

type CrossScreenProps = {
  rows: Top10Row[]
  detalhes: Map<string, OpportunityDetail>
  query: string
  nav: CommercialNav
}

const CRITERIOS_CROSS = [
  { title: 'Condição de cliente', detail: 'Confirmar vínculo da conta com a base.' },
  { title: 'Produto ou módulo novo', detail: 'Confirmar novidade para essa conta.' },
  { title: 'Representante executivo', detail: 'Vincular a venda ao responsável.' },
]

export function CrossScreen({ rows, detalhes, query, nav }: CrossScreenProps) {
  const examples = selectOriginExamples(rows, detalhes, query, 'Cross')

  return (
    <div className="revenue-page grid min-w-0 gap-3.5">
      <ViewToolbar
        trilha={[{ label: 'Visão Executiva', href: nav.href('home') }, { label: 'Cross' }]}
        voltar={{ label: 'Voltar à visão executiva', href: nav.href('home') }}
      />
      <AvisoPreliminar area="Cross" />

      <header className="px-1 pb-1">
        <h1 className="revenue-heading flex items-center gap-3 text-[26px] font-bold leading-tight tracking-[-.035em] text-[#0d2340]">
          Cross <GitFork aria-hidden className="text-[#00968c]" size={26} />
        </h1>
      </header>

      <section aria-label="Critérios para classificar Cross" className="revenue-panel min-w-0 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold text-[#0d2340]">Classificação indisponível</h2>
            <p className="mt-1 text-[12px] text-[#63748a]">Fontes de histórico de cliente e contratação por módulo pendentes; os dados abaixo são demonstrativos.</p>
          </div>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-[#52677f]">
          Grupo econômico, canal e origem informada não bastam para classificar Cross.
        </p>
        <ol className="mt-3 grid min-w-0 gap-2 md:grid-cols-3">
          {CRITERIOS_CROSS.map((criterio, index) => (
            <li key={criterio.title} className="min-w-0 rounded-[10px] bg-[#f6f9fc] p-3">
              <span className="text-[11px] font-bold text-[#63748a]">0{index + 1}</span>
              <h3 className="mt-1 text-[13px] font-bold text-[#0d2340]">{criterio.title}</h3>
              <p className="mt-1 text-[12px] leading-5 text-[#52677f]">{criterio.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Diferença entre Cross e Upsell" className="rounded-[10px] border border-[#dfe8ef] bg-[#f8fbfd] px-4 py-3">
        <h2 className="text-[13px] font-bold text-[#0d2340]">Cross e Upsell são conceitos separados</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#52677f]">
          Upsell é upgrade de licenças no módulo atual. As regras específicas de Cross por produto serão definidas depois.
        </p>
      </section>

      <AcquisitionExampleTable rows={examples} details={detalhes} nav={nav} query={query} view="cross" />
    </div>
  )
}
