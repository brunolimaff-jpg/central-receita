import type { PulseCopy, RevenueMetric } from '@/lib/revenue-home/types'

function MetricCard({ metric }: { metric: RevenueMetric }) {
  return (
    <article className="revenue-home-glass rounded-2xl border border-white/75 bg-white/72 p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_92%),0_10px_28px_rgb(24_75_68_/_6%)] backdrop-blur-[12px]">
      <p className="text-[10px] font-medium text-muted-foreground">{metric.label}</p>
      <p className="num mt-1.5 text-[21px] font-semibold tracking-[-0.04em] text-foreground">
        {metric.displayValue}
      </p>
      {metric.deltaLabel ? (
        <p className={metric.tone === 'critical' ? 'mt-2 text-[10px] font-semibold text-[var(--critical-red)]' : 'mt-2 text-[10px] text-muted-foreground'}>
          {metric.deltaLabel}
        </p>
      ) : null}
      {metric.note ? (
        <details className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer font-medium text-[var(--senior-emerald-hover)]">Por que isso importa</summary>
          <p className="mt-1.5">{metric.note}</p>
        </details>
      ) : null}
    </article>
  )
}

export function RevenuePulse({
  pulse,
  metrics,
}: {
  pulse: PulseCopy
  metrics: RevenueMetric[]
}) {
  return (
    <>
      <header className="flex flex-wrap items-start gap-3 px-1 pt-1">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.035em]">Central de Receita</h1>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Visão executiva do sistema de receita</p>
        </div>
      </header>

      <section
        id="pulse"
        className="revenue-home-glass relative overflow-hidden rounded-[24px] border border-white/75 bg-[linear-gradient(115deg,rgb(255_255_255_/_92%),rgb(243_251_249_/_76%))] p-5 shadow-[0_20px_55px_rgb(18_70_63_/_10%)] backdrop-blur-[18px] sm:p-6"
      >
        <div className="revenue-home-accent pointer-events-none absolute -bottom-28 -right-20 h-64 w-[48%] rotate-[-8deg] rounded-full bg-[radial-gradient(ellipse_at_center,rgb(0_150_140_/_16%),transparent_70%)]" aria-hidden />

        <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(135px,.55fr))]">
          <div className="min-w-0 pr-0 xl:pr-4">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--senior-emerald-hover)]">
              <span className="h-[2px] w-5 bg-[var(--senior-emerald)]" aria-hidden />
              Pulso da Receita
            </p>
            <h2 className="mt-3 max-w-[760px] text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[.98] tracking-[-0.06em] text-foreground text-balance">
              {pulse.title}
            </h2>
            <p className="mt-3 max-w-[72ch] text-[12px] leading-relaxed text-muted-foreground">{pulse.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="#decisions" className="inline-flex min-h-9 items-center rounded-xl bg-[var(--senior-emerald-hover)] px-3.5 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgb(8_107_107_/_16%)] transition-transform active:scale-[.98]">
                Ver decisões
              </a>
              <a href="#changes" className="inline-flex min-h-9 items-center rounded-xl border border-border bg-white/65 px-3.5 text-[11px] font-medium text-foreground transition-colors hover:bg-white">
                Entender o que mudou
              </a>
            </div>
          </div>

          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>
    </>
  )
}
