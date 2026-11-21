'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatarMilhoes, formatarOportunidades, formatarPercentualInteiro, formatarRealCompacto, formatarRealPreciso } from '../format'
import { MetricCard, type Tom } from './executive-ui'
import {
  atingimento,
  evolucaoSemanal,
  hrefComFiltros,
  lerCargaTeste,
  linhasSegmento,
  pluralizar,
  resumoExport,
  rotuloExport,
  referenciaPlanejamento,
  seloDoBloco,
  separarMrrNr,
  textoAtingimento,
  type LinhaSegmento,
  type OrigemBloco,
  type SeloBloco,
} from '../home-raio-x'
import { visualPreviewEnabled } from '../manual-import-client'
import type { ImportDraft } from '../manual-import-client'
import type { HomeModel, SemanaRow } from '../model'
import type { CommercialNav } from '../nav'
import type { CorteMrr } from '../central-vendas-mrr'
import { CORTES } from '../central-vendas-mrr'
import { VERTICAIS, type VerticalId } from '../org-2027'

const TOM_SELO: Record<OrigemBloco, Tom> = {
  demo: 'marca',
  teste: 'info',
  planejamento: 'atencao',
  export: 'positivo',
}

/** Selo de origem: universo, período e data de referência no mesmo lugar. */
export function SeloOrigem({ selo }: { selo: SeloBloco }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
      <span className={`revenue-pill tone-${TOM_SELO[selo.origem]}`}>{selo.rotulo}</span>
      <span>{selo.periodo} · {selo.referencia}</span>
    </p>
  )
}

function Bloco({ id, titulo, descricao, selo, children }: {
  id: string
  titulo: string
  descricao: string
  selo: SeloBloco
  children: React.ReactNode
}) {
  return (
    <section id={id} data-home-nav={id} aria-labelledby={`${id}-titulo`} className="revenue-panel vidro grid min-w-0 gap-3 scroll-mt-6">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 id={`${id}-titulo`} className="text-[18px] font-bold tracking-[-0.02em] text-ink-strong">{titulo}</h2>
          <p className="mt-0.5 text-[12px] leading-4 text-ink-muted">{descricao}</p>
        </div>
        <SeloOrigem selo={selo} />
      </header>
      {children}
    </section>
  )
}

/** A matriz de planejamento mede reais; os blocos Demo/Export medem milhões. */
const emReais = (valor: number) => formatarRealCompacto(valor)

export function BlocoResultadoDemo({ home, posicao, periodo }: { home: HomeModel; posicao: string; periodo: string }) {
  const { mrr, nrHabilitacao, nrServicos, nrTotal } = separarMrrNr(home.origem)
  const meta = home.kpis.find((kpi) => kpi.key === 'meta')?.value ?? null
  const at = atingimento(mrr, meta)
  const atComNr = atingimento(mrr + nrTotal, meta)
  return (
    <Bloco
      id="resultado-demo"
      titulo="Resultado do mês"
      descricao="Cenário demonstrativo: MRR recorrente e não recorrente em linhas separadas — não somam."
      selo={seloDoBloco('demo', periodo, `fotografia ${posicao}`)}
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <MetricCard rotulo="MRR ganho" valor={formatarMilhoes(mrr)} nota="Recorrência mensal das fechadas e ganhas" info="Só a parcela recorrente das oportunidades fechadas e ganhas no mês. Habilitação e serviço não entram aqui." tom="positivo" />
        <MetricCard rotulo="Habilitação (NR)" valor={formatarMilhoes(nrHabilitacao)} nota="Não recorrente, linha separada" info="Habilitação é não recorrente e nunca soma ao MRR." tom="info" />
        <MetricCard rotulo="Serviço (NR)" valor={formatarMilhoes(nrServicos)} nota="Não recorrente, linha separada" info="Serviço é não recorrente e nunca soma ao MRR." tom="info" />
        <MetricCard rotulo="Total não recorrente" valor={formatarMilhoes(nrTotal)} nota="Habilitação + serviço" info="Soma de habilitação e serviço, fora do MRR." tom="marca" />
      </div>
      <p className="text-[12px] leading-4 text-ink-muted">
        Meta do mês <strong className="num text-ink-strong">{formatarMilhoes(meta ?? 0)}</strong>. Atingimento de MRR{' '}
        <strong className="num text-ink-strong">{textoAtingimento(at.percentual, at.absoluto ?? 0)}</strong> — conta só a recorrência.
        {' '}Somando a NR ({formatarMilhoes(nrTotal)}), o mesmo total contra a mesma meta lê{' '}
        <strong className="num text-ink-strong">{textoAtingimento(atComNr.percentual, atComNr.absoluto ?? 0)}</strong>.
        {' '}A fonte não declara se a meta mede só recorrência ou a receita total; a definição segue pendente.
      </p>
    </Bloco>
  )
}

