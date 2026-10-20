import type { RevenueStage } from '@/lib/revenue-home/types'

const STAGE_CLASS: Record<RevenueStage['tone'], string> = {
  stable: 'border-border bg-[#fbfdfd]',
  attention: 'border-[#d69316]/25 bg-[#fffaf0]',
  critical: 'border-[var(--critical-red)]/25 bg-[#fff7f8]',
}

export function RevenueFlow({ stages }: { stages: RevenueStage[] }) {
  return (
    <section id="flow" className="rounded-[20px] border border-border bg-white p-4" aria-labelledby="flow-title">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="flow-title" className="text-[14px] font-semibold tracking-[-0.025em]">Fluxo da Receita</h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">A jornada aparece por exceção e decisão, não por volume de gráficos.</p>
        </div>
        <span className="text-[9px] text-muted-foreground">Sistema ponta a ponta</span>
      </header>

      <div className="grid auto-cols-[minmax(104px,1fr)] grid-flow-col gap-1.5 overflow-x-auto pb-1 scroll-discreta lg:grid-flow-row lg:grid-cols-9">
        {stages.map((stage) => (
          <article key={stage.id} className={`min-w-0 rounded-xl border p-2.5 ${STAGE_CLASS[stage.tone]}`}>
            <p className="min-h-7 text-[9px] font-semibold leading-tight">{stage.label}</p>
            <p className="mt-1 text-[8px] leading-tight text-muted-foreground">{stage.state}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
