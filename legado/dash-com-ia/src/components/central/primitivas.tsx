'use client'

import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Indicador, Severidade } from '@/lib/domain/types'

export function CabecalhoTela({
  kicker,
  titulo,
  sub,
  acao,
}: {
  kicker: string
  titulo: string
  sub: string
  acao?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-5">
      <div className="min-w-0">
        <p className="kicker">{kicker}</p>
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-foreground md:text-[30px]">
          {titulo}
        </h1>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">{sub}</p>
      </div>
      {acao ? <div className="flex shrink-0 items-center gap-2">{acao}</div> : null}
    </header>
  )
}

export function Secao({
  numero,
  titulo,
  sub,
  acao,
  children,
  className,
  corpoClassName,
}: {
  numero: string
  titulo: string
  sub?: string
  acao?: ReactNode
  children: ReactNode
  className?: string
  corpoClassName?: string
}) {
  return (
    <section className={className} aria-label={titulo} data-section={numero}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-foreground">{titulo}</h2>
          {sub ? <span className="text-[13px] text-muted-foreground">{sub}</span> : null}
        </div>
        {acao ? <div className="flex items-center gap-2">{acao}</div> : null}
      </div>
      <div className={corpoClassName}>{children}</div>
    </section>
  )
}

export function Painel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('surface-solid rounded-xl', className)}>{children}</section>
}

const COR_TOM: Record<Indicador['tom'], string> = {
  neutro: 'text-foreground',
  positivo: 'text-[var(--success-green)]',
  atencao: 'text-[var(--attention-amber)]',
  critico: 'text-[var(--critical-red)]',
}

export function CelulaStat({
  rotulo,
  valor,
  contexto,
  tom = 'neutro',
  className,
}: {
  rotulo: string
  valor: string
  contexto?: string
  tom?: Indicador['tom']
  className?: string
}) {
  return (
    <div className={cn('min-w-0 px-4 py-3.5', className)}>
      <div className="text-[13px] font-medium text-muted-foreground">{rotulo}</div>
      <div className={cn('num mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.025em]', COR_TOM[tom])}>
        {valor}
      </div>
      {contexto ? <div className="mt-1 text-[13px] leading-snug text-muted-foreground">{contexto}</div> : null}
    </div>
  )
}

export function MiniStat({
  rotulo,
  valor,
  contexto,
  tom = 'neutro',
  className,
}: {
  rotulo: string
  valor: string
  contexto?: string
  tom?: Indicador['tom']
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[12px] font-medium text-muted-foreground">{rotulo}</div>
      <div className={cn('num mt-1 text-[17px] font-semibold leading-tight', COR_TOM[tom])}>{valor}</div>
      {contexto ? <div className="mt-1 text-[12px] leading-snug text-muted-foreground">{contexto}</div> : null}
    </div>
  )
}

export function PillSituacao({ situacao, className }: { situacao: string; className?: string }) {
  const estilo =
    situacao === 'Ganha'
      ? 'border-[var(--success-green-soft)] bg-[var(--success-green-soft)] text-[var(--success-green)]'
      : situacao === 'Perdida'
        ? 'border-[var(--critical-red-soft)] bg-[var(--critical-red-soft)] text-[var(--critical-red)]'
        : 'border-border bg-muted text-foreground'
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium', estilo, className)}>
      <span
        className={cn(
          'size-1.5 rounded-full',
          situacao === 'Ganha' ? 'bg-[var(--success-green)]' : situacao === 'Perdida' ? 'bg-[var(--critical-red)]' : 'bg-slate-500',
        )}
        aria-hidden
      />
      {situacao}
    </span>
  )
}

export const SINAIS_META: Record<string, { nome: string; severidade: Severidade }> = {
  R1: { nome: 'Previsão vencida', severidade: 'critica' },
  R2: { nome: 'Muitos dias sem ação registrada', severidade: 'atencao' },
  R3: { nome: 'Previsão deslocada', severidade: 'atencao' },
  R4: { nome: 'Etapa avançada sem compromisso futuro', severidade: 'atencao' },
  R5: { nome: 'Win sem pedido posterior', severidade: 'atencao' },
  R6: { nome: 'Pedido não conferido', severidade: 'atencao' },
  R7: { nome: 'Probabilidade inconsistente com previsão', severidade: 'atencao' },
}