export function BlocoCargaTeste({ opportunities, referenceDate, periodo }: {
  opportunities: ImportDraft['opportunities']
  referenceDate: string
  periodo: string
}) {
  if (!opportunities) return null
  const registros = opportunities.records
  const leitura = lerCargaTeste(registros, referenceDate)
  const contas = new Set(registros.map((registro) => registro.accountId || registro.account)).size
  const fora = [
    leitura.foraDoMes > 0 ? `${leitura.foraDoMes} com data em outro mês` : null,
    leitura.semData > 0 ? `${leitura.semData} sem data válida` : null,
    leitura.semValor > 0 ? `${leitura.semValor} sem valor` : null,
  ].filter((item): item is string => item !== null)
  return (
    <Bloco
      id="resultado-teste"
      titulo="Carga de teste"
      descricao="Leitura da planilha importada nesta sessão, limitada à competência da carga. Não é dado real nem cenário oficial."
      selo={seloDoBloco('teste', periodo, `carga de ${referenceDate.split('-').reverse().join('/')}`)}
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <MetricCard rotulo="Ganhos no CRM (teste)" valor={leitura.mes ? formatarRealPreciso(leitura.ganhos.total) : '—'} nota={leitura.mes ? `${pluralizar(leitura.ganhos.quantidade, 'fechada e ganha', 'fechadas e ganhas')} em ${periodo}` : 'competência não identificada'} info="Soma do Valor Fechado das oportunidades ganhas com fechamento na competência. Não é MRR nem receita." tom="positivo" />
        <MetricCard rotulo="Em aberto (teste)" valor={leitura.mes ? formatarRealPreciso(leitura.emAberto.total) : '—'} nota={leitura.mes ? `${pluralizar(leitura.emAberto.quantidade, 'aberta com previsão', 'abertas com previsão')} em ${periodo}` : 'competência não identificada'} info="Soma do Valor Previsto das oportunidades abertas com previsão de fechamento na competência." tom="info" />
        <MetricCard rotulo="Oportunidades" valor={formatarOportunidades(leitura.total)} nota="Linhas lidas do arquivo" tom="marca" />
        <MetricCard rotulo="Contas" valor={`${contas}`} nota="Contas distintas na carga" tom="marca" />
      </div>
      <p className="text-[12px] leading-4 text-dado-atencao">
        {leitura.mes
          ? <>Competência <strong>{periodo}</strong> (data de referência da carga). {fora.length > 0 ? <>Fora dos totais: {fora.join(' · ')}.</> : 'Nenhum registro ficou fora da competência.'}</>
          : <>Data de referência da carga inválida: nenhum total é somado e nenhum mês é suposto.</>}
        {' '}MRR e NR: <strong>sem fonte</strong>. O CSV de teste não separa recorrência, habilitação e serviço, então nenhum valor acima é chamado de MRR.
      </p>
    </Bloco>
  )
}

