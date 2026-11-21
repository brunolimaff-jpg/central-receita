'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CommercialShell } from './components/commercial-shell'
import { TelaBloqueio } from './components/tela-bloqueio'
import { CHAVE_BLOQUEIO, estaLiberado } from './tela-bloqueio'
import { buildCommercialHref, commercialReturnHref, destinoForecastLegado, parseCommercialContext } from './context'
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
import { ImportScreen } from './screens/import-screen'
import { CarteiraScreen } from './screens/carteira-screen'
import { TerritoriosScreen } from './screens/territorios-screen'
import { REGIONAL_SNAPSHOT } from './regional/regional-mock'
import { ARVORE } from './carteira-arvore'
import { coberturaDePara } from './carteira-de-para'
import { montarCarteira, recortarPorFilial, temProbabilidade } from './carteira-model'
import { loadImportDraft, loadPreviousDraft, sharedImportEnabled, visualPreviewEnabled, type ImportDraft } from './manual-import-client'
import { estadoDaHome } from './central-vendas-mrr'
import { filtrosMensaisDaHome } from './home-raio-x'
import { ExecutivePage } from './screens/executive-page'
import { ImportedForecastScreen } from './screens/import-forecast-screen'
import { ResumoForecast } from './components/resumo-forecast'
import { criarResumoForecast } from './forecast-screen-model'
import { PipelineSection } from './components/pipeline-section'
import { JourneyScreen } from './screens/journey-screen'
import { NewNameScreen } from './screens/new-name-screen'
import { SystemScreen } from './screens/system-screen'
import { OpportunitiesScreen } from './screens/opportunities-screen'
import { OpportunityScreen } from './screens/opportunity-screen'
import {
  ALL_FILTERS,
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
 * Métricas demonstrativas usam `COMMERCIAL_SNAPSHOT`. Configurações, Forecast e
 * New Name também permitem revisar a prévia local importada, explicitamente separada.
 */
/** Telas que compõem a página corrida com a carga real (sem demo=1). */
const PAGINA_CORRIDA: CommercialView[] = ['home', 'new-name']

export function CommercialV3App({ fixedView }: { fixedView?: CommercialView } = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [importDraft, setImportDraft] = useState<ImportDraft | null>(null)
  const [previousImportDraft, setPreviousImportDraft] = useState<ImportDraft | null>(null)
  const [canImport, setCanImport] = useState(!sharedImportEnabled && !visualPreviewEnabled)
  const [importLoading, setImportLoading] = useState(true)
  const [importError, setImportError] = useState('')
  const importEpoch = useRef(0)
  /*
   * Bloqueio da demonstração. Estado inicialmente nulo porque o servidor não
   * conhece o armazenamento: um valor fixo aqui faria a árvore do HTML sair
   * diferente da hidratada. Na reconciliação o valor real é lido antes da
   * pintura, então não há piscada de conteúdo liberado.
   *
   * Só a publicação visual é bloqueada. Em desenvolvimento a porta atrapalharia
   * o trabalho, e o `build:visual` é o único pacote público.
   */
  const [liberado, setLiberado] = useState<boolean | null>(visualPreviewEnabled ? false : true)
  useEffect(() => {
    if (!visualPreviewEnabled) return
    try {
      setLiberado(estaLiberado(window.localStorage.getItem(CHAVE_BLOQUEIO)))
    } catch {
      setLiberado(false)
    }
  }, [])
  useEffect(() => {
    let active = true
    let prazo: number | undefined
    /*
     * Prazo de segurança: se a leitura da carga não responder (IndexedDB
     * travado por outra aba, armazenamento bloqueado), a tela não pode ficar
     * em "Carregando a última carga…" para sempre.
     *
     * O prazo pertence à consulta vigente (identificada por epoch): uma
     * consulta nova cancela o prazo da anterior e arma o seu, senão o prazo
     * de uma consulta velha pode anunciar erro sobre dados que chegaram —
     * ou ser limpo por uma consulta que terminou, deixando a nova sem rede.
     *
     * O prazo NÃO vira estado vazio: "não consegui consultar" e "não há
     * carga" são fatos diferentes, e trocar um pelo outro esconde falha. O
     * vazio só aparece quando a consulta respondeu que não há nada.
     */
    const armarPrazo = (epoch: number) => {
      window.clearTimeout(prazo)
      prazo = window.setTimeout(() => {
        if (!active || epoch !== importEpoch.current) return
        setImportLoading(false)
        setImportError(atual => atual || (sharedImportEnabled
          ? 'A consulta da última carga não terminou. Verifique a conexão e tente novamente.'
          : 'A consulta da prévia local não terminou. Outra aba pode estar segurando o armazenamento; feche as outras abas da Central e tente novamente.'))
      }, 15000)
    }
    const refresh = () => {
      const epoch = ++importEpoch.current
      armarPrazo(epoch)
      return Promise.all([loadImportDraft(), loadPreviousDraft()]).then(([access, previous]) => { if (active && epoch === importEpoch.current) { setImportDraft(access.draft); setPreviousImportDraft(previous); setCanImport(access.canImport); setImportError('') } })
        .catch(error => { if (active && epoch === importEpoch.current) { setImportError(error instanceof Error ? error.message : 'Prévia local indisponível.'); if (sharedImportEnabled) { setCanImport(false); setImportDraft(null); setPreviousImportDraft(null) } } })
        .finally(() => { if (active && epoch === importEpoch.current) { window.clearTimeout(prazo); setImportLoading(false) } })
    }
    void refresh()
    // Do not replace the revision being reviewed while an import is being prepared.
    const canRefresh = () => sharedImportEnabled && new URLSearchParams(window.location.search).get('view') !== 'config'
    const onFocus = () => { if (canRefresh()) void refresh() }
    window.addEventListener('focus', onFocus)
    const timer = sharedImportEnabled ? window.setInterval(() => { if (canRefresh() && document.visibilityState === 'visible') void refresh() }, 60000) : undefined
    return () => { active = false; window.clearTimeout(prazo); window.removeEventListener('focus', onFocus); if (timer) window.clearInterval(timer) }
  }, [])

  const consulta = searchParams.toString()
  const contexto = useMemo(() => ({ ...parseCommercialContext(new URLSearchParams(consulta)), ...(fixedView ? { view: fixedView } : {}) }), [consulta, fixedView])
  useEffect(() => {
    const destino = destinoForecastLegado(new URLSearchParams(consulta))
    if (!fixedView && destino) router.replace(destino)
  }, [consulta, fixedView, router])
  const { view, period, solution, branch, from, opportunityId, no: idNo, territorio } = contexto
  /*
   * `?demo=1` existe para revisar o cenário fictício em desenvolvimento. Na
   * publicação, o painel mostra somente a carga confirmada: aceitar o parâmetro
   * ali expunha dados de demonstração no endereço do diretor.
   */
  const demoRequested = process.env.NODE_ENV === 'development' && !visualPreviewEnabled && !sharedImportEnabled && searchParams.get('demo') === '1'
  const sourceView = view === 'forecast' || view === 'new-name' || view === 'opportunities'
  const oportunidadesImportadas = !demoRequested ? importDraft?.opportunities : null
  const referenciaOportunidades = oportunidadesImportadas?.referenceDate ?? importDraft?.orders?.referenceDate ?? ''
  const resumoForecast = useMemo(() => criarResumoForecast({ batch: oportunidadesImportadas ?? null, referenceDate: referenciaOportunidades, carregando: importLoading, erro: importError }), [oportunidadesImportadas, referenciaOportunidades, importLoading, importError])
  // Página corrida: Visão Executiva e New Name numa rolagem só, com a carga real.
  // Com demo=1 cada tela volta ao cenário demonstrativo; a Visão Executiva (home) segue como antes.
  const executiveView = view === 'home' || (PAGINA_CORRIDA.includes(view) && !demoRequested)
  const cargaNaPagina = executiveView && !demoRequested
  const dataCarga = importDraft?.opportunities?.referenceDate ?? importDraft?.orders?.referenceDate ?? null
  /*
   * O rodapé da lateral fala do estado real da carga, não da aba aberta.
   * Fora das telas que leem a carga, mantém o rótulo de demonstração de antes.
   */
  const estadoLateral = view === 'config' || cargaNaPagina
    ? estadoDaHome({ temCarga: Boolean(importDraft), carregando: importLoading, falha: importError || null })
    : 'sem-carga'

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
  const homeMensal = useMemo(() => selectHomeModel(COMMERCIAL_SNAPSHOT, filtrosMensaisDaHome(filtros)), [filtros])
  const briefing = useMemo(() => selectAgentBriefing(COMMERCIAL_SNAPSHOT, filtros), [filtros])
  const forecast = useMemo(() => selectForecastModel(COMMERCIAL_SNAPSHOT, filtros), [filtros])
  const detalhes = useMemo(() => selectOpportunityDetails(COMMERCIAL_SNAPSHOT, filtros), [filtros])
  /*
   * Carteira da estrutura. O nó vem da URL; quando o identificador não existe,
   * cai na raiz em vez de quebrar — a URL nunca é o lugar de provar que um nó
   * existe. O de-para é estático, então a cobertura também é.
   */
  const carteira = useMemo(() => {
    const idNoValidado = idNo && ARVORE.nos.has(idNo) ? idNo : ARVORE.raiz
    const carga = importDraft?.opportunities?.records ?? []
    const registros = recortarPorFilial(carga, branch, ALL_FILTERS)
    const referencia = importDraft?.opportunities?.referenceDate ?? ''
    if (!referencia) return null
    const pedidos = recortarPorFilial(importDraft?.orders?.records ?? [], branch, ALL_FILTERS)
    return montarCarteira(ARVORE, registros, idNoValidado, referencia, coberturaDePara(ARVORE), pedidos, temProbabilidade(carga))
  }, [idNo, importDraft, branch])
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
      const destination = buildCommercialHref(
        destino,
        { period, solution, branch, query, busca, movement, segmento: contexto.segmento, corte: contexto.corte },
        {
          ...(destino === view && from ? { from } : {}),
          // Sair de Territórios para outra tela leva o território aberto, para o retorno cair no mesmo nível.
          ...(destino !== 'territorios' && contexto.territorio ? { territorio: contexto.territorio } : {}),
          ...(destino === 'opportunity' && view !== 'opportunity' ? { returnTo: `${fixedView === 'forecast' ? '/forecast' : '/'}?${consulta}` } : {}),
          ...extra,
        },
      )
      const [caminho, consultaDestino] = destination.split('?')
      const params = new URLSearchParams(consultaDestino)
      const current = new URLSearchParams(consulta)
      for (const key of ['importMonth', 'importRepresentative', 'importUnit', 'demo']) {
        if (current.has(key)) params.set(key, current.get(key)!)
      }
      return `${caminho}?${params.toString()}`
    },
    [period, solution, branch, query, busca, movement, view, from, contexto, consulta, fixedView],
  )

  const movementHref = useCallback(
    (movimento: ForecastMovement) =>
      buildCommercialHref('forecast', { period, solution, branch, query, busca }, { from: 'home', movement: movimento }) + (demoRequested ? '&demo=1' : ''),
    [period, solution, branch, query, busca, demoRequested],
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

  /*
   * Link para a Carteira num nó. O nó raiz não é serializado: a URL da
   * carteira inteira é a mesma para todo mundo, e um `no=cso` explícito
   * obriga quem compartilha o link a conhecer o identificador interno.
   */
  const carteiraHref = useCallback(
    (noId?: string | null) =>
      buildCommercialHref('carteira', { period, solution, branch }, noId && noId !== 'cso' ? { no: noId } : undefined),
    [period, solution, branch],
  )

  const trocarFiltros = useCallback(
    (parcial: Partial<CommercialFilters>) => {
      const destino = buildCommercialHref(
        view,
        { period, solution, branch, segmento: contexto.segmento, corte: contexto.corte, ...parcial },
        {
          from,
          opportunityId,
          returnTo: contexto.returnTo,
          // O recorte de movimento pertence ao Forecast e sobrevive à troca de filtro.
          ...(movement ? { movement } : {}),
        },
      )
      const extras = new URLSearchParams()
      if (demoRequested) extras.set('demo', '1')
      if (query !== '') extras.set('q', query)
      if (busca !== '') extras.set('busca', busca)
      const sufixo = extras.toString()
      router.replace(sufixo === '' ? destino : `${destino}&${sufixo}`, { scroll: false })
    },
    [router, view, period, solution, branch, from, opportunityId, movement, query, busca, contexto, demoRequested],
  )

  const nav = useMemo<CommercialNav>(
    () => ({
      href,
      movementHref,
      branchHref,
      carteiraHref,
      onPeriod: (novoPeriodo: CommercialPeriod) => trocarFiltros({ period: novoPeriodo }),
      onSolution: (novaSolucao: string) => trocarFiltros({ solution: novaSolucao }),
      onBranch: (novaFilial: string) => trocarFiltros({ branch: novaFilial }),
      onQuery: (texto: string) => {
        const base = buildCommercialHref(globalSearchDestination(view), { period, solution, branch }) + (demoRequested ? '&demo=1' : '')
        router.replace(texto === '' ? base : `${base}&q=${encodeURIComponent(texto)}`, { scroll: false })
      },
      onListQuery: (texto: string) => {
        const base = buildCommercialHref('opportunities', { period, solution, branch, movement }, { from }) + (demoRequested ? '&demo=1' : '')
        router.replace(texto === '' ? base : `${base}&busca=${encodeURIComponent(texto)}`, {
          scroll: false,
        })
      },
    }),
    [href, movementHref, branchHref, carteiraHref, trocarFiltros, router, period, solution, branch, view, movement, from, demoRequested],
  )

  /*
   * A porta vem antes de tudo. Enquanto o valor é nulo a tela não decide nada:
   * pintar a visão e depois cobri-la mostraria os números por um frame, e
   * pintar o bloqueio e depois trocar faria piscar para quem já tem a senha.
   */
  if (liberado === false) return <TelaBloqueio onAbrir={() => setLiberado(true)} />
  if (liberado === null) return <div className="min-h-dvh bg-[#f2fbf9]" aria-busy="true" />

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
      estadoCarga={estadoLateral}
      executiveMode={executiveView}
      dataCarga={cargaNaPagina ? dataCarga : null}
    >
      {visualPreviewEnabled && <p role="status" className="mb-3 inline-flex rounded-full bg-white/70 px-3 py-1 text-[12px] text-ink-muted">Homologação · dados fictícios</p>}
      {sharedImportEnabled && view !== 'forecast' && view !== 'config' && view !== 'territorios' && !executiveView && !(sourceView && oportunidadesImportadas) && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dfe8ef] bg-white px-4 py-3 text-sm text-[#33466c]">
        <p><strong>Cenário demonstrativo.</strong> As cargas CSV/XLSX são consultadas em Forecast e New Name. Esta visão usa o cenário fixo, com agregados por filial identificados na tela.</p>
        <Link href={nav.href('config')} className="font-semibold text-[#086b6b] underline">Consultar cargas</Link>
      </div>}
      {view === 'config' && <ImportScreen draft={importDraft} canImport={canImport} onSaved={draft => { importEpoch.current++; setPreviousImportDraft(importDraft); setImportDraft(draft); setImportError('') }} loading={importLoading} loadError={importError} nav={nav} />}
      {executiveView && <ExecutivePage opportunities={importDraft?.opportunities ?? null} orders={importDraft?.orders ?? null} previous={previousImportDraft} history={importDraft?.history ?? []} nav={nav} home={homeMensal} posicao={COMMERCIAL_SNAPSHOT.asOf.slice(0, 10).split('-').reverse().join('/')} carregando={importLoading && !importDraft} falha={importError || null} />}

      {view === 'carteira' && (
        <CarteiraScreen
          carteira={carteira}
          arvore={ARVORE}
          idNo={idNo && ARVORE.nos.has(idNo) ? idNo : ARVORE.raiz}
          referenceDate={importDraft?.opportunities?.referenceDate ?? ''}
          from={from}
          nav={nav}
          branch={branch}
          solucao={solution}
        />
      )}

      {view === 'territorios' && (
        <TerritoriosScreen snapshot={REGIONAL_SNAPSHOT} contexto={contexto} nav={nav} from={from} />
      )}

      {view === 'agent' && <AgentScreen briefing={briefing} from={from} nav={nav} />}

      {view === 'journey' && (
        <JourneyScreen rows={forecast.oportunidades} detalhes={detalhes} query={query} nav={nav} solucao={solution} />
      )}

      {view === 'system' && (
        <SystemScreen model={home} filiaisReais={!visualPreviewEnabled && period === 'month'} nav={nav} />
      )}

      {importError && view !== 'config' && view !== 'forecast' && <section className="rounded-xl border border-[#dfe8ef] bg-white p-6 text-sm text-[#33466c]">
        <p role="alert">{importError}</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <button className="font-semibold underline" onClick={() => window.location.reload()}>Tentar novamente</button>
          <Link href={nav.href('config')} className="font-semibold text-[#086b6b] underline">Consultar cargas</Link>
        </div>
      </section>}
      {sourceView && demoRequested && <Link href={nav.href(view).replace(/&demo=1(?:&|$)/, '&').replace(/&$/, '')} className="mb-4 inline-block text-sm font-semibold text-[#086b6b] underline">Voltar aos dados compartilhados</Link>}
      {view === 'forecast' && !demoRequested && <ResumoForecast modelo={resumoForecast} consultarHref={nav.href('config')} />}
      {view === 'forecast' && oportunidadesImportadas && 'resultado' in resumoForecast && (
        <ImportedForecastScreen batch={oportunidadesImportadas} previousBatch={previousImportDraft?.opportunities ?? null} referenceDate={referenciaOportunidades} movement={movement} />
      )}

      {(view === 'forecast' || view === 'opportunities') && oportunidadesImportadas && (view !== 'forecast' || 'resultado' in resumoForecast) && (
        <PipelineSection records={oportunidadesImportadas.records} previousRecords={previousImportDraft?.opportunities?.records ?? null} referenceDate={referenciaOportunidades} />
      )}

      {view === 'forecast' && demoRequested && (
        <ForecastScreen
          model={forecast}
          meta={home.kpis.find((kpi) => kpi.key === 'meta')?.value ?? 0}
          mes={mes}
          movement={movement === 'Ganhou' || movement === 'Perdeu' ? null : movement}
          detalhes={detalhes}
          from={from}
          nav={nav}
          solucao={solution}
        />
      )}

      {view === 'opportunities' && !oportunidadesImportadas && (
        <OpportunitiesScreen
          rows={forecast.oportunidades}
          detalhes={detalhes}
          busca={busca || query}
          semanas={home.semanas}
          from={from}
          solucao={solution}
          nav={nav}
        />
      )}

      {view === 'accounts' && (
        <AccountsScreen rows={forecast.oportunidades} detalhes={detalhes} query={query} nav={nav} />
      )}

      {!executiveView && view === 'new-name' && (demoRequested || (!sharedImportEnabled && !importDraft?.orders && !importLoading && !importError)) && (
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
          agregadoReal={period === 'month' ? home.filiais.find((filial) => filial.branch === branch) : undefined}
          detalhes={detalhes}
          from={from}
          nav={nav}
          solucao={solution}
        />
      )}

      {view === 'opportunity' && (
        <OpportunityScreen oportunidade={vida ? oportunidade : null} life={vida} from={from} nav={nav} />
      )}
      {view !== 'config' && !executiveView && !(sourceView && oportunidadesImportadas) && <details className="mt-3 px-1 text-[11px] leading-4 text-[#62748b]">
        <summary className="w-fit cursor-pointer rounded-sm underline decoration-dotted underline-offset-2 focus-visible:outline-2 focus-visible:outline-[#086b6b]">
          Cenário demonstrativo · escopo e origem dos dados
        </summary>
        <p className="mt-1 max-w-[1000px]">
          {period === 'month'
            ? 'Agregados de 22 filiais reais de setembro/2026; o realizado de vendas representa pedidos integrados. KPIs, oportunidades, gráficos e detalhes por filial usam o cenário demonstrativo local. A carteira mock não representa a distribuição real por filial.'
            : 'Este período usa dados demonstrativos. Os agregados reais de filial estão disponíveis apenas na Visão Comercial e no Sistema de Receita para setembro/2026.'}
          {' '}Contas e oportunidades usam exemplos demonstrativos; o recorte da carteira acompanha período, solução e filial.
        </p>
      </details>}
    </CommercialShell>
  )
}
