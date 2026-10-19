'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell, Building2, ChevronDown, GitBranch, Layers, LayoutDashboard, List, PackagePlus, Search, Settings2, Target, TrendingUp, Users } from 'lucide-react'
import { FILTER_LABELS, VIEW_LABELS } from '../copy'
import { sharedImportEnabled } from '../manual-import-client'
import { sidebarViewFor, type CommercialNav } from '../nav'
import { ALL_FILTERS, type CommercialPeriod, type CommercialView } from '../types'
import { FilterSelect } from './filter-select'
import { PeriodTabs } from './period-tabs'
import { formatarDataCurta } from './executive-ui'

type ItemNav = {
  key: string
  label: string
  icon: typeof LayoutDashboard
  view?: CommercialView
}

/** Seções da página corrida, na ordem da sidebar. Cada uma tem âncora e marcação de visibilidade. */
const SECOES = ['home', 'forecast', 'new-name', 'opportunities'] as const
type Secao = (typeof SECOES)[number]
const pertenceAPagina = (view: CommercialView) => (SECOES as readonly string[]).includes(view)

/** Jornada, Sistema de Receita, Contas e Cross ficam "Em breve", sem link (docs/PLANO-VISAO-EXECUTIVA.md §Navegação). */
const ITENS: ItemNav[] = [
  { key: 'home', label: VIEW_LABELS.home, icon: LayoutDashboard, view: 'home' },
  { key: 'forecast', label: VIEW_LABELS.forecast, icon: TrendingUp, view: 'forecast' },
  { key: 'new-name', label: VIEW_LABELS['new-name'], icon: Target, view: 'new-name' },
  { key: 'opportunities', label: VIEW_LABELS.opportunities, icon: List, view: 'opportunities' },
  { key: 'journey', label: VIEW_LABELS.journey, icon: GitBranch },
  { key: 'system', label: VIEW_LABELS.system, icon: Layers },
  { key: 'accounts', label: VIEW_LABELS.accounts, icon: Building2 },
  { key: 'cross', label: VIEW_LABELS.cross, icon: PackagePlus },
]

const PENDENTE = 'Em breve'

export function sectionAtOffset(blocos: Array<{ view: CommercialView; top: number }>): CommercialView {
  return blocos.filter((bloco) => bloco.top <= 120).at(-1)?.view ?? 'home'
}

