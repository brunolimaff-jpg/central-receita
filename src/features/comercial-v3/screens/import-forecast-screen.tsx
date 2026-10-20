'use client'

import { useMemo, useState } from 'react'
import type { ImportBatch, ImportedRecord } from '../manual-import'
import { calculateForecastMonth, isClosedStage, isForecastStage, type ForecastPeriod } from '../forecast-month'
import { formatarOportunidades, formatarPercentualInteiro, formatarRealCompacto } from '../format'
import { forecastMovementRows, groupMovements, type MovementLabel } from '../movement-rows'
import { BarraProgresso, ImpactRing, MetricCard, MovementCard, Panel, PanelSection, type RingGroup } from '../components/executive-ui'
import { MovementTable } from '../components/movement-table'

/** Cartões do Forecast: Saiu junta as postergadas (ver docs/PLANO-VISAO-EXECUTIVA.md §Forecast). */
export const CARTOES_FORECAST: ReadonlyArray<{ key: string; labels: MovementLabel[] }> = [
  { key: 'Entrou', labels: ['Entrou'] },
  { key: 'Saiu', labels: ['Saiu', 'Postergou'] },
  { key: 'Ganhou', labels: ['Ganhou'] },
  { key: 'Perdeu', labels: ['Perdeu'] },
]

/**
 * Único cálculo do Forecast, reutilizado pela Visão Executiva para que os números batam.
 * Usa as funções de `forecast-month.ts` sem alterar a regra.
 */
export function selectForecastMovements(current: ImportedRecord[], previous: ImportedRecord[] | null, referenceDate: string, period: ForecastPeriod) {
  const result = calculateForecastMonth(current, previous, referenceDate.slice(0, 7), referenceDate, period)
  const rows = forecastMovementRows(result, current)
  const grupos = groupMovements(rows, CARTOES_FORECAST)
  return { result, rows, grupos }
}

