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
  /**
   * Ícone da opção atual. O `<select>` nativo não aceita imagem nas `<option>`,
   * então a marca do produto aparece ao lado do controle fechado — o lugar em
   * que a pessoa lê o filtro ativo.
   */
  icone?: React.ReactNode
}

export function FilterSelect({ label, value, options, onChange, icone }: FilterSelectProps) {
  return (
    <span className="revenue-control relative inline-flex h-11 shrink-0 items-center rounded-[10px]">
      {icone && <span aria-hidden className="pointer-events-none absolute left-3 flex items-center">{icone}</span>}
      <select
        aria-label={label}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        className={`h-11 w-full min-w-[148px] appearance-none cursor-pointer rounded-[10px] border-0 bg-transparent pr-9 text-[13px] font-semibold text-ink-strong transition-premium hover:bg-surface-sunken ${icone ? 'pl-9' : 'pl-3.5'}`}
      >
        {options.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 h-4 w-4 text-ink-muted"
        strokeWidth={1.8}
      />
    </span>
  )
}
