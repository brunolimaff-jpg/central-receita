'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, FileCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CasoDecisao, CasosDTO } from '@/lib/domain/types'
import { fmtBRL, fmtInt } from '@/lib/domain/format'
import { cn } from '@/lib/utils'
import { rotuloEtapaTaxonomia } from '@/lib/domain/types'
import { ErroApi } from './primitivas'
import type { IrPara } from './navegacao'
import { useApi } from './use-api'

type EstadoFila = CasoDecisao['estado']
const ESTADOS: Array<{ id: EstadoFila; titulo: string; resumo: string }> = [
  { id: 'aguardando revisão', titulo: 'Precisa revisão', resumo: 'Sem ação recente registrada' },
  { id: 'em análise', titulo: 'Em análise', resumo: 'Ação registrada nos últimos 7 dias' },
  { id: 'acompanhamento', titulo: 'Acompanhamento', resumo: 'Há compromisso futuro na agenda' },
]

export function Casos({ irPara, foco }: { irPara: IrPara; foco?: string | null }) {
  const leitura = useApi<CasosDTO>('/api/casos')
  const [estado, setEstado] = useState<EstadoFila>('aguardando revisão')
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [focoAtivo, setFocoAtivo] = useState(Boolean(foco))
  const casos = leitura.dados?.casos ?? []
  const casosDoEstado = useMemo(
    () => casos.filter((caso) => focoAtivo && foco ? caso.sinal_codigo === foco : caso.estado === estado),
    [casos, estado, foco, focoAtivo],
  )
  const ativo = casosDoEstado.find((caso) => caso.caso_id === selecionado) ?? casosDoEstado[0] ?? null

  if (leitura.carregando && !leitura.dados) return <Skeleton className="h-[620px] w-full rounded-2xl" />
  if (leitura.erro || !leitura.dados) return <ErroApi erro={leitura.erro ?? 'Fila de decisões indisponível'} aoTentar={leitura.recarregar} />

  const totalImpacto = leitura.dados.resumo.impacto_total
  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[var(--senior-emerald-hover)]">Comando <span className="mx-1.5 text-border">/</span> carga decisória</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] md:text-[36px]">Decisões abertas</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">Casos organizados pelo próximo tipo de atenção. Escolha um registro, revise a evidência e abra a Oportunidade.</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-4 py-3">
          <p className="text-[12px] font-medium text-muted-foreground">Impacto sob decisão</p>
          <p className="num mt-0.5 text-[22px] font-semibold">{fmtBRL(totalImpacto)}</p>
          <p className="text-[12px] text-muted-foreground">{fmtInt(leitura.dados.resumo.total)} casos derivados de sinais</p>
        </div>
      </header>

      {focoAtivo && foco ? <p className="rounded-lg border border-[var(--senior-emerald)]/25 bg-[var(--senior-emerald-soft)]/55 px-3 py-2.5 text-[13px] text-foreground">Você chegou aqui pelo sinal <strong>{nomeSinal(foco)}</strong>. A população está filtrada para esse foco. <button type="button" onClick={() => setFocoAtivo(false)} className="ml-1 font-medium text-[var(--senior-emerald-hover)] underline underline-offset-2">Ver todos</button></p> : null}

      <div className="grid min-h-[500px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)_minmax(260px,330px)]">
        <nav aria-label="Estados da fila de decisões" className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
          {ESTADOS.map((item) => {
            const quantidade = casos.filter((caso) => caso.estado === item.id && (!focoAtivo || !foco || caso.sinal_codigo === foco)).length
            const ativoEstado = estado === item.id
            return (
              <button key={item.id} type="button" aria-current={ativoEstado && !focoAtivo ? 'page' : undefined} onClick={() => { setEstado(item.id); setSelecionado(null); setFocoAtivo(false) }} className={cn('min-w-[190px] rounded-xl border px-3.5 py-3 text-left transition-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-w-0', ativoEstado && !focoAtivo ? 'border-[var(--senior-emerald)]/40 bg-[var(--senior-emerald-soft)]/65 shadow-[inset_0_1px_0_rgb(255_255_255/95%)]' : 'border-transparent bg-transparent hover:border-border hover:bg-white')}>
                <span className="flex items-center justify-between gap-2"><span className="text-[14px] font-semibold">{item.titulo}</span><span className={cn('num text-[13px] font-semibold', ativoEstado ? 'text-[var(--senior-emerald-hover)]' : 'text-muted-foreground')}>{fmtInt(quantidade)}</span></span>
                <span className="mt-1 block text-[12px] text-muted-foreground">{item.resumo}</span>
              </button>
            )
          })}
          <p className="mt-3 hidden rounded-lg bg-white/70 px-3 py-3 text-[12px] leading-relaxed text-muted-foreground lg:block">O estado da fila é calculado para esta leitura. Não grava workflow nem altera o CRM.</p>
        </nav>

        <section aria-labelledby="lista-casos" className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="lista-casos" className="text-[17px] font-semibold">{ESTADOS.find((item) => item.id === estado)?.titulo}</h2>
            <span className="text-[12px] text-muted-foreground">{fmtInt(casosDoEstado.length)} casos</span>
          </div>
          {casosDoEstado.length ? (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
              {casosDoEstado.slice(0, 18).map((caso) => (
                <button key={caso.caso_id} type="button" onClick={() => setSelecionado(caso.caso_id)} aria-current={ativo?.caso_id === caso.caso_id ? 'true' : undefined} className={cn('w-full px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', ativo?.caso_id === caso.caso_id ? 'bg-[var(--senior-emerald-soft)]/55' : 'hover:bg-muted/45')}>
                  <span className="flex items-center justify-between gap-3"><span className="truncate text-[15px] font-semibold">{caso.oportunidade_nome}</span><span className="num shrink-0 text-[14px] font-semibold">{fmtBRL(caso.impacto)}</span></span>
                  <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{caso.conta_fantasia} · {caso.sinal_nome}</span>
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground"><span>{caso.contexto}</span><span>{caso.evidencia.ultima_acao ? `Última ação: ${caso.evidencia.ultima_acao}` : 'Sem ação registrada'}</span></span>
                </button>
              ))}
            </div>
          ) : <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center"><p className="text-[15px] font-semibold">Nenhum caso neste estado</p><p className="mt-1 text-[14px] text-muted-foreground">A fila se atualiza conforme as evidências do snapshot.</p></div>}
          {casosDoEstado.length > 18 ? <p className="mt-2 text-[12px] text-muted-foreground">Mostrando os 18 casos de maior prioridade nesta leitura.</p> : null}
        </section>

        <aside aria-label="Contexto do caso selecionado" className="h-fit rounded-2xl border border-white/70 bg-[var(--surface-glass)] p-4 shadow-[0_12px_36px_rgb(22_46_39/8%)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--surface-glass)]">
          {ativo ? <ResumoCaso caso={ativo} irPara={irPara} /> : <p className="text-[14px] text-muted-foreground">Selecione um caso para ver a decisão e a evidência registrada.</p>}
        </aside>
      </div>
    </div>
  )
}

