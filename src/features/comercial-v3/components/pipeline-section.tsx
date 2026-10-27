'use client'

import { useMemo, useState } from 'react'
import type { ImportedRecord } from '../manual-import'
import { buildPipelineOverview, isOpenStage } from '../pipeline-model'
import { formatarOportunidades, formatarPercentualInteiro, formatarRealCompacto } from '../format'
import { groupMovements, pipelineMovementRows, type MovementLabel } from '../movement-rows'
import { InfoTip, ImpactRing, MetricCard, MovementCard, Panel, PanelSection, type RingGroup } from './executive-ui'
import { MovementTable } from './movement-table'
import { ColumnChart, DonutChart } from './charts'

/**
 * Seção Oportunidades da página corrida (docs/PLANO-VISAO-EXECUTIVA.md §Oportunidades).
 * Carteira aberta com movimentos desde a carga anterior (Entrou, Saiu, Postergou, Alterou valor),
 * anel de impacto, tabela de movimentos e a carteira por etapa e por mês (mês + 3).
 */

type PipelineSectionProps = {
  records: ImportedRecord[]
  previousRecords?: ImportedRecord[] | null
  referenceDate: string
}

const CARTOES: ReadonlyArray<{ key: MovementLabel; labels: MovementLabel[] }> = [
  { key: 'Entrou', labels: ['Entrou'] },
  { key: 'Saiu', labels: ['Saiu'] },
  { key: 'Postergou', labels: ['Postergou'] },
  { key: 'Alterou valor', labels: ['Alterou valor'] },
]

const MES = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const mesRotulo = (month: string) => MES.format(new Date(`${month}-01T12:00:00Z`)).replace('.', '')
const plural = (quantidade: number, singular: string, pluralForma: string) => `${quantidade} ${quantidade === 1 ? singular : pluralForma}`

const NOTAS: Record<string, string> = {
  Entrou: 'Abertas desde a carga anterior',
  Saiu: 'Fecharam, perderam-se ou saíram',
  Postergou: 'Mudaram a data; Δ é a variação de valor',
  'Alterou valor': 'Mesma data, valor previsto diferente',
}

export function PipelineSection({ records, previousRecords = null, referenceDate }: PipelineSectionProps) {
  const [selecionado, setSelecionado] = useState<MovementLabel | null>(null)
  const overview = useMemo(() => buildPipelineOverview(records, referenceDate), [records, referenceDate])
  const rows = useMemo(() => pipelineMovementRows(records, previousRecords, isOpenStage), [records, previousRecords])
  const grupos = useMemo(() => groupMovements(rows ?? [], CARTOES), [rows])
  const linhas = rows === null ? [] : selecionado ? rows.filter(row => row.movement === selecionado) : rows

  const horizonValue = overview.horizon.some(month => month.value === null) ? null : overview.horizon.reduce((soma, month) => soma + (month.value ?? 0), 0)
  const maxStageValue = Math.max(1, ...overview.byStage.map(stage => stage.value ?? 0))
  const grupo = (key: MovementLabel) => grupos.find(item => item.key === key)!
  const saldo = rows === null || grupos.some(item => item.value === null) ? null : grupos.reduce((soma, item) => soma + (item.value ?? 0), 0)
  const anel: RingGroup[] = CARTOES.map(({ key }) => ({ rotulo: key, movimento: key, valor: rows === null ? null : grupo(key).value, peso: grupo(key).weight }))
  const mesFinal = mesRotulo(overview.horizon[3]?.month ?? referenceDate.slice(0, 7))

  return (
    <PanelSection
      id="opportunities"
      titulo="Oportunidades que movem o mês"
      contexto={`Movimentos da carteira aberta, com cobertura até ${mesFinal}.`}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard rotulo="Pipeline" valor={formatarRealCompacto(horizonValue)} nota="Próximos 3 meses" info="Oportunidades abertas com previsão entre este mês e os três seguintes." tom="marca" />
        <MetricCard rotulo="Abertas" valor={formatarOportunidades(overview.open.length)} nota="Ainda sem desfecho" tom="info" />
        <MetricCard rotulo="Sem previsão" valor={formatarOportunidades(overview.withoutForecast.length)} nota="Precisam de data de fechamento" tom="atencao" />
        <MetricCard rotulo="Previsão vencida" valor={formatarOportunidades(overview.overdue.length)} nota={`Antes de ${referenceDate.split('-').reverse().join('/')}`} tom="negativo" />
      </div>

      {rows !== null && <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 self-start">
          {CARTOES.map(({ key }) => (
            <MovementCard
              key={key}
              movimento={key}
              valor={rows === null ? null : grupo(key).value}
              contagem={plural(rows === null ? 0 : grupo(key).count, 'oportunidade', 'oportunidades')}
              nota={NOTAS[key]}
              disponivel={rows !== null}
              selecionado={selecionado === key}
              onSelecionar={() => setSelecionado(atual => atual === key ? null : key)}
            />
          ))}
        </div>
        <ImpactRing titulo="Impacto na carteira" legenda="Peso de cada movimento no saldo." grupos={anel} saldo={saldo} />
      </div>}

      {rows !== null && <Panel
        titulo={selecionado ? `${selecionado} · ${plural(linhas.length, 'oportunidade', 'oportunidades')}` : 'Principais movimentos da carteira'}
        subtitulo="Maior impacto primeiro."
        acao={selecionado && (
          <button type="button" onClick={() => setSelecionado(null)} className="rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
            Mostrar todos
          </button>
        )}
      >
        <MovementTable
          linhas={linhas}
          legenda=""
          vazio={rows === null ? 'Os movimentos aparecem a partir da segunda carga.' : 'Nenhum movimento neste recorte.'}
        />
      </Panel>}

      <div className="grid gap-4 md:grid-cols-2">
        <Panel titulo="Carteira por etapa" subtitulo="Valor e quantidade de oportunidades abertas.">
          <DonutChart
            centro={String(overview.open.length)}
            legendaCentro="abertas"
            fatias={overview.byStage.map((stage, indice) => ({
              rotulo: `${stage.stage} · ${stage.count}`,
              valor: stage.value,
              cor: ['var(--verde-institucional)', 'var(--verde-claro)', 'var(--dado-info)', 'var(--dado-atencao)', 'var(--ink-muted)'][indice % 5],
            }))}
          />
        </Panel>
        <Panel titulo="Previsão por mês" acao={<InfoTip texto="Valor previsto das oportunidades abertas, do mês da carga aos três seguintes." />}>
          <ColumnChart colunas={overview.horizon.map((month, indice) => ({ rotulo: mesRotulo(month.month).replace(/ de (\d{4})$/, " '$1").replace(/'20/, "'"), valor: month.value, destaque: indice === 0 }))} vazio="Sem previsão nos próximos meses." />
        </Panel>
      </div>
    </PanelSection>
  )
}
