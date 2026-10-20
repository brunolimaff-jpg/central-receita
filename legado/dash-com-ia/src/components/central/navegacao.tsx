'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  BookOpenText,
  Bookmark,
  ChartNoAxesCombined,
  Command as CommandIcon,
  FlaskConical,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Radar,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { AREA_PRIMARIA_POR_TELA, type AreaPrimaria, type Tela } from '@/lib/domain/navigation'
import type { IrPara } from '@/lib/domain/navigation'
import { cn } from '@/lib/utils'
import { fmtDataHora } from '@/lib/domain/format'

export type { AtualizarContexto, ContextoGlobal, ContextoOrigem, IrPara, Tela } from '@/lib/domain/navigation'
export { TELAS_VALIDAS } from '@/lib/domain/navigation'

const PRINCIPAIS: Array<{ area: AreaPrimaria; tela: Tela; rotulo: string; icone: LucideIcon }> = [
  { area: 'briefing', tela: 'agora', rotulo: 'Briefing', icone: LayoutDashboard },
  { area: 'perguntar', tela: 'agente', rotulo: 'Pergunte à Receita', icone: MessageSquareText },
  { area: 'explorar', tela: 'visao', rotulo: 'Explorar', icone: ChartNoAxesCombined },
  { area: 'visoes', tela: 'visoes', rotulo: 'Visões', icone: Bookmark },
]

const APOIO: Array<{ tela: Tela; rotulo: string; icone: LucideIcon }> = [
  { tela: 'fontes', rotulo: 'Fontes & Regras', icone: BookOpenText },
]

const TITULOS_TELA: Record<Tela, { crumb: string; grupo: string }> = {
  agora: { crumb: 'Visão da Diretoria', grupo: 'Briefing' },
  mudancas: { crumb: 'Mudanças', grupo: 'Explorar · Forecast' },
  casos: { crumb: 'Decisões', grupo: 'Explorar · Atenção' },
  visao: { crumb: 'Pipeline', grupo: 'Explorar · Forecast' },
  oportunidades: { crumb: 'Oportunidades', grupo: 'Explorar' },
  winloss: { crumb: 'Win / Loss', grupo: 'Explorar · Oportunidades' },
  radar: { crumb: 'Sinais', grupo: 'Explorar · Atenção' },
  agente: { crumb: 'Conversa', grupo: 'Pergunte à Receita' },
  fontes: { crumb: 'Fontes', grupo: 'Fontes & Regras' },
  validacoes: { crumb: 'Validações', grupo: 'Fontes & Regras' },
  detalhe: { crumb: 'Oportunidade', grupo: 'Explorar' },
  visoes: { crumb: 'Visões salvas', grupo: 'Visões' },
}

interface ItemNav {
  tela: Tela
  rotulo: string
  icone: LucideIcon
  area?: AreaPrimaria
  tambemAtivoEm?: Tela[]
}

function BlocoMarca() {
  return (
    <div className="border-b border-sidebar-border px-5 py-5">
      <div className="min-w-0">
        <Image
          src="/brand/senior-official-logos/slide-13-logo-01.svg"
          alt="Senior"
          width={408}
          height={133}
          unoptimized
          priority
          className="block h-[22px] w-[68px] object-contain object-left"
        />
        <p className="mt-3 truncate font-sans text-[15px] font-semibold leading-tight tracking-[-0.02em] text-white">Central de Receita</p>
        <p className="mt-1 truncate font-sans text-[11px] font-medium text-stone-300">Inteligência comercial · local</p>
      </div>
    </div>
  )
}

function ItemNavegacao({ item, tela, irPara, aoNavegar }: { item: ItemNav; tela: Tela; irPara: IrPara; aoNavegar?: () => void }) {
  const Icone = item.icone
  const ativo = item.area
    ? AREA_PRIMARIA_POR_TELA[tela] === item.area
    : tela === item.tela || (item.tambemAtivoEm?.includes(tela) ?? false)

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          irPara(item.tela)
          aoNavegar?.()
        }}
        aria-current={ativo ? 'page' : undefined}
        className={cn(
          'group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70',
          ativo ? 'bg-white/10 font-semibold text-white' : 'text-stone-300 hover:bg-white/[0.06] hover:text-white',
        )}
      >
        {ativo ? <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-emerald-300" aria-hidden /> : null}
        <Icone className={cn('size-[17px] shrink-0', ativo ? 'text-emerald-300' : 'text-stone-400 group-hover:text-stone-200')} strokeWidth={1.8} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
      </button>
    </li>
  )
}

