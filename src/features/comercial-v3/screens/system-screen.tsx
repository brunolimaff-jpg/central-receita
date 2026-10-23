import Link from 'next/link'
import { AvisoPreliminar } from '../components/aviso-preliminar'
import { BranchRail } from '../components/branch-rail'
import { KpiStrip } from '../components/kpi-strip'
import { ViewToolbar } from '../components/view-toolbar'
import { FORECAST_MOVEMENTS } from '../types'
import { VIEW_LABELS, VOLTAR_POR_ORIGEM } from '../copy'
import { formatarComSinal } from '../format'
import type { HomeModel } from '../model'
import type { CommercialNav } from '../nav'

type SystemScreenProps = {
  model: HomeModel
  filiaisReais: boolean
  nav: CommercialNav
}

/** Etiqueta de origem do número: o bloco diz de onde vem antes de mostrar valor. */
function OrigemDado({ tipo, children }: { tipo: 'demonstrativo' | 'real'; children: React.ReactNode }) {
  const demonstrativo = tipo === 'demonstrativo'
  return (
    <p
      className={`inline-flex w-fit items-start gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] leading-4 ${demonstrativo ? 'bg-[#f7f9fb] text-[#63748a]' : 'bg-[#f3faf8] text-[#086b6b]'}`}
    >
      <span aria-hidden className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${demonstrativo ? 'bg-[#94a6ba]' : 'bg-[#00968c]'}`} />
      <span>{children}</span>
    </p>
  )
}

export function SystemScreen({ model, filiaisReais, nav }: SystemScreenProps) {
  return (
    <div className="grid gap-3">
      <ViewToolbar
        trilha={[
          { label: VIEW_LABELS.home, href: nav.href('home') },
          { label: VIEW_LABELS.system },
        ]}
        voltar={{ label: VOLTAR_POR_ORIGEM.home, href: nav.href('home') }}
      />
      <AvisoPreliminar area="Sistema de Receita" />

      <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-5 py-4 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
        <h2 className="text-[22px] font-bold tracking-[-0.035em] text-[#0d2340]">Saúde e cobertura do recorte</h2>
        <p className="mt-1 max-w-[820px] text-[13px] leading-5 text-[#50647d]">
          Indicadores disponíveis no snapshot V3, com os filtros do cabeçalho. Cada bloco diz de onde vêm seus números.
        </p>
      </section>

      {/*
       * A tela mistura duas origens, e elas não se somam: os KPIs e os
       * movimentos vêm do snapshot demonstrativo; o rail de filiais, no
       * recorte mensal, usa o agregado real exportado de setembro. Marcar
       * cada bloco na origem evita que o número fictício seja lido como
       * fechamento e que o real seja lido como parte do demo.
       */}
      <section aria-label="Indicadores do recorte" className="grid gap-2">
        <OrigemDado tipo="demonstrativo">Indicadores abaixo: snapshot demonstrativo, não são números fechados.</OrigemDado>
        <KpiStrip kpis={model.kpis} />
      </section>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div className="grid gap-3">
          <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">Movimentos do forecast</h2>
                <p className="mt-0.5 text-[12px] text-[#63748a]">Contagem e variação dentro do recorte atual.</p>
                <div className="mt-2"><OrigemDado tipo="demonstrativo">Snapshot demonstrativo</OrigemDado></div>
              </div>
              <Link
                href={nav.href('forecast', { from: 'system' })}
                className="rounded-[8px] border border-[#dfe8ef] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
              >
                Abrir forecast
              </Link>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {FORECAST_MOVEMENTS.map((movimento) => {
                const resumo = model.movimentos.byMovement[movimento]
                return (
                  <li key={movimento} className="flex min-w-0 items-center justify-between gap-3 rounded-[10px] border border-[#e8eef2] bg-[#fbfcfd] px-3 py-2.5">
                    <span>
                      <strong className="block text-[12px] text-[#243b56]">{movimento}</strong>
                      <small className="mt-0.5 block text-[11px] text-[#63748a]">{resumo.count} oportunidades · delta do forecast</small>
                    </span>
                    <strong className={resumo.value < 0 ? 'num whitespace-nowrap text-[13px] text-[#c32943]' : 'num whitespace-nowrap text-[13px] text-[#00856f]'}>
                      {formatarComSinal(resumo.value)}
                    </strong>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-[11px] leading-4 text-[#63748a]">
              O delta compara a fotografia oficial com o forecast atual; movimentos não são receita realizada.
            </p>
          </section>

          <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
            <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">O que o snapshot cobre</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-[10px] bg-[#f3faf8] p-3">
                <strong className="text-[12px] text-[#086b6b]">Disponível</strong>
                <p className="mt-1 text-[11px] leading-5 text-[#405872]">
                  Meta, ganhos no CRM, forecast oficial e atual, movimentos, origem New Name/Cross e oportunidades do recorte.
                </p>
              </div>
              <div className="rounded-[10px] bg-[#f7f9fb] p-3">
                <strong className="text-[12px] text-[#405872]">Sem contrato neste snapshot</strong>
                <p className="mt-1 text-[11px] leading-5 text-[#63748a]">
                  Base ativa, ciclo de venda, entrega, retenção e churn. Esta tela não calcula esses indicadores.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-2">
          <OrigemDado tipo={filiaisReais ? 'real' : 'demonstrativo'}>
            {filiaisReais ? 'Agregado real exportado de setembro/2026 — não é o recorte demonstrativo ao lado' : 'Snapshot demonstrativo'}
          </OrigemDado>
          <BranchRail filiais={model.filiais} nav={nav} real={filiaisReais} from="system" />
        </div>
      </div>
    </div>
  )
}
