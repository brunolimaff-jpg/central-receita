import Link from 'next/link'
import { Building2, ChevronDown, Users } from 'lucide-react'
import { formatarMilhoes, formatarOportunidades } from '../format'
import type { Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import { selectAccountGroups } from '../accounts-data'

type AccountsScreenProps = {
  rows: Top10Row[]
  detalhes: ReadonlyMap<string, OpportunityDetail>
  query: string
  nav: CommercialNav
}

const panel = 'revenue-panel min-w-0'
const action = 'rounded-[8px] border border-[#dfe8ef] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#2b425e] transition-premium hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]'

export function AccountsScreen({ rows, detalhes, query, nav }: AccountsScreenProps) {
  const todos = selectAccountGroups(rows, detalhes)
  const grupos = selectAccountGroups(rows, detalhes, query)
  const quantidadeOportunidades = grupos.reduce((total, grupo) => total + grupo.opportunities.length, 0)
  const buscando = query.trim() !== ''

  return (
    <div className="revenue-page grid min-w-0 gap-3">
      <header className="rounded-[10px] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_4px_14px_rgba(32,73,91,0.04)] backdrop-blur-sm">
        <h2 className="revenue-heading flex items-center gap-3 text-[32px] font-bold leading-tight tracking-[-.035em] text-[#071648]">
          Contas <Building2 aria-hidden className="text-[#00968c]" size={27} />
        </h2>
        <p className="revenue-subtitle mt-1 text-[15px] text-[#253b68]">
          Clientes, responsáveis e oportunidades disponíveis neste recorte.
        </p>
        <p className="mt-2 rounded-[8px] bg-[#fff8e9] px-3 py-2 text-[12px] text-[#6d571f]">
          Cenário simulado. A associação entre cliente e oportunidades segue o nome de conta do mock.
        </p>
      </header>

      <section aria-label="Clientes com oportunidades" className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#071648]">
              <Users aria-hidden className="text-[#00968c]" size={19} />
              Clientes com oportunidades
            </h3>
            <p className="mt-1 text-[12px] text-[#667ca5]">
              {buscando
                ? `${grupos.length} de ${todos.length} clientes para “${query.trim()}”.`
                : `${grupos.length} clientes · ${formatarOportunidades(quantidadeOportunidades)} no recorte.`}
            </p>
          </div>

          {buscando && (
            <button type="button" onClick={() => nav.onQuery('')} className={action}>
              Limpar busca
            </button>
          )}
        </div>

        {grupos.length === 0 ? (
          <p role="status" className="mt-4 rounded-[10px] bg-[#f5f9fb] px-3 py-5 text-center text-[13px] text-[#50647d]">
            {rows.length === 0
              ? 'Nenhuma oportunidade disponível para os filtros atuais.'
              : 'Nenhum cliente ou responsável corresponde à busca.'}
          </p>
        ) : (
          <ul className="mt-3 max-h-[680px] divide-y divide-[#edf2f6] overflow-y-auto scroll-discreta">
            {grupos.map((grupo) => (
              <li key={grupo.key}>
                <details className="group rounded-[8px] open:bg-[#f8fbfd]">
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[8px] px-2.5 py-3 transition-premium hover:bg-[#f5f9fb] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#086b6b] [&::-webkit-details-marker]:hidden">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-[#e9faf6] text-[#00856f]">
                      <Building2 aria-hidden size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px] text-[#0d2340]">
                        {grupo.account ?? 'Cliente indisponível'}
                      </strong>
                      <span className="mt-0.5 block truncate text-[11px] text-[#66788c]">
                        Responsáveis nas oportunidades: {grupo.responsaveis.join(', ') || 'indisponível'}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#eef6f7] px-2.5 py-1 text-[11px] font-semibold text-[#315267]">
                      {formatarOportunidades(grupo.opportunities.length)}
                    </span>
                    <ChevronDown aria-hidden className="size-4 shrink-0 text-[#607389] transition-transform group-open:rotate-180" />
                  </summary>

                  <ul className="ml-[3.25rem] mr-2 list-none border-t border-[#e8eef2]">
                    {grupo.opportunities.map((oportunidade, index) => {
                      const id = typeof oportunidade.id === 'string' ? oportunidade.id.trim() : ''
                      const solucao = oportunidade.solution?.trim() || 'Solução indisponível'
                      const responsavel = oportunidade.executive?.trim() || 'Responsável indisponível'
                      const etapa = detalhes.get(oportunidade.id)?.stage?.trim() || 'Etapa indisponível'
                      const filial = oportunidade.branch?.trim() || 'Filial indisponível'
                      const valor = Number.isFinite(oportunidade.current)
                        ? formatarMilhoes(oportunidade.current)
                        : 'Indisponível'

                      return (
                        <li key={oportunidade.id || `${grupo.key}-${index}`} className="grid gap-2 border-b border-[#edf2f6] py-3 last:border-b-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(150px,1fr)_auto] lg:items-center">
                          <div className="min-w-0">
                            {id ? (
                              <Link
                                href={nav.href('opportunity', { opportunityId: id, from: 'accounts' })}
                                className="rounded-sm text-[12px] font-bold text-[#0d2340] underline decoration-[#b8d9d4] underline-offset-2 hover:decoration-[#00856f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
                              >
                                Oportunidade {id}
                              </Link>
                            ) : (
                              <strong className="text-[12px] text-[#526b98]">Identificador indisponível</strong>
                            )}
                            <p className="mt-1 truncate text-[11px] text-[#66788c]">{solucao} · {etapa}</p>
                          </div>
                          <p className="text-[11px] text-[#50647d]">
                            {responsavel} <span aria-hidden>·</span> {filial}
                          </p>
                          <div className="flex items-center justify-between gap-3 lg:justify-end">
                            <span className="text-[11px] text-[#75869a]">Forecast atual</span>
                            <strong className="num text-[12px] font-bold text-[#183b58]">{valor}</strong>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
