'use client'

import { useState } from 'react'
import { formatBRL } from '@/lib/revenue-home/format'
import type { DecisionItem } from '@/lib/revenue-home/types'

export function DecisionPanel({ decisions }: { decisions: DecisionItem[] }) {
  const [feedback, setFeedback] = useState<string | null>(null)

  function registerAction(decision: DecisionItem, label: string) {
    setFeedback(`${decision.account}: “${label}” registrado somente neste protótipo. Nenhuma alteração externa foi executada.`)
  }

  return (
    <section id="decisions" className="overflow-hidden rounded-[20px] border border-border bg-white" aria-labelledby="decisions-title">
      <header className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div>
          <h2 id="decisions-title" className="text-[14px] font-semibold tracking-[-0.025em]">Decisões para você</h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Escolhas que exigem autoridade humana</p>
        </div>
        <span className="text-[10px] text-muted-foreground">{decisions.length} abertas</span>
      </header>

      {feedback ? (
        <div role="status" className="mx-4 mb-3 rounded-xl border border-[var(--senior-emerald)]/20 bg-[var(--senior-emerald-soft)] px-3 py-2 text-[10px] leading-relaxed text-[var(--senior-emerald-hover)] sm:mx-5">
          {feedback}
        </div>
      ) : null}

      <div className="divide-y divide-border/70">
        {decisions.map((decision) => (
          <article key={decision.id} className="relative grid min-w-0 gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[138px_minmax(0,1fr)_126px]">
            <span
              className={[
                'absolute inset-y-0 left-0 w-[3px]',
                decision.tone === 'critical' ? 'bg-[var(--critical-red)]' : 'bg-[#d69316]',
              ].join(' ')}
              aria-hidden
            />

            <div>
              <p className="text-[12px] font-semibold">{decision.account}</p>
              <p className="num mt-1 text-[18px] font-semibold tracking-[-0.04em]">{formatBRL(decision.exposure)}</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">{decision.opportunityCount} oportunidades</p>
            </div>

            <div className="min-w-0">
              <span className={[
                'inline-flex rounded-md px-2 py-1 text-[9px] font-semibold',
                decision.tone === 'critical'
                  ? 'bg-[var(--critical-red-soft)] text-[var(--critical-red)]'
                  : 'bg-[var(--attention-amber-soft)] text-[var(--attention-amber)]',
              ].join(' ')}>
                {decision.status}
              </span>
              <h3 className="mt-2 text-[12px] font-semibold">{decision.title}</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{decision.explanation}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-muted-foreground">
                <span>Janela de decisão: <strong className="text-foreground">{decision.decisionWindow}</strong></span>
                <span>Evidência: <strong className="text-foreground">{decision.evidence}</strong></span>
              </div>
            </div>

            <div className="grid content-start gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
              {decision.actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => registerAction(decision, action.label)}
                  className={[
                    'min-h-8 rounded-lg border px-2.5 text-[10px] font-medium transition-transform active:scale-[.98]',
                    action.emphasis === 'primary'
                      ? 'border-[var(--senior-emerald-hover)] bg-[var(--senior-emerald-hover)] text-white'
                      : 'border-border bg-[var(--surface-base)] text-foreground hover:bg-white',
                  ].join(' ')}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
