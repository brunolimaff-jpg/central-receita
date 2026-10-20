import { ArrowRight, BarChart3, Building2, ChevronRight, Clock3, Database, FileText, List, RefreshCw, Search, ShoppingCart, Target, TrendingUp, TriangleAlert, Trophy, Truck, UserPlus } from 'lucide-react'
import { VOLTAR_POR_ORIGEM } from '../copy'
import { TopOpportunitiesTable } from '../components/top-opportunities-table'
import { filterOpportunityRows, type Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'

type JourneyScreenProps = { rows: Top10Row[]; detalhes: Map<string, OpportunityDetail>; query: string; nav: CommercialNav }

// Visual fixtures from the supplied journey reference. They do not measure the V3 snapshot.
const ETAPAS_DEMO = [
  { label: 'Demanda', value: '2,4 mil', rate: '↑ +12%', detail: 'vs. ago/26', icon: UserPlus, tone: 'green', volume: 2400, conversion: 68, days: 3, previous: 4 },
  { label: 'Conta', value: '1,9 mil', rate: '78%', detail: 'conversão', icon: Building2, tone: 'blue', volume: 1900, conversion: 78, days: 5, previous: 6 },
  { label: 'Qualificação', value: '1,4 mil', rate: '74%', detail: 'conversão', icon: Search, tone: 'blue', volume: 1400, conversion: 74, days: 12, previous: 10 },
  { label: 'Oportunidade', value: '1,1 mil', rate: '79%', detail: 'conversão', icon: Target, tone: 'green', volume: 1100, conversion: 79, days: 18, previous: 16 },
  { label: 'Proposta', value: '850', rate: '77%', detail: 'conversão', icon: FileText, tone: 'blue', volume: 850, conversion: 77, days: 40, previous: 28 },
  { label: 'Win', value: '652', rate: '76%', detail: 'conversão', icon: Trophy, tone: 'amber', volume: 652, conversion: 76, days: 12, previous: 10 },
  { label: 'Pedido', value: '620', rate: '95%', detail: 'conversão', icon: ShoppingCart, tone: 'green', volume: 620, conversion: 95, days: 6, previous: 5 },
  { label: 'Entrega', value: '588', rate: '95%', detail: 'conversão', icon: Truck, tone: 'blue', volume: 588, conversion: 95, days: 14, previous: 6 },
  { label: 'Base', value: '564', rate: '96%', detail: 'cobertura', icon: Database, tone: 'blue', volume: 564, conversion: 96, days: 8, previous: 7 },
  { label: 'Expansão', value: '178', rate: '↑ +32%', detail: 'crescimento', icon: TrendingUp, tone: 'green', volume: 178, conversion: 32, days: 20, previous: 16 },
  { label: 'Retenção', value: '541', rate: '↑ 96%', detail: 'retenção', icon: RefreshCw, tone: 'green', volume: 541, conversion: 96, days: 6, previous: 5 },
]
const ETAPAS_COM_CONVERSAO_DEMO = ETAPAS_DEMO.flatMap((stage, index) => stage.detail === 'conversão' ? [{ stage, index }] : [])
const INDICADORES_COMPLEMENTARES_DEMO = [
  { stage: ETAPAS_DEMO[0], label: 'Demanda · crescimento' },
  { stage: ETAPAS_DEMO[8], label: 'Base · cobertura' },
  { stage: ETAPAS_DEMO[9], label: 'Expansão · crescimento' },
  { stage: ETAPAS_DEMO[10], label: 'Retenção' },
]
const ICON_TONES = { green: 'bg-[#e9faf6] text-[#00a88b]', blue: 'bg-[#eef4ff] text-[#0866ff]', amber: 'bg-[#fff8e9] text-[#f5a000]' }
const ATRITOS_DEMO = [
  ['Qualificação → Oportunidade', '-18 p.p.', 'Maior queda de conversão nesta etapa.', '56% → 38%', 'text-[#ff244b] bg-[#fff0f3]'],
  ['Proposta → Win', '+12 dias', 'Tempo de permanência acima da média.', '28 → 40 dias', 'text-[#f39800] bg-[#fff8e9]'],
  ['Pedido → Entrega', '+8 dias', 'Aumento no tempo de ciclo da entrega.', '6 → 14 dias', 'text-[#0866ff] bg-[#edf4ff]'],
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

function JourneyChart() {
  const x = (i: number) => 70 + i * 62
  const y = (value: number) => 184 - value * 1.52
  return <div role="region" aria-label="Gráfico demonstrativo da jornada, com rolagem horizontal quando necessário" tabIndex={0} className="mt-3 min-w-0 overflow-x-auto overflow-y-hidden scroll-discreta focus-visible:outline-2 focus-visible:outline-[#086b6b]">
    <svg viewBox="0 0 750 225" role="img" aria-label="Volumes por etapa, conversão de Conta a Entrega e permanência em dias; valores fixos, sem medição V3." className="block w-full min-w-[750px]">
    <defs><linearGradient id="journey-volume" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#80d4c4" stopOpacity=".8"/><stop offset="1" stopColor="#80d4c4" stopOpacity=".2"/></linearGradient></defs>
    {[0, 600, 1200, 1800, 2400, 3000].map((n, i) => <g key={n}><line x1="50" x2="709" y1={184-i*30.4} y2={184-i*30.4} stroke="#e4ebf4" strokeDasharray="3 3"/><text x="42" y={188-i*30.4} textAnchor="end" fontSize="12" fill="#60749c">{n.toLocaleString('pt-BR')}</text><text x="720" y={188-i*30.4} fontSize="12" fill="#60749c">{i*20}</text></g>)}
    {ETAPAS_DEMO.map((stage, i) => { const linhas = stage.label === 'Qualificação' ? ['Quali', 'ficação'] : stage.label === 'Oportunidade' ? ['Oportu', 'nidade'] : [stage.label]; return <g key={stage.label}><line x1={x(i)} x2={x(i)} y1="32" y2="184" stroke="#edf1f8" strokeDasharray="3 3"/><rect x={x(i)-21} y={184-stage.volume/3000*152} width="42" height={stage.volume/3000*152} rx="3" fill="url(#journey-volume)"/><text x={x(i)} y={linhas.length === 1 ? 208 : 202} textAnchor="middle" fill="#536c98" fontSize="12">{linhas.map((linha, index) => <tspan key={linha} x={x(i)} dy={index === 0 ? 0 : 12}>{linha}</tspan>)}</text></g>})}
    <polyline points={ETAPAS_COM_CONVERSAO_DEMO.map(({stage, index})=>`${x(index)},${y(stage.conversion)}`).join(' ')} fill="none" stroke="#00a88b" strokeWidth="2"/>
    <polyline points={ETAPAS_DEMO.map((s,i)=>`${x(i)},${y(s.days)}`).join(' ')} fill="none" stroke="#087cff" strokeWidth="2"/>
    {ETAPAS_COM_CONVERSAO_DEMO.map(({stage, index})=><circle key={stage.label} cx={x(index)} cy={y(stage.conversion)} r="4.5" fill="#00a88b" stroke="white" strokeWidth="1.5"/>)}
    {ETAPAS_DEMO.map((s,i)=><circle key={s.label} cx={x(i)} cy={y(s.days)} r="4.5" fill="#087cff" stroke="white" strokeWidth="1.5"/>)}
    <text x="7" y="122" transform="rotate(-90 7 122)" fontSize="12" fill="#60749c" textAnchor="middle">Volume de registros</text><text x="746" y="122" transform="rotate(90 746 122)" fontSize="12" fill="#60749c" textAnchor="middle">Conversão (%) / tempo (dias)</text>
    </svg>
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
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <section className={panel}><div className="flex flex-wrap items-start justify-between gap-2"><div className="flex gap-3"><BarChart3 className="shrink-0 text-[#00b997]"/><div><h3 className="text-[15px] font-bold text-[#071648]">Indicadores e tempo por etapa</h3><p className="mt-0.5 text-[12px] text-[#667ca5]">Volume e permanência por etapa; a linha verde mostra conversão de Conta a Entrega.</p></div></div><div className="flex flex-wrap gap-3 text-[12px] text-[#526b98]"><span><b className="mr-1 text-[#8ad7c8]">■</b>Volume</span><span><b className="mr-1 text-[#00a88b]">━●</b>Conversão</span><span><b className="mr-1 text-[#087cff]">━●</b>Tempo (dias)</span></div></div><JourneyChart/><div aria-label="Indicadores demonstrativos separados da conversão" className="mt-3 border-t border-[#eaf0f5] pt-3"><p className="text-[12px] font-semibold text-[#526b98]">Crescimento, cobertura e retenção</p><ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{INDICADORES_COMPLEMENTARES_DEMO.map(({stage,label})=><li key={stage.label} className="rounded-[9px] bg-[#f6f9fc] px-2.5 py-2"><span className="block text-[12px] text-[#526b98]">{label}</span><strong className="mt-0.5 block text-[15px] text-[#071648]">{stage.rate}</strong><small className="text-[12px] text-[#667ca5]">{stage.detail}</small></li>)}</ul></div></section>
      <section className={panel}><div className="flex gap-3"><TriangleAlert className="shrink-0 text-[#ff244b]"/><div><h3 className="text-[15px] font-bold text-[#071648]">Onde estão os maiores atritos?</h3><p className="mt-0.5 text-[12px] text-[#667ca5]">Exemplos de queda de conversão ou maior tempo de permanência.</p></div></div><ol className="mt-3 grid gap-2">{ATRITOS_DEMO.map(([label,value,detail,comparison,tone],index)=><li key={label} className="flex items-center gap-3 rounded-[12px] border border-[#eaf0f5] bg-white/70 px-3 py-2.5"><span className={'grid h-10 w-10 shrink-0 place-items-center rounded-full text-[21px] font-bold '+tone}>{index+1}</span><div className="min-w-0 flex-1"><strong className="block text-[12px] text-[#071648]">{label}</strong><small className="mt-1 block text-[12px] text-[#667ca5]">{detail}</small></div><div className="shrink-0 text-right"><strong className={'block text-[15px] '+tone.split(' ')[0]}>{value}</strong><small className="text-[12px] text-[#667ca5]">{comparison}</small></div></li>)}</ol></section>
    </div>
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className={panel}><div className="mb-2 flex items-start justify-between gap-2"><div className="flex gap-3"><Clock3 className="text-[#00a88b]"/><div><h3 className="text-[15px] font-bold text-[#071648]">Tempo médio por fase (dias)</h3><p className="text-[12px] text-[#667ca5]">Comparativo demonstrativo com o mês anterior.</p></div></div><div className="flex gap-3 text-[12px] text-[#667ca5]"><span><b className="mr-1 text-[#00a88b]">●</b>Set/2026</span><span><b className="mr-1 text-[#087cff]">●</b>Mês anterior</span></div></div><div className="grid grid-cols-[90px_minmax(70px,1fr)_50px_65px_55px] gap-2 border-b border-[#eaf0f5] py-1 text-[12px] text-[#667ca5]"><span>Fase</span><span/><span>Set/2026</span><span>Mês anterior</span><span>Variação</span></div>{ETAPAS_DEMO.map(s=>{const change=Math.round((s.days/s.previous-1)*100);return <div key={s.label} className="grid grid-cols-[90px_minmax(70px,1fr)_50px_65px_55px] items-center gap-2 border-b border-[#eff3f7] py-[3px] text-[12px] last:border-0"><span className="text-[#334b78]">{s.label}</span><div className="relative h-2.5"><span className="absolute h-full rounded bg-[#e0f0ff]" style={{width:s.previous/45*100+'%'}}/><span className="absolute h-full rounded bg-gradient-to-r from-[#13b997] to-[#3ad1b1]" style={{width:s.days/45*100+'%'}}/></div><strong className="text-center text-[#11749c]">{s.days}</strong><span className="text-center text-[#667ca5]">{s.previous}</span><strong className={change>0?'text-[#ff244b]':'text-[#00a88b]'}>{change>0?'↑ +':'↓ '}{change}%</strong></div>})}</section>
      <section className={panel}><div className="flex items-start justify-between gap-2"><div className="flex gap-3"><List className="text-[#00b997]"/><div><h3 className="text-[15px] font-bold text-[#071648]">Movimentos recentes na jornada</h3><p className="text-[12px] text-[#667ca5]">Eventos ilustrativos que movimentam a receita.</p></div></div><a href="#journey-v3" className="flex shrink-0 items-center gap-2 rounded-[7px] border border-[#e2e9f4] px-2 py-1.5 text-[12px] text-[#071648] focus-visible:outline-2 focus-visible:outline-[#00968c]">Ver recorte V3 <ArrowRight size={13}/></a></div><ul className="mt-2">{EVENTOS_DEMO.map(([title,detail,time],i)=>{const s=ETAPAS_DEMO[[0,1,3,5,6,7][i]];const Icon=s.icon;return <li key={title} className="flex items-center gap-3 border-b border-[#eff3f7] py-1.5 last:border-0"><span className={'grid h-8 w-8 shrink-0 place-items-center rounded-full '+ICON_TONES[s.tone as keyof typeof ICON_TONES]}><Icon size={18}/></span><div className="min-w-0 flex-1"><strong className="block text-[12px] text-[#071648]">{title}</strong><small className="block text-[12px] text-[#667ca5]">{detail}</small></div><small className="shrink-0 text-[12px] text-[#667ca5]">{time}</small></li>})}</ul></section>
    </div>
    <div id="journey-v3" className="min-w-0 scroll-mt-4"><TopOpportunitiesTable rows={linhas} detalhes={detalhes} nav={nav} titulo={buscando ? 'Oportunidades encontradas' : 'Oportunidades no recorte V3'} subtitulo={buscando ? linhas.length + ' de ' + rows.length + ' oportunidades para “' + query.trim() + '”.' : 'Cenário demonstrativo filtrado pelo período, solução e filial selecionados. Win, Pedido e Entrega são eventos distintos; o snapshot não mede conversão ou permanência.'} acao={buscando ? <button type="button" onClick={() => nav.onQuery('')} className="rounded-[9px] border border-[#dfe8ef] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#2b425e] hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]">Limpar busca</button> : null} hrefDe={(linha) => nav.href('opportunity', { opportunityId: linha.id, from: 'journey' })}/></div>
  </div>
}