export function BlocoExport({ total, filiais, periodo }: { total: { meta: number; realizado: number }; filiais: number; periodo: string }) {
  const resumo = resumoExport(total, filiais)
  return (
    <Bloco
      id="resultado-export"
      titulo={rotuloExport(visualPreviewEnabled, filiais)}
      descricao={`${visualPreviewEnabled ? 'Agregado sintético do modo visual.' : 'Agregado exportado do mês.'} Pedido integrado no ERP não é receita nem MRR; bloco isolado dos demais universos.`}
      selo={seloDoBloco(visualPreviewEnabled ? 'demo' : 'export', periodo, visualPreviewEnabled ? 'dados fictícios' : 'data de referência não declarada na fonte')}
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <MetricCard rotulo="Meta do mês (export)" valor={formatarMilhoes(resumo.meta)} nota={`${resumo.filiais} filiais no agregado`} tom="marca" />
        <MetricCard rotulo="Pedido integrado (ERP)" valor={formatarMilhoes(resumo.integrado)} nota={textoAtingimento(resumo.percentual, resumo.absoluto)} info="Situação do pedido no ERP. Não é receita, não é MRR e não entra na meta de MRR." tom="info" />
      </div>
      <p className="text-[12px] leading-4 text-ink-muted">
        Este bloco não é somado aos blocos Demo ou Teste. A fonte não declara a data de referência; a comparação com meta usa os dois valores do mesmo agregado.
      </p>
    </Bloco>
  )
}

const ROTULO_CORTE: Record<CorteMrr, string> = { geral: 'Todos', base: 'Base', novos: 'Novos' }

export function TabelaSegmentos({ nav, segmento, corte, onSegmento, onCorte }: {
  nav: CommercialNav
  segmento: VerticalId | 'todos'
  corte: CorteMrr
  onSegmento: (valor: VerticalId | 'todos') => void
  onCorte: (valor: CorteMrr) => void
}) {
  const linhas = linhasSegmento(segmento, corte)
  return (
    <Bloco
      id="resultado-segmentos"
      titulo="Segmentos"
      descricao="Planejamento 2027: base declarada com valores fictícios, não é realizado. Meta e atingimento são sintéticos. Clientes, ticket e novos clientes não têm fonte nesta base."
      selo={seloDoBloco('planejamento', '2027', referenciaPlanejamento(visualPreviewEnabled))}
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[12px] font-semibold text-ink-strong">
          Segmento
          <select
            aria-label="Segmento do painel"
            value={segmento}
            onChange={(evento) => onSegmento(evento.target.value as VerticalId | 'todos')}
            className="min-h-9 rounded-[8px] border border-hairline bg-surface-raised px-2 text-[12px] text-ink-strong"
          >
            <option value="todos">Todos os segmentos</option>
            {VERTICAIS.map((vertical) => <option key={vertical.id} value={vertical.id}>{vertical.nome}</option>)}
          </select>
        </label>
        <div role="group" aria-label="Corte do painel" className="flex overflow-hidden rounded-[8px] border border-hairline">
          {CORTES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={corte === item.id}
              onClick={() => onCorte(item.id)}
              className={`min-h-9 px-3 text-[12px] font-semibold ${corte === item.id ? 'bg-brand-escuro text-white' : 'bg-surface-raised text-ink-muted'}`}
            >
              {ROTULO_CORTE[item.id]}
            </button>
          ))}
        </div>
        {segmento === 'todos' && <span className="revenue-pill tone-marca">todos os segmentos</span>}
      </div>

      <div className="scroll-discreta overflow-x-auto rounded-[10px] border border-[#e3eaef]">
        <table className="w-full min-w-[760px] border-collapse text-left text-[12px]">
          <caption className="sr-only">Segmentos do planejamento 2027, corte {ROTULO_CORTE[corte]}</caption>
          <thead>
            <tr className="bg-[#f5f8fb] text-[11px] uppercase tracking-[0.05em] text-[#5b6b80]">
              <th scope="col" className="px-3 py-2.5 font-bold">Segmento</th>
              <th scope="col" className="px-2 py-2.5 text-right font-bold">MRR base</th>
              <th scope="col" className="px-2 py-2.5 text-right font-bold">Meta</th>
              <th scope="col" className="px-2 py-2.5 text-right font-bold">Atingimento</th>
              <th scope="col" className="px-2 py-2.5 text-right font-bold">Peso no MRR</th>
              <th scope="col" className="px-2 py-2.5 text-right font-bold">Clientes</th>
              <th scope="col" className="px-2 py-2.5 text-right font-bold">Ticket médio</th>
              <th scope="col" className="px-2 py-2.5 text-right font-bold">Novos clientes</th>
              <th scope="col" className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha: LinhaSegmento) => (
              <tr key={linha.id} className="border-t border-[#edf1f5] even:bg-[#fbfcfd]">
                <th scope="row" className="px-3 py-2 text-left font-bold text-[#0d2340]">{linha.nome}</th>
                <td className="num px-2 py-2 text-right">{emReais(linha.base)}</td>
                <td className="num px-2 py-2 text-right">{emReais(linha.meta)}</td>
                <td className="num px-2 py-2 text-right">{textoAtingimento(linha.percentual, linha.absoluto, emReais)}</td>
                <td className="num px-2 py-2 text-right">
                  {linha.peso === null ? 'sem base' : `${formatarPercentualInteiro(linha.peso)} · ${emReais(linha.pesoAbsoluto)}`}
                </td>
                <td className="px-2 py-2 text-right text-[11px] text-ink-muted">sem fonte</td>
                <td className="px-2 py-2 text-right text-[11px] text-ink-muted">sem fonte</td>
                <td className="px-2 py-2 text-right text-[11px] text-ink-muted">sem fonte</td>
                <td className="px-2 py-2 text-right">
                  <Link
                    href={hrefComFiltros(nav.href('territorios'), linha.id === 'todos' ? segmento : linha.id, corte)}
                    className="inline-flex min-h-8 items-center gap-1 text-[12px] font-semibold text-brand-escuro underline decoration-[#c9ded9] underline-offset-2 hover:decoration-[#086b6b]"
                  >
                    Territórios <ArrowRight aria-hidden className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-4 text-[#6b7d91]">
        O recorte de segmento e corte segue para Territórios no link “Territórios”. Em Territórios, o clique na célula abre o território inteiro; a vertical não é filtro de oportunidade.
      </p>
    </Bloco>
  )
}

