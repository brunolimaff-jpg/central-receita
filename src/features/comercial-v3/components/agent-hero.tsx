'use client'

import { PanelSection } from './executive-ui'
import { TrajectoryChart, TrajectoryLegend } from './trajectory-chart'
import type { TrajectoryModel } from '../trajectory-model'

/**
 * Casca da Trajetória da Receita: título, selo de cargas e legenda direta. O
 * desenho fica em `TrajectoryChart`, que recebe o modelo pronto — o regime é
 * decidido no módulo puro, nunca aqui.
 *
 * O contexto por regime (vazio, 1, 2, 3+ cargas) é aprofundado no ticket 04,
 * junto com a posição da seção na página.
 */
export function AgentHero({ model }: { model: TrajectoryModel }) {
  // Em A e B o regime já diz quantas cargas existem; em C, cada ponto do previsto é uma carga.
  const cargas = model.regime === 'A' ? 1 : model.regime === 'B' ? 2 : model.series.find(serie => serie.kind === 'previsto')?.points.length ?? 0
  const selo = model.regime === 'vazio' ? null : `${cargas} ${cargas === 1 ? 'carga' : 'cargas'}`

  return (
    <PanelSection
      id="trajectory"
      titulo="Trajetória da Receita"
      contexto="Acumulado do mês pelas datas da carga. O selo diz quantas cargas sustentam a curva."
      acao={selo ? <span className={`revenue-pill tone-${model.regime === 'C' ? 'info' : 'marca'}`}>{selo}</span> : undefined}
    >
      <section className="revenue-panel vidro min-w-0">
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-ink-muted">Valores em reais, acumulados até cada data da carga.</p>
          <TrajectoryLegend model={model} />
        </header>
        <TrajectoryChart model={model} />
      </section>
    </PanelSection>
  )
}
