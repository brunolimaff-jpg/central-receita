import { FILIAIS_COPY } from '../copy'
import {
  formatarComSinal,
  formatarMilhoes,
  formatarOportunidades,
  formatarPercentualInteiro,
} from '../format'
import type { BranchModel } from '../model'
import { FORECAST_MOVEMENTS } from '../types'

/**
 * Resumo da filial (plano Task 8 Step 1, l.688-702; preview `index.html` l.378).
 *
 * Meta, realizado, forecast atual, `% da meta`, New Names × Cross da filial e o
 * total de movimento corrente. Nenhum ranking de HEAD: a leitura é por filial e
 * HEAD não substitui filial em nenhum nível (spec §2, l.42-48).
 */

export function BranchSummary({ model }: { model: BranchModel }) {
  const percentualMeta = formatarPercentualInteiro(model.atingimento)
  const participacaoNewNames =
    model.origem.realizado > 0 ? model.origem.newNames / model.origem.realizado : 0
  const movimentos = FORECAST_MOVEMENTS.map((movimento) => ({
    movimento,
    resumo: model.movimentos.byMovement[movimento],
  }))

  return (
    <section className="rounded-[20px] border border-[#dfe8ef] bg-white px-5 py-4 shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
      <div className="mb-3">
        <h1 className="text-[24px] font-bold tracking-[-0.035em] text-[#0d2340]">
          {FILIAIS_COPY.resumoTitulo}: {model.branch}
        </h1>
        <p className="mt-0.5 text-[12px] text-[#63748a]">{FILIAIS_COPY.subtitulo}</p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[12px] border border-[#dfe8ef] bg-[#fbfdfe] px-3.5 py-3.5">
          <p className="text-[12px] text-[#6b7d91]">Meta da filial</p>
          <b className="num mt-1.5 block text-[24px] font-extrabold text-[#0d2340]">
            {formatarMilhoes(model.meta)}
          </b>
          <span className="num mt-1 block text-[11px] text-[#63748a]">100%</span>
        </article>

        <article className="rounded-[12px] border border-[#dfe8ef] bg-[#fbfdfe] px-3.5 py-3.5">
          <p className="text-[12px] text-[#6b7d91]">Realizado</p>
          <b className="num mt-1.5 block text-[24px] font-extrabold text-[#0d2340]">
            {formatarMilhoes(model.realizado)}
          </b>
          <span className="num mt-1 block text-[11px] text-[#63748a]">{percentualMeta} da meta</span>
        </article>

        <article className="rounded-[12px] border border-[#dfe8ef] bg-[#fbfdfe] px-3.5 py-3.5">
          <p className="text-[12px] text-[#6b7d91]">Forecast atual</p>
          <b className="num mt-1.5 block text-[24px] font-extrabold text-[#0d2340]">
            {formatarMilhoes(model.forecastAtual)}
          </b>
          <span className="num mt-1 block text-[11px] text-[#63748a]">
            {formatarComSinal(model.movimentos.net)} vs. fotografia oficial
          </span>
        </article>

        <article className="rounded-[12px] border border-[#dfe8ef] bg-[#fbfdfe] px-3.5 py-3.5">
          <p className="text-[12px] text-[#6b7d91]">New Names × Cross</p>
          <b className="num mt-1.5 block text-[24px] font-extrabold text-[#0d2340]">
            {formatarMilhoes(model.origem.newNames)} / {formatarMilhoes(model.origem.cross)}
          </b>
          <span className="num mt-1 block text-[11px] text-[#63748a]">
            {formatarPercentualInteiro(participacaoNewNames)} New Names do realizado
          </span>
        </article>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {movimentos.map(({ movimento, resumo }) => (
          <span
            key={movimento}
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] ${
              resumo.value < 0 ? 'border-[#f3d9de] bg-[#fff7f8] text-[#a82a45]' : 'border-[#cfe9e2] bg-[#f3faf8] text-[#1c5b4d]'
            }`}
          >
            <strong className="font-bold">{movimento}</strong>
            <span className="num">
              {formatarComSinal(resumo.value)} · {formatarOportunidades(resumo.count)}
            </span>
          </span>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-[#8190a2]">
        Oportunidades: {formatarOportunidades(model.oportunidades.length)} no forecast desta filial.
      </p>
    </section>
  )
}
