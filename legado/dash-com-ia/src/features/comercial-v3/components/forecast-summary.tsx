import { FORECAST_COPY, KPI_LABELS } from '../copy'
import { formatarComSinal, formatarMilhoes, formatarPercentualComSinal, formatarPercentualInteiro } from '../format'
import type { ForecastModel } from '../model'

/**
 * Resumo do Forecast (plano Task 7 Step 1, l.637-645; preview `index.html` l.365-367).
 *
 * Fotografia oficial, forecast atual, delta absoluto e **delta percentual** — o
 * preview não mostrava o percentual (ONDE-TA-TUDO-V3 §3, l.83-84) e o plano exige.
 * Nenhum número é escrito aqui: tudo vem do `ForecastModel`.
 */

type ForecastSummaryProps = {
  model: ForecastModel
  meta: number
  mes: string
}

export function ForecastSummary({ model, meta, mes }: ForecastSummaryProps) {
  const celulas = [
    {
      chave: 'meta',
      rotulo: KPI_LABELS.meta,
      valor: formatarMilhoes(meta),
      legenda: '100%',
      negativo: false,
    },
    {
      chave: 'oficial',
      rotulo: KPI_LABELS.forecastOficial,
      valor: formatarMilhoes(model.oficial),
      legenda: meta > 0 ? `${formatarPercentualInteiro(model.oficial / meta)} da meta` : 'fotografia congelada',
      negativo: false,
    },
    {
      chave: 'atual',
      rotulo: KPI_LABELS.forecastAtual,
      valor: formatarMilhoes(model.atual),
      legenda: meta > 0 ? `${formatarPercentualInteiro(model.atual / meta)} da meta` : 'hoje',
      negativo: false,
    },
    {
      chave: 'delta',
      rotulo: 'Δ vs. oficial',
      valor: formatarComSinal(model.deltaAbsoluto),
      legenda: `${formatarPercentualComSinal(model.deltaPercentual)} sobre a fotografia oficial`,
      negativo: model.deltaAbsoluto < 0,
    },
  ]

  return (
    <section className="rounded-[20px] border border-[#dfe8ef] bg-white px-5 py-4 shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
      <div className="mb-3">
        <h1 className="text-[24px] font-bold tracking-[-0.035em] text-[#0d2340]">
          Forecast de {mes}
        </h1>
        <p className="mt-0.5 text-[12px] text-[#63748a]">{FORECAST_COPY.subtitulo}</p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {celulas.map((celula) => (
          <article
            key={celula.chave}
            className={`rounded-[12px] border px-3.5 py-3.5 ${
              celula.negativo ? 'border-[#f3d9de] bg-[linear-gradient(180deg,#ffffff,#fff7f8)]' : 'border-[#dfe8ef] bg-[#fbfdfe]'
            }`}
          >
            <p className="text-[12px] text-[#6b7d91]">{celula.rotulo}</p>
            <b
              className={`num mt-1.5 block text-[24px] font-extrabold ${
                celula.negativo ? 'text-[#d62d4a]' : 'text-[#0d2340]'
              }`}
            >
              {celula.valor}
            </b>
            <span className="num mt-1 block text-[11px] text-[#63748a]">{celula.legenda}</span>
          </article>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-[#8190a2]">
        A fotografia oficial é congelada: os movimentos do mês são comparados contra ela, nunca a
        reescrevem.
      </p>
    </section>
  )
}
