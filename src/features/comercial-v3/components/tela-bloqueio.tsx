'use client'

/**
 * Portaria digital da demonstração.
 *
 * A ideia: em vez de uma porta genérica, a entrada imita o produto de Gestão
 * de Riscos e Segurança da Senior — a mesma cena verde da página oficial, o
 * crachá do visitante, o registro de acesso e a catraca que libera. É o
 * produto que a casa vende, usado como porta da própria casa.
 *
 * A senha é `RACE`, a fala do Hermínio, e o tom da tela assume isso: "sem
 * crachá, sem catraca". Quem não conhece a fala lê a dica e entra igual.
 *
 * Reaproveita `/revenue/senior-hq.webp` e o logo branco oficial, ambos já no
 * pacote — nenhum byte novo de imagem.
 */

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BadgeCheck, ScanLine } from 'lucide-react'
import { CHAVE_BLOQUEIO, TEXTO_BLOQUEIO, gravarLiberado, senhaCorreta } from '../tela-bloqueio'

const SPRING_SUAVE = { type: 'spring' as const, stiffness: 170, damping: 24, mass: 0.9 }

export function TelaBloqueio({ onAbrir }: { onAbrir: () => void }) {
  const [entrada, setEntrada] = useState('')
  const [erro, setErro] = useState(false)
  const [acertou, setAcertou] = useState(false)
  const [hora, setHora] = useState('')
  const campo = useRef<HTMLInputElement>(null)
  const idCampo = useId()
  const idErro = useId()
  const reduzido = useReducedMotion()

  useEffect(() => {
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
    // O horário é do registro, como numa portaria de verdade. Calculado no
    // acerto, não na montagem, para o registro refletir a entrada real.
    setHora(new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date()))
    setAcertou(true)
  }

  function entrar() {
    try {
      window.localStorage.setItem(CHAVE_BLOQUEIO, gravarLiberado())
    } catch {
      // Armazenamento bloqueado: a liberação vale só nesta sessão. A senha já
      // foi dada, travar aqui puniria a pessoa por um modo do navegador.
    }
    onAbrir()
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#04544f] px-5 py-12">
      {/* Cena: a sede escurecida pelo verde institucional, como na página do produto. */}
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
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 85% at 50% 42%, rgb(0 150 140 / 74%) 0%, rgb(2 88 84 / 84%) 46%, rgb(1 40 42 / 94%) 100%)',
          }}
        />
        {/* Malha de linhas da marca, em diagonal, no canto — o mesmo motivo do site. */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, transparent 0 38px, rgb(255 255 255 / 26%) 38px 39px)',
            maskImage: 'radial-gradient(70% 60% at 78% 20%, #000 0%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(70% 60% at 78% 20%, #000 0%, transparent 72%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[38vh]"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgb(1 30 32 / 84%) 80%, rgb(1 24 26 / 96%) 100%)' }}
        />
      </div>

      <main className="relative flex w-full max-w-[600px] flex-col items-center text-center">
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
            className="h-[42px] w-auto sm:h-[50px]"
          />
        </motion.div>

        <motion.div
          initial={reduzido ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SUAVE, delay: 0.14 }}
          className="mt-8 flex w-full flex-col items-center"
        >
          <span
            aria-hidden
            className="relative grid h-14 w-14 place-items-center rounded-full border border-white/30 text-[#12f7d1]"
            style={{ background: 'rgb(255 255 255 / 10%)', backdropFilter: 'blur(10px)' }}
          >
            {acertou ? <BadgeCheck className="h-6 w-6" strokeWidth={1.8} /> : <ScanLine className="h-6 w-6" strokeWidth={1.8} />}
            {!acertou && !reduzido && (
              // Linha de leitura do crachá varrendo o ícone: o gesto da portaria.
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-x-2 h-px bg-[#12f7d1]"
                initial={{ top: '22%', opacity: 0 }}
                animate={{ top: ['22%', '78%', '22%'], opacity: [0, 0.9, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </span>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#12f7d1]">
            {acertou ? TEXTO_BLOQUEIO.acertoRotulo : TEXTO_BLOQUEIO.rotulo}
          </p>

          <h1 className="mt-2 text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-[42px]">
            {acertou ? TEXTO_BLOQUEIO.acertoTitulo : TEXTO_BLOQUEIO.titulo}
          </h1>

          <p className="mt-3 max-w-[430px] text-[14px] leading-relaxed text-white/78 sm:text-[15px]">
            {acertou ? TEXTO_BLOQUEIO.acertoTexto.replace('{hora}', hora) : TEXTO_BLOQUEIO.subtitulo}
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
              className="revenue-porta-botao group inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[10px] text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#04211f] transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#12f7d1]"
            >
              {TEXTO_BLOQUEIO.acertoBotao}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
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
            <label htmlFor={idCampo} className="sr-only">{TEXTO_BLOQUEIO.campo}</label>
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
              className={`min-h-[52px] w-full rounded-[10px] border bg-white/[0.09] px-4 text-center text-[15px] font-semibold tracking-[0.32em] text-white outline-none backdrop-blur-md transition-colors placeholder:tracking-[0.32em] placeholder:text-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                erro ? 'border-[#ffb3ae] focus-visible:outline-[#ffb3ae]' : 'border-white/35 focus-visible:outline-[#12f7d1]'
              }`}
            />

            {erro && (
              <motion.p
                id={idErro}
                role="alert"
                initial={reduzido ? { opacity: 0 } : { opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="mt-2 text-[12px] font-semibold text-[#ffc9c5]"
              >
                {TEXTO_BLOQUEIO.botaoErro}
              </motion.p>
            )}

            <button
              type="submit"
              className="revenue-porta-botao group mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[10px] text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#04211f] transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#12f7d1]"
            >
              {TEXTO_BLOQUEIO.botao}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </button>

            <p className="mt-3 text-[11.5px] leading-relaxed text-white/58">{TEXTO_BLOQUEIO.dica}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/40">{TEXTO_BLOQUEIO.alternativa}</p>
          </motion.form>
        )}

        {/* Régua da portaria — números do produto, não inventados. */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-11 grid w-full max-w-[460px] grid-cols-3 gap-3 border-t border-white/15 pt-5"
        >
          {TEXTO_BLOQUEIO.registros.map(r => (
            <div key={r.rotulo} className="text-center">
              <p className="num text-[17px] font-bold tabular-nums text-[#12f7d1]">{r.valor}</p>
              <p className="mt-0.5 text-[10px] uppercase leading-tight tracking-[0.08em] text-white/45">{r.rotulo}</p>
            </div>
          ))}
        </motion.footer>
      </main>
    </div>
  )
}
