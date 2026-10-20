'use client'

import { useState } from 'react'
import { ArrowRight, ChevronRight, LoaderCircle, MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtBRL, fmtDataCurta, fmtInt } from '@/lib/domain/format'
import type { AcaoSimulada, AgoraDTO, GestaoDTO, GrupoFila, ItemExigeVoceDTO, ItemFilaExecutiva, MudancasDTO, RegraRadar, VisaoDTO } from '@/lib/domain/types'
import { rotuloEtapaTaxonomia, rotuloNaturezaVendaTaxonomia } from '@/lib/domain/types'
import { nomeCurtoUnidade } from '@/lib/domain/gestao'
import { cn } from '@/lib/utils'
import { ErroApi } from './primitivas'
import type { AtualizarContexto, ContextoGlobal, IrPara } from './navegacao'
import { Agente } from './agente'
import { useApi, type EstadoApi, type RadarResposta } from './use-api'
import { ControlesBriefing, type DensidadeBriefing } from './controles-briefing'
import {
  EstadoVisual,
  PainelAgendaResumo,
  PainelAtencao,
  PainelContribuicoes,
  PainelEntraSemana,
  PainelForecast,
  PainelMovimentos,
  PainelNaturezas,
  PainelPex,
  PainelPipeline,
  PainelUnidades,
} from './briefing-visuais'
import { ProvenienciaInline } from './proveniencia-inline'

const GRUPOS_AGENDA: Array<{ id: GrupoFila; titulo: string; descricao: string }> = [
  { id: 'parado', titulo: 'Parado', descricao: 'Sem movimentação registrada há 20+ dias; isso não conclui falta de trabalho.' },
  { id: 'fecha_mes', titulo: 'Fecha o mês', descricao: 'Elegibilidade pela régua PEX na competência do snapshot.' },
  { id: 'perda_ritmo', titulo: 'Perda de ritmo', descricao: 'Sem disparo: faltam datas de entrada na etapa e percentil superior da amostra.' },
  { id: 'mutirao', titulo: 'Mutirão de pendências', descricao: 'Motivos que também exigem tratamento; podem se sobrepor a outros grupos.' },
]

const ROTULOS_MOTIVO = {
  previsao_vazia: 'Previsão não registrada',
  previsao_vencida: 'Previsão vencida',
  sem_compromisso: 'Sem compromisso futuro registrado',
  sem_atividade_registrada: 'Sem movimentação registrada há 20+ dias',
  fecha_mes: 'Elegível ao PEX no mês',
  perda_ritmo: 'Perda de ritmo',
} as const

const NOMES_FONTE = {
  pdf_crm_integrado_mg: 'PDF CRM Integrado MG',
  briefing_anterior: 'briefing anterior',
  fixture: 'fixture',
} as const

const ROTULOS_ACAO: Record<AcaoSimulada, string> = {
  abrir: 'Abrir',
  retomar: 'Simular retomada',
  reprogramar: 'Simular reprogramação',
}

