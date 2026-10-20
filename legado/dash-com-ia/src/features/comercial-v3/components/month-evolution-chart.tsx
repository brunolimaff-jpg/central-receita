import { BLOCOS_HOME } from '../copy'
import type { Kpi, SemanaRow } from '../model'
import { suavizar } from './weekly-forecast-scene'

/**
 * Bloco analítico `Evolução do mês` (plano Task 5 Step 1, l.469-479).
 *
 * Séries: Meta (ritmo) tracejada, Realizado, Forecast oficial e Forecast atual.
 * O mock congelado só oferece série semanal para meta (ritmo) e forecast atual
 * (`weeklyTargetPace` e `weeklyForecast`); Realizado e Forecast oficial entram
 * como referência de fechamento do mês, tiradas dos próprios KPIs, em vez de
 * inventar uma distribuição diária que o snapshot não tem.
 */

const EIXO_X0 = 40
const EIXO_X1 = 403
const EIXO_Y0 = 138
const EIXO_Y1 = 22

/**
 * `SemanaRow` (model.ts:85-92) expõe `week`, `label`, `rangeLabel`, `current`,
 * `forecast` e `pace` — os dias não vêm como número. `rangeLabel` é montado pelo
 * próprio modelo como `${fromDay} – ${toDay}/${mes}` (model.ts:322), então a
 * faixa é lida daí, sem tocar no modelo congelado e sem inventar dia nenhum.
 * Se o formato mudar, o rótulo bruto da semana é usado como marca do eixo.
 */
const FAIXA_SEMANAL = /^(\d+)\s*–\s*(\d+)\/(.+)$/

type FaixaSemanal = { fromDay: number; toDay: number; mes: string }

function lerFaixa(semana: SemanaRow): FaixaSemanal | null {
  const partes = FAIXA_SEMANAL.exec(semana.rangeLabel)
  if (!partes) return null
  return { fromDay: Number(partes[1]), toDay: Number(partes[2]), mes: partes[3] }
}

type MonthEvolutionChartProps = {
  semanas: SemanaRow[]
  kpis: Kpi[]
  mes: string
}

export function MonthEvolutionChart({ semanas, kpis, mes }: MonthEvolutionChartProps) {
  const meta = kpis.find((kpi) => kpi.key === 'meta')?.value ?? 0
  const realizado = kpis.find((kpi) => kpi.key === 'realizado')?.value ?? 0
  const oficial = kpis.find((kpi) => kpi.key === 'forecastOficial')?.value ?? 0
  const atual = kpis.find((kpi) => kpi.key === 'forecastAtual')?.value ?? 0

  const maiorValor = Math.max(meta, realizado, oficial, atual, ...semanas.map((s) => s.pace), 1)
  const escala = Math.max(15, Math.ceil(maiorValor / 5) * 5)
  const posicaoY = (valor: number) => EIXO_Y0 - (valor / escala) * (EIXO_Y0 - EIXO_Y1)

  const faixas = semanas.map(lerFaixa)
  const comDias = semanas.length > 0 && faixas.every((faixa) => faixa !== null)
  const ultimoDia = comDias ? faixas[faixas.length - 1]!.toDay : semanas.length

  const posicaoDia = (dia: number) =>
    EIXO_X0 + ((dia - 1) / Math.max(ultimoDia - 1, 1)) * (EIXO_X1 - EIXO_X0)
  const posicaoIndice = (indice: number) =>
    EIXO_X0 + (indice / Math.max(semanas.length - 1, 1)) * (EIXO_X1 - EIXO_X0)

  const centroX = (indice: number) =>
    comDias ? posicaoDia((faixas[indice]!.fromDay + faixas[indice]!.toDay) / 2) : posicaoIndice(indice)

  const marcas = comDias
    ? [
        ...faixas.map((faixa) => ({
          x: posicaoDia(faixa!.fromDay),
          rotulo: `${faixa!.fromDay}/${faixa!.mes}`,
        })),
        {
          x: posicaoDia(faixas[faixas.length - 1]!.toDay),
          rotulo: `${faixas[faixas.length - 1]!.toDay}/${faixas[faixas.length - 1]!.mes}`,
        },
      ]
    : semanas.map((semana, indice) => ({ x: posicaoIndice(indice), rotulo: semana.rangeLabel }))

  const pontosRitmo = semanas.map(
    (semana, indice) => [centroX(indice), posicaoY(semana.pace)] as [number, number],
  )
  const pontosForecast = semanas.map(
    (semana, indice) => [centroX(indice), posicaoY(semana.forecast)] as [number, number],
  )

  const legenda = [
    { rotulo: 'Meta (ritmo)', cor: '#91a6be', tracejado: true },
    { rotulo: 'Realizado', cor: '#009b83', tracejado: false },
    { rotulo: 'Forecast oficial', cor: '#2f78ea', tracejado: false },
    { rotulo: 'Forecast atual', cor: '#ef4c64', tracejado: false },
  ]

  return (
    <section className="h-full rounded-[14px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#0d2340]">{BLOCOS_HOME.evolucao}</h2>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#63748a]">
          {legenda.map((item) => (
            <span key={item.rotulo} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="w-4"
                style={
                  item.tracejado
                    ? { borderTop: `2px dashed ${item.cor}` }
                    : { borderTop: `3px solid ${item.cor}`, borderRadius: 99 }
                }
              />
              {item.rotulo}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox="0 0 420 160"
        role="img"
        aria-label={`Evolução do mês de ${mes}: meta, realizado, forecast oficial e forecast atual`}
        className="h-[158px] w-full"
      >
        {[escala, (escala * 2) / 3, escala / 3].map((valor) => (
          <g key={valor}>
            <line x1="38" y1={posicaoY(valor)} x2="405" y2={posicaoY(valor)} stroke="#e8eef3" strokeWidth="1" />
            <text x="4" y={posicaoY(valor) + 3} fill="#687a91" fontSize="10">
              {Math.round(valor)} mi
            </text>
          </g>
        ))}
        <line x1="38" y1={EIXO_Y0} x2="405" y2={EIXO_Y0} stroke="#cdd8e0" strokeWidth="1" />

        {/* Referências de fechamento do mês: realizado e fotografia oficial. */}
        <line
          x1={EIXO_X0}
          y1={posicaoY(realizado)}
          x2={EIXO_X1}
          y2={posicaoY(realizado)}
          stroke="#009b83"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1={EIXO_X0}
          y1={posicaoY(oficial)}
          x2={EIXO_X1}
          y2={posicaoY(oficial)}
          stroke="#2f78ea"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {semanas.length > 0 && (
          <>
            <path
              d={suavizar(pontosRitmo)}
              fill="none"
              stroke="#91a6be"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <path d={suavizar(pontosForecast)} fill="none" stroke="#ef4c64" strokeWidth="3" strokeLinecap="round" />
            <g fill="#ef4c64" stroke="#ffffff" strokeWidth="2">
              {pontosForecast.map(([px, py], indice) => (
                <circle key={`pt-${semanas[indice].week}`} cx={px} cy={py} r="4" />
              ))}
            </g>
          </>
        )}

        {marcas.map((marca, indice) => (
          <text
            key={`${marca.rotulo}-${indice}`}
            x={Math.min(marca.x - 6, 386)}
            y="154"
            fill="#687a91"
            fontSize="10"
          >
            {marca.rotulo}
          </text>
        ))}
      </svg>

      {semanas.length === 0 && (
        <p className="mt-1 text-[11px] text-[#63748a]">
          A trajetória semanal do mock está disponível na visão mensal; aqui valem as referências de fechamento.
        </p>
      )}
    </section>
  )
}