export function BlocoEvolucaoSemanal({ semanas, temCarga, referenciaCarga, periodo }: {
  semanas: SemanaRow[]
  temCarga: boolean
  referenciaCarga: string
  periodo: string
}) {
  const linhas = evolucaoSemanal(temCarga ? [] : semanas)
  return (
    <Bloco
      id="resultado-semanal"
      titulo="Evolução semanal"
      descricao={temCarga ? 'Semanas 1 a 5: a carga de teste não traz a série semanal. Nenhum valor é estimado.' : 'Previsão acumulada do cenário por semana. Não é realizado.'}
      selo={seloDoBloco(temCarga ? 'teste' : 'demo', periodo, temCarga ? `carga de ${referenciaCarga.split('-').reverse().join('/')}` : 'série semanal do cenário')}
    >
      <div className="scroll-discreta overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[12px]">
          <caption className="sr-only">Evolução semanal do mês{temCarga ? ' da carga de teste' : ' no cenário demonstrativo'}</caption>
          <thead>
            <tr className="bg-[#f5f8fb] text-[11px] uppercase tracking-[0.05em] text-[#5b6b80]">
              <th scope="col" className="px-3 py-2 font-bold">Semana</th>
              <th scope="col" className="px-2 py-2 text-right font-bold">Previsão</th>
              <th scope="col" className="px-2 py-2 text-right font-bold">Ritmo necessário</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.week} className="border-t border-[#edf1f5]">
                <th scope="row" className="px-3 py-2 font-semibold text-[#0d2340]">{linha.label}</th>
                <td className="num px-2 py-2 text-right">{linha.forecast === null ? 'sem fonte' : formatarMilhoes(linha.forecast)}</td>
                <td className="num px-2 py-2 text-right">{linha.pace === null ? 'sem fonte' : formatarMilhoes(linha.pace)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Bloco>
  )
}
