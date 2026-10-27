'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ImportBatch, ImportedRecord } from '../manual-import'
import { calculateForecastMonth, isClosedStage, isForecastStage, type ForecastPeriod } from '../forecast-month'
import { ponteReconcilia } from '../trajectory-model'
import { formatarOportunidades, formatarPercentualInteiro, formatarRealCompacto } from '../format'
import { forecastFocusFromHash, forecastHashFor, HASH_FORECAST_GANHOU, type ForecastFocusMovement } from '../forecast-focus'
import { forecastMovementRows, groupMovements, type MovementLabel } from '../movement-rows'
import { ImpactRing, InfoTip, MovementCard, Panel, PanelSection, type RingGroup } from '../components/executive-ui'
import { ColumnChart, type Coluna } from '../components/charts'
import { MovementTable } from '../components/movement-table'
import { ForecastTowersPanel, type ModoRecorte } from '../components/forecast-towers-panel'

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
  const [recorte, setRecorte] = useState<ModoRecorte>('agora')
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
  // Semanas do mês (1–7, 8–14…) somando o valor das oportunidades ganhas.
  const ganhosPorSemana: Coluna[] = [0, 1, 2, 3, 4].map(semana => ({
    rotulo: `Sem ${semana + 1}`,
    valor: batch.records
      .filter(record => record.closingDate?.startsWith(month) && /ganh/i.test(`${record.stage} ${record.status}`) && Math.min(4, Math.floor((Number(record.closingDate.slice(8, 10)) - 1) / 7)) === semana)
      .reduce((soma, record) => soma + (record.closedValue ?? record.predictedValue ?? 0), 0),
  })).filter((coluna, indice) => indice < 4 || (coluna.valor ?? 0) > 0)

  return (
    <PanelSection
      id="forecast"
      titulo="Forecast"
      contexto={`Previsto, ganhos no CRM e movimentação de ${mesLabel}.`}
      acao={
        <div className="flex flex-wrap items-center gap-2">
        <SeletorPeriodo
          rotulo="Estrutura do forecast"
          valor={recorte}
          opcoes={[{ valor: 'agora', texto: 'Agora' }, { valor: '2027', texto: '2027' }]}
          onChange={valor => setRecorte(valor as ModoRecorte)}
        />
        <SeletorPeriodo
          rotulo="Período do forecast"
          valor={period}
          opcoes={[{ valor: 'semana', texto: 'Semana' }, { valor: 'mês', texto: 'Mês' }]}
          onChange={valor => { setPeriod(valor as ForecastPeriod); setSelecionado(null); marcarHash(null) }}
        />
        </div>
      }
    >
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-4">
          <Panel className="h-full" titulo="Ganhos por semana" subtitulo={`Valor fechado como ganho em ${mesLabel}.`} acao={<InfoTip texto={monthResult.probabilityAvailable ? 'Entram no previsto as oportunidades em Proposta ou Negociação, com chance de 75% ou mais e previsão no mês.' : 'A carga não traz probabilidade: o critério de 75% não foi aplicado.'} />}>
            <ColumnChart colunas={ganhosPorSemana} vazio="Nenhum ganho registrado no mês." />
          </Panel>
        </div>

        <div className="grid min-w-0 gap-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
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

        <ImpactRing titulo={period === 'semana' ? 'Impacto no forecast da semana' : 'Impacto no forecast do mês'} legenda="Peso de cada movimento no saldo." grupos={anel} saldo={saldo} rotuloSaldo={period === 'semana' ? 'Saldo da semana' : 'Saldo no mês'} />
        </div>
      </div>

      <ForecastTowersPanel
        modo={recorte}
        previstos={result.predicted.records}
        ganhos={result.realized.records}
        periodo={period === 'semana' ? 'da semana' : `de ${mesLabel}`}
      />

      <Panel
        titulo={selecionado ? `${selecionado} · ${formatarOportunidades(linhas.length)}` : period === 'semana' ? 'Principais movimentos da semana' : 'Principais movimentos do mês'}
        subtitulo={period === 'semana'
          ? 'Maior impacto primeiro.'
          : 'Maior impacto primeiro.'}
        acao={selecionado && (
          <button type="button" onClick={() => { setSelecionado(null); marcarHash(null) }} className="rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
            Mostrar todos
          </button>
        )}
      >
        <MovementTable
          linhas={linhas}
          legenda=""
          vazio="Nenhum movimento neste grupo."
        />
        <p className="mt-3 text-[12px] text-ink-muted">
          {' '}Previsão de {dataCurta(result.period.start)} a {dataCurta(result.period.end)}.
        </p>
      </Panel>

      {monthResult.notice && (
        <p role="note" className="rounded-[10px] bg-dado-atencao-suave px-4 py-3 text-[13px] leading-5 text-dado-atencao">
          {monthResult.notice}
        </p>
      )}

    </PanelSection>
  )
}
