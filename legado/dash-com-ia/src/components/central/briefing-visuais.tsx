'use client'

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CircleHelp,
  TrendingDown,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { AgoraDTO, EntraSemanaDTO, GestaoDTO, GrupoFila, MudancasDTO, NaturezaComercialMesDTO, SituacaoAtencao, UnidadeResumoDTO, VisaoDTO } from '@/lib/domain/types'
import { nomeCurtoUnidade } from '@/lib/domain/gestao'
import { fmtBRL, fmtDataCurta, fmtInt } from '@/lib/domain/format'
import { cn } from '@/lib/utils'
import { ProvenienciaInline } from './proveniencia-inline'
import { ErroApi, PillSituacao } from './primitivas'
import type { DensidadeBriefing } from './controles-briefing'
import type { IrPara } from './navegacao'

const CONFIG_FORECAST = {
  valor: { label: 'Valor previsto', color: 'var(--senior-emerald)' },
} satisfies ChartConfig

const ROTULOS_ATENCAO: Record<string, string> = {
  R1: 'Previsão vencida',
  R2: 'Sem ação registrada',
  R3: 'Previsão deslocada',
  R4: 'Sem compromisso futuro',
  R5: 'Win sem Pedido',
  R6: 'Pedido não conferido',
  R7: 'Probabilidade inconsistente',
}

export function PainelForecast({
  dados,
  carregando,
  erro,
  aoTentar,
  escala,
  irPara,
}: {
  dados: MudancasDTO | null
  carregando: boolean
  erro: string | null
  aoTentar: () => void
  escala: number
  irPara: IrPara
}) {
  if (erro) return <ErroApi erro={erro} aoTentar={aoTentar} />
  if (!dados && carregando) return <Skeleton className="h-72 w-full rounded-2xl" />
  if (!dados) return <EstadoVisual titulo="Forecast indisponível" descricao="A comparação ainda não chegou nesta leitura." />

  const leitura = dados.forecast_periodo
  const chartData = [
    { rotulo: 'Leitura anterior', valor: leitura.anterior, cor: 'var(--chart-2)' },
    { rotulo: 'Leitura atual', valor: leitura.atual, cor: 'var(--senior-emerald)' },
  ]
  const tendencia = leitura.delta < 0 ? 'caiu' : leitura.delta > 0 ? 'subiu' : 'ficou estável'

  return (
    <Card aria-busy={carregando} className="overflow-hidden rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3 px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]">
            <TrendingDown className="size-4" aria-hidden /> Forecast móvel
          </p>
          <CardTitle role="heading" aria-level={2} className="mt-2 text-[18px] leading-tight tracking-[-0.025em] md:text-[19px]">Projeção móvel · {leitura.dias} dias</CardTitle>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={cn('num text-[20px] font-semibold leading-tight md:text-[23px]', leitura.delta < 0 ? 'text-[var(--critical-red)]' : leitura.delta > 0 ? 'text-[var(--success-green)]' : 'text-foreground')}>
              {leitura.delta < 0 ? '−' : leitura.delta > 0 ? '+' : ''}{fmtBRL(Math.abs(leitura.delta))}
            </span>
            <span className="text-[11px] text-muted-foreground">{tendencia} vs. leitura anterior</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{fmtDataCurta(dados.anterior_em)} → {fmtDataCurta(dados.atual_em)}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        <figure aria-describedby="briefing-forecast-summary" className="min-w-0">
          <ChartContainer
            config={CONFIG_FORECAST}
            className="aspect-auto w-full"
            style={{ height: `${Math.max(144, Math.round(164 * escala / 100))}px` }}
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 12, top: 8, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 5" />
              <XAxis type="number" dataKey="valor" domain={[0, 'dataMax']} hide />
              <YAxis dataKey="rotulo" type="category" width={108} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipContent formatter={(valor) => fmtBRL(Number(valor))} />} />
              <Bar dataKey="valor" name="Projeção móvel" radius={[0, 8, 8, 0]} barSize={24} isAnimationActive={false}>
                {chartData.map((item) => <Cell key={item.rotulo} fill={item.cor} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
          <figcaption id="briefing-forecast-summary" className="sr-only">
            A projeção móvel {tendencia} de {fmtBRL(Math.abs(leitura.delta))}, de {fmtBRL(leitura.anterior)} para {fmtBRL(leitura.atual)}.
          </figcaption>
        </figure>

        <dl className="grid grid-cols-2 gap-2" aria-label="Valores da comparação de Forecast">
          <div className="rounded-xl bg-muted/60 px-3 py-2">
            <dt className="text-[11px] font-medium text-muted-foreground">Leitura anterior</dt>
            <dd className="num mt-0.5 text-[15px] font-semibold">{fmtBRL(leitura.anterior)}</dd>
          </div>
          <div className="rounded-xl bg-[var(--senior-emerald-soft)] px-3 py-2">
            <dt className="text-[11px] font-medium text-[var(--senior-emerald-hover)]">Agora</dt>
            <dd className="num mt-0.5 text-[15px] font-semibold text-[var(--senior-emerald-hover)]">{fmtBRL(leitura.atual)}</dd>
          </div>
        </dl>

        {leitura.concentracao.quantidade_explicam > 0 ? (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(4rem,0.75fr)] items-center gap-3">
            <p className="text-[10px] leading-snug text-muted-foreground"><strong className="font-semibold text-foreground">{fmtInt(leitura.concentracao.quantidade_explicam)} oportunidades</strong> explicam {fmtInt(leitura.concentracao.pct_explicada)}% da mudança.</p>
            <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-[var(--senior-emerald)]" style={{ width: `${Math.min(100, Math.max(0, leitura.concentracao.pct_explicada))}%` }} />
            </div>
          </div>
        ) : null}
        <p className="text-[9px] leading-relaxed text-muted-foreground">A comparação não comprova a causa comercial.</p>

        <ProvenienciaInline dados={{
          fonte: 'CRM sintético local',
          atualizacao: `Snapshot ${fmtDataCurta(dados.atual_em)}`,
          populacao: 'Oportunidades abertas com previsão na janela móvel selecionada.',
          regra: `Soma de valor previsto em janelas móveis de ${leitura.dias} dias, sem ponderação por probabilidade.`,
          limitacao: 'A leitura anterior é estado sintético documentado. A variação não demonstra causa nem atividade fora do CRM.',
          versao: 'Mock v1.1.0',
        }} rotulo="Fonte e regra do Forecast" />
        <Button type="button" variant="link" onClick={() => irPara('mudancas', undefined, { de: 'agora' })} className="h-9 w-fit px-0 text-[11px]">
          Ver fatores da mudança <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </CardContent>
    </Card>
  )
}

