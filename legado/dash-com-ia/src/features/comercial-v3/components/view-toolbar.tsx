import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Trilha + botão de voltar das telas internas do V3 (plano Task 5 Step 1, l.466-470;
 * Task 9 Step 3, l.760-767).
 *
 * O voltar é sempre um destino explícito derivado do `from` da URL — nunca o
 * histórico do navegador — e o rótulo muda conforme a origem da navegação.
 * Assim nenhuma tela obriga o usuário a recomeçar pela Home (spec §5, l.269-296).
 */

export type TrilhaItem = {
  label: string
  href?: string
}

type ViewToolbarProps = {
  trilha: TrilhaItem[]
  voltar: { label: string; href: string }
}

export function ViewToolbar({ trilha, voltar }: ViewToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2.5">
      <nav aria-label="Trilha" className="flex flex-wrap items-center gap-2 text-[12px] text-[#6c7e91]">
        {trilha.map((item, indice) => (
          <span key={`${item.label}-${indice}`} className="flex items-center gap-2">
            {indice > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="rounded-[4px] font-semibold text-[#0a856f] transition-premium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[#0d2340]">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <Link
        href={voltar.href}
        className="ml-auto inline-flex items-center gap-2 rounded-[9px] border border-[#dfe8ef] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:translate-y-px"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.8} />
        {voltar.label}
      </Link>
    </div>
  )
}