function ListaNavegacao({ tela, irPara, aoNavegar }: { tela: Tela; irPara: IrPara; aoNavegar?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto scroll-discreta px-3 py-5" aria-label="Navegação principal">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Trabalho</p>
      <ul className="space-y-1">
        {PRINCIPAIS.map((item) => <ItemNavegacao key={item.area} item={item} tela={tela} irPara={irPara} aoNavegar={aoNavegar} />)}
      </ul>
      <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Apoio</p>
      <ul className="space-y-1">
        {APOIO.map((item) => <ItemNavegacao key={item.tela} item={{ ...item, tambemAtivoEm: ['validacoes'] }} tela={tela} irPara={irPara} aoNavegar={aoNavegar} />)}
      </ul>
      <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
        <div className="flex items-center gap-2 text-[11px] font-medium text-stone-200">
          <Users className="size-3.5 text-emerald-300" aria-hidden />
          Leitura para liderança
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-stone-400">Uma entrada para entender, perguntar e aprofundar.</p>
      </div>
    </nav>
  )
}

function RodapeSnapshot({ snapshot }: { snapshot: string | null }) {
  return (
    <div className="border-t border-sidebar-border px-4 py-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold text-stone-200">
        <FlaskConical className="size-3.5 text-amber-300" aria-hidden />
        Base sintética local
      </p>
      <p className="num mt-1.5 pl-[22px] font-mono text-[10.5px] text-stone-400">Snapshot {snapshot ? fmtDataHora(snapshot) : '—'}</p>
      <p className="mt-1 pl-[22px] text-[10.5px] leading-snug text-stone-400">Sem integração corporativa</p>
    </div>
  )
}

export function SidebarDesktop({ tela, irPara, snapshot }: { tela: Tela; irPara: IrPara; snapshot: string | null }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] flex-col bg-sidebar text-stone-300 lg:flex">
      <BlocoMarca />
      <ListaNavegacao tela={tela} irPara={irPara} />
      <RodapeSnapshot snapshot={snapshot} />
    </aside>
  )
}

export function TopbarDesktop({ tela, snapshot, abrirComandos, irPara }: { tela: Tela; snapshot: string | null; abrirComandos: () => void; irPara: IrPara }) {
  const info = TITULOS_TELA[tela]
  return (
    <header className="sticky top-0 z-30 hidden h-14 items-center gap-4 border-b border-border/70 bg-white/85 px-6 backdrop-blur-xl lg:flex xl:px-9">
      <nav aria-label="Localização atual" className="flex min-w-0 items-center gap-2 text-[12px]">
        <span className="text-muted-foreground">Central de Receita</span>
        <span className="text-border" aria-hidden>/</span>
        <span className="text-muted-foreground">{info.grupo}</span>
        <span className="text-border" aria-hidden>/</span>
        <span className="truncate font-semibold text-foreground">{info.crumb}</span>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <span className="num hidden font-mono text-[10.5px] text-muted-foreground xl:inline">Snapshot {snapshot ? fmtDataHora(snapshot) : '—'}</span>
        <Button type="button" variant="outline" onClick={abrirComandos} className="h-9 gap-2 rounded-xl border-border/80 bg-white px-3 text-[12px] text-muted-foreground shadow-none hover:text-foreground">
          <CommandIcon className="size-3.5" aria-hidden />
          Buscar ou navegar
          <kbd className="ml-2 rounded-md border border-border bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px]">Ctrl K</kbd>
        </Button>
        <Button type="button" variant="ghost" onClick={() => irPara('fontes')} className="h-9 rounded-xl px-3 text-[12px] text-muted-foreground hover:text-foreground">
          <ShieldCheck data-icon="inline-start" aria-hidden /> Fontes &amp; Regras
        </Button>
      </div>
    </header>
  )
}

export function CabecalhoMobile({ tela, irPara, snapshot, abrirComandos }: { tela: Tela; irPara: IrPara; snapshot: string | null; abrirComandos: () => void }) {
  const [aberto, setAberto] = useState(false)
  const info = TITULOS_TELA[tela]
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/70 bg-white/90 px-3 backdrop-blur-xl lg:hidden">
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-xl" aria-label="Abrir menu de navegação">
            <Menu className="size-5" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(84vw,320px)] gap-0 border-sidebar-border bg-sidebar p-0 text-stone-300">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <div className="flex h-full flex-col">
            <BlocoMarca />
            <ListaNavegacao tela={tela} irPara={irPara} aoNavegar={() => setAberto(false)} />
            <RodapeSnapshot snapshot={snapshot} />
          </div>
        </SheetContent>
      </Sheet>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-foreground">{info.crumb}</span>
        <span className="num block truncate font-mono text-[10px] text-muted-foreground">{info.grupo} · {snapshot ? fmtDataHora(snapshot) : 'snapshot indisponível'}</span>
      </span>
      <Button type="button" variant="ghost" size="icon" onClick={abrirComandos} className="size-10 shrink-0 rounded-xl" aria-label="Buscar ou navegar">
        <CommandIcon className="size-4" aria-hidden />
      </Button>
    </header>
  )
}

