'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CommercialShell } from './components/commercial-shell'
import { buildCommercialHref, commercialReturnHref, parseCommercialContext } from './context'
import { selectOpportunityLife } from './opportunity-life'
import { mesCurto } from './mock-data'
import { TEST_SNAPSHOT as COMMERCIAL_SNAPSHOT, REAL_BRANCH_NAMES, realBranches } from './test-data'
import {
  selectAgentBriefing,
  selectBranchModel,
  selectForecastModel,
  selectHomeModel,
  selectOpportunityModel,
  selectSolutionOptions,
} from './model'
import { globalSearchDestination, type CommercialHrefExtra, type CommercialNav } from './nav'
import { selectOpportunityDetails } from './opportunity-details'
import { AgentScreen } from './screens/agent-screen'
import { AccountsScreen } from './screens/accounts-screen'
import { BranchScreen } from './screens/branch-screen'
import { CrossScreen } from './screens/cross-screen'
import { ForecastScreen } from './screens/forecast-screen'
import { HomeScreen } from './screens/home-screen'
import { JourneyScreen } from './screens/journey-screen'
import { NewNameScreen } from './screens/new-name-screen'
import { SystemScreen } from './screens/system-screen'
import { OpportunitiesScreen } from './screens/opportunities-screen'
import { OpportunityScreen } from './screens/opportunity-screen'
import {
  type CommercialFilters,
  type CommercialPeriod,
  type CommercialView,
  type ForecastMovement,
} from './types'

/**
 * Raiz da Visão Comercial V3 (plano Task 3 Step 2, l.299-313).
 *
 * Estado de navegação e filtro vive na URL (`/?view=...&period=...&solution=...&branch=...`),
 * nunca em store local: assim Home, Agente, Forecast, Oportunidades, Filial e Oportunidade
 * compartilham o mesmo snapshot e o mesmo contexto, e voltar não reseta nada.
 * Toda métrica sai de `COMMERCIAL_SNAPSHOT` por seletores puros — a raiz só roteia.
 */
