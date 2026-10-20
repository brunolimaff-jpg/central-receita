'use client'

import { useState } from 'react'
import { ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtBRL, fmtDataCurta, fmtInt, rotuloAtualizacaoSnapshot } from '@/lib/domain/format'
import { rotuloEtapaTaxonomia } from '@/lib/domain/types'
import type { MudancasDTO, VisaoDTO } from '@/lib/domain/types'
import { cn } from '@/lib/utils'
import { ProvenienciaInline } from './proveniencia-inline'
import { ErroApi } from './primitivas'
import type { IrPara } from './navegacao'
import { useApi } from './use-api'

const PROVENIENCIA_PIPELINE = {
  fonte: 'CRM sintético local',
  populacao: 'Oportunidades abertas no recorte global selecionado.',
  regra: 'Pipeline aberto = soma do valor previsto das Oportunidades em andamento.',
  limitacao: 'Fixture local sintético; não comprova sincronização com CRM online.',
  versao: 'Mock v1.1.0',
}

const PROVENIENCIA_PEX = {
  fonte: 'CRM_Integrado_Senior_MG_telas.pdf · páginas 5 e 38',
  atualizacao: 'Regra documental; valores do fixture local sintético.',
  populacao: 'Abertas elegíveis na competência, mais Fechadas e Ganhas no mês.',
  regra: 'Privado: Proposta/Negociação; público: Proposta/Negociação/Habilitação/Certame; probabilidade ≥75% e previsão no mês.',
  limitacao: 'PEX é forecast/realizado comercial do mês e não substitui Pedido conferido como receita oficial. Valor fechado ausente não é substituído pelo valor previsto.',
  versao: 'CRM Integrado Senior MG',
}

const PROVENIENCIA_PROJECAO = {
  fonte: 'CRM sintético local',
  populacao: 'Oportunidades abertas com previsão no horizonte selecionado.',
  regra: 'Soma do valor previsto; janela móvel de 30, 60 ou 90 dias; sem ponderação por probabilidade.',
  limitacao: 'Métrica do fixture local; não é a régua PEX mensal.',
  versao: 'Mock v1.1.0',
}

