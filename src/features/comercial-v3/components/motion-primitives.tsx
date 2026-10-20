'use client'

/**
 * Movimento do painel — primitivas emprestadas do pack Aurora Motion.
 *
 * Regra que governa tudo aqui: animação não inventa informação. Um número só
 * conta de zero até o valor quando o valor veio de uma transição de carga
 * conhecida; em dado real, o texto aparece pronto e o que anima é a entrada do
 * bloco. Por isso `AnimatedNumber` não é usado nos indicadores — ver nota em
 * `FadeUp`.
 *
 * `MotionConfig reducedMotion="user"` é a política única: quem pediu menos
 * movimento no sistema operacional recebe transições de opacidade, sem
 * deslocamento.
 */

import {
  motion,
  MotionConfig,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'

/* ---------- tokens de movimento ---------- */

export const SPRING = { type: 'spring' as const, stiffness: 260, damping: 28, mass: 0.9 }

/* ---------- wrapper global ---------- */

export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

/* ---------- FadeUp: entrada discreta, sem overshoot ---------- */

export function FadeUp({
  children,
  delay = 0,
  className,
  ...rest
}: { children: ReactNode; delay?: number; className?: string } & Omit<HTMLMotionProps<'div'>, 'children'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Stagger: cascata curta para grades de cartões ---------- */

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.03 } } }}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: SPRING },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Barra animada: cresce a partir de zero quando entra na tela ---------- */

/**
 * Barra proporcional que se desenha uma única vez.
 *
 * A largura final é a informação; a animação só mostra de onde ela vem. Se a
 * preferência for por menos movimento, o `MotionConfig` resolve no nível da
 * árvore e a barra aparece pronta.
 */
export function BarraAnimada({ proporcao, cor, altura = 6 }: { proporcao: number; cor: string; altura?: number }) {
  const alvo = Math.max(0, Math.min(1, proporcao))
  return (
    <span aria-hidden className="block overflow-hidden rounded-full bg-surface-sunken" style={{ height: altura }}>
      <motion.span
        className="block h-full rounded-full"
        style={{ background: cor }}
        initial={{ width: 0 }}
        whileInView={{ width: `${alvo * 100}%` }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ type: 'spring', stiffness: 120, damping: 24, mass: 0.9 }}
      />
    </span>
  )
}

/* ---------- Número que conta ---------- */

/**
 * Use **somente** quando o valor anterior for conhecido e comparável (troca de
 * carga, troca de filtro com o mesmo recorte). Em carga recém-importada, contar
 * de zero sugere uma evolução que não foi medida.
 */
export function AnimatedNumber({ value, formatar }: { value: number; formatar: (valor: number) => string }) {
  const movimento = useMotionValue(0)
  const mola = useSpring(movimento, { stiffness: 90, damping: 24, mass: 0.8 })
  const texto = useTransform(mola, (atual) => formatar(atual))
  const referencia = useRef<HTMLSpanElement>(null)
  const visivel = useInView(referencia, { once: true, margin: '-20px' })

  useEffect(() => {
    if (visivel) movimento.set(value)
  }, [visivel, value, movimento])

  return (
    <motion.span ref={referencia} className="tabular-nums">
      {texto}
    </motion.span>
  )
}
