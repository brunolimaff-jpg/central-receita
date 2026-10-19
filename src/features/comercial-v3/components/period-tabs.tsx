import { COMMERCIAL_PERIODS, type CommercialPeriod } from '../types'
import { PERIOD_LABELS } from '../copy'

/**
 * Abas de período do header: Mês · Trimestre · 3 meses (plano Task 3 Step 4, l.330-332).
 * O período selecionado permanece na tela atual — quem troca é só o parâmetro da URL.
 */
export function PeriodTabs({
  period,
  onPeriod,
}: {
  period: CommercialPeriod
  onPeriod: (period: CommercialPeriod) => void
}) {
  return (
    <div
      role="group"
      aria-label="Período"
      className="revenue-control flex overflow-hidden rounded-[14px]"
    >
      {COMMERCIAL_PERIODS.map((item) => {
        const ativo = item === period
        return (
          <button
            key={item}
            type="button"
            aria-pressed={ativo}
            onClick={() => onPeriod(item)}
            className={`min-w-[64px] whitespace-nowrap border-0 px-3 py-2.5 text-[13px] transition-premium active:translate-y-px ${
              ativo
                ? 'bg-brand-escuro font-bold text-white'
                : 'text-ink-muted hover:bg-surface-sunken'
            }`}
          >
            {PERIOD_LABELS[item]}
          </button>
        )
      })}
    </div>
  )
}
