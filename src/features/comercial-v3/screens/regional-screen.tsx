'use client'

/**
 * Visão Regional — painel do gerente regional (Centro-Oeste + estados).
 * Cenário 100% demonstrativo (dados fictícios). Regras em docs/adr/0006-visao-regional.md.
 * Leitura rápida no topo de cada aba; análise profunda logo abaixo.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { ViewToolbar } from '../components/view-toolbar'
import { VIEW_LABELS, VOLTAR_POR_ORIGEM } from '../copy'
import { formatarRealCompacto } from '../format'
import type { CommercialNav } from '../nav'
import {
  apostas, calibracao, CADENCIA, calorFilialDia, calorFilialRubrica, cascata, categoriaOf, concentracaoTop3, conversaoExigida,
  conversaoPorFaixa, farolOf, flagsLimpeza, FLAGS_LIMPEZA, forecastFluxo, impactoLimpeza, leitura, linhasExec, ninebox,
  escopoDoRecorte, NINEBOX_LIMITES, recortar, REGRAS, resultadoFilial, resultadoRubrica, resultadoTotal, simular, sinaisDeNota, tomDoCalor, valorFluxo,
  type CelulaCalor, type Farol, type Fluxo, type GrupoCalor, type RegionalSnapshot, type TomCalor,
} from '../regional/regional-model'

import { Barra, Card, Chip, Kpi, LegendaCalor, MapaCalor, P, R, Rm, Tabela } from './territorios-ui'

const ABAS = ['Resumo', 'Resultado', 'Forecast de outubro', 'Executivos', 'Qualidade do forecast', 'Plano da semana', 'Regras e cálculos'] as const
type Aba = (typeof ABAS)[number]

export function RegionalScreen({ snapshot, nav, from }: { snapshot: RegionalSnapshot; nav: CommercialNav; from?: Parameters<CommercialNav['href']>[0] }) {
  const [aba, setAba] = useState<Aba>('Resumo')
  const [fluxo, setFluxo] = useState<Fluxo>('mrr')
  const [filial, setFilial] = useState<string>('todas')
  const s = useMemo(() => recortar(snapshot, filial === 'todas' ? null : [filial]), [snapshot, filial])
  const origem = from ?? 'home'

  return (
    <div className="grid gap-3">
      <ViewToolbar trilha={[{ label: VIEW_LABELS.home, href: nav.href('home') }, { label: VIEW_LABELS.regional }]} voltar={{ label: VOLTAR_POR_ORIGEM[origem], href: nav.href(origem) }} />

      <section className="rounded-[10px] border border-[#dfe8ef] bg-gradient-to-br from-[#007a72] to-[#00958b] px-5 py-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-white/75">{snapshot.persona.papel}</span>
            <h1 className="text-[22px] font-bold tracking-[-0.03em]">Visão regional · {snapshot.competencia}</h1>
            <p className="mt-1 text-[12.5px] text-white/80">{snapshot.persona.nome} · {snapshot.filiais.length} filiais · dados de {snapshot.asOf.split('-').reverse().join('/')} · último dia útil que integra no ERP: {snapshot.ultimoDiaUtil.split('-').reverse().join('/')}</p>
          </div>
          <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[12px] font-semibold">Cenário demonstrativo · dados fictícios</span>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Seções" className="flex flex-wrap gap-1 rounded-full bg-[#ecf0ef] p-1">
          {ABAS.map(a => <button key={a} type="button" aria-pressed={aba === a} onClick={() => setAba(a)} className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold !transition-none ${aba === a ? 'bg-[#00544e] text-white' : 'text-[#3f5d59] hover:text-[#0d2340]'}`}>{a}</button>)}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full bg-[#ecf0ef] p-1" aria-label="Fluxo">
            {(['mrr', 'nrr'] as Fluxo[]).map(f => <button key={f} aria-pressed={fluxo === f} onClick={() => setFluxo(f)} className={`rounded-full px-3 py-1 text-[12px] font-bold !transition-none ${fluxo === f ? 'bg-white text-[#0d2340] shadow' : 'text-[#3f5d59]'}`}>{f.toUpperCase()}</button>)}
          </div>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#50647d]">Filial
            <select value={filial} onChange={e => setFilial(e.target.value)} className="rounded-lg border border-[#dfe8ef] bg-white px-2 py-1 text-[12.5px]">
              <option value="todas">Todas</option>
              {snapshot.filiais.map(f => <option key={f.sigla} value={f.sigla}>{f.sigla} · {f.nome}</option>)}
            </select>
          </label>
        </div>
      </div>

      {aba === 'Resumo' && <Resumo s={s} fluxo={fluxo} />}
      {aba === 'Resultado' && <Resultado s={s} fluxo={fluxo} />}
      {aba === 'Forecast de outubro' && <Forecast s={s} fluxo={fluxo} filial={filial} />}
      {aba === 'Executivos' && <Executivos s={s} />}
      {aba === 'Qualidade do forecast' && <Qualidade s={s} fluxo={fluxo} />}
      {aba === 'Plano da semana' && <Plano s={s} />}
      {aba === 'Regras e cálculos' && <Regras />}

      <p className="text-center text-[11.5px] text-[#63748a]">Ganho = Ganhos no CRM integrados com ERP. MRR = manutenção; NRR = licença + serviço. Probabilidades calibradas no histórico de ago e set.</p>
    </div>
  )
}

function Resumo({ s, fluxo }: { s: RegionalSnapshot; fluxo: Fluxo }) {
  const r = resultadoTotal(s, fluxo)
  const f = forecastFluxo(s, fluxo)
  const sim = simular(s, fluxo)
  const ce = conversaoExigida(f)
  const calor = calorFilialRubrica(s)
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi rotulo={`Ganho ${fluxo.toUpperCase()} × meta`} valor={P(r.pct)} sub={r.meta > 0 ? `${R(r.ganho)} de ${R(r.meta)}` : `${R(r.ganho)} · sem meta cadastrada`} farol={r.farol} />
        <Kpi rotulo="Cenário Base" valor={P(f.pctBase)} sub={`${R(f.base)} · Ganho + esperado + fora do congelado`} farol={f.farolBase} />
        <Kpi rotulo="Chance de ≥ 70% / ≥ 100%" valor={`${P(sim.probAlvo)} / ${P(sim.probMeta)}`} sub={`P10 ${R(sim.p10)} · P50 ${R(sim.p50)} · P90 ${R(sim.p90)}`} />
        <Kpi rotulo="Conversão exigida do Best case" valor={ce.coberto ? 'Coberto' : ce.comFora === null ? 'Sem Best case' : P(Math.max(0, ce.comFora))} sub={ce.comFora === null ? 'Não há Best case no pipeline para converter' : `Modelo assume ${P(ce.assumida)} · alvo 70% da meta`} farol={ce.farol} />
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card titulo="Mapa de calor · ganho por rubrica e cenário Base" hint="As três colunas de rubrica medem os Ganhos no CRM (não é receita nem pedido integrado); as duas de fluxo medem o cenário Base — onde o mês vai aterrissar. Mesma escala do farol em todas: verde ≥ 100%, amarelo ≥ 70%, cinza = sem meta.">
          <MapaCalor {...calor} modo="pct" />
        </Card>
        <Card titulo="O que os números dizem" hint="Leitura gerada a partir das regras do painel.">
          <ul className="grid gap-2">{leitura(s).map(t => <li key={t} className="rounded-lg border border-[#dfe8ef] border-l-4 border-l-[#00958b] bg-white px-3 py-2 text-[13px] leading-5 text-[#33466c]">{t}</li>)}</ul>
        </Card>
      </div>
    </div>
  )
}

function Resultado({ s, fluxo }: { s: RegionalSnapshot; fluxo: Fluxo }) {
  const rubs = [['licenca', 'Licença'], ['manutencao', 'Manutenção'], ['servico', 'Serviço']] as const
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {s.filiais.map(f => {
          const b = resultadoFilial(f, fluxo)
          return (
            <Card key={f.sigla}>
              <div className="mb-2 flex items-baseline justify-between"><h3 className="text-[16px] font-bold text-[#0d2340]">{f.sigla} <span className="text-[12px] font-medium text-[#63748a]">{f.nome}</span></h3><Chip farol={b.farol}>{P(b.pct)}</Chip></div>
              {rubs.map(([k, nome]) => {
                const rr = resultadoRubrica(f, k)
                return (
                  <div key={k} className="border-t border-dashed border-[#dfe8ef] py-2 first:border-0">
                    <div className="mb-1 flex justify-between text-[12.5px] font-bold text-[#243b56]"><span>{nome}</span><span>{P(rr.pct)}</span></div>
                    <Barra pct={rr.pct} cor={rr.farol === 'verde' ? '#00544e' : rr.farol === 'amarelo' ? '#2db5aa' : '#c0283b'} />
                    <div className="mt-1 flex justify-between text-[11px] text-[#63748a]"><span>Ganho <b className="text-[#0d2340]">{R(rr.ganho)}</b></span><span>Meta {Rm(rr.meta)} · falta {Rm(rr.falta)}</span></div>
                  </div>
                )
              })}
              <div className="mt-1 text-[11.5px] text-[#63748a]">Clientes novos: <b className="text-[#0d2340]">{f.clientesNovos}</b> de {f.metaClientesNovos}</div>
            </Card>
          )
        })}
      </div>
      <Card titulo="Mapa de calor · filial × rubrica" hint="Mesma régua do farol. Ler o valor absoluto além do %: meta menor faz o % parecer melhor.">
        <MapaCalor {...calorFilialRubrica(s)} modo="pct" />
      </Card>
    </div>
  )
}

function Forecast({ s, fluxo, filial }: { s: RegionalSnapshot; fluxo: Fluxo; filial: string }) {
  const f = forecastFluxo(s, fluxo)
  const ce = conversaoExigida(f)
  const sim = simular(s, fluxo)
  const escopo = escopoDoRecorte(filial === 'todas' ? null : [filial])
  const cal = calibracao(s.hist, fluxo)
  const faixas = conversaoPorFaixa(s, fluxo)
  const sinais = sinaisDeNota(s, fluxo)
  const casc = cascata(f)
  const max = Math.max(f.meta, f.base) * 1.05
  let acc = 0
  const coresCat = ['#00544e', '#00958b', '#2db5aa', '#73cfc7', '#bde8e4']
  const calDia = calorFilialDia(s, fluxo)
  const porFilial = s.filiais.map(fl => ({ fl, f: forecastFluxo(recortar(s, [fl.sigla]), fluxo) }))
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi rotulo="Meta" valor={R(f.meta)} sub={`Ganho ${R(f.ganho)} (${P(f.ganho / f.meta)})`} />
        <Kpi rotulo="Em andamento" valor={R(f.andamento)} sub={`Esperado ${R(f.esperado)} · em andamento não é previsão`} />
        <Kpi rotulo="Cenário Base" valor={R(f.base)} sub={`${P(f.pctBase)} da meta`} farol={f.farolBase} />
        <Kpi rotulo="Rola para novembro" valor={R(f.rola)} sub={`Perde ${R(f.perde)} · 58% do que não fecha rola`} />
      </div>

      <Card titulo="Como outubro deve fechar" hint="Do Ganho até o cenário Base, em valor esperado (valor × probabilidade). A linha marca a meta; o tracejado, 70%.">
        <div className="relative grid gap-1.5">
          {casc.map((c, i) => {
            const ini = acc; acc += c.valor
            return (
              <div key={c.rotulo} className="grid grid-cols-[150px_1fr_90px] items-center gap-2 text-[12px]">
                <span className="font-semibold text-[#243b56]">{c.rotulo}</span>
                <div className="relative h-6 rounded bg-[#f5f8f8]">
                  <div className="absolute top-0 h-full rounded" style={{ left: `${(ini / max) * 100}%`, width: `${(c.valor / max) * 100}%`, background: coresCat[i] }} />
                  <div className="absolute top-0 h-full w-0.5 bg-[#0d2340]" style={{ left: `${(f.meta / max) * 100}%` }} />
                  <div className="absolute top-0 h-full border-l-2 border-dashed border-[#b07a00]" style={{ left: `${(0.7 * f.meta / max) * 100}%` }} />
                </div>
                <span className="text-right font-bold tabular-nums text-[#0d2340]">{R(c.valor)}</span>
              </div>
            )
          })}
          <div className="grid grid-cols-[150px_1fr_90px] gap-2 border-t border-[#dfe8ef] pt-1.5 text-[12.5px] font-bold text-[#0d2340]"><span>Cenário Base</span><span>{P(f.pctBase)} da meta</span><span className="text-right">{R(f.base)}</span></div>
        </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card titulo="Commit, Best case e Pipeline" hint="Commit = A. Best case = B+ e B. Pipeline = C. D fica de fora.">
          <Tabela cab={['Categoria', 'Opps', 'Bruto', 'Esperado', 'Conv. implícita']} alinhar={['l', 'r', 'r', 'r', 'r']}
            linhas={f.categorias.map(c => [<b key="c" className="text-[#0d2340]">{c.categoria}</b>, c.n, R(c.bruto), R(c.esperado), c.bruto ? P(c.esperado / c.bruto) : '—'])} />
        </Card>
        <Card titulo="Conversão exigida do Best case" hint="Quanto do Best case precisa virar Ganho para chegar a 70% da meta. Verde até 35%, amarelo até 60%.">
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[12.5px]">
            <dt className="text-[#50647d]">Falta para 70% da meta</dt><dd className="text-right font-bold">{R(Math.max(0, ce.necessario))}</dd>
            <dt className="text-[#50647d]">Exigida sem contar o fora do congelado</dt><dd className="text-right font-bold">{ce.semFora === null ? '—' : P(Math.max(0, ce.semFora))}</dd>
            <dt className="text-[#50647d]">Exigida contando o fora do congelado</dt><dd className="text-right font-bold">{ce.comFora === null ? '—' : P(Math.max(0, ce.comFora))}</dd>
            <dt className="text-[#50647d]">Assumida pelo modelo</dt><dd className="text-right font-bold">{P(ce.assumida)}</dd>
          </dl>
          <div className="mt-3"><Chip farol={ce.farol}>{ce.coberto ? 'Commit cobre o alvo' : ce.farol === null ? 'Sem Best case para converter' : ce.farol === 'verde' ? 'Alcançável' : ce.farol === 'amarelo' ? 'Exige esforço acima do histórico' : 'Fora do histórico'}</Chip></div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card titulo="Cenários (simulação)" hint={`${sim.rodadas.toLocaleString('pt-BR')} rodadas. Cada cliente é uma decisão: várias opps do mesmo cliente contam uma vez.`}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['P10 · pessimista', sim.p10], ['P50 · mediana', sim.p50], ['P90 · otimista', sim.p90]].map(([r, v]) => (
              <div key={r as string} className="rounded-lg bg-[#f8faf9] px-2 py-2"><div className="text-[11px] text-[#63748a]">{r}</div><div className="text-[17px] font-extrabold text-[#0d2340]">{R(v as number)}</div><div className="text-[11px] text-[#63748a]">{P((v as number) / f.meta)} da meta</div></div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 text-[12.5px]">
            <div><div className="mb-1 flex justify-between"><span>Chance de ≥ 70% da meta</span><b>{P(sim.probAlvo)}</b></div><Barra pct={sim.probAlvo} /></div>
            <div><div className="mb-1 flex justify-between"><span>Chance de ≥ 100% da meta</span><b>{P(sim.probMeta)}</b></div><Barra pct={sim.probMeta} cor="#00544e" /></div>
          </div>
        </Card>
        <Card titulo="Régua de calibração" hint={`Rendimento = atingimento ÷ cobertura do congelado. Para 100% com rendimento médio de ${cal.rendimentoMedio.toFixed(2)}, o congelado precisa de ~${cal.coberturaNecessaria.toFixed(1)}x a meta.${escopo.aviso ? ` ${escopo.aviso}` : ''}`}>
          <Tabela cab={['Mês', 'Cobertura', 'Conversão', 'Rendimento', 'Atingimento', 'Fora do congelado']} alinhar={['l', 'r', 'r', 'r', 'r', 'r']}
            linhas={cal.meses.map(m => [m.mes, `${m.cobertura.toFixed(1)}x`, P(m.conversao), m.rendimento.toFixed(2), P(m.atingimento), `${P(m.shareFora)} do Ganho`])} />
        </Card>
      </div>

      <Card titulo="Mapa de calor · esperado por filial e data prevista" hint="Onde e quando o Ganho precisa aparecer. Datas depois do último dia útil não integram no mês.">
        <MapaCalor {...calDia} modo="valor" formatarColuna={c => c.split('-').reverse().slice(0, 2).join('/')} />
      </Card>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card titulo="Forecast por filial" hint="Cenário Base de cada filial no fluxo selecionado.">
          <Tabela cab={['Filial', 'Ganho', 'Esperado', 'Base', '% meta', 'Farol']} alinhar={['l', 'r', 'r', 'r', 'r', 'l']}
            linhas={porFilial.map(({ fl, f: ff }) => [<b key="f">{fl.sigla}</b>, R(ff.ganho), R(ff.esperado), R(ff.base), P(ff.pctBase), <Chip key="c" farol={ff.farolBase}>{ff.farolBase}</Chip>])} />
        </Card>
        <Card titulo="Conversão por faixa de valor e sinais de nota" hint="Régua dos meses fechados. Faixa fria = menor conversão entre faixas com 15+ opps. Sinal indica direção, não causa.">
          <Tabela cab={['Faixa', 'Opps hist.', 'Conversão', 'Aberto hoje']} alinhar={['l', 'r', 'r', 'r']}
            linhas={faixas.map(x => [<span key="r">{x.rotulo}{x.fria && <span className="ml-1.5 rounded bg-[#f9dadf] px-1.5 text-[10.5px] font-bold text-[#86172a]">fria</span>}</span>, x.n, P(x.conversaoValor), R(x.abertoAgora)])} />
          <div className="mt-3 grid gap-1.5">
            {sinais.map(x => <div key={x.sinal} className="flex flex-wrap justify-between gap-2 text-[12.5px]"><span className="text-[#33466c]">{x.sinal}</span><span><b>{P(x.com)}</b> com · {P(x.sem)} sem · {x.abertasHoje} abertas hoje</span></div>)}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Executivos({ s }: { s: RegionalSnapshot }) {
  const linhas = linhasExec(s)
  const nb = ninebox(linhas)
  const conc = concentracaoTop3(linhas)
  const [sel, setSel] = useState<string | null>(null)
  const fundo = (x: number, y: number) => (x + y >= 3 ? '#dff3ee' : x + y === 2 ? '#f3f7f6' : '#fbefef')
  const NIVEL = ['Baixo', 'Médio', 'Alto']
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi rotulo="Executivos" valor={String(linhas.length)} sub={`${linhas.filter(l => l.atingimento >= 1).length} acima da meta na média`} />
        <Kpi rotulo="Concentração top 3" valor={P(conc.share)} sub={conc.nomes.join(', ')} farol={conc.share > 0.5 ? 'amarelo' : 'verde'} />
        <Kpi rotulo="Em quadrante crítico ou de atenção" valor={String(nb.filter(c => c.y === 0 && c.x <= 1).reduce((a, c) => a + c.execs.length, 0))} sub="Atingimento < 70% e cobertura < 2,5x" />
      </div>
      <Card titulo="Nine box · atingimento × cobertura de pipeline" hint={`Y: atingimento médio (ago, set e out projetado) — baixo < ${P(NINEBOX_LIMITES.atingimento[0])}, alto ≥ ${P(NINEBOX_LIMITES.atingimento[1])}. X: pipeline aberto ÷ falta para a meta do mês — baixo < ${NINEBOX_LIMITES.cobertura[0]}x, alto ≥ ${NINEBOX_LIMITES.cobertura[1]}x.`}>
        <div className="grid grid-cols-[28px_1fr] gap-2">
          <div className="flex items-center justify-center"><span className="-rotate-90 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-[#63748a]">Atingimento →</span></div>
          <div>
            <div className="grid grid-cols-3 gap-1.5">
              {nb.map(c => (
                <div key={`${c.y}${c.x}`} className="min-h-[124px] rounded-lg border border-[#dfe8ef] p-2.5" style={{ background: fundo(c.x, c.y) }}>
                  <div className="flex items-baseline justify-between gap-1"><b className="text-[12.5px] text-[#0d2340]">{c.nome}</b><span className="text-[11px] font-bold text-[#63748a]">{c.execs.length}</span></div>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#50647d]">{c.acao}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {c.execs.map(e => <button key={e.nome} onClick={() => setSel(sel === e.nome ? null : e.nome)} className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${sel === e.nome ? 'border-[#00544e] bg-[#00544e] text-white' : 'border-[#cbd3d1] bg-white text-[#243b56]'}`}>{e.nome.split(' ')[0]} · {e.filial}</button>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-3 text-center text-[11px] font-semibold text-[#63748a]">{NIVEL.map(n => <span key={n}>{n}</span>)}</div>
            <div className="text-center text-[11px] font-bold uppercase tracking-wide text-[#63748a]">Cobertura de pipeline →</div>
          </div>
        </div>
      </Card>
      <Card titulo="Carga, esperado e histórico por executivo" hint="Clique em um nome na nine box para destacar a linha.">
        <Tabela cab={['Executivo', 'Filial', 'Meta mês', 'Ganho', 'Em andamento', 'Esperado', 'Atingimento', 'Cobertura', 'Higiene']} alinhar={['l', 'l', 'r', 'r', 'r', 'r', 'r', 'r', 'r']}
          linhas={[...linhas].sort((a, b) => b.atingimento - a.atingimento).map(l => [
            <b key="n" className={sel === l.nome ? 'rounded bg-[#ddf1ef] px-1 text-[#00544e]' : 'text-[#0d2340]'}>{l.nome}</b>, l.filial, R(l.metaMes), R(l.ganhoMes), R(l.andamento), R(l.esperado),
            <Chip key="a" farol={farolOf(l.atingimento)}>{P(l.atingimento)}</Chip>, `${l.cobertura.toFixed(1)}x`, P(l.higiene)])} />
      </Card>
    </div>
  )
}

function Qualidade({ s, fluxo }: { s: RegionalSnapshot; fluxo: Fluxo }) {
  const flags = flagsLimpeza(s)
  const comFlag = s.opps.filter(o => flags.get(o.id)?.length)
  const impacto = impactoLimpeza(s, fluxo)
  const f = forecastFluxo(s, fluxo)
  const contagem = FLAGS_LIMPEZA.map(x => ({ ...x, n: comFlag.filter(o => flags.get(o.id)!.includes(x.flag)).length })).filter(x => x.n > 0)
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi rotulo="Opps com pendência" valor={`${comFlag.length} de ${s.opps.filter(o => o.status === 'Em andamento').length}`} sub="Forecast sem próxima ação não é forecast." farol={comFlag.length > 8 ? 'vermelho' : comFlag.length > 3 ? 'amarelo' : 'verde'} />
        <Kpi rotulo={`Esperado a retirar (${fluxo.toUpperCase()})`} valor={R(impacto)} sub={`${P(impacto / Math.max(f.esperado, 1))} do esperado atual`} />
        <Kpi rotulo="Prazo da limpeza" valor="Segunda, 12h" sub="C sem próxima ação vira Postergado com data e dono até quarta." />
      </div>
      <Card titulo="O que distorce o forecast" hint="Cada regra e a ação esperada.">
        <Tabela cab={['Pendência', 'Opps', 'Ação']} alinhar={['l', 'r', 'l']} linhas={contagem.map(x => [<b key="f" className="text-[#0d2340]">{x.flag}</b>, x.n, x.acao])} />
      </Card>
      <Card titulo="Lista de limpeza">
        <Tabela cab={['Opp', 'Filial', 'Executivo', 'Cliente', 'Estágio', valorFluxoLabel(fluxo), 'Pendências', 'Nota']} alinhar={['l', 'l', 'l', 'l', 'l', 'r', 'l', 'l']}
          linhas={comFlag.map(o => [o.id, o.filial, o.exec, o.cliente, `${o.tier} · ${categoriaOf(o.tier)}`, R(valorFluxo(o, fluxo)),
            <div key="f" className="flex flex-wrap gap-1">{flags.get(o.id)!.map(fl => <span key={fl} className="rounded bg-[#f9dadf] px-1.5 py-0.5 text-[11px] font-semibold text-[#86172a]">{fl}</span>)}</div>,
            <span key="n" className="text-[12px] text-[#63748a]">{o.nota}</span>])} />
      </Card>
    </div>
  )
}

const valorFluxoLabel = (f: Fluxo) => (f === 'mrr' ? 'MRR' : 'NRR')

function Plano({ s }: { s: RegionalSnapshot }) {
  const a = apostas(s)
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi rotulo="Apostas da semana" valor={String(a.lista.length)} sub="Maiores decisões de Commit e Best case, sem pendência que zere a chance." />
        <Kpi rotulo="Cobrem do MRR esperado" valor={P(a.coberturaMrr)} />
        <Kpi rotulo="Cobrem do NRR esperado" valor={P(a.coberturaNrr)} />
      </div>
      <Card titulo="Cadência da semana">
        <div className="grid gap-0">
          {CADENCIA.map(c => <div key={c.dia} className="grid grid-cols-[56px_1fr] border-t border-[#dfe8ef] py-2 first:border-0 text-[12.5px]"><b className="text-[#00776e]">{c.dia}</b><span className="text-[#33466c]">{c.foco}<span className="block text-[#63748a]">{c.entrega}</span></span></div>)}
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CADENCIA.map(c => {
          const doDia = a.lista.filter(x => x.dia === c.dia)
          if (!doDia.length) return null
          return (
            <Card key={c.dia} titulo={`${c.dia} · ${doDia.length} aposta${doDia.length > 1 ? 's' : ''}`}>
              {doDia.map(x => (
                <div key={x.opp.id} className="border-t border-dashed border-[#dfe8ef] py-2 first:border-0">
                  <div className="flex justify-between gap-2"><b className="text-[13px] text-[#0d2340]">{x.opp.cliente}</b><em className="not-italic text-[13px] font-extrabold">{R(x.esperado)}</em></div>
                  <div className="text-[11.5px] text-[#63748a]">{x.opp.filial} · {x.opp.exec} · {x.opp.tier} · {P(x.opp.pb)}</div>
                  <p className="mt-1 text-[12.5px] text-[#33466c]">{x.opp.nota}</p>
                  <p className="text-[12.5px] text-[#00776e]"><b>Liderança:</b> {x.papel}</p>
                </div>
              ))}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Regras() {
  const grupos = [...new Set(REGRAS.map(r => r.grupo))]
  return (
    <div className="grid gap-3">
      <Card hint="Fonte única: REGRAS em regional-model.ts. Documentação completa em docs/regional/REGRAS-E-CALCULOS.md e decisão no ADR-0006." >
        <p className="text-[13px] text-[#33466c]">Todas as fórmulas, limiares e regras de negócio usados nesta visão. Mudou uma regra? Altere o modelo, o teste e este texto juntos.</p>
      </Card>
      {grupos.map(g => (
        <Card key={g} titulo={g}>
          <Tabela cab={['Indicador', 'Fórmula', 'Regra de leitura']} linhas={REGRAS.filter(r => r.grupo === g).map(r => [
            <b key="n" className="whitespace-nowrap text-[#0d2340]">{r.nome}</b>,
            <code key="f" className="block max-w-[520px] whitespace-pre-wrap rounded bg-[#f5f8f8] px-2 py-1 font-mono text-[11.5px] text-[#00544e]">{r.formula}</code>,
            r.regra])} />
        </Card>
      ))}
    </div>
  )
}
