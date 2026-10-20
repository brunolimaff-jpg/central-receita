'use client'

import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtBRL, fmtDataCurta, fmtInt } from '@/lib/domain/format'
import type { MudancaConcentrada, MudancasDTO } from '@/lib/domain/types'
import { cn } from '@/lib/utils'
import { ProvenienciaInline } from './proveniencia-inline'
import { ErroApi } from './primitivas'
import type { IrPara } from './navegacao'
import { useApi } from './use-api'

const PROVENIENCIA_MOVIMENTO = {
  fonte: 'CRM sintético local',
  atualizacao: 'Snapshot 22 set 2026 · 12:58',
  populacao: 'Oportunidades abertas com previsão na janela escolhida em cada referência.',
  regra: 'Contribuição = valor previsto atual na janela menos valor previsto anterior na janela.',
  limitacao: 'Não aplica probabilidade. O movimento mede presença na janela e valor previsto; não atribui causa comercial.',
  versao: 'Mock v1.1.0',
}

export function Mudancas({ irPara }: { irPara: IrPara }) {
  const leitura = useApi<MudancasDTO>('/api/mudancas')
  if (leitura.carregando && !leitura.dados) return <Skeleton className="h-[620px] w-full rounded-2xl" />
  if (leitura.erro || !leitura.dados) return <ErroApi erro={leitura.erro ?? 'Leitura de mudanças indisponível'} aoTentar={leitura.recarregar} />

  const dados = leitura.dados
  const periodo = dados.forecast_periodo
  const caiu = periodo.delta < 0
  const headline = periodo.delta === 0
    ? `Projeção móvel dos próximos ${periodo.dias} dias ficou estável`
    : `Projeção móvel dos próximos ${periodo.dias} dias ${caiu ? 'caiu' : 'cresceu'} ${fmtBRL(Math.abs(periodo.delta))}`

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[var(--senior-emerald-hover)]">Mudanças <span className="mx-1.5 text-border">/</span> {fmtDataCurta(dados.anterior_em)} <span aria-hidden>→</span> {fmtDataCurta(dados.atual_em)}</p>
          <h1 className="mt-1 max-w-4xl text-[30px] font-semibold leading-tight tracking-[-0.04em] md:text-[36px]">{headline}</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">A população explica a variação entre as duas referências; abra qualquer contribuição para revisar o caso.</p>
        </div>
        <Button variant="outline" onClick={() => irPara('casos', undefined, { de: 'mudancas' })} className="rounded-xl bg-white">Decisões relacionadas <ArrowRight data-icon="inline-end" aria-hidden /></Button>
      </header>

      <Ribbon dados={dados} />

      <section aria-labelledby="contribuicoes-heading" className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-muted-foreground">Contribuição por Oportunidade</p>
              <h2 id="contribuicoes-heading" className="mt-0.5 text-[21px] font-semibold tracking-[-0.025em]">O que explica a variação</h2>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
              {periodo.concentracao.quantidade_explicam > 0 ? <span>{periodo.concentracao.quantidade_explicam} oportunidades · {periodo.concentracao.pct_explicada}% do movimento absoluto</span> : <span>Sem contribuição material nesta janela</span>}
              <ProvenienciaInline dados={PROVENIENCIA_MOVIMENTO} rotulo="Fonte e regra da contribuição da projeção móvel" />
            </div>
          </div>

          {periodo.concentracao.itens.length ? (
            <div className="divide-y divide-border border-y border-border bg-white">
              {periodo.concentracao.itens.map((item, index) => (
                <LinhaContribuicao
                  key={item.oportunidade_id}
                  item={item}
                  maximo={Math.max(...periodo.concentracao.itens.map((entry) => Math.abs(entry.contribuicao)))}
                  indice={index + 1}
                  irPara={irPara}
                />
              ))}
            </div>
          ) : <p className="rounded-xl border border-border bg-white p-5 text-[14px] text-muted-foreground">Nenhuma oportunidade entrou, saiu ou mudou de valor dentro do horizonte selecionado.</p>}
          <p className="mt-3 max-w-4xl text-[13px] leading-relaxed text-muted-foreground">O valor previsto entra inteiro quando a previsão está dentro do horizonte. A leitura não pondera por probabilidade e não conclui por que a data ou o valor mudou.</p>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-5" aria-label="Leituras paralelas">
          <p className="text-[13px] font-semibold text-foreground">Leituras paralelas</p>
          <LinhaResumo rotulo="Pipeline aberto" anterior={dados.pipeline.anterior} atual={dados.pipeline.atual} delta={dados.pipeline.delta} />
          <div className="my-4 border-t border-border" />
          <p className="text-[13px] leading-relaxed text-muted-foreground">Pipeline e projeção móvel respondem perguntas diferentes. Deslocamentos alteram a janela da projeção móvel sem alterar o valor aberto do Pipeline.</p>
          <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => irPara('visao', undefined, { de: 'mudancas' })}>Ler Pipeline <ArrowRight data-icon="inline-end" aria-hidden /></Button>
        </aside>
      </section>

      <details className="group rounded-xl border border-border bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Ver população e definições da comparação
          <span className="text-[13px] font-normal text-muted-foreground">Entradas, saídas, deslocamentos e avanços</span>
        </summary>
        <div className="grid gap-5 border-t border-border px-4 py-4 md:grid-cols-2">
          <BlocoDefinicao titulo="Entradas e saídas">
            <p>{fmtInt(dados.resumo.entradas)} Oportunidades entraram depois da referência; {fmtInt(dados.resumo.saidas_ganhas)} saíram como Win e {fmtInt(dados.resumo.saidas_perdidas)} como Loss.</p>
          </BlocoDefinicao>
          <BlocoDefinicao titulo="Reforecast e etapa">
            <p>{fmtInt(dados.resumo.deslocamentos)} previsões mudaram de data e {fmtInt(dados.resumo.avancos)} Oportunidades avançaram de etapa.</p>
          </BlocoDefinicao>
          <BlocoDefinicao titulo="Comparação">
            <p>Snapshot atual comparado ao estado anterior sintético gerado pelo seed. A referência anterior está em {fmtDataCurta(dados.anterior_em)}.</p>
          </BlocoDefinicao>
          <BlocoDefinicao titulo="Limitação">
            <p>Alterações de previsão não mostram, por si, motivo, confirmação do cliente ou atividade fora do CRM.</p>
          </BlocoDefinicao>
        </div>
      </details>
    </div>
  )
}

