'use client'

// Tela 4 — Pergunte à Receita: consulta assistida, determinística e somente
// leitura. POST /api/agente com a pergunta; a resposta traz blocos em
// mini-tabelas e proveniência (consulta · regra · limitação). Memória da
// conversa em escopo de módulo — o histórico sobrevive à navegação.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AlertCircle, ArrowRight, ChevronRight, Database, GitBranch, Lock, MessageSquareText, Send, Zap } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CabecalhoTela, Painel } from './primitivas'
import { adicionarMensagem, getMensagens, getServerSnapshotMensagens, subscribeMensagens, type MensagemAgente } from '@/lib/domain/agente-sessao'
import type { AgenteResposta } from '@/lib/domain/types'
import type { ContextoGlobal } from '@/lib/domain/navigation'
import { cn } from '@/lib/utils'

// Perguntas de gestão — alinhadas às sugestões padrão do backend (as mesmas
// intenções que /api/agente reconhece: mudança, concentração, radar, perdas,
// pauta de reunião e R4).
const PERGUNTAS_EXEMPLO = [
  'O que mudou na projeção móvel desde a última leitura?',
  'Quais oportunidades explicam a maior parte da variação?',
  'Quais negociações em etapa avançada estão sem compromisso futuro?',
  'Por que a oportunidade 339008 apareceu no radar?',
  'Mostre as cinco perdas de maior valor e o último movimento antes do fechamento',
  'Quais assuntos devo levar para a reunião do time?',
]

const GRUPOS_PERGUNTAS = [
  { rotulo: 'Movimento da receita', perguntas: PERGUNTAS_EXEMPLO.slice(0, 2) },
  { rotulo: 'Oportunidades para revisar', perguntas: PERGUNTAS_EXEMPLO.slice(2, 4) },
  { rotulo: 'Preparar decisões', perguntas: PERGUNTAS_EXEMPLO.slice(4, 6) },
]

const COMO_FUNCIONA = [
  { icone: Zap, rotulo: 'Resposta determinística', detalhe: 'A consulta usa regras locais sobre o snapshot.' },
  { icone: Lock, rotulo: 'Somente leitura', detalhe: 'Perguntas e simulações não alteram a base.' },
  { icone: GitBranch, rotulo: 'Mesma regra da interface', detalhe: 'Radar, fila e respostas compartilham as leituras.' },
  { icone: Database, rotulo: 'Fonte acompanhada', detalhe: 'Cada resposta mostra a consulta e sua limitação.' },
]

