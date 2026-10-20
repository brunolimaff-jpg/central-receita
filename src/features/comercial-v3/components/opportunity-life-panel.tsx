import { formatarInstante } from '../format'
import type { OpportunityCommitment, OpportunityLifeModel } from '../opportunity-life'

const COMMITMENT_KIND: Record<OpportunityCommitment['kind'], string> = {
  visit: 'Visita',
  meeting: 'Reunião',
  call: 'Ligação',
  cross: 'Compromisso de Cross',
}

const COMMITMENT_STATUS: Record<OpportunityCommitment['status'], string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export function OpportunityLifePanel({ life }: { life: OpportunityLifeModel }) {
  return (
    <div className="grid gap-3">
      <nav aria-label="Nesta oportunidade" className="flex flex-wrap gap-1 rounded-[10px] border border-[#dfe8ef] bg-white p-1.5 text-[13px] font-semibold text-[#33466c]">
        {[
          ['opportunity-actions', 'Vida comercial'],
          ['opportunity-commitments', 'Compromissos'],
          ['opportunity-relationship', 'Relacionamento da conta'],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-10 items-center rounded-[8px] px-3 hover:bg-[#f0f8f6] hover:text-[#086b6b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
          >
            {label}
          </a>
        ))}
      </nav>

      <p className="px-1 text-[12px] leading-5 text-[#50647d]">
        {life.provenance.notice} · Fonte: {life.provenance.source}
        {life.provenance.asOf ? <> · Referência: {formatarInstante(life.provenance.asOf)}</> : null}
      </p>

      <div className="grid items-start gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="opportunity-actions" aria-labelledby="opportunity-actions-title" className="scroll-mt-6 rounded-[10px] border border-[#dfe8ef] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
          <h2 id="opportunity-actions-title" className="text-[20px] font-bold tracking-[-0.025em] text-[#33466c]">Ações registradas</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#50647d]">Registros da condução comercial desta oportunidade.</p>

          {life.actionsAvailability === 'available' && life.actions.length > 0 ? (
            <ol className="mt-4 divide-y divide-[#e5edf2]">
              {life.actions.map((action) => (
                <li key={action.id} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
                  {action.at ? (
                    <time dateTime={action.at} className="num text-[13px] leading-5 text-[#50647d]">{formatarInstante(action.at)}</time>
                  ) : (
                    <span className="text-[13px] leading-5 text-[#50647d]">Data não informada</span>
                  )}
                  <div className="min-w-0">
                    <p className="break-words text-[13px] leading-6 text-[#33466c]">{action.label ?? 'Descrição do registro não informada'}</p>
                    <p className="mt-1 text-[12px] leading-5 text-[#50647d]">
                      {action.registeredBy ? `Registrado por ${action.registeredBy}` : 'Autor do registro não informado'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-4 border-l-2 border-[#bdc6e3] pl-3">
              <p className="text-[13px] font-semibold text-[#33466c]">Ações desta oportunidade indisponíveis</p>
              <p className="mt-1 text-[13px] leading-6 text-[#50647d]">A amostra atual não contém registros de ações. Isso não comprova ausência de atividade comercial.</p>
            </div>
          )}
        </section>

        <section id="opportunity-commitments" aria-labelledby="opportunity-commitments-title" className="scroll-mt-6 rounded-[10px] border border-[#dfe8ef] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
          <h2 id="opportunity-commitments-title" className="text-[20px] font-bold tracking-[-0.025em] text-[#33466c]">Compromissos</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#50647d]">Visitas, reuniões, ligações e compromissos de Cross.</p>

          {life.commitmentsAvailability === 'demo' && life.commitments.length > 0 ? (
            <>
              <p className="mt-4 rounded-[10px] border border-[#cfe9e2] bg-[#f0f8f6] px-3 py-2.5 text-[12px] leading-5 text-[#086b6b]">{life.provenance.commitmentsSource}</p>
              <ol className="mt-4 divide-y divide-[#e5edf2]">
                {life.commitments.map((commitment) => (
                  <li key={commitment.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] leading-5">
                      <span className="font-semibold text-[#33466c]">{COMMITMENT_KIND[commitment.kind]}</span>
                      <span className="flex flex-wrap items-center gap-2">
                        {life.nextCommitment?.id === commitment.id ? <span className="rounded-full bg-[#e8f8f3] px-2 py-0.5 font-semibold text-[#086b6b]">Próximo</span> : null}
                        <span className="text-[#50647d]">{COMMITMENT_STATUS[commitment.status]}</span>
                      </span>
                    </div>
                    <p className="mt-1.5 break-words text-[13px] font-semibold leading-6 text-[#33466c]">{commitment.subject}</p>
                    <time dateTime={commitment.at} className="num mt-1 block text-[13px] leading-5 text-[#50647d]">{formatarInstante(commitment.at)}</time>
                    <p className="mt-1 text-[13px] leading-5 text-[#50647d]">Responsável: {commitment.responsible ?? 'não informado'}</p>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="mt-4 border-l-2 border-[#bdc6e3] pl-3">
              <p className="text-[13px] font-semibold text-[#33466c]">Agenda desta oportunidade indisponível</p>
              <p className="mt-1 text-[13px] leading-6 text-[#50647d]">A fonte de compromissos ainda não está conectada. A falta de amostra não significa que não existam compromissos.</p>
            </div>
          )}
        </section>
      </div>

      <details id="opportunity-relationship" className="scroll-mt-6 rounded-[10px] border border-[#dfe8ef] bg-white text-[#33466c] shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
        <summary className="cursor-pointer rounded-[10px] px-5 py-4 text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]">
          Relacionamento da conta
          <span className="ml-2 inline-block text-[12px] font-normal text-[#50647d]">Contexto complementar</span>
        </summary>
        <div className="border-t border-[#e5edf2] px-5 pb-5 pt-4">
          <p className="text-[13px] font-semibold">{life.accountLabel ?? 'Conta não identificada na fonte'}</p>
          <p className="mt-1 text-[13px] leading-5 text-[#50647d]">Consulte o relacionamento para apoiar a condução desta oportunidade.</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['CNPJ', 'CNPJ indisponível'],
              ['Contatos', 'Contatos indisponíveis'],
              ['Ganhos e perdas (Win/Loss)', 'Histórico de ganhos e perdas indisponível'],
              ['Produtos contratados', 'Produtos contratados indisponíveis'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[12px] font-semibold leading-5 text-[#33466c]">{label}</dt>
                <dd className="mt-1 text-[13px] leading-5 text-[#50647d]">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-[#e5edf2] pt-3 text-[12px] leading-5 text-[#50647d]">A fonte do relacionamento ainda não está conectada. A solução negociada nesta oportunidade não comprova um produto contratado.</p>
        </div>
      </details>
    </div>
  )
}
