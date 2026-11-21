'use client'

import { Fragment, useState } from 'react'
import { formatarRealCompacto, formatarRealComSinal } from '../format'
import type { MovementRow } from '../movement-rows'
import { Selo, formatarDataCurta } from './executive-ui'

/**
 * Tabela de principais movimentos: seis colunas (conta, filial, movimento, Δ valor, valor, previsão).
 * O restante (oportunidade, etapa, responsável e valor anterior) abre numa linha de detalhe.
 * A linha inteira é clicável; a conta é um botão, então o teclado também alterna o detalhe.
 */
export function MovementTable({ linhas, vazio, legenda, limite = 10 }: {
  linhas: MovementRow[]
  vazio: string
  /** Legenda opcional. As seções já trazem o contexto no subtítulo do painel. */
  legenda?: string
  limite?: number
}) {
  const [aberta, setAberta] = useState<string | null>(null)
  const visiveis = linhas.slice(0, limite)
  return (
    <div className="min-w-0">
      {legenda && <p className="mb-2.5 text-[11px] leading-4 text-ink-muted">{legenda}</p>}
      <div className="revenue-table scroll-discreta">
        <table>
          <colgroup>
            <col className="w-[28%]" /><col className="w-[17%]" /><col className="w-[15%]" />
            <col className="w-[13%]" /><col className="w-[13%]" /><col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Conta</th>
              <th scope="col" title="Campo representative da carga; confirmar com a Fabi se é a filial">Representante / unidade</th>
              <th scope="col">Movimento</th>
              <th scope="col" className="text-right">Variação</th>
              <th scope="col" className="text-right">Valor</th>
              <th scope="col" className="text-right">Previsão</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 && (
              <tr><td colSpan={6} className="!py-8 text-center text-ink-muted">{vazio}</td></tr>
            )}
            {visiveis.map((linha) => {
              const expandida = aberta === linha.key
              const detalheId = `${linha.key}-detalhe`
              const corDelta = linha.delta === null || linha.delta === 0
                ? 'text-ink-strong'
                : linha.delta > 0 ? 'text-dado-positivo' : 'text-dado-negativo'
              return (
                <Fragment key={linha.key}>
                  <tr
                    onClick={() => setAberta(expandida ? null : linha.key)}
                    className="cursor-pointer"
                  >
                    <td className="truncate">
                      <button
                        type="button"
                        aria-expanded={expandida}
                        aria-controls={expandida ? detalheId : undefined}
                        className="block w-full truncate rounded-[6px] text-left font-semibold text-ink-strong hover:underline underline-offset-2"
                      >
                        {linha.account}
                      </button>
                    </td>
                    <td className="truncate text-ink-muted" title={linha.branch}>{linha.branch}</td>
                    <td><Selo movimento={linha.movement} /></td>
                    <td className={`num text-right font-bold ${corDelta}`}>{formatarRealComSinal(linha.delta)}</td>
                    <td className="num text-right text-ink-strong">{formatarRealCompacto(linha.value)}</td>
                    <td className="num text-right text-ink-muted">{formatarDataCurta(linha.date)}</td>
                  </tr>
                  {expandida && (
                    <tr id={detalheId} className="!bg-surface-sunken">
                      <td colSpan={6} className="!whitespace-normal">
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] md:grid-cols-4">
                          <div><dt className="text-ink-muted">Oportunidade</dt><dd className="num font-medium text-ink-strong">{linha.opportunityId || '—'}</dd></div>
                          <div><dt className="text-ink-muted">Etapa</dt><dd className="font-medium text-ink-strong">{linha.stage}</dd></div>
                          <div><dt className="text-ink-muted">Responsável</dt><dd className="font-medium text-ink-strong">{linha.executive}</dd></div>
                          <div>
                            <dt className="text-ink-muted">Antes</dt>
                            <dd className="num font-medium text-ink-strong">
                              {linha.previousValue === null && linha.previousDate === null
                                ? 'Sem registro anterior'
                                : `${formatarRealCompacto(linha.previousValue)} · ${formatarDataCurta(linha.previousDate)}`}
                            </dd>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {linhas.length > limite && (
        <p className="mt-2.5 text-[11px] text-ink-muted">Mostrando {limite} de {linhas.length} movimentos, do maior para o menor impacto.</p>
      )}
    </div>
  )
}