export function CommercialV3App() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const consulta = searchParams.toString()
  const contexto = useMemo(() => parseCommercialContext(new URLSearchParams(consulta)), [consulta])
  const { view, period, solution, branch, from, opportunityId } = contexto

  // Estado transitório do recorte: nenhum salvamento ou dado externo.
  const posicoes = useRef(new Map<string, {
    top: number; abertos: boolean[]; rolagens: Array<[number, number]>; foco: string
  }>())
  useEffect(() => {
    const lembrar = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      const href = link?.getAttribute('href')
      if (!href?.startsWith('/?view=opportunity')) return
      posicoes.current.set(consulta, {
        top: window.scrollY,
        abertos: Array.from(document.querySelectorAll<HTMLDetailsElement>('main details'), (el) => el.open),
        rolagens: Array.from(document.querySelectorAll<HTMLElement>('main .scroll-discreta'), (el) => [el.scrollLeft, el.scrollTop]),
        foco: href,
      })
    }
    document.addEventListener('click', lembrar, true)
    return () => document.removeEventListener('click', lembrar, true)
  }, [consulta])
  useLayoutEffect(() => {
    const posicao = posicoes.current.get(consulta)
    if (!posicao) return
    const frame = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLDetailsElement>('main details').forEach((el, i) => { el.open = posicao.abertos[i] ?? false })
      document.querySelectorAll<HTMLElement>('main .scroll-discreta').forEach((el, i) => {
        const saved = posicao.rolagens[i]
        if (saved) { el.scrollLeft = saved[0]; el.scrollTop = saved[1] }
      })
      Array.from(document.querySelectorAll<HTMLAnchorElement>('main a[href]'))
        .find((el) => el.getAttribute('href') === posicao.foco)?.focus({ preventScroll: true })
      window.scrollTo({ top: posicao.top, behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [consulta])

  const filtros = useMemo<CommercialFilters>(
    () => ({ period, solution, branch }),
    [period, solution, branch],
  )

  const home = useMemo(() => {
    const model = selectHomeModel(COMMERCIAL_SNAPSHOT, filtros)
    return period === 'month' ? { ...model, filiais: realBranches(branch) } : model
  }, [filtros, period, branch])
  const briefing = useMemo(() => selectAgentBriefing(COMMERCIAL_SNAPSHOT, filtros), [filtros])
  const forecast = useMemo(() => selectForecastModel(COMMERCIAL_SNAPSHOT, filtros), [filtros])
  const detalhes = useMemo(() => selectOpportunityDetails(COMMERCIAL_SNAPSHOT, filtros), [filtros])
  const solucoes = useMemo(() => selectSolutionOptions(COMMERCIAL_SNAPSHOT), [])
  const filiais = REAL_BRANCH_NAMES
  const mes = mesCurto(COMMERCIAL_SNAPSHOT.competence.month)
  const mesCompleto = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(COMMERCIAL_SNAPSHOT.competence.year, COMMERCIAL_SNAPSHOT.competence.month - 1, 1)))
  const competencia = mesCompleto + ' de ' + COMMERCIAL_SNAPSHOT.competence.year
  const query = (searchParams.get('q') ?? '').trim()
  const busca = (searchParams.get('busca') ?? '').trim()

  // Movimento selecionado no Forecast: a URL é a dona do estado (plano Task 7, l.635).
  const movement = contexto.movement ?? null

  const filial = useMemo(
    () => selectBranchModel(COMMERCIAL_SNAPSHOT, branch, { period, solution }),
    [branch, period, solution],
  )

  const oportunidade = useMemo(
    () => (opportunityId ? selectOpportunityModel(COMMERCIAL_SNAPSHOT, opportunityId, period) : null),
    [opportunityId, period],
  )

  const vida = useMemo(
    () => opportunityId ? selectOpportunityLife(COMMERCIAL_SNAPSHOT, opportunityId, period, { branch, solution }) : null,
    [opportunityId, period, branch, solution],
  )

  /** Filtros e buscas seguem a navegação; o detalhe também retorna à view de origem. */
  const href = useCallback(
    (destino: CommercialView, extra?: CommercialHrefExtra) => {
      if (view === 'opportunity' && destino === (from ?? 'home') && !extra) return commercialReturnHref(contexto)
      return buildCommercialHref(
        destino,
        { period, solution, branch, query, busca, movement },
        {
          ...(destino === view && from ? { from } : {}),
          ...(destino === 'opportunity' && view !== 'opportunity' ? { returnTo: `/?${consulta}` } : {}),
          ...extra,
        },
      )
    },
    [period, solution, branch, query, busca, movement, view, from, contexto, consulta],
  )

  const movementHref = useCallback(
    (movimento: ForecastMovement) =>
      buildCommercialHref('forecast', { period, solution, branch, query, busca }, { from: 'home', movement: movimento }),
    [period, solution, branch, query, busca],
  )

  const branchHref = useCallback(
    (filialDestino: string, origem?: CommercialView) =>
      buildCommercialHref(
        'branch',
        { period, solution, branch: filialDestino, query, busca, movement },
        { from: origem ?? 'home' },
      ),
    [period, solution, branch, query, busca, movement],
  )

  const trocarFiltros = useCallback(
    (parcial: Partial<CommercialFilters>) => {
      const destino = buildCommercialHref(
        view,
        { period, solution, branch, ...parcial },
        {
          from,
          opportunityId,
          returnTo: contexto.returnTo,
          // O recorte de movimento pertence ao Forecast e sobrevive à troca de filtro.
          ...(movement ? { movement } : {}),
        },
      )
      const extras = new URLSearchParams()
      if (query !== '') extras.set('q', query)
      if (busca !== '') extras.set('busca', busca)
      const sufixo = extras.toString()
      router.replace(sufixo === '' ? destino : `${destino}&${sufixo}`, { scroll: false })
    },
    [router, view, period, solution, branch, from, opportunityId, movement, query, busca, contexto.returnTo],
  )

  const nav = useMemo<CommercialNav>(
    () => ({
      href,
      movementHref,
      branchHref,
      onPeriod: (novoPeriodo: CommercialPeriod) => trocarFiltros({ period: novoPeriodo }),
      onSolution: (novaSolucao: string) => trocarFiltros({ solution: novaSolucao }),
      onBranch: (novaFilial: string) => trocarFiltros({ branch: novaFilial }),
      onQuery: (texto: string) => {
        const base = buildCommercialHref(globalSearchDestination(view), { period, solution, branch })
        router.replace(texto === '' ? base : `${base}&q=${encodeURIComponent(texto)}`, { scroll: false })
      },
      onListQuery: (texto: string) => {
        const base = buildCommercialHref('opportunities', { period, solution, branch, movement }, { from })
        router.replace(texto === '' ? base : `${base}&busca=${encodeURIComponent(texto)}`, {
          scroll: false,
        })
      },
    }),
    [href, movementHref, branchHref, trocarFiltros, router, period, solution, branch, view, movement, from],
  )

  return (
    <CommercialShell
      view={view}
      period={period}
      solution={solution}
      branch={branch}
      query={query}
      monthLabel={competencia.replace(' de ', '/')}
      solutions={solucoes}
      branches={filiais}
      from={from}
      nav={nav}
    >
      {view === 'home' && (
        <HomeScreen
          model={home}
          briefing={briefing}
          asOf={COMMERCIAL_SNAPSHOT.asOf}
          mes={competencia}
          nav={nav}
          realBranchesEnabled={period === 'month'}
        />
      )}

      {view === 'agent' && <AgentScreen briefing={briefing} from={from} nav={nav} />}

      {view === 'journey' && (
        <JourneyScreen rows={forecast.oportunidades} detalhes={detalhes} query={query} nav={nav} />
      )}

      {view === 'system' && (
        <SystemScreen model={home} filiaisReais={period === 'month'} nav={nav} />
      )}

      {view === 'forecast' && (
        <ForecastScreen
          model={forecast}
          meta={home.kpis.find((kpi) => kpi.key === 'meta')?.value ?? 0}
          mes={mes}
          movement={movement}
          detalhes={detalhes}
          from={from}
          nav={nav}
        />
      )}

      {view === 'opportunities' && (
        <OpportunitiesScreen
          rows={forecast.oportunidades}
          detalhes={detalhes}
          busca={busca || query}
          semanas={home.semanas}
          from={from}
          nav={nav}
        />
      )}

      {view === 'accounts' && (
        <AccountsScreen rows={forecast.oportunidades} detalhes={detalhes} query={query} nav={nav} />
      )}

      {view === 'new-name' && (
        <NewNameScreen rows={forecast.oportunidades} detalhes={detalhes} query={query} nav={nav} />
      )}

      {view === 'cross' && (
        <CrossScreen rows={forecast.oportunidades} detalhes={detalhes} query={query} nav={nav} />
      )}

      {view === 'branch' && (
        <BranchScreen
          model={filial}
          branch={branch}
          filiais={home.filiais}
          detalhes={detalhes}
          from={from}
          nav={nav}
        />
      )}

      {view === 'opportunity' && (
        <OpportunityScreen oportunidade={vida ? oportunidade : null} life={vida} from={from} nav={nav} />
      )}
      <details className="mt-3 px-1 text-[11px] leading-4 text-[#62748b]">
        <summary className="w-fit cursor-pointer rounded-sm underline decoration-dotted underline-offset-2 focus-visible:outline-2 focus-visible:outline-[#086b6b]">
          Cenário demonstrativo · escopo e origem dos dados
        </summary>
        <p className="mt-1 max-w-[1000px]">
          {period === 'month'
            ? 'Agregados de 22 filiais reais de setembro/2026; realizado representa pedidos integrados. KPIs, oportunidades, gráficos e detalhes por filial usam o cenário demonstrativo local. A carteira mock não representa a distribuição real por filial.'
            : 'Este período usa dados demonstrativos. Os agregados reais de filial estão disponíveis apenas na Visão Comercial e no Sistema de Receita para setembro/2026.'}
          {' '}Contas e oportunidades usam exemplos demonstrativos; o recorte da carteira acompanha período, solução e filial.
        </p>
      </details>
    </CommercialShell>
  )
}
