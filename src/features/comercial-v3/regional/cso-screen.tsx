'use client'

/**
 * CSO — o nível de cima de Territórios.
 *
 * Compara territórios com a **mesma régua** usada no território e na filial:
 * cenário Base ÷ meta, por fluxo. Não soma MRR com NRR em taxa nem em farol —
 * são fluxos separados, e a tela alterna entre eles como no resto do módulo.
 *
 * Não repete a análise do Forecast: mostra onde olhar e manda para lá. O que é
 * exclusivo deste nível é a **comparação entre territórios** e o que merece
 * atenção do CSO hoje.
 */

import Link from 'next/link'
import type { CommercialNav } from '../nav'
import { P, R, Card, Chip } from '../screens/territorios-ui'
import { VIEW_LABELS } from '../copy'
import type { Fluxo, RegionalSnapshot } from './regional-model'
import { visaoCso } from './territorios-model'

export function CsoScreen({ snapshot, fluxo, nav }: { snapshot: RegionalSnapshot; fluxo: Fluxo; nav: CommercialNav }) {
  const cso = visaoCso(snapshot, fluxo)
  const hrefTerritorio = (id: string) => nav.href('territorios', { territorio: id })

  return (
    <div className="grid gap-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Cenário Base {fluxo.toUpperCase()}</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{P(cso.total.pctBase)}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">da meta · {R(cso.total.base)} de {cso.total.meta > 0 ? R(cso.total.meta) : 'sem meta'}</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Ganhos no CRM</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{R(cso.total.ganho)}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">Ganho no CRM — não é receita nem pedido integrado</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Territórios no alvo</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">
            {cso.territorios.filter(t => t.pctBase !== null).length === 0 ? '—' : `${cso.noAlvo} de ${cso.territorios.filter(t => t.pctBase !== null).length}`}
          </div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">cenário Base ≥ 70% da meta</div>
        </Card>
        <Card>
          <span className="text-[12px] font-semibold text-[#50647d]">Filiais no recorte</span>
          <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{snapshot.filiais.length}</div>
          <div className="mt-0.5 text-[12px] text-[#63748a]">em {cso.territorios.length} territórios demonstrativos</div>
        </Card>
      </section>

      <Card
        titulo="Comparação entre territórios"
        hint={`Cenário Base ÷ meta, fluxo ${fluxo.toUpperCase()}. Ordenado por quem está mais longe do alvo. Ler o valor absoluto além do percentual: meta menor faz o % parecer melhor.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-[12.5px]">
            <thead>
              <tr>
                <th scope="col" className="px-2 pb-1 text-left text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Território</th>
                <th scope="col" className="px-2 pb-1 text-right text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Base</th>
                <th scope="col" className="px-2 pb-1 text-right text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Meta</th>
                <th scope="col" className="px-2 pb-1 text-right text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Falta p/ 70%</th>
                <th scope="col" className="px-2 pb-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Farol</th>
                <th scope="col" className="px-2 pb-1 text-left text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">Pior filial</th>
              </tr>
            </thead>
            <tbody>
              {cso.territorios.map(t => (
                <tr key={t.territorio.id}>
                  <th scope="row" className="px-2 py-2 text-left">
                    <Link href={hrefTerritorio(t.territorio.id)} className="font-bold text-[#0d2340] underline decoration-[#c9ded9] underline-offset-2 hover:decoration-[#086b6b]">
                      {t.territorio.nome}
                    </Link>
                    <span className="ml-1.5 text-[11px] text-[#75869a]">{t.filiais} filiais</span>
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums text-[#33466c]">{R(t.base)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-[#33466c]">{t.meta > 0 ? R(t.meta) : '—'}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-[#33466c]">{t.faltaParaAlvo === null ? '—' : R(t.faltaParaAlvo)}</td>
                  <td className="px-2 py-2 text-center"><Chip farol={t.farolBase}>{P(t.pctBase)}</Chip></td>
                  <td className="px-2 py-2 text-[#33466c]">
                    {t.piorFilial ? <>{t.piorFilial.sigla} · {P(t.piorFilial.pct)}</> : <span className="text-[#8c9a97]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card titulo="O que merece atenção hoje" hint="Cada frase sai de um número que está nesta tela. Não há indicador novo aqui.">
          <ul className="grid gap-2">
            {cso.atencao.map(t => (
              <li key={t} className="rounded-lg border border-[#dfe8ef] border-l-4 border-l-[#00958b] bg-white px-3 py-2 text-[13px] leading-5 text-[#33466c]">{t}</li>
            ))}
          </ul>
        </Card>

        <div className="grid gap-3">
          <Card titulo="Para onde ir daqui" hint="Territórios navega e compara; a análise profunda fica onde já existe.">
            <ul className="grid gap-2 text-[13px]">
              <li className="flex items-start gap-2"><span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00958b]" /><span><Link href={nav.href('forecast')} className="font-semibold text-[#086b6b] underline underline-offset-2">Forecast</Link> — cenários, simulação, calibração e movimentos do mês.</span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00958b]" /><span><Link href={nav.href('opportunities')} className="font-semibold text-[#086b6b] underline underline-offset-2">Oportunidades</Link> — saneamento, pendências e qualidade da carteira.</span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00958b]" /><span><Link href={nav.href('carteira')} className="font-semibold text-[#086b6b] underline underline-offset-2">Carteira</Link> — a mesma pergunta por pessoa: CSO, diretor, gerente.</span></li>
            </ul>
          </Card>

          <Card titulo="Escopo desta tela">
            <p className="text-[12.5px] leading-5 text-[#50647d]">{cso.avisoEscopo}</p>
          </Card>
        </div>
      </div>

      <p className="text-center text-[11.5px] text-[#63748a]">
        {VIEW_LABELS.territorios} · Visão CSO · cenário demonstrativo, dados fictícios. Ganho = Ganhos no CRM; pedido integrado no ERP é marco separado, não receita. MRR e NRR são lidos separadamente.
      </p>
    </div>
  )
}
