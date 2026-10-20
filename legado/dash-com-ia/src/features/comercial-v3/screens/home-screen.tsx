import { AgentHero } from '../components/agent-hero'
import { BranchRail } from '../components/branch-rail'
import { KpiStrip } from '../components/kpi-strip'
import { HeroBriefingCard } from '../components/hero-briefing-card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HOME_COPY } from '../copy'
import { formatarInstante } from '../format'
import type { AgentBriefingModel, HomeModel } from '../model'
import type { CommercialNav } from '../nav'

type HomeScreenProps = {
  model: HomeModel
  briefing: AgentBriefingModel
  asOf: string
  mes: string
  nav: CommercialNav
  realBranchesEnabled?: boolean
}

export function HomeScreen({ model, briefing, asOf, mes, nav, realBranchesEnabled }: HomeScreenProps) {
  const filialSelecionada = model.filiais.length === 1 ? model.filiais[0].branch : null
  return (
    <div className="revenue-page">
      <section data-home-nav="home" className="grid min-w-0 gap-3">
        <div className="grid min-w-0 gap-3">
          <header className="flex flex-wrap items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              <h1 className="revenue-heading">{filialSelecionada ?? HOME_COPY.greeting} {!filialSelecionada && <span aria-hidden>{HOME_COPY.greetingEmoji}</span>}</h1>
              <p className="revenue-subtitle">{filialSelecionada ? 'Status da filial e sinais para aprofundar nas oportunidades' : 'Panorama comercial e sinais do recorte'} · {mes}.</p>
              <p className="mt-1 text-[12px] text-[#50647d]">Cenário demonstrativo · posição em {formatarInstante(asOf)}.</p>
            </div>
            <Link href={nav.href('agent', { from: 'home' })} className="revenue-control inline-flex min-h-10 items-center gap-2 rounded-[10px] px-3 text-[13px] font-semibold text-[#086b6b] hover:bg-white focus-visible:outline-2 focus-visible:outline-[#086b6b]">{HOME_COPY.agentCta}<ArrowRight aria-hidden className="h-4 w-4" /></Link>
          </header>
          <KpiStrip kpis={model.kpis} overview />
          <HeroBriefingCard briefing={briefing} top10Count={model.top10.length} nav={nav} />
          <div data-home-nav="forecast" className="min-w-0">
            {model.semanas.length > 0 ? (
              <AgentHero semanas={model.semanas} semanaAtual={model.semanaAtual} kpis={model.kpis} asOf={asOf} />
            ) : (
              <p className="revenue-panel px-4 py-3 text-[13px] leading-5 text-[#50647d]">Trajetória semanal indisponível neste recorte. A amostra não fornece histórico por filial e solução.</p>
            )}
          </div>
        </div>
      </section>

      <nav aria-label="Acesso direto às áreas comerciais" className="grid min-w-0 grid-cols-3 gap-2">
        {([
          ['Contas', 'accounts'],
          ['New Name', 'new-name'],
          ['Cross', 'cross'],
        ] as const).map(([label, view]) => (
          <Link
            key={view}
            href={nav.href(view, { from: 'home' })}
            className="revenue-panel group flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-[12px] px-3 py-2.5 text-[12px] font-semibold text-[#2b425e] transition-premium hover:-translate-y-px hover:bg-white focus-visible:outline-2 focus-visible:outline-[#086b6b]"
          >
            <span className="truncate">{label}</span>
            <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-[#009b83] transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </nav>

      {!filialSelecionada && <section data-home-nav="system" className="min-w-0">
        <BranchRail filiais={model.filiais} nav={nav} real={realBranchesEnabled} compact />
      </section>}
    </div>
  )
}