export function PainelPex({ visao, carregando, erro, aoTentar, escala }: { visao: VisaoDTO | null; carregando: boolean; erro: string | null; aoTentar: () => void; escala: number }) {
  if (erro) return <ErroApi erro={erro} aoTentar={aoTentar} />
  if (!visao && carregando) return <Skeleton className="h-72 w-full rounded-2xl" />
  if (!visao) return <EstadoVisual titulo="Resultado do mês indisponível" descricao="A leitura PEX não chegou nesta consulta." />

  const pex = visao.forecast_pex
  const realizado = pex.fechadas_ganhas_no_mes
  const previsto = pex.previsto_pex
  const total = pex.total_pex_mes.valor
  const pctRealizado = total > 0 ? (realizado.valor / total) * 100 : 0
  const pctPrevisto = total > 0 ? (previsto.valor / total) * 100 : 0

  return (
    <Card aria-busy={carregando} className="rounded-2xl border-[var(--senior-emerald)]/20 bg-[var(--senior-emerald-soft)]/55 shadow-sm">
      <CardHeader className="px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]"><CalendarClock className="size-4" aria-hidden /> PEX do mês</p>
            <CardTitle role="heading" aria-level={2} className="mt-2 text-[19px] leading-tight">Ganhas + previsão elegível</CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">Competência {String(pex.competencia.mes).padStart(2, '0')}/{pex.competencia.ano}</p>
          </div>
          <span className="num rounded-lg border border-[var(--senior-emerald)]/20 bg-white/80 px-2.5 py-1.5 text-[12px] font-semibold">{fmtInt(pex.total_pex_mes.quantidade)} opp.</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        <p className="num text-[29px] font-semibold leading-none tracking-[-0.04em] text-foreground md:text-[34px]">{fmtBRL(total)}</p>
        <div role="img" aria-label={`Composição PEX: ${fmtBRL(realizado.valor)} em Ganhas no mês e ${fmtBRL(previsto.valor)} em previsão elegível aberta`} className="flex overflow-hidden rounded-full bg-white" style={{ height: Math.max(10, Math.round(16 * escala / 100)) }}>
          <span className="h-full bg-[var(--senior-emerald)]" style={{ width: `${pctRealizado}%` }} />
          <span className="h-full bg-[var(--chart-2)]" style={{ width: `${pctPrevisto}%` }} />
        </div>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/70 bg-white/85 px-3 py-2.5">
            <dt className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"><span className="size-2.5 rounded-sm bg-[var(--senior-emerald)]" aria-hidden />Ganhas no mês</dt>
            <dd className="num mt-1 text-[15px] font-semibold">{fmtBRL(realizado.valor)}</dd>
            <dd className="text-[11px] text-muted-foreground">{fmtInt(realizado.quantidade)} fechamentos</dd>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/85 px-3 py-2.5">
            <dt className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"><span className="size-2.5 rounded-sm bg-[var(--chart-2)]" aria-hidden />Forecast elegível aberto</dt>
            <dd className="num mt-1 text-[15px] font-semibold">{fmtBRL(previsto.valor)}</dd>
            <dd className="text-[11px] text-muted-foreground">{fmtInt(previsto.quantidade)} oportunidades</dd>
          </div>
        </dl>
        {pex.total_pex_mes.quantidade_sem_valor > 0 ? <p className="rounded-lg bg-white/80 px-3 py-2 text-[11px] font-medium text-[var(--attention-amber)]">{fmtInt(pex.total_pex_mes.quantidade_sem_valor)} Ganhas sem valor fechado; a previsão não foi usada como substituto.</p> : null}
        <p className="text-[11px] leading-relaxed text-muted-foreground">Indicador comercial do fixture. Não equivale à receita oficial ou a Pedido conferido.</p>
        <ProvenienciaInline dados={{
          fonte: 'PDF CRM Integrado Senior MG · páginas 5 e 38; fixture local',
          atualizacao: `Snapshot ${fmtDataCurta(visao.snapshot_em)}`,
          populacao: 'Abertas elegíveis na competência, mais oportunidades Ganhas com fechamento efetivo no mês.',
          regra: pex.regra,
          limitacao: 'PEX é uma régua comercial e não substitui o reconhecimento contábil de receita nem Pedido conferido.',
          versao: 'CRM Integrado Senior MG · Mock v1.1.0',
        }} rotulo="Fonte e regra do PEX" />
      </CardContent>
    </Card>
  )
}

