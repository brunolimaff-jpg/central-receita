'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, CheckCircle2, Lightbulb, Target, TrendingUp, TriangleAlert, Users } from 'lucide-react'
import { calculateNewNameModel } from '../new-name-model'
import { buildPipelineOverview } from '../pipeline-model'
import { formatarOportunidades, formatarPercentualInteiro, formatarRealCompacto } from '../format'
import { TrajectoryChart, TrajectoryLegend } from '../components/trajectory-chart'
import { FadeUp, Stagger, StaggerItem } from '../components/motion-primitives'
import { BarraProgressoAnimada, Donut, ImpactRing, MetricCard, MovementCard, PAINEL, Panel, PanelSection, Selo, formatarDataCurta, type RingGroup, type Tom } from '../components/executive-ui'
import { NewNameSection } from '../components/new-name-section'
import { PipelineSection } from '../components/pipeline-section'
import type { CommercialNav } from '../nav'
import type { ImportDraft, ImportHistoryEntry } from '../manual-import-client'
import type { MovementLabel } from '../movement-rows'
import { buildTrajectory, cabecalhoTrajetoria, type TrajectorySnapshot } from '../trajectory-model'
import { CARTOES_FORECAST, ImportedForecastScreen, selectForecastMovements } from './import-forecast-screen'

/**
 * O snapshot do histórico usa `number | null`, onde nulo contamina a conta. O
 * modelo da trajetória só publica pontos com resumo inteiro conhecido; este
 * guarda diz quais entradas podem virar ponto, sem converter nulo em zero.
 */
const resumoConhecido = (snapshot: ImportHistoryEntry['snapshot']): boolean =>
  snapshot !== undefined
  && snapshot.forecastTotal !== null && snapshot.entered !== null && snapshot.exited !== null
  && snapshot.changed !== null && snapshot.realized !== null

/**
 * Visão Executiva: painel de leitura do mês de referência (docs/PLANO-VISAO-EXECUTIVA.md).
 *
 * Ordem: saudação com o retrato do mês, indicadores, movimento do forecast e o
 * briefing à direita; logo depois, a Trajetória da Receita (sempre visível); e
 * abaixo, as seções Forecast, New Name e Oportunidades.
 */

const NOTAS_FORECAST: Record<string, string> = {
  Entrou: 'Passou a cumprir o critério do mês',
  Saiu: 'Inclui as postergadas',
  Ganhou: 'Fechadas como ganhas no período',
  Perdeu: 'Fechadas como perdidas no período',
}

/**
 * Com zero contas novas, mostra quantos pedidos não têm classificação na fonte,
 * para não parecer ausência de dados. O singular importa: "1 pedidos" é o tipo
 * de detalhe que faz o diretor duvidar do resto do número.
 */
const umOuVarios = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`

const newNameDetalhe = (contas: number, pedidos: number, semClassificacao: number) =>
  contas === 0 && semClassificacao > 0
    ? `${umOuVarios(semClassificacao, 'pedido sem classificação', 'pedidos sem classificação')}`
    : `${umOuVarios(pedidos, 'pedido no período', 'pedidos no período')}`

/** Linha do briefing: um sinal curto com ícone tingido e seta. */
function Sinal({ icone: Icone, tom, titulo, detalhe, href }: {
  icone: typeof TrendingUp
  tom: Tom
  titulo: string
  detalhe: string
  href: string
}) {
  return (
    <Link href={href} className={`revenue-brief tone-${tom} transition-premium hover:-translate-y-px`}>
      <span aria-hidden className="revenue-brief-icon grid place-items-center"><Icone className="h-[17px] w-[17px]" strokeWidth={2} /></span>
      <span className="min-w-0">
        <b className="block truncate text-[13px] font-semibold text-ink-strong">{titulo}</b>
        <small className="mt-0.5 block truncate text-[11px] text-ink-muted">{detalhe}</small>
      </span>
      <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.8} />
    </Link>
  )
}

function EmptySection({ id, titulo, contexto, nav, carregando }: { id: string; titulo: string; contexto: string; nav: CommercialNav; carregando: boolean }) {
  return (
    <PanelSection id={id} titulo={titulo} contexto={contexto}>
      <div className={`${PAINEL} flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-[13px] text-ink-muted">{carregando ? 'Carregando a última carga…' : 'Sem carga importada para esta seção.'}</p>
        <Link href={nav.href('config')} className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-brand px-3 text-[13px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
          Abrir Configurações
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </PanelSection>
  )
}

