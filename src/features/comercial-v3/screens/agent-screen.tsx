import Link from 'next/link'
import { AgentBriefing } from '../components/agent-briefing'
import { AgentConversation } from '../components/agent-conversation'
import { ViewToolbar } from '../components/view-toolbar'
import { AGENTE_COPY, MOVIMENTO_FRASES, VIEW_LABELS } from '../copy'
import { formatarComSinal, formatarMilhoes, formatarOportunidades, formatarPercentualInteiro } from '../format'
import type { AgentBriefingModel } from '../model'
import type { CommercialNav } from '../nav'
import { FORECAST_MOVEMENTS, type CommercialView } from '../types'

/**
 * Tela do Agente Comercial (plano Task 6 Steps 3-4, l.581-600).
 *
 * Mesmo snapshot e mesmos filtros da Home: o briefing chega pronto do
 * `selectAgentBriefing` e a tela só compõe. Os três sinais do hero aparecem
 * expandidos, a leitura semanal fica no strip, os movimentos abrem o Forecast já
 * filtrado e as filiais em atenção abrem a tela da filial.
 */

type AgentScreenProps = {
  briefing: AgentBriefingModel
  from?: CommercialView
  nav: CommercialNav
}

export function AgentScreen({ briefing, from, nav }: AgentScreenProps) {
  return (
    <div className="grid gap-3">
      <ViewToolbar
        trilha={[
          { label: VIEW_LABELS.home, href: nav.href('home') },
          { label: VIEW_LABELS.agent },
        ]}
        voltar={{ label: AGENTE_COPY.voltar, href: nav.href(from ?? 'home') }}
      />

      <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <div className="grid gap-3">
          <AgentBriefing briefing={briefing} />

          <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">
                  {AGENTE_COPY.sinaisTitulo}
                </h2>
                <p className="mt-0.5 text-[12px] text-[#63748a]">{AGENTE_COPY.sinaisSubtitulo}</p>
              </div>
              <Link
                href={nav.href('forecast', { from: 'agent' })}
                className="rounded-[8px] border border-[#dfe8ef] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] active:translate-y-px"
              >
                Abrir forecast
              </Link>
            </div>

            <ul className="mt-1 grid">
              {FORECAST_MOVEMENTS.map((movimento) => {
                const resumo = briefing.movimentos.byMovement[movimento]
                return (
                  <li key={movimento}>
                  <Link
                    href={nav.href('forecast', { movement: movimento, from: 'agent' })}
                      className="flex items-center justify-between gap-3 border-b border-[#f1f5f7] px-0.5 py-3 transition-premium last:border-b-0 hover:bg-[#f7fbfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:bg-[#eff7f5]"
                    >
                      <span className="min-w-0">
                        <strong className="block text-[13px] font-bold text-[#0d2340]">
                          {MOVIMENTO_FRASES[movimento] ?? movimento}
                        </strong>
                        <span className="num mt-0.5 block text-[12px] text-[#6e7f92]">
                          {formatarOportunidades(resumo.count)} no fluxo do mês
                        </span>
                      </span>
                      <b
                        className={`num whitespace-nowrap text-[13px] font-extrabold ${
                          resumo.value < 0 ? 'text-[#d62d4a]' : 'text-[#008d77]'
                        }`}
                      >
                        {formatarComSinal(resumo.value)}
                      </b>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <aside className="grid gap-3">
          <AgentConversation briefing={briefing} />

          <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
            <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">
              {AGENTE_COPY.acompanhando}
            </h2>
            <p className="mt-0.5 text-[12px] text-[#63748a]">
              Menor forecast atual sobre a meta no recorte atual.
            </p>

            <ul className="mt-1.5 grid gap-1.5">
              {briefing.atencao.map((sinal) => (
                <li key={sinal.branch}>
                  <Link
                    href={nav.branchHref(sinal.branch, 'agent')}
                    className="flex items-center justify-between gap-3 rounded-[8px] px-2 py-2.5 transition-premium hover:bg-[#f3f8f7] hover:translate-x-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:bg-[#eaf5f2]"
                  >
                    <span className="min-w-0">
                      <strong className="block text-[13px] font-extrabold text-[#334b64]">
                        {sinal.branch}
                      </strong>
                      <span className="num mt-0.5 block text-[11px] text-[#6e7f92]">
                        {formatarPercentualInteiro(sinal.cobertura)} da meta ·{' '}
                        {formatarMilhoes(sinal.realizado)} em ganhos no CRM
                      </span>
                    </span>
                    <b className="num whitespace-nowrap text-[13px] font-bold text-[#435873]">
                      {formatarMilhoes(sinal.meta)}
                    </b>
                  </Link>
                </li>
              ))}
              {briefing.atencao.length === 0 && (
                <li className="rounded-[8px] border border-[#edf1f3] bg-[#fbfdfe] px-2.5 py-2.5 text-[12px] text-[#63748a]">
                  Nenhuma filial com meta definida no recorte atual.
                </li>
              )}
            </ul>

            <p className="mt-2.5 border-t border-[#edf2f6] pt-2 text-[11px] text-[#8190a2]">
              A leitura é por filial; HEAD não substitui filial em nenhum nível.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