function Ribbon({ dados }: { dados: MudancasDTO }) {
  const saidas = dados.resumo.saidas_ganhas_valor + dados.resumo.saidas_perdidas_valor
  const items = [
    { nome: 'Entraram', quantidade: `+${fmtInt(dados.resumo.entradas)}`, valor: fmtBRL(dados.resumo.entradas_valor), tom: 'text-[var(--success-green)]' },
    { nome: 'Saíram', quantidade: `−${fmtInt(dados.resumo.saidas_ganhas + dados.resumo.saidas_perdidas)}`, valor: fmtBRL(saidas), tom: 'text-[var(--critical-red)]' },
    { nome: 'Reforecast', quantidade: fmtInt(dados.resumo.deslocamentos), valor: `${fmtBRL(dados.resumo.deslocamentos_valor)} movimentados`, tom: 'text-foreground' },
    { nome: 'Avançaram', quantidade: fmtInt(dados.resumo.avancos), valor: 'mudança de etapa', tom: 'text-foreground' },
    { nome: 'Win', quantidade: fmtInt(dados.resumo.saidas_ganhas), valor: fmtBRL(dados.resumo.saidas_ganhas_valor), tom: 'text-[var(--success-green)]' },
    { nome: 'Loss', quantidade: fmtInt(dados.resumo.saidas_perdidas), valor: fmtBRL(dados.resumo.saidas_perdidas_valor), tom: 'text-[var(--critical-red)]' },
  ]
  return <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-white sm:grid-cols-3 sm:divide-y-0 xl:grid-cols-6">{items.map((item) => <div key={item.nome} className="min-w-0 px-4 py-3.5"><p className="text-[12px] font-medium text-muted-foreground">{item.nome}</p><p className={cn('num mt-1 text-[20px] font-semibold', item.tom)}>{item.quantidade}</p><p className="mt-0.5 truncate text-[12px] text-muted-foreground">{item.valor}</p></div>)}</div>
}

function LinhaContribuicao({ item, maximo, indice, irPara }: { item: MudancaConcentrada; maximo: number; indice: number; irPara: IrPara }) {
  const pct = maximo > 0 ? Math.max(3, Math.round((Math.abs(item.contribuicao) / maximo) * 100)) : 0
  const reduziu = item.contribuicao < 0
  return (
    <button type="button" onClick={() => irPara('detalhe', item.oportunidade_id, { de: 'mudancas', foco: 'forecast' })} className="grid w-full grid-cols-[30px_minmax(0,1fr)_minmax(100px,180px)_auto] items-center gap-3 px-3 py-3.5 text-left transition-colors hover:bg-[var(--senior-emerald-soft)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-4 md:px-4">
      <span className="num text-[12px] font-medium text-muted-foreground">{String(indice).padStart(2, '0')}</span>
      <span className="min-w-0"><span className="block truncate text-[14px] font-semibold text-foreground">{item.nome}</span><span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{item.conta_fantasia} · {item.detalhe}</span></span>
      <span className="relative hidden h-2 overflow-hidden rounded-full bg-muted sm:block" aria-hidden="true"><span className={cn('absolute inset-y-0 rounded-full', reduziu ? 'right-1/2 bg-[var(--critical-red)]' : 'left-1/2 bg-[var(--success-green)]')} style={{ width: `${pct / 2}%` }} /></span>
      <span className={cn('num flex min-w-[110px] items-center justify-end gap-1 text-[14px] font-semibold', reduziu ? 'text-[var(--critical-red)]' : 'text-[var(--success-green)]')}>
        {reduziu ? <ArrowDownRight data-icon="inline-start" aria-hidden /> : <ArrowUpRight data-icon="inline-start" aria-hidden />}
        {reduziu ? '−' : '+'}{fmtBRL(Math.abs(item.contribuicao))}
      </span>
    </button>
  )
}

function LinhaResumo({ rotulo, anterior, atual, delta }: { rotulo: string; anterior: number; atual: number; delta: number }) {
  return <div className="mt-3"><p className="text-[13px] text-muted-foreground">{rotulo}</p><p className="num mt-1 text-[20px] font-semibold text-foreground">{fmtBRL(atual)}</p><p className="mt-1 text-[13px] text-muted-foreground">Antes {fmtBRL(anterior)} · <span className={delta < 0 ? 'text-[var(--critical-red)]' : 'text-[var(--success-green)]'}>{delta < 0 ? '−' : '+'}{fmtBRL(Math.abs(delta))}</span></p></div>
}

function BlocoDefinicao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <div><h3 className="text-[13px] font-semibold text-foreground">{titulo}</h3><div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{children}</div></div>
}
