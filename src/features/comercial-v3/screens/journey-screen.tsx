import { ArrowRight, BarChart3, Building2, ChevronRight, Clock3, Database, FileText, List, RefreshCw, Search, ShoppingCart, Target, TrendingUp, TriangleAlert, Trophy, Truck, UserPlus } from 'lucide-react'
import { VOLTAR_POR_ORIGEM } from '../copy'
import { TopOpportunitiesTable } from '../components/top-opportunities-table'
import { MetricDetail } from '../components/metric-detail'
import { filterOpportunityRows, type Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import { calculateJourneyConversion, calculateJourneyDaysChange, largestJourneyConversionDrop } from './journey-metrics'

type JourneyScreenProps = { rows: Top10Row[]; detalhes: Map<string, OpportunityDetail>; query: string; nav: CommercialNav }

// Visual fixtures from the supplied journey reference. They do not measure the V3 snapshot.
const ETAPAS_DEMO_BASE = [
  { label: 'Demanda', value: '2,4 mil', rate: '↑ +12%', detail: 'vs. ago/26', icon: UserPlus, tone: 'green', volume: 2400, days: 3, previous: 4 },
  { label: 'Conta', value: '1,9 mil', rate: '', detail: 'conversão', icon: Building2, tone: 'blue', volume: 1900, days: 5, previous: 6 },
  { label: 'Qualificação', value: '1,4 mil', rate: '', detail: 'conversão', icon: Search, tone: 'blue', volume: 1400, days: 12, previous: 10 },
  { label: 'Oportunidade', value: '1,1 mil', rate: '', detail: 'conversão', icon: Target, tone: 'green', volume: 1100, days: 18, previous: 16 },
  { label: 'Proposta', value: '850', rate: '', detail: 'conversão', icon: FileText, tone: 'blue', volume: 850, days: 40, previous: 28 },
  { label: 'Win', value: '652', rate: '', detail: 'conversão', icon: Trophy, tone: 'amber', volume: 652, days: 12, previous: 10 },
  { label: 'Pedido', value: '620', rate: '', detail: 'conversão', icon: ShoppingCart, tone: 'green', volume: 620, days: 6, previous: 5 },
  { label: 'Entrega', value: '588', rate: '', detail: 'conversão', icon: Truck, tone: 'blue', volume: 588, days: 14, previous: 6 },
  { label: 'Base', value: '564', rate: '96%', detail: 'cobertura', icon: Database, tone: 'blue', volume: 564, days: 8, previous: 7 },
  { label: 'Expansão', value: '178', rate: '↑ +32%', detail: 'crescimento', icon: TrendingUp, tone: 'green', volume: 178, days: 20, previous: 16 },
  { label: 'Retenção', value: '541', rate: '↑ 96%', detail: 'retenção', icon: RefreshCw, tone: 'green', volume: 541, days: 6, previous: 5 },
]
type EtapaDemo = (typeof ETAPAS_DEMO_BASE)[number] & { conversion: number | null }
const ETAPAS_DEMO: EtapaDemo[] = ETAPAS_DEMO_BASE.map((stage, index) => {
  const conversion = stage.detail === 'conversão'
    ? calculateJourneyConversion(stage.volume, ETAPAS_DEMO_BASE[index - 1]?.volume ?? 0)
    : null
  return { ...stage, conversion, rate: conversion === null ? stage.rate : `${conversion}%` }
})
const ETAPAS_COM_CONVERSAO_DEMO = ETAPAS_DEMO.filter((stage): stage is EtapaDemo & { conversion: number } => stage.conversion !== null)
const INDICADORES_COMPLEMENTARES_DEMO = [
  { stage: ETAPAS_DEMO[0], label: 'Demanda · crescimento' },
  { stage: ETAPAS_DEMO[8], label: 'Base · cobertura' },
  { stage: ETAPAS_DEMO[9], label: 'Expansão · crescimento' },
  { stage: ETAPAS_DEMO[10], label: 'Retenção' },
]
const ICON_TONES = { green: 'bg-[#e9faf6] text-[#00a88b]', blue: 'bg-[#eef4ff] text-[#0866ff]', amber: 'bg-[#fff8e9] text-[#f5a000]' }
const MAIOR_QUEDA_DE_CONVERSAO_DEMO = largestJourneyConversionDrop(ETAPAS_COM_CONVERSAO_DEMO)
const ATRITOS_DEMO = [
  ...(MAIOR_QUEDA_DE_CONVERSAO_DEMO ? [{
    label: `${MAIOR_QUEDA_DE_CONVERSAO_DEMO.from} → ${MAIOR_QUEDA_DE_CONVERSAO_DEMO.to}`,
    value: `−${Math.abs(MAIOR_QUEDA_DE_CONVERSAO_DEMO.delta)} p.p.`,
    detail: 'Maior redução entre taxas consecutivas de conversão.',
    comparison: `${MAIOR_QUEDA_DE_CONVERSAO_DEMO.fromRate}% → ${MAIOR_QUEDA_DE_CONVERSAO_DEMO.toRate}%`,
    tone: 'text-[#ff244b] bg-[#fff0f3]',
  }] : []),
  ...ETAPAS_DEMO.filter((stage) => stage.label === 'Proposta' || stage.label === 'Entrega').map((stage) => ({
    label: stage.label,
    value: `+${stage.days - stage.previous} dias`,
    detail: 'Permanência média acima do mês anterior.',
    comparison: `Atual ${stage.days} · anterior ${stage.previous} dias`,
    tone: stage.label === 'Proposta' ? 'text-[#f39800] bg-[#fff8e9]' : 'text-[#0866ff] bg-[#edf4ff]',
  })),
]
const EVENTOS_DEMO = [
  ['Nova demanda recebida', 'Tech Solutions · Solução Senior X', '12 min atrás'],
  ['Conta qualificada', 'Grupo Alvorecer · Segmento Indústria', '47 min atrás'],
  ['Oportunidade avançou para Proposta', 'Prefeitura de Blumenau · R$ 2,1 mi', '2 horas atrás'],
  ['Proposta convertida em Win', 'Rede Vita · R$ 850 mil', '3 horas atrás'],
  ['Pedido emitido', 'Colégio Horizonte · R$ 320 mil', '4 horas atrás'],
  ['Entrega concluída', 'Hospital Santa Clara · R$ 480 mil', '6 horas atrás'],
]
const panel = 'revenue-panel min-w-0 rounded-[14px] bg-white/95 p-4'

function labelNoEixo(label: string) {
  if (label === 'Qualificação') return <>Quali<br/>ficação</>
  if (label === 'Oportunidade') return <>Oportu<br/>nidade</>
  return label
}

function detalheDaEtapa(stage: EtapaDemo) {
  const volume = stage.volume.toLocaleString('pt-BR')
  const previousVolume = ETAPAS_DEMO_BASE[ETAPAS_DEMO.findIndex((candidate) => candidate.label === stage.label) - 1]?.volume
  const conversion = stage.conversion === null
    ? 'Conversão não calculada para esta etapa.'
    : `Conversão calculada: ${stage.conversion}% (${volume} de ${previousVolume?.toLocaleString('pt-BR')} registros da etapa anterior).`
  return `Volume da etapa: ${volume} registros. ${conversion} Permanência média demonstrativa: ${stage.days} dias.`
}

function JourneyBarChart({ title, unit, stages, maximum, valueOf, formatValue, barColor }: {
  title: string
  unit: string
  stages: EtapaDemo[]
  maximum: number
  valueOf: (stage: EtapaDemo) => number
  formatValue: (value: number) => string
  barColor: string
}) {
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(maximum * fraction))

  return <section className="mt-4 first:mt-0" aria-label={`Gráfico de ${title.toLowerCase()}`}>
    <div className="mb-1 flex items-baseline justify-between gap-2">
      <h4 className="text-[12px] font-bold text-[#334b78]">{title}</h4>
      <span className="text-[11px] text-[#667ca5]">{unit}</span>
    </div>
    <div role="region" aria-label={`${title} demonstrativo por etapa; use rolagem horizontal em telas pequenas`} tabIndex={0} className="min-w-0 overflow-x-auto overscroll-x-contain scroll-discreta focus-visible:outline-2 focus-visible:outline-[#086b6b]">
      <div className="grid min-w-[870px] grid-cols-[42px_minmax(0,1fr)] gap-x-2">
        <div aria-hidden="true" className="relative mt-1 h-[156px]">
          {ticks.map((tick, index) => <span key={tick} className="absolute right-0 -translate-y-1/2 text-[10px] leading-none text-[#60749c]" style={{ top: `${100 - index * 25}%` }}>{formatValue(tick)}</span>)}
        </div>
        <ol className="grid h-[198px] gap-1" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((stage) => {
            const value = valueOf(stage)
            const percent = Math.max(0, Math.min(100, value / maximum * 100))
            const tooltip = detalheDaEtapa(stage)
            return <li key={stage.label} className="min-w-[68px]">
              <MetricDetail label={`${title}: ${stage.label}`} value={unit === 'Percentual' ? formatValue(value) : `${formatValue(value)} registros`} description={tooltip}>
                <span className="grid h-[198px] grid-rows-[160px_38px] text-center">
                  <span className="relative mt-1 block h-[156px]">
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(to bottom, #e4ebf4 1px, transparent 1px)', backgroundSize: '100% 25%' }}/>
                    <strong className="absolute left-0 z-10 w-full -translate-y-0.5 text-[10px] leading-none text-[#334b78]" style={{ bottom: `${Math.min(percent + 3, 88)}%` }}>{formatValue(value)}</strong>
                    <span className={'absolute bottom-0 left-1/2 w-9 max-w-[65%] -translate-x-1/2 rounded-t-[4px] ' + barColor} style={{ height: `${percent}%` }}/>
                  </span>
                  <span className="flex items-center justify-center px-0.5 text-[10px] font-medium leading-tight text-[#536c98]">{labelNoEixo(stage.label)}</span>
                </span>
              </MetricDetail>
            </li>
          })}
        </ol>
      </div>
    </div>
  </section>
}