const mesPorExtenso = (month: string) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`))
const dataCurta = (value: string | null) => (value ? value.split('-').reverse().join('/') : '—')

/** Alternador Semana | Mês, usado pelas seções Forecast e New Name. */
export function SeletorPeriodo({ rotulo, valor, opcoes, onChange }: {
  rotulo: string
  valor: string
  opcoes: ReadonlyArray<{ valor: string; texto: string }>
  onChange: (valor: string) => void
}) {
  return (
    <div role="group" aria-label={rotulo} className="vidro inline-flex rounded-[10px] p-1">
      {opcoes.map(opcao => {
        const ativo = valor === opcao.valor
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(opcao.valor)}
            className={`h-8 rounded-[8px] px-3.5 text-[13px] font-semibold transition-premium ${ativo ? 'bg-brand-escuro text-white' : 'text-ink-muted hover:bg-surface-sunken'}`}
          >
            {opcao.texto}
          </button>
        )
      })}
    </div>
  )
}

export function ImportedForecastScreen({ batch, previousBatch, referenceDate }: { batch: ImportBatch; previousBatch: ImportBatch | null; referenceDate: string }) {
  const [period, setPeriod] = useState<ForecastPeriod>('mês')
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const previous = previousBatch?.records ?? null
  const month = referenceDate.slice(0, 7)
  const monthResult = useMemo(() => calculateForecastMonth(batch.records, previous, month, referenceDate, 'mês'), [batch.records, previous, month, referenceDate])
  const { result, rows, grupos } = useMemo(() => selectForecastMovements(batch.records, previous, referenceDate, period), [batch.records, previous, referenceDate, period])

  const linhas = selecionado ? rows.filter(row => CARTOES_FORECAST.find(cartao => cartao.key === selecionado)?.labels.includes(row.movement)) : rows
  const grupo = (key: string) => grupos.find(item => item.key === key)!
  const disponivel = { Entrou: result.entered !== null, Saiu: result.exited !== null, Ganhou: true, Perdeu: true }
  const outsideRule = batch.records.filter(record => !isClosedStage(record.stage) && !isForecastStage(record.stage) && record.forecastDate?.startsWith(month)).length
  const projetado = monthResult.projected
  const realizado = monthResult.realized.value
  const percentual = projetado !== null && projetado > 0 && realizado !== null ? Math.min(100, realizado / projetado * 100) : null
  const saldo = grupos.some(item => item.value === null) ? null : grupos.reduce((soma, item) => soma + (item.value ?? 0), 0)
  const anel: RingGroup[] = [
    { rotulo: 'Entrou', movimento: 'Entrou', valor: grupo('Entrou').value, peso: grupo('Entrou').weight },
    { rotulo: 'Saiu e postergou', movimento: 'Saiu', valor: grupo('Saiu').value, peso: grupo('Saiu').weight },
    { rotulo: 'Ganhou', movimento: 'Ganhou', valor: grupo('Ganhou').value, peso: grupo('Ganhou').weight },
    { rotulo: 'Perdeu', movimento: 'Perdeu', valor: grupo('Perdeu').value, peso: grupo('Perdeu').weight },
  ]
  const mesLabel = mesPorExtenso(month)

  return (
    <PanelSection
      id="forecast"
      titulo="Forecast"
      contexto={`Previsto, ganhos no CRM e movimentação de ${mesLabel}.`}
      acao={
        <SeletorPeriodo
          rotulo="Período do forecast"
          valor={period}
          opcoes={[{ valor: 'semana', texto: 'Semana' }, { valor: 'mês', texto: 'Mês' }]}
          onChange={valor => { setPeriod(valor as ForecastPeriod); setSelecionado(null) }}
        />
      }
    >
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 content-start gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard rotulo="Previsto para o mês" valor={formatarRealCompacto(projetado)} nota="Vendido + aberto na régua" tom="marca" />
            <MetricCard rotulo="Ganhos no CRM" valor={formatarRealCompacto(realizado)} nota={percentual === null ? 'Ganho no mês' : `${formatarPercentualInteiro(percentual / 100)} do previsto`} tom="positivo" />
            <MetricCard rotulo="Em aberto" valor={formatarRealCompacto(monthResult.open)} nota="Previsto menos ganhos no CRM" tom="info" />
          </div>

          <Panel>
            <div className="flex items-center gap-3">
              <BarraProgresso valor={percentual ?? 0} rotulo="Ganhos no CRM sobre previsto" />
              <span className="num shrink-0 text-[13px] font-semibold text-ink-strong">
                {percentual === null ? '—' : `${formatarPercentualInteiro(percentual / 100)} em ganhos no CRM`}
              </span>
            </div>
            <p className="mt-2.5 text-[12px] text-ink-muted">
              {period === 'semana' ? 'Cartões e lista na semana; previsto e em aberto no mês inteiro. ' : 'Período: mês da data de referência. '}
              Meta indisponível na carga.
            </p>
          </Panel>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CARTOES_FORECAST.map(({ key }) => {
              const item = grupo(key)
              const ok = disponivel[key as keyof typeof disponivel]
              const nota = key === 'Entrou'
                ? 'Passou a cumprir o critério do mês'
                : key === 'Saiu' ? `Inclui ${result.postponed?.count ?? 0} postergadas`
                  : key === 'Ganhou' ? 'Fechadas como ganhas no período' : 'Fechadas como perdidas no período'
              return (
                <MovementCard
                  key={key}
                  movimento={key as MovementLabel}
                  valor={item.value}
                  contagem={formatarOportunidades(item.count)}
                  nota={nota}
                  disponivel={ok}
                  selecionado={selecionado === key}
                  onSelecionar={() => setSelecionado(atual => atual === key ? null : key)}
                />
              )
            })}
          </div>
        </div>

        <ImpactRing titulo="Impacto no forecast do mês" legenda="Peso de cada movimento; o centro traz o saldo líquido." grupos={anel} saldo={saldo} />
      </div>

      <Panel
        titulo={selecionado ? `${selecionado} · ${formatarOportunidades(linhas.length)}` : 'Principais movimentos do mês'}
        subtitulo="Maior impacto primeiro. Δ valor é o efeito no forecast do mês."
        acao={selecionado && (
          <button type="button" onClick={() => setSelecionado(null)} className="rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
            Mostrar todos
          </button>
        )}
      >
        <MovementTable
          linhas={linhas}
          legenda=""
          vazio="Nenhum movimento neste grupo. A comparação depende da carga anterior."
        />
      </Panel>

      {monthResult.notice && (
        <p role="note" className="rounded-[10px] bg-dado-atencao-suave px-4 py-3 text-[13px] leading-5 text-dado-atencao">
          {monthResult.notice}
        </p>
      )}

      <p className="px-1 text-[12px] leading-5 text-ink-muted">
        {monthResult.probabilityAvailable
          ? 'Critério: Proposta ou Negociação, chance de 75% ou mais, previsão no mês.'
          : 'Probabilidade ausente na carga: o critério de 75% não foi aplicado.'}
        {outsideRule > 0 && ` ${outsideRule} ${outsideRule === 1 ? 'oportunidade do mês está' : 'oportunidades do mês estão'} fora da régua.`}
        {' '}Previsão de {dataCurta(monthResult.period.start)} a {dataCurta(monthResult.period.end)}.
      </p>
    </PanelSection>
  )
}
