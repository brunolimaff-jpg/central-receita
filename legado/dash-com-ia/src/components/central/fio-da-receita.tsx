'use client'

import { ArrowRight } from 'lucide-react'
import type { FioReceitaNo } from '@/lib/domain/types'
import { fmtDataCurta } from '@/lib/domain/format'

export function FioDaReceita({ nos }: { nos: FioReceitaNo[] }) {
  return (
    <section id="fio-da-receita" aria-labelledby="fio-heading" className="rounded-2xl border border-border bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[13px] font-medium text-[var(--senior-emerald-hover)]">Relações entre objetos</p><h2 id="fio-heading" className="mt-0.5 text-[20px] font-semibold tracking-[-0.025em]">Fio da Receita</h2></div>
        <p className="max-w-xl text-[13px] leading-relaxed text-muted-foreground">Cada transição aparece apenas quando o vínculo está explícito no fixture. SQL, Conta, Oportunidade, Win e Pedido não são equivalentes.</p>
      </div>

      {nos.length ? (
        <>
          <ol className="mt-5 hidden items-stretch gap-1 overflow-x-auto pb-2 xl:flex" aria-label="Jornada de objetos desta oportunidade">
            {nos.map((no, index) => (
              <li key={`${no.objeto}-${no.id ?? no.data ?? index}`} className="flex min-w-[150px] flex-1 items-stretch gap-1">
                <article className="flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-[var(--surface-raised)] p-3.5">
                  <p className="text-[12px] font-semibold text-[var(--senior-emerald-hover)]">{no.objeto}</p>
                  <p className="mt-2 truncate text-[15px] font-semibold text-foreground">{no.estado}</p>
                  <p className="num mt-1 text-[12px] text-muted-foreground">{no.id ? `ID ${no.id}` : 'ID não aplicável'}</p>
                  {no.data ? <p className="num mt-0.5 text-[12px] text-muted-foreground">{fmtDataCurta(no.data)}</p> : null}
                  <p className="mt-auto pt-3 text-[11px] text-muted-foreground">{no.fonte}</p>
                </article>
                {index < nos.length - 1 ? <div className="flex w-12 shrink-0 flex-col items-center justify-center" aria-label={nos[index + 1].relacao_entrada ?? 'relação'}><ArrowRight className="size-4 text-[var(--senior-emerald)]" aria-hidden /><span className="mt-1 line-clamp-3 text-center text-[10px] leading-tight text-muted-foreground">{nos[index + 1].relacao_entrada}</span></div> : null}
              </li>
            ))}
          </ol>

          <ol className="mt-5 flex flex-col gap-2 xl:hidden" aria-label="Jornada de objetos desta oportunidade">
            {nos.map((no, index) => (
              <li key={`${no.objeto}-${no.id ?? no.data ?? index}`} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3">
                <span className="relative flex justify-center"><span className="z-10 mt-2 size-2.5 rounded-full bg-[var(--senior-emerald)]" />{index < nos.length - 1 ? <span className="absolute top-4 bottom-[-10px] w-px bg-[var(--senior-emerald)]/30" /> : null}</span>
                <div className="rounded-xl border border-border bg-[var(--surface-raised)] p-3.5"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-[12px] font-semibold text-[var(--senior-emerald-hover)]">{no.objeto}</p>{no.id ? <p className="num text-[12px] text-muted-foreground">ID {no.id}</p> : null}</div><p className="mt-1 text-[15px] font-semibold">{no.estado}</p><div className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-muted-foreground">{no.data ? <span className="num">{fmtDataCurta(no.data)}</span> : null}<span>{no.fonte}</span></div>{no.relacao_entrada ? <p className="mt-2 text-[12px] text-muted-foreground">Transição: {no.relacao_entrada}</p> : null}</div>
              </li>
            ))}
          </ol>
        </>
      ) : <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-[14px] text-muted-foreground">Não há Fio da Receita comprovado para esta Oportunidade no fixture.</p>}
    </section>
  )
}