function JourneyChart() {
  return <div className="mt-3 min-w-0">
    <JourneyBarChart title="Volume por etapa" unit="Registros" stages={ETAPAS_DEMO} maximum={3000} valueOf={(stage) => stage.volume} formatValue={(value) => value.toLocaleString('pt-BR')} barColor="bg-gradient-to-t from-[#80d4c4] to-[#b2e7dd]"/>
    <JourneyBarChart title="Conversão por etapa" unit="Percentual" stages={ETAPAS_COM_CONVERSAO_DEMO} maximum={100} valueOf={(stage) => stage.conversion ?? 0} formatValue={(value) => `${value}%`} barColor="bg-gradient-to-t from-[#00a88b] to-[#5acdb4]"/>
    <p className="mt-2 text-[11px] text-[#667ca5]">A conversão de cada etapa é calculada pelo volume da etapa dividido pelo volume da etapa anterior.</p>
  </div>
}

export function JourneyScreen({ rows, detalhes, query, nav }: JourneyScreenProps) {
  const linhas = filterOpportunityRows(rows, detalhes, query)
  const buscando = query.trim() !== ''
  return <div className="revenue-page grid min-w-0 gap-3">
    <header className="relative px-1 pb-1"><a href={nav.href('home')} aria-label={VOLTAR_POR_ORIGEM.home} className="mb-1 inline-block text-[12px] text-[#526b98] hover:underline focus-visible:outline-2 focus-visible:outline-[#00968c]">← Visão Executiva</a><h2 className="revenue-heading flex items-center gap-3 text-[30px] font-bold leading-tight tracking-[-.035em] text-[#071648]">Da origem à retenção <TrendingUp className="text-[#00968c]" size={29}/></h2><p className="revenue-subtitle mt-1 text-[16px] text-[#253b68]">Acompanhe o fluxo da receita em toda a jornada, da demanda à retenção.</p><p className="mt-1 text-[12px] text-[#50647d]">Demonstrativo fixo: etapas, gráficos e eventos não são dados reais e não respondem aos filtros. O retrato V3 aparece abaixo.</p></header>
    <section role="region" aria-label="Etapas conceituais demonstrativas da jornada" tabIndex={0} className="min-w-0 overflow-x-auto rounded-[14px] focus-visible:outline-2 focus-visible:outline-[#00968c]">
      <ol className="grid min-w-[1020px] grid-cols-11 gap-px">{ETAPAS_DEMO.map((stage,index)=>{const Icon=stage.icon;return <li key={stage.label} className="relative grid min-h-[137px] justify-items-center content-center gap-1 rounded-[12px] bg-white/95 px-1.5 py-2.5 text-center"><span className={'mb-1 grid h-10 w-12 place-items-center rounded-[12px] '+ICON_TONES[stage.tone as keyof typeof ICON_TONES]}><Icon size={23}/></span><strong className="text-[12px] text-[#071648]">{stage.label}</strong><span className="num text-[20px] font-bold text-[#071648]">{stage.value}</span><small className="text-[12px] font-bold text-[#009c80]">{stage.rate}</small><small className="text-[12px] text-[#667ca5]">{stage.detail}</small>{index<10&&<ChevronRight aria-hidden size={17} className="absolute -right-2 top-16 z-10 text-[#617aa4]"/>}</li>})}</ol>
    </section>
    <div className="grid min-w-0 gap-3">
      <section className={panel}><div className="flex flex-wrap items-start justify-between gap-2"><div className="flex gap-3"><BarChart3 className="shrink-0 text-[#00b997]"/><div><h3 className="text-[15px] font-bold text-[#071648]">Volume e conversão por etapa</h3><p className="mt-0.5 text-[12px] text-[#667ca5]">Cada gráfico usa sua própria unidade; o tempo está no comparativo abaixo.</p></div></div><div className="flex flex-wrap gap-3 text-[12px] text-[#526b98]"><span><b className="mr-1 text-[#8ad7c8]">■</b>Registros</span><span><b className="mr-1 text-[#00a88b]">■</b>Conversão (%)</span></div></div><JourneyChart/><div aria-label="Indicadores demonstrativos separados da conversão" className="mt-3 border-t border-[#eaf0f5] pt-3"><p className="text-[12px] font-semibold text-[#526b98]">Crescimento, cobertura e retenção</p><ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{INDICADORES_COMPLEMENTARES_DEMO.map(({stage,label})=><li key={stage.label} className="rounded-[9px] bg-[#f6f9fc] px-2.5 py-2"><span className="block text-[12px] text-[#526b98]">{label}</span><strong className="mt-0.5 block text-[15px] text-[#071648]">{stage.rate}</strong><small className="text-[12px] text-[#667ca5]">{stage.detail}</small></li>)}</ul></div></section>
      <section className={panel}><div className="flex gap-3"><TriangleAlert className="shrink-0 text-[#ff244b]"/><div><h3 className="text-[15px] font-bold text-[#071648]">Onde estão os maiores atritos?</h3><p className="mt-0.5 text-[12px] text-[#667ca5]">Quedas de conversão e permanência acima do mês anterior.</p></div></div><ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{ATRITOS_DEMO.map(({label,value,detail,comparison,tone},index)=><li key={label} className="flex min-w-0 items-center gap-3 rounded-[12px] border border-[#eaf0f5] bg-white/70 px-3 py-2.5"><span className={'grid h-10 w-10 shrink-0 place-items-center rounded-full text-[21px] font-bold '+tone}>{index+1}</span><div className="min-w-0 flex-1"><strong className="block text-[12px] text-[#071648]">{label}</strong><small className="mt-1 block text-[12px] text-[#667ca5]">{detail}</small></div><div className="shrink-0 text-right"><strong className={'block text-[15px] '+tone.split(' ')[0]}>{value}</strong><small className="text-[12px] text-[#667ca5]">{comparison}</small></div></li>)}</ol></section>
    </div>
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className={panel}><div className="mb-2 flex items-start justify-between gap-2"><div className="flex gap-3"><Clock3 className="shrink-0 text-[#00a88b]"/><div><h3 className="text-[15px] font-bold text-[#071648]">Tempo médio por fase (dias)</h3><p className="text-[12px] text-[#667ca5]">Barras separadas com valores de setembro e do mês anterior.</p></div></div><div className="flex flex-wrap gap-3 text-[12px] text-[#667ca5]"><span><b className="mr-1 text-[#00a88b]">■</b>Set/2026</span><span><b className="mr-1 text-[#087cff]">■</b>Mês anterior</span></div></div><div role="region" aria-label="Comparativo demonstrativo de permanência por etapa, com rolagem horizontal quando necessário" tabIndex={0} className="min-w-0 overflow-x-auto overscroll-x-contain scroll-discreta focus-visible:outline-2 focus-visible:outline-[#086b6b]"><div className="min-w-[520px]"><div className="grid grid-cols-[88px_minmax(100px,1fr)_65px_82px_64px] gap-2 border-b border-[#eaf0f5] py-1 text-[11px] text-[#667ca5]"><span>Etapa</span><span aria-hidden="true"/><span className="text-center">Set/2026</span><span className="text-center">Mês anterior</span><span>Variação</span></div><ul>{ETAPAS_DEMO.map((stage)=>{const change=calculateJourneyDaysChange(stage.days,stage.previous);const delta=stage.days-stage.previous;const changeLabel=change === null?'—':`${change>0?'+':''}${change}%`;return <li key={stage.label} className="border-b border-[#eff3f7] last:border-0"><MetricDetail label={`Tempo médio em ${stage.label}`} value={`Set/2026: ${stage.days} dias · mês anterior: ${stage.previous} dias`} description={`Variação: ${delta>0?'+':''}${delta} dias (${changeLabel}). Percentual calculado sobre o mês anterior.`}><span className="grid grid-cols-[88px_minmax(100px,1fr)_65px_82px_64px] items-center gap-2 py-1.5 text-[11px]"><span className="text-[#334b78]">{stage.label}</span><span className="grid gap-1" aria-hidden="true"><span className="h-1.5 rounded bg-[#eef3f7]"><span className="block h-full rounded bg-gradient-to-r from-[#13b997] to-[#3ad1b1]" style={{width:`${Math.min(stage.days/45*100,100)}%`}}/></span><span className="h-1.5 rounded bg-[#eef3f7]"><span className="block h-full rounded bg-[#9fcfff]" style={{width:`${Math.min(stage.previous/45*100,100)}%`}}/></span></span><strong className="text-center text-[#11749c]">{stage.days}</strong><span className="text-center text-[#667ca5]">{stage.previous}</span><strong className={change!==null&&change>0?'text-[#ff244b]':'text-[#00a88b]'}>{changeLabel}</strong></span></MetricDetail></li>})}</ul></div></div></section>
      <section className={panel}><div className="flex items-start justify-between gap-2"><div className="flex gap-3"><List className="text-[#00b997]"/><div><h3 className="text-[15px] font-bold text-[#071648]">Movimentos recentes na jornada</h3><p className="text-[12px] text-[#667ca5]">Eventos ilustrativos que movimentam a receita.</p></div></div><a href="#journey-v3" className="flex shrink-0 items-center gap-2 rounded-[7px] border border-[#e2e9f4] px-2 py-1.5 text-[12px] text-[#071648] focus-visible:outline-2 focus-visible:outline-[#00968c]">Ver recorte V3 <ArrowRight size={13}/></a></div><ul className="mt-2">{EVENTOS_DEMO.map(([title,detail,time],i)=>{const s=ETAPAS_DEMO[[0,1,3,5,6,7][i]];const Icon=s.icon;return <li key={title} className="flex items-center gap-3 border-b border-[#eff3f7] py-1.5 last:border-0"><span className={'grid h-8 w-8 shrink-0 place-items-center rounded-full '+ICON_TONES[s.tone as keyof typeof ICON_TONES]}><Icon size={18}/></span><div className="min-w-0 flex-1"><strong className="block text-[12px] text-[#071648]">{title}</strong><small className="block text-[12px] text-[#667ca5]">{detail}</small></div><small className="shrink-0 text-[12px] text-[#667ca5]">{time}</small></li>})}</ul></section>
    </div>
    <div id="journey-v3" className="min-w-0 scroll-mt-4"><TopOpportunitiesTable rows={linhas} detalhes={detalhes} nav={nav} titulo={buscando ? 'Oportunidades encontradas' : 'Oportunidades no recorte V3'} subtitulo={buscando ? linhas.length + ' de ' + rows.length + ' oportunidades para “' + query.trim() + '”.' : 'Cenário demonstrativo filtrado pelo período, solução e filial selecionados. Win, Pedido e Entrega são eventos distintos; o snapshot não mede conversão ou permanência.'} acao={buscando ? <button type="button" onClick={() => nav.onQuery('')} className="rounded-[9px] border border-[#dfe8ef] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#2b425e] hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]">Limpar busca</button> : null} hrefDe={(linha) => nav.href('opportunity', { opportunityId: linha.id, from: 'journey' })}/></div>
  </div>
}