export function Agora({
  irPara,
  perguntar,
  contexto,
  atualizarContexto,
}: {
  irPara: IrPara
  perguntar?: () => void
  contexto: ContextoGlobal
  atualizarContexto: AtualizarContexto
}) {
  const agora = useApi<AgoraDTO>('/api/agora')
  const mudancas = useApi<MudancasDTO>('/api/mudancas')
  const visao = useApi<VisaoDTO>('/api/visao')
  const radar = useApi<RadarResposta>('/api/radar')
  const [acoesSimuladas, setAcoesSimuladas] = useState<Record<number, AcaoSimulada>>({})
  const [escala, setEscala] = useState(100)
  const [densidade, setDensidade] = useState<DensidadeBriefing>('executivo')
  const [agendaAberta, setAgendaAberta] = useState(false)
  const completo = densidade === 'completo'

  function executarAcao(item: ItemFilaExecutiva, acao: AcaoSimulada) {
    if (acao === 'abrir') {
      irPara('detalhe', item.oportunidade_id, { de: 'agora' })
      return
    }
    setAcoesSimuladas((atual) => ({ ...atual, [item.oportunidade_id]: acao }))
  }

  const snapshot = agora.dados?.snapshot_em ?? visao.dados?.snapshot_em ?? mudancas.dados?.atual_em ?? null
  const janela = contexto.janelaForecast ?? mudancas.dados?.forecast_periodo.dias ?? 30
  const recorteAtual = [
    `${janela} dias`,
    contexto.filial ? `filial ${contexto.filial}` : null,
    contexto.classificacao ? `classificação ${contexto.classificacao}` : null,
  ].filter(Boolean).join(' · ')
  const atualizandoRecorte = Boolean(
    (agora.carregando || mudancas.carregando || visao.carregando)
    && (agora.dados || mudancas.dados || visao.dados),
  )

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--senior-emerald-hover)]">Briefing comercial · Diretoria</p>
          <h1 id="agora-titulo" className="mt-1 text-[25px] font-semibold leading-tight tracking-[-0.035em] text-foreground md:text-[30px]">Resultado, Forecast e decisão</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>{snapshot ? 'Snapshot ' + fmtDataCurta(snapshot) : 'Lendo snapshot'}</span>
            <span className="size-1 rounded-full bg-border" aria-hidden />
            <span>Base sintética local · sem integração corporativa</span>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <ControlesBriefing
            horizonte={janela as 30 | 60 | 90}
            aoAlterarHorizonte={(dias) => atualizarContexto({ janelaForecast: dias }, 'agora')}
            escala={escala}
            aoAlterarEscala={(valor) => setEscala(Math.min(130, Math.max(80, valor)))}
            densidade={densidade}
            aoAlterarDensidade={setDensidade}
          />
          {perguntar ? (
            <Button type="button" variant="outline" onClick={perguntar} className="mb-0 h-10 rounded-xl border-[var(--senior-emerald)]/25 bg-white px-3 text-[12px] text-[var(--senior-emerald-hover)]">
              <MessageSquareText data-icon="inline-start" aria-hidden />
              Pergunte à Receita
            </Button>
          ) : null}
        </div>
      </header>

      {atualizandoRecorte ? (
        <div role="status" aria-live="polite" className="flex items-start gap-2 rounded-xl border border-[var(--senior-emerald)]/20 bg-[var(--senior-emerald-soft)]/65 px-3 py-2.5 text-[11px] leading-relaxed text-[var(--senior-emerald-hover)]">
          <LoaderCircle className="mt-0.5 size-3.5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden />
          <span>Atualizando o Briefing para {recorteAtual}. Os valores visíveis podem ainda refletir o recorte anterior.</span>
        </div>
      ) : null}

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-label="Cockpit de unidades" aria-busy={visao.carregando} className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(330px,0.8fr)]">
            <div className="min-w-0">
              {/* Sem 'gestao' na resposta (erro ou contrato antigo), o painel nem monta. */}
              {visao.dados?.gestao ? (
                <PainelUnidades
                  gestao={visao.dados.gestao}
                  filialAtiva={contexto.filial}
                  aoFiltrarFilial={(filial) => atualizarContexto({ filial: contexto.filial === filial ? undefined : filial }, 'agora')}
                  escala={escala}
                />
              ) : visao.carregando ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
              ) : null}
            </div>
            <div className="min-w-0">
              {visao.dados?.gestao ? (
                <PainelEntraSemana entra={visao.dados.gestao.entra_semana} irPara={irPara} escala={escala} />
              ) : visao.carregando ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
              ) : null}
            </div>
          </section>

          <section aria-label="Resultado mensal e Forecast" aria-busy={mudancas.carregando || visao.carregando} className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(330px,0.8fr)]">
            <div className="min-w-0">
              {mudancas.erro && !mudancas.dados ? (
                <ErroApi erro={mudancas.erro} aoTentar={mudancas.recarregar} />
              ) : mudancas.dados ? (
                <PainelForecast
                  dados={mudancas.dados}
                  carregando={mudancas.carregando}
                  erro={null}
                  aoTentar={mudancas.recarregar}
                  escala={escala}
                  irPara={irPara}
                />
              ) : <Skeleton className="h-80 w-full rounded-2xl" />}
            </div>
            <div className="min-w-0">
              {visao.erro && !visao.dados ? (
                <ErroApi erro={visao.erro} aoTentar={visao.recarregar} />
              ) : visao.dados ? (
                <PainelPex visao={visao.dados} carregando={visao.carregando} erro={null} aoTentar={visao.recarregar} escala={escala} />
              ) : <Skeleton className="h-80 w-full rounded-2xl" />}
            </div>
          </section>

          {mudancas.dados ? (
            <PainelMovimentos dados={mudancas.dados} carregando={mudancas.carregando} erro={null} aoTentar={mudancas.recarregar} irPara={irPara} escala={escala} />
          ) : mudancas.erro ? null : <Skeleton className="h-48 w-full rounded-2xl" />}

          {visao.dados ? (
            <>
              <PainelNaturezas visao={visao.dados} carregando={visao.carregando} erro={null} aoTentar={visao.recarregar} escala={escala} />
              <PainelPipeline visao={visao.dados} carregando={visao.carregando} erro={null} aoTentar={visao.recarregar} completo={completo} irPara={irPara} escala={escala} />
            </>
          ) : visao.erro ? null : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          )}

          <section aria-label="Riscos e agenda" aria-busy={agora.carregando} className="grid min-w-0 gap-4 xl:grid-cols-2">
            <div className="min-w-0">
              {agora.erro && !agora.dados ? <ErroApi erro={agora.erro} aoTentar={agora.recarregar} /> : agora.dados ? (
                <PainelAtencao situacoes={agora.dados.situacoes} irPara={irPara} completo={completo} escala={escala} />
              ) : <Skeleton className="h-72 w-full rounded-2xl" />}
            </div>
            <div className="min-w-0">
              {agora.erro && !agora.dados ? null : agora.dados ? (
                <PainelAgendaResumo agenda={agora.dados.agenda_executiva} densidade={densidade} irPara={irPara} escala={escala} />
              ) : <Skeleton className="h-72 w-full rounded-2xl" />}
            </div>
          </section>

          {mudancas.dados ? (
            <PainelContribuicoes dados={mudancas.dados} carregando={mudancas.carregando} erro={null} aoTentar={mudancas.recarregar} completo={completo} irPara={irPara} escala={escala} />
          ) : mudancas.erro ? null : <Skeleton className="h-64 w-full rounded-2xl" />}

          {agora.dados ? (
            <details
              open={completo || agendaAberta}
              onToggle={(evento) => { if (!completo) setAgendaAberta(evento.currentTarget.open) }}
              className="rounded-2xl border border-border/80 bg-white shadow-sm"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-5 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">Agenda detalhada do executivo</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{fmtInt(agora.dados.agenda_executiva.itens.length)} oportunidades · ações de retomada/reprogramação são simulações locais</span>
                </span>
                <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">{completo ? 'Modo completo' : agendaAberta ? 'Recolher' : 'Expandir'}</span>
              </summary>
              <div className="flex flex-col gap-4 border-t border-border px-4 py-4 md:px-5">
                <ProvenienciaInline dados={{
                  fonte: 'PDF CRM Integrado MG · páginas 12 e 13; fixture local',
                  atualizacao: 'Snapshot ' + fmtDataCurta(agora.dados.snapshot_em),
                  populacao: 'Oportunidades abertas com previsão, compromisso e ação registrados no snapshot.',
                  regra: 'Grupos por motivo observável; desempate por dias desde a última atividade registrada, valor previsto e ID. Sem score composto.',
                  limitacao: 'Ausência de registro não prova ausência de trabalho. As ações de retomada e reprogramação são demonstrações locais.',
                  versao: 'Mock v1.1.0',
                }} rotulo="Fonte e regra da agenda" />
                <div className="grid gap-3 xl:grid-cols-2">
                  {GRUPOS_AGENDA.map((grupo) => {
                    const itens = agora.dados?.agenda_executiva.itens.filter((item) => item.grupo === grupo.id) ?? []
                    const motivos = agora.dados?.agenda_executiva.mutirao_por_motivo ?? []
                    const mutiraoIds = new Set(motivos.flatMap((item) => item.oportunidade_ids))
                    const totalMutirao = mutiraoIds.size
                    const itensVisiveis = completo ? itens : itens.slice(0, 3)
                    return (
                      <section key={grupo.id} aria-label={'Agenda ' + grupo.titulo} className="rounded-xl border border-border/70 bg-[var(--surface-base)]/50 p-3.5">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h2 className="text-[13px] font-semibold">{grupo.titulo}</h2>
                            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{grupo.id === 'perda_ritmo' ? agora.dados?.agenda_executiva.limitacao_perda_ritmo : grupo.descricao}</p>
                          </div>
                          <span className="num rounded-md border border-border bg-white px-2 py-1 text-[10px] font-semibold">{fmtInt(grupo.id === 'mutirao' ? totalMutirao : itens.length)}</span>
                        </div>
                        {grupo.id === 'mutirao' && motivos.length > 0 ? (
                          <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Contagem de motivos que podem se sobrepor">
                            {motivos.map((motivo) => (
                              <li key={motivo.motivo} className="rounded-md border border-border bg-white px-2 py-1 text-[9px] text-muted-foreground">
                                {ROTULOS_MOTIVO[motivo.motivo]} · {fmtInt(motivo.oportunidade_ids.length)}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {itensVisiveis.length > 0 ? (
                          <div className="divide-y divide-border border-y border-border">
                            {itensVisiveis.map((item) => <ItemAgenda key={item.oportunidade_id} item={item} acaoSimulada={acoesSimuladas[item.oportunidade_id]} executar={executarAcao} irPara={irPara} />)}
                          </div>
                        ) : (
                          <EstadoVisual
                            titulo={grupo.id === 'perda_ritmo' ? 'Sem evidência para classificar' : 'Nenhum item neste grupo'}
                            descricao={grupo.id === 'perda_ritmo' ? agora.dados?.agenda_executiva.limitacao_perda_ritmo ?? grupo.descricao : grupo.descricao}
                            className="p-5"
                          />
                        )}
                        {!completo && itens.length > 3 ? (
                          <Button type="button" variant="ghost" onClick={() => setDensidade('completo')} className="mt-2 h-9 rounded-lg px-2 text-[10px]">
                            Mostrar mais {fmtInt(itens.length - 3)} itens <ArrowRight data-icon="inline-end" aria-hidden />
                          </Button>
                        ) : null}
                      </section>
                    )
                  })}
                </div>
              </div>
            </details>
          ) : null}
        </div>
        <TrilhaExecucao radar={radar} gestao={visao.dados?.gestao ?? null} contexto={contexto} irPara={irPara} />
      </div>
    </div>
  )
}

function ItemAgenda({
  item,
  acaoSimulada,
  executar,
  irPara,
}: {
  item: ItemFilaExecutiva
  acaoSimulada?: AcaoSimulada
  executar: (item: ItemFilaExecutiva, acao: AcaoSimulada) => void
  irPara: IrPara
}) {
  return (
    <article className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[12px] font-semibold">{item.oportunidade_id} · {item.conta_nome}</h3>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.etapa_taxonomia.etapa_bruta} · {item.responsavel_nome} · {fmtBRL(item.impacto)}</p>
          <p className="mt-0.5 text-[9px] text-muted-foreground">{rotuloEtapaTaxonomia(item.etapa_taxonomia)} · {rotuloNaturezaVendaTaxonomia(item.natureza_venda_taxonomia)}</p>
        </div>
        <span className="num rounded-lg bg-white px-2 py-1 text-[10px] font-semibold">{item.dias_desde_ultima_atividade === null ? 'sem data de atividade' : fmtInt(item.dias_desde_ultima_atividade) + ' dias sem registro'}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {item.motivos.map((motivo) => <span key={motivo} className="rounded-full border border-border bg-white px-2 py-1 text-[9px] text-muted-foreground">{ROTULOS_MOTIVO[motivo]}</span>)}
      </div>
      <details className="rounded-lg bg-muted/40 px-3 py-2">
        <summary className="cursor-pointer text-[10px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Regra, limite e ordenação</summary>
        <div className="mt-2 flex flex-col gap-1 text-[10px] leading-relaxed text-muted-foreground">
          <p>{item.regra}</p>
          <p>{item.limitacao}</p>
          <p>Ordenação: {item.criterio_ordenacao}</p>
          <p>Fontes: {item.fontes.map((fonte) => NOMES_FONTE[fonte]).join(' · ')}</p>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-2">
        {item.acao_simulada.map((acao) => (
          <Button key={acao} type="button" size="sm" variant={acao === 'abrir' ? 'outline' : 'ghost'} onClick={() => acao === 'abrir' ? irPara('detalhe', item.oportunidade_id, { de: 'agora' }) : executar(item, acao)} className="h-10 rounded-lg px-3 text-[10px]">
            {ROTULOS_ACAO[acao]}
          </Button>
        ))}
        {acaoSimulada ? <span role="status" className="text-[10px] text-[var(--senior-emerald-hover)]">Simulação local: {ROTULOS_ACAO[acaoSimulada].toLowerCase()} · nada foi salvo.</span> : null}
      </div>
    </article>
  )
}

// ---------- Trilha de execução (briefing híbrido, Fase 1) ----------
// Coluna direita do briefing: fila "o que fazer agora" derivada de /api/radar
// (mesma URL da tela Sinais, sem endpoint novo) + Agente acoplado ao item
// aberto. Rótulos locais R1–R7: 3ª ocorrência do padrão (briefing-visuais,
// primitivas, radar) — extração para primitivas só depois da aprovação.

const NOMES_TRILHA: Record<string, string> = {
  R1: 'Previsão vencida',
  R2: 'Sem ação registrada',
  R3: 'Previsão deslocada',
  R4: 'Sem compromisso futuro',
  R5: 'Win sem Pedido',
  R6: 'Pedido não conferido',
  R7: 'Probabilidade inconsistente',
}

const TOM_DOT_SEVERIDADE: Record<string, string> = {
  critica: 'bg-[var(--critical-red)]',
  atencao: 'bg-[var(--attention-amber)]',
  info: 'bg-[var(--chart-2)]',
}

function TrilhaExecucao({
  radar,
  gestao,
  contexto,
  irPara,
}: {
  radar: EstadoApi<RadarResposta>
  gestao: GestaoDTO | null
  contexto: ContextoGlobal
  irPara: IrPara
}) {
  // Um item aberto por vez (chave 'filial:codigo' na fonte nova); o corpo é montado
  // condicionalmente, então no máximo 1 instância de Agente fica montada.
  const [aberto, setAberto] = useState<string | null>(null)
  // ponytail: densidade 'completo' não é acoplada à trilha nesta fase — a trilha já é completa por natureza (todas as regras ativas, corpo sob demanda).
  const ativas = (radar.dados?.regras ?? [])
    .filter((regra) => regra.quantidade > 0)
    .sort((a, b) => b.valor_exposto - a.valor_exposto)
  // FALLBACK: sem 'gestao' (carregando ou contrato antigo), a trilha renderiza
  // exatamente como hoje a partir de /api/radar.
  const itensGestao = gestao?.exige_voce ?? []
  const usandoGestao = itensGestao.length > 0

  return (
    <aside aria-label="Trilha de execução" className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm xl:sticky xl:top-[72px] xl:max-h-[calc(100vh-88px)]">
      <div className="flex shrink-0 flex-col gap-1 border-b border-border px-4 py-3.5 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold">Trilha de execução</h2>
          {radar.dados ? (
            <span className="num rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {fmtInt(usandoGestao ? itensGestao.length : ativas.length)} {usandoGestao ? 'itens' : 'ativas'}
            </span>
          ) : null}
        </div>
        {radar.dados ? (
          <>
            {/* ponytail: valor corrente sem comparação temporal por item — /api/radar não expõe leitura anterior (teto do DTO); a comparação continua no PainelForecast. */}
            <p className="text-[11px] leading-snug text-muted-foreground">
              <span className="num font-semibold text-foreground">{fmtBRL(radar.dados.resumo.valor_em_risco)}</span> em previsões vencidas (R1)
            </p>
            <p className="text-[10px] text-muted-foreground">Snapshot {fmtDataCurta(radar.dados.snapshot_em)}</p>
          </>
        ) : null}
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Desbloquear agora · por valor</p>
      </div>
      {radar.carregando && !radar.dados && !usandoGestao ? (
        <div className="flex flex-col gap-2 px-4 py-4 md:px-5">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : radar.erro && !radar.dados && !usandoGestao ? (
        <div className="px-4 py-4 md:px-5">
          <ErroApi erro={radar.erro} aoTentar={radar.recarregar} />
        </div>
      ) : usandoGestao ? (
        <div className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
          {itensGestao.map((item) => (
            <ItemTrilhaGestao
              key={`${item.filial}:${item.codigo}`}
              item={item}
              aberto={aberto === `${item.filial}:${item.codigo}`}
              aoAlternar={(chave, vaiAbrir) => setAberto(vaiAbrir ? chave : null)}
              contexto={contexto}
              irPara={irPara}
            />
          ))}
        </div>
      ) : ativas.length === 0 ? (
        <div className="px-4 py-4 md:px-5">
          <EstadoVisual titulo="Nenhuma situação ativa" descricao="O radar não encontrou sinais neste recorte do snapshot." />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
          {ativas.map((regra) => (
            <ItemTrilha
              key={regra.codigo}
              regra={regra}
              aberto={aberto === regra.codigo}
              aoAlternar={(codigo, vaiAbrir) => setAberto(vaiAbrir ? codigo : null)}
              contexto={contexto}
              irPara={irPara}
            />
          ))}
        </div>
      )}
      <p className="shrink-0 border-t border-border px-4 py-2.5 text-[9px] leading-relaxed text-muted-foreground md:px-5">Situações podem se sobrepor; valores não somam · somente leitura</p>
    </aside>
  )
}

function ItemTrilha({
  regra,
  aberto,
  aoAlternar,
  contexto,
  irPara,
}: {
  regra: RegraRadar
  aberto: boolean
  aoAlternar: (codigo: string, aberto: boolean) => void
  contexto: ContextoGlobal
  irPara: IrPara
}) {
  // ponytail: severidade reflete a base da regra entregue por /api/radar — a escalada (ex.: R2 > 45 dias) existe só no motor interno e não é exposta; não recalculamos.
  return (
    <details
      open={aberto}
      onToggle={(evento) => aoAlternar(regra.codigo, evento.currentTarget.open)}
      className="group"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-5 [&::-webkit-details-marker]:hidden">
        <span className={cn('size-2 shrink-0 rounded-full', TOM_DOT_SEVERIDADE[regra.severidade] ?? 'bg-[var(--chart-2)]')} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold leading-tight">{NOMES_TRILHA[regra.codigo] ?? regra.nome}</span>
          <span className="num mt-0.5 block text-[10px] text-muted-foreground">{fmtInt(regra.quantidade)} opp · {fmtInt(regra.responsaveis)} resp.</span>
        </span>
        <span className="num shrink-0 text-[11px] font-semibold">{fmtBRL(regra.valor_exposto)}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      {/* Corpo montado SOMENTE quando aberto: evita N instâncias de Agente. */}
      {aberto ? (
        <div className="flex flex-col gap-2.5 border-t border-border/70 bg-[var(--surface-base)]/50 px-4 py-3 md:px-5">
          <p className="text-[10.5px] leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Decisão pendente:</span> {regra.decisao_pendente}</p>
          <div className="flex flex-col gap-1">
            {/* regra.oportunidades já chega ordenado por valor do backend — top 3 sem reordenar */}
            {regra.oportunidades.slice(0, 3).map((o) => (
              <button
                key={o.oportunidade_id}
                type="button"
                onClick={() => irPara('detalhe', o.oportunidade_id, { de: 'agora' })}
                aria-label={`Abrir detalhe da oportunidade ${o.nome} (${o.conta_fantasia})`}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 rounded-lg border border-border/70 px-2.5 py-2 text-left transition-colors hover:border-[var(--senior-emerald)]/40 hover:bg-[var(--senior-emerald-soft)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="truncate text-[11px] font-semibold">{o.nome}</span>
                <span className="num text-[10.5px] font-semibold">{fmtBRL(o.valor_previsto)}</span>
                <span className="col-span-2 truncate text-[10px] text-muted-foreground">{o.conta_fantasia} · {o.contexto}</span>
              </button>
            ))}
          </div>
          {/* ponytail: ações da trilha são só navegação + leitura do Agente — sem motor determinístico de simulação por regra nesta fase; o selo 'simulação · nada foi salvo' permanece onde já existe (agenda detalhada). */}
          <div>
            <Button type="button" size="sm" variant="outline" onClick={() => irPara('radar', undefined, { de: 'agora', foco: regra.codigo })} className="h-9 rounded-lg bg-white px-2.5 text-[10px]">
              Ver no Radar <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          </div>
          {/* Agente acoplado: altura fixa obrigatória — dentro de <details> não há altura herdada para o modo 'painel' (h-full). */}
          <div className="h-[360px] min-h-0 overflow-hidden rounded-xl border border-border">
            <Agente modo="painel" contexto={contexto} />
          </div>
        </div>
      ) : null}
    </details>
  )
}

// ---------- Item da trilha na fonte nova (bloco gestao de /api/visao) ----------
// Agregado por UNIDADE+problema; mesmo leiauto do ItemTrilha (dot, valor, botões
// de navegação e Agente acoplado) — leitura + navegação, sem ação simulada.
function ItemTrilhaGestao({
  item,
  aberto,
  aoAlternar,
  contexto,
  irPara,
}: {
  item: ItemExigeVoceDTO
  aberto: boolean
  aoAlternar: (chave: string, aberto: boolean) => void
  contexto: ContextoGlobal
  irPara: IrPara
}) {
  // ponytail: severidade reflete a base da regra entregue no DTO — a escalada (ex.: R2 > 45 dias) existe só no motor interno e não é exposta; não recalculamos.
  const chave = `${item.filial}:${item.codigo}`
  return (
    <details
      open={aberto}
      onToggle={(evento) => aoAlternar(chave, evento.currentTarget.open)}
      className="group"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-5 [&::-webkit-details-marker]:hidden">
        <span className={cn('size-2 shrink-0 rounded-full', TOM_DOT_SEVERIDADE[item.severidade] ?? 'bg-[var(--chart-2)]')} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold leading-tight">{nomeCurtoUnidade(item.filial)} · {NOMES_TRILHA[item.codigo] ?? item.codigo}</span>
          <span className="num mt-0.5 block text-[10px] text-muted-foreground">{fmtInt(item.quantidade)} opp</span>
        </span>
        <span className="num shrink-0 text-[11px] font-semibold">{fmtBRL(item.valor_exposto)}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      {/* Corpo montado SOMENTE quando aberto: evita N instâncias de Agente. */}
      {aberto ? (
        <div className="flex flex-col gap-2.5 border-t border-border/70 bg-[var(--surface-base)]/50 px-4 py-3 md:px-5">
          <p className="text-[10.5px] leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Decisão pendente:</span> {item.decisao_pendente}</p>
          <div className="flex flex-col gap-1">
            {/* item.oportunidades chega do backend ordenado por valor — top 3 sem reordenar */}
            {item.oportunidades.slice(0, 3).map((o) => (
              <button
                key={o.oportunidade_id}
                type="button"
                onClick={() => irPara('detalhe', o.oportunidade_id, { de: 'agora' })}
                aria-label={`Abrir detalhe da oportunidade ${o.nome} (${o.conta_fantasia})`}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 rounded-lg border border-border/70 px-2.5 py-2 text-left transition-colors hover:border-[var(--senior-emerald)]/40 hover:bg-[var(--senior-emerald-soft)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="truncate text-[11px] font-semibold">{o.nome}</span>
                <span className="num text-[10.5px] font-semibold">{fmtBRL(o.valor_previsto)}</span>
                <span className="col-span-2 truncate text-[10px] text-muted-foreground">{o.conta_fantasia} · {o.contexto}</span>
              </button>
            ))}
          </div>
          <div>
            <Button type="button" size="sm" variant="outline" onClick={() => irPara('radar', undefined, { de: 'agora', foco: item.codigo })} className="h-9 rounded-lg bg-white px-2.5 text-[10px]">
              Ver no Radar <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          </div>
          <div className="h-[360px] min-h-0 overflow-hidden rounded-xl border border-border">
            <Agente modo="painel" contexto={contexto} />
          </div>
        </div>
      ) : null}
    </details>
  )
}
