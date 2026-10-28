'use client'

/**
 * Porta de entrada da demonstração.
 *
 * A referência é a tela de acesso restrito do Brand Center: cena em tela cheia
 * escurecida, marca ao centro e uma única ação. O conceito é emprestado, o
 * desenho não — aqui a cena é a nossa (a sede, a mesma foto do topo do
 * produto, já otimizada), a luz é a nossa (verde-neon sobre petróleo) e o
 * degradê é o oficial "Degradê Verde Senior" do design system.
 *
 * Só há senha. Sem login, sem SSO, sem e-mail: a porta existe para o momento da
 * sala de reunião, não para controle de acesso — e o comentário fica aqui para
 * que ninguém a transforme em autenticação depois.
 *
 * Nada de arquivo novo de imagem: reaproveita `/revenue/senior-hq.webp` e
 * `/brand/senior-official-logos/slide-13-logo-01.svg`, ambos já no pacote.
 */

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { CHAVE_BLOQUEIO, TEXTO_BLOQUEIO, gravarLiberado, senhaCorreta } from '../tela-bloqueio'

const SPRING_SUAVE = { type: 'spring' as const, stiffness: 170, damping: 24, mass: 0.9 }

export function TelaBloqueio({ onAbrir }: { onAbrir: () => void }) {
  const [entrada, setEntrada] = useState('')
  const [erro, setErro] = useState(false)
  const [acertou, setAcertou] = useState(false)
  const campo = useRef<HTMLInputElement>(null)
  const idCampo = useId()
  const idErro = useId()
  const reduzido = useReducedMotion()

  useEffect(() => {
    // Foco direto no campo: abrir a porta e ter que clicar antes de digitar é
    // atrito à toa numa tela que tem uma coisa só para fazer.
    const t = window.setTimeout(() => campo.current?.focus(), 260)
    return () => window.clearTimeout(t)
  }, [])

  function abrir(evento: React.FormEvent) {
    evento.preventDefault()
    if (!senhaCorreta(entrada)) {
      setErro(true)
      campo.current?.select()
      return
    }
    setErro(false)
    setAcertou(true)
  }

  function entrar() {
    try {
      window.localStorage.setItem(CHAVE_BLOQUEIO, gravarLiberado())
    } catch {
      // Armazenamento bloqueado: a liberação vale só nesta sessão. A senha já
      // foi dada, travar a entrada aqui puniria a pessoa por um modo do navegador.
    }
    onAbrir()
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#06141f] px-5 py-12">
      {/* Cena: a sede, escurecida. O filtro aqui é de exposição, não de textura. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/revenue/senior-hq.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: 'center 58%' }}
        />
        {/* Véu em três camadas: escurece para o texto passar, puxa o verde
            institucional para a cena e some no rodapé com o degradê oficial. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 40%, rgb(3 20 30 / 62%) 0%, rgb(3 18 27 / 80%) 52%, rgb(2 12 18 / 90%) 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-45"
          style={{
            background:
              'radial-gradient(70% 50% at 18% 8%, rgb(0 175 156 / 42%), transparent 68%), radial-gradient(60% 45% at 86% 92%, rgb(18 247 209 / 26%), transparent 70%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[42vh]"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgb(2 14 21 / 86%) 78%, rgb(2 12 18 / 96%) 100%)' }}
        />
      </div>

      <main className="relative flex w-full max-w-[560px] flex-col items-center text-center">
        {/* Marca oficial em branco — a mesma do topo da coluna de navegação. */}
        <motion.div
          initial={reduzido ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SUAVE, delay: 0.05 }}
        >
          <Image
            src="/brand/senior-official-logos/slide-13-logo-01.svg"
            alt="Senior"
            width={168}
            height={54}
            priority
            className="h-[46px] w-auto sm:h-[54px]"
          />
        </motion.div>

        <motion.div
          initial={reduzido ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SUAVE, delay: 0.14 }}
          className="mt-9 flex w-full flex-col items-center"
        >
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-full border border-white/25 text-white"
            style={{ background: 'rgb(255 255 255 / 8%)', backdropFilter: 'blur(10px)' }}
          >
            <LockKeyhole className="h-5 w-5" strokeWidth={1.8} />
          </span>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#12f7d1]">
            {acertou ? TEXTO_BLOQUEIO.acertoRotulo : TEXTO_BLOQUEIO.rotulo}
          </p>

          <h1 className="mt-2 text-[30px] font-bold leading-[1.12] tracking-[-0.03em] text-white sm:text-[40px]">
            {acertou ? TEXTO_BLOQUEIO.acertoTitulo : TEXTO_BLOQUEIO.titulo}
          </h1>

          <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-white/72 sm:text-[15px]">
            {acertou ? TEXTO_BLOQUEIO.acertoTexto : TEXTO_BLOQUEIO.subtitulo}
          </p>
        </motion.div>

        {acertou ? (
          <motion.div
            initial={reduzido ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SUAVE, delay: 0.1 }}
            className="mt-8 w-full max-w-[340px]"
          >
            <button
              type="button"
              onClick={entrar}
              className="revenue-porta-botao group inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[10px] text-[13px] font-bold uppercase tracking-[0.16em] text-[#04141a] transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#12f7d1]"
            >
              {TEXTO_BLOQUEIO.acertoBotao}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={abrir}
            noValidate
            initial={reduzido ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SUAVE, delay: 0.22 }}
            className="mt-8 w-full max-w-[340px]"
          >
            <label htmlFor={idCampo} className="sr-only">
              {TEXTO_BLOQUEIO.campo}
            </label>
            <div className="relative">
              <input
                ref={campo}
                id={idCampo}
                name="senha"
                type="text"
                value={entrada}
                onChange={evento => { setEntrada(evento.target.value); if (erro) setErro(false) }}
                placeholder={TEXTO_BLOQUEIO.placeholder}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={erro}
                aria-describedby={erro ? idErro : undefined}
                className={`min-h-[52px] w-full rounded-[10px] border bg-white/[0.07] px-4 text-center text-[15px] font-semibold tracking-[0.32em] text-white outline-none backdrop-blur-md transition-colors placeholder:tracking-[0.32em] placeholder:text-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  erro
                    ? 'border-[#ff8f8a] focus-visible:outline-[#ff8f8a]'
                    : 'border-white/30 focus-visible:outline-[#12f7d1]'
                }`}
              />
            </div>

            {erro && (
              <motion.p
                id={idErro}
                role="alert"
                initial={reduzido ? { opacity: 0 } : { opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="mt-2 text-[12px] font-semibold text-[#ffb3ae]"
              >
                {TEXTO_BLOQUEIO.botaoErro}
              </motion.p>
            )}

            <button
              type="submit"
              className="revenue-porta-botao group mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[10px] text-[13px] font-bold uppercase tracking-[0.16em] text-[#04141a] transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#12f7d1]"
            >
              {TEXTO_BLOQUEIO.botao}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>

            <p className="mt-3 text-[11.5px] leading-relaxed text-white/50">{TEXTO_BLOQUEIO.dica}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/35">{TEXTO_BLOQUEIO.alternativa}</p>
          </motion.form>
        )}

        {/* 5 bi como contexto de negócio, não como enfeite. */}
        <motion.footer
          initial={reduzido ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 flex items-center gap-2.5 text-[10.5px] uppercase tracking-[0.16em] text-white/40"
        >
          <span aria-hidden className="h-px w-8 bg-white/25" />
          {TEXTO_BLOQUEIO.metaRotulo}
          <span className="text-[13px] font-bold normal-case tracking-normal text-[#12f7d1]">{TEXTO_BLOQUEIO.metaValor}</span>
          <span aria-hidden className="h-px w-8 bg-white/25" />
        </motion.footer>
      </main>
    </div>
  )
}
