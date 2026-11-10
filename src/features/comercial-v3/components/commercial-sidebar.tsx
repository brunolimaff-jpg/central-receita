'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Building2, Gauge, GitBranch, Layers, LayoutDashboard, List, MapPinned, Network, PackagePlus, PanelLeftClose, PanelLeftOpen, Search, Settings2, Target, TrendingUp, Users } from 'lucide-react'
import { FILTER_LABELS, VIEW_LABELS } from '../copy'
import { sharedImportEnabled } from '../manual-import-client'
import { sidebarViewFor, type CommercialNav } from '../nav'
import type { NavCollapse } from '../nav-collapse'
import { ALL_FILTERS, type CommercialPeriod, type CommercialView } from '../types'
import { FilterSelect } from './filter-select'
import { PeriodTabs } from './period-tabs'
import { ProductIcon } from './product-icon'
import { formatarDataCurta } from './executive-ui'

type ItemNav = {
  key: string
  label: string
  icon: typeof LayoutDashboard
  view?: CommercialView
  /** Tela existe e abre, mas o conteúdo ainda é preliminar. */
  preliminar?: boolean
}

/** Seções da página corrida, na ordem da sidebar. Cada uma tem âncora e marcação de visibilidade. */
const SECOES = ['home', 'diretorias', 'forecast', 'new-name', 'opportunities'] as const
type Secao = (typeof SECOES)[number]
const pertenceAPagina = (view: CommercialView) => (SECOES as readonly string[]).includes(view)

/**
 * Jornada, Sistema de Receita, Contas e Cross já abrem. O conteúdo existe em
 * rascunho, então cada tela leva o aviso de versão preliminar — o menu sinaliza
 * a mesma condição em vez de esconder a área.
 */
const ITENS: ItemNav[] = [
  { key: 'home', label: VIEW_LABELS.home, icon: LayoutDashboard, view: 'home' },
  { key: 'diretorias', label: VIEW_LABELS.diretorias, icon: Network, view: 'diretorias' },
  { key: 'carteira', label: VIEW_LABELS.carteira, icon: Gauge, view: 'carteira', preliminar: true },
  { key: 'territorios', label: VIEW_LABELS.territorios, icon: MapPinned, view: 'territorios', preliminar: true },
  { key: 'forecast', label: VIEW_LABELS.forecast, icon: TrendingUp, view: 'forecast' },
  { key: 'new-name', label: VIEW_LABELS['new-name'], icon: Target, view: 'new-name' },
  { key: 'opportunities', label: VIEW_LABELS.opportunities, icon: List, view: 'opportunities' },
  { key: 'journey', label: VIEW_LABELS.journey, icon: GitBranch, view: 'journey', preliminar: true },
  { key: 'system', label: VIEW_LABELS.system, icon: Layers, view: 'system', preliminar: true },
  { key: 'accounts', label: VIEW_LABELS.accounts, icon: Building2, view: 'accounts', preliminar: true },
  { key: 'cross', label: VIEW_LABELS.cross, icon: PackagePlus, view: 'cross', preliminar: true },
]

export function sectionAtOffset(blocos: Array<{ view: CommercialView; top: number }>): CommercialView {
  return blocos.filter((bloco) => bloco.top <= 120).at(-1)?.view ?? 'home'
}

/** Ícone da navegação dentro de um ladrilho: é o ladrilho que marca o estado ativo. */
function NavIcone({ icone: Icone }: { icone: typeof LayoutDashboard }) {
  return (
    <span aria-hidden className="revenue-nav-icon">
      <Icone className="h-[17px] w-[17px]" strokeWidth={1.8} />
    </span>
  )
}

/**
 * Cartão de rótulo da coluna recolhida. CSS puro: aparece no hover do item (com
 * 120ms de atraso, para não piscar ao varrer vários) e no foco de teclado (sem
 * atraso). O `title` nativo continua como fallback.
 */
function NavDica({ rotulo }: { rotulo: string }) {
  return <span aria-hidden className="revenue-nav-dica">{rotulo}</span>
}

