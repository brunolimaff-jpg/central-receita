import Link from 'next/link'
import { FORECAST_COPY } from '../copy'
import { formatarComSinal, formatarOportunidades } from '../format'
import type { Movimentos } from '../model'
import type { CommercialNav } from '../nav'
import { FORECAST_MOVEMENTS, type ForecastMovement } from '../types'

/**
 * Seletor de movimentos do Forecast (plano Task 7 Step 2, l.646-654).
 *
 * Quatro segmentos — Saiu, Postergou, Alterou valor, Entrou — e a opção de voltar
 * ao recorte completo. A seleção vive na URL (`movement`) e não toca no contexto
 * global de filial/solução; por isso cada segmento é um link que preserva período,
 * solução e filial e troca só o movimento.
 */

type ForecastMovementListProps = {
  movimentos: Movimentos
  selecionado: ForecastMovement | null
  nav: CommercialNav
}

export function ForecastMovementList({ movimentos, selecionado, nav }: ForecastMovementListProps) {
  const opcoes = FORECAST_MOVEMENTS.map((movimento) => ({
    movimento,
    resumo: movimentos.byMovement[movimento],
    href: nav.href('forecast', { movement: movimento }),
  }))

  return (
    <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">
            {FORECAST_COPY.fluxoTitulo}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#63748a]">{FORECAST_COPY.fluxoSubtitulo}</p>
        </div>
        {selecionado && (
          <Link
            href={nav.href('forecast', { movement: null })}
            className="rounded-[8px] border border-[#dfe8ef] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] active:translate-y-px"
          >
            {FORECAST_COPY.limparMovimento}
          </Link>
        )}
      </div>

      <div role="group" aria-label={FORECAST_COPY.fluxoTitulo} className="mt-2 grid gap-2">
        {opcoes.map(({ movimento, resumo, href }) => {
          const ativo = selecionado === movimento
          return (
            <Link
              key={movimento}
              href={href}
              aria-current={ativo ? 'true' : undefined}
              className={`flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5 transition-premium hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:translate-y-px ${
                ativo
                  ? 'border-[#009b83] bg-[#e8f8f3] shadow-[inset_0_0_0_1px_rgba(0,155,131,0.08)]'
                  : 'border-[#edf2f6] bg-white hover:bg-[#f7fbfa]'
              }`}
            >
              <span className="min-w-0">
                <strong className="block text-[13px] font-bold text-[#0d2340]">{movimento}</strong>
                <span className="num mt-0.5 block text-[12px] text-[#6e7f92]">
                  {formatarOportunidades(resumo.count)}
                </span>
              </span>
              <b
                className={`num whitespace-nowrap text-[13px] font-extrabold ${
                  resumo.value < 0 ? 'text-[#d62d4a]' : 'text-[#008d77]'
                }`}
              >
                {formatarComSinal(resumo.value)}
              </b>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
