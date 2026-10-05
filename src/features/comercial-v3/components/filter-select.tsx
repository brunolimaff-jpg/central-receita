import { ChevronDown } from 'lucide-react'

/**
 * Select de filtro do header (plano Task 3 Step 4, l.328-339).
 *
 * Select nativo com aparência controlada: mantém teclado, leitor de tela e
 * `focus-visible` do checkout sem dependência nova.
 */

export type FilterOption = { value: string; label: string }

type FilterSelectProps = {
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}

export function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label={label}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        className="h-[38px] w-full min-w-[140px] appearance-none rounded-[9px] border border-[#dfe8ef] bg-white pl-3 pr-9 text-[13px] text-[#30445e] transition-premium hover:border-[#c3d3dd] hover:bg-[#f8fbfd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
      >
        {options.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 h-4 w-4 text-[#607389]"
        strokeWidth={1.8}
      />
    </span>
  )
}
