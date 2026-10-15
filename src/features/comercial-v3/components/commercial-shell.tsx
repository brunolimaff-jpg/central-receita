import { CommercialHeader } from './commercial-header'
import { CommercialSidebar } from './commercial-sidebar'
import { sharedImportEnabled } from '../manual-import-client'
import type { CommercialNav } from '../nav'
import type { CommercialPeriod, CommercialView } from '../types'

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
}

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
}: CommercialShellProps) {
  return (
    <div className="revenue-app relative isolate min-h-dvh overflow-x-clip text-[#0d2340]">
      <div aria-hidden className="revenue-background" />
      <div className="relative z-10 mx-auto grid min-h-dvh max-w-[1920px] gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-[172px_minmax(0,1fr)] lg:gap-5 lg:px-5 lg:py-[18px]">
        <CommercialSidebar view={view} from={from} nav={nav} importPreview={importPreview} />

        <div className="min-w-0">
          {importPreview ? <header className="revenue-topbar rounded-xl px-4 py-3 text-sm text-[#33466c]">Importação manual · {sharedImportEnabled ? 'dados compartilhados de' : 'piloto local de'} New Name e Forecast</header> : <CommercialHeader
            view={view}
            period={period}
            solution={solution}
            branch={branch}
            query={query}
            monthLabel={monthLabel}
            solutions={solutions}
            branches={branches}
            nav={nav}
          />}
          <main className="mx-auto w-full max-w-[1500px] min-w-0 pb-10 pt-2 lg:pt-[34px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
