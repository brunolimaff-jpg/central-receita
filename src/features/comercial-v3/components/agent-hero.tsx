import type { Kpi, SemanaRow } from '../model'
import { WeeklyForecastScene } from './weekly-forecast-scene'

type AgentHeroProps = {
  semanas: SemanaRow[]
  semanaAtual: number | null
  kpis: Kpi[]
  asOf: string
}

/**
 * Trajetória da Receita: cortes semanais de sexta. É demonstrativa — não vem da
 * carga importada — e por isso o selo fica no cabeçalho da seção, não aqui dentro.
 */
export function AgentHero({ semanas, semanaAtual, kpis, asOf }: AgentHeroProps) {
  const valor = (key: Kpi['key']) => kpis.find((kpi) => kpi.key === key)?.value ?? 0
  const snapshotLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(asOf))

  return (
    <section className="revenue-panel vidro min-w-0">
      <header className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <p className="text-[12px] text-ink-muted">
          Cortes de sexta · snapshot em {snapshotLabel} · valores em R$ milhões.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-ink-muted" aria-label="Legenda do gráfico">
          <span className="inline-flex items-center gap-1.5">
            <i aria-hidden className="h-[3px] w-4 rounded-full bg-brand" />
            Forecast
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i aria-hidden className="w-4 border-t-2 border-dashed border-ink-subtle" />
            Ritmo da meta
          </span>
        </div>
      </header>
      <WeeklyForecastScene
        semanas={semanas}
        semanaAtual={semanaAtual}
        meta={valor('meta')}
        forecastAtual={valor('forecastAtual')}
        realizado={valor('realizado')}
      />
    </section>
  )
}
