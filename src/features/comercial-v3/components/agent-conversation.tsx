'use client'

import { useState } from 'react'
import { AGENT_PROMPTS, answerAgentQuestion, type AgentIntent } from '../agent'
import { AGENTE_COPY } from '../copy'
import type { AgentBriefingModel } from '../model'

/**
 * Conversa simulada do agente (plano Task 6 Step 3, l.581-595).
 *
 * Só estado local: a resposta sai de `answerAgentQuestion` sobre o briefing que já
 * está na tela. Nenhuma chamada de rede, nenhuma gravação e nenhuma promessa de
 * integração com modelo real — a divulgação fica fixa no rodapé (Step 4, l.597-600).
 *
 * Estados cobertos: idle (só a abertura), prompt rápido selecionado, resposta
 * renderizada, pergunta fora do retrato e envio bloqueado com campo vazio.
 */

type Mensagem = {
  id: number
  autor: 'agente' | 'usuario'
  texto: string
  intent?: AgentIntent
}

const ABERTURA: Mensagem = { id: 0, autor: 'agente', texto: AGENTE_COPY.abertura }

export function AgentConversation({ briefing }: { briefing: AgentBriefingModel }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([ABERTURA])
  const [pergunta, setPergunta] = useState('')
  const [promptAtivo, setPromptAtivo] = useState<string | null>(null)

  function responder(texto: string) {
    const limpo = texto.trim()
    if (limpo === '') return

    const resposta = answerAgentQuestion(limpo, briefing)
    setMensagens((anteriores) => [
      ...anteriores,
      { id: anteriores.length, autor: 'usuario', texto: limpo },
      { id: anteriores.length + 1, autor: 'agente', texto: resposta.text, intent: resposta.intent },
    ])
    setPergunta('')
  }

  return (
    <section className="overflow-hidden rounded-[10px] border border-[#dfe8ef] bg-white shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
      <div className="border-b border-[#edf2f6] px-4 py-3.5">
        <h2 className="text-[15px] font-bold text-[#0d2340]">{AGENTE_COPY.conversaTitulo}</h2>
        <p className="mt-0.5 text-[12px] text-[#63748a]">{AGENTE_COPY.conversaSubtitulo}</p>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label={AGENTE_COPY.conversaTitulo}
        className="grid max-h-[410px] min-h-[240px] gap-3 overflow-auto bg-[linear-gradient(180deg,#fbfdfd,#fff)] px-4 py-4 scroll-discreta"
      >
        {mensagens.map((mensagem) => (
          <p
            key={mensagem.id}
            className={`drill-enter max-w-[88%] rounded-[10px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
              mensagem.autor === 'agente'
                ? 'justify-self-start rounded-bl-[5px] border border-[#d8eeea] bg-[#eff8f6] text-[#173a35]'
                : 'justify-self-end rounded-br-[5px] bg-[#16334e] text-white'
            }`}
          >
            {mensagem.texto}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-3.5">
        {AGENT_PROMPTS.map((prompt) => {
          const ativo = promptAtivo === prompt.question
          return (
            <button
              key={prompt.question}
              type="button"
              aria-pressed={ativo}
              onClick={() => {
                setPromptAtivo(prompt.question)
                responder(prompt.question)
              }}
              className={`rounded-full border px-2.5 py-2 text-[11px] transition-premium hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] active:translate-y-px ${
                ativo
                  ? 'border-[#009b83] bg-[#e8f8f3] font-semibold text-[#00705f]'
                  : 'border-[#d6e5e2] bg-white text-[#245249] hover:bg-[#eff8f6]'
              }`}
            >
              {prompt.question}
            </button>
          )
        })}
      </div>

      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          responder(pergunta)
        }}
        className="flex items-center gap-2 border-t border-[#edf2f6] px-4 py-3.5"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">{AGENTE_COPY.inputLabel}</span>
          <input
            type="text"
            value={pergunta}
            autoComplete="off"
            suppressHydrationWarning
            onChange={(evento) => setPergunta(evento.target.value)}
            placeholder={AGENTE_COPY.inputPlaceholder}
            className="h-[38px] w-full rounded-[10px] border border-[#dfe8ef] bg-white px-3 text-[13px] text-[#0d2340] transition-premium placeholder:text-[#8296ab] hover:border-[#c3d3dd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
          />
        </label>
        <button
          type="submit"
          disabled={pergunta.trim() === ''}
          className="h-[38px] rounded-[10px] bg-[linear-gradient(180deg,#0ca78d,#00836f)] px-4 text-[13px] font-bold text-white transition-premium hover:-translate-y-px active:translate-y-px disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#e6ecf0] disabled:text-[#9aa8b6] disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
        >
          {AGENTE_COPY.enviar}
        </button>
      </form>

      <p className="border-t border-[#edf2f6] px-4 py-2.5 text-[11px] text-[#8a98a8]">
        {AGENTE_COPY.rodape}
      </p>
    </section>
  )
}
