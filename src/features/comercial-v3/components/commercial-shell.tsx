'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { CommercialSidebar, CommercialTopbar } from './commercial-sidebar'
import { sharedImportEnabled } from '../manual-import-client'
import { CHAVE_NAVEGACAO, collapseInicial, gravarPreferencia, lerPreferencia, type NavCollapse } from '../nav-collapse'
import type { CommercialNav } from '../nav'
import type { CommercialPeriod, CommercialView } from '../types'

/**
 * Preferência da coluna como store externo.
 *
 * O HTML pré-renderizado não conhece o navegador, então o servidor usa o
 * padrão expandido. `useSyncExternalStore` hidrata com esse mesmo valor e troca
 * pelo real na reconciliação, antes da pintura — sem `useEffect` corretivo e sem
 * erro de hidratação. A escolha também vale entre abas do mesmo navegador.
 */
const ouvintes = new Set<() => void>()

function assinarPreferencia(ouvir: () => void): () => void {
  ouvintes.add(ouvir)
  window.addEventListener('storage', ouvir)
  return () => {
    ouvintes.delete(ouvir)
    window.removeEventListener('storage', ouvir)
  }
}

function lerPreferenciaDoNavegador(): NavCollapse {
  try {
    return lerPreferencia(window.localStorage.getItem(CHAVE_NAVEGACAO), window.innerWidth)
  } catch {
    // Modo privado ou armazenamento bloqueado: cai no padrão por largura.
    return collapseInicial(window.innerWidth)
  }
}

function persistirPreferencia(estado: NavCollapse) {
  try {
    window.localStorage.setItem(CHAVE_NAVEGACAO, gravarPreferencia(estado))
  } catch {
    // Cota ou modo privado: a escolha vale só nesta sessão, o uso continua.
  }
  for (const ouvir of ouvintes) ouvir()
}

type CommercialShellProps = {
  view: CommercialView
  period: CommercialPeriod
  solution: string
  branch: string
  query: string
  monthLabel: string
  solutions: string[]
  branches: string[]
  from?: CommercialView
  nav: CommercialNav
  children: React.ReactNode
  importPreview?: boolean
  executiveMode?: boolean
  dataCarga?: string | null
}

/**
 * Shell do painel: aurora esmeralda com a foto da sede só na faixa do topo,
 * sidebar de vidro à esquerda e o conteúdo à direita. O cabeçalho aparece nas
 * telas internas; a Visão Executiva traz a própria saudação no corpo da página.
 */
export function CommercialShell({
  view,
  period,
  solution,
  branch,
  query,
  monthLabel,
  solutions,
  branches,
  from,
  nav,
  children,
  importPreview = false,
  executiveMode = false,
  dataCarga = null,
}: CommercialShellProps) {
  const navState = useSyncExternalStore<NavCollapse>(assinarPreferencia, lerPreferenciaDoNavegador, () => 'expandida')
  const alternarNav = useCallback(() => {
    persistirPreferencia(navState === 'expandida' ? 'recolhida' : 'expandida')
  }, [navState])

  return (
    <div className="revenue-app" data-nav={navState}>
      <div aria-hidden className="revenue-bg" />
      <div aria-hidden className="revenue-bg-faixa" />
      <CommercialSidebar
        view={executiveMode ? 'home' : view}
        from={from}
        nav={nav}
        importPreview={importPreview}
        dataCarga={dataCarga}
        paginaCorrida={executiveMode}
        navState={navState}
        onAlternarNav={alternarNav}
      />

      <div className="relative z-[2] min-w-0">
        {view === 'config' ? (
          <header className="revenue-control mb-4 rounded-[10px] px-4 py-3 text-[13px] text-ink-muted">
            Importação manual · {sharedImportEnabled ? 'dados compartilhados de' : 'piloto local de'} New Name e Forecast
          </header>
        ) : executiveMode ? null : (
          <CommercialTopbar
            view={view}
            period={period}
            solution={solution}
            branch={branch}
            query={query}
            monthLabel={monthLabel}
            solutions={solutions}
            branches={branches}
            nav={nav}
          />
        )}
        <main className="mx-auto w-full max-w-[1500px] min-w-0 pb-24 pt-4 lg:pb-10 lg:pt-[18px]">
          {children}
        </main>
      </div>
    </div>
  )
}
