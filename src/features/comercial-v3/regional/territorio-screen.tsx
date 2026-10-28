'use client'

/**
 * Um território aberto.
 *
 * Duas variantes, e a diferença é a ordem de leitura, não o dado:
 *
 * - **Centro-Oeste** tem `desenhoProprio`: o mapa de calor por filial e rubrica
 *   é o herói da tela, logo depois dos números. É o painel do Matheus, com as
 *   correções da issue #21.
 * - **Os demais** usam o desenho padrão: o mesmo mapa, em posição de apoio,
 *   depois da comparação entre filiais. A issue #23 proíbe inventar
 *   customização territorial antes de haver necessidade demonstrada.
 *
 * O mapa é o mesmo componente nos dois casos — o que muda é onde ele aparece.
 */

import Link from 'next/link'
import type { CommercialNav } from '../nav'
import { Card, Chip, MapaCalor, P, R } from '../screens/territorios-ui'
import { calorFilialRubrica, forecastFluxo, resultadoFilial, resultadoTotal, type Fluxo, type RegionalSnapshot } from './regional-model'
import { recortarTerritorio, type Territorio } from './territorios-model'

export function TerritorioScreen({
  snapshot,
  territorio,
  fluxo,
  nav,
}: {
  snapshot: RegionalSnapshot
  territorio: Territorio
  fluxo: Fluxo
  nav: CommercialNav
}) {
  const s = recortarTerritorio(snapshot, territorio)
  const total = resultadoTotal(s, fluxo)
  const f = forecastFluxo(s, fluxo)
  const calor = calorFilialRubrica(s)
  const linhas = s.filiais
    .map(fil => ({ fil, r: resultadoFilial(fil, fluxo), f: forecastFluxo(recortarTerritorio(snapshot, { ...territorio, filiais: [fil.sigla] }), fluxo) }))
    .sort((a, b) => (a.r.pct ?? Infinity) - (b.r.pct ?? Infinity))

  const hrefFilial = (sigla: string) => nav.href('territorios', { territorio: territorio.id, branch: sigla })

  const mapa = (
    <Card
      titulo="Mapa de calor · ganho por rubrica e cenário Base"
      hint="As três colunas de rubrica medem o ganho já integrado; as duas de fluxo medem o cenário Base — onde o mês vai aterrissar. Mesma escala do farol em todas: verde ≥ 100%, amarelo ≥ 70%, cinza = sem meta."
    >
      <MapaCalor {...calor} modo="pct" />
    </Card>
  )

  return (
    <div className="grid gap-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Cenário Base {fluxo.toUpperCase()}</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{P(f.pctBase)}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">da meta · {R(f.base)} de {total.meta > 0 ? R(total.meta) : 'sem meta'}</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Ganhos no CRM</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{R(total.ganho)}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">integrado no ERP nesta competência</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Falta para 70%</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{total.meta > 0 ? R(Math.max(0, 0.7 * total.meta - f.base)) : '—'}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">no cenário Base do fluxo</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Filiais</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{s.filiais.length}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">{s.execs.length} executivos no território</div>
        </Card>
      </section>

      {territorio.desenhoProprio && mapa}

      <Card
        titulo="Filial por filial"
        hint={`Cenário Base ÷ meta, fluxo ${fluxo.toUpperCase()}. Ordenado por quem está mais longe. Abrir a filial mostra o resumo e o detalhamento.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-[12.5px]">
            <thead>
              <tr>
                <th scope="col" className="px-2 pb-1 text-left text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Filial</th>
                <th scope="col" className="px-2 pb-1 text-right text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Ganho</th>
                <th scope="col" className="px-2 pb-1 text-right text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Base</th>
                <th scope="col" className="px-2 pb-1 text-right text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Meta</th>
                <th scope="col" className="px-2 pb-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Farol do Base</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ fil, r, f: ff }) => (
                <tr key={fil.sigla}>
                  <th scope="row" className="px-2 py-2 text-left">
                    <Link href={hrefFilial(fil.sigla)} className="font-bold text-[#0d2340] underline decoration-[#c9ded9] underline-offset-2 hover:decoration-[#086b6b]">
                      {fil.sigla}
                    </Link>
                    <span className="ml-1.5 text-[11px] text-[#75869a]">{fil.nome}</span>
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums text-[#33466c]">{R(r.ganho)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-[#33466c]">{R(ff.base)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-[#33466c]">{r.meta > 0 ? R(r.meta) : '—'}</td>
                  <td className="px-2 py-2 text-center"><Chip farol={ff.farolBase}>{P(ff.pctBase)}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!territorio.desenhoProprio && mapa}

      <Card titulo={`O que distingue ${territorio.nome}`}>
        <p className="text-[13px] leading-5 text-[#33466c]">{territorio.destaque}</p>
        <p className="mt-2 text-[11.5px] leading-4 text-[#8c9a97]">{territorio.procedencia}</p>
      </Card>
    </div>
  )
}
