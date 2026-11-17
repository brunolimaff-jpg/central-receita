'use client'

/**
 * Leitura de MRR da Home — quatro leituras separadas da mesma receita.
 *
 * Meta, realizado comercial e forecast atual nunca somam: o realizado é ganho
 * no CRM, o forecast é previsão do recorte e a meta é objetivo. O forecast
 * congelado fica como referência à parte, e a contagem de contas novas tem
 * unidade própria (contas), para não ser lida como R$.
 *
 * Todos os números vêm do `HomeModel` do cenário demonstrativo. Nada aqui é
 * carga real, e a tela diz isso.
 */

import { useState } from 'react'
import { MetricCard, Panel } from './executive-ui'
import { formatarComSinal, formatarMilhoes, formatarPercentualInteiro, formatarRealComSinal } from '../format'
import { leituraSemanal, resumoMrrMes } from '../central-vendas-mrr'
import type { Kpi, SemanaRow } from '../model'

type Leitura = 'mes' | 'semana'

export function MrrReading({
  kpis,
  semanas,
  contasNovas,
  ganhosNovos,
  posicao,
}: {
  kpis: Kpi[]
  semanas: SemanaRow[]
  /** Contas distintas com origem New Name nos ganhos do recorte. */
  contasNovas: number
  /** Ganhos no CRM de contas novas, em milhões — a unidade do fixture. */
  ganhosNovos: number
  /** Data da fotografia do cenário, já curta (`dd/mm/aaaa`). */
  posicao: string
}) {
  const [leitura, setLeitura] = useState<Leitura>('mes')
  const resumo = resumoMrrMes(kpis)
  const semana = leituraSemanal(semanas)
  const atual = semana.find((item) => item.current) ?? null

  return (
    <section aria-labelledby="mrr-titulo" className="grid min-w-0 gap-3">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1">
        <div className="min-w-0">
          <h2 id="mrr-titulo" className="text-[20px] font-bold tracking-[-0.03em] text-ink-strong">
            MRR do mês
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Quatro leituras separadas: meta, realizado comercial, forecast atual e a diferença para a meta. Não somam.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#dfe8ef] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#50647d]">
            Cenário demonstrativo · dados fictícios
          </span>
          <div role="group" aria-label="Leitura" className="revenue-control flex overflow-hidden rounded-[10px]">
            {([
              { id: 'mes' as const, rotulo: 'Mês' },
              { id: 'semana' as const, rotulo: 'Semana' },
            ]).map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={leitura === item.id}
                onClick={() => setLeitura(item.id)}
                className={`min-w-[64px] px-3 py-2 text-[13px] transition-premium ${
                  leitura === item.id ? 'bg-brand-escuro font-bold text-white' : 'text-ink-muted hover:bg-surface-sunken'
                }`}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
        </div>
      </header>

      {leitura === 'mes' ? (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              rotulo="Meta MRR"
              valor={formatarMilhoes(resumo.meta)}
              nota="Objetivo do mês"
              info="Meta de MRR do recorte no cenário demonstrativo."
              tom="marca"
            />
            <MetricCard
              rotulo="Realizado comercial"
              valor={formatarMilhoes(resumo.realizado)}
              nota={resumo.atingimento === null ? 'Atingimento indisponível' : `${formatarPercentualInteiro(resumo.atingimento)} da meta`}
              info="Ganhos no CRM do período. Não é receita realizada nem pedido integrado."
              tom="positivo"
            />
            <MetricCard
              rotulo="Forecast atual"
              valor={formatarMilhoes(resumo.forecastAtual)}
              nota={resumo.cobertura === null ? 'Cobertura indisponível' : `Cobre ${formatarPercentualInteiro(resumo.cobertura)} da meta`}
              info="Previsão revisada na posição atual do recorte."
              tom="info"
            />
            <MetricCard
              rotulo="Diferença para a meta"
              valor={formatarComSinal(resumo.diferenca)}
              nota={`Forecast vs. meta: ${formatarComSinal(resumo.diferencaDoForecast)}`}
              info="Realizado comercial menos a meta. Negativo é o quanto falta hoje; o forecast atual é lido à parte."
              tom={resumo.diferenca < 0 ? 'negativo' : 'positivo'}
            />
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <Panel titulo="Forecast congelado (referência)" subtitulo="Fotografia validada do período; não muda durante a leitura.">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <strong className="num text-[24px] font-bold tracking-[-0.035em] text-ink-strong">
                  {formatarMilhoes(resumo.forecastCongelado)}
                </strong>
                <span className="text-[12px] text-ink-muted">
                  Revisão desde a foto oficial: {formatarComSinal(resumo.forecastAtual - resumo.forecastCongelado)}
                </span>
              </div>
            </Panel>

            <Panel titulo="Contas novas" subtitulo="Unidade própria: contas com origem New Name no recorte.">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <strong className="num text-[24px] font-bold tracking-[-0.035em] text-ink-strong">
                  {contasNovas} {contasNovas === 1 ? 'conta' : 'contas'}
                </strong>
                <span className="text-[12px] text-ink-muted">
                  {formatarMilhoes(ganhosNovos)} em ganhos no CRM
                </span>
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <div className="revenue-panel vidro grid min-w-0 gap-3 p-4">
          <p className="text-[12px] text-ink-muted">
            Leitura semanal do previsto contra o ritmo necessário para a meta. Posição de {posicao}; semana atual em destaque.
          </p>
          {semana.length === 0 ? (
            <p className="text-[13px] text-ink-muted">Sem leitura semanal para este recorte — troque os filtros para o mês consolidado.</p>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
                <caption className="sr-only">Previsão e ritmo necessário por semana</caption>
                <thead>
                  <tr className="border-b border-[#e3eaef] text-[11px] uppercase tracking-[0.06em] text-[#5b6b80]">
                    <th scope="col" className="py-2 pr-3 font-bold">Semana</th>
                    <th scope="col" className="py-2 pr-3 font-bold">Corte</th>
                    <th scope="col" className="py-2 pr-3 text-right font-bold">Previsão</th>
                    <th scope="col" className="py-2 pr-3 text-right font-bold">Ritmo necessário</th>
                    <th scope="col" className="py-2 text-right font-bold">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {semana.map((item) => (
                    <tr key={item.week} className={item.current ? 'bg-[#eef8f5] font-semibold' : 'border-t border-[#edf1f5]'}>
                      <th scope="row" className="py-2 pr-3 text-left">
                        {item.label}
                        {item.current && <span className="ml-1.5 rounded-full bg-[#00af9c]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#086b6b]">atual</span>}
                      </th>
                      <td className="py-2 pr-3 text-[#50647d]">{item.rangeLabel}</td>
                      <td className="num py-2 pr-3 text-right tabular-nums">{formatarMilhoes(item.forecast)}</td>
                      <td className="num py-2 pr-3 text-right tabular-nums text-[#50647d]">{formatarMilhoes(item.pace)}</td>
                      <td className={`num py-2 text-right tabular-nums ${item.diferenca < 0 ? 'text-[#b8294a]' : 'text-[#086b6b]'}`}>
                        <span title={`Previsão ${formatarRealComSinal(item.forecast)} · ritmo ${formatarRealComSinal(item.pace)}`}>
                          {formatarComSinal(item.diferenca)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {atual && (
            <p className="text-[12px] text-ink-muted">
              Semana atual: {atual.label} · previsão {formatarMilhoes(atual.forecast)} contra ritmo de {formatarMilhoes(atual.pace)}.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
