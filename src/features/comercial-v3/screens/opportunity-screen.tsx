import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { OpportunityRevenue } from '../components/opportunity-revenue'
import { OpportunitySummary } from '../components/opportunity-summary'
import { OpportunityTimeline } from '../components/opportunity-timeline'
import { OpportunityLifePanel } from '../components/opportunity-life-panel'
import { ViewToolbar } from '../components/view-toolbar'
import { OPORTUNIDADE_COPY, VIEW_LABELS, VOLTAR_POR_ORIGEM } from '../copy'
import type { OpportunityModel } from '../model'
import type { OpportunityLifeModel } from '../opportunity-life'
import type { CommercialNav } from '../nav'
import type { CommercialView } from '../types'

/**
 * Tela completa de Oportunidade (plano Task 9, l.723-789; spec §5 l.269-296 e §7 l.317-341).
 *
 * Abre como tela dedicada — nunca modal ou sheet — com valores, composição de
 * receita e histórico. O retorno é contextual: vem do `from` da URL e leva de volta
 * a Home, Forecast, Filial ou Oportunidades preservando filtros e movimento.
 * `op` desconhecido cai em estado vazio composto: nenhuma oportunidade é inventada.
 */

type OpportunityScreenProps = {
  oportunidade: OpportunityModel | null
  life?: OpportunityLifeModel | null
  from?: CommercialView
  nav: CommercialNav
}

export function OpportunityScreen({ oportunidade, life, from, nav }: OpportunityScreenProps) {
  const destino = from ?? 'home'
  const voltar = { label: VOLTAR_POR_ORIGEM[destino], href: nav.href(destino) }

  if (!oportunidade) {
    return (
      <div className="grid gap-3">
        <ViewToolbar
          trilha={[
            { label: VIEW_LABELS.home, href: nav.href('home') },
            { label: VIEW_LABELS.opportunity },
          ]}
          voltar={voltar}
        />

        <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
          <h1 className="text-[22px] font-bold tracking-[-0.035em] text-[#0d2340]">
            {OPORTUNIDADE_COPY.naoEncontradaTitulo}
          </h1>
          <p className="mt-2 max-w-[720px] text-[13px] leading-relaxed text-[#4b5f76]">
            {OPORTUNIDADE_COPY.naoEncontradaTexto}
          </p>
          <Link
            href={nav.href('home')}
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] border border-[#dfe8ef] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:translate-y-px"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.8} />
            {VOLTAR_POR_ORIGEM.home}
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <ViewToolbar
        trilha={[
          { label: VIEW_LABELS.home, href: nav.href('home') },
          ...(destino === 'forecast'
            ? [{ label: VIEW_LABELS.forecast, href: nav.href('forecast') }]
            : []),
          ...(destino === 'opportunities'
            ? [{ label: VIEW_LABELS.opportunities, href: nav.href('opportunities') }]
            : []),
          ...(destino === 'branch' && oportunidade.branch !== ''
            ? [{ label: `Filial ${oportunidade.branch}`, href: nav.branchHref(oportunidade.branch) }]
            : []),
          { label: oportunidade.account },
        ]}
        voltar={voltar}
      />

      <div className="grid items-stretch gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <OpportunitySummary model={oportunidade} />
        <OpportunityRevenue model={oportunidade} />
      </div>

      {life?.opportunityId === oportunidade.id ? (
        <OpportunityLifePanel life={life} />
      ) : (
        <OpportunityTimeline historico={oportunidade.history} />
      )}
    </div>
  )
}
