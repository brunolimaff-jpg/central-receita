import { OPORTUNIDADE_COPY } from '../copy'
import { formatarInstante } from '../format'
import type { OpportunityModel } from '../model'

/**
 * Histórico do período (plano Task 9 Step 1, l.754; spec §7, l.317-341).
 *
 * Timeline somente leitura do histórico mockado. O preview mostrava um evento
 * "Valor revisado pelo Executivo no CRM" — causa inventada, que a spec §7 proíbe;
 * aqui só aparecem os eventos que o snapshot carrega.
 */

export function OpportunityTimeline({ historico }: { historico: OpportunityModel['history'] }) {
  const eventos = [...historico].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <section className="rounded-[14px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="mb-2.5">
        <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#0d2340]">
          {OPORTUNIDADE_COPY.historico}
        </h2>
        <p className="mt-0.5 text-[12px] text-[#63748a]">{OPORTUNIDADE_COPY.historicoSubtitulo}</p>
      </div>

      <ol className="grid gap-2.5">
        {eventos.map((evento, indice) => (
          <li
            key={`${evento.at}-${indice}`}
            className="grid grid-cols-[92px_14px_minmax(0,1fr)] items-start gap-3"
          >
            <time dateTime={evento.at} className="num text-[12px] text-[#75869a]">
              {formatarInstante(evento.at)}
            </time>
            <span
              aria-hidden
              className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2f78ea] shadow-[0_0_0_4px_#eaf2ff]"
            />
            <p className="text-[13px] text-[#40546b]">{evento.label}</p>
          </li>
        ))}
        {eventos.length === 0 && (
          <li className="rounded-[10px] border border-[#edf1f3] bg-[#fbfdfe] px-3 py-2.5 text-[12.5px] text-[#63748a]">
            {OPORTUNIDADE_COPY.semMovimento}
          </li>
        )}
      </ol>
    </section>
  )
}
