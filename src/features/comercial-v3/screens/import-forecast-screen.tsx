'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ImportBatch, ImportedRecord } from '../manual-import'
import { calculateForecastMonth, isClosedStage, isForecastStage, type ForecastPeriod } from '../forecast-month'
import { ponteReconcilia } from '../trajectory-model'
import { formatarOportunidades, formatarPercentualInteiro, formatarRealCompacto } from '../format'
import { forecastFocusFromHash, forecastHashFor, HASH_FORECAST_GANHOU, type ForecastFocusMovement } from '../forecast-focus'
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
export function selectForecastMovements(current: ImportedRecord[], previous: ImportedRecord[] | null, referenceDate: string, period: ForecastPeriod, previousReferenceDate?: string | null) {
  const result = calculateForecastMonth(current, previous, referenceDate.slice(0, 7), referenceDate, period, previousReferenceDate)
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

export function ImportedForecastScreen({ batch, previousBatch, referenceDate, focus }: {
  batch: ImportBatch
  previousBatch: ImportBatch | null
  referenceDate: string
  /** Pedido de foco da Home; `key` reaplica o recorte em cliques repetidos. */
  focus?: { movement: ForecastFocusMovement | null; key: number } | null
}) {
  const [period, setPeriod] = useState<ForecastPeriod>('mês')
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const previous = previousBatch?.records ?? null

  useEffect(() => {
    const aplicar = () => {
      // Hash vazio significa que "voltar" saiu do Forecast.
      if (window.location.hash === '') {
        setPeriod('mês')
        setSelecionado(null)
        return
      }
      const foco = forecastFocusFromHash(window.location.hash)
      if (!foco) return
      setPeriod(foco.period)
      setSelecionado(foco.movement)
      // `#forecast-ganhou` não é âncora visível; a seção precisa rolar até aqui.
      if (window.location.hash === HASH_FORECAST_GANHOU) {
        document.getElementById('forecast')?.scrollIntoView({ behavior: 'instant', block: 'start' })
      }
    }
    aplicar()
    window.addEventListener('hashchange', aplicar)
    return () => window.removeEventListener('hashchange', aplicar)
  }, [])

  useEffect(() => {
    if (!focus) return
    setPeriod('mês')
    setSelecionado(focus.movement)
  }, [focus])

  /** Mantém a URL descrevendo a seleção sem criar entrada no histórico. */
  const marcarHash = (movement: string | null) => {
    try {
      // Preserva o estado do Next no histórico.
      window.history.replaceState(window.history.state, '', forecastHashFor(movement, period))
    } catch {
      // Histórico bloqueado: a seleção local continua valendo.
    }
  }
  const month = referenceDate.slice(0, 7)
  // Competência da carga anterior: a ponte só compara cargas do mesmo mês.
  const competenciaAnterior = previousBatch?.referenceDate ?? null
  const monthResult = useMemo(() => calculateForecastMonth(batch.records, previous, month, referenceDate, 'mês', competenciaAnterior), [batch.records, previous, month, referenceDate, competenciaAnterior])
  const { result, rows, grupos } = useMemo(() => selectForecastMovements(batch.records, previous, referenceDate, period, competenciaAnterior), [batch.records, previous, referenceDate, period, competenciaAnterior])

  const linhas = selecionado ? rows.filter(row => CARTOES_FORECAST.find(cartao => cartao.key === selecionado)?.labels.includes(row.movement)) : rows
  const grupo = (key: string) => grupos.find(item => item.key === key)!
  /* Cargas de meses diferentes não se comparam: Entrou/Saiu ficam indisponíveis. */
  const comparavel = result.bridge?.comparavel ?? true
  const disponivel = { Entrou: comparavel && result.entered !== null, Saiu: comparavel && result.exited !== null, Ganhou: true, Perdeu: true }
  const outsideRule = batch.records.filter(record => !isClosedStage(record.stage) && !isForecastStage(record.stage) && record.forecastDate?.startsWith(month)).length
  const projetado = monthResult.projected
  const realizado = monthResult.realized.value
  const percentual = projetado !== null && projetado > 0 && realizado !== null ? Math.min(100, realizado / projetado * 100) : null
  /*
   * O saldo é a variação do previsto entre as cargas, não a soma dos cartões:
   * quem fechou aparece em Saiu e também em Ganhou/Perdeu, e somar as quatro
   * parcelas contaria a mesma oportunidade duas vezes. A ponte já reconcilia
   * (Entrou + Saiu + Alterou) com a diferença dos totais.
   */
  const saldo = result.bridge?.comparavel
    ? ponteReconcilia({
        totalAnterior: result.bridge.totalAnterior,
        totalAtual: result.bridge.totalAtual,
        entrou: result.bridge.entrou,
        saiu: result.bridge.saiu,
        alterou: result.bridge.alterou,
      })
      ? (result.bridge.entrou ?? 0) + (result.bridge.saiu ?? 0) + (result.bridge.alterou ?? 0)
      : null
    : null
  /*
   * O anel mostra a decomposição do saldo. Ganhou e Perdeu ficam de fora porque
   * já estão dentro de Saiu — a oportunidade que fechou deixou o previsto
   * aberto. Eles continuam visíveis nos cartões e na lista, como desfecho.
   */
  const anel: RingGroup[] = [
    { rotulo: 'Entrou', movimento: 'Entrou', valor: result.bridge?.entrou ?? null, peso: Math.abs(result.bridge?.entrou ?? 0) },
    { rotulo: 'Saiu e postergou', movimento: 'Saiu', valor: result.bridge?.saiu ?? null, peso: Math.abs(result.bridge?.saiu ?? 0) },
    { rotulo: 'Alterou valor', movimento: 'Alterou valor', valor: result.bridge?.alterou ?? null, peso: Math.abs(result.bridge?.alterou ?? 0) },
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
          onChange={valor => { setPeriod(valor as ForecastPeriod); setSelecionado(null); marcarHash(null) }}
        />
      }
    >
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 content-start gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard rotulo="Previsto para o mês" valor={formatarRealCompacto(projetado)} nota="Ganhos no CRM + aberto elegível" tom="marca" />
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
              {period === 'semana'
                ? 'Semana: entradas, saídas e saldo comparam as carteiras elegíveis na semana nas duas cargas. Ganhos e perdas usam a data de efetivação; previsto, ganhos e em aberto seguem o mês. '
                : 'Mês da data de referência: cartões, lista e indicadores no mês. '}
              Meta indisponível na carga.
            </p>
          </Panel>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CARTOES_FORECAST.map(({ key }) => {
              const item = grupo(key)
              const ok = disponivel[key as keyof typeof disponivel]
              /*
               * Na semana, a comparação é entre as carteiras elegíveis naquela
               * janela em cada carga — não significa que a mudança aconteceu
               * naquela semana. O rótulo diz o que a conta faz.
               */
              const nota = key === 'Entrou'
                ? (period === 'semana' ? 'Na carteira da semana, não estava na carga anterior' : 'Passou a cumprir o critério do mês')
                : key === 'Saiu' ? (period === 'semana'
                    ? `Saiu da carteira da semana · ${result.postponed?.count ?? 0} postergadas`
                    : `Inclui ${result.postponed?.count ?? 0} postergadas`)
                  : key === 'Ganhou' ? 'Fechadas como ganhas no período' : 'Fechadas como perdidas no período'
              return (
                <MovementCard
                  key={key}
                  movimento={key as MovementLabel}
                  valor={item.value}
                  contagem={formatarOportunidades(item.count)}
                  nota={nota}
                  disponivel={ok}
                  motivoIndisponivel={!comparavel
                    ? { contagem: `Carga anterior de ${dataCurta(competenciaAnterior)}`, nota: 'Cargas de meses diferentes não se comparam' }
                    : undefined}
                  selecionado={selecionado === key}
                  onSelecionar={() => {
                    const proximo = selecionado === key ? null : key
                    setSelecionado(proximo)
                    marcarHash(proximo)
                  }}
                />
              )
            })}
          </div>
        </div>

        <ImpactRing titulo={period === 'semana' ? 'Impacto no forecast da semana' : 'Impacto no forecast do mês'} legenda="Peso de cada movimento; o centro traz o saldo líquido." grupos={anel} saldo={saldo} rotuloSaldo={period === 'semana' ? 'Saldo da semana' : 'Saldo no mês'} />
      </div>

      <Panel
        titulo={selecionado ? `${selecionado} · ${formatarOportunidades(linhas.length)}` : period === 'semana' ? 'Principais movimentos da semana' : 'Principais movimentos do mês'}
        subtitulo={period === 'semana'
          ? 'Maior impacto primeiro. Δ valor é a variação de valor na janela; Ganhou e Perdeu são desfecho, fora do saldo.'
          : 'Maior impacto primeiro. Δ valor é a variação de valor no mês; Ganhou e Perdeu são desfecho, fora do saldo.'}
        acao={selecionado && (
          <button type="button" onClick={() => { setSelecionado(null); marcarHash(null) }} className="rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
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
