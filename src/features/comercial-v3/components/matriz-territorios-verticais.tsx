'use client'

/**
 * Matriz Territórios × Verticais dentro da tela de Territórios.
 *
 * Três cortes (Geral, Base, Novos) e três métricas (desempenho, cobertura e
 * diferença). A célula é por vertical, mas o clique abre **o território
 * inteiro**: a vertical não é parâmetro de navegação hoje e nenhuma
 * oportunidade é atribuída a vertical. A tela diz isso na legenda, no title e
 * no rótulo acessível — sem prometer um filtro que não existe.
 *
 * A cor nunca é a única informação: o valor vai escrito na célula e o título
 * acessível carrega base, meta, realizado e forecast.
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  CORTES,
  METRICAS,
  matrizMrr,
  type CorteMrr,
  type MetricaMatriz,
  type LeituraCorte,
} from '../central-vendas-mrr'
import type { VerticalId } from '../org-2027'
import { formatarPercentualInteiro, formatarRealComSinal, formatarRealCompacto } from '../format'
import type { CommercialNav } from '../nav'

type Tom = 'bom' | 'atencao' | 'ruim' | 'vazio'

const TONS: Record<Tom, string> = {
  bom: 'bg-[#e8f7f3] text-[#086b6b]',
  atencao: 'bg-[#fff8ec] text-[#8a6100]',
  ruim: 'bg-[#fff0f2] text-[#b8294a]',
  vazio: 'bg-[#f7f9fb] text-[#8a97a6]',
}

function avaliar(metrica: MetricaMatriz, leitura: LeituraCorte): { texto: string; tom: Tom } {
  if (metrica === 'diferenca') {
    // Diferença positiva é o que falta ganhar: preto no branco.
    const falta = leitura.diferenca
    return {
      texto: formatarRealCompacto(falta),
      tom: falta <= 0 ? 'bom' : falta <= leitura.meta * 0.1 ? 'atencao' : 'ruim',
    }
  }
  const razao = metrica === 'desempenho' ? leitura.desempenho : leitura.cobertura
  if (razao === null) return { texto: '—', tom: 'vazio' }
  return {
    texto: formatarPercentualInteiro(razao),
    tom: razao >= 1 ? 'bom' : razao >= 0.7 ? 'atencao' : 'ruim',
  }
}

function textoDiferenca(leitura: LeituraCorte): string {
  if (leitura.diferenca > 0) return `faltam ${formatarRealCompacto(leitura.diferenca)}`
  if (leitura.diferenca < 0) return `${formatarRealCompacto(-leitura.diferenca)} acima da meta`
  return 'na meta'
}

function detalheCelula(leitura: LeituraCorte): string {
  return `Base ${formatarRealCompacto(leitura.base)} · meta ${formatarRealCompacto(leitura.meta)} · realizado ${formatarRealCompacto(leitura.realizado)} · forecast ${formatarRealCompacto(leitura.forecast)} · ${textoDiferenca(leitura)}`
}

export function MatrizTerritoriosVerticais({ nav, segmentoInicial, corteInicial }: {
  nav: CommercialNav
  /** Recorte vindo do painel de resultado: uma vertical e um corte. */
  segmentoInicial?: VerticalId
  corteInicial?: CorteMrr
}) {
  const matriz = useMemo(() => matrizMrr(), [])
  const [corte, setCorte] = useState<CorteMrr>(corteInicial ?? 'geral')
  const [metrica, setMetrica] = useState<MetricaMatriz>('desempenho')
  const metricaAtual = METRICAS.find((item) => item.id === metrica) ?? METRICAS[0]
  const corteAtual = CORTES.find((item) => item.id === corte) ?? CORTES[0]
  const colunas = segmentoInicial ? matriz.colunas.filter((coluna) => coluna.id === segmentoInicial) : matriz.colunas
  const colunasVisiveis = colunas.length > 0 ? colunas : matriz.colunas

  return (
    <section aria-labelledby="matriz-cv-titulo" className="revenue-panel vidro grid min-w-0 gap-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="matriz-cv-titulo" className="text-[15px] font-bold tracking-[-0.02em] text-ink-strong">
            Territórios × Verticais
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            {corteAtual.nota} {metricaAtual.nota}
          </p>
        </div>
        <span className="rounded-full border border-[#dfe8ef] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#50647d]">
          Sem regra de atribuição por vigência · números ilustrativos
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Corte da matriz" className="revenue-control flex overflow-hidden rounded-[10px]">
          {CORTES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={corte === item.id}
              onClick={() => setCorte(item.id)}
              className={`min-w-[64px] px-3 py-2 text-[13px] transition-premium ${
                corte === item.id ? 'bg-brand-escuro font-bold text-white' : 'text-ink-muted hover:bg-surface-sunken'
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Métrica da matriz" className="flex flex-wrap gap-1.5">
          {METRICAS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={metrica === item.id}
              onClick={() => setMetrica(item.id)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-premium ${
                metrica === item.id
                  ? 'border-[#0d2340] bg-[#0d2340] text-white'
                  : 'border-[#dfe8ef] bg-white text-[#33466c] hover:border-[#c9ded6]'
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </div>

      {segmentoInicial && colunasVisiveis[0] && (
        <p className="text-[11px] leading-4 text-[#6b7d91]">
          Recorte vindo do painel: <strong>{colunasVisiveis[0].nome}</strong> · corte {corteAtual.rotulo}. O clique continua abrindo o território inteiro.
        </p>
      )}

      <div className="w-full min-w-0 overflow-x-auto rounded-[10px] border border-[#e3eaef]">
        <table className="w-full min-w-[680px] border-collapse text-left text-[12px]">
          <caption className="sr-only">
            Matriz Territórios × Verticais · corte {corteAtual.rotulo} · métrica {metricaAtual.rotulo} · valores ilustrativos, não oficiais
          </caption>
          <thead>
            <tr className="bg-[#f5f8fb] text-[11px] uppercase tracking-[0.06em] text-[#5b6b80]">
              <th scope="col" className="sticky left-0 z-10 bg-[#f5f8fb] px-3 py-2.5 font-bold">
                Território
              </th>
              {colunasVisiveis.map((coluna) => (
                <th key={coluna.id} scope="col" className="px-2 py-2.5 text-right font-bold">
                  {coluna.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.linhas.map((linha) => (
              <tr key={linha.territorioId} className="border-t border-[#edf1f5] even:bg-[#fbfcfd]">
                <th scope="row" className="sticky left-0 z-10 bg-inherit px-3 py-2 text-left">
                  <Link
                    href={nav.href('territorios', { territorio: linha.territorioId })}
                    className="block font-bold text-[#0d2340] underline decoration-[#c9ded9] underline-offset-2 hover:decoration-[#086b6b]"
                  >
                    {linha.nome}
                  </Link>
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#7a8798]">{linha.ufs}</span>
                </th>
                {linha.celulas.filter((celula) => colunasVisiveis.some((coluna) => coluna.id === celula.verticalId)).map((celula) => {
                  const leitura = celula.porCorte[corte]
                  if (!leitura) {
                    return (
                      <td key={celula.verticalId} className="px-2 py-2 text-right">
                        <span className="inline-flex min-w-[72px] items-center justify-end rounded-[6px] bg-[#f7f9fb] px-2 py-1 text-[#8a97a6]" title={`${linha.nome} não tem base própria nesta vertical`}>
                          —
                        </span>
                      </td>
                    )
                  }
                  const resultado = avaliar(metrica, leitura)
                  return (
                    <td key={celula.verticalId} className="px-2 py-2 text-right">
                      <Link
                        href={nav.href('territorios', { territorio: linha.territorioId })}
                        aria-label={`${linha.nome} × ${celula.verticalNome}, corte ${corteAtual.rotulo}: ${resultado.texto} · ${detalheCelula(leitura)}. Abre o território ${linha.nome} inteiro; a vertical não é filtro nesta tela.`}
                        title={`${celula.verticalNome} × ${linha.nome} · ${detalheCelula(leitura)} · abre o território inteiro (a vertical não é filtro)`}
                        className={`inline-flex min-w-[72px] items-center justify-end rounded-[6px] px-2 py-1 font-semibold tabular-nums transition-premium hover:outline hover:outline-1 hover:outline-[#086b6b] focus-visible:outline-2 focus-visible:outline-[#086b6b] ${TONS[resultado.tom]}`}
                      >
                        {resultado.texto}
                      </Link>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#dfe8ef] bg-[#f5f8fb] font-bold text-[#0d2340]">
              <th scope="row" className="sticky left-0 z-10 bg-[#f5f8fb] px-3 py-2 text-left">
                Total
              </th>
              {colunasVisiveis.map((coluna) => {
                const total = matriz.totais[corte]
                const leituraDaColuna = (() => {
                  if (!total) return null
                  const celulas = matriz.linhas
                    .map((linha) => linha.celulas.find((celula) => celula.verticalId === coluna.id)?.porCorte[corte] ?? null)
                    .filter((item): item is LeituraCorte => item !== null)
                  if (celulas.length === 0) return null
                  const base = celulas.reduce((soma, item) => soma + item.base, 0)
                  const meta = celulas.reduce((soma, item) => soma + item.meta, 0)
                  const realizado = celulas.reduce((soma, item) => soma + item.realizado, 0)
                  const forecast = celulas.reduce((soma, item) => soma + item.forecast, 0)
                  return {
                    base,
                    meta,
                    realizado,
                    forecast,
                    desempenho: meta > 0 ? realizado / meta : null,
                    cobertura: meta > 0 ? forecast / meta : null,
                    diferenca: meta - realizado,
                  }
                })()
                return (
                  <td key={coluna.id} className="px-2 py-2 text-right tabular-nums">
                    {leituraDaColuna ? avaliar(metrica, leituraDaColuna).texto : '—'}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[11px] leading-4 text-[#6b7d91] sm:hidden">
        A tabela rola para o lado: deslize para ver todas as verticais.
      </p>

      <p className="text-[11px] leading-4 text-[#6b7d91]">
        Cor e texto juntos: verde ≥ 100%, âmbar de 70% a 99%, vermelho abaixo de 70%; “—” é território sem base própria. Soma da matriz{' '}
        <strong className="num">{formatarRealCompacto(matriz.somaDaMatriz)}</strong> contra{' '}
        <strong className="num">{formatarRealCompacto(matriz.totalDeclarado)}</strong> declarados — diferença de{' '}
        <strong className="num">{formatarRealCompacto(Math.abs(matriz.diferencaDaMatriz))}</strong>, mantida à vista e não redistribuída.
      </p>
      <p className="text-[11px] leading-4 text-[#6b7d91]">
        Clicar numa célula abre o <strong>território inteiro</strong>. A vertical não é filtro nesta tela hoje: nenhuma
        oportunidade é recortada por ela, então o recorte não segue para a lista de oportunidades.
      </p>
      <p className="text-[11px] leading-4 text-[#6b7d91]">{matriz.aviso}</p>
    </section>
  )
}
