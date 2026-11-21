'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { NewNameSection } from '../components/new-name-section'
import { BlocoCargaTeste, BlocoEvolucaoSemanal, BlocoExport, BlocoResultadoDemo, SeloOrigem, TabelaSegmentos } from '../components/home-resultado'
import { estadoDaHome, mostraBlocoSemanal, mostraLeituraSintetica } from '../central-vendas-mrr'
import { normalizarCorte, normalizarSegmento, seloDoBloco } from '../home-raio-x'
import { formatarDataCurta } from '../components/executive-ui'
import { REAL_BRANCH_NAMES, REAL_BRANCH_TOTAL } from '../test-data'
import type { HomeModel } from '../model'
import type { CommercialNav } from '../nav'
import type { ImportDraft, ImportHistoryEntry } from '../manual-import-client'

/**
 * Visão Executiva — raio-X do resultado do mês.
 *
 * Cada bloco fala de um universo só e declara origem, período e data de
 * referência: Demo (cenário), Teste (planilha importada na sessão), Export
 * (agregado das filiais, sintético no modo visual) e Planejamento (base declarada de 2027).
 * MRR é só recorrência; habilitação e serviço ficam em linha separada (NR).
 * Forecast, movimentos e pipeline saíram da Home — a leitura fica em Gestão de
 * vendas.
 */

const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function textoVazio(falha: string | null) {
  return falha ? 'Falha na consulta — veja o aviso no topo da página.' : 'Sem carga importada para esta seção.'
}