export function CommercialSidebar({
  view,
  from,
  nav,
  importPreview = false,
  dataCarga = null,
  paginaCorrida = false,
}: {
  view: CommercialView
  from?: CommercialView
  nav: CommercialNav
  importPreview?: boolean
  /** Data de referência da carga (ISO); quando existe, o rodapé mostra "Carga de DD/MM/AAAA". */
  dataCarga?: string | null
  /**
   * Só é verdadeiro na página corrida (Visão Executiva com carga). Nas rotas
   * `?demo=1&view=…` as âncoras `#home`/`#forecast` não existem na tela, então
   * trocá-las deixava a navegação da sidebar sem efeito.
   */
  paginaCorrida?: boolean
}) {
  const [secao, mudarSecao] = useState<CommercialView>('home')
  const naPagina = paginaCorrida
  useEffect(() => {
    if (!naPagina) return
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
  }, [naPagina])

  const menuView = sidebarViewFor(view, from)
  const pageView = naPagina ? 'home' : view
  const ativoNoMenu = (item: ItemNav) => pageView === 'home' ? item.view === secao : item.view === menuView
  const rodape = importPreview
    ? dataCarga ? `Carga de ${formatarDataCurta(dataCarga)}` : sharedImportEnabled ? 'Carga compartilhada' : 'Prévia local · importação'
    : 'Cenário demonstrativo · set/2026'
  const configAtiva = view === 'config'

  return (
    <aside aria-label="Navegação principal" className="revenue-sidebar vidro-forte">
      <Link href={nav.href('home')} className="mb-5 flex flex-col items-start gap-1.5 px-2 pb-1">
        <Image
          src="/brand/senior-official-logos/slide-12-logo-01.svg"
          alt="Senior"
          width={118}
          height={38}
          priority
          className="h-[38px] w-auto"
        />
        <span className="revenue-marca-texto text-[11.5px] font-medium tracking-[0.02em] text-ink-muted">Central de Receita</span>
      </Link>

      <nav aria-label="Seções" className="grid gap-1">
        {ITENS.map((item) => {
          const Icone = item.icon
          const ativo = ativoNoMenu(item)

          if (!item.view) {
            return (
              <button
                key={item.key}
                type="button"
                disabled
                aria-disabled="true"
                title={`${item.label} · ${PENDENTE}`}
                className="revenue-nav-item cursor-not-allowed opacity-50"
              >
                <Icone aria-hidden className="h-[19px] w-[19px] shrink-0" strokeWidth={1.7} />
                <span className="revenue-nav-rotulo truncate">{item.label}</span>
                <span className="sr-only"> ({PENDENTE})</span>
              </button>
            )
          }

          return (
            <Link
              key={item.key}
              href={naPagina && (SECOES as readonly string[]).includes(item.view) ? `#${item.view}` : nav.href(item.view, { from: 'home' })}
              aria-current={ativo ? (pageView === 'home' ? 'location' : 'page') : undefined}
              className="revenue-nav-item"
            >
              <Icone aria-hidden className="h-[19px] w-[19px] shrink-0" strokeWidth={1.7} />
              <span className="revenue-nav-rotulo truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Os itens desabilitados ficam visíveis mas sem selo por item, que não cabe na largura da sidebar. */}
      <p className="revenue-marca-texto mt-3 px-3 text-[10.5px] leading-4 text-ink-subtle">
        Chegam em breve: Jornada, Sistema de Receita, Contas e Cross.
      </p>

      <div className="mt-auto grid gap-1 pt-4">
        <Link
          href={nav.href('config')}
          aria-current={configAtiva ? 'page' : undefined}
          className="revenue-nav-item border-t border-hairline-suave pt-3"
        >
          <Settings2 aria-hidden className="h-[19px] w-[19px] shrink-0" strokeWidth={1.7} />
          <span className="revenue-nav-rotulo truncate">{VIEW_LABELS.config}</span>
        </Link>
        <p className="revenue-nav-rotulo px-3 pt-1 text-[11px] leading-4 text-ink-muted">{rodape}</p>
      </div>
    </aside>
  )
}

/**
 * Cabeçalho do painel: busca, período, filial, avisos e o cartão de quem está lendo.
 * O público é a diretoria, então o cabeçalho nomeia a pessoa e o cargo.
 */
export function CommercialTopbar({
  view,
  period,
  solution,
  branch,
  query,
  monthLabel,
  solutions,
  branches,
  nav,
}: {
  view: CommercialView
  period: CommercialPeriod
  solution: string
  branch: string
  query: string
  monthLabel: string
  solutions: string[]
  branches: string[]
  nav: CommercialNav
}) {
  const [busca, setBusca] = useState(query)
  const [sincronizada, setSincronizada] = useState(query)
  if (query !== sincronizada) {
    setSincronizada(query)
    setBusca(query)
  }
  const rotuloBusca = view === 'journey'
    ? 'Buscar oportunidade na Jornada'
    : view === 'system' || view === 'accounts'
      ? 'Buscar na Visão Comercial'
      : 'Buscar conta, oportunidade, executivo ou solução'

  return (
    <header className="revenue-topbar flex flex-wrap items-center gap-2.5">
      <form
        role="search"
        onSubmit={(evento) => { evento.preventDefault(); nav.onQuery(busca.trim()) }}
        className="revenue-control flex h-11 min-w-0 flex-1 basis-[280px] items-center gap-2.5 rounded-[16px] px-4"
      >
        <Search aria-hidden className="h-[18px] w-[18px] shrink-0 text-ink-muted" strokeWidth={1.8} />
        <label className="min-w-0 flex-1">
          <span className="sr-only">{rotuloBusca}</span>
          <input
            type="search"
            value={busca}
            suppressHydrationWarning
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder={rotuloBusca}
            className="h-9 w-full border-0 bg-transparent text-[13px] text-ink-strong outline-none placeholder:text-ink-subtle"
          />
        </label>
        {busca.trim() !== '' && (
          <button
            type="submit"
            aria-label={view === 'system' || view === 'accounts' ? 'Buscar na Visão Comercial' : 'Buscar'}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-dado-positivo-suave text-brand-escuro transition-premium hover:bg-brand/10"
          >
            <Search aria-hidden className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto scroll-discreta">
        <span className="revenue-control inline-flex h-11 shrink-0 items-center gap-2 rounded-[14px] px-4 text-[13px] font-semibold text-ink-strong">
          {period === 'month' ? monthLabel : period === 'quarter' ? 'Trimestre' : '3 meses'}
        </span>
        <div className="shrink-0">
          <PeriodTabs period={period} onPeriod={nav.onPeriod} />
        </div>
        <FilterSelect
          label="Solução"
          value={solution}
          onChange={nav.onSolution}
          options={[
            { value: ALL_FILTERS, label: FILTER_LABELS.solucao },
            ...solutions.map((item) => ({ value: item, label: item })),
          ]}
        />
        <label className="revenue-control flex h-11 shrink-0 items-center gap-2 rounded-[14px] px-3.5">
          <Users aria-hidden className="h-[17px] w-[17px] shrink-0 text-ink-muted" strokeWidth={1.8} />
          <span className="sr-only">Filial</span>
          <select
            value={branch}
            onChange={(evento) => nav.onBranch(evento.target.value)}
            className="max-w-[168px] cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-ink-strong outline-none"
          >
            <option value={ALL_FILTERS}>Todas as filiais</option>
            {branches.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" aria-label="Avisos" className="revenue-control grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-ink-strong">
          <Bell aria-hidden className="h-[19px] w-[19px]" strokeWidth={1.8} />
        </button>
        <button type="button" className="revenue-control flex h-12 shrink-0 items-center gap-2.5 rounded-[16px] py-1 pl-1.5 pr-3 text-left">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,var(--verde-escuro),var(--verde-medio))] text-[14px] font-bold text-white">G</span>
          <span className="hidden leading-tight min-[1440px]:block">
            <strong className="block text-[13px] font-semibold text-ink-strong">Giovanni</strong>
            <small className="block text-[11px] text-ink-muted">Diretoria Comercial</small>
          </span>
          <ChevronDown aria-hidden className="hidden h-4 w-4 text-ink-muted min-[1440px]:block" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}