export function PainelNaturezas({ visao, carregando, erro, aoTentar, escala }: { visao: VisaoDTO | null; carregando: boolean; erro: string | null; aoTentar: () => void; escala: number }) {
  if (erro) return <ErroApi erro={erro} aoTentar={aoTentar} />
  if (!visao && carregando) return <Skeleton className="h-64 w-full rounded-2xl" />
  if (!visao) return <EstadoVisual titulo="Fila mensal indisponível" descricao="New Name e Cross dependem da leitura da carteira." />

  const itens = visao.naturezas_mes
  const temRegistros = itens.some((item) => item.entradas_criadas + item.ganhos_mes.quantidade + item.perdidas_mes + item.abertas_previstas_mes.quantidade > 0)

  return (
    <Card aria-busy={carregando} className="rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]">Entrada e pendência</p>
          <CardTitle role="heading" aria-level={2} className="mt-2 text-[19px] leading-tight">New Name e Cross / Up Sell</CardTitle>
          <p className="mt-1 text-[12px] text-muted-foreground">O que foi criado, ganho, perdido e ainda tem previsão neste mês.</p>
        </div>
        <span className="num rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-semibold">{String(visao.forecast_pex.competencia.mes).padStart(2, '0')}/{visao.forecast_pex.competencia.ano}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        {!temRegistros ? <EstadoVisual titulo="Sem registros dessas naturezas no recorte" descricao="Confira classificação e filial selecionadas na barra de contexto." className="p-5" /> : (
          <div className="grid gap-3 lg:grid-cols-2">
            {itens.map((item) => <LinhaNatureza key={item.natureza} item={item} escala={escala} />)}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-md border border-border bg-muted/50 px-2 py-1">Ganhas: valor fechado</span>
          <span className="rounded-md border border-border bg-muted/50 px-2 py-1">Pendentes: abertas previstas no mês</span>
          <span>Fila aberta inclui todas as etapas; não é o Forecast PEX.</span>
        </div>
        <ProvenienciaInline dados={{
          fonte: 'Briefing anterior · taxonomia e fixture sintético',
          atualizacao: `Snapshot ${fmtDataCurta(visao.snapshot_em)}`,
          populacao: 'Rótulos exatos New Name / Novo Cliente e Cross / Up Sell, mapeados como observados ou autorizados.',
          regra: 'Entradas usam criada_em; Ganhas e Perdidas usam fechamento_efetivo; pendências usam previsão_atual no mês. Valores ganhos usam valor_fechado.',
          limitacao: 'Previsão aberta por natureza não implica elegibilidade PEX. Perdas aparecem por quantidade; não somamos valor histórico ausente.',
          versao: 'Mock v1.1.0',
        }} rotulo="Fonte e regras da fila mensal" />
      </CardContent>
    </Card>
  )
}

function LinhaNatureza({ item, escala }: { item: NaturezaComercialMesDTO; escala: number }) {
  const ganhos = item.ganhos_mes.valor
  const pendente = item.abertas_previstas_mes.valor
  const total = ganhos + pendente
  const pctGanho = total > 0 ? (ganhos / total) * 100 : 0
  const pctPendente = total > 0 ? (pendente / total) * 100 : 0

  return (
    <article className="rounded-xl border border-border/80 bg-[var(--surface-base)]/70 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold">{item.rotulo}</h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Mapeamento {item.estado_mapeamento === 'observado' ? 'observado' : 'autorizado'} · fontes: {item.fontes.join(', ') || 'não identificadas'}</p>
        </div>
        <span className="rounded-md border border-border bg-white px-2 py-1 text-[10px] font-medium">{fmtInt(item.entradas_criadas)} criadas no mês</span>
      </div>
      <div role="img" aria-label={`${item.rotulo}: ${fmtBRL(ganhos)} em Ganhas, ${fmtBRL(pendente)} em abertas previstas para o mês`} className="mt-3 flex overflow-hidden rounded-full bg-white" style={{ height: Math.max(7, Math.round(12 * escala / 100)) }}>
        <span className="h-full bg-[var(--senior-emerald)]" style={{ width: `${pctGanho}%` }} />
        <span className="h-full bg-[var(--chart-2)]" style={{ width: `${pctPendente}%` }} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        <div>
          <dt className="text-[10px] text-muted-foreground">Ganhas no mês</dt>
          <dd className="num mt-0.5 text-[13px] font-semibold">{fmtInt(item.ganhos_mes.quantidade)} · {fmtBRL(ganhos)}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Abertas previstas no mês</dt>
          <dd className="num mt-0.5 text-[13px] font-semibold">{fmtInt(item.abertas_previstas_mes.quantidade)} · {fmtBRL(pendente)}</dd>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/70 pt-2 text-[10px] text-muted-foreground">
          <span>{fmtInt(item.perdidas_mes)} Perdidas no mês</span>
          {item.ganhos_mes.quantidade_sem_valor > 0 ? <span className="font-medium text-[var(--attention-amber)]">{fmtInt(item.ganhos_mes.quantidade_sem_valor)} Ganhas sem valor fechado</span> : null}
        </div>
      </dl>
    </article>
  )
}

export function PainelMovimentos({ dados, carregando, erro, aoTentar, irPara, escala }: { dados: MudancasDTO | null; carregando: boolean; erro: string | null; aoTentar: () => void; irPara: IrPara; escala: number }) {
  if (erro) return <ErroApi erro={erro} aoTentar={aoTentar} />
  if (!dados && carregando) return <Skeleton className="h-52 w-full rounded-2xl" />
  if (!dados) return <EstadoVisual titulo="Movimentos indisponíveis" descricao="A leitura comparativa ainda não está disponível." />

  const resumo = dados.resumo
  const itens = [
    { rotulo: 'Entradas', quantidade: resumo.entradas, valor: resumo.entradas_valor, tom: 'positive' as const },
    { rotulo: 'Ganhas', quantidade: resumo.saidas_ganhas, valor: resumo.saidas_ganhas_valor, tom: 'positive' as const },
    { rotulo: 'Perdidas', quantidade: resumo.saidas_perdidas, valor: resumo.saidas_perdidas_valor, tom: 'critical' as const },
    { rotulo: 'Reforecast', quantidade: resumo.deslocamentos, valor: resumo.deslocamentos_valor, tom: 'attention' as const },
    { rotulo: 'Avanços', quantidade: resumo.avancos, valor: resumo.avancos_valor, tom: 'neutral' as const },
  ]
  const maximo = Math.max(...itens.map((item) => item.valor), 1)

  return (
    <Card aria-busy={carregando} className="rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]">Pulso da venda</p>
          <CardTitle role="heading" aria-level={2} className="mt-2 text-[18px] leading-tight">Movimento entre leituras</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">{fmtDataCurta(dados.anterior_em)} → {fmtDataCurta(dados.atual_em)}</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => irPara('mudancas', undefined, { de: 'agora' })} className="h-10 shrink-0 rounded-lg px-2 text-[11px]">
          Ver movimentos <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-x-4 gap-y-3 px-4 pb-4 pt-3 sm:grid-cols-2 lg:grid-cols-5 md:px-5 md:pb-5">
        {itens.map((item) => <MiniMovimento key={item.rotulo} {...item} maximo={maximo} escala={escala} />)}
        <p className="sm:col-span-2 lg:col-span-5 text-[10px] leading-relaxed text-muted-foreground">As barras comparam valores previstos envolvidos nos movimentos; não são receita realizada. Win/Loss e PEX aparecem separados.</p>
      </CardContent>
    </Card>
  )
}

function MiniMovimento({ rotulo, quantidade, valor, maximo, tom, escala }: { rotulo: string; quantidade: number; valor: number; maximo: number; tom: 'positive' | 'critical' | 'attention' | 'neutral'; escala: number }) {
  const preenchimento = tom === 'positive' ? 'bg-[var(--senior-emerald)]' : tom === 'critical' ? 'bg-[var(--critical-red)]' : tom === 'attention' ? 'bg-[var(--attention-amber)]' : 'bg-[var(--chart-2)]'
  return (
    <div className="min-w-0 rounded-xl border border-border/70 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-muted-foreground">{rotulo}</span>
        <span className="num shrink-0 text-[16px] font-semibold">{fmtInt(quantidade)}</span>
      </div>
      <div className="mt-2 overflow-hidden rounded-full bg-muted" style={{ height: Math.max(3, Math.round(6 * escala / 100)) }} aria-hidden>
        <div className={cn('h-full rounded-full', preenchimento)} style={{ width: `${maximo ? Math.max(quantidade > 0 ? 4 : 0, (valor / maximo) * 100) : 0}%` }} />
      </div>
      <p className="num mt-1.5 truncate text-[10px] text-muted-foreground">{fmtBRL(valor)} em valor previsto</p>
    </div>
  )
}

export function PainelPipeline({ visao, carregando, erro, aoTentar, completo, irPara, escala }: { visao: VisaoDTO | null; carregando: boolean; erro: string | null; aoTentar: () => void; completo: boolean; irPara: IrPara; escala: number }) {
  if (erro) return <ErroApi erro={erro} aoTentar={aoTentar} />
  if (!visao && carregando) return <Skeleton className="h-80 w-full rounded-2xl" />
  if (!visao) return <EstadoVisual titulo="Pipeline indisponível" descricao="A composição por etapa não chegou nesta leitura." />

  const grupos: Array<{ tipo: 'privado' | 'publico' | 'nao_identificado'; rotulo: string }> = [
    { tipo: 'privado', rotulo: 'Funil privado' },
    { tipo: 'publico', rotulo: 'Funil público' },
  ]
  const desconhecidas = visao.funil.filter((item) => item.etapa_taxonomia.tipo_funil === 'nao_identificado')

  return (
    <Card aria-busy={carregando} className="rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]">Carteira aberta</p>
          <CardTitle role="heading" aria-level={2} className="mt-2 text-[19px] leading-tight">Pipeline por etapa</CardTitle>
          <p className="mt-1 text-[12px] text-muted-foreground">Valor previsto e quantidade em cada etapa observada.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => irPara('visao', undefined, { de: 'agora' })} className="h-10 shrink-0 rounded-xl bg-white px-3 text-[11px]">
          Abrir pipeline <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        <div className="grid gap-3 lg:grid-cols-2">
          {grupos.map((grupo) => {
            const itens = visao.funil.filter((item) => item.etapa_taxonomia.tipo_funil === grupo.tipo).sort((a, b) => b.valor - a.valor)
            return <GrupoPipeline key={grupo.tipo} rotulo={grupo.rotulo} itens={itens} limite={completo ? undefined : 4} escala={escala} />
          })}
        </div>
        {desconhecidas.length > 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/25 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><CircleHelp className="size-3.5" aria-hidden /> Etapa sem mapeamento comprovado</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{desconhecidas.map((item) => `${item.etapa} · ${fmtInt(item.quantidade)} · ${fmtBRL(item.valor)}`).join(' / ')}</p>
          </div>
        ) : null}
        <p className="text-[10px] leading-relaxed text-muted-foreground">Composição do pipeline aberto. Etapas não indicam conversão entre populações; SQL e Originação sem par observado permanecem não mapeadas.</p>
        <ProvenienciaInline dados={{
          fonte: 'CRM sintético local · PDF CRM Integrado MG',
          atualizacao: `Snapshot ${fmtDataCurta(visao.snapshot_em)}`,
          populacao: 'Oportunidades abertas do fixture, agrupadas por tipo exato de funil e etapa.',
          regra: 'Soma do valor previsto atual; agrupamento por modalidade, etapa bruta e estado de mapeamento.',
          limitacao: 'As contagens não são etapas de um funil de conversão. Etapas sem par comprovado ficam destacadas como não mapeadas.',
          versao: 'Mock v1.1.0',
        }} rotulo="Fonte e regra do pipeline" />
      </CardContent>
    </Card>
  )
}

