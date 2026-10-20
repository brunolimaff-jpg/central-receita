'use client'

import { Minus, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type DensidadeBriefing = 'executivo' | 'completo'
export type HorizonteBriefing = 30 | 60 | 90

export function ControlesBriefing({
  horizonte,
  aoAlterarHorizonte,
  escala,
  aoAlterarEscala,
  densidade,
  aoAlterarDensidade,
}: {
  horizonte: HorizonteBriefing
  aoAlterarHorizonte: (dias: HorizonteBriefing) => void
  escala: number
  aoAlterarEscala: (escala: number) => void
  densidade: DensidadeBriefing
  aoAlterarDensidade: (densidade: DensidadeBriefing) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-col gap-1">
        <span id="horizonte-forecast-label" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Janela do Forecast</span>
        <ToggleGroup
          type="single"
          value={String(horizonte)}
          aria-labelledby="horizonte-forecast-label"
          onValueChange={(valor) => {
            if (valor === '30' || valor === '60' || valor === '90') aoAlterarHorizonte(Number(valor) as HorizonteBriefing)
          }}
          className="h-10 rounded-xl border border-border bg-white p-1"
          variant="outline"
          size="sm"
        >
          {[30, 60, 90].map((dias) => (
            <ToggleGroupItem
              key={dias}
              value={String(dias)}
              aria-label={`${dias} dias`}
              className="h-8 min-w-11 rounded-lg px-2.5 text-[12px] data-[state=on]:bg-[var(--senior-emerald-soft)] data-[state=on]:text-[var(--senior-emerald-hover)]"
            >
              {dias}d
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="mt-4 h-10 rounded-xl bg-white px-3 text-[12px]">
            <SlidersHorizontal data-icon="inline-start" aria-hidden />
            Exibição
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl p-4 motion-reduce:animate-none motion-reduce:transition-none">
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-[14px] font-semibold">Ajustar o Briefing</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">A escala amplia ou reduz os visuais sem encolher os rótulos. O modo completo abre filas e etapas.</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span id="escala-graficos-label" className="text-[12px] font-medium">Tamanho dos gráficos</span>
                <output className="num text-[12px] font-semibold" aria-live="polite">{escala}%</output>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Diminuir os gráficos"
                  disabled={escala <= 80}
                  onClick={() => aoAlterarEscala(Math.max(80, escala - 10))}
                  className="size-11 shrink-0 rounded-xl bg-white"
                >
                  <Minus aria-hidden />
                </Button>
                <Slider
                  aria-labelledby="escala-graficos-label"
                  aria-valuetext={`${escala}%`}
                  min={80}
                  max={130}
                  step={10}
                  value={[escala]}
                  onValueChange={(valores) => {
                    const valor = valores[0]
                    if (valor !== undefined) aoAlterarEscala(valor)
                  }}
                  className="min-h-11 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Aumentar os gráficos"
                  disabled={escala >= 130}
                  onClick={() => aoAlterarEscala(Math.min(130, escala + 10))}
                  className="size-11 shrink-0 rounded-xl bg-white"
                >
                  <Plus aria-hidden />
                </Button>
              </div>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-[12px] font-medium">Densidade</legend>
              <ToggleGroup
                type="single"
                value={densidade}
                aria-label="Densidade do Briefing"
                onValueChange={(valor) => {
                  if (valor === 'executivo' || valor === 'completo') aoAlterarDensidade(valor)
                }}
                className="grid w-full grid-cols-2 gap-2"
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="executivo" className="h-11 rounded-xl text-[12px] data-[state=on]:border-[var(--senior-emerald)] data-[state=on]:bg-[var(--senior-emerald-soft)] data-[state=on]:text-[var(--senior-emerald-hover)]">Executiva</ToggleGroupItem>
                <ToggleGroupItem value="completo" className="h-11 rounded-xl text-[12px] data-[state=on]:border-[var(--senior-emerald)] data-[state=on]:bg-[var(--senior-emerald-soft)] data-[state=on]:text-[var(--senior-emerald-hover)]">Completa</ToggleGroupItem>
              </ToggleGroup>
            </fieldset>

            <Button type="button" variant="ghost" onClick={() => { aoAlterarEscala(100); aoAlterarDensidade('executivo') }} className="h-10 justify-start rounded-lg px-2 text-[12px]">
              <RotateCcw data-icon="inline-start" aria-hidden />
              Restaurar exibição
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
