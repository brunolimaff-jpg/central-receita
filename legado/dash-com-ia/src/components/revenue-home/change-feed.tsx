import type { RevenueMovement } from '@/lib/revenue-home/types'

const DOT_CLASS: Record<RevenueMovement['tone'], string> = {
  positive: 'bg-[var(--success-green)]',
  attention: 'bg-[#d69316]',
  critical: 'bg-[var(--critical-red)]',
}

export function ChangeFeed({ movements }: { movements: RevenueMovement[] }) {
  return (
    <section id="changes" className="rounded-[20px] border border-border bg-white" aria-labelledby="changes-title">
      <header className="px-4 pb-2 pt-3.5">
        <h2 id="changes-title" className="text-[14px] font-semibold tracking-[-0.025em]">Desde sua última visita</h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Movimentos materiais, não notificações</p>
      </header>

      <div className="px-4 pb-3">
        {movements.map((movement, index) => (
          <article key={movement.id} className={['grid grid-cols-[8px_minmax(0,1fr)_auto] gap-2.5 py-2.5', index ? 'border-t border-border/70' : ''].join(' ')}>
            <span className={`mt-1 size-2 rounded-full ${DOT_CLASS[movement.tone]}`} aria-hidden />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold">{movement.title}</p>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground">{movement.description}</p>
            </div>
            <time className="whitespace-nowrap text-[8.5px] text-muted-foreground">{movement.when}</time>
          </article>
        ))}
      </div>
    </section>
  )
}