export function Visao({ irPara }: { irPara: IrPara }) {
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState<string | null>(null)
  const endpointVisao = competenciaSelecionada
    ? (() => {
        const [ano, mes] = competenciaSelecionada.split('-').map(Number)
        return `/api/visao?ano=${ano}&mes=${mes}`
      })()
    : '/api/visao'
  const leitura = useApi<VisaoDTO>(endpointVisao)
  const mudancas = useApi<MudancasDTO>('/api/mudancas')

  if (leitura.carregando && !leitura.dados) return <Skeleton className="h-[620px] w-full rounded-2xl" />
  if (leitura.erro || !leitura.dados) return <ErroApi erro={leitura.erro ?? 'Pipeline indisponível'} aoTentar={leitura.recarregar} />

  const dados = leitura.dados
  const pipeline = dados.indicadores.find((item) => item.rotulo === 'Pipeline aberto')
  const projecao = dados.indicadores.find((item) => item.rotulo.startsWith('Projeção móvel'))
  const pex = dados.forecast_pex
  const provenienciaSnapshot = rotuloAtualizacaoSnapshot(dados.snapshot_em)
  const provenienciaPipeline = { ...PROVENIENCIA_PIPELINE, atualizacao: provenienciaSnapshot }
  const provenienciaProjecao = { ...PROVENIENCIA_PROJECAO, atualizacao: provenienciaSnapshot }
  const competencia = `${pex.competencia.ano}-${String(pex.competencia.mes).padStart(2, '0')}`
  const maximoEtapa = Math.max(...dados.funil.map((item) => item.valor), 1)

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[var(--senior-emerald-hover)]">Leitura <span className="mx-1.5 text-border">/</span> snapshot {fmtDataCurta(dados.snapshot_em)}</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] md:text-[36px]">Pipeline e Forecast</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">Pipeline aberto, régua PEX do mês selecionado e projeção móvel em leituras separadas.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Competência PEX
            <input type="month" value={competenciaSelecionada ?? competencia} onChange={(evento) => setCompetenciaSelecionada(evento.target.value || null)} className="h-10 rounded-xl border border-border bg-white px-3 text-[14px] font-medium text-foreground" />
          </label>
          <Button variant="outline" onClick={() => irPara('oportunidades', undefined, { de: 'visao' })} className="rounded-xl bg-white">Abrir Oportunidades <ArrowRight data-icon="inline-end" aria-hidden /></Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Resumo estrutural">
        <article className="rounded-2xl border border-border bg-white p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[13px] font-medium text-muted-foreground">Pipeline aberto</p><p className="num mt-1 text-[34px] font-semibold tracking-[-0.04em] md:text-[40px]">{pipeline?.valor ?? '—'}</p><p className="mt-1 text-[14px] text-muted-foreground">{pipeline?.contexto ?? 'Valor previsto das Oportunidades abertas'}</p></div>
            <ProvenienciaInline dados={provenienciaPipeline} rotulo="Fonte e definição do Pipeline" />
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-[14px]">
            <span>Desde a última leitura <strong className={cn('num ml-1 font-semibold', (mudancas.dados?.pipeline.delta ?? 0) < 0 ? 'text-[var(--critical-red)]' : 'text-[var(--success-green)]')}>{mudancas.dados ? `${mudancas.dados.pipeline.delta < 0 ? '−' : '+'}${fmtBRL(Math.abs(mudancas.dados.pipeline.delta))}` : '—'}</strong></span>
            <span className="text-muted-foreground">{mudancas.dados ? `${fmtInt(mudancas.dados.resumo.entradas)} entraram · ${fmtInt(mudancas.dados.resumo.saidas_ganhas + mudancas.dados.resumo.saidas_perdidas)} saíram` : 'Movimento indisponível'}</span>
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--senior-emerald)]/20 bg-[var(--senior-emerald-soft)]/40 p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[13px] font-medium text-muted-foreground">Forecast do mês · PEX</p><p className="num mt-1 text-[29px] font-semibold tracking-[-0.035em]">{fmtBRL(pex.total_pex_mes.valor)}</p><p className="mt-1 text-[13px] text-muted-foreground">{fmtInt(pex.total_pex_mes.quantidade)} oportunidades · competência {pex.competencia.mes}/{pex.competencia.ano}</p></div>
            <ProvenienciaInline dados={PROVENIENCIA_PEX} rotulo="Fonte e regra do Forecast PEX" />
          </div>
          <div className="mt-4 space-y-1 border-t border-[var(--senior-emerald)]/15 pt-3 text-[12px] text-muted-foreground">
            <p>Previsto elegível: {fmtInt(pex.previsto_pex.quantidade)} · {fmtBRL(pex.previsto_pex.valor)}</p>
            <p>Fechadas e Ganhas no mês: {fmtInt(pex.fechadas_ganhas_no_mes.quantidade)} · {fmtBRL(pex.fechadas_ganhas_no_mes.valor)}</p>
            {pex.total_pex_mes.quantidade_sem_valor > 0 ? <p className="font-medium text-[var(--attention-amber)]">{fmtInt(pex.total_pex_mes.quantidade_sem_valor)} sem valor registrado; valor previsto não foi usado como substituto.</p> : null}
            <p>Probabilidade ≥75% · previsão dentro do mês.</p>
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-white p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[13px] font-medium text-muted-foreground">{projecao?.rotulo ?? 'Projeção móvel'}</p><p className="num mt-1 text-[29px] font-semibold tracking-[-0.035em]">{projecao?.valor ?? '—'}</p><p className="mt-1 text-[13px] text-muted-foreground">{projecao?.contexto ?? 'Oportunidades abertas no horizonte selecionado'}</p></div>
            <ProvenienciaInline dados={provenienciaProjecao} rotulo="Fonte e definição da projeção móvel" />
          </div>
          <p className="mt-5 border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground">Janela móvel selecionada no contexto global; não aplica probabilidade e não usa a competência PEX.</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div>
          <div className="mb-3"><h2 className="text-[19px] font-semibold">Composição por etapa e funil</h2><p className="mt-1 text-[13px] text-muted-foreground">Cada combinação preserva modalidade, estado do mapeamento e fonte.</p></div>
          <div className="divide-y divide-border border-y border-border bg-white">
            {dados.funil.map((item) => <LinhaEtapa key={`${item.etapa_taxonomia.tipo_funil}:${item.etapa}`} nome={`${rotuloEtapaTaxonomia(item.etapa_taxonomia)} · funil ${item.etapa_taxonomia.tipo_funil}`} quantidade={item.quantidade} valor={item.valor} maximo={maximoEtapa} desconhecida={item.etapa_taxonomia.estado_mapeamento !== 'observado'} />)}
            {dados.funil.length === 0 ? <p className="px-3 py-4 text-[13px] text-muted-foreground">Sem Oportunidades abertas no recorte.</p> : null}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />SQL, Originação e fases sem par exato no PDF aparecem como não mapeadas, com sua fonte preservada.</p>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-3"><h2 className="text-[19px] font-semibold">Concentração por Conta</h2><p className="mt-1 text-[13px] text-muted-foreground">Contas com maior valor previsto em Oportunidades abertas.</p></div>
            <div className="divide-y divide-border border-y border-border bg-white">
              {dados.topContas.slice(0, 5).map((conta, index) => <div key={conta.conta_id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3"><span className="num text-[12px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0"><span className="block truncate text-[14px] font-medium">{conta.fantasia}</span><span className="mt-0.5 block text-[12px] text-muted-foreground">{fmtInt(conta.quantidade)} Oportunidades · {conta.segmento} <span className="ml-1">(fixture)</span></span></span><span className="num text-[14px] font-semibold">{fmtBRL(conta.valor)}</span></div>)}
            </div>
          </div>
          <div>
            <div className="mb-3"><h2 className="text-[19px] font-semibold">Origem registrada</h2><p className="mt-1 text-[13px] text-muted-foreground">Valores ilustrativos do fixture; sem validação como catálogo corporativo.</p></div>
            <div className="divide-y divide-border border-y border-border bg-white">
              {dados.origens.slice(0, 4).map((origem) => <div key={origem.origem} className="flex items-center justify-between gap-3 px-3 py-2.5"><span className="text-[13px] text-foreground">{origem.origem}</span><span className="num text-[13px] text-muted-foreground">{fmtInt(origem.quantidade)} · {fmtBRL(origem.valor)}</span></div>)}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function LinhaEtapa({ nome, quantidade, valor, maximo, desconhecida = false }: { nome: string; quantidade: number; valor: number; maximo: number; desconhecida?: boolean }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-3 py-3"><div className="min-w-0"><p className={cn('text-[14px] font-medium', desconhecida && 'text-muted-foreground')}>{nome}</p><p className="mt-0.5 text-[12px] text-muted-foreground">{fmtInt(quantidade)} Oportunidades</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', desconhecida ? 'bg-slate-400' : 'bg-[var(--senior-emerald)]')} style={{ width: `${maximo ? Math.max(2, (valor / maximo) * 100) : 0}%` }} /></div></div><p className="num self-center text-[14px] font-semibold">{fmtBRL(valor)}</p></div>
}
