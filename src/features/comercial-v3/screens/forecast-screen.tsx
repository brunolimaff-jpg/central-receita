import { BranchTiles } from '../components/branch-tiles'
import { ForecastMovementList } from '../components/forecast-movement-list'
import { ForecastOpportunityList } from '../components/forecast-opportunity-list'
import { ForecastSummary } from '../components/forecast-summary'
import { OriginMix } from '../components/origin-mix'
import { ViewToolbar } from '../components/view-toolbar'
import { FORECAST_COPY, VIEW_LABELS, VOLTAR_POR_ORIGEM } from '../copy'
import type { ForecastModel } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import type { CommercialView, ForecastMovement } from '../types'

/**
 * Tela de Forecast (plano Task 7, l.623-674; spec §6, l.298-316).
 *
 * Aprofunda a fotografia oficial: resumo com delta absoluto e percentual, fluxo
 * clicável por movimento, New Names × Cross, visão por filial e a população de
 * oportunidades do recorte. O movimento selecionado vive na URL, então voltar de
 * uma oportunidade cai exatamente neste estado.
 */

type ForecastScreenProps = {
  model: ForecastModel
  meta: number
  mes: string
  movement: ForecastMovement | null
  detalhes: Map<string, OpportunityDetail>
  from?: CommercialView
  nav: CommercialNav
}

export function ForecastScreen({
  model,
  meta,
  mes,
  movement,
  detalhes,
  from,
  nav,
}: ForecastScreenProps) {
  const linhas = movement ? model.porMovimento[movement] : model.oportunidades

  return (
    <div className="grid gap-3">
      <ViewToolbar
        trilha={[
          { label: VIEW_LABELS.home, href: nav.href('home') },
          { label: VIEW_LABELS.forecast },
        ]}
        voltar={{ label: VOLTAR_POR_ORIGEM[from ?? 'home'], href: nav.href(from ?? 'home') }}
      />

      <ForecastSummary model={model} meta={meta} mes={mes} />

      <div className="grid items-stretch gap-3 lg:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr]">
        <ForecastMovementList movimentos={model.movimentos} selecionado={movement} nav={nav} />
        <OriginMix origem={model.origem} />
      </div>

      <ForecastOpportunityList
        rows={linhas}
        detalhes={detalhes}
        movement={movement}
        nav={nav}
      />

      <BranchTiles
        filiais={model.filiais}
        nav={nav}
        origem="forecast"
        titulo={FORECAST_COPY.filiaisTitulo}
        subtitulo={FORECAST_COPY.filiaisSubtitulo}
      />
    </div>
  )
}
