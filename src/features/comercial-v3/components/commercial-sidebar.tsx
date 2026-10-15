'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Building2, Compass, FileText, GitBranch, Layers, LayoutDashboard, List, PackagePlus, Settings2, Target, TrendingUp } from 'lucide-react'
import { VIEW_LABELS } from '../copy'
import { sharedImportEnabled } from '../manual-import-client'
import { sidebarViewFor, type CommercialNav } from '../nav'
import type { CommercialView } from '../types'

type ItemNav = {
  key: string
  label: string
  icon: typeof LayoutDashboard
  view?: CommercialView
}

const ITENS: ItemNav[] = [
  { key: 'home', label: VIEW_LABELS.home, icon: LayoutDashboard, view: 'home' },
  { key: 'journey', label: VIEW_LABELS.journey, icon: GitBranch, view: 'journey' },
  { key: 'system', label: VIEW_LABELS.system, icon: Layers, view: 'system' },
  { key: 'opportunities', label: VIEW_LABELS.opportunities, icon: List, view: 'opportunities' },
  { key: 'accounts', label: VIEW_LABELS.accounts, icon: Building2, view: 'accounts' },
  { key: 'new-name', label: VIEW_LABELS['new-name'], icon: Target, view: 'new-name' },
  { key: 'cross', label: VIEW_LABELS.cross, icon: PackagePlus, view: 'cross' },
  { key: 'forecast', label: VIEW_LABELS.forecast, icon: TrendingUp, view: 'forecast' },
  { key: 'reports', label: 'Relatórios', icon: FileText },
  { key: 'explore', label: 'Explorar', icon: Compass },
  { key: 'config', label: VIEW_LABELS.config, icon: Settings2, view: 'config' },
]

const PENDENTE = 'Disponível na próxima fase do V3'

export function sectionAtOffset(blocos: Array<{ view: CommercialView; top: number }>): CommercialView {
  return blocos.filter((bloco) => bloco.top <= 120).at(-1)?.view ?? 'home'
}

export function CommercialSidebar({
  view,
  from,
  nav,
  importPreview = false,
}: {
  view: CommercialView
  from?: CommercialView
  nav: CommercialNav
  importPreview?: boolean
}) {
  const [secao, mudarSecao] = useState<CommercialView>('home')
  useEffect(() => {
    if (view !== 'home') return
    const atualizar = () => {
      const blocos = document.querySelectorAll<HTMLElement>('[data-home-nav]')
      mudarSecao(sectionAtOffset(Array.from(blocos, (bloco) => ({
        view: bloco.dataset.homeNav as CommercialView,
        top: bloco.getBoundingClientRect().top,
      }))))
    }
    atualizar()
    window.addEventListener('scroll', atualizar, { passive: true })
    window.addEventListener('resize', atualizar)
    return () => {
      window.removeEventListener('scroll', atualizar)
      window.removeEventListener('resize', atualizar)
    }
  }, [view])

  const menuView = sidebarViewFor(view, from)
  const ativoNoMenu = (item: ItemNav) => view === 'home' ? item.view === secao : item.view === menuView
  const indiceAtivo = ITENS.findIndex(ativoNoMenu)

  return (
    <aside aria-label="Navegação principal" className="revenue-sidebar">
      <Link href={nav.href('home')} className="mb-6 flex flex-col items-center rounded-lg px-1 text-center focus-visible:outline-2 focus-visible:outline-[#086b6b]">
        <Image
          src="/brand/senior-official-logos/slide-12-logo-01.svg"
          alt="Senior"
          width={124}
          height={41}
          priority
          className="h-auto w-[124px]"
        />
        <span className="mt-0.5 text-[11px] font-medium tracking-[0.01em] text-[#33466c]">Central de Receita</span>
      </Link>

      <nav aria-label="Navegação principal" className="relative isolate grid gap-1.5">
        {indiceAtivo >= 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-10 rounded-[10px] bg-[linear-gradient(90deg,#e5f7f2,#f1fbf8)] shadow-[inset_0_0_0_1px_rgba(0,155,131,0.08)] motion-safe:transition-transform motion-safe:duration-200 lg:block"
            style={{ transform: 'translateY(' + (indiceAtivo * 46) + 'px)' }}
          />
        )}
        {ITENS.map((item) => {
          const Icone = item.icon
          const ativo = ativoNoMenu(item)
          const base = 'flex h-10 min-w-0 items-center gap-2 rounded-[10px] px-2 text-left text-[11px] transition-premium focus-visible:outline-2 focus-visible:outline-[#086b6b]'

          if (!item.view) {
            return (
              <button
                key={item.key}
                type="button"
                disabled
                aria-disabled="true"
                title={PENDENTE}
                className={base + ' cursor-not-allowed text-[#8492a3]'}
              >
                <Icone aria-hidden className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.key}
              href={nav.href(item.view, { from: 'home' })}
              aria-current={ativo ? (view === 'home' ? 'location' : 'page') : undefined}
              className={base + (ativo
                ? ' font-semibold text-[#087d6a] lg:bg-transparent'
                : ' text-[#33466c] hover:bg-white/70')}
            >
              <Icone aria-hidden className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <p className="mt-auto whitespace-nowrap border-t border-[#e4eaed] px-1.5 pt-3 text-[11px] leading-4 text-[#708097]">
        {importPreview ? (sharedImportEnabled ? 'Carga compartilhada' : 'Prévia local · importação') : 'Cenário demonstrativo · set/2026'}
      </p>
    </aside>
  )
}
