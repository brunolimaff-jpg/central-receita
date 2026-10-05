import { AGENTE_COPY } from '../copy'
import { formatarComSinal, formatarMilhoes, formatarPercentualInteiro } from '../format'
import type { AgentBriefingModel } from '../model'

/**
 * Briefing do agente (plano Task 6 Step 3, l.581-595; spec §18.2, l.580-588).
 *
 * Todo número vem do `AgentBriefingModel`, o mesmo que alimenta KPIs, movimentos,
 * Top 10 e filiais da Home. A frase de abertura do agente é montada a partir de
 * `deltaOficial`/`deltaMeta` — não existe copy de impacto escrita à mão.
 */

export function AgentBriefing({ briefing }: { briefing: AgentBriefingModel }) {
  const participacaoNewNames =
    briefing.origem.realizado > 0 ? briefing.origem.newNames / briefing.origem.realizado : 0
  const negativos = Object.entries(briefing.movimentos.byMovement)
    .filter(([, resumo]) => resumo.value < 0)
    .map(([movimento]) => movimento.toLowerCase())

  const sinais = [
    {
      chave: 'forecast',
      rotulo: 'Forecast oficial → atual',
      valor: formatarComSinal(briefing.deltaOficial),
      detalhe: `${formatarMilhoes(briefing.movimentos.oficial)} → ${formatarMilhoes(briefing.movimentos.atual)}`,
      negativo: briefing.deltaOficial < 0,
    },
    {
      chave: 'new-names',
      rotulo: 'New Names no realizado',
      valor: formatarMilhoes(briefing.origem.newNames),
      detalhe: `${formatarPercentualInteiro(participacaoNewNames)} de ${formatarMilhoes(briefing.origem.realizado)}`,
      negativo: false,
    },
    {
      chave: 'top5',
      rotulo: 'Top 5',
      valor: formatarPercentualInteiro(briefing.top5Share),
      detalhe: 'do movimento absoluto do Top 10',
      negativo: false,
    },
  ]

  return (
    <section className="rounded-[20px] border border-[#dbeae7] bg-[linear-gradient(135deg,#ffffff_0%,#f4fbf9_100%)] px-6 py-5 shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
      <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-[#087d6a]">
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full bg-[#009b83] shadow-[0_0_0_6px_rgba(0,155,131,0.10)]"
        />
        {AGENTE_COPY.briefingEyebrow} · {AGENTE_COPY.briefingSnapshot}
      </p>

      <h1 className="max-w-[740px] text-[26px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#0d2340] sm:text-[32px]">
        O forecast está {formatarMilhoes(Math.abs(briefing.deltaOficial))}{' '}
        {briefing.deltaOficial < 0 ? 'abaixo' : 'acima'} da fotografia oficial e{' '}
        {formatarMilhoes(Math.abs(briefing.deltaMeta))} {briefing.deltaMeta < 0 ? 'abaixo' : 'acima'} da
        meta.
      </h1>

      <p className="mt-2.5 max-w-[800px] text-[14px] leading-relaxed text-[#53677f]">
        {negativos.length > 0
          ? `Os maiores movimentos do período estão concentrados em ${negativos.join(', ')}. `
          : 'O período não tem movimento negativo contra a fotografia oficial. '}
        New Names representa {formatarPercentualInteiro(participacaoNewNames)} do realizado, e{' '}
        {briefing.atencao.length === 1 ? 'uma filial segue' : `${briefing.atencao.length} filiais seguem`}{' '}
        com a menor cobertura de forecast sobre a meta no recorte atual.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {sinais.map((sinal) => (
          <article key={sinal.chave} className="rounded-[13px] border border-[#dfe8ef] bg-white px-4 py-3.5">
            <p className="text-[12px] text-[#63748a]">{sinal.rotulo}</p>
            <b
              className={`num mt-1.5 block text-[22px] font-extrabold ${
                sinal.negativo ? 'text-[#d62d4a]' : 'text-[#0d2340]'
              }`}
            >
              {sinal.valor}
            </b>
            <span className="num mt-1 block text-[12px] text-[#61748a]">{sinal.detalhe}</span>
          </article>
        ))}
      </div>

      <div aria-label="Resumo semanal" className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {briefing.semanas.map((semana) => (
          <div
            key={semana.week}
            className={`min-h-[74px] rounded-[10px] border px-2.5 py-2.5 ${
              semana.current
                ? 'border-[#ef9aaa] bg-[#fff7f8] shadow-[inset_0_0_0_1px_rgba(239,76,100,0.08)]'
                : 'border-[#dfe8ef] bg-white'
            }`}
          >
            <strong className="block text-[12px] text-[#0d2340]">
              {semana.label}
              {semana.current ? ' · atual' : ''}
            </strong>
            <span className="num mt-0.5 block text-[11px] text-[#63748a]">{semana.rangeLabel}</span>
            <b className="num mt-1.5 block text-[14px] font-extrabold text-[#0d2340]">
              {formatarMilhoes(semana.forecast)}
            </b>
          </div>
        ))}
        {briefing.semanas.length === 0 && (
          <p className="col-span-full rounded-[10px] border border-[#dfe8ef] bg-white px-3 py-2.5 text-[12px] text-[#63748a]">
            A leitura semanal existe na visão mensal; o recorte atual não tem semanas.
          </p>
        )}
      </div>
    </section>
  )
}
