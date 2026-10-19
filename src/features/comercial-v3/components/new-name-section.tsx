'use client'

import { useMemo, useState } from 'react'
import type { ImportedRecord } from '../manual-import'
import { calculateNewNameModel, type NewNamePeriod, type OrderSubstatus } from '../new-name-model'
import { formatarRealCompacto } from '../format'
import { groupMovements, newNameMovementRows, type MovementLabel } from '../movement-rows'
import { ImpactRing, MetricCard, MovementCard, Panel, PanelSection, type RingGroup } from './executive-ui'
import { MovementTable } from './movement-table'
import { SeletorPeriodo } from '../screens/import-forecast-screen'

/**
 * Seção New Name da página corrida (docs/PLANO-VISAO-EXECUTIVA.md §New Name).
 * Somente leitura: indicadores, cartões de movimento, anel de impacto e tabela,
 * com o mesmo padrão da seção Forecast. Sem botões de ação.
 */

export type NewNameSectionProps = {
  orders: ImportedRecord[]
  opportunities?: ImportedRecord[] | null
  previousOrders?: ImportedRecord[] | null
  previousOpportunities?: ImportedRecord[] | null
  referenceDate: string
  initialPeriod?: NewNamePeriod
  statusMapping?: Record<string, OrderSubstatus> | ((status: string) => OrderSubstatus)
}

const CARTOES: ReadonlyArray<{ key: MovementLabel; labels: MovementLabel[] }> = [
  { key: 'Entrou', labels: ['Entrou'] },
  { key: 'Saiu', labels: ['Saiu'] },
  { key: 'Ganhou', labels: ['Ganhou'] },
  { key: 'Perdeu', labels: ['Perdeu'] },
]

const plural = (quantidade: number, singular: string, pluralForma: string) => `${quantidade} ${quantidade === 1 ? singular : pluralForma}`

export function NewNameSection({
  orders,
  opportunities = null,
  previousOrders = null,
  previousOpportunities = null,
  referenceDate,
  initialPeriod = 'mês',
  statusMapping,
}: NewNameSectionProps) {
  const [period, setPeriod] = useState<NewNamePeriod>(initialPeriod)
  const [selecionado, setSelecionado] = useState<MovementLabel | null>(null)

  const model = useMemo(
    () => calculateNewNameModel({ orders, opportunities, previousOrders, previousOpportunities, referenceDate, period, statusMapping }),
    [orders, opportunities, previousOrders, previousOpportunities, referenceDate, period, statusMapping],
  )
  const rows = useMemo(() => newNameMovementRows(model, orders), [model, orders])
  const grupos = useMemo(() => groupMovements(rows, CARTOES), [rows])
  const linhas = selecionado ? rows.filter(row => row.movement === selecionado) : rows

  const { indicators, movements } = model
  const disponivel: Record<string, boolean> = { Entrou: movements.entered !== null, Saiu: movements.exited !== null, Ganhou: true, Perdeu: true }
  const grupo = (key: MovementLabel) => grupos.find(item => item.key === key)!
  const saldo = grupos.some(item => item.value === null) ? null : grupos.reduce((soma, item) => soma + (item.value ?? 0), 0)
  const anel: RingGroup[] = CARTOES.map(({ key }) => ({ rotulo: key, movimento: key, valor: grupo(key).value, peso: grupo(key).weight }))
  const notas: Record<string, string> = {
    Entrou: 'Pedidos novos vs. carga anterior',
    Saiu: 'Deixaram a carteira de pedidos',
    Ganhou: 'Pedidos novos no período',
    Perdeu: 'Oportunidades NN perdidas',
  }

  return (
    <PanelSection
      id="new-name"
      titulo="New Name"
      contexto={`Contas novas e pedidos do período ${period === 'semana' ? 'da semana' : 'do mês'}.`}
      acao={
        <SeletorPeriodo
          rotulo="Período do New Name"
          valor={period}
          opcoes={[{ valor: 'semana', texto: 'Semana' }, { valor: 'mês', texto: 'Mês' }]}
          onChange={valor => { setPeriod(valor as NewNamePeriod); setSelecionado(null) }}
        />
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          rotulo="Contas novas"
          valor={String(indicators.newAccounts)}
          nota={indicators.newAccounts === 0 && model.unclassifiedOrders > 0
            ? `${plural(model.unclassifiedOrders, 'pedido', 'pedidos')} sem classificação`
            : `${plural(indicators.orders, 'pedido', 'pedidos')} no período`}
          tom="marca"
        />
        <MetricCard
          rotulo="MRR informado"
          valor={formatarRealCompacto(indicators.maintenanceTotal)}
          nota={indicators.maintenanceTotal === null ? 'Há pedidos sem valor' : 'Soma dos pedidos do período'}
          tom="info"
        />
        <MetricCard
          rotulo="Realizado conferido"
          valor={formatarRealCompacto(indicators.realizedValue)}
          nota={`${plural(indicators.realizedCount, 'pedido', 'pedidos')} · ${plural(indicators.realizedAccounts, 'conta', 'contas')}`}
          tom="positivo"
        />
        <MetricCard
          rotulo="Ganhou"
          valor={formatarRealCompacto(grupo('Ganhou').value)}
          nota={plural(grupo('Ganhou').count, 'pedido novo', 'pedidos novos')}
          tom="positivo"
        />
      </div>

      {indicators.toValidateCount > 0 && (
        <p className="rounded-[12px] bg-dado-atencao-suave px-4 py-3 text-[12.5px] leading-5 text-dado-atencao">
          Classificação “Novo” a validar com a Fabi: {plural(indicators.toValidateCount, 'pedido', 'pedidos')} ({formatarRealCompacto(indicators.toValidateValue)}) ficam fora dos indicadores.
        </p>
      )}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-4">
          {CARTOES.map(({ key }) => (
            <MovementCard
              key={key}
              movimento={key}
              valor={grupo(key).value}
              contagem={plural(grupo(key).count, key === 'Entrou' || key === 'Saiu' ? 'conta' : 'pedido', key === 'Entrou' || key === 'Saiu' ? 'contas' : 'pedidos')}
              nota={notas[key]}
              disponivel={disponivel[key]}
              selecionado={selecionado === key}
              onSelecionar={() => setSelecionado(atual => atual === key ? null : key)}
            />
          ))}
        </div>
        <ImpactRing titulo="Impacto no New Name" legenda="Peso de cada movimento; o centro traz o saldo líquido." grupos={anel} saldo={saldo} />
      </div>

      <Panel
        titulo={selecionado ? `${selecionado} · ${plural(linhas.length, 'registro', 'registros')}` : 'Principais movimentos do período'}
        subtitulo="Maior impacto primeiro. Δ valor é o efeito no período."
        acao={selecionado && (
          <button type="button" onClick={() => setSelecionado(null)} className="rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave">
            Mostrar todos
          </button>
        )}
      >
        <MovementTable
          linhas={linhas}
          legenda=""
          vazio="Nenhum registro neste recorte. A comparação depende da carga anterior."
        />
      </Panel>

      <p className="px-1 text-[11.5px] leading-5 text-ink-muted">
        Classificação “Novo” provisória, a validar com a Fabi. Realizado oficial só com pedido conferido.
      </p>
    </PanelSection>
  )
}
