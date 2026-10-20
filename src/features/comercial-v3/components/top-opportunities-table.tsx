'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProductIcon } from './product-icon'
import { FORECAST_OFFICIAL_LABEL } from '../demo-display'
import { formatarComSinal, formatarMilhoes } from '../format'
import type { Top10Row } from '../model'
import type { CommercialNav } from '../nav'
import type { OpportunityDetail } from '../opportunity-details'
import type { ForecastMovement } from '../types'

/**
 * `Top 10 oportunidades que mais explicam o mês` (plano Task 5 Step 4, l.501-509).
 *
 * Ordenação por `abs(deltaForecast)` vinda do seletor (positivos e negativos).
 * Clique na linha abre a tela completa de Oportunidade preservando período,
 * solução, filial e `from=home`. Sem menu de ações e sem writeback.
 *
 * Revisão de leitura: eram 12 colunas em 11px com 8px de recuo, e Estágio/Origem
 * só apareciam acima de 1600px — ou seja, na maioria das telas o diretor nunca
 * as via. Aqui são 10 colunas com respiro, e estágio e origem descem para a
 * segunda linha da conta, onde pertencem: são atributos daquela oportunidade,
 * não uma dimensão a comparar entre linhas.
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
  FORECAST_OFFICIAL_LABEL,
]

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

/** Recuo: generoso nas pontas, constante no miolo. A tabela respira sem virar planilha. */
const CELULA = 'px-3 py-3'
const CELULA_PONTA_ESQ = 'pl-4 pr-3 py-3'
const CELULA_PONTA_DIR = 'pl-3 pr-4 py-3'

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
    <section className="overflow-hidden rounded-[10px] border border-[#dfe8ef] bg-white shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3.5">
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">{titulo}</h2>
          <p className="mt-0.5 pb-2 text-[12px] text-[#63748a]">{subtitulo}</p>
        </div>
        {acao}
      </div>

      <div className="max-h-[420px] overflow-auto scroll-discreta">
        <table className="w-full min-w-[900px] border-collapse text-[12px]">
          <thead>
            <tr>
              {COLUNAS.map((coluna, indice) => {
                const numerica = indice >= 6
                const ponta = indice === 0 ? CELULA_PONTA_ESQ : indice === COLUNAS.length - 1 ? CELULA_PONTA_DIR : CELULA
                return (
                  <th
                    key={coluna}
                    scope="col"
                    className={`sticky top-0 z-10 border-b border-[#dfe8ef] bg-[#f4f9fc] text-[11px] font-bold uppercase tracking-[0.04em] text-[#5b6d82] ${numerica ? 'text-right' : 'text-left'} ${ponta}`}
                  >
                    {coluna}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length} className="px-4 py-8 text-center text-[12px] text-[#63748a]">
                  Nenhuma oportunidade encontrada com os filtros atuais.
                </td>
              </tr>
            )}
            {rows.map((linha) => {
              const href = destino(linha)
              const detalhe = detalhes.get(linha.id)
              /* Estágio e origem descem para a segunda linha: são atributos da
                 oportunidade, não dimensão de comparação. Antes ficavam ocultas
                 abaixo de 1600px. */
              const contexto = [detalhe?.stage, detalhe?.origin].filter(Boolean).join(' · ')

              return (
                <tr
                  key={linha.id}
                  onClick={(evento) => {
                    if ((evento.target as HTMLElement).closest('a')) return
                    router.push(href)
                  }}
                  className="cursor-pointer border-b border-[#eef3f6] align-top text-[#30465f] transition-premium hover:bg-[#f7fbfa] focus-within:bg-[#f7fbfa] active:bg-[#eff7f5]"
                >
                  <td className={`num ${CELULA_PONTA_ESQ} text-[#8190a2]`}>{linha.rank}</td>

                  <td className={`${CELULA} min-w-[210px]`}>
                    <Link
                      href={href}
                      className="rounded-[6px] font-bold text-[#0d2340] underline decoration-transparent decoration-1 underline-offset-2 transition-premium hover:decoration-[#009b83] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
                    >
                      {linha.account}
                    </Link>
                    {contexto && (
                      <span className="mt-1 block text-[11px] leading-4 text-[#8190a2]">{contexto}</span>
                    )}
                  </td>

                  <td className={`${CELULA} whitespace-nowrap`}>
                    <span className="inline-flex items-center gap-2">
                      <ProductIcon solucao={linha.solution} tamanho={15} />
                      {linha.solution}
                    </span>
                  </td>

                  <td className={`${CELULA} whitespace-nowrap`}>{linha.executive}</td>
                  <td className={`${CELULA} whitespace-nowrap`}>{linha.branch}</td>

                  <td className={CELULA}>
                    {linha.movement ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${TAG_POR_MOVIMENTO[linha.movement]}`}
                      >
                        {linha.movement}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#eef2f6] px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-[#5b6d82]">
                        Sem mudança
                      </span>
                    )}
                  </td>

                  <td
                    className={`num ${CELULA} text-right font-bold whitespace-nowrap ${
                      linha.delta < 0 ? 'text-[#d92a49]' : 'text-[#008d77]'
                    }`}
                  >
                    {formatarComSinal(linha.delta)}
                  </td>

                  {/*
                    Zero aqui não é "não valia nada": é "não existia naquele
                    momento". Uma linha que entrou não tinha receita recorrente
                    na carga anterior; uma que saiu não tem valor atual. Mostrar
                    "R$ 0" faz o diretor ler um número que nunca foi medido.
                  */}
                  <td className={`num ${CELULA} text-right font-extrabold whitespace-nowrap text-[#183b58]`}>
                    {linha.recurring === 0 ? <span className="font-normal text-[#8190a2]" title="Não havia esse dado na carga anterior">—</span> : formatarMilhoes(linha.recurring)}
                  </td>
                  <td className={`num ${CELULA} text-right whitespace-nowrap`}>
                    {linha.current === 0 ? <span className="text-[#8190a2]" title="Fora da carteira atual">—</span> : formatarMilhoes(linha.current)}
                  </td>
                  <td className={`num ${CELULA_PONTA_DIR} text-right whitespace-nowrap`}>
                    {linha.prev === 0 ? <span className="text-[#8190a2]" title="Não estava no forecast anterior">—</span> : formatarMilhoes(linha.prev)}
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
