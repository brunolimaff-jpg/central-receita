import { KPI_LABELS } from '../copy'
import { formatarComSinal, formatarMilhoes, formatarMilhoesExpandido, formatarPercentualInteiro } from '../format'
import { MetricDetail } from './metric-detail'
import type { Kpi, KpiKey } from '../model'
import { CircleDollarSign, Target, TrendingUp, TriangleAlert } from 'lucide-react'

/**
 * Faixa de KPIs da Home na ordem exata do plano Task 4 Step 5, l.418-422:
 * Meta do mês → Realizado → Forecast oficial → Forecast atual → Δ versus meta.
 *
 * Valores e legendas vêm do `HomeModel` (nenhum número fixo aqui); barras mostram
 * atingimento da meta. O forecast atual também mostra sua variação vs. oficial.
 */

type Tom = {
  cartao: string
  icone: string
  valor: string
  letra: string
  barra: string
}

const TONS: Record<KpiKey, Tom> = {
  meta: {
    cartao: 'border-[#dfe8ef] bg-white',
    icone: 'bg-[#e8f7f3] text-[#009b83]',
    valor: 'text-[#0d2340]',
    letra: 'M',
    barra: 'bg-[linear-gradient(90deg,#04a88b,#42c5ae)]',
  },
  realizado: {
    cartao: 'border-[#dfe8ef] bg-white',
    icone: 'bg-[#e8f7f3] text-[#009b83]',
    valor: 'text-[#0d2340]',
    letra: 'R',
    barra: 'bg-[linear-gradient(90deg,#04a88b,#42c5ae)]',
  },
  forecastOficial: {
    cartao: 'border-[#dfe8ef] bg-white',
    icone: 'bg-[#eaf2ff] text-[#2f78ea]',
    valor: 'text-[#0d2340]',
    letra: 'F',
    barra: 'bg-[linear-gradient(90deg,#2f78ea,#48a4ef)]',
  },
  forecastAtual: {
    cartao: 'border-[#dfe8ef] bg-white',
    icone: 'bg-[#e8f7f3] text-[#009b83]',
    valor: 'text-[#0d2340]',
    letra: 'A',
    barra: 'bg-[linear-gradient(90deg,#ef4c64,#ff8392)]',
  },
  deltaMeta: {
    cartao: 'border-[#f3d9de] bg-[linear-gradient(180deg,#ffffff,#fff7f8)]',
    icone: 'bg-[#fff0f2] text-[#ef4c64]',
    valor: 'text-[#da2948]',
    letra: 'Δ',
    barra: '',
  },
}

const MEANINGS: Record<KpiKey, string> = {
  meta: 'Objetivo financeiro do período e dos filtros selecionados.',
  realizado: 'Pedidos integrados com data, na posição do recorte. Assinatura e conferência ainda não representam integração.',
  forecastOficial: 'Fotografia congelada validada para o período. A referência permanece fixa durante a comparação.',
  forecastAtual: 'Previsão revisada na posição atual do recorte. A barra compara o valor com a meta; a legenda mostra a variação contra o forecast oficial.',
  deltaMeta: 'Forecast atual menos a meta. Um valor negativo indica quanto falta na previsão para atingir o objetivo.',
}

