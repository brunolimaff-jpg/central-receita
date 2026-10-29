'use client'

/**
 * Territórios — o módulo de navegação da liderança comercial.
 *
 * Três níveis, e a URL guarda só o que está aberto (`territorio` e `branch`).
 * O nível é derivado: sem território é o CSO; com território, o território; com
 * território e filial, a filial. Não existe parâmetro "nivel", o que impediria
 * o estado impossível "filial sem território".
 *
 * `?view=regional` continua funcionando: o parser de contexto traduz para cá.
 *
 * A tela antiga (`RegionalScreen`, sete abas) não é mais a entrada deste menu.
 * Ela continua existindo para link direto, mas o conteúdo de análise migrou de
 * endereço conceitual: cenário e calibração pertencem ao Forecast, saneamento à
 * Oportunidades. Aqui ficam comparação e intervenção.
 */

import { useState } from 'react'
import Link from 'next/link'
import { VIEW_LABELS, VOLTAR_POR_ORIGEM } from '../copy'
import type { CommercialContext } from '../types'
import type { CommercialNav } from '../nav'
import type { CommercialView } from '../types'
import { ALL_FILTERS } from '../types'
import { CsoScreen } from '../regional/cso-screen'
import { FilialScreen } from '../regional/filial-screen'
import { TerritorioScreen } from '../regional/territorio-screen'
import { filialDoTerritorio, nivelDe, linhasDeTerritorio, recortarTerritorio, territorioPorId } from '../regional/territorios-model'
import { forecastFluxo, resultadoFilial, type Fluxo, type RegionalSnapshot } from '../regional/regional-model'
import { CartaoNivel } from './territorios-ui'