// Memória da conversa no escopo do módulo: preserva o histórico quando o
// usuário navega para outras telas e volta (sem persistir entre recargas).
export function Agente({ modo = 'pagina', contexto = {} }: { modo?: 'pagina' | 'painel'; contexto?: ContextoGlobal }) {
  const mensagens = useSyncExternalStore(subscribeMensagens, getMensagens, getServerSnapshotMensagens)
  const [entrada, setEntrada] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [ultimaPergunta, setUltimaPergunta] = useState<string | null>(null)
  const areaRef = useRef<HTMLDivElement>(null)

  function adicionar(mensagem: Omit<MensagemAgente, 'id'>) {
    adicionarMensagem(mensagem)
  }

  useEffect(() => {
    const area = areaRef.current
    if (area) area.scrollTo({ top: area.scrollHeight })
  }, [mensagens, enviando])

  async function enviar(perguntaBruta: string, repetir = false) {
    const pergunta = perguntaBruta.trim()
    if (!pergunta || enviando) return
    if (!repetir) {
      setUltimaPergunta(pergunta)
      setEntrada('')
      adicionar({ papel: 'usuario', texto: pergunta })
    }
    setErroEnvio(null)
    setEnviando(true)
    try {
      const resposta = await fetch('/api/agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta,
          contexto: {
            ...(contexto.filial ? { filial: contexto.filial } : {}),
            ...(contexto.classificacao ? { classificacao: contexto.classificacao } : {}),
            ...(contexto.janelaForecast ? { janelaForecast: contexto.janelaForecast } : {}),
          },
        }),
      })
      const corpo: unknown = await resposta.json().catch(() => null)
      if (!resposta.ok || !corpo || typeof corpo !== 'object' || !('texto' in corpo)) {
        throw new Error(
          corpo && typeof corpo === 'object' && 'erro' in corpo && typeof (corpo as { erro: unknown }).erro === 'string'
            ? (corpo as { erro: string }).erro
            : `Falha na requisição (HTTP ${resposta.status})`,
        )
      }
      const agente = corpo as AgenteResposta
      adicionar({ papel: 'agente', texto: agente.texto, resposta: agente })
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : 'Erro inesperado ao consultar o agente')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={modo === 'painel' ? 'flex h-full min-h-0 flex-col' : 'space-y-5 pb-6'}>
      {modo === 'pagina' ? <CabecalhoTela
        kicker="Consulta local · somente leitura"
        titulo="Pergunte à Receita"
        sub="Pergunte sobre mudanças, oportunidades e sinais. Cada resposta mantém a consulta e sua limitação acessíveis."
      /> : null}

      <div className={modo === 'painel' ? 'flex min-h-0 flex-1 flex-col' : 'grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]'}>
        <Painel className={cn('flex min-h-0 flex-col overflow-hidden rounded-2xl', modo === 'painel' ? 'h-full rounded-none border-0 shadow-none' : 'h-[min(680px,calc(100dvh-230px))] min-h-[420px]')}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--senior-emerald-soft)] text-[var(--senior-emerald-hover)]">
                <MessageSquareText className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-[14px] font-semibold text-foreground">Conversa</h2>
                <p className="truncate text-[12px] text-muted-foreground">Leitura sobre o snapshot local</p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[var(--success-green)]" aria-hidden />
              Dados sintéticos
            </span>
          </div>

          <div
            ref={areaRef}
            className="min-h-0 flex-1 space-y-5 overflow-y-auto scroll-discreta bg-[var(--surface-base)]/60 px-4 py-5 sm:px-6"
            role="log"
            aria-label="Mensagens da conversa"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {mensagens.map((m, index) => (
              <BalaoMensagem
                key={m.id}
                mensagem={m}
                aoPerguntar={enviar}
                animar={m.id > 0 && index === mensagens.length - 1}
              />
            ))}
            {enviando ? (
              <div className="message-enter flex max-w-2xl items-start gap-3" role="status" aria-label="Consultando o snapshot local">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--senior-emerald-soft)] text-[var(--senior-emerald-hover)]">
                  <Zap className="size-4" aria-hidden />
                </span>
                <div className="w-full space-y-2 rounded-2xl rounded-tl-sm border border-border bg-card p-4">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3.5 w-64 max-w-full" />
                  <p className="pt-1 text-[12px] text-muted-foreground">Consultando as regras locais…</p>
                </div>
              </div>
            ) : null}
          </div>

          {modo === 'painel' && mensagens.length === 1 ? (
            <div className="border-t border-border/70 bg-white px-3 py-3 sm:px-4">
              <p className="mb-2 px-1 text-[11px] font-semibold text-muted-foreground">Sugestões para começar</p>
              <div className="flex flex-wrap gap-2">
                {PERGUNTAS_EXEMPLO.slice(0, 3).map((pergunta) => (
                  <button key={pergunta} type="button" disabled={enviando} onClick={() => void enviar(pergunta)}
                    className="min-h-9 rounded-full border border-border bg-[var(--surface-base)] px-3 py-1.5 text-left text-[11.5px] leading-snug text-foreground transition-colors duration-150 hover:border-[var(--senior-emerald)]/40 hover:bg-[var(--senior-emerald-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50">
                    {pergunta}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3 border-t border-border bg-card p-3 sm:p-4">
            {erroEnvio ? (
              <Alert variant="destructive" role="alert" className="py-2.5">
                <AlertCircle aria-hidden />
                <AlertTitle className="text-[13px]">Falha ao consultar</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-2 text-xs">
                  <span>{erroEnvio}</span>
                  {ultimaPergunta ? (
                    <Button size="sm" variant="outline" onClick={() => void enviar(ultimaPergunta, true)}>
                      Tentar novamente
                    </Button>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}

            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void enviar(entrada)
              }}
            >
              <Input
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder="Pergunte sobre o pipeline, o radar ou uma oportunidade…"
                className="h-11 min-w-0 rounded-xl text-[14px]"
                aria-label="Pergunta para a Central"
                aria-describedby="pergunta-ajuda"
                disabled={enviando}
                maxLength={500}
              />
              <Button type="submit" className="h-11 shrink-0 rounded-xl px-4" disabled={enviando || entrada.trim() === ''} aria-label="Enviar pergunta">
                <Send data-icon="inline-start" aria-hidden /> Enviar
              </Button>
            </form>
            <p id="pergunta-ajuda" className="px-1 text-[12px] text-muted-foreground">Até 500 caracteres. A pergunta não é gravada na base.</p>
          </div>
        </Painel>

        {modo === 'pagina' ? <aside className="flex flex-col gap-4" aria-label="Perguntas e informações da consulta">
          <Painel className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-secondary text-foreground">
                <ArrowRight className="size-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-[14px] font-semibold">Comece por aqui</h2>
                <p className="text-[12px] text-muted-foreground">Exemplos de perguntas disponíveis</p>
              </div>
            </div>

            <div className="space-y-4">
              {GRUPOS_PERGUNTAS.map((grupo) => (
                <section key={grupo.rotulo} aria-label={grupo.rotulo}>
                  <h3 className="mb-2 text-[12px] font-semibold text-muted-foreground">{grupo.rotulo}</h3>
                  <div className="space-y-2">
                    {grupo.perguntas.map((pergunta) => (
                      <button
                        key={pergunta}
                        type="button"
                        disabled={enviando}
                        onClick={() => void enviar(pergunta)}
                        className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-[12.5px] leading-snug text-foreground transition-premium hover:border-[var(--senior-emerald)]/50 hover:bg-[var(--senior-emerald-soft)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
                      >
                        <span>{pergunta}</span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Painel>

          <details className="group rounded-xl border border-border bg-card px-4 py-3">
            <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              Como a consulta funciona
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              {COMO_FUNCIONA.map((item) => {
                const Icone = item.icone
                return (
                  <div key={item.rotulo} className="flex items-start gap-2.5">
                    <Icone className="mt-0.5 size-3.5 shrink-0 text-[var(--senior-emerald-hover)]" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-foreground">{item.rotulo}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{item.detalhe}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        </aside> : null}
      </div>
    </div>
  )
}

// ---------- Mensagens ----------

function BalaoMensagem({
  mensagem,
  aoPerguntar,
  animar,
}: {
  mensagem: MensagemAgente
  aoPerguntar: (pergunta: string) => void
  animar: boolean
}) {
  if (mensagem.papel === 'usuario') {
    return (
      <div className={cn('ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-sm bg-foreground px-4 py-3 text-[14px] leading-relaxed text-background', animar && 'message-enter')} aria-label="Sua pergunta">
        {mensagem.texto}
      </div>
    )
  }
  const r = mensagem.resposta
  const sugestoes = r && !r.reconhecido ? r.sugestoes : []
  return (
    <article className={cn('flex max-w-5xl items-start gap-3', animar && 'message-enter')} aria-label="Resposta da Central">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--senior-emerald-soft)] text-[var(--senior-emerald-hover)]">
        <Zap className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-[12px] font-semibold text-foreground">Pergunte à Receita</h3>
          {r ? <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">Leitura determinística</span> : null}
        </div>
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">{mensagem.texto}</p>

        {r?.blocos.map((bloco) => (
          <section key={bloco.titulo} className="mt-4 overflow-hidden rounded-xl border border-border">
            <h4 className="border-b border-border bg-secondary/75 px-3.5 py-2 text-[12px] font-semibold text-foreground">{bloco.titulo}</h4>
            <div className="overflow-x-auto scroll-discreta" role="region" aria-label="Tabela de resultados" tabIndex={0}>
              <table className="w-full min-w-max text-[12.5px]">
                <caption className="sr-only">{bloco.titulo}</caption>
                <thead>
                  <tr className="border-b border-border">
                    {bloco.colunas.map((c) => (
                      <th key={c} scope="col" className="whitespace-nowrap px-3.5 py-2 text-left text-[11px] font-semibold text-muted-foreground">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bloco.linhas.map((linha, i) => (
                    <tr key={i}>
                      {linha.map((celula, j) => (
                        <td
                          key={j}
                          className={cn('whitespace-nowrap px-3.5 py-2 text-foreground/90', j === 0 && 'font-medium text-foreground')}
                        >
                          {celula}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {r ? (
          <div className="mt-4 space-y-2">
            <p className="rounded-lg border border-[var(--attention-amber)]/20 bg-[var(--attention-amber-soft)]/65 px-3.5 py-3 text-[12.5px] leading-relaxed text-foreground">
              <span className="font-semibold">Limitação desta leitura: </span>{r.proveniencia.limitacao}
            </p>
            <details className="group rounded-lg border border-border bg-background/60 px-3.5 py-2.5">
              <summary className="flex min-h-7 cursor-pointer list-none items-center gap-2 text-[12px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                <Database className="size-3.5" aria-hidden />
                Ver consulta e regra
                <ChevronRight className="ml-auto size-4 transition-transform group-open:rotate-90" aria-hidden />
              </summary>
              <div className="mt-2 space-y-1.5 border-t border-border pt-2.5 text-[12px] leading-relaxed text-muted-foreground">
                <p className="break-words"><span className="font-medium text-foreground">Consulta:</span> {r.proveniencia.consulta}</p>
                <p className="break-words"><span className="font-medium text-foreground">Regra:</span> {r.proveniencia.regra}</p>
              </div>
            </details>
          </div>
        ) : null}

        {sugestoes && sugestoes.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Sugestões para reformular a pergunta">
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => aoPerguntar(s)}
                className="min-h-10 rounded-xl border border-border px-3 py-2 text-left text-[12px] text-foreground transition-premium hover:border-[var(--senior-emerald)]/50 hover:bg-[var(--senior-emerald-soft)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
