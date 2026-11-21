'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Lightbulb, Target, TrendingUp, TriangleAlert, Users } from 'lucide-react'
import { calculateNewNameModel } from '../new-name-model'
import { buildPipelineOverview } from '../pipeline-model'
import { formatarOportunidades, formatarPercentualInteiro, formatarRealCompacto, formatarSaldo, formatarValorExato } from '../format'
import { TrajectoryChart, TrajectoryLegend } from '../components/trajectory-chart'
import { FadeUp, Stagger, StaggerItem } from '../components/motion-primitives'
import { DiretoriasSection } from '../components/diretorias-section'
import { BarraProgressoAnimada, ImpactRing, MetricCard, MovementCard, PAINEL, Panel, PanelSection, Selo, formatarDataCurta, type RingGroup, type Tom } from '../components/executive-ui'
import { DonutChart } from '../components/charts'
import { NewNameSection } from '../components/new-name-section'
import { PipelineSection } from '../components/pipeline-section'
import type { CommercialNav } from '../nav'
import type { ImportDraft, ImportHistoryEntry } from '../manual-import-client'
import type { MovementLabel } from '../movement-rows'
import { buildTrajectory, cabecalhoTrajetoria, ponteReconcilia } from '../trajectory-model'
import { resumoViraPonto } from '../trajectory-snapshot'
import { HASH_FORECAST, HASH_FORECAST_GANHOU } from '../forecast-focus'
import { CARTOES_FORECAST, ImportedForecastScreen, selectForecastMovements } from './import-forecast-screen'

/**
 * Visão Executiva: painel de leitura do mês de referência (docs/PLANO-VISAO-EXECUTIVA.md).
 *
 * Ordem: saudação com o retrato do mês, indicadores, a Trajetória da Receita
 * (sempre visível), movimento do forecast e o briefing à direita; e abaixo, as
 * seções Forecast, New Name e Oportunidades.
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

/**
 * Estado da seção sem conteúdo.
 *
 * Eram três: carregando, falha e vazio. O "carregando" saiu do vocabulário da
 * tela — ele era a causa do deslocamento de layout que media 0,13 de CLS: o
 * aviso ocupava uma linha e era substituído por um painel inteiro, empurrando
 * tudo para baixo. Enquanto a carga é consultada a seção agora reserva a
 * altura do conteúdo real (`EsqueletoCarga`), então a troca não mexe em nada.
 *
 * Restam dois estados, e eles continuam distintos: falha de consulta não é
 * ausência de carga. Trocar um pelo outro faria a tela afirmar que não existe
 * dado quando o que existe é um erro.
 */
function textoVazio(falha: string | null) {
  return falha ? 'Falha na consulta — veja o aviso no topo da página.' : 'Sem carga importada para esta seção.'
}