export function TerritoriosScreen({
  snapshot,
  contexto,
  nav,
  from,
}: {
  snapshot: RegionalSnapshot
  contexto: CommercialContext
  nav: CommercialNav
  from?: CommercialView
}) {
  const [fluxo, setFluxo] = useState<Fluxo>('mrr')
  const territorio = territorioPorId(contexto.territorio)
  const nivel = nivelDe(contexto.territorio, contexto.branch)
  const filial = nivel === 'filial' && territorio ? filialDoTerritorio(snapshot, territorio.id, contexto.branch) : null
  const origem = from ?? 'home'
  const linhas = linhasDeTerritorio(snapshot, fluxo)
  const filiaisDoTerritorio = territorio ? snapshot.filiais.filter(f => territorio.filiais.includes(f.sigla)) : []

  // Trilha sempre navegável: cada nível volta ao anterior pelo próprio nome.
  // Subir limpa a filial: sem `branch: ALL_FILTERS` o passo herdaria o branch do
  // contexto e a trilha não sairia da filial.
  const trilha = [
    { label: VIEW_LABELS.home, href: nav.href('home') },
    { label: VIEW_LABELS.territorios, href: nav.href('territorios', { branch: ALL_FILTERS }) },
    ...(territorio ? [{ label: territorio.nome, href: nav.href('territorios', { territorio: territorio.id, branch: ALL_FILTERS }) }] : []),
    ...(filial ? [{ label: filial.sigla }] : []),
  ]

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Trilha" className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#63748a]">
          {trilha.map((passo, i) => (
            <span key={`${passo.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-[#b6c4c1]">/</span>}
              {'href' in passo && passo.href
                ? <Link href={passo.href} className="underline decoration-[#c9ded9] underline-offset-2 hover:text-[#0d2340] hover:decoration-[#086b6b]">{passo.label}</Link>
                : <span aria-current="page" className="font-semibold text-[#0d2340]">{passo.label}</span>}
            </span>
          ))}
        </nav>
        <Link href={nav.href(origem)} className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe8ef] bg-white px-3 py-1 text-[12px] font-semibold text-[#33466c] hover:border-[#c9ded9]">
          <span aria-hidden>←</span> {VOLTAR_POR_ORIGEM[origem]}
        </Link>
      </div>

      <section className="rounded-[10px] border border-[#dfe8ef] bg-gradient-to-br from-[#007a72] to-[#00958b] px-5 py-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-white/75">
              {nivel === 'cso' ? 'Visão CSO · consolidado' : nivel === 'territorio' ? `Território · ${territorio?.nome}` : `Filial · ${territorio?.nome}`}
            </span>
            <h1 className="text-[22px] font-bold tracking-[-0.03em]">
              {nivel === 'cso' ? `Visão CSO · ${snapshot.competencia}` : filial ? `${filial.sigla} · ${filial.nome}` : `${territorio?.nome} · ${snapshot.competencia}`}
            </h1>
            <p className="mt-1 text-[12.5px] text-white/80">
              {snapshot.persona.nome} · dados de {snapshot.asOf.split('-').reverse().join('/')} · último dia útil que integra no ERP: {snapshot.ultimoDiaUtil.split('-').reverse().join('/')}
            </p>
          </div>
          <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[12px] font-semibold">Cenário demonstrativo · dados fictícios</span>
        </div>
      </section>

      {/*
        A navegação é a própria lista do nível de baixo, no padrão da Carteira
        ("quem responde abaixo"): cada cartão já mostra Base, meta e farol antes
        do clique. Pílula de filtro escondia o número até depois de navegar, e
        era isso que fazia a tela parecer vazia.
      */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {nivel !== 'cso' ? (
          <Link href={nav.href('territorios', { branch: ALL_FILTERS })} className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe8ef] bg-white px-3 py-1 text-[12px] font-semibold text-[#33466c] hover:border-[#c9ded9]">
            <span aria-hidden>←</span> Visão CSO
          </Link>
        ) : <span />}
        <div className="flex gap-1 rounded-full bg-[#ecf0ef] p-1" role="group" aria-label="Fluxo">
          {(['mrr', 'nrr'] as Fluxo[]).map(f => (
            <button
              key={f}
              type="button"
              aria-pressed={fluxo === f}
              onClick={() => setFluxo(f)}
              className={`rounded-full px-3 py-1 text-[12px] font-bold transition-none ${fluxo === f ? 'bg-white text-[#0d2340] shadow' : 'text-[#3f5d59]'}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* CSO: quem responde abaixo são os territórios. */}
      {nivel === 'cso' && (
        <section aria-labelledby="territorios-abaixo" className="grid gap-2">
          <h2 id="territorios-abaixo" className="px-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[#50647d]">
            Territórios · quem responde abaixo
          </h2>
          <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {linhas.map(l => (
              <CartaoNivel
                key={l.territorio.id}
                href={nav.href('territorios', { territorio: l.territorio.id, branch: ALL_FILTERS })}
                titulo={l.territorio.nome}
                subtitulo={l.territorio.ufs}
                base={l.base}
                meta={l.meta}
                pct={l.pctBase}
                farol={l.farolBase}
                rodape={`${l.filiais} ${l.filiais === 1 ? 'filial' : 'filiais'}${l.piorFilial ? ` · pior: ${l.piorFilial.sigla}` : ''}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Território: quem responde abaixo são as filiais. */}
      {nivel !== 'cso' && territorio && (
        <section aria-labelledby="filiais-abaixo" className="grid gap-2">
          <h2 id="filiais-abaixo" className="px-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[#50647d]">
            Filiais · quem responde abaixo
          </h2>
          <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {filiaisDoTerritorio.map(f => {
              const r = resultadoFilial(f, fluxo)
              const ff = forecastFluxo(recortarTerritorio(snapshot, { ...territorio, filiais: [f.sigla] }), fluxo)
              return (
                <CartaoNivel
                  key={f.sigla}
                  href={nav.href('territorios', { territorio: territorio.id, branch: f.sigla })}
                  titulo={`${f.sigla} · ${f.nome}`}
                  subtitulo={`${territorio.nome} · ${snapshot.execs.filter(e => e.filial === f.sigla).length} executivos`}
                  base={ff.base}
                  meta={r.meta}
                  pct={ff.pctBase}
                  farol={ff.farolBase}
                  rodape={nivel === 'filial' && filial?.sigla === f.sigla ? 'Aberto agora' : undefined}
                  selo={nivel === 'filial' && filial?.sigla === f.sigla}
                />
              )
            })}
          </div>
        </section>
      )}

      {nivel === 'cso' && <CsoScreen snapshot={snapshot} fluxo={fluxo} nav={nav} />}
      {nivel === 'territorio' && territorio && <TerritorioScreen snapshot={snapshot} territorio={territorio} fluxo={fluxo} nav={nav} />}
      {nivel === 'filial' && territorio && filial && <FilialScreen snapshot={snapshot} territorio={territorio} filial={filial} fluxo={fluxo} nav={nav} />}
    </div>
  )
}
