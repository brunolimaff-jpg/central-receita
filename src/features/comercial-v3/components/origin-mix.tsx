import { BLOCOS_HOME } from '../copy'
import { formatarMilhoes, formatarPercentualInteiro } from '../format'
import { MetricDetail } from './metric-detail'
import type { OrigemRealizado } from '../model'

/**
 * Bloco `New Names × Cross` (plano Task 5 Step 3, l.492-499).
 *
 * Realizado e participação de New Names e Cross sobre o próprio realizado, com a
 * receita recorrente em destaque logo abaixo. Habilitação e serviços ficam no
 * detalhe (título do donut), sem competir visualmente com a recorrência.
 */

const CORES = {
  newNames: '#009b83',
  cross: '#2f78ea',
} as const

export function OriginMix({ origem, tipo }: { origem: OrigemRealizado; tipo?: 'newNames' | 'cross' }) {
  const total = origem.newNames + origem.cross
  const fatiaNewNames = total > 0 ? (origem.newNames / total) * 100 : 0
  const participacaoRecorrente = origem.realizado > 0 ? origem.recorrente / origem.realizado : null

  if (tipo) {
    const valor = origem[tipo]
    const participacao = origem.realizado > 0 ? valor / origem.realizado : null
    const cor = CORES[tipo]
    const label = tipo === 'newNames' ? 'New Name' : 'Cross'
    const valorParticipacao = participacao === null ? 'Base sem realizado' : formatarPercentualInteiro(participacao)
    return (
      <section className="h-full min-w-0 rounded-[14px] border border-[#dfe8ef] bg-white p-5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
        <h2 className="text-[16px] font-bold text-[#0d2340]">{label}</h2>
        <p className="mt-1 text-[12px] text-[#50647d]">{tipo === 'newNames' ? 'Novos negócios' : 'Expansão na base'} · realizado do período</p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <MetricDetail label={`${label} sobre o realizado do período`} value={`${formatarMilhoes(valor)} · ${valorParticipacao}`} description={participacao === null ? 'A participação não pode ser calculada porque o realizado do período é zero.' : `${formatarMilhoes(valor)} de ${formatarMilhoes(origem.realizado)} realizados no recorte.`}>
            <span aria-hidden="true" className="relative grid h-[108px] w-[108px] shrink-0 place-items-center rounded-full" style={{ background: participacao === null ? '#edf2f6' : `conic-gradient(${cor} 0 ${participacao * 100}%, #edf2f6 ${participacao * 100}% 100%)` }}>
              <span className="absolute inset-[13px] rounded-full bg-white" />
              <strong className="num relative text-[22px] text-[#0d2340]">{participacao === null ? '—' : formatarPercentualInteiro(participacao)}</strong>
            </span>
          </MetricDetail>
          <div className="min-w-0"><p className="num whitespace-nowrap text-[27px] font-extrabold tracking-tight" style={{ color: cor }}>{formatarMilhoes(valor)}</p><p className="mt-2 text-[12px] leading-5 text-[#50647d]">de {formatarMilhoes(origem.realizado)}<br />realizados no recorte</p></div>
        </div>
      </section>
    )
  }

  return (
    <section className="h-full rounded-[14px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="mb-2">
        <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#0d2340]">
          {BLOCOS_HOME.newNamesCross}
        </h2>
        <p className="mt-0.5 text-[12px] text-[#63748a]">Participação no realizado do período</p>
      </div>

      <div className="grid grid-cols-[110px_1fr] items-center gap-3.5 pt-1.5">
        <MetricDetail label="Composição New Name e Cross" value={total > 0 ? formatarMilhoes(total) : 'Sem valores no período'} description={`New Name ${formatarMilhoes(origem.newNames)} · Cross ${formatarMilhoes(origem.cross)} · Recorrente ${formatarMilhoes(origem.recorrente)} · Habilitação ${formatarMilhoes(origem.habilitacao)} · Serviços ${formatarMilhoes(origem.servicos)}.`}>
          <span aria-hidden="true" className="relative grid h-[102px] w-[102px] place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(18,77,107,0.05)]" style={{ background: total > 0 ? `conic-gradient(${CORES.newNames} 0 ${fatiaNewNames}%, ${CORES.cross} ${fatiaNewNames}% 100%)` : '#edf2f6' }}>
            <span className="absolute left-1/2 top-1/2 h-[65px] w-[65px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            <span className="num relative text-center text-[13px] font-extrabold text-[#0d2340]">
              {total > 0 ? formatarMilhoes(origem.realizado) : '—'}
              <small className="mt-0.5 block text-[10px] font-medium text-[#77889b]">{total > 0 ? 'realizado' : 'sem valores'}</small>
            </span>
          </span>
        </MetricDetail>

        <div className="grid gap-2.5">
          <p className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[12px]">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: CORES.newNames }} />
            <span className="text-[#50647d]">New Names</span>
            <b className="num font-bold text-[#0d2340]">
              {formatarMilhoes(origem.newNames)} · {formatarPercentualInteiro(total > 0 ? origem.newNames / total : 0)}
            </b>
          </p>
          <p className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[12px]">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: CORES.cross }} />
            <span className="text-[#50647d]">Cross</span>
            <b className="num font-bold text-[#0d2340]">
              {formatarMilhoes(origem.cross)} · {formatarPercentualInteiro(total > 0 ? origem.cross / total : 0)}
            </b>
          </p>
          <p className="mt-0.5 rounded-[9px] bg-[#f3faf8] px-2.5 py-2 text-[11px] text-[#426659]">
            <strong className="font-bold text-[#1c5b4d]">Recorrente:</strong>{' '}
            <span className="num">{formatarMilhoes(origem.recorrente)}</span> ·{' '}
            <span className="num">{participacaoRecorrente === null ? '—' : formatarPercentualInteiro(participacaoRecorrente)}</span> do realizado.
          </p>
        </div>
      </div>
    </section>
  )
}
