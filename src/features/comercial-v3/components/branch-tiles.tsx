import Link from 'next/link'
import { formatarMilhoes, formatarPercentualInteiro } from '../format'
import type { FilialRow } from '../model'
import type { CommercialNav } from '../nav'
import type { CommercialView } from '../types'

/**
 * Tiles de filial (preview `index.html` l.373 e l.378; plano Task 7 Step 1, l.643
 * "branch breakdown" e Task 8 Step 1, l.690-702).
 *
 * Cada tile mostra realizado, meta, forecast atual e `% da meta` e abre a tela da
 * filial. O eixo é sempre Filial: nenhum HEAD aparece como agrupamento, e o clique
 * preserva período, solução e demais filtros ativos pela URL.
 */

type BranchTilesProps = {
  filiais: FilialRow[]
  nav: CommercialNav
  titulo: string
  subtitulo: string
  /** Origem da navegação registrada na URL para o retorno cair na tela certa. */
  origem?: CommercialView
}

export function BranchTiles({ filiais, nav, titulo, subtitulo, origem }: BranchTilesProps) {
  return (
    <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="mb-2.5">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">{titulo}</h2>
        <p className="mt-0.5 text-[12px] text-[#63748a]">{subtitulo}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 2xl:grid-cols-4">
        {filiais.map((linha) => {
          const missing = linha.missing ?? []
          const percentual = missing.includes('meta') || missing.includes('realizado') || linha.meta <= 0 || !Number.isFinite(linha.atingimento)
            ? '—'
            : formatarPercentualInteiro(linha.atingimento)
          const valor = (key: 'realizado' | 'meta' | 'forecastAtual') => missing.includes(key) ? '—' : formatarMilhoes(linha[key])
          return (
            <Link
              key={linha.branch}
              href={nav.branchHref(linha.branch, origem)}
              aria-label={`${linha.branch}: ganhos no CRM ${valor('realizado')}, meta ${valor('meta')}, forecast ${valor('forecastAtual')}, ${percentual} da meta. Abrir filial.`}
              className="min-w-0 rounded-[10px] border border-[#dfe8ef] bg-white px-3.5 py-3 transition-premium hover:-translate-y-0.5 hover:border-[#c9ded9] hover:shadow-[0_4px_14px_rgba(32,73,91,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:translate-y-px"
            >
              <h3 className="truncate text-[15px] font-bold text-[#0d2340]" title={linha.branch}>{linha.branch}</h3>
              <dl className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                <div className="min-w-0">
                  <dt className="whitespace-nowrap text-[11px] text-[#75869a]">Ganhos no CRM</dt>
                  <dd className="num whitespace-nowrap text-[15px] font-extrabold text-[#0d2340]">
                    {valor('realizado')}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="whitespace-nowrap text-[11px] text-[#75869a]">Meta</dt>
                  <dd className="num whitespace-nowrap text-[15px] font-extrabold text-[#0d2340]">
                    {valor('meta')}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="whitespace-nowrap text-[11px] text-[#75869a]">Forecast</dt>
                  <dd className="num whitespace-nowrap text-[15px] font-extrabold text-[#0d2340]">
                    {valor('forecastAtual')}
                  </dd>
                </div>
              </dl>
              <p className="num mt-2.5 text-[11px] font-semibold text-[#63748a]">
                {percentual} da meta
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
