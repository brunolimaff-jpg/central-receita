'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatarComSinal, formatarMilhoes } from '../format'
import type { Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import type { ForecastMovement } from '../types'

/**
 * `Top 10 oportunidades que mais explicam o mês` (plano Task 5 Step 4, l.501-509).
 *
 * 12 colunas exatas, ordenação por `abs(deltaForecast)` vinda do seletor (positivos
 * e negativos). Clique na linha abre a tela completa de Oportunidade preservando
 * período, solução, filial e `from=home`. Sem menu de ações e sem writeback.
 */

const TAG_POR_MOVIMENTO: Record<ForecastMovement, string> = {
  Saiu: 'bg-[#ffecef] text-[#c32943]',
  Postergou: 'bg-[#fff4dc] text-[#aa6a08]',
  'Alterou valor': 'bg-[#eaf3ff] text-[#2368bf]',
  Entrou: 'bg-[#e8f8f3] text-[#00856f]',
}

const COLUNAS = [
  '#',
  'Conta',
  'Solução',
  'Executivo',
  'Filial',
  'Movimento',
  'Δ valor',
  'Receita recorrente',
  'Valor atual',
  'Previsão',
  'Estágio',
  'Origem',
]

/** Colunas que só aparecem ≥1600px (ver nota no wrapper da tabela). */
const SO_1600 = new Set(['Estágio', 'Origem'])

type TopOpportunitiesTableProps = {
  rows: Top10Row[]
  detalhes: Map<string, OpportunityDetail>
  nav: CommercialNav
  titulo: string
  subtitulo: string
  acao?: React.ReactNode
  /**
   * Destino da linha. O default é a entrada pela Home; a lista de Oportunidades, a
   * Filial e o Forecast passam o próprio destino para preservar `from` e o
   * movimento selecionado (plano Task 7 Step 4, l.660-662; Task 8 Step 2, l.704-706).
   */
  hrefDe?: (linha: Top10Row) => string
}

export function TopOpportunitiesTable({
  rows,
  detalhes,
  nav,
  titulo,
  subtitulo,
  acao,
  hrefDe,
}: TopOpportunitiesTableProps) {
  const router = useRouter()
  const destino =
    hrefDe ?? ((linha: Top10Row) => nav.href('opportunity', { opportunityId: linha.id, from: 'home' }))

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#dfe8ef] bg-white shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3.5">
        <div>
          <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#0d2340]">{titulo}</h2>
          <p className="mt-0.5 pb-2 text-[12px] text-[#63748a]">{subtitulo}</p>
        </div>
        {acao}
      </div>

      <div className="max-h-[355px] overflow-auto scroll-discreta">
        {/* Estágio/Origem só entram ≥1600px: em 1536 as 12 colunas não caberiam sem corte (gap conhecido do preview). */}
        <table className="w-full min-w-[860px] border-collapse text-[11px]">
          <thead>
            <tr>
              {COLUNAS.map((coluna) => (
                <th
                  key={coluna}
                  scope="col"
                  className={`sticky top-0 z-10 border-b border-[#dfe8ef] bg-[#f8fbfd] px-2 py-2 text-left text-[11px] font-bold text-[#5b6d82]${
                    SO_1600.has(coluna) ? ' hidden min-[1600px]:table-cell' : ''
                  }`}
                >
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length} className="px-2.5 py-6 text-center text-[12px] text-[#63748a]">
                  Nenhuma oportunidade encontrada com os filtros atuais.
                </td>
              </tr>
            )}
            {rows.map((linha) => {
              const href = destino(linha)
              return (
                <tr
                  key={linha.id}
                  onClick={(evento) => {
                    if ((evento.target as HTMLElement).closest('a')) return
                    router.push(href)
                  }}
                  className="cursor-pointer border-b border-[#eef3f6] text-[#30465f] transition-premium hover:bg-[#f7fbfa] focus-within:bg-[#f7fbfa] active:bg-[#eff7f5]"
                >
                  <td className="num px-2.5 py-2.5 text-[#8190a2]">{linha.rank}</td>
                  <td className="px-2.5 py-2.5 font-bold whitespace-nowrap text-[#0d2340]">
                    <Link
                      href={href}
                      className="rounded-[4px] underline decoration-transparent decoration-1 underline-offset-2 transition-premium hover:decoration-[#009b83] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
                    >
                      {linha.account}
                    </Link>
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">{linha.solution}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">{linha.executive}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">{linha.branch}</td>
                  <td className="px-2.5 py-2.5">
                    {linha.movement ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold whitespace-nowrap ${TAG_POR_MOVIMENTO[linha.movement]}`}
                      >
                        {linha.movement}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#eef2f6] px-2 py-1 text-[11px] font-bold whitespace-nowrap text-[#5b6d82]">
                        Sem mudança
                      </span>
                    )}
                  </td>
                  <td
                    className={`num px-2.5 py-2.5 font-bold whitespace-nowrap ${
                      linha.delta < 0 ? 'text-[#d92a49]' : 'text-[#008d77]'
                    }`}
                  >
                    {formatarComSinal(linha.delta)}
                  </td>
                  <td className="num px-2.5 py-2.5 font-extrabold whitespace-nowrap text-[#183b58]">
                    {formatarMilhoes(linha.recurring)}
                  </td>
                  <td className="num px-2.5 py-2.5 whitespace-nowrap">{formatarMilhoes(linha.current)}</td>
                  <td className="num px-2.5 py-2.5 whitespace-nowrap">{formatarMilhoes(linha.prev)}</td>
                  <td className="hidden min-[1600px]:table-cell px-2 py-2.5 whitespace-nowrap">
                    {detalhes.get(linha.id)?.stage ?? '—'}
                  </td>
                  <td className="hidden min-[1600px]:table-cell px-2 py-2.5 whitespace-nowrap">
                    {detalhes.get(linha.id)?.origin ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
