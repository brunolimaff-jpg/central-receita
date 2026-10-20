'use client'

// Tela 6 — Validações: painel de robustez do contrato. Invariantes V1–V12
// executadas sob demanda pelas mesmas funções determinísticas que alimentam
// as telas — parte do produto, não suíte externa.

import { useState } from 'react'
import { CheckCircle2, ChevronDown, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CabecalhoTela, CelulaStat, ErroApi, EsqueletoPainel, Painel, Secao } from './primitivas'
import { useApi, type RelatorioValidacoes } from './use-api'
import { fmtData, fmtDataHora, fmtInt, fmtPct } from '@/lib/domain/format'
import type { Validacao } from '@/lib/domain/types'
import { cn } from '@/lib/utils'

export function Validacoes() {
  const relatorio = useApi<RelatorioValidacoes>('/api/validacoes')
  // Evidência expandida por validação: a primeira linha com erro nasce aberta;
  // se todas aprovadas, todas nascem fechadas.
  const [abertas, setAbertas] = useState<Record<string, boolean>>({})

  const validacoes = relatorio.dados?.validacoes ?? []
  const primeiroErro = validacoes.find((v) => v.status === 'erro')?.codigo

  function alternar(codigo: string, padraoAberta: boolean) {
    setAbertas((atual) => ({ ...atual, [codigo]: !(atual[codigo] ?? padraoAberta) }))
  }

  // Data e hora de execução separadas: a data cabe na célula de status, a
  // hora desce para o contexto (fmtDataHora = "22 set 2026 16:23").
  const executadoEm = relatorio.dados?.executado_em ?? null
  const dataExecucao = fmtData(executadoEm)
  const horaExecucao = executadoEm ? (fmtDataHora(executadoEm).split(' ').pop() ?? null) : null

  return (
    <div className="space-y-8">
      <CabecalhoTela
        kicker="Controle de qualidade · invariantes do contrato"
        titulo="Validações"
        sub="Verificações executadas sob demanda sobre o snapshot — parte do produto, não suíte externa."
        acao={
          <Button
            variant="outline"
            size="sm"
            onClick={relatorio.recarregar}
            disabled={relatorio.carregando}
            aria-label="Reexecutar validações"
          >
            <RefreshCw className={relatorio.carregando ? 'animate-spin' : ''} aria-hidden />
            Reexecutar
          </Button>
        }
      />

      {relatorio.carregando && !relatorio.dados ? (
        <EsqueletoPainel linhas={8} />
      ) : relatorio.erro || !relatorio.dados ? (
        <ErroApi erro={relatorio.erro ?? 'Validações indisponíveis'} aoTentar={relatorio.recarregar} />
      ) : (
        <>
          <Secao numero="01" titulo="Status" sub="resultado da última execução">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
              <CelulaStat
                className="bg-card"
                rotulo="Aprovadas"
                valor={fmtInt(relatorio.dados.ok)}
                tom="positivo"
                contexto={`de ${fmtInt(relatorio.dados.total)} invariantes`}
              />
              <CelulaStat
                className="bg-card"
                rotulo="Erros"
                valor={fmtInt(relatorio.dados.erro)}
                tom={relatorio.dados.erro > 0 ? 'critico' : 'neutro'}
                contexto={relatorio.dados.erro > 0 ? 'invariantes violados' : 'nenhuma violação'}
              />
              <CelulaStat
                className="bg-card"
                rotulo="Executado em"
                valor={dataExecucao || '—'}
                contexto={horaExecucao ? `às ${horaExecucao} · sob demanda` : 'sob demanda'}
              />
              <CelulaStat
                className="bg-card"
                rotulo="Cobertura"
                valor={fmtPct(relatorio.dados.total > 0 ? (relatorio.dados.ok / relatorio.dados.total) * 100 : 0)}
                contexto={`${fmtInt(relatorio.dados.ok)}/${fmtInt(relatorio.dados.total)} invariantes`}
              />
            </div>
          </Secao>

          <Secao numero="02" titulo="Invariantes verificados" sub="evidência técnica sob demanda">
            <Painel className="divide-y divide-border overflow-hidden">
              {relatorio.dados.validacoes.map((v) => (
                <LinhaValidacao
                  key={v.codigo}
                  validacao={v}
                  aberta={abertas[v.codigo] ?? v.codigo === primeiroErro}
                  aoAlternar={() => alternar(v.codigo, v.codigo === primeiroErro)}
                />
              ))}
            </Painel>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Validações executam as mesmas funções determinísticas que alimentam as telas.
            </p>
          </Secao>
        </>
      )}
    </div>
  )
}

// ---------- Linha de validação (status → regra → detalhe + evidência) ----------

function LinhaValidacao({
  validacao: v,
  aberta,
  aoAlternar,
}: {
  validacao: Validacao
  aberta: boolean
  aoAlternar: () => void
}) {
  const ok = v.status === 'ok'
  return (
    <article>
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberta}
        className="relative w-full px-5 pb-2.5 pt-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
      >
        <span
          className={cn('absolute inset-y-3 left-0 w-[2.5px] rounded-r', ok ? 'bg-emerald-600' : 'bg-rose-600')}
          aria-hidden
        />
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {ok ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden />
          ) : (
            <XCircle className="size-4 shrink-0 text-rose-700" aria-hidden />
          )}
          <span className="num shrink-0 font-mono text-[11px] font-semibold text-muted-foreground">{v.codigo}</span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">{v.titulo}</span>
          <span className="flex shrink-0 items-center gap-2.5 pl-3">
            <span className={cn('text-[11px] font-semibold uppercase tracking-wide', ok ? 'text-emerald-700' : 'text-rose-700')}>
              {ok ? 'aprovado' : 'erro'}
            </span>
            <ChevronDown
              className={cn('size-4 text-muted-foreground/60 transition-transform', aberta && 'rotate-180')}
              aria-hidden
            />
          </span>
        </span>
      </button>

      <p className="px-5 pb-4 text-xs leading-snug text-muted-foreground">{v.regra}</p>

      {aberta ? (
        <div className="space-y-3 px-5 pb-5">
          <p className="text-[13px] leading-relaxed text-foreground/90">{v.detalhe}</p>
          {v.evidencia.length > 0 ? (
            <div className="rounded-md bg-secondary px-3 py-2">
              {v.evidencia.map((e, i) => (
                <p key={i} className="font-mono text-[11px] leading-relaxed text-foreground/80">
                  {e}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
