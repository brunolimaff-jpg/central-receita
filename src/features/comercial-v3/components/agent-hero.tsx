import type { Kpi, SemanaRow } from '../model'
import { WeeklyForecastScene } from './weekly-forecast-scene'

type AgentHeroProps = {
  semanas: SemanaRow[]
  semanaAtual: number | null
  kpis: Kpi[]
  asOf: string
}

export function AgentHero({ semanas, semanaAtual, kpis, asOf }: AgentHeroProps) {
  const valor = (key: Kpi['key']) => kpis.find((kpi) => kpi.key === key)?.value ?? 0
  const snapshotLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(asOf))

  return (
    <section className="revenue-panel min-w-0 overflow-hidden p-4 sm:p-5">
        <header className="mb-1 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#10294c]">Trajetória da Receita</h2>
            <p className="mt-0.5 text-[11.5px] text-[#61728a]">
              Cenário demonstrativo · cortes de sexta · snapshot em {snapshotLabel}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-[#586c85]">
            <span className="inline-flex items-center gap-1.5"><i aria-hidden className="h-[3px] w-4 rounded-full bg-[#009b83]" />Forecast atual</span>
            <span className="inline-flex items-center gap-1.5"><i aria-hidden className="w-4 border-t-2 border-dashed border-[#8299b3]" />Ritmo da meta</span>
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
