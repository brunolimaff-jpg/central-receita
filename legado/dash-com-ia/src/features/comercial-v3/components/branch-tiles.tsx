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
    <section className="rounded-[14px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="mb-2.5">
        <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#0d2340]">{titulo}</h2>
        <p className="mt-0.5 text-[12px] text-[#63748a]">{subtitulo}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {filiais.map((linha) => {
          const percentual = formatarPercentualInteiro(linha.atingimento)
          return (
            <Link
              key={linha.branch}
              href={nav.branchHref(linha.branch, origem)}
              className="rounded-[12px] border border-[#dfe8ef] bg-white px-3.5 py-3 transition-premium hover:-translate-y-0.5 hover:border-[#c9ded9] hover:shadow-[0_4px_14px_rgba(32,73,91,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:translate-y-px"
            >
              <h3 className="text-[15px] font-bold text-[#0d2340]">{linha.branch}</h3>
              <dl className="mt-2 flex justify-between gap-2.5">
                <div className="min-w-0">
                  <dt className="text-[10px] text-[#75869a]">Realizado</dt>
                  <dd className="num text-[17px] font-extrabold text-[#0d2340]">
                    {formatarMilhoes(linha.realizado)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] text-[#75869a]">Meta</dt>
                  <dd className="num text-[17px] font-extrabold text-[#0d2340]">
                    {formatarMilhoes(linha.meta)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] text-[#75869a]">Forecast</dt>
                  <dd className="num text-[17px] font-extrabold text-[#0d2340]">
                    {formatarMilhoes(linha.forecastAtual)}
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