export function CommercialSidebar({
  view,
  from,
  nav,
  importPreview = false,
  dataCarga = null,
  paginaCorrida = false,
  navState,
  onAlternarNav,
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
  /** Estado da coluna, controlado pelo shell. */
  navState: NavCollapse
  onAlternarNav: () => void
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
  const expandida = navState === 'expandida'

  return (
    <aside aria-label="Navegação principal" className="revenue-sidebar vidro-forte">
      {/*
        Marca centralizada. Antes o logo ficava alinhado à guia dos itens de
        navegação; com a foto da sede atrás do topo, o bloco centralizado lê
        como assinatura da casa, e a navegação abaixo mantém a guia própria.
      */}
      {/*
        Duas marcas, uma por estado da coluna. Expandida: o wordmark com a
        assinatura. Recolhida: só o símbolo "S", que a marca permite usar
        isolado como apoio — e é a única forma que cabe em 72px sem truncar.
      */}
      <Link href={nav.href('home')} className="mb-4 flex flex-col items-center gap-1.5 border-b border-white/10 px-3 pb-3.5 text-center">
        <Image
          src="/brand/senior-official-logos/slide-13-logo-01.svg"
          alt="Senior"
          width={112}
          height={36}
          priority
          className="revenue-marca-logo h-[34px] w-auto"
        />
        <Image
          src="/brand/senior-official-logos/senior-simbolo-verde.png"
          alt="Senior"
          width={24}
          height={45}
          priority
          className="revenue-marca-simbolo h-[34px] w-auto"
        />
        <span className="revenue-marca-texto revenue-marca-assinatura">Central de Receita</span>
      </Link>

      <nav id="revenue-navegacao" aria-label="Seções" className="grid gap-1">
        {ITENS.map((item, indice) => {
          const Icone = item.icon
          const abreGrupo = indice === 0 || item.preliminar !== ITENS[indice - 1].preliminar
          const ativo = ativoNoMenu(item)
          const view = item.view

          /* Sem item pendente hoje: as quatro áreas "Em breve" viraram links
           * preliminares. O ramo desabilitado volta quando existir área nova
           * sem tela; `view` é obrigatório enquanto isso não acontecer. */

          return (
            <div key={item.key} className="contents">
            {abreGrupo && (
              <p className="revenue-nav-grupo">
                <span className="revenue-nav-rotulo">{item.preliminar ? 'Em prévia' : 'Receita'}</span>
              </p>
            )}
            <Link
              data-preliminar={item.preliminar ? '' : undefined}
              href={naPagina && view && (SECOES as readonly string[]).includes(view) ? `#${view}` : nav.href(view ?? 'home', { from: 'home' })}
              aria-current={ativo ? (pageView === 'home' ? 'location' : 'page') : undefined}
              title={item.preliminar ? `${item.label} · versão preliminar` : item.label}
              className="revenue-nav-item"
            >
              {/* Um destaque só, que desliza de um item ao outro. */}
              {ativo && <motion.span aria-hidden layoutId="revenue-nav-ativo" className="revenue-nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
              <NavIcone icone={Icone} />
              <span className="revenue-nav-rotulo truncate">{item.label}</span>
              {/*
                O ponto é decoração; o estado precisa chegar ao leitor de tela
                pelo nome do link, não pelo `title` — que muitos leitores
                ignoram e o teclado só mostra como dica visual.
              */}
              {item.preliminar && <span className="sr-only"> (versão preliminar)</span>}
              <NavDica rotulo={item.preliminar ? `${item.label} · versão preliminar` : item.label} />
            </Link>
            </div>
          )
        })}
      </nav>

      <div className="mt-auto grid gap-1 pt-4">
        {/*
          Controle de largura da coluna. Fica imediatamente acima de Configurações
          e é ocultado abaixo de 780px, onde a sidebar vira barra inferior e não
          existe coluna para recolher.
        */}
        <button
          type="button"
          onClick={onAlternarNav}
          aria-expanded={expandida}
          aria-controls="revenue-navegacao"
          aria-label={expandida ? 'Recolher navegação' : 'Expandir navegação'}
          title={expandida ? 'Recolher navegação' : 'Expandir navegação'}
          className="revenue-nav-item revenue-nav-toggle"
        >
          <NavIcone icone={expandida ? PanelLeftClose : PanelLeftOpen} />
          <span className="revenue-nav-rotulo truncate">{expandida ? 'Recolher navegação' : 'Expandir navegação'}</span>
          <NavDica rotulo={expandida ? 'Recolher navegação' : 'Expandir navegação'} />
        </button>
        <Link
          href={nav.href('config')}
          aria-current={configAtiva ? 'page' : undefined}
          title={VIEW_LABELS.config}
          className="revenue-nav-item"
        >
          {configAtiva && <motion.span aria-hidden layoutId="revenue-nav-ativo" className="revenue-nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
          <NavIcone icone={Settings2} />
          <span className="revenue-nav-rotulo truncate">{VIEW_LABELS.config}</span>
          <NavDica rotulo={VIEW_LABELS.config} />
        </Link>
        <p className="revenue-nav-rotulo revenue-nav-status">
          <span aria-hidden className="revenue-nav-pulso" />
          <span className="min-w-0">
            <strong className="block font-semibold">{importPreview ? 'Dados carregados' : 'Demonstração'}</strong>
            {rodape}
          </span>
        </p>
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
        className="revenue-control flex h-11 min-w-0 flex-1 basis-[280px] items-center gap-2.5 rounded-[10px] px-4"
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
        <span className="revenue-control inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] px-4 text-[13px] font-semibold text-ink-strong">
          {period === 'month' ? monthLabel : period === 'quarter' ? 'Trimestre' : '3 meses'}
        </span>
        <div className="shrink-0">
          <PeriodTabs period={period} onPeriod={nav.onPeriod} />
        </div>
        <FilterSelect
          label="Solução"
          value={solution}
          onChange={nav.onSolution}
          icone={<ProductIcon solucao={solution === ALL_FILTERS ? null : solution} tamanho={16} prioridade />}
          options={[
            { value: ALL_FILTERS, label: FILTER_LABELS.solucao },
            ...solutions.map((item) => ({ value: item, label: item })),
          ]}
        />
        <label className="revenue-control flex h-11 shrink-0 items-center gap-2 rounded-[10px] px-3.5">
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
        <button type="button" disabled title="Avisos indisponíveis" className="revenue-control flex h-11 shrink-0 cursor-not-allowed items-center gap-2 rounded-[10px] px-3 text-[12px] text-ink-muted">
          <Bell aria-hidden className="h-[19px] w-[19px]" strokeWidth={1.8} />
          Avisos indisponíveis
        </button>
        <div className="revenue-control pointer-events-none flex h-12 shrink-0 items-center gap-2.5 rounded-[10px] py-1 pl-1.5 pr-3 text-left">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,var(--verde-escuro),var(--verde-medio))] text-[13px] font-bold text-white">G</span>
          <span className="sr-only leading-tight min-[1440px]:not-sr-only">
            <strong className="block text-[13px] font-semibold text-ink-strong">{process.env.NEXT_PUBLIC_VISUAL_PREVIEW === '1' ? 'Visitante' : 'Giovanni'}</strong>
            <small className="block text-[11px] text-ink-muted">Diretoria Comercial</small>
          </span>
        </div>
      </div>
    </header>
  )
}
