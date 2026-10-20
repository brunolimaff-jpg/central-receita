'use client'

import { useApi, type FontesResposta } from './use-api'
import type { FonteDTO } from '@/lib/domain/types'
import { fmtDataHora, fmtInt } from '@/lib/domain/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BookOpenText, Database, Info, TriangleAlert } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErroApi } from './primitivas'

const TH = 'h-10 text-left text-[12px] font-semibold text-muted-foreground'

export function Fontes() {
  const leitura = useApi<FontesResposta>('/api/fontes')
  if (leitura.carregando && !leitura.dados) return <Skeleton className="h-[620px] w-full rounded-2xl" />
  if (leitura.erro || !leitura.dados) return <ErroApi erro={leitura.erro ?? 'Catálogo de Fontes e Regras indisponível'} aoTentar={leitura.recarregar} />

  const dados = leitura.dados
  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-8">
      <header>
        <p className="text-[13px] font-medium text-[var(--senior-emerald-hover)]">Inteligência <span className="mx-1.5 text-border">/</span> governança</p>
        <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] md:text-[36px]">Fontes, Regras e Qualidade</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">Proveniência por domínio, definições das leituras derivadas e limites do que o snapshot permite concluir.</p>
      </header>

      <Alert className="border-[var(--attention-amber)]/20 bg-[var(--attention-amber-soft)]/50">
        <Info aria-hidden />
        <AlertTitle>Ambiente sintético local</AlertTitle>
        <AlertDescription className="text-[13px] leading-relaxed">{dados.aviso} Nenhuma fonte corporativa está conectada; volumes, identificadores e valores são fictícios.</AlertDescription>
      </Alert>

      <section aria-labelledby="fontes-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div><h2 id="fontes-heading" className="text-[20px] font-semibold">Fontes por domínio</h2><p className="mt-1 text-[13px] text-muted-foreground">Expanda um domínio para regras aplicadas e limitações.</p></div>
          <span className="text-[12px] text-muted-foreground">Snapshot {dados.snapshot_em ? fmtDataHora(dados.snapshot_em) : 'Não comprovado'}</span>
        </div>
        <div className="divide-y divide-border border-y border-border bg-white">
          {dados.fontes.map((fonte) => <LinhaFonte key={fonte.dominio} fonte={fonte} />)}
        </div>
      </section>

      <section aria-labelledby="regras-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div><h2 id="regras-heading" className="text-[20px] font-semibold">Regras de leitura</h2><p className="mt-1 text-[13px] text-muted-foreground">Definição, população e limite inferencial de cada leitura.</p></div>
          <span className="rounded-full border border-border bg-white px-3 py-1.5 text-[12px] text-muted-foreground">{fmtInt(dados.regras.length)} definições</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="max-h-[68vh] overflow-auto">
            <Table className="min-w-[850px]">
              <TableHeader className="sticky top-0 z-10 bg-white"><TableRow className="hover:bg-transparent"><TableHead className={TH + ' pl-4'}>Código técnico</TableHead><TableHead className={TH}>Objeto</TableHead><TableHead className={TH}>Definição</TableHead><TableHead className={TH + ' pr-4'}>Limitação</TableHead></TableRow></TableHeader>
              <TableBody>
                {dados.regras.map((regra) => <TableRow key={regra.codigo} className="align-top"><TableCell className="num py-3 pl-4 font-mono text-[12px] font-semibold">{regra.codigo}</TableCell><TableCell className="py-3 text-[13px] font-medium">{regra.objeto}</TableCell><TableCell className="max-w-[370px] whitespace-normal py-3 text-[13px] leading-relaxed text-foreground/85">{regra.formula}</TableCell><TableCell className="max-w-[360px] whitespace-normal py-3 pr-4 text-[13px] leading-relaxed text-muted-foreground"><span className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /><span>{regra.limitacao}</span></span></TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
          <p className="border-t border-border bg-muted/45 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">Os códigos técnicos são referências internas do mock. Títulos de operação usam linguagem de decisão; os detalhes permanecem aqui e em “Ver regra” no Radar.</p>
        </div>
      </section>
    </div>
  )
}

function LinhaFonte({ fonte }: { fonte: FonteDTO }) {
  return (
    <details className="group open:bg-[var(--surface-base)]/50">
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[minmax(180px,0.6fr)_minmax(0,1.6fr)_auto_auto]">
        <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{fonte.dominio}</span><span className="mt-0.5 block truncate text-[12px] text-muted-foreground md:hidden">{fonte.origem}</span></span>
        <span className="hidden min-w-0 truncate text-[13px] text-muted-foreground md:block">{fonte.origem}</span>
        <span className="num text-[13px] font-semibold">{fmtInt(fonte.volume)} <span className="font-normal text-muted-foreground">registros</span></span>
        <span className="num hidden text-[12px] text-muted-foreground sm:block">{fmtDataHora(fonte.atualizacao)}</span>
      </summary>
      <div className="grid gap-5 border-t border-border px-4 py-4 md:grid-cols-2">
        <div><h3 className="text-[13px] font-semibold">Regras aplicadas</h3><ul className="mt-2 flex flex-col gap-2">{fonte.regras.map((regra) => <li key={regra} className="flex gap-2 text-[13px] leading-relaxed text-foreground/85"><BookOpenText className="mt-0.5 size-4 shrink-0 text-[var(--senior-emerald-hover)]" aria-hidden /><span>{regra}</span></li>)}</ul></div>
        <div><h3 className="text-[13px] font-semibold">Limitações</h3><ul className="mt-2 flex flex-col gap-2">{fonte.limitacoes.map((limitacao) => <li key={limitacao} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--attention-amber)]" aria-hidden /><span>{limitacao}</span></li>)}</ul><p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground"><Database className="size-4" aria-hidden />Fonte sintética local · atualizado {fmtDataHora(fonte.atualizacao)}</p></div>
      </div>
    </details>
  )
}