export function ExecutivePage({ opportunities, orders, previous, history, nav, carregando = false }: {
  opportunities: ImportDraft['opportunities']
  orders: ImportDraft['orders']
  previous: ImportDraft | null
  /** Histórico de cargas já confirmadas, com o snapshot numérico quando existir. */
  history: ImportHistoryEntry[]
  nav: CommercialNav
  carregando?: boolean
}) {
  const referenceDate = opportunities?.referenceDate ?? orders?.referenceDate ?? ''
  const ordersReferenceDate = orders?.referenceDate ?? referenceDate
  const temCarga = Boolean(opportunities || orders)
  const referenceMismatch = Boolean(opportunities?.referenceDate && orders?.referenceDate && opportunities.referenceDate !== orders.referenceDate)
  const previousOpportunities = previous?.opportunities?.records ?? null
  const previousOrders = previous?.orders?.records ?? null

  const forecast = useMemo(
    () => opportunities && referenceDate ? selectForecastMovements(opportunities.records, previousOpportunities, referenceDate, 'mês') : null,
    [opportunities, previousOpportunities, referenceDate],
  )
  const newName = useMemo(
    () => orders ? calculateNewNameModel({ orders: orders.records, opportunities: opportunities?.records ?? null, previousOrders, previousOpportunities, referenceDate: ordersReferenceDate }) : null,
    [orders, opportunities, previousOrders, previousOpportunities, ordersReferenceDate],
  )
  const pipeline = useMemo(() => opportunities && referenceDate ? buildPipelineOverview(opportunities.records, referenceDate) : null, [opportunities, referenceDate])
  const trajectory = useMemo(
    () => buildTrajectory({
      opportunities: opportunities?.records ?? [],
      previous: previousOpportunities,
      referenceDate,
      // O histórico guarda `number | null`; o modelo só desenha um ponto quando o
      // resumo inteiro é conhecido. Carga com resumo nulo fica de fora do eixo.
      history: history.flatMap(entry => entry.snapshot && resumoConhecido(entry.snapshot)
        ? [{ at: entry.at, snapshot: entry.snapshot as TrajectorySnapshot }]
        : []),
    }),
    [opportunities, previousOpportunities, referenceDate, history],
  )
  const cabecalho = cabecalhoTrajetoria(trajectory, previous?.opportunities?.importedAt ?? previous?.opportunities?.savedAt ?? null)

  const resultado = forecast?.result
  const esperado = resultado?.projected ?? null
  const realizado = resultado?.realized.value ?? null
  const emAberto = resultado?.open ?? null
  const progresso = esperado !== null && esperado > 0 && realizado !== null ? Math.min(100, realizado / esperado * 100) : null
  const pipelineValor = pipeline && !pipeline.horizon.some(month => month.value === null)
    ? pipeline.horizon.reduce((soma, month) => soma + (month.value ?? 0), 0)
    : null
  const mesExtenso = referenceDate ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${referenceDate.slice(0, 7)}-01T12:00:00Z`)) : ''
  const mesCapitalizado = mesExtenso ? mesExtenso.charAt(0).toUpperCase() + mesExtenso.slice(1) : 'Mês da referência'
  const mesCurto = mesExtenso.split(' de ')[0]

  const grupo = (key: string) => forecast?.grupos.find(item => item.key === key) ?? null
  const ganhou = grupo('Ganhou')
  const perdeu = grupo('Perdeu')
  /*
   * O saldo só existe quando os quatro movimentos têm valor. Sem carga anterior,
   * Entrou e Saiu são desconhecidos: somar Ganhou e Perdeu sozinhos e chamar de
   * "saldo do mês" esconderia metade do movimento.
   */
  const saldo = forecast
    && resultado?.entered !== null
    && resultado?.exited !== null
    && !forecast.grupos.some(item => item.value === null)
    ? forecast.grupos.reduce((soma, item) => soma + (item.value ?? 0), 0)
    : null

  const faixa: Array<{ rotulo: string; valor: string; nota?: string; tom: Tom; href: string }> = [
    { rotulo: 'Previsto para o mês', valor: formatarRealCompacto(esperado), nota: 'Vendido + aberto na régua', tom: 'marca', href: '#forecast' },
    { rotulo: 'Ganhos no CRM', valor: formatarRealCompacto(realizado), nota: progresso === null ? 'Ganho no mês' : `${formatarPercentualInteiro(progresso / 100)} do previsto`, tom: 'positivo', href: '#forecast' },
    { rotulo: 'Em aberto', valor: formatarRealCompacto(emAberto), nota: 'Previsto menos ganhos no CRM', tom: 'info', href: '#forecast' },
    { rotulo: 'New Name', valor: newName ? `${newName.indicators.newAccounts} ${newName.indicators.newAccounts === 1 ? 'conta' : 'contas'}` : '—', nota: newName ? newNameDetalhe(newName.indicators.newAccounts, newName.indicators.orders, newName.unclassifiedOrders) : 'Sem carga de pedidos', tom: 'marca', href: '#new-name' },
    { rotulo: 'Pipeline aberto', valor: formatarRealCompacto(pipelineValor), nota: 'Mês atual + 3', tom: 'info', href: '#opportunities' },
  ]

  /*
   * Entrou e Saiu exigem uma carga anterior. Sem ela, a leitura correta é "sem
   * base de comparação" — não "R$ 0", que sugere movimento nulo e mente sobre
   * o motivo. Ganhou e Perdeu vêm de uma única carga e sempre têm valor.
   */
  const temAnterior = resultado?.entered !== null && resultado?.exited !== null
  const anelForecast: RingGroup[] = forecast ? [
    { rotulo: 'Entrou', movimento: 'Entrou', valor: temAnterior ? grupo('Entrou')?.value ?? null : null, peso: temAnterior ? grupo('Entrou')?.weight ?? 0 : 0 },
    { rotulo: 'Saiu e postergou', movimento: 'Saiu', valor: temAnterior ? grupo('Saiu')?.value ?? null : null, peso: temAnterior ? grupo('Saiu')?.weight ?? 0 : 0 },
    { rotulo: 'Ganhou', movimento: 'Ganhou', valor: grupo('Ganhou')?.value ?? null, peso: grupo('Ganhou')?.weight ?? 0 },
    { rotulo: 'Perdeu', movimento: 'Perdeu', valor: grupo('Perdeu')?.value ?? null, peso: grupo('Perdeu')?.weight ?? 0 },
  ] : []

  const nome = 'Giovanni'
  const participacaoNN = realizado !== null && realizado > 0 && newName?.indicators.realizedValue !== null && newName?.indicators.realizedValue !== undefined
    ? newName.indicators.realizedValue / realizado * 100
    : null

  return (
    <div className="grid min-w-0 gap-5">
      <section id="home" data-home-nav="home" aria-labelledby="executive-title" className="scroll-mt-6 grid min-w-0 gap-4">
        <FadeUp>
          <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1">
            <div>
              <h1 id="executive-title" className="text-[32px] font-bold leading-[1.08] tracking-[-0.04em] text-ink-strong">
                {temCarga ? `Bom dia, ${nome}` : 'Visão Executiva'}
              </h1>
              {/*
                O design system não tem texto em `azul-escuro` a 80%: a cor de
                apoio é `text-muted` (cinza-600, 4,6:1). A opacidade sobre o
                azul-escuro reduzia o contraste justamente na linha que explica
                o mês, e sobre o fundo aurora ela ficava no limite.
              */}
              <p className="mt-1.5 text-[15px] leading-6 text-ink-muted">
                {temCarga
                  ? `Aqui está o panorama da sua receita em ${mesCurto} de ${referenceDate.slice(0, 4)}.`
                  : 'Importe as planilhas de Forecast e New Name para ver os números do mês.'}
              </p>
              {referenceMismatch && <p className="mt-1 text-[12px] text-dado-atencao">Pedidos de {formatarDataCurta(ordersReferenceDate)} · data diferente do forecast.</p>}
            </div>
            {temCarga && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-dado-positivo-suave px-3 py-1.5 text-[12px] font-semibold text-brand-escuro">
                <CheckCircle2 aria-hidden className="h-4 w-4" />
                Carga de {formatarDataCurta(referenceDate)}
              </span>
            )}
          </header>
        </FadeUp>

        {temCarga ? (
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_345px]">
            <div className="grid min-w-0 content-start gap-4">
              {/* Três por linha no desktop: cinco colunas deixavam cada número
                  com menos de 200px e truncavam "R$ 29,3 mi" em "R$ 2…". */}
              <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {faixa.map(item => (
                  <StaggerItem key={item.rotulo} className="h-full">
                    <MetricCard rotulo={item.rotulo} valor={item.valor} nota={item.nota} tom={item.tom} href={item.href} />
                  </StaggerItem>
                ))}
              </Stagger>

              <Panel titulo="Movimento do forecast" subtitulo="Entradas, saídas, ganhos e perdas do mês contra a carga anterior.">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {forecast && CARTOES_FORECAST.map(({ key }) => {
                    const item = grupo(key)
                    const disponivel = key === 'Entrou' ? resultado!.entered !== null : key === 'Saiu' ? resultado!.exited !== null : true
                    return (
                      <MovementCard
                        key={key}
                        movimento={key as MovementLabel}
                        valor={item?.value ?? null}
                        contagem={formatarOportunidades(item?.count ?? 0)}
                        nota={NOTAS_FORECAST[key]}
                        disponivel={disponivel}
                        href="#forecast"
                      />
                    )
                  })}
                </div>
              </Panel>

              <div className="grid gap-4 md:grid-cols-3">
                <Panel className="grid content-center gap-3">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="revenue-brief-icon grid place-items-center tone-marca"><Target className="h-[17px] w-[17px]" strokeWidth={2} /></span>
                    <span className="text-[13px] font-semibold text-ink-strong">Atingimento do previsto</span>
                  </div>
                  <BarraProgressoAnimada valor={progresso ?? 0} rotulo="Ganhos no CRM sobre previsto" />
                  <p className="text-[12px] text-ink-muted">
                    {progresso === null
                      ? 'Sem previsto na carga para calcular o atingimento.'
                      : `${formatarPercentualInteiro(progresso / 100)} do previsto já ganho no CRM.`}
                  </p>
                </Panel>

                <Panel className="grid content-center gap-3">
                  <span className="text-[13px] font-semibold text-ink-strong">Saldo do mês</span>
                  <strong className={`num text-[26px] font-bold leading-none tracking-[-0.035em] ${saldo === null ? 'text-ink-strong' : saldo > 0 ? 'text-dado-positivo' : saldo < 0 ? 'text-dado-negativo' : 'text-ink-strong'}`}>
                    {saldo === null ? '—' : `${saldo > 0 ? '+' : saldo < 0 ? '−' : ''}${formatarRealCompacto(Math.abs(saldo))}`}
                  </strong>
                  <p className="text-[12px] text-ink-muted">
                    {saldo === null
                      ? 'Entrou e Saiu só aparecem a partir da segunda carga.'
                      : `${formatarRealCompacto(ganhou?.value ?? null)} ganhos · ${formatarRealCompacto(perdeu?.value ?? null)} perdidos.`}
                  </p>
                </Panel>

                <Panel className="grid content-center gap-3">
                  <span className="text-[13px] font-semibold text-ink-strong">New Name nos ganhos no CRM</span>
                  <div className="flex items-center gap-3">
                    <Donut valor={participacaoNN ?? 0} rotulo="dos ganhos no CRM" tom="marca" />
                    <div className="min-w-0">
                      <strong className="num block text-[20px] font-bold leading-none tracking-[-0.03em] text-ink-strong">
                        {newName ? formatarRealCompacto(newName.indicators.realizedValue) : '—'}
                      </strong>
                      <small className="mt-1 block text-[12px] text-ink-muted">
                        {newName ? `${newName.indicators.newAccounts} ${newName.indicators.newAccounts === 1 ? 'conta nova' : 'contas novas'} no período` : 'Sem carga de pedidos'}
                      </small>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>

            <aside className="grid content-start gap-4">
              <Panel titulo="Briefing de hoje" subtitulo="Principais sinais do período.">
                <div className="grid gap-2.5">
                  <Sinal
                    icone={TrendingUp}
                    tom={saldo !== null && saldo < 0 ? 'negativo' : 'positivo'}
                    titulo={saldo === null ? 'Movimento indisponível' : saldo < 0 ? `${formatarRealCompacto(Math.abs(saldo))} saíram do mês` : `${formatarRealCompacto(saldo)} entraram no mês`}
                    detalhe={saldo === null ? 'A comparação começa na próxima importação' : `Entrou ${formatarRealCompacto(grupo('Entrou')?.value ?? null)} · Saiu ${formatarRealCompacto(grupo('Saiu')?.value ?? null)}`}
                    href="#forecast"
                  />
                  <Sinal
                    icone={Target}
                    tom="marca"
                    titulo={newName ? `${newName.indicators.newAccounts} ${newName.indicators.newAccounts === 1 ? 'conta nova' : 'contas novas'}` : 'New Name sem carga'}
                    detalhe={newName ? newNameDetalhe(newName.indicators.newAccounts, newName.indicators.orders, newName.unclassifiedOrders) : 'Importe a planilha de pedidos'}
                    href="#new-name"
                  />
                  <Sinal
                    icone={Users}
                    tom="info"
                    titulo={pipeline ? `${formatarOportunidades(pipeline.open.length)} na carteira` : 'Carteira sem carga'}
                    detalhe={pipeline ? `${formatarRealCompacto(pipelineValor)} previstos até ${pipeline.horizon[3] ? pipeline.horizon[3].month.split('-').reverse().join('/') : '—'}` : 'Importe a planilha de oportunidades'}
                    href="#opportunities"
                  />
                  {pipeline && pipeline.overdue.length > 0 && (
                    <Sinal
                      icone={TriangleAlert}
                      tom="atencao"
                      titulo={`${formatarOportunidades(pipeline.overdue.length)} com previsão vencida`}
                      detalhe={`Antes de ${formatarDataCurta(referenceDate)}`}
                      href="#opportunities"
                    />
                  )}
                </div>
              </Panel>

              {forecast && saldo !== null && (
                <ImpactRing titulo="Impacto no mês" legenda="Peso de cada movimento; o centro traz o saldo líquido." grupos={anelForecast} saldo={saldo} />
              )}
            </aside>
          </div>
        ) : (
          <section aria-label="Sem carga importada" className={`${PAINEL} grid gap-3`}>
            <p className="text-[15px] font-bold text-ink-strong">{carregando ? 'Carregando a última carga…' : 'Nenhuma carga importada.'}</p>
            <p className="text-[13px] text-ink-muted">Importe as planilhas de Forecast e New Name em Configurações para ver os números deste mês.</p>
            <div>
              <Link href={nav.href('config')} className="inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-brand-escuro px-4 text-[13px] font-semibold text-white transition-premium hover:bg-verde-escuro">
                Abrir Configurações
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}
      </section>

      {/* Sempre visível, inclusive sem carga: o diretor precisa saber que a seção existe. */}
      <PanelSection
        id="trajectory"
        titulo="Trajetória da Receita"
        contexto={cabecalho.contexto}
        acao={cabecalho.selo ? <span className={`revenue-pill tone-${cabecalho.selo.tom}`}>{cabecalho.selo.texto}</span> : undefined}
      >
        <section className="revenue-panel vidro min-w-0">
          {trajectory.regime !== 'vazio' && (
            <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] text-ink-muted">Valores em reais, acumulados até cada data da carga.</p>
              <TrajectoryLegend model={trajectory} />
            </header>
          )}
          <TrajectoryChart model={trajectory} />
        </section>
      </PanelSection>

      {opportunities
        ? <ImportedForecastScreen batch={opportunities} previousBatch={previous?.opportunities ?? null} referenceDate={referenceDate} />
        : <EmptySection id="forecast" titulo="Forecast" contexto="Previsto, ganhos no CRM e o que mudou desde a carga anterior." nav={nav} carregando={carregando} />}

      {orders
        ? <NewNameSection orders={orders.records} opportunities={opportunities?.records ?? null} previousOrders={previousOrders} previousOpportunities={previousOpportunities} referenceDate={ordersReferenceDate} />
        : <EmptySection id="new-name" titulo="New Name" contexto="Contas novas, pedidos conferidos e o que saiu do período." nav={nav} carregando={carregando} />}

      {opportunities
        ? <PipelineSection records={opportunities.records} previousRecords={previousOpportunities} referenceDate={referenceDate} />
        : <EmptySection id="opportunities" titulo="Oportunidades" contexto="Entradas, saídas e mudanças na carteira aberta." nav={nav} carregando={carregando} />}
    </div>
  )
}

export type { RingGroup }
