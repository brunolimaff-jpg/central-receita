import { Sparkles } from 'lucide-react'

/**
 * Faixa de versão preliminar.
 *
 * Jornada, Sistema de Receita, Contas e Cross já abrem, mas o conteúdo ainda
 * não passou pelo aceite. O aviso é explícito na própria tela para ninguém
 * confundir rascunho com número fechado — e some quando a área for aprovada.
 */
export function AvisoPreliminar({ area }: { area: string }) {
  return (
    <p
      role="note"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[10px] border border-dado-atencao/35 bg-dado-atencao-suave px-4 py-2.5 text-[13px] leading-5 text-[#7a5210]"
    >
      <Sparkles aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      <span>
        <strong className="font-semibold">{area} em versão preliminar.</strong>{' '}
        Os números servem para revisão e ainda não passaram pelo aceite — não use como referência fechada.
      </span>
    </p>
  )
}
