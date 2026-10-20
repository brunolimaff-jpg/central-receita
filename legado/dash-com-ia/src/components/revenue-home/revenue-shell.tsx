import Image from 'next/image'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  ['#pulse', 'Hoje'],
  ['#flow', 'Fluxo'],
  ['#decisions', 'Decisões'],
  ['#changes', 'Sinais'],
  ['#learning', 'Aprendizados'],
  ['#evidence', 'Evidências'],
] as const

export function RevenueShell({ children, decisionCount }: { children: ReactNode; decisionCount: number }) {
  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-foreground">
      <div className="mx-auto grid w-full max-w-[1540px] gap-3 p-3 lg:grid-cols-[190px_minmax(0,1fr)] lg:p-4">
        <aside className="rounded-[24px] bg-[radial-gradient(circle_at_20%_4%,rgb(0_150_140_/_22%),transparent_35%),linear-gradient(160deg,#0c4039_0%,#092e2a_72%,#072723_100%)] p-3 text-white lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-4 pt-2">
            <Image
              src="/brand/senior-official-logos/slide-13-logo-01.svg"
              alt="Senior"
              width={408}
              height={133}
              priority
              unoptimized
              className="h-[22px] w-[68px] object-contain object-left"
            />
          </div>

          <div className="px-2 pb-3 pt-4">
            <p className="text-[13px] font-semibold tracking-[-0.02em]">Central de Receita</p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/55">Decisão, resultado e evidência</p>
          </div>

          <nav aria-label="Navegação da Central" className="flex gap-1 overflow-x-auto py-1 lg:block lg:space-y-1 lg:overflow-visible">
            {NAV_ITEMS.map(([href, label], index) => (
              <a
                key={href}
                href={href}
                className={[
                  'flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[12px] transition-colors duration-150',
                  index === 0
                    ? 'bg-white/10 font-semibold text-white'
                    : 'text-white/68 hover:bg-white/[0.06] hover:text-white',
                ].join(' ')}
              >
                <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
                {label}
                {label === 'Decisões' ? (
                  <span className="ml-auto rounded-md bg-[#d94c59] px-1.5 py-0.5 text-[9px] font-bold text-white">{decisionCount}</span>
                ) : null}
              </a>
            ))}
          </nav>

          <div className="mt-4 hidden border-t border-white/10 px-2 pt-4 text-[10px] leading-relaxed text-white/45 lg:block">
            Protótipo local · dados sintéticos
          </div>
        </aside>

        <main className="min-w-0 space-y-3">{children}</main>
      </div>
    </div>
  )
}
