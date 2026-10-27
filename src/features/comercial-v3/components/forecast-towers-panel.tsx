'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ImportedRecord } from '../manual-import'
import { agruparPor, filialDe, HORIZONTAIS, horizontalOuSem, segmentoDe, SEGMENTOS, type LinhaRecorte } from '../forecast-towers'
import { formatarOportunidades, formatarPercentualInteiro, formatarRealCompacto } from '../format'
import { InfoTip, Panel } from './executive-ui'
import { SPRING_SUAVE } from './motion-primitives'

export type ModoRecorte = 'agora' | '2027'

const COR_SEGMENTO = 'var(--verde-institucional)'
const COR_HORIZONTAL = 'var(--dado-info)'

function ListaRecorte({ titulo, linhas, cor }: { titulo: string; linhas: LinhaRecorte[]; cor: string }) {
  const maior = Math.max(1, ...linhas.map(linha => linha.previsto ?? 0))
  const total = linhas.reduce((soma, linha) => soma + (linha.previsto ?? 0), 0)
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">{titulo}</h3>
      <ul className="grid gap-2.5">
        {linhas.map((linha, indice) => {
          const fatia = linha.previsto !== null && total > 0 ? linha.previsto / total : null
          const atingido = linha.previsto ? linha.ganho / linha.previsto : null
          return (
            <motion.li
              key={linha.rotulo}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SUAVE, delay: indice * 0.04 }}
              className="grid gap-1"
            >
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate font-semibold text-ink-strong">{linha.rotulo}</span>
                <span className="num shrink-0 font-bold text-ink-strong">{formatarRealCompacto(linha.previsto)}</span>
              </div>
              <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-surface-sunken">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: cor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(linha.previsto ?? 0) / maior * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 24, delay: indice * 0.04 }}
                />
              </span>
              <div className="flex flex-wrap justify-between gap-x-3 text-[11px] text-ink-muted">
                <span>{formatarOportunidades(linha.oportunidades)}{fatia !== null && ` · ${formatarPercentualInteiro(fatia)} do previsto`}</span>
                <span>Ganhos <strong className="num font-semibold text-ink-strong">{formatarRealCompacto(linha.ganho)}</strong>{atingido !== null && ` · ${formatarPercentualInteiro(atingido)}`}</span>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Previsto e ganhos do período em dois recortes: filial (estrutura de agora) e
 * torres de 2027, com segmentos e horizontais lado a lado.
 */
export function ForecastTowersPanel({ modo, previstos, ganhos, periodo }: {
  modo: ModoRecorte
  previstos: ImportedRecord[]
  ganhos: ImportedRecord[]
  periodo: string
}) {
  const reduzido = useReducedMotion()
  const filiais = agruparPor(previstos, ganhos, filialDe)
  const segmentos = agruparPor(previstos, ganhos, segmentoDe, SEGMENTOS)
  const horizontais = agruparPor(previstos, ganhos, horizontalOuSem, HORIZONTAIS)
  return (
    <Panel
      titulo={modo === 'agora' ? 'Forecast por filial' : 'Forecast por torre · 2027'}
      subtitulo={`Previsto e ganhos ${periodo}.`}
      acao={<InfoTip texto={modo === 'agora'
        ? 'Filial é a unidade (representante) de cada oportunidade na carga.'
        : 'A torre vem das colunas produto, módulo e modalidade. Segmento: Indústria, Agronegócio, Construção ou Outros. Horizontal: HCM, Logística (TMS/WMS), GRS ou Wiipo. As duas leituras somam o mesmo previsto.'} />}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={modo}
          initial={reduzido ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduzido ? undefined : { opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className={modo === 'agora' ? 'grid gap-4' : 'grid gap-6 md:grid-cols-2'}
        >
          {modo === 'agora' ? (
            filiais.length > 0
              ? <ListaRecorte titulo="Filiais" linhas={filiais} cor={COR_SEGMENTO} />
              : <p className="text-[13px] text-ink-muted">Nenhuma oportunidade no previsto deste período.</p>
          ) : (
            <>
              <ListaRecorte titulo="Segmentos" linhas={segmentos} cor={COR_SEGMENTO} />
              <ListaRecorte titulo="Horizontais" linhas={horizontais} cor={COR_HORIZONTAL} />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Panel>
  )
}
