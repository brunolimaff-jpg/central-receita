'use client'

/**
 * Uma filial dentro de um território.
 *
 * Não recria cards nem tabelas de filial: reaproveita o que a tela regional já
 * calculava e aponta para a análise que já existe. O que é próprio deste nível
 * é a leitura curta — onde a filial está no fluxo, rubrica por rubrica — e a
 * saída para as telas detalhadas.
 */

import Link from 'next/link'
import type { CommercialNav } from '../nav'
import { AvatarPessoa, Barra, Card, Chip, P, R } from '../screens/territorios-ui'
import { forecastFluxo, resultadoFilial, resultadoRubrica, rubricasDoFluxo, ROTULO_RUBRICA, type Fluxo, type RegionalFilial, type RegionalSnapshot } from './regional-model'
import { recortarTerritorio, type Territorio } from './territorios-model'

export function FilialScreen({
  snapshot,
  territorio,
  filial,
  fluxo,
  nav,
}: {
  snapshot: RegionalSnapshot
  territorio: Territorio
  filial: RegionalFilial
  fluxo: Fluxo
  nav: CommercialNav
}) {
  // O cenário Base é do fluxo; recorta só esta filial para a conta bater com o nível de cima.
  const s = recortarTerritorio(snapshot, { ...territorio, filiais: [filial.sigla] })
  const f = forecastFluxo(s, fluxo)
  const r = resultadoFilial(filial, fluxo)
  const rubricas = rubricasDoFluxo(fluxo)
  const executivos = snapshot.execs.filter(e => e.filial === filial.sigla)

  return (
    <div className="grid gap-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Ganho {fluxo.toUpperCase()} × meta</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{P(r.pct)}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">{R(r.ganho)} de {r.meta > 0 ? R(r.meta) : 'sem meta'}</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Cenário Base</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{P(f.pctBase)}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">onde o mês deve aterrissar</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Falta para 70%</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{r.meta > 0 ? R(Math.max(0, 0.7 * r.meta - f.base)) : '—'}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">no cenário Base</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Farol do Base</span>
          <div className="mt-2"><Chip farol={f.farolBase}>{P(f.pctBase)}</Chip></div>
          <div className="mt-1.5 text-[12px] text-[#63748a]">mesma escala em todos os níveis</div>
        </Card>
      </section>

      <Card
        titulo="Rubrica por rubrica"
        hint={`Fluxo ${fluxo.toUpperCase()}. Barra, percentual e chip medem ganho ÷ meta da própria rubrica. O cenário Base do fluxo é ${P(f.pctBase)} — é onde a filial deve aterrissar, e ele não se abre por rubrica.`}
      >
        <div className="grid gap-3">
          {rubricas.map(rubrica => {
            const daRubrica = resultadoRubrica(filial, rubrica)
            const cor = daRubrica.farol === 'verde' ? '#00544e' : daRubrica.farol === 'amarelo' ? '#2db5aa' : '#c0283b'
            return (
              <div key={rubrica}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-[12.5px] font-bold text-[#243b56]">
                  <span>{ROTULO_RUBRICA[rubrica]}</span>
                  <Chip farol={daRubrica.farol}>{P(daRubrica.pct)}</Chip>
                </div>
                <Barra pct={daRubrica.pct} cor={cor} />
                <div className="mt-1 flex justify-between text-[11px] text-[#63748a]">
                  <span>Ganho <b className="text-[#0d2340]">{R(daRubrica.ganho)}</b></span>
                  <span>Meta {daRubrica.meta > 0 ? R(daRubrica.meta) : 'sem meta'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card titulo="Quem responde por esta filial" hint={`${executivos.length} ${executivos.length === 1 ? 'executivo' : 'executivos'} no cenário desta filial.`}>
        {executivos.length === 0 ? (
          <p className="text-[13px] text-[#63748a]">Nenhum executivo cadastrado nesta filial na demonstração.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {executivos.map(e => (
              <li key={e.nome} className="flex items-center gap-2.5 rounded-lg border border-[#eef2f1] px-2.5 py-2">
                <AvatarPessoa nome={e.nome} tamanho={32} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#0d2340]">{e.nome}</p>
                  <p className="text-[11px] text-[#63748a]">meta {fluxo.toUpperCase()} {R(fluxo === 'mrr' ? e.metaMrr : e.metaNrr)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card titulo="Continuar a análise" hint="Territórios mostra onde a filial está; o detalhe fica nas telas que já existem.">
        <ul className="grid gap-2 text-[13px]">
          <li className="flex items-start gap-2"><span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00958b]" /><span><Link href={nav.href('forecast')} className="font-semibold text-[#086b6b] underline underline-offset-2">Forecast</Link> — movimentos e cenários do mês.</span></li>
          <li className="flex items-start gap-2"><span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00958b]" /><span><Link href={nav.href('opportunities')} className="font-semibold text-[#086b6b] underline underline-offset-2">Oportunidades</Link> — as linhas que sustentam este número.</span></li>
        </ul>
      </Card>
    </div>
  )
}