const AREAS_EXPLORAR: Array<{
  id: string
  titulo: string
  icone: LucideIcon
  telas: Tela[]
  abas: Array<{ tela: Tela; rotulo: string; icone: LucideIcon }>
}> = [
  { id: 'forecast', titulo: 'Forecast', icone: TrendingUp, telas: ['visao', 'mudancas'], abas: [{ tela: 'visao', rotulo: 'Pipeline', icone: ChartNoAxesCombined }, { tela: 'mudancas', rotulo: 'Mudanças', icone: TrendingUp }] },
  { id: 'oportunidades', titulo: 'Oportunidades', icone: Users, telas: ['oportunidades', 'winloss'], abas: [{ tela: 'oportunidades', rotulo: 'Carteira', icone: Users }, { tela: 'winloss', rotulo: 'Win / Loss', icone: Scale }] },
  { id: 'atencao', titulo: 'Atenção', icone: Radar, telas: ['radar', 'casos'], abas: [{ tela: 'radar', rotulo: 'Sinais', icone: Radar }, { tela: 'casos', rotulo: 'Decisões', icone: ShieldCheck }] },
]

export function NavegacaoExplorar({ tela, irPara }: { tela: Tela; irPara: IrPara }) {
  const ativa = AREAS_EXPLORAR.find((area) => area.telas.includes(tela)) ?? AREAS_EXPLORAR[1]
  return (
    <section className="chrome-glass mb-6 rounded-2xl p-3 sm:p-4" aria-label="Seções de Explorar">
      <nav className="flex gap-1 overflow-x-auto scroll-discreta border-b border-border/70 pb-3" aria-label="Áreas de análise">
        {AREAS_EXPLORAR.map((area) => {
          const Icone = area.icone
          const selecionada = ativa.id === area.id
          return (
            <button key={area.id} type="button" onClick={() => irPara(area.abas[0].tela)} aria-current={selecionada ? 'page' : undefined}
              className={cn('flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-4 sm:text-[13px]', selecionada ? 'bg-[var(--senior-emerald-soft)] text-[var(--senior-emerald-hover)]' : 'text-muted-foreground hover:bg-secondary/75 hover:text-foreground')}>
              <Icone className="size-4" strokeWidth={1.8} aria-hidden />
              {area.titulo}
            </button>
          )
        })}
      </nav>
      <nav className="flex gap-2 overflow-x-auto scroll-discreta pt-3" aria-label={`Seções de ${ativa.titulo}`}>
        {ativa.abas.map((aba) => {
          const Icone = aba.icone
          const selecionada = tela === aba.tela
          return (
            <button key={aba.tela} type="button" onClick={() => irPara(aba.tela)} aria-current={selecionada ? 'page' : undefined}
              className={cn('flex min-h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', selecionada ? 'border-[var(--senior-emerald)]/25 bg-white font-semibold text-foreground shadow-sm' : 'border-transparent text-muted-foreground hover:border-border hover:bg-white/70 hover:text-foreground')}>
              <Icone className="size-3.5" strokeWidth={1.8} aria-hidden />
              {aba.rotulo}
            </button>
          )
        })}
      </nav>
    </section>
  )
}

export function NavegacaoFontes({ tela, irPara }: { tela: Tela; irPara: IrPara }) {
  const abas: Array<{ tela: Tela; rotulo: string; icone: LucideIcon }> = [
    { tela: 'fontes', rotulo: 'Fontes & Regras', icone: BookOpenText },
    { tela: 'validacoes', rotulo: 'Validações', icone: ShieldCheck },
  ]
  return (
    <nav className="chrome-glass mb-6 flex gap-2 overflow-x-auto rounded-2xl p-3" aria-label="Fontes e validações">
      {abas.map((aba) => {
        const Icone = aba.icone
        const selecionada = tela === aba.tela
        return <button key={aba.tela} type="button" onClick={() => irPara(aba.tela)} aria-current={selecionada ? 'page' : undefined}
          className={cn('flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-4 sm:text-[13px]', selecionada ? 'bg-[var(--senior-emerald-soft)] font-semibold text-[var(--senior-emerald-hover)]' : 'text-muted-foreground hover:bg-white/80 hover:text-foreground')}>
          <Icone className="size-4" strokeWidth={1.8} aria-hidden />{aba.rotulo}
        </button>
      })}
    </nav>
  )
}