function ResumoCaso({ caso, irPara }: { caso: CasoDecisao; irPara: IrPara }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-[var(--senior-emerald-hover)]">CASO · {caso.sinal_nome}</p>
      <h2 className="mt-2 text-[19px] font-semibold leading-snug">{caso.oportunidade_nome}</h2>
      <p className="mt-1 text-[14px] text-muted-foreground">{caso.conta_fantasia} · Etapa {rotuloEtapaTaxonomia(caso.etapa_taxonomia)}</p>
      <p className="num mt-4 text-[27px] font-semibold tracking-[-0.03em]">{fmtBRL(caso.impacto)}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{caso.contexto}</p>

      <div className="my-4 border-t border-border/80" />
      <div className="flex flex-col gap-3 text-[13px]">
        <p className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /><span><strong className="font-medium">Última ação</strong><br />{caso.evidencia.ultima_acao ?? 'Nenhuma ação registrada'}</span></p>
        <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /><span><strong className="font-medium">Próximo compromisso</strong><br />{caso.evidencia.compromisso_futuro ?? 'Nenhum compromisso futuro registrado'}</span></p>
        <p className="flex items-start gap-2"><FileCheck2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /><span><strong className="font-medium">Proposta válida</strong><br />{caso.evidencia.proposta_valida ? 'Registrada' : 'Não comprovada neste snapshot'}</span></p>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--attention-amber)]/20 bg-[var(--attention-amber-soft)]/55 p-3.5">
        <p className="text-[12px] font-semibold text-[var(--attention-amber)]">Decisão em aberto</p>
        <p className="mt-1 text-[14px] font-medium leading-relaxed">{caso.decisao_pendente}</p>
      </div>
      <Button onClick={() => irPara('detalhe', caso.oportunidade_id, { de: 'casos', foco: caso.sinal_codigo })} className="mt-4 w-full rounded-xl">Revisar caso <ArrowRight data-icon="inline-end" aria-hidden /></Button>
      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">O sinal descreve os registros do mock; não afirma ausência de trabalho nem decide pelo responsável.</p>
    </div>
  )
}

function nomeSinal(codigo: string) {
  const nomes: Record<string, string> = { R1: 'previsão vencida', R2: 'dias sem ação registrada', R3: 'previsão deslocada', R4: 'etapa sem compromisso futuro', R5: 'Win sem Pedido', R6: 'Pedido não conferido', R7: 'probabilidade e previsão' }
  return nomes[codigo] ?? codigo
}
