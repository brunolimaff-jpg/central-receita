'use client'

import { MessageSquareText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { ContextoGlobal } from '@/lib/domain/navigation'
import { Agente } from './agente'

export function AssistantTrigger({
  aberto,
  aoMudar,
  contexto,
}: {
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  contexto: ContextoGlobal
}) {
  return (
    <Sheet open={aberto} onOpenChange={aoMudar}>
      <SheetTrigger asChild>
        <Button
          type="button"
          className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 size-12 gap-0 rounded-full border border-white/20 bg-[var(--senior-emerald-hover)] p-0 text-white shadow-[0_10px_28px_rgb(12_66_61/24%)] transition-[transform,background-color,box-shadow] duration-150 hover:bg-[var(--senior-emerald)] active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[var(--senior-emerald)]/60 focus-visible:ring-offset-2 sm:right-6 sm:size-14"
          aria-label="Abrir assistente Pergunte à Receita"
          title="Pergunte à Receita"
        >
          <span className="relative grid size-5 place-items-center" aria-hidden>
            <MessageSquareText className="size-[18px]" strokeWidth={1.8} />
            <Sparkles className="absolute -right-1 -top-1 size-2.5" strokeWidth={2} />
          </span>
          <span className="sr-only">Pergunte à Receita</span>
          <span aria-hidden className="pointer-events-none absolute right-full mr-3 translate-x-1 whitespace-nowrap rounded-xl border border-border bg-white px-3 py-2 text-[12px] font-semibold text-foreground opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">Pergunte à Receita</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-none gap-0 overflow-hidden border-l border-border bg-[var(--surface-base)] p-0 sm:w-[min(92vw,720px)] sm:max-w-none">
        <SheetHeader className="border-b border-border bg-white px-5 py-4 pr-14 sm:px-7">
          <SheetTitle className="flex items-center gap-2 text-left text-[15px]">
            <span className="grid size-8 place-items-center rounded-xl bg-[var(--senior-emerald-soft)] text-[var(--senior-emerald-hover)]">
              <MessageSquareText className="size-4" aria-hidden />
            </span>
            Pergunte à Receita
          </SheetTitle>
          <SheetDescription>Conversa local e somente leitura sobre o snapshot e os filtros desta tela.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <Agente modo="painel" contexto={contexto} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
