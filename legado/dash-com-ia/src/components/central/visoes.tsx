'use client'

import { useSyncExternalStore } from 'react'
import { ArrowRight, Bookmark, Check, Clock3, Layers3, ListChecks, RotateCcw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CabecalhoTela, NotaSintetico, Painel } from './primitivas'
import type { AtualizarContexto, ContextoGlobal, IrPara } from '@/lib/domain/navigation'
import { VISOES_PREDEFINIDAS, type VisaoPredefinida } from '@/lib/domain/visoes'
import { alternarVisaoSalva, getServerSnapshotVisoesSalvas, getVisoesSalvas, limparVisoesSalvas, subscribeVisoesSalvas } from '@/lib/domain/visoes-sessao'
import { cn } from '@/lib/utils'

const ICONES = {
  Forecast: TrendingUp,
  Oportunidades: Layers3,
  Resultado: ListChecks,
} as const

export function Visões({
  irPara,
  atualizarContexto,
  contexto,
}: {
  irPara: IrPara
  atualizarContexto: AtualizarContexto
  contexto: ContextoGlobal
}) {
  const salvas = useSyncExternalStore(subscribeVisoesSalvas, getVisoesSalvas, getServerSnapshotVisoesSalvas)

  function abrir(visao: VisaoPredefinida) {
    atualizarContexto(visao.contexto, visao.destino)
  }

  function alternarSalva(id: string) {
    alternarVisaoSalva(id)
  }

  function limparSalvas() {
    limparVisoesSalvas()
  }

  const visoesSalvas = VISOES_PREDEFINIDAS.filter((visao) => salvas.includes(visao.id))

  return (
    <div className="space-y-7 pb-8">
      <CabecalhoTela
        kicker="Análises recorrentes"
        titulo="Visões"
        sub="Acesse leituras visuais prontas e salve os atalhos que quer revisitar nesta sessão. Cada visão abre uma análise já existente."
        acao={<NotaSintetico />}
      />

      {visoesSalvas.length > 0 ? (
        <section aria-labelledby="visoes-salvas-titulo">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="visoes-salvas-titulo" className="text-[15px] font-semibold text-foreground">Salvas nesta sessão</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">Esses atalhos não são gravados no navegador nem em banco.</p>
            </div>
            <Button type="button" variant="ghost" onClick={limparSalvas} className="h-9 rounded-xl px-3 text-[12px] text-muted-foreground">
              <RotateCcw data-icon="inline-start" aria-hidden /> Limpar atalhos
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {visoesSalvas.map((visao) => (
              <button key={visao.id} type="button" onClick={() => abrir(visao)} className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--senior-emerald)]/20 bg-white px-3 text-[12px] font-medium text-foreground shadow-sm transition-colors duration-150 hover:border-[var(--senior-emerald)]/45 hover:bg-[var(--senior-emerald-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <Bookmark className="size-3.5 text-[var(--senior-emerald-hover)]" aria-hidden />
                {visao.titulo}
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="visoes-disponiveis-titulo">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="visoes-disponiveis-titulo" className="text-[15px] font-semibold text-foreground">Leituras disponíveis</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Os filtros são aplicados às leituras locais. Sem classificação válida, nenhum agrupamento é inferido.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden /> Contexto atual preservado ao navegar
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {VISOES_PREDEFINIDAS.map((visao) => {
            const Icone = ICONES[visao.categoria as keyof typeof ICONES]
            const salva = salvas.includes(visao.id)
            const filtrosAtivos = Object.entries(visao.contexto).filter(([chave, valor]) => contexto[chave as keyof ContextoGlobal] === valor).length
            return (
              <Painel key={visao.id} className="group relative flex min-h-[230px] flex-col overflow-hidden rounded-2xl p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--senior-emerald-soft)] text-[var(--senior-emerald-hover)] ring-1 ring-inset ring-[var(--senior-emerald)]/10">
                    <Icone className="size-[19px]" strokeWidth={1.8} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{visao.categoria}</p>
                    <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.02em] text-foreground">{visao.titulo}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{visao.descricao}</p>
                  </div>
                </div>

                {visao.nota ? (
                  <p className="mt-4 rounded-xl border border-border/70 bg-[var(--surface-base)]/70 px-3.5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">{visao.nota}</p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <span className={cn('text-[11px] font-medium', filtrosAtivos > 0 ? 'text-[var(--senior-emerald-hover)]' : 'text-muted-foreground')}>
                    {filtrosAtivos > 0 ? 'Filtro deste atalho já ativo' : 'Abre uma análise da Central'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => alternarSalva(visao.id)} aria-pressed={salva} className={cn('h-9 rounded-xl px-3 text-[12px]', salva && 'border-[var(--senior-emerald)]/30 bg-[var(--senior-emerald-soft)] text-[var(--senior-emerald-hover)]')}>
                      {salva ? <Check data-icon="inline-start" aria-hidden /> : <Bookmark data-icon="inline-start" aria-hidden />}
                      {salva ? 'Salva' : 'Salvar'}
                    </Button>
                    <Button type="button" onClick={() => abrir(visao)} className="h-9 rounded-xl px-3 text-[12px] active:scale-[0.96]">
                      Abrir <ArrowRight data-icon="inline-end" aria-hidden />
                    </Button>
                  </div>
                </div>
              </Painel>
            )
          })}
        </div>
      </section>

      <section className="chrome-glass rounded-2xl px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div>
          <p className="text-[13px] font-semibold text-foreground">Quer investigar uma pergunta?</p>
          <p className="mt-1 text-[12px] text-muted-foreground">O assistente pode explicar mudanças e sinais com as fontes e limitações da leitura local.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => irPara('agente')} className="mt-3 h-10 rounded-xl bg-white sm:mt-0">
          Pergunte à Receita <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </section>
    </div>
  )
}
