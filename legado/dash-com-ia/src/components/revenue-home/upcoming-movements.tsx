import { formatBRL } from '@/lib/revenue-home/format'
import type { UpcomingMovement } from '@/lib/revenue-home/types'

export function UpcomingMovements({ items }: { items: UpcomingMovement[] }) {
  return (
    <section className="rounded-[20px] border border-border bg-white" aria-labelledby="upcoming-title">
      <header className="px-4 pb-2 pt-3.5">
        <h2 id="upcoming-title" className="text-[14px] font-semibold tracking-[-0.025em]">Próximos movimentos</h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Eventos que podem alterar resultado</p>
      </header>

      <div className="px-4 pb-3">
        {items.map((item, index) => (
          <article key={item.id} className={['grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2.5 py-2.5', index ? 'border-t border-border/70' : ''].join(' ')}>
            <time className="rounded-lg bg-secondary/75 px-1 py-1.5 text-center text-[8px] font-bold leading-tight text-foreground">
              {item.weekday}<br /><span className="font-medium text-muted-foreground">{item.dateLabel}</span>
            </time>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold">{item.title}</p>
              <p className="mt-0.5 text-[9.5px] text-muted-foreground">{item.account} · {item.nextMove}</p>
            </div>
            <p className="num whitespace-nowrap text-[9.5px] font-semibold">{formatBRL(item.amount)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
