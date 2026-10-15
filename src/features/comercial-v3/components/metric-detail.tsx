'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/** Hover/focus explains; click/tap keeps the explanation open. */
export function MetricDetail({ label, value, description, children }: {
  label: string; value: string; description: string; children: ReactNode
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [position, setPosition] = useState({ left: 16, top: 16, width: 320 })
  const reduced = useReducedMotion()
  const keepOpen = () => { clearTimeout(hideTimer.current); setOpen(true) }
  const leave = () => { if (!pinned) hideTimer.current = setTimeout(() => setOpen(false), 180) }
  useEffect(() => {
    if (!open) return
    const locate = () => {
      const rect = trigger.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(320, window.innerWidth - 32)
      setPosition({ left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)), top: Math.max(16, Math.min(rect.bottom + 8, window.innerHeight - 260)), width })
    }
    locate()
    window.addEventListener('resize', locate)
    window.addEventListener('scroll', locate, true)
    return () => { window.removeEventListener('resize', locate); window.removeEventListener('scroll', locate, true); clearTimeout(hideTimer.current) }
  }, [open])
  return <div className="relative min-w-0"
    onPointerEnter={event => { if (event.pointerType !== 'touch') keepOpen() }}
    onPointerLeave={leave}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setPinned(false) } }}
    onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); setPinned(false); event.stopPropagation() } }}>
    <button ref={trigger} type="button" aria-label={`${label}: ${value}. Ver significado`} aria-expanded={open} aria-controls={id}
      className="block w-full min-w-0 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#086b6b]"
      onFocus={() => setOpen(true)} onClick={() => { setPinned(!pinned); setOpen(!pinned) }}>
      {children}
    </button>
    {typeof document !== 'undefined' && createPortal(<AnimatePresence>{open && <motion.div id={id} role="note"
      onPointerEnter={keepOpen} onPointerLeave={leave}
      initial={reduced ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.14 }}
      style={position} className="fixed z-[100] text-left">
      <div className="rounded-xl border border-[#bdc6e3] bg-white p-4 text-sm text-[#33466c] shadow-lg">
        <strong className="block">{label}</strong><span className="num mt-1 block text-lg font-bold text-[#086b6b]">{value}</span>
        <p className="mt-2 leading-5">{description}</p><span className="mt-2 block text-xs text-[#52677f]">{pinned ? 'Clique novamente ou pressione Esc para fechar.' : 'Clique ou toque para manter aberto.'}</span>
      </div>
    </motion.div>}</AnimatePresence>, document.body)}
  </div>
}