export function KpiStrip({ kpis, resumo = false, overview = false }: { kpis: Kpi[]; resumo?: boolean; overview?: boolean }) {
  const metaKpi = kpis.find((kpi) => kpi.key === 'meta')
  const meta = metaKpi?.value ?? 0
  const unavailableMeta = !metaKpi ? 'Meta indisponível' : meta <= 0 ? 'Meta sem valor positivo' : 'Atingimento indisponível'
  if (overview) {
    const cards = [
      { key: 'meta' as const, title: 'Meta do período', Icon: Target },
      { key: 'realizado' as const, title: 'Realizado', Icon: CircleDollarSign },
      { key: 'forecastAtual' as const, title: 'Forecast atual', Icon: TrendingUp },
      { key: 'deltaMeta' as const, title: 'Gap para a meta', Icon: TriangleAlert },
    ]
    return (
      <section aria-label="Indicadores da receita" className="revenue-overview-kpis grid min-w-0 grid-cols-2 gap-2">
        {cards.map(({ key, title, Icon }) => {
          const metric = kpis.find((item) => item.key === key)
          const value = metric?.value ?? 0
          const ratio = meta > 0 && metric ? value / meta : null
          const tone = key === 'deltaMeta' ? 'text-[#c93249]' : key === 'forecastAtual' ? 'text-[#008c77]' : 'text-[#10294c]'
          const iconTone = key === 'deltaMeta' ? 'bg-[#fff0f2] text-[#db5261]' : key === 'forecastAtual' ? 'bg-[#eaf8f5] text-[#009b83]' : key === 'realizado' ? 'bg-[#edf3ff] text-[#3576de]' : 'bg-[#eaf8f5] text-[#009b83]'
          return (
            <article key={key} className="revenue-overview-kpi-card relative flex min-h-[96px] min-w-0 items-center gap-2 rounded-[14px] border border-white/90 bg-white/90 px-2.5 py-2 shadow-[0_8px_25px_rgba(36,65,78,0.08)] backdrop-blur-[12px]">
              <span aria-hidden className={'revenue-overview-kpi-icon grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] ' + iconTone}>
                <Icon className="h-[16px] w-[16px]" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <span className="block truncate text-[11.5px] font-medium text-[#536781]">{title}</span>
                <MetricDetail label={title} value={metric ? formatarMilhoesExpandido(value) : 'Indisponível'} description={'Demonstração · ' + MEANINGS[key]}><strong className={'revenue-overview-kpi-value num mt-1 block truncate text-[18px] font-bold leading-none tracking-[-0.035em] ' + tone}>
                  {!metric ? '—' : key === 'deltaMeta' ? formatarComSinal(value) : formatarMilhoes(value)}
                </strong></MetricDetail>
                {key === 'forecastAtual' && ratio !== null ? <>
                  <small className="mt-1.5 flex flex-wrap justify-between gap-x-2 text-[10.5px] font-semibold leading-4 text-[#61728a]">
                    <span>{formatarPercentualInteiro(ratio)} da meta</span><span>{metric?.caption ?? '—'}</span>
                  </small>
                  <span role="progressbar" aria-label="Forecast atual sobre a meta" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, ratio * 100))} className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#eaf0f3]">
                    <span className="block h-full rounded-full bg-[#ef7d89]" style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }} />
                  </span>
                </> : key === 'forecastAtual' ? <small className="mt-1.5 block break-words text-[10.5px] font-semibold leading-4 text-[#61728a]">{unavailableMeta} · {metric?.caption ?? '—'}</small> : <small className="mt-1.5 block truncate text-[10.5px] font-semibold text-[#61728a]">{metric?.caption ?? '—'}</small>}
              </div>
            </article>
          )
        })}
      </section>
    )
  }

  if (resumo) {
    const valor = (key: KpiKey) => kpis.find((kpi) => kpi.key === key)?.value ?? 0
    const leituras = [
      { titulo: 'Falta realizar para a meta', valor: meta - valor('realizado'), detalhe: 'Meta menos realizado · posição do snapshot' },
      { titulo: 'Forecast acima do realizado', valor: valor('forecastAtual') - valor('realizado'), detalhe: 'Diferença entre as duas leituras · não é pedido integrado' },
      { titulo: 'Revisão desde a foto oficial', valor: valor('forecastAtual') - valor('forecastOficial'), detalhe: 'Forecast atual menos referência oficial' },
    ]
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {leituras.map((item) => <article key={item.titulo} className="min-w-0 rounded-[14px] border border-[#dfe8ef] bg-white px-5 py-3.5"><p className="text-[12px] font-semibold text-[#496079]">{item.titulo}</p><p className={`num mt-2 text-[25px] font-bold tracking-tight ${item.valor < 0 ? 'text-[#b8294a]' : 'text-[#0d2340]'}`}>{formatarComSinal(item.valor)}</p><p className="mt-1.5 text-[11px] leading-4 text-[#50647d]">{item.detalhe}</p></article>)}
      </div>
    )
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const tom = TONS[kpi.key]
        const comBarra = kpi.key !== 'deltaMeta'
        const razaoMeta = meta > 0 ? kpi.value / meta : null
        const largura = razaoMeta === null ? 0 : Math.max(0, Math.min(100, razaoMeta * 100))

        return (
          <article
            key={kpi.key}
            className={`flex min-h-[112px] flex-col justify-between rounded-[14px] border px-[18px] py-4 shadow-[0_3px_9px_rgba(32,73,91,0.025)] transition-premium hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(32,73,91,0.06)] ${tom.cartao}`}
          >
            <p className="flex items-center gap-2 text-[13px] font-semibold text-[#496079]">
              <span
                aria-hidden
                className={`grid h-[26px] w-[26px] place-items-center rounded-[9px] text-[13px] font-black ${tom.icone}`}
              >
                {tom.letra}
              </span>
              {KPI_LABELS[kpi.key]}
            </p>

            <MetricDetail label={KPI_LABELS[kpi.key]} value={formatarMilhoesExpandido(kpi.value)} description={'Demonstração · ' + MEANINGS[kpi.key]}><span
              className={`num my-2.5 text-[26px] font-extrabold leading-none tracking-[-0.035em] ${tom.valor}`}
            >
              {kpi.key === 'deltaMeta' ? formatarComSinal(kpi.value) : formatarMilhoes(kpi.value)}
            </span></MetricDetail>

            {kpi.key === 'forecastAtual' && razaoMeta !== null ? <div className="mt-1 text-[10px] text-[#62748b]">
              <div className="flex items-center justify-between gap-2">
                <span className="num whitespace-nowrap">{formatarPercentualInteiro(razaoMeta)} da meta</span>
                <b className="num whitespace-nowrap font-bold text-[#62748b]">{kpi.caption}</b>
              </div>
              <div role="progressbar" aria-label="Forecast atual sobre a meta" aria-valuemin={0} aria-valuemax={100} aria-valuenow={largura} className="mt-1 h-2 overflow-hidden rounded-full bg-[#eaf0f3]">
                <span className={`block h-full rounded-full ${tom.barra}`} style={{ width: `${largura}%` }} />
              </div>
            </div> : kpi.key === 'forecastAtual' ? <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#62748b]"><span>{unavailableMeta}</span><b className="num whitespace-nowrap font-bold">{kpi.caption}</b></div> : <p className="flex items-center gap-2 text-[12px] text-[#62748b]">
              {comBarra && (
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#eaf0f3]">
                  <span
                    className={`block h-full rounded-full ${tom.barra}`}
                    style={{ width: `${largura}%` }}
                  />
                </span>
              )}
              <b className={`num font-bold ${kpi.key === 'deltaMeta' ? 'text-[#da2948]' : ''}`}>
                {kpi.caption}
              </b>
            </p>}
          </article>
        )
      })}
    </div>
  )
}