function EmptySection({ id, titulo, contexto, nav, falha }: { id: string; titulo: string; contexto: string; nav: CommercialNav; falha: string | null }) {
  return (
    <section id={id} data-home-nav={id} aria-labelledby={`${id}-titulo`} className="grid min-w-0 gap-2 scroll-mt-6">
      <header className="px-1">
        <h2 id={`${id}-titulo`} className="text-[20px] font-bold tracking-[-0.03em] text-ink-strong">{titulo}</h2>
        <p className="mt-0.5 text-[13px] text-ink-muted">{contexto}</p>
      </header>
      <div className="revenue-panel vidro flex flex-wrap items-center justify-between gap-3">
        <p className={falha ? 'text-[13px] text-dado-atencao' : 'text-[13px] text-ink-muted'}>{textoVazio(falha)}</p>
        <Link href={nav.href('config')} className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-brand px-3 text-[13px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
          Abrir Configurações
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

/**
 * Esqueleto da primeira carga. Reserva a altura do painel de resultado para a
 * troca não empurrar o conteúdo.
 */
function EsqueletoCarga() {
  return (
    <div aria-hidden className="grid min-w-0 gap-4">
      <section className="revenue-panel vidro grid gap-4">
        <div className="h-[13px] w-56 rounded-full bg-[#e6eef3]" />
        <div className="h-[160px] w-full rounded-[12px] bg-[#eef4f8]" />
      </section>
      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, indice) => (
          <div key={indice} className="revenue-panel vidro grid content-start gap-2">
            <div className="h-[11px] w-24 rounded-full bg-[#e6eef3]" />
            <div className="h-[22px] w-20 rounded-full bg-[#eef4f8]" />
            <div className="h-[10px] w-28 rounded-full bg-[#eef4f8]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExecutivePage({ opportunities, orders, previous, history, nav, home, posicao, carregando = false, falha = null }: {
  opportunities: ImportDraft['opportunities']
  orders: ImportDraft['orders']
  previous: ImportDraft | null
  /** Histórico de cargas já confirmadas, com o snapshot numérico quando existir. */
  history: ImportHistoryEntry[]
  nav: CommercialNav
  /** Cenário demonstrativo: alimenta as leituras quando não há carga. */
  home: HomeModel
  /** Data da fotografia do cenário, em `dd/mm/aaaa`. */
  posicao: string
  carregando?: boolean
  /** Mensagem quando a consulta da carga falhou — não confundir com ausência de carga. */
  falha?: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referenceDate = opportunities?.referenceDate ?? orders?.referenceDate ?? ''
  const ordersReferenceDate = orders?.referenceDate ?? referenceDate
  const temCarga = Boolean(opportunities || orders)
  const estado = estadoDaHome({ temCarga, carregando, falha })
  const segmento = normalizarSegmento(searchParams.get('segmento'))
  const corte = normalizarCorte(searchParams.get('corte'))

  const mesExtenso = referenceDate
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${referenceDate.slice(0, 7)}-01T12:00:00Z`))
    : ''
  const mesCurto = mesExtenso.split(' de ')[0]
  const partesPosicao = posicao.split('/')
  const periodoDemo = partesPosicao.length === 3 && MES_CURTO[Number(partesPosicao[1]) - 1]
    ? `${MES_CURTO[Number(partesPosicao[1]) - 1]}/${partesPosicao[2]}`
    : 'mês'
  const periodo = temCarga && referenceDate ? `${MES_CURTO[Number(referenceDate.slice(5, 7)) - 1]}/${referenceDate.slice(0, 4)}` : periodoDemo
  const referencia = temCarga ? `carga de ${formatarDataCurta(referenceDate)}` : `fotografia ${posicao}`
  const seloPagina = seloDoBloco(temCarga ? 'teste' : 'demo', periodo, referencia)
  const nome = process.env.NEXT_PUBLIC_VISUAL_PREVIEW === '1' ? 'Visitante' : 'Giovanni'

  function aplicarFiltro(chave: 'segmento' | 'corte', valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    const consolidado = chave === 'segmento' ? valor === 'todos' : valor === 'geral'
    if (consolidado) params.delete(chave)
    else params.set(chave, valor)
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="grid min-w-0 gap-5">
      <section id="home" data-home-nav="home" aria-labelledby="executive-title" className="scroll-mt-6 grid min-w-0 gap-4">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1">
          <div className="min-w-0">
            <h1 id="executive-title" className="text-[32px] font-bold leading-[1.08] tracking-[-0.04em] text-ink-strong">
              {temCarga ? `Bom dia, ${nome}` : 'Visão Executiva'}
            </h1>
            <p className="mt-1.5 text-[15px] leading-6 text-ink-muted">
              {temCarga
                ? `Resultado de ${mesCurto} de ${referenceDate.slice(0, 4)} — cada bloco declara a origem do número.`
                : 'Raio-X do resultado mensal: cada bloco declara a origem, o período e a data de referência.'}
            </p>
          </div>
          {(temCarga || mostraLeituraSintetica(estado)) && <SeloOrigem selo={seloPagina} />}
        </header>

        {!temCarga && carregando && <EsqueletoCarga />}

        {mostraLeituraSintetica(estado) && (
          <BlocoResultadoDemo home={home} posicao={posicao} periodo={periodoDemo} />
        )}

        {!temCarga && !carregando && (
          <section aria-label={falha ? 'Falha ao consultar a carga' : 'Sem carga importada'} aria-live="polite" className="revenue-panel vidro grid gap-3">
            <p className={`text-[15px] font-bold ${falha ? 'text-dado-atencao' : 'text-ink-strong'}`}>
              {falha ? 'Não foi possível consultar a carga.' : 'Nenhuma carga importada.'}
            </p>
            <p className={falha ? 'text-[13px] text-dado-atencao' : 'text-[13px] text-ink-muted'}>
              {falha
                ? falha
                : 'Importe as planilhas em Configurações para ler o mês com a carga. Os blocos acima são do cenário demonstrativo, não da carga.'}
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

        {temCarga && (
          <BlocoCargaTeste opportunities={opportunities} referenceDate={referenceDate} periodo={periodo} />
        )}

        <BlocoExport
          total={{ meta: REAL_BRANCH_TOTAL.meta, realizado: REAL_BRANCH_TOTAL.realizado }}
          filiais={REAL_BRANCH_NAMES.length}
          periodo="setembro/2026"
        />

        <TabelaSegmentos
          nav={nav}
          segmento={segmento}
          corte={corte}
          onSegmento={(valor) => aplicarFiltro('segmento', valor)}
          onCorte={(valor) => aplicarFiltro('corte', valor)}
        />

        {mostraBlocoSemanal(estado) && (
          <BlocoEvolucaoSemanal semanas={home.semanas} temCarga={temCarga} referenciaCarga={referenceDate} periodo={periodo} />
        )}

        <section className="revenue-panel vidro flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-ink-muted">
            Forecast, movimentos e pipeline saíram da Home. A leitura completa fica em Gestão de vendas.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={nav.href('forecast')} className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-brand px-3 text-[13px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
              Gestão de vendas <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
            <Link href={nav.href('territorios')} className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-hairline px-3 text-[13px] font-semibold text-ink-strong transition-premium hover:bg-surface-sunken">
              Planejamento 2027 <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </section>

      {orders ? (
        <section className="grid min-w-0 gap-2">
          <div className="px-1">
            <SeloOrigem selo={seloDoBloco('teste', periodo, `carga de ${formatarDataCurta(ordersReferenceDate)}`)} />
          </div>
          <NewNameSection
            orders={orders.records}
            opportunities={opportunities?.records ?? null}
            previousOrders={previous?.orders?.records ?? null}
            previousOpportunities={previous?.opportunities?.records ?? null}
            referenceDate={ordersReferenceDate}
          />
        </section>
      ) : <EmptySection id="new-name" titulo="New Name" contexto="Contas novas, pedidos conferidos e o que saiu do período." nav={nav} falha={falha} />}
    </div>
  )
}