export function TagSinal({ codigo, className }: { codigo: string; className?: string }) {
  const meta = SINAIS_META[codigo] ?? { nome: 'Sinal do radar', severidade: 'atencao' as Severidade }
  const critico = meta.severidade === 'critica'
  return (
    <span
      title={`${codigo} · ${meta.nome}`}
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
        critico
          ? 'border-[var(--critical-red-soft)] bg-[var(--critical-red-soft)] text-[var(--critical-red)]'
          : 'border-[var(--attention-amber-soft)] bg-[var(--attention-amber-soft)] text-[var(--attention-amber)]',
        className,
      )}
    >
      {codigo}
    </span>
  )
}

export function BadgeSeveridade({ severidade, className }: { severidade: Severidade; className?: string }) {
  const estilo: Record<Severidade, string> = {
    critica: 'border-[var(--critical-red-soft)] bg-[var(--critical-red-soft)] text-[var(--critical-red)]',
    atencao: 'border-[var(--attention-amber-soft)] bg-[var(--attention-amber-soft)] text-[var(--attention-amber)]',
    info: 'border-border bg-muted text-muted-foreground',
  }
  const rotulo: Record<Severidade, string> = { critica: 'Crítica', atencao: 'Atenção', info: 'Informação' }
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-medium', estilo[severidade], className)}>{rotulo[severidade]}</span>
}

export function LinhaDef({
  rotulo,
  children,
  className,
  mono,
}: {
  rotulo: string
  children: ReactNode
  className?: string
  mono?: boolean
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 border-b border-border/70 py-2 last:border-b-0', className)}>
      <span className="shrink-0 text-[13px] text-muted-foreground">{rotulo}</span>
      <span className={cn('min-w-0 text-right text-[14px] text-foreground', mono && 'num font-mono text-[12px]')}>{children}</span>
    </div>
  )
}

export function NotaNula({ className }: { className?: string }) {
  return <span className={cn('text-muted-foreground', className)}>Não comprovado</span>
}

export function NotaSintetico({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[12px] leading-none text-muted-foreground', className)}>
      <span className="size-1.5 rounded-full bg-[var(--senior-emerald)]" aria-hidden />
      dados sintéticos
    </span>
  )
}

export function ErroApi({ erro, aoTentar }: { erro: string; aoTentar: () => void }) {
  return (
    <Alert variant="destructive" role="alert" className="bg-white">
      <AlertCircle aria-hidden />
      <AlertTitle>Não foi possível carregar esta leitura</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        <span>{erro}</span>
        <Button size="sm" variant="outline" onClick={aoTentar}>Tentar novamente</Button>
      </AlertDescription>
    </Alert>
  )
}

export function EstadoVazio({
  titulo,
  descricao,
  className,
  children,
}: {
  titulo: string
  descricao?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn('rounded-xl border border-dashed border-border bg-white p-8 text-center', className)}>
      {children}
      <p className="text-[15px] font-semibold text-foreground">{titulo}</p>
      {descricao ? <p className="mt-1.5 text-[14px] text-muted-foreground">{descricao}</p> : null}
    </div>
  )
}

export function EsqueletoLinhas({ quantidade = 6, className }: { quantidade?: number; className?: string }) {
  return (
    <div className={cn('space-y-2 p-4', className)} aria-hidden>
      {Array.from({ length: quantidade }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
    </div>
  )
}

export function EsqueletoPainel({ className, linhas = 6 }: { className?: string; linhas?: number }) {
  return (
    <Painel className={className}>
      <div className="space-y-3 p-5" aria-hidden>
        {Array.from({ length: linhas }).map((_, i) => <Skeleton key={i} className={i === 0 ? 'h-5 w-52' : 'h-3.5 w-full'} />)}
      </div>
    </Painel>
  )
}