function EmptySection({ id, titulo, contexto, nav, falha }: { id: string; titulo: string; contexto: string; nav: CommercialNav; falha: string | null }) {
  return (
    <PanelSection id={id} titulo={titulo} contexto={contexto}>
      <div className={`${PAINEL} flex flex-wrap items-center justify-between gap-3`}>
        <p className={falha ? 'text-[13px] text-dado-atencao' : 'text-[13px] text-ink-muted'}>{textoVazio(falha)}</p>
        <Link href={nav.href('config')} className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-brand px-3 text-[13px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
          Abrir Configurações
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </PanelSection>
  )
}

/**
 * Esqueleto da primeira carga.
 *
 * A altura não é chutada: ela reserva o espaço do painel de trajetória, da
 * faixa de indicadores e das duas colunas laterais — que é exatamente o que
 * chega quando a leitura termina. Reservar o espaço certo é o que zera o
 * deslocamento; um placeholder de uma linha, que era o que existia antes,
 * empurrava tudo na troca.
 *
 * Sem animação de pulso: ela chamaria atenção para uma tela que dura poucos
 * milissegundos no caminho normal e some no modo visual, onde a carga é
 * síncrona.
 */
function EsqueletoCarga() {
  return (
    <div aria-hidden className="grid min-w-0 gap-4">
      <section className={`${PAINEL} grid gap-4`}>
        <div className="h-[13px] w-56 rounded-full bg-[#e6eef3]" />
        <div className="h-[250px] w-full rounded-[12px] bg-[#eef4f8]" />
      </section>
      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, indice) => (
          <div key={indice} className={`${PAINEL} grid content-start gap-2`}>
            <div className="h-[11px] w-24 rounded-full bg-[#e6eef3]" />
            <div className="h-[22px] w-20 rounded-full bg-[#eef4f8]" />
            <div className="h-[10px] w-28 rounded-full bg-[#eef4f8]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExecutivePage({ opportunities, orders, previous, history, nav, carregando = false, falha = null }: {
  opportunities: ImportDraft['opportunities']
  orders: ImportDraft['orders']
  previous: ImportDraft | null
  /** Histórico de cargas já confirmadas, com o snapshot numérico quando existir. */
  history: ImportHistoryEntry[]
  nav: CommercialNav
  carregando?: boolean
  /** Mensagem quando a consulta da carga falhou — não confundir com ausência de carga. */
  falha?: string | null
}) {
  const referenceDate = opportunities?.referenceDate ?? orders?.referenceDate ?? ''
  const ordersReferenceDate = orders?.referenceDate ?? referenceDate
  const temCarga = Boolean(opportunities || orders)
  const referenceMismatch = Boolean(opportunities?.referenceDate && orders?.referenceDate && opportunities.referenceDate !== orders.referenceDate)
  const previousOpportunities = previous?.opportunities?.records ?? null
  const previousOrders = previous?.orders?.records ?? null

  // Competência da carga anterior: cargas de meses diferentes não se comparam.
  const competenciaAnterior = previous?.opportunities?.referenceDate ?? null
  const forecast = useMemo(
    () => opportunities && referenceDate ? selectForecastMovements(opportunities.records, previousOpportunities, referenceDate, 'mês', competenciaAnterior) : null,
    [opportunities, previousOpportunities, referenceDate, competenciaAnterior],
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
      // A ponte compara cargas do mesmo mês; a referência da anterior vem da carga.
      previousReferenceDate: previous?.opportunities?.referenceDate,
      // O histórico guarda `number | null`; o gate é o mesmo do módulo de
      // snapshot. Só previsto e realizado conhecidos bastam para o ponto.
      history: history.flatMap(entry => resumoViraPonto(entry.snapshot)
        ? [{ at: entry.at, referenceDate: entry.referenceDate, snapshot: entry.snapshot }]
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
  const [pedidoFoco, setPedidoFoco] = useState<{ movement: 'Ganhou' | null; key: number } | null>(null)
  const abrirForecast = (movement: 'Ganhou' | null) => {
    setPedidoFoco(atual => ({ movement, key: (atual?.key ?? 0) + 1 }))
    // Clique repetido no mesmo cartão não muda o hash: rola mesmo assim.
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => document.getElementById('forecast')?.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' }))
  }

  const mesExtenso = referenceDate ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${referenceDate.slice(0, 7)}-01T12:00:00Z`)) : ''
  const mesCapitalizado = mesExtenso ? mesExtenso.charAt(0).toUpperCase() + mesExtenso.slice(1) : 'Mês da referência'
  const mesCurto = mesExtenso.split(' de ')[0]

  const grupo = (key: string) => forecast?.grupos.find(item => item.key === key) ?? null
  /*
   * O saldo é a variação do previsto entre as duas cargas, pela mesma ponte da
   * Trajetória. Somar os quatro cartões contaria duas vezes quem fechou — está
   * em Saiu e em Ganhou/Perdeu — e a Home mostrava um número que não fechava
   * com a curva logo acima. Sem carga anterior não há saldo: "—", não zero.
   */
  const ponte = resultado?.bridge ?? null
  const saldo = ponte?.comparavel
    && ponteReconcilia({ totalAnterior: ponte.totalAnterior, totalAtual: ponte.totalAtual, entrou: ponte.entrou, saiu: ponte.saiu, alterou: ponte.alterou })
    ? (ponte.entrou ?? 0) + (ponte.saiu ?? 0) + (ponte.alterou ?? 0)
    : null

  const faixa: Array<{ rotulo: string; valor: string; nota?: string; info?: string; tom: Tom; href: string; onActivate?: () => void }> = [
    { rotulo: 'Previsto para o mês', valor: formatarRealCompacto(esperado), nota: `Meta de ${mesCurto}`, info: 'Ganhos no CRM somados às oportunidades abertas com previsão para o mês.', tom: 'marca', href: HASH_FORECAST, onActivate: () => abrirForecast(null) },
    { rotulo: 'Ganhos no CRM', valor: formatarRealCompacto(realizado), nota: progresso === null ? 'Ganho no mês' : `${formatarPercentualInteiro(progresso / 100)} do previsto`, tom: 'positivo', href: HASH_FORECAST_GANHOU, onActivate: () => abrirForecast('Ganhou') },
    { rotulo: 'Em aberto', valor: formatarRealCompacto(emAberto), nota: 'Falta ganhar no mês', info: 'Previsto do mês menos o que já foi ganho no CRM.', tom: 'info', href: '#forecast' },
    { rotulo: 'Contas novas', valor: newName ? `${newName.indicators.newAccounts} ${newName.indicators.newAccounts === 1 ? 'conta' : 'contas'}` : '—', nota: newName ? newNameDetalhe(newName.indicators.newAccounts, newName.indicators.orders, newName.unclassifiedOrders) : 'Sem carga de pedidos', tom: 'marca', href: '#new-name' },
    // Pipeline fica no briefing e na seção Oportunidades; a faixa fecha em 4 (grade 2×2 / 4).
    { rotulo: 'Pipeline aberto', valor: formatarRealCompacto(pipelineValor), nota: 'Próximos 3 meses', info: 'Oportunidades abertas com previsão entre este mês e os três seguintes.', tom: 'info', href: '#opportunities' },
  ]

  /*
   * Entrou e Saiu exigem uma carga anterior. Sem ela, a leitura correta é "sem
   * base de comparação" — não "R$ 0", que sugere movimento nulo e mente sobre
   * o motivo. Ganhou e Perdeu vêm de uma única carga e sempre têm valor.
   */
  const temAnterior = resultado?.entered !== null && resultado?.exited !== null && (resultado?.bridge?.comparavel ?? true)
  /* Mesma decomposição da ponte: Ganhou/Perdeu já estão dentro de Saiu. */
  const anelForecast: RingGroup[] = forecast && temAnterior ? [
    { rotulo: 'Entrou', movimento: 'Entrou', valor: ponte?.entrou ?? null, peso: Math.abs(ponte?.entrou ?? 0) },
    { rotulo: 'Saiu e postergou', movimento: 'Saiu', valor: ponte?.saiu ?? null, peso: Math.abs(ponte?.saiu ?? 0) },
    { rotulo: 'Alterou valor', movimento: 'Alterou valor', valor: ponte?.alterou ?? null, peso: Math.abs(ponte?.alterou ?? 0) },
  ] : []

  const nome = process.env.NEXT_PUBLIC_VISUAL_PREVIEW === '1' ? 'Visitante' : 'Giovanni'

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
              {ponte && !ponte.comparavel && (
                <p className="mt-1 text-[12px] text-dado-atencao">
                  A carga anterior é de {formatarDataCurta(previous?.opportunities?.referenceDate ?? null)}. Entradas, saídas e saldo comparam cargas do mesmo mês, então ficam ocultos aqui.
                </p>
              )}
            </div>
            {temCarga && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-dado-positivo-suave px-3 py-1.5 text-[12px] font-semibold text-brand-escuro">
                <CheckCircle2 aria-hidden className="h-4 w-4" />
                Carga de {formatarDataCurta(referenceDate)}
              </span>
            )}
          </header>
        </FadeUp>

        <div className={`grid min-w-0 gap-4 ${temCarga ? 'xl:grid-cols-[minmax(0,1fr)_345px]' : ''}`}>
          {!temCarga && carregando && <EsqueletoCarga />}

          {!temCarga && !carregando && (
            <section aria-label={falha ? 'Falha ao consultar a carga' : 'Sem carga importada'} aria-live="polite" className={`${PAINEL} grid gap-3 xl:col-span-2`}>
              <p className={`text-[15px] font-bold ${falha ? 'text-dado-atencao' : 'text-ink-strong'}`}>
                {falha ? 'Não foi possível consultar a carga.' : 'Nenhuma carga importada.'}
              </p>
              <p className="text-[13px] text-ink-muted">
                {falha
                  ? falha
                  : 'Importe as planilhas de Forecast e New Name em Configurações para ver os números deste mês.'}
              </p>
              <div className="flex flex-wrap gap-3">
                {falha && (
                  <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-brand px-4 text-[13px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
                    Tentar novamente
                  </button>
                )}
                <Link href={nav.href('config')} className="inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-brand-escuro px-4 text-[13px] font-semibold text-white transition-premium hover:bg-verde-escuro">
                  Abrir Configurações
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}

          <div className="grid min-w-0 content-start gap-4">
            <section
              id="trajectory"
              data-home-nav="trajectory"
              aria-labelledby="trajectory-titulo"
              className="revenue-panel vidro scroll-mt-6 min-w-0"
            >
              <h2 id="trajectory-titulo" className="sr-only">Trajetória da Receita</h2>
              {trajectory.regime !== 'vazio' && (
                <header className="mb-1 flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="text-[12px] text-ink-muted">
                    {trajectory.historicoDescartado ? cabecalho.contexto : 'Receita acumulada no mês'}
                    {cabecalho.selo && <span className={`revenue-pill ml-2 tone-${cabecalho.selo.tom}`}>{cabecalho.selo.texto}</span>}
                  </p>
                  <TrajectoryLegend model={trajectory} />
                </header>
              )}
              <TrajectoryChart model={trajectory} altura={250} />
            </section>
            {/* Três por linha no desktop: cinco colunas deixavam cada número
                com menos de 200px e truncavam "R$ 29,3 mi" em "R$ 2…". */}
            {temCarga && (
              <Stagger className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
                {faixa.filter(item => item.rotulo !== 'Pipeline aberto').map(item => (
                  <StaggerItem key={item.rotulo} className="h-full">
                    <MetricCard rotulo={item.rotulo} valor={item.valor} nota={item.nota} info={item.info} tom={item.tom} href={item.href} onActivate={item.onActivate} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {temCarga && (
              <>
                  {/* Pedidos e saldo no mesmo formato dos cartões acima: uma grade, sem faixa solta. */}
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      rotulo="Pedidos conferidos"
                      valor={newName ? formatarRealCompacto(newName.indicators.realizedValue) : '—'}
                      nota={newName
                        ? newName.indicators.realizedValue === null
                          ? 'Há pedido conferido sem valor de manutenção'
                          : `${umOuVarios(newName.indicators.realizedCount, 'pedido conferido', 'pedidos conferidos')} · ${umOuVarios(newName.indicators.realizedAccounts, 'conta', 'contas')}`
                        : 'Sem carga de pedidos'}
                      info="Base de pedidos: valor absoluto de manutenção dos pedidos conferidos, não uma fatia dos ganhos no CRM."
                      tom="info"
                    />
                    <MetricCard
                      rotulo="Saldo do mês"
                      valor={formatarSaldo(saldo)}
                      nota={saldo === null
                        ? 'Aparece a partir da segunda carga'
                        : `Entrou ${formatarRealCompacto(ponte?.entrou ?? null)} · Saiu ${formatarRealCompacto(ponte?.saiu ?? null)} · Alterou ${formatarRealCompacto(ponte?.alterou ?? null)}`}
                      tom={saldo === null ? 'marca' : saldo < 0 ? 'negativo' : 'positivo'}
                    />
                  </div>

              </>
            )}
          </div>

          {temCarga && (
            <aside className="grid content-start gap-4">
              <Panel titulo="Resumo de hoje">
                <div className="grid gap-2.5">
                  {(saldo !== null || (ponte && !ponte.comparavel)) && <Sinal
                    icone={TrendingUp}
                    tom={saldo !== null && saldo < 0 ? 'negativo' : 'positivo'}
                    titulo={saldo === null
                      ? (ponte && !ponte.comparavel ? 'Carga anterior de outro mês' : 'Movimento indisponível')
                      : saldo === 0
                        ? 'Previsto sem alteração'
                        : saldo < 0
                          ? `Previsto caiu ${formatarValorExato(Math.abs(saldo)).replace(/^[+−]/, '')}`
                          : `Previsto subiu ${formatarValorExato(saldo).replace(/^\+/, '')}`}
                    detalhe={saldo !== null
                      ? `Entrou ${formatarRealCompacto(ponte?.entrou ?? null)} · Saiu ${formatarRealCompacto(ponte?.saiu ?? null)}`
                      : ponte && !ponte.comparavel
                        ? `A carga anterior é de ${formatarDataCurta(previous?.opportunities?.referenceDate ?? null)}; meses diferentes não se comparam`
                        : 'A comparação começa na próxima importação'}
                    href="#forecast"
                  />}
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

                  <Panel titulo="Composição do previsto">
                    <DonutChart
                      centro={progresso === null ? '—' : formatarPercentualInteiro(progresso / 100)}
                      legendaCentro="já ganho"
                      fatias={[
                        { rotulo: 'Ganhos no CRM', valor: realizado, cor: 'var(--verde-institucional)' },
                        { rotulo: 'Em aberto', valor: emAberto, cor: 'var(--verde-claro)' },
                        { rotulo: 'Perdido no mês', valor: Math.abs(grupo('Perdeu')?.value ?? 0), cor: 'var(--dado-negativo)' },
                      ]}
                    />
                  </Panel>

              {forecast && saldo !== null && (
                <ImpactRing titulo="Impacto no mês" legenda="Peso de cada movimento no saldo." grupos={anelForecast} saldo={saldo} />
              )}
            </aside>
          )}
        </div>
      </section>

      <DiretoriasSection />

      {opportunities
        ? <ImportedForecastScreen batch={opportunities} previousBatch={previous?.opportunities ?? null} referenceDate={referenceDate} focus={pedidoFoco} />
        : <EmptySection id="forecast" titulo="Forecast" contexto="Previsto, ganhos no CRM e o que mudou desde a carga anterior." nav={nav} falha={falha} />}

      {orders
        ? <NewNameSection orders={orders.records} opportunities={opportunities?.records ?? null} previousOrders={previousOrders} previousOpportunities={previousOpportunities} referenceDate={ordersReferenceDate} />
        : <EmptySection id="new-name" titulo="New Name" contexto="Contas novas, pedidos conferidos e o que saiu do período." nav={nav} falha={falha} />}

      {opportunities
        ? <PipelineSection records={opportunities.records} previousRecords={previousOpportunities} referenceDate={referenceDate} />
        : <EmptySection id="opportunities" titulo="Oportunidades" contexto="Entradas, saídas e mudanças na carteira aberta." nav={nav} falha={falha} />}
    </div>
  )
}

export type { RingGroup }
