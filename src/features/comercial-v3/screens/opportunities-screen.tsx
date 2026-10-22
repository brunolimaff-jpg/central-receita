'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChartNoAxesCombined, ChartNoAxesColumnIncreasing, ChevronRight, Clock3, LogIn, LogOut, Pencil, Search, Star } from 'lucide-react'
import { TopOpportunitiesTable } from '../components/top-opportunities-table'
import { ViewToolbar } from '../components/view-toolbar'
import { OpportunitiesForecastChart } from '../components/opportunities-forecast-chart'
import { MetricDetail } from '../components/metric-detail'
import { BarraAnimada } from '../components/motion-primitives'
import { OPORTUNIDADES_COPY, VIEW_LABELS, VOLTAR_POR_ORIGEM } from '../copy'
import { formatarComSinal, formatarMilhoes, formatarOportunidades } from '../format'
import { filterOpportunityRows, type SemanaRow, type Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import type { CommercialView } from '../types'

const MOVEMENTS = [
  { key: 'Entrou', label: 'Entraram', color: '#009b83', pale: '#e2f7f1', icon: LogIn },
  { key: 'Saiu', label: 'Saíram', color: '#e33353', pale: '#ffedf0', icon: LogOut },
  { key: 'Postergou', label: 'Postergaram', color: '#397bfa', pale: '#eaf1ff', icon: Clock3 },
  { key: 'Alterou valor', label: 'Alteraram valor', color: '#d98a08', pale: '#fff5df', icon: Pencil },
] as const

type OpportunitiesScreenProps = {
  rows: Top10Row[]
  detalhes: Map<string, OpportunityDetail>
  busca: string
  from?: CommercialView
  nav: CommercialNav
  semanas?: SemanaRow[]
  /** Solução ativa no recorte; o cabeçalho da lista mostra o produto com o nome. */
  solucao?: string
}

export function OpportunitiesScreen({ rows, detalhes, busca, from, nav, semanas = [], solucao }: OpportunitiesScreenProps) {
  const [termo, setTermo] = useState(busca)
  const [buscaSincronizada, setBuscaSincronizada] = useState(busca)
  if (busca !== buscaSincronizada) {
    setBuscaSincronizada(busca)
    setTermo(busca)
  }
  const filtrando = busca.trim() !== ''
  const linhas = filterOpportunityRows(rows, detalhes, busca)
  const movements = MOVEMENTS.map((movement) => {
    const group = linhas.filter((row) => row.movement === movement.key)
    return { ...movement, count: group.length, value: group.reduce((sum, row) => sum + row.delta, 0), weight: group.reduce((sum, row) => sum + Math.abs(row.delta), 0) }
  })
  const net = linhas.reduce((sum, row) => sum + row.delta, 0)
  const weight = movements.reduce((sum, movement) => sum + movement.weight, 0)
  /** Maior valor absoluto entre os movimentos: escala das barras. */
  const pesoMax = movements.reduce((maior, movement) => Math.max(maior, Math.abs(movement.value)), 0)
  const stages = [...linhas.reduce((counts, row) => {
    const stage = detalhes.get(row.id)?.stage ?? 'Sem estágio'
    counts.set(stage, (counts.get(stage) ?? 0) + 1)
    return counts
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1])
  const maxStage = Math.max(...stages.map(([, count]) => count), 1)
  const top5 = [...linhas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5)

  return (
    <div className="revenue-page grid min-w-0 gap-3.5">
      <div className="[&>div]:mb-0"><ViewToolbar trilha={[{ label: VIEW_LABELS.home, href: nav.href('home') }, { label: VIEW_LABELS.opportunities }]} voltar={{ label: VOLTAR_POR_ORIGEM[from ?? 'home'], href: nav.href(from ?? 'home') }} /></div>
      <div className="grid min-w-0 gap-3.5 xl:grid-cols-[minmax(0,1fr)_300px] min-[1800px]:grid-cols-[minmax(0,1fr)_370px]">
        <div className="min-w-0">
          <h1 className="revenue-heading text-[26px] leading-tight font-bold tracking-[-0.035em] text-[#0d2340] min-[1600px]:text-[32px]">Oportunidades que movem o mês</h1>
          <p className="revenue-subtitle mt-1.5 text-[13px] leading-5 text-[#476284]">Acompanhe entradas, saídas, postergações e alterações de valor na receita.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {movements.map(({ key, label, color, pale, icon: Icon, count, value }) => (
              <Link key={key} href={nav.href('forecast', { from: 'opportunities', movement: key })} className="revenue-panel relative flex min-h-[108px] min-w-0 items-start gap-2 overflow-hidden px-3 py-4 shadow-[0_4px_15px_rgba(48,88,112,0.03)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] min-[1700px]:ga min-[1700px]:px-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full min-[1700px]:size-11" style={{ color, background: pale }}><Icon aria-hidden className="size-5" strokeWidth={2} /></span>
                <div className="relative z-10 min-w-0"><span className="block text-[12px] text-[#33466c] min-[1700px]:text-[13px]">{label}</span><strong className="num mt-1 block whitespace-nowrap text-[15px] font-bold tracking-[-0.04em] text-[#0d2340] min-[1700px]:text-[22px]">{formatarComSinal(value)}</strong><span className="mt-1.5 block text-[11px] text-[#63748a]">{formatarOportunidades(count)}</span></div>
              </Link>
            ))}
          </div>
        </div>
        <section className="revenue-panel p-4">
          <div className="flex items-start gap-2.5"><ChartNoAxesCombined aria-hidden className="mt-0.5 size-6 shrink-0 text-[#009b83]" /><div><h2 className="text-[13px] font-bold text-[#0d2340]">Impacto no forecast do mês</h2><p className="mt-1 text-[12px] text-[#6c7e91]">Saldo das oportunidades do recorte.</p></div></div>
          {/*
            Barras em vez de rosca: a rosca escondia as parcelas zeradas e o saldo
            no centro não batia com as fatias. Cada movimento vira uma barra
            proporcional; o saldo fica numa linha separada, com sinal.
          */}
          <ul className="mt-3 grid gap-2">
            {movements.map(({ key, label, color, value }) => {
              const proporcao = pesoMax > 0 ? Math.min(1, Math.abs(value) / pesoMax) : 0
              return (
                <li key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-[12px]">
                  <span className="truncate text-ink-muted">{label}</span>
                  <span className="num font-semibold text-ink-strong">{formatarComSinal(value)}</span>
                  <span className="col-span-2">
                    <BarraAnimada proporcao={proporcao} cor={color} />
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
            <span className="text-[12px] font-medium text-ink-muted">Saldo no mês</span>
            <strong className="num text-[18px] font-bold tracking-[-0.02em] text-ink-strong">{formatarComSinal(net)}</strong>
          </div>
        </section>
      </div>
      <div className="min-w-0 [&>section]:border-white/90 [&>section]:bg-white/95 [&_th]:bg-[#f0f6fb] [&_th]:text-[#476284]">
        <TopOpportunitiesTable rows={linhas} detalhes={detalhes} nav={nav} titulo="Principais oportunidades do mês" solucao={solucao} subtitulo={filtrando ? `${linhas.length} de ${rows.length} oportunidades para “${busca.trim()}”.` : 'Maiores impactos nas entradas, saídas, postergações e alterações de valor.'} hrefDe={(linha) => nav.href('opportunity', { opportunityId: linha.id, from: 'opportunities' })} acao={
          <form role="search" onSubmit={(event) => { event.preventDefault(); nav.onListQuery(termo.trim()) }} className="flex max-w-full flex-wrap items-center gap-1.5">
            <label className="relative min-w-0"><span className="sr-only">{OPORTUNIDADES_COPY.buscaLabel}</span><Search aria-hidden className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-[#607389]" /><input type="search" value={termo} onChange={(event) => setTermo(event.target.value)} placeholder={OPORTUNIDADES_COPY.buscaPlaceholder} className="h-8 w-[230px] max-w-full rounded-[6px] border border-[#dfe8ef] bg-white pl-8 pr-2 text-[11px] text-[#33466c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]" /></label>
            <button type="submit" className="h-8 rounded-[6px] border border-[#dfe8ef] bg-white px-2.5 text-[11px] font-semibold text-[#33466c] hover:bg-[#f0f6fb] focus-visible:outline-2 focus-visible:outline-[#086b6b]">Buscar</button>
            {filtrando && <button type="button" onClick={() => nav.onListQuery('')} className="h-8 rounded-[6px] border border-[#dfe8ef] bg-white px-2.5 text-[11px] font-semibold text-[#33466c] hover:bg-[#f0f6fb] focus-visible:outline-2 focus-visible:outline-[#086b6b]">{OPORTUNIDADES_COPY.limparBusca}</button>}
          </form>
        } />
      </div>
      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
        <OpportunitiesForecastChart semanas={semanas} />
        <section className="revenue-panel min-w-0 p-4">
          <div className="flex items-start gap-2.5"><ChartNoAxesColumnIncreasing aria-hidden className="size-5 shrink-0 text-[#009b83]" /><div><h2 className="text-[13px] font-bold text-[#0d2340]">Oportunidades por etapa</h2><p className="mt-1 text-[12px] text-[#6c7e91]">Contagem no recorte atual.</p></div></div>
          <div className="mt-5 space-y-3.5">{stages.map(([stage, count], index) => <MetricDetail key={stage} label={`Oportunidades na etapa ${stage}`} value={formatarOportunidades(count)} description={`${formatarOportunidades(count)} de ${formatarOportunidades(linhas.length)} no recorte atual.`}><span className="grid grid-cols-[80px_minmax(0,1fr)_18px] items-center gap-2 text-[11px]"><span className="truncate text-[#33466c]" title={stage}>{stage}</span><span className="h-3.5 overflow-hidden rounded-[6px] bg-[#edf4f8]"><span className="opportunities-stage-fill block h-full rounded-[6px]" style={{ width: `${count / maxStage * 100}%`, background: index === 0 ? '#00a58e' : index === 1 ? '#578cff' : '#a2c7ff' }} /></span><strong className="num text-right text-[#0d2340]">{count}</strong></span></MetricDetail>)}{stages.length === 0 && <p className="text-[12px] text-[#63748a]">Nenhuma oportunidade neste recorte.</p>}</div>
        </section>
        <section className="revenue-panel min-w-0 p-4">
          <div className="flex items-start gap-2.5"><Star aria-hidden className="size-5 shrink-0 text-[#009b83]" /><div><h2 className="text-[13px] font-bold text-[#0d2340]">Top 5 que explicam o mês</h2><p className="mt-1 text-[12px] text-[#6c7e91]">Maiores variações absolutas no forecast.</p></div></div>
          <ol className="mt-3 divide-y divide-[#edf2f7]">{top5.map((row, index) => <li key={row.id}><Link href={nav.href('opportunity', { opportunityId: row.id, from: 'opportunities' })} className="flex items-center gap-2.5 rounded-[6px] py-2 hover:bg-[#f0f8f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"><span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#e2f2f2] text-[12px] font-bold text-[#244466]">{index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-[11px] font-bold text-[#0d2340]">{row.account}</strong><span className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-[#6c7e91]">{row.solution}<span aria-hidden>·</span><span className="rounded-[6px] bg-[#edf4f8] px-1 text-[#476284]">{detalhes.get(row.id)?.origin ?? 'Sem origem'}</span></span></span><span className={`num shrink-0 text-[11px] font-bold ${row.delta < 0 ? 'text-[#d72f4c]' : 'text-[#008b74]'}`}>{formatarComSinal(row.delta)}</span><ChevronRight aria-hidden className="size-3 shrink-0 text-[#647da2]" /></Link></li>)}</ol>
          {top5.length === 0 && <p className="mt-5 text-[12px] text-[#63748a]">Nenhuma oportunidade neste recorte.</p>}
        </section>
      </div>
    </div>
  )
}
