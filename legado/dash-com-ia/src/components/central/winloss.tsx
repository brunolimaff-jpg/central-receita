'use client'

import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtBRL, fmtDataCurta, fmtInt, fmtPct } from '@/lib/domain/format'
import type { FechoDTO, WinLossDTO } from '@/lib/domain/types'
import { cn } from '@/lib/utils'
import { ErroApi } from './primitivas'
import { ProvenienciaInline } from './proveniencia-inline'
import type { IrPara } from './navegacao'
import { useApi } from './use-api'

const PROVENIENCIA_WINLOSS = {
  fonte: 'CRM sintético local',
  atualizacao: 'Snapshot 22 set 2026 · 12:58',
  populacao: 'Fechamentos com data dentro dos últimos 90 dias do snapshot.',
  regra: 'Taxa de ganho por valor = valor ganho ÷ (valor ganho + valor perdido).',
  limitacao: 'Não pondera por probabilidade. Win, Pedido e Pedido conferido são estados/eventos distintos.',
  versao: 'Mock v1.1.0',
}

export function WinLoss({ irPara }: { irPara: IrPara }) {
  const leitura = useApi<WinLossDTO>('/api/winloss')
  const [resultado, setResultado] = useState<'perdida' | 'ganha'>('perdida')
  const dados = leitura.dados

  if (leitura.carregando && !dados) return <Skeleton className="h-[620px] w-full rounded-2xl" />
  if (leitura.erro || !dados) return <ErroApi erro={leitura.erro ?? 'Win/Loss indisponível'} aoTentar={leitura.recarregar} />

  const totalFechado = dados.resumo.valor_ganhas + dados.resumo.valor_perdidas
  const winsSemPedido = dados.ganhas.filter((fecho) => !fecho.pedido)
  const winsComPedidoPendente = dados.ganhas.filter((fecho) => fecho.pedido && !fecho.pedido.conferido)
  const winsComPedidoConferido = dados.ganhas.filter((fecho) => fecho.pedido?.conferido)
  const semMotivo = [...dados.ganhas, ...dados.perdidas].filter((fecho) => !fecho.motivo)
  const casos = resultado === 'ganha' ? dados.ganhas : dados.perdidas
  const motivos = resultado === 'ganha' ? dados.motivos_ganho : dados.motivos_perda

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[var(--senior-emerald-hover)]">Aprendizado <span className="mx-1.5 text-border">/</span> últimos {dados.janela_dias} dias</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] md:text-[36px]">Win / Loss</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">O que estamos ganhando, o que estamos perdendo e quais registros pedem investigação.</p>
        </div>
        <ProvenienciaInline dados={PROVENIENCIA_WINLOSS} rotulo="Fonte e definição da leitura Win/Loss" />
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(290px,0.74fr)]" aria-label="Resultados no período">
        <div className="rounded-2xl border border-border bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[13px] font-medium text-muted-foreground">Fechamentos registrados</p><p className="num mt-1 text-[32px] font-semibold tracking-[-0.04em]">{fmtBRL(totalFechado)}</p><p className="mt-1 text-[13px] text-muted-foreground">{fmtInt(dados.resumo.ganhas)} Win · {fmtInt(dados.resumo.perdidas)} Loss · janela móvel de {dados.janela_dias} dias</p></div>
            <p className="rounded-lg bg-muted px-3 py-2 text-[13px] text-muted-foreground">Taxa de ganho por valor <strong className="num ml-1 text-[17px] text-foreground">{dados.resumo.taxa_ganho_valor === null ? '—' : fmtPct(dados.resumo.taxa_ganho_valor)}</strong></p>
          </div>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${fmtBRL(dados.resumo.valor_ganhas)} em Wins e ${fmtBRL(dados.resumo.valor_perdidas)} em Losses`}>
            <div className="h-full bg-[var(--success-green)]" style={{ width: `${totalFechado > 0 ? (dados.resumo.valor_ganhas / totalFechado) * 100 : 0}%` }} />
            <div className="h-full bg-[var(--critical-red)]" style={{ width: `${totalFechado > 0 ? (dados.resumo.valor_perdidas / totalFechado) * 100 : 0}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div><p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--success-green)]"><ArrowUpRight className="size-4" aria-hidden />Wins</p><p className="num mt-1 text-[21px] font-semibold">{fmtBRL(dados.resumo.valor_ganhas)}</p></div>
            <div><p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--critical-red)]"><ArrowDownRight className="size-4" aria-hidden />Losses</p><p className="num mt-1 text-[21px] font-semibold">{fmtBRL(dados.resumo.valor_perdidas)}</p></div>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-white p-5 md:p-6" aria-label="Estado posterior ao Win">
          <p className="text-[13px] font-semibold">Win e Pedido são leituras distintas</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">Pedido pode ser registrado depois do fechamento; conferência é outro estado.</p>
          <div className="mt-4 divide-y divide-border border-y border-border">
            <EstadoPedido titulo="Wins sem Pedido registrado" valor={fmtInt(winsSemPedido.length)} />
            <EstadoPedido titulo="Pedido em conferência" valor={fmtInt(winsComPedidoPendente.length)} />
            <EstadoPedido titulo="Pedido conferido" valor={fmtInt(winsComPedidoConferido.length)} />
          </div>
          {winsSemPedido.length > 0 ? <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground"><CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden />Win sem Pedido é um estado diferente. A ausência de vínculo no mock não classifica o fechamento como erro.</p> : null}
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div><h2 className="text-[19px] font-semibold">O que estamos {resultado === 'ganha' ? 'ganhando' : 'perdendo'}</h2><p className="mt-1 text-[13px] text-muted-foreground">Último movimento, ciclo e estado do Pedido em cada fechamento.</p></div>
            <ToggleGroup type="single" value={resultado} onValueChange={(valor) => { if (valor === 'ganha' || valor === 'perdida') setResultado(valor) }} aria-label="Alternar Wins e Losses" variant="outline" size="sm" className="rounded-lg bg-white">
              <ToggleGroupItem value="perdida" className="rounded-md px-3">Loss · {fmtInt(dados.perdidas.length)}</ToggleGroupItem>
              <ToggleGroupItem value="ganha" className="rounded-md px-3">Win · {fmtInt(dados.ganhas.length)}</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {casos.length ? <div className="divide-y divide-border border-y border-border bg-white">{casos.slice(0, 10).map((fecho) => <LinhaFechamento key={fecho.oportunidade_id} fecho={fecho} ganha={resultado === 'ganha'} irPara={irPara} />)}</div> : <p className="rounded-xl border border-dashed border-border bg-white p-6 text-[14px] text-muted-foreground">Nenhum fechamento nesta população do período.</p>}
        </div>

        <div>
          <div className="mb-3"><h2 className="text-[19px] font-semibold">Padrões registrados</h2><p className="mt-1 text-[13px] text-muted-foreground">Texto do motivo no fixture, agrupado por valor.</p></div>
          {motivos.length ? <div className="divide-y divide-border border-y border-border bg-white">{motivos.slice(0, 6).map((motivo, index) => <div key={motivo.motivo} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3"><span className="num text-[12px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0"><span className="block truncate text-[13px] font-medium">{motivo.motivo}</span><span className="mt-0.5 block text-[12px] text-muted-foreground">{fmtInt(motivo.quantidade)} registros</span></span><span className="num text-[13px] font-semibold">{fmtBRL(motivo.valor)}</span></div>)}</div> : <p className="rounded-xl border border-dashed border-border bg-white p-5 text-[14px] text-muted-foreground">Sem motivo registrado nesta população.</p>}
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{fmtInt(semMotivo.length)} fechamentos não têm motivo preenchido. O mock não contém taxonomia validada para classificar esses resultados.</p>
        </div>
      </section>

      <p className="border-t border-border pt-4 text-[12px] leading-relaxed text-muted-foreground">{fmtInt(dados.resumo.excluidas_datas_invalidas)} fechamentos com datas inválidas ficam fora das métricas de ciclo e taxa. A linha de base usa registros do fixture; motivos não explicam causalidade.</p>
    </div>
  )
}

function EstadoPedido({ titulo, valor }: { titulo: string; valor: string }) {
  return <div className="flex items-center justify-between gap-3 py-3"><p className="text-[13px] text-muted-foreground">{titulo}</p><p className="num text-[19px] font-semibold">{valor}</p></div>
}

function LinhaFechamento({ fecho, ganha, irPara }: { fecho: FechoDTO; ganha: boolean; irPara: IrPara }) {
  const estadoPedido = !fecho.pedido ? 'Sem Pedido registrado' : fecho.pedido.conferido ? 'Pedido conferido' : 'Em conferência'
  const tomPedido = !fecho.pedido ? 'text-muted-foreground' : fecho.pedido.conferido ? 'text-[var(--success-green)]' : 'text-[var(--attention-amber)]'
  return (
    <button type="button" onClick={() => irPara('detalhe', fecho.oportunidade_id, { de: 'winloss' })} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3.5 text-left transition-colors hover:bg-[var(--senior-emerald-soft)]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-4">
      <span className="min-w-0"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', ganha ? 'bg-[var(--success-green-soft)] text-[var(--success-green)]' : 'bg-[var(--critical-red-soft)] text-[var(--critical-red)]')}>{ganha ? 'Win' : 'Loss'}</span><span className="num text-[12px] text-muted-foreground">{fmtDataCurta(fecho.data_fechamento)}</span><span className="truncate text-[14px] font-semibold">{fecho.nome}</span></span><span className="mt-1 block truncate text-[13px] text-muted-foreground">{fecho.conta_fantasia} · {fecho.responsavel_nome}</span><span className="mt-1 block truncate text-[12px] text-muted-foreground">Último movimento: {fecho.ultima_acao_antes_fechamento ?? 'Não registrado'} · ciclo {fecho.ciclo_dias === null ? 'não comprovado' : `${fecho.ciclo_dias} dias`}</span></span>
      <span className="flex min-w-[132px] flex-col items-end justify-center gap-1"><span className="num text-[14px] font-semibold">{fmtBRL(fecho.valor_fechado)}</span><span className={cn('text-right text-[12px] font-medium', tomPedido)}>{estadoPedido}</span><ArrowRight className="size-4 text-muted-foreground" aria-hidden /></span>
    </button>
  )
}