function GrupoPipeline({ rotulo, itens, limite, escala }: { rotulo: string; itens: VisaoDTO['funil']; limite?: number; escala: number }) {
  const totalValor = itens.reduce((soma, item) => soma + item.valor, 0)
  const totalOportunidades = itens.reduce((soma, item) => soma + item.quantidade, 0)
  const maior = Math.max(...itens.map((item) => item.valor), 1)
  const itensVisiveis = limite === undefined ? itens : itens.slice(0, limite)

  return (
    <section aria-label={rotulo} className="rounded-xl border border-border/70 bg-[var(--surface-base)]/70 p-3.5">
      <div className="flex items-baseline justify-between gap-2 border-b border-border/70 pb-2.5">
        <h3 className="text-[13px] font-semibold">{rotulo}</h3>
        <span className="num text-[11px] text-muted-foreground">{fmtInt(totalOportunidades)} · {fmtBRL(totalValor)}</span>
      </div>
      {itensVisiveis.length === 0 ? <p className="pt-3 text-[11px] text-muted-foreground">Sem Oportunidades abertas neste funil no recorte atual.</p> : (
        <ol className="mt-3 flex flex-col gap-3">
          {itensVisiveis.map((item) => {
            const conhecido = item.etapa_taxonomia.estado_mapeamento === 'observado'
            const largura = Math.max(item.valor > 0 ? 3 : 0, (item.valor / maior) * 100)
            return (
              <li key={`${item.etapa_taxonomia.tipo_funil}:${item.etapa}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn('min-w-0 truncate text-[11px] font-medium', !conhecido && 'text-muted-foreground')}>{item.etapa_taxonomia.rotulo}</span>
                  <span className="num shrink-0 text-[11px] font-semibold">{fmtBRL(item.valor)}</span>
                </div>
                <div className="mt-1.5 overflow-hidden rounded-full bg-white" style={{ height: Math.max(4, Math.round(8 * escala / 100)) }} aria-hidden>
                  <div className={cn('h-full rounded-full', conhecido ? 'bg-[var(--senior-emerald)]' : 'bg-[var(--chart-3)]')} style={{ width: `${largura}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{fmtInt(item.quantidade)} oportunidades{conhecido ? '' : ' · não mapeada'}</p>
              </li>
            )
          })}
        </ol>
      )}
      {limite !== undefined && itens.length > itensVisiveis.length ? <p className="mt-2 text-[9px] text-muted-foreground">+{fmtInt(itens.length - itensVisiveis.length)} etapas no modo completo</p> : null}
    </section>
  )
}

export function PainelAtencao({ situacoes, irPara, completo, escala }: { situacoes: SituacaoAtencao[]; irPara: IrPara; completo: boolean; escala: number }) {
  const itens = completo ? situacoes : situacoes.slice(0, 3)
  const maior = Math.max(...itens.map((item) => item.impacto), 1)

  return (
    <Card className="rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--attention-amber)]">Atenção hoje</p>
          <CardTitle role="heading" aria-level={2} className="mt-2 text-[19px] leading-tight">Riscos com decisão pendente</CardTitle>
          <p className="mt-1 text-[12px] text-muted-foreground">Impacto previsto e população afetada no snapshot.</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => irPara('radar', undefined, { de: 'agora' })} className="h-10 shrink-0 rounded-lg px-2 text-[11px]">
          Radar <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        {itens.length === 0 ? <EstadoVisual titulo="Sem populações de atenção" descricao="Nenhum sinal está ativo neste recorte do snapshot." className="p-5" /> : itens.map((item, index) => {
          const critica = item.severidade === 'critica'
          const informativa = item.severidade === 'info'
          const width = Math.max(item.impacto > 0 ? 3 : 0, (item.impacto / maior) * 100)
          const tomIcone = critica
            ? 'bg-[var(--critical-red-soft)] text-[var(--critical-red)]'
            : informativa
              ? 'bg-[var(--muted)] text-[var(--chart-2)]'
              : 'bg-[var(--attention-amber-soft)] text-[var(--attention-amber)]'
          const tomEstado = critica
            ? 'bg-[var(--critical-red-soft)] text-[var(--critical-red)]'
            : informativa
              ? 'bg-[var(--muted)] text-[var(--chart-2)]'
              : 'bg-[var(--attention-amber-soft)] text-[var(--attention-amber)]'
          const rotuloSeveridade = critica ? 'Crítica' : informativa ? 'Informativa' : 'Atenção'
          const IconeSinal = informativa ? CircleHelp : AlertTriangle
          return (
            <article key={item.codigo} className="rounded-xl border border-border/70 p-3">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', tomIcone)}>
                    <IconeSinal className="size-3.5" aria-hidden />
                  </span>
                  <h3 className="truncate text-[12px] font-semibold">{ROTULOS_ATENCAO[item.codigo] ?? item.titulo}</h3>
                </div>
                <span className="num text-[12px] font-semibold">{fmtBRL(item.impacto)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">{fmtInt(item.quantidade)} oportunidades · {fmtInt(item.responsaveis)} responsáveis</span>
                <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase', tomEstado)}>{rotuloSeveridade}</span>
              </div>
              <div className="mt-2 overflow-hidden rounded-full bg-muted" style={{ height: Math.max(3, Math.round(6 * escala / 100)) }} aria-hidden>
                <div className={cn('h-full rounded-full', critica ? 'bg-[var(--critical-red)]' : informativa ? 'bg-[var(--chart-2)]' : 'bg-[var(--attention-amber)]')} style={{ width: `${width}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="max-w-[34rem] text-[10px] leading-relaxed text-muted-foreground">{item.decisao_pendente}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => irPara(item.cta.tela, undefined, { de: 'agora', foco: item.codigo })} className="h-9 rounded-lg bg-white px-2.5 text-[10px]">
                  {item.cta.rotulo} <ArrowRight data-icon="inline-end" aria-hidden />
                </Button>
              </div>
              {index < itens.length - 1 ? <span className="sr-only">Próximo sinal.</span> : null}
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function PainelAgendaResumo({ agenda, densidade, irPara, escala }: { agenda: AgoraDTO['agenda_executiva'] | null; densidade: DensidadeBriefing; irPara: IrPara; escala: number }) {
  if (!agenda) return <EstadoVisual titulo="Agenda indisponível" descricao="A fila de decisões não chegou nesta leitura." />

  const grupos: Array<{ id: GrupoFila; rotulo: string; cor: string }> = [
    { id: 'parado', rotulo: 'Sem movimento registrado', cor: 'bg-[var(--attention-amber)]' },
    { id: 'fecha_mes', rotulo: 'Elegível ao PEX', cor: 'bg-[var(--senior-emerald)]' },
    { id: 'perda_ritmo', rotulo: 'Perda de ritmo', cor: 'bg-[var(--chart-2)]' },
  ]
  const motivos = agenda.mutirao_por_motivo.map((grupo) => ({
    motivo: grupo.motivo,
    rotulo: grupo.motivo === 'previsao_vazia' ? 'Sem previsão' : grupo.motivo === 'previsao_vencida' ? 'Previsão vencida' : 'Sem compromisso',
    quantidade: grupo.oportunidade_ids.length,
  }))
  const maxMotivo = Math.max(...motivos.map((motivo) => motivo.quantidade), 1)

  return (
    <Card className="rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]">Próximas decisões</p>
          <CardTitle role="heading" aria-level={2} className="mt-2 text-[19px] leading-tight">Agenda de execução</CardTitle>
          <p className="mt-1 text-[12px] text-muted-foreground">Competência {String(agenda.competencia.mes).padStart(2, '0')}/{agenda.competencia.ano}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => irPara('casos', undefined, { de: 'agora' })} className="h-10 shrink-0 rounded-xl bg-white px-3 text-[11px]">
          Ver decisões <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {grupos.map((grupo) => {
            const oportunidades = agenda.itens.filter((item) => item.grupo === grupo.id)
            const impacto = oportunidades.reduce((soma, item) => soma + item.impacto, 0)
            const maiorGrupo = Math.max(...agenda.itens.reduce<number[]>((lista, item) => {
              if (item.grupo === grupo.id) lista.push(item.impacto)
              return lista
            }, []), 1)
            return (
              <div key={grupo.id} className="rounded-xl border border-border/70 bg-[var(--surface-base)]/70 p-3">
                <p className="text-[10px] font-medium text-muted-foreground">{grupo.rotulo}</p>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="num text-[20px] font-semibold">{fmtInt(oportunidades.length)}</span>
                  <span className="num truncate text-[11px] text-muted-foreground">{fmtBRL(impacto)}</span>
                </div>
                {oportunidades.length > 0 ? (
                  <div className="mt-2 flex gap-0.5 overflow-hidden rounded-full" style={{ height: Math.max(3, Math.round(6 * escala / 100)) }} aria-hidden>
                    {oportunidades.slice(0, 7).map((item) => <span key={item.oportunidade_id} className={cn('h-full rounded-full', grupo.cor)} style={{ width: `${Math.max(5, item.impacto / maiorGrupo * 100)}%` }} />)}
                  </div>
                ) : <p className="mt-1.5 text-[9px] leading-snug text-muted-foreground">{grupo.id === 'perda_ritmo' ? 'Sem evidência suficiente para disparar.' : 'Sem itens nesta leitura.'}</p>}
              </div>
            )
          })}
        </div>

        {motivos.length > 0 ? (
          <section aria-label="Pendências por motivo" className="rounded-xl border border-border/70 px-3 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[11px] font-semibold">Pendências a tratar</h3>
              <span className="text-[9px] text-muted-foreground">Motivos podem se sobrepor; não some as barras.</span>
            </div>
            <ul className="mt-2 flex flex-col gap-2">
              {(densidade === 'completo' ? motivos : motivos.slice(0, 3)).map((motivo) => (
                <li key={motivo.motivo} className="grid grid-cols-[6.5rem_minmax(0,1fr)_1.75rem] items-center gap-2">
                  <span className="truncate text-[10px] text-muted-foreground">{motivo.rotulo}</span>
                  <span className="overflow-hidden rounded-full bg-muted" style={{ height: Math.max(4, Math.round(8 * escala / 100)) }} aria-hidden>
                    <span className="block h-full rounded-full bg-[var(--chart-2)]" style={{ width: `${Math.max(motivo.quantidade > 0 ? 4 : 0, motivo.quantidade / maxMotivo * 100)}%` }} />
                  </span>
                  <span className="num text-right text-[10px] font-semibold">{fmtInt(motivo.quantidade)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : <p className="text-[11px] text-muted-foreground">Nenhuma pendência agrupada neste snapshot.</p>}

        <p className="text-[10px] leading-relaxed text-muted-foreground">Sem atividade registrada não significa sem trabalho. Retomada e reprogramação são apenas simulações locais.</p>
      </CardContent>
    </Card>
  )
}

export function PainelContribuicoes({ dados, carregando, erro, aoTentar, completo, irPara, escala }: { dados: MudancasDTO | null; carregando: boolean; erro: string | null; aoTentar: () => void; completo: boolean; irPara: IrPara; escala: number }) {
  if (erro) return <ErroApi erro={erro} aoTentar={aoTentar} />
  if (!dados && carregando) return <Skeleton className="h-64 w-full rounded-2xl" />
  if (!dados) return <EstadoVisual titulo="Contribuições indisponíveis" descricao="A explicação da variação não chegou nesta leitura." />

  const itens = dados.forecast_periodo.concentracao.itens
  const visiveis = completo ? itens : itens.slice(0, 4)
  const maximo = Math.max(...visiveis.map((item) => Math.abs(item.contribuicao)), 1)

  return (
    <Card aria-busy={carregando} className="rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]">Fatores de variação</p>
          <CardTitle role="heading" aria-level={2} className="mt-2 text-[19px] leading-tight">O que mudou no Forecast</CardTitle>
          <p className="mt-1 text-[12px] text-muted-foreground">Contribuições de oportunidades para entrar ou sair da janela.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => irPara('mudancas', undefined, { de: 'agora' })} className="h-10 shrink-0 rounded-xl bg-white px-3 text-[11px]">
          Ver todas <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        {visiveis.length === 0 ? <EstadoVisual titulo="Sem movimentos nesta janela" descricao="A projeção não teve contribuições registradas no período." className="p-5" /> : visiveis.map((item) => {
          const largura = Math.max(3, (Math.abs(item.contribuicao) / maximo) * 48)
          const negativa = item.contribuicao < 0
          return (
            <button
              key={item.oportunidade_id}
              type="button"
              onClick={() => irPara('detalhe', item.oportunidade_id, { de: 'agora', foco: 'forecast' })}
              aria-label={`${item.nome}, ${item.conta_fantasia}, ${negativa ? 'reduziu' : 'aumentou'} a projeção em ${fmtBRL(Math.abs(item.contribuicao))}. Abrir detalhe.`}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-border/70 px-3 py-2.5 text-left transition-colors hover:border-[var(--senior-emerald)]/40 hover:bg-[var(--senior-emerald-soft)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold">{item.nome}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{item.conta_fantasia} · {item.detalhe}</span>
              </span>
              <span className={cn('num flex items-center gap-1 text-[11px] font-semibold', negativa ? 'text-[var(--critical-red)]' : 'text-[var(--success-green)]')}>
                {negativa ? <ArrowDownRight data-icon="inline-start" aria-hidden /> : <ArrowUpRight data-icon="inline-start" aria-hidden />}
                {negativa ? '−' : '+'}{fmtBRL(Math.abs(item.contribuicao))}
              </span>
              <span className="relative col-span-2 rounded-full bg-muted" style={{ height: Math.max(3, Math.round(6 * escala / 100)) }} aria-hidden>
                <span className="absolute left-1/2 top-0 h-full w-px bg-foreground/35" />
                <span className={cn('absolute top-0 h-full rounded-full', negativa ? 'bg-[var(--critical-red)]' : 'bg-[var(--success-green)]')} style={{ left: negativa ? `${50 - largura}%` : '50%', width: `${largura}%` }} />
              </span>
            </button>
          )
        })}
        {itens.length > 0 ? <p className="text-[10px] leading-relaxed text-muted-foreground">O sinal identifica onde revisar a previsão; não prova causa comercial nem ausência de atividade.</p> : null}
      </CardContent>
    </Card>
  )
}

export function EstadoVisual({ titulo, descricao, className }: { titulo: string; descricao: string; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-dashed border-border bg-muted/20 p-7 text-center', className)}>
      <CircleHelp className="mx-auto size-5 text-muted-foreground" aria-hidden />
      <p className="mt-2 text-[13px] font-semibold">{titulo}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{descricao}</p>
    </div>
  )
}

// Dots de severidade: cópia local do padrão (agora.tsx e PainelAtencao já usam os
// mesmos tokens) — 4ª ocorrência; extração para primitivas só depois da aprovação.
const TOM_DOT_SEVERIDADE: Record<string, string> = {
  critica: 'bg-[var(--critical-red)]',
  atencao: 'bg-[var(--attention-amber)]',
  info: 'bg-[var(--chart-2)]',
}

// ---------- Cockpit de unidades (Fase 1.5) — barras CSS, zero Recharts ----------

export function PainelUnidades({
  gestao,
  filialAtiva,
  aoFiltrarFilial,
  escala,
}: {
  gestao: GestaoDTO
  filialAtiva?: string
  aoFiltrarFilial: (filial: string) => void
  escala: number
}) {
  const unidades = gestao.por_unidade
  const maior = Math.max(...unidades.map((u) => u.pipeline_valor), 1)
  const maiorEntra = Math.max(...unidades.map((u) => u.entra_7d_valor), 1)
  // Coluna de variação omitida por inteiro quando TODAS vierem null (sem estado anterior).
  const temVariacao = unidades.some((u) => u.variacao_pipeline !== null)
  const visiveis = unidades.slice(0, 10)
  const demais = unidades.slice(10)

  const renderLinha = (u: UnidadeResumoDTO) => (
    <LinhaUnidade
      key={u.filial}
      unidade={u}
      maior={maior}
      maiorEntra={maiorEntra}
      temVariacao={temVariacao}
      ativa={filialAtiva === u.filial}
      aoFiltrarFilial={aoFiltrarFilial}
      escala={escala}
    />
  )

  return (
    <Card className="rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]">Cockpit de unidades</p>
          <CardTitle role="heading" aria-level={2} className="mt-2 text-[19px] leading-tight">Pipeline por unidade</CardTitle>
          <p className="mt-1 text-[12px] text-muted-foreground">Clique filtra o briefing para a unidade; clicar de novo limpa.</p>
        </div>
        <span className="num rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-semibold">{fmtInt(unidades.length)} unid.</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        {unidades.length === 0 ? (
          <EstadoVisual titulo="Nenhuma unidade neste recorte" descricao="O snapshot não tem contas nem oportunidades para o ranking." className="p-5" />
        ) : (
          <>
            {visiveis.map(renderLinha)}
            {/* Corte Top 10: contagem sempre do array (nada de total hardcode). */}
            {demais.length > 0 ? (
              <details className="rounded-xl border border-border/70">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  <span>+{fmtInt(demais.length)} unidades com pipeline menor</span>
                  <span className="shrink-0 rounded-lg bg-muted px-2 py-0.5 text-[10px] font-medium">Expandir</span>
                </summary>
                <div className="flex flex-col gap-2 border-t border-border/70 p-2">{demais.map(renderLinha)}</div>
              </details>
            ) : null}
          </>
        )}
        <ProvenienciaInline
          dados={{
            fonte: 'CRM sintético local · agrupamento pela filial da conta',
            populacao: `Todas as ${fmtInt(unidades.length)} unidades com ao menos 1 conta no snapshot; top ${fmtInt(Math.min(10, unidades.length))} visível.`,
            regra: 'Pipeline = soma do valor previsto das abertas. Entra 7d = abertas com previsão atual entre hoje e hoje+7. Sinais = regras R1–R7 do radar agregadas por unidade; dots não somam entre regras.',
            limitacao: gestao.limitacao_ranking,
            versao: 'Mock v1.1.0',
          }}
          rotulo="Fonte e regra do cockpit"
        />
      </CardContent>
    </Card>
  )
}

function LinhaUnidade({
  unidade,
  maior,
  maiorEntra,
  temVariacao,
  ativa,
  aoFiltrarFilial,
  escala,
}: {
  unidade: UnidadeResumoDTO
  maior: number
  maiorEntra: number
  temVariacao: boolean
  ativa: boolean
  aoFiltrarFilial: (filial: string) => void
  escala: number
}) {
  const u = unidade
  const variacao = u.variacao_pipeline
  return (
    <button
      type="button"
      onClick={() => aoFiltrarFilial(u.filial)}
      aria-pressed={ativa}
      aria-label={`${nomeCurtoUnidade(u.filial)}: pipeline ${fmtBRL(u.pipeline_valor)} em ${fmtInt(u.pipeline_qtd)} oportunidades; ${fmtInt(u.entra_7d_qtd)} entradas previstas em 7 dias${variacao === null ? '' : variacao < 0 ? '; pipeline caiu desde a leitura anterior' : variacao > 0 ? '; pipeline subiu desde a leitura anterior' : '; pipeline estável'}${u.sinais.length ? `; sinais ativos ${u.sinais.map((s) => s.codigo).join(' ')}` : '; sem sinais'}.${ativa ? ' Filtro ativo; clicar de novo limpa.' : ''}`}
      className={cn(
        'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ativa
          ? 'border-[var(--senior-emerald)]/50 bg-[var(--senior-emerald-soft)]/50'
          : 'border-border/70 hover:border-[var(--senior-emerald)]/40 hover:bg-[var(--senior-emerald-soft)]/35',
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-[11px] font-semibold">{nomeCurtoUnidade(u.filial)}</span>
        {u.sinais.length > 0 ? (
          <span className="flex shrink-0 items-center gap-1" aria-hidden>
            {u.sinais.map((s) => (
              <span key={s.codigo} className={cn('size-1.5 rounded-full', TOM_DOT_SEVERIDADE[s.severidade] ?? 'bg-[var(--chart-2)]')} />
            ))}
          </span>
        ) : null}
      </span>
      <span className="num shrink-0 text-[11.5px] font-semibold">{fmtBRL(u.pipeline_valor)}</span>
      <span className="col-span-2 overflow-hidden rounded-full bg-muted" style={{ height: Math.max(3, Math.round(6 * escala / 100)) }} aria-hidden>
        <span
          className={cn('block h-full rounded-full', ativa ? 'bg-[var(--senior-emerald-hover)]' : 'bg-[var(--senior-emerald)]')}
          style={{ width: `${Math.max(u.pipeline_valor > 0 ? 3 : 0, (u.pipeline_valor / maior) * 100)}%` }}
        />
      </span>
      <span className="col-span-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="w-11 shrink-0 overflow-hidden rounded-full bg-muted" style={{ height: Math.max(2, Math.round(4 * escala / 100)) }} aria-hidden>
            <span className="block h-full rounded-full bg-[var(--chart-2)]" style={{ width: `${Math.max(u.entra_7d_valor > 0 ? 6 : 0, (u.entra_7d_valor / maiorEntra) * 100)}%` }} />
          </span>
          <span className="num truncate text-[10px] text-muted-foreground">Entra 7d {fmtInt(u.entra_7d_qtd)} · {fmtBRL(u.entra_7d_valor)}</span>
        </span>
        {temVariacao ? (
          variacao === null ? (
            <span className="num shrink-0 text-[10.5px] font-medium text-muted-foreground">—</span>
          ) : variacao === 0 ? (
            <span className="num shrink-0 text-[10.5px] font-semibold text-muted-foreground">{fmtBRL(0)}</span>
          ) : (
            <span className={cn('num flex shrink-0 items-center gap-0.5 text-[10.5px] font-semibold', variacao < 0 ? 'text-[var(--critical-red)]' : 'text-[var(--success-green)]')}>
              {variacao < 0 ? <ArrowDownRight className="size-3" aria-hidden /> : <ArrowUpRight className="size-3" aria-hidden />}
              {variacao < 0 ? '−' : '+'}{fmtBRL(Math.abs(variacao))}
            </span>
          )
        ) : null}
      </span>
    </button>
  )
}

export function PainelEntraSemana({ entra, irPara, escala }: { entra: EntraSemanaDTO; irPara: IrPara; escala: number }) {
  const maiorDia = Math.max(...entra.por_dia.map((d) => d.valor), 1)

  return (
    <Card className="rounded-2xl border-border/80 bg-white shadow-sm">
      <CardHeader className="px-4 pb-0 pt-4 md:px-5 md:pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--senior-emerald-hover)]">Cockpit · próxima semana</p>
        <CardTitle role="heading" aria-level={2} className="mt-2 text-[18px] leading-tight">Entra em 7 dias</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-3 md:px-5 md:pb-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="num text-[26px] font-semibold leading-none tracking-[-0.04em] md:text-[29px]">{fmtBRL(entra.total_valor)}</p>
          <span className="num rounded-lg bg-muted px-2.5 py-1.5 text-[12px] font-semibold">{fmtInt(entra.total_qtd)} opp.</span>
        </div>
        <div
          role="img"
          aria-label={`Entradas por dia nos próximos 7 dias a partir de ${fmtDataCurta(entra.hoje)}: ${entra.por_dia.map((d) => `dia ${d.data.slice(8, 10)}, ${fmtBRL(d.valor)}`).join('; ')}.`}
          className="flex items-end gap-1"
          style={{ height: Math.max(36, Math.round(48 * escala / 100)) }}
        >
          {entra.por_dia.map((d) => (
            <span key={d.data} className="flex h-full min-w-0 flex-1 flex-col justify-end" aria-hidden>
              <span
                className={cn('w-full rounded-t-sm', d.valor > 0 ? 'bg-[var(--senior-emerald)]' : 'bg-muted')}
                style={{ height: `${Math.max(d.valor > 0 ? 8 : 3, (d.valor / maiorDia) * 100)}%` }}
              />
            </span>
          ))}
        </div>
        <div className="flex gap-1 text-center text-[9px] text-muted-foreground" aria-hidden>
          {entra.por_dia.map((d) => (
            <span key={d.data} className="num min-w-0 flex-1">{d.data.slice(8, 10)}</span>
          ))}
        </div>
        {entra.total_qtd === 0 ? (
          <EstadoVisual titulo="Nenhuma entrada prevista nos próximos 7 dias" descricao="Zero real do recorte: nenhuma aberta com previsão na janela." className="p-4" />
        ) : (
          <div className="flex flex-col gap-2">
            {entra.top.map((o) => (
              <button
                key={o.oportunidade_id}
                type="button"
                onClick={() => irPara('detalhe', o.oportunidade_id, { de: 'agora' })}
                aria-label={`Abrir detalhe da oportunidade ${o.nome} (${o.conta_fantasia}), ${fmtBRL(o.valor_previsto)} previstos.`}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-xl border border-border/70 px-3 py-2 text-left transition-colors hover:border-[var(--senior-emerald)]/40 hover:bg-[var(--senior-emerald-soft)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold">{o.nome}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{o.conta_fantasia} · {nomeCurtoUnidade(o.filial)} · {fmtDataCurta(o.previsao_atual)}</span>
                </span>
                <span className="num shrink-0 text-[11px] font-semibold">{fmtBRL(o.valor_previsto)}</span>
              </button>
            ))}
          </div>
        )}
        <ProvenienciaInline
          dados={{
            fonte: 'CRM sintético local',
            populacao: 'Oportunidades abertas com previsão atual na janela fixa de 7 dias a partir do snapshot.',
            regra: `Mesmo critério da projeção móvel: previsão atual entre hoje (${fmtDataCurta(entra.hoje)}) e hoje+7; total e janela vêm do servidor, sem relógio do cliente.`,
            limitacao: 'Valor previsto não é receita realizada e não tem ponderação por probabilidade; previsões podem deslocar.',
            versao: 'Mock v1.1.0',
          }}
          rotulo="Fonte e regra da janela de 7 dias"
        />
      </CardContent>
    </Card>
  )
}
