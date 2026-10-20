import Link from 'next/link'
import { BLOCOS_HOME } from '../copy'
import { formatarMilhoes } from '../format'
import type { FilialRow } from '../model'
import type { CommercialNav } from '../nav'
import type { CommercialView } from '../types'
import { REAL_BRANCH_TOTAL } from '../test-data'

/**
 * Rail de filiais da Home (plano Task 5 Step 5, l.511-520).
 *
 * Cada linha mostra nome, realizado, meta, forecast atual, % da meta e barra compacta.
 * A agrupação é sempre Filial — HEAD nunca aparece como eixo organizacional.
 * Clique abre `view=branch&branch=<filial>` preservando período e solução.
 */

type BranchRailProps = {
  filiais: FilialRow[]
  nav: CommercialNav
  from?: CommercialView
  real?: boolean
  compact?: boolean
}

export function BranchRail({ filiais, nav, from, real, compact = false }: BranchRailProps) {
  return (
    <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="mb-2">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">{real ? 'Filiais · setembro/2026' : BLOCOS_HOME.filiais}</h2>
        <p className="mt-0.5 text-[12px] text-[#63748a]">{real ? 'Dados reais · totais por filial, sem corte por solução' : 'Realizado, meta e forecast atual'}</p>
        {real && <div className="mt-3 rounded-[8px] bg-[#f3faf8] p-3 text-[11px] leading-5 text-[#086b6b]"><strong>Total consolidado da exportação</strong><p>Meta: {REAL_BRANCH_TOTAL.meta === null ? '—' : formatarMilhoes(REAL_BRANCH_TOTAL.meta)}</p><p>Integrado: {REAL_BRANCH_TOTAL.realizado === null ? '—' : formatarMilhoes(REAL_BRANCH_TOTAL.realizado)}</p><p>Forecast: {REAL_BRANCH_TOTAL.forecastAtual === null ? '—' : formatarMilhoes(REAL_BRANCH_TOTAL.forecastAtual)}</p></div>}
      </div>

      <div
        role="region"
        aria-label="Lista de filiais"
        tabIndex={0}
        className={`grid max-h-[360px] grid-cols-1 gap-1.5 overflow-y-auto overscroll-contain pr-1 scroll-discreta focus-visible:outline-2 focus-visible:outline-[#086b6b] ${compact ? 'lg:grid-cols-2 2xl:grid-cols-3' : ''}`}
      >
        {filiais.map((linha) => {
          const coverageAvailable = !linha.missing?.includes('meta') && !linha.missing?.includes('realizado') && linha.meta > 0 && Number.isFinite(linha.atingimento)
          const percentual = coverageAvailable ? Math.round(linha.atingimento * 100) : null
          const largura = percentual === null ? 0 : Math.max(0, Math.min(100, percentual))
          const valor = (key: 'meta' | 'realizado' | 'forecastAtual') => linha.missing?.includes(key) ? '—' : formatarMilhoes(linha[key])
          return (
            <Link
              key={linha.branch}
              href={nav.branchHref(linha.branch, from)}
              aria-label={`${linha.branch}: realizado ${valor('realizado')}, meta ${valor('meta')}, forecast ${valor('forecastAtual')}, ${percentual === null ? 'atingimento indisponível' : percentual + '% da meta'}. Abrir filial.`}
              className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-x-2.5 gap-y-1.5 rounded-[8px] px-1.5 py-2 transition-premium hover:bg-[#f3f8f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:bg-[#eaf5f2]"
            >
              <span className="num order-1 break-words text-[12px] font-bold leading-4 text-[#334b64]">{linha.branch}</span>
              <span className="order-3 col-span-2 min-w-0">
                <span role="img" aria-label={percentual === null ? 'Atingimento da meta indisponível' : `${percentual}% da meta`} className="block h-[9px] overflow-hidden rounded-full bg-[#edf2f5]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#0aa88f,#62c9b8)]"
                    style={{ width: `${largura}%` }}
                  />
                </span>
                <span className="num mt-1 flex flex-wrap gap-x-1 text-[11px] leading-4 text-[#50647d]">
                  <span className="whitespace-nowrap">{valor('realizado')} {real ? 'integrado' : 'realizado'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">meta {valor('meta')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">{valor('forecastAtual')} forecast</span>
                </span>
              </span>
              <span className="num order-2 text-right text-[12px] font-bold text-[#435873]">{percentual === null ? '—' : `${percentual}%`}</span>
            </Link>
          )
        })}
      </div>

      <p className="mt-2.5 border-t border-[#edf2f6] pt-2 text-[11px] text-[#8190a2]">
        A leitura é por filial; HEAD não substitui filial em nenhum nível.
      </p>
    </section>
  )
}
