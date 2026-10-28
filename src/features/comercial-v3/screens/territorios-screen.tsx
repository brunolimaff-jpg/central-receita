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
import { filialDoTerritorio, nivelDe, territorioPorId, TERRITORIOS } from '../regional/territorios-model'
import type { Fluxo, RegionalSnapshot } from '../regional/regional-model'

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
        O seletor é a navegação, não um filtro à parte. Escolher território muda
        o nível; escolher filial muda de novo. Assim não há estado em que o
        filtro diga uma coisa e o título diga outra.
      */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Território" className="flex flex-wrap gap-1 rounded-full bg-[#ecf0ef] p-1">
          <Link
            href={nav.href('territorios', { branch: ALL_FILTERS })}
            aria-current={nivel === 'cso' ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${nivel === 'cso' ? 'bg-[#00544e] text-white' : 'text-[#3f5d59] hover:text-[#0d2340]'}`}
          >
            Todos · CSO
          </Link>
          {TERRITORIOS.map(t => (
            <Link
              key={t.id}
              href={nav.href('territorios', { territorio: t.id, branch: ALL_FILTERS })}
              aria-current={territorio?.id === t.id ? 'page' : undefined}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${territorio?.id === t.id ? 'bg-[#00544e] text-white' : 'text-[#3f5d59] hover:text-[#0d2340]'}`}
            >
              {t.nome}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
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
          {territorio && (
            <div role="group" aria-label="Filial" className="flex flex-wrap gap-1 rounded-full bg-[#ecf0ef] p-1">
              <Link
                href={nav.href('territorios', { territorio: territorio.id, branch: ALL_FILTERS })}
                aria-current={nivel === 'territorio' ? 'page' : undefined}
                className={`rounded-full px-3 py-1 text-[12px] font-bold ${nivel === 'territorio' ? 'bg-white text-[#0d2340] shadow' : 'text-[#3f5d59] hover:text-[#0d2340]'}`}
              >
                Todas
              </Link>
              {snapshot.filiais.filter(f => territorio.filiais.includes(f.sigla)).map(f => (
                <Link
                  key={f.sigla}
                  href={nav.href('territorios', { territorio: territorio.id, branch: f.sigla })}
                  aria-current={filial?.sigla === f.sigla ? 'page' : undefined}
                  title={f.nome}
                  className={`rounded-full px-3 py-1 text-[12px] font-bold ${filial?.sigla === f.sigla ? 'bg-white text-[#0d2340] shadow' : 'text-[#3f5d59] hover:text-[#0d2340]'}`}
                >
                  {f.sigla}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {nivel === 'cso' && <CsoScreen snapshot={snapshot} fluxo={fluxo} nav={nav} />}
      {nivel === 'territorio' && territorio && <TerritorioScreen snapshot={snapshot} territorio={territorio} fluxo={fluxo} nav={nav} />}
      {nivel === 'filial' && territorio && filial && <FilialScreen snapshot={snapshot} territorio={territorio} filial={filial} fluxo={fluxo} nav={nav} />}
    </div>
  )
}
