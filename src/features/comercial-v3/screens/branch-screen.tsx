import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BranchOpportunityTable } from '../components/branch-opportunity-table'
import { BranchSummary } from '../components/branch-summary'
import { BranchTiles } from '../components/branch-tiles'
import { ViewToolbar } from '../components/view-toolbar'
import { FILIAIS_COPY, VIEW_LABELS, VOLTAR_POR_ORIGEM } from '../copy'
import type { BranchModel, FilialRow } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import { ALL_FILTERS, type CommercialView } from '../types'

/**
 * Tela de Filial (plano Task 8, l.676-721; preview `index.html` l.376-379).
 *
 * Três estados, sem escolher filial automaticamente:
 * 1. filial selecionada → resumo + oportunidades que explicam o resultado;
 * 2. `Todas as filiais` → visão de Filiais com um tile por filial;
 * 3. filial desconhecida → estado vazio explicativo com volta à visão comercial.
 */

type BranchScreenProps = {
  model: BranchModel | null
  branch: string
  filiais: FilialRow[]
  agregadoReal?: FilialRow
  detalhes: Map<string, OpportunityDetail>
  from?: CommercialView
  nav: CommercialNav
}

export function BranchScreen({ model, branch, filiais, agregadoReal, detalhes, from, nav }: BranchScreenProps) {
  const voltar = {
    label: VOLTAR_POR_ORIGEM[from ?? 'home'],
    href: nav.href(from ?? 'home'),
  }

  if (model) {
    return (
      <div className="grid gap-3">
        <ViewToolbar
          trilha={[
            { label: VIEW_LABELS.home, href: nav.href('home') },
            { label: VIEW_LABELS.branch, href: nav.href('branch') },
            { label: model.branch },
          ]}
          voltar={voltar}
        />

        <BranchSummary model={model} agregadoReal={agregadoReal} />
        <BranchOpportunityTable
          rows={model.oportunidades}
          detalhes={detalhes}
          nav={nav}
          acao={
            <Link
              href={nav.href('opportunities', { from: 'branch' })}
              className="rounded-[8px] border border-[#dfe8ef] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] active:translate-y-px"
            >
              Buscar nas oportunidades da filial
            </Link>
          }
        />
      </div>
    )
  }

  const semFilial = branch === ALL_FILTERS

  return (
    <div className="grid gap-3">
      <ViewToolbar
        trilha={[
          { label: VIEW_LABELS.home, href: nav.href('home') },
          { label: VIEW_LABELS.branch },
        ]}
        voltar={voltar}
      />

      {semFilial ? (
        <>
          <BranchTiles
            filiais={filiais}
            nav={nav}
            origem="branch"
            titulo={FILIAIS_COPY.semFilialTitulo}
            subtitulo={FILIAIS_COPY.subtitulo}
          />
          <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
            <p className="max-w-[820px] text-[13px] leading-relaxed text-[#4b5f76]">
              {FILIAIS_COPY.semFilialTexto}
            </p>
            <Link
              href={nav.href('home')}
              className="mt-3 inline-flex items-center gap-2 rounded-[10px] border border-[#dfe8ef] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:translate-y-px"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.8} />
              {FILIAIS_COPY.voltar}
            </Link>
          </section>
        </>
      ) : (
        <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
          <h1 className="text-[22px] font-bold tracking-[-0.035em] text-[#0d2340]">
            {FILIAIS_COPY.desconhecidaTitulo}
          </h1>
          <p className="mt-2 max-w-[720px] text-[13px] leading-relaxed text-[#4b5f76]">
            {FILIAIS_COPY.desconhecidaTexto}
          </p>
          <Link
            href={nav.href('home')}
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] border border-[#dfe8ef] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:translate-y-px"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.8} />
            {FILIAIS_COPY.voltar}
          </Link>
        </section>
      )}
    </div>
  )
}
