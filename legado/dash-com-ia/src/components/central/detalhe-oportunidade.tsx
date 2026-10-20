'use client'

import { ArrowLeft, ArrowRight, CalendarDays, FileCheck2, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtBRL, fmtDataCurta, fmtDataHora, fmtDias, fmtPct } from '@/lib/domain/format'
import type { CompromissoDTO, EventoTimeline, OportunidadeLinha } from '@/lib/domain/types'
import { cn } from '@/lib/utils'
import { rotuloEtapaTaxonomia, rotuloNaturezaVendaTaxonomia } from '@/lib/domain/types'
import { ErroApi, EstadoVazio, PillSituacao } from './primitivas'
import { FioDaReceita } from './fio-da-receita'
import { ProvenienciaInline } from './proveniencia-inline'
import type { IrPara } from './navegacao'
import { resolverRetornoDetalhe } from '@/lib/domain/navigation'
import { useApi, type DetalheResposta } from './use-api'

export function DetalheOportunidade({ op, irPara, de, foco }: { op: number | null; irPara: IrPara; de?: string; foco?: string }) {
  if (op === null) return <EstadoVazio titulo="Oportunidade não selecionada" descricao="Abra uma Oportunidade pela fila, pelo Radar ou por uma situação de decisão." />
  return <DetalheCarregado key={op} op={op} irPara={irPara} de={de} foco={foco} />
}

function DetalheCarregado({ op, irPara, de, foco }: { op: number; irPara: IrPara; de?: string; foco?: string }) {
  const detalhe = useApi<DetalheResposta>(`/api/oportunidades/${op}`)
  const retorno = resolverRetornoDetalhe(de, foco)
  const voltarPara = () => irPara(retorno.tela, undefined, retorno.contexto)
  const compromissosFuturos = (detalhe.dados?.compromissos ?? []).filter((item) => item.situacao === 'Agendado' && new Date(item.data_hora) > new Date()).sort((a, b) => a.data_hora.localeCompare(b.data_hora))
  const principal = (detalhe.dados?.timeline ?? []).filter(eventoPrincipal)
  const rotina = (detalhe.dados?.timeline ?? []).filter((evento) => !eventoPrincipal(evento))

  if (detalhe.carregando && !detalhe.dados) return <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5"><Skeleton className="h-32 w-full rounded-2xl" /><Skeleton className="h-44 w-full rounded-2xl" /><Skeleton className="h-72 w-full rounded-2xl" /></div>
  if (detalhe.erro || !detalhe.dados) return <ErroApi erro={detalhe.erro ?? 'Detalhe indisponível'} aoTentar={detalhe.recarregar} />

  const dados = detalhe.dados
  const oportunidade = dados.oportunidade
  const sinalOrigem = dados.sinais_detalhe.find((sinal) => sinal.codigo === foco)

  const nomeValor = oportunidade.situacao === 'Aberta' ? 'Valor previsto' : oportunidade.situacao === 'Ganha' ? 'Valor fechado' : 'Valor da Oportunidade'
  const valor = oportunidade.situacao === 'Ganha' ? oportunidade.valor_fechado ?? oportunidade.valor_previsto : oportunidade.valor_previsto

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 pb-8">
      {de || foco ? <FaixaOrigem de={de} sinal={sinalOrigem} oportunidade={oportunidade} voltarPara={voltarPara} /> : null}

      <header className="rounded-2xl border border-border bg-white p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={voltarPara} className="-ml-2 h-9 rounded-lg px-2 text-muted-foreground"><ArrowLeft data-icon="inline-start" aria-hidden /> Voltar</Button>
          <div className="flex flex-wrap items-center gap-2"><PillSituacao situacao={oportunidade.situacao} /><span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[12px] font-medium">Etapa {rotuloEtapaTaxonomia(oportunidade.etapa_taxonomia)}</span></div>
        </div>
        <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-end">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.04em] md:text-[36px]">{oportunidade.nome}</h1>
            <p className="mt-2 text-[16px] font-medium text-foreground">{dados.conta.razao_social}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
              <span>Conta {dados.conta.conta_id} · ERP {dados.conta.conta_id_erp ?? 'Não comprovado'}</span>
              <span>Filial {dados.conta.filial}</span>
              <span>{rotuloNaturezaVendaTaxonomia(oportunidade.natureza_venda_taxonomia)}</span>
              <span>{oportunidade.tipo_oportunidade ?? 'Não comprovado'} · {oportunidade.subtipo_oportunidade ?? 'Não comprovado'}</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 border-t border-border pt-4 xl:block xl:border-t-0 xl:pt-0 xl:text-right">
            <div><p className="text-[13px] font-medium text-muted-foreground">{nomeValor}</p><p className="num mt-1 text-[30px] font-semibold tracking-[-0.04em]">{fmtBRL(valor)}</p></div>
            <div className="xl:mt-3"><p className="text-[12px] text-muted-foreground">Responsável da Oportunidade</p><p className="text-[14px] font-medium">{oportunidade.responsavel_nome}</p></div>
          </div>
        </div>
      </header>

      <FioDaReceita nos={dados.fio_da_receita} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="timeline-heading" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[13px] font-medium text-[var(--senior-emerald-hover)]">Condução comercial</p><h2 id="timeline-heading" className="mt-0.5 text-[21px] font-semibold tracking-[-0.025em]">Linha do tempo</h2></div>
            <p className="text-[12px] text-muted-foreground">Ações e eventos em ordem de registro</p>
          </div>

          {principal.length ? <ol className="relative ml-2 flex flex-col gap-0 border-l border-border">{principal.map((evento, index) => <EventoItem key={`${evento.tipo_evento}-${evento.data}-${index}`} evento={evento} />)}</ol> : <p className="rounded-xl border border-dashed border-border bg-white p-5 text-[14px] text-muted-foreground">Sem ações comerciais detalhadas neste snapshot.</p>}

          {rotina.length ? <details className="mt-3 rounded-xl border border-border bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span>Outras ações e registros</span><span className="num text-muted-foreground">{rotina.length}</span></summary><ol className="border-t border-border">{rotina.map((evento, index) => <EventoItem key={`rotina-${evento.tipo_evento}-${evento.data}-${index}`} evento={evento} compacto />)}</ol></details> : null}
        </section>

        <aside aria-label="Contexto da Oportunidade" className="flex flex-col gap-4">
          <section className="chrome-glass rounded-2xl border border-white/75 p-5 shadow-[0_12px_34px_rgb(20_45_39/8%)] supports-[backdrop-filter]:bg-[var(--surface-glass)]">
            <div className="flex items-center justify-between gap-3"><h2 className="text-[16px] font-semibold">Estado atual</h2><ProvenienciaInline dados={{ fonte: 'CRM sintético local', atualizacao: dados.snapshot_em ? fmtDataHora(dados.snapshot_em) : 'Não comprovado', populacao: `Oportunidade ${oportunidade.oportunidade_id}`, regra: 'Campos do snapshot atual; histórico é exibido separadamente.', limitacao: 'Dados inteiramente fictícios. Etapa sem taxonomia confirmada aparece como não comprovada.', versao: dados.versao_snapshot }} rotulo="Fonte do estado atual" /></div>
            <div className="mt-3 divide-y divide-border/70">
              <CampoContexto titulo="Probabilidade" valor={fmtPct(oportunidade.probabilidade)} />
              <CampoContexto titulo={oportunidade.situacao === 'Aberta' ? 'Previsão atual' : 'Previsão registrada'} valor={oportunidade.previsao_atual ? fmtDataCurta(oportunidade.previsao_atual) : 'Não comprovado'} />
              <CampoContexto titulo="Responsável da Conta" valor={dados.conta.responsavel_nome} />
              <CampoContexto titulo="Responsável da Oportunidade" valor={oportunidade.responsavel_nome} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-2"><CalendarDays className="size-4 text-[var(--senior-emerald-hover)]" aria-hidden /><h2 className="text-[15px] font-semibold">Próximo compromisso</h2></div>
            {compromissosFuturos[0] ? <div className="mt-3"><p className="text-[14px] font-semibold">{compromissosFuturos[0].assunto}</p><p className="mt-1 text-[13px] text-muted-foreground">{fmtDataHora(compromissosFuturos[0].data_hora)} · {compromissosFuturos[0].atividade}</p><p className="mt-1 text-[12px] text-muted-foreground">{compromissosFuturos[0].responsavel_nome} · {compromissosFuturos[0].situacao}</p></div> : <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Nenhum compromisso futuro está registrado. Isso descreve a agenda do mock, não confirma ausência de atividade.</p>}
            {dados.compromissos.length > 1 ? <details className="mt-3 border-t border-border pt-3"><summary className="cursor-pointer text-[12px] font-medium text-[var(--senior-emerald-hover)]">Histórico de compromissos · {dados.compromissos.length}</summary><ul className="mt-2 flex flex-col gap-2">{dados.compromissos.slice(0, 8).map((item) => <li key={item.compromisso_id} className="text-[12px] leading-relaxed text-muted-foreground">{fmtDataCurta(item.data_hora)} · {item.atividade} · {item.situacao} · {item.assunto}</li>)}</ul></details> : null}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-2"><FileCheck2 className="size-4 text-[var(--senior-emerald-hover)]" aria-hidden /><h2 className="text-[15px] font-semibold">Proposta e Pedido</h2></div>
            <div className="mt-3 flex flex-col gap-3">
              <div><p className="text-[12px] text-muted-foreground">Proposta válida</p><p className="mt-0.5 text-[14px] font-medium">{dados.proposta_valida ? `${dados.proposta_valida.numero} · ${dados.proposta_valida.situacao}` : 'Não comprovada'}</p></div>
              <div className="border-t border-border pt-3"><p className="text-[12px] text-muted-foreground">Pedido posterior</p><p className="mt-0.5 text-[14px] font-medium">{dados.pedido ? `${dados.pedido.numero} · ${dados.pedido.conferido ? 'Conferido' : 'Em conferência'}` : 'Sem Pedido registrado'}</p>{dados.pedido ? <p className="mt-0.5 text-[12px] text-muted-foreground">Registrado em {fmtDataCurta(dados.pedido.data_pedido)} · {fmtBRL(dados.pedido.valor)}</p> : null}</div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-2"><UsersRound className="size-4 text-[var(--senior-emerald-hover)]" aria-hidden /><h2 className="text-[15px] font-semibold">Contexto da Conta</h2></div>
            <div className="mt-3 flex flex-col gap-3 text-[13px]">
              <div><p className="text-[12px] text-muted-foreground">Segmento · filial</p><p className="mt-0.5">{dados.conta.segmento} · {dados.conta.filial}</p></div>
              <div className="border-t border-border pt-3"><p className="text-[12px] text-muted-foreground">Concorrentes registrados</p><p className="mt-0.5">{dados.concorrentes.length ? dados.concorrentes.map((item) => `${item.nome} · ${item.situacao}`).join(' / ') : 'Não comprovados'}</p></div>
              <div className="border-t border-border pt-3"><p className="text-[12px] text-muted-foreground">QIC como referência</p><p className="mt-0.5">{dados.qic ? `${dados.qic.identificador ?? 'ID não comprovado'} · ${dados.qic.situacao}` : 'Não comprovado'}</p></div>
              <div className="border-t border-border pt-3"><p className="text-[12px] text-muted-foreground">Origem · Suborigem</p><p className="mt-0.5">{oportunidade.origem}{oportunidade.suborigem ? ` · ${oportunidade.suborigem}` : ''}</p><p className="mt-1 text-[11px] text-muted-foreground">Rótulos sintéticos; sem validação como catálogo corporativo.</p></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function FaixaOrigem({ de, sinal, oportunidade, voltarPara }: { de?: string; sinal?: { nome: string; contexto: string; decisao_pendente: string; limitacao: string }; oportunidade: OportunidadeLinha; voltarPara: () => void }) {
  return (
    <section aria-label="Contexto de origem" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--senior-emerald)]/20 bg-[var(--senior-emerald-soft)]/55 px-4 py-4 md:px-5">
      <div className="min-w-0"><p className="text-[13px] font-semibold text-[var(--senior-emerald-hover)]">Você chegou aqui porque {nomeOrigem(de)}</p><p className="mt-1 text-[14px] font-medium text-foreground">{sinal?.nome ?? `Oportunidade ${oportunidade.oportunidade_id}`} · {sinal?.contexto ?? `${fmtBRL(oportunidade.valor_previsto)} em valor previsto`}</p>{sinal?.decisao_pendente ? <p className="mt-1 text-[13px] text-muted-foreground">Decisão em aberto: {sinal.decisao_pendente}</p> : null}</div>
      <Button variant="outline" onClick={voltarPara} className="rounded-xl bg-white">Voltar à leitura <ArrowRight data-icon="inline-end" aria-hidden /></Button>
    </section>
  )
}

function EventoItem({ evento, compacto = false }: { evento: EventoTimeline; compacto?: boolean }) {
  const data = fmtDataHora(evento.data)
  const mudanca = evento.meta.muda_oportunidade === 'sim'
  const fechamento = evento.tipo_evento === 'fechamento' || evento.titulo === 'Ganho' || evento.titulo === 'Perda'
  const etiqueta = evento.tipo_evento === 'pedido' ? 'Pedido posterior' : evento.tipo_evento === 'proposta' ? 'Proposta' : evento.titulo === 'Pedido registrado' ? 'Pedido' : fechamento ? 'Win/Loss' : mudanca ? 'Mudança de etapa' : evento.tipo_evento === 'ocorrencia' ? 'Ocorrência' : evento.tipo_evento === 'criacao' ? 'Criação' : 'Ação'
  return (
    <li className={cn('relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 pl-5', compacto ? 'py-3' : 'py-4')}>
      <span className={cn('absolute -left-[5px] top-5 size-2.5 rounded-full border-2 border-background', evento.tipo_evento === 'pedido' || fechamento ? 'bg-[var(--senior-emerald)]' : evento.tipo_evento === 'ocorrencia' ? 'bg-[var(--attention-amber)]' : 'bg-slate-400')} aria-hidden />
      <div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><h3 className="text-[14px] font-semibold text-foreground">{evento.titulo}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{etiqueta}</span></div><p className="mt-1 text-[13px] leading-relaxed text-foreground/85">{evento.descricao}</p>{evento.meta.registrado_por ? <p className="mt-1 text-[12px] text-muted-foreground">Registrado por {evento.meta.registrado_por}</p> : null}<p className="mt-1 text-[11px] text-muted-foreground">Fonte: {evento.origem_dado}</p></div>
      <time className="num pt-0.5 text-[12px] text-muted-foreground">{data}</time>
    </li>
  )
}

function CampoContexto({ titulo, valor }: { titulo: string; valor: string }) {
  return <div className="flex items-baseline justify-between gap-3 py-2.5"><span className="text-[12px] text-muted-foreground">{titulo}</span><span className="text-right text-[13px] font-medium text-foreground">{valor}</span></div>
}

function eventoPrincipal(evento: EventoTimeline) {
  if (evento.tipo_evento !== 'acao') return evento.tipo_evento !== 'compromisso'
  return evento.meta.muda_oportunidade === 'sim' || evento.meta.muda_status === 'sim' || evento.titulo === 'Cadastro' || evento.titulo === 'Proposta enviada' || evento.titulo === 'Pedido registrado'
}

function nomeOrigem(de?: string) {
  const nomes: Record<string, string> = { agora: 'a leitura Agora', mudancas: 'a contribuição em Mudanças', casos: 'um caso em Decisões', radar: 'uma situação do Radar', winloss: 'a leitura Win / Loss', visao: 'o Pipeline', oportunidades: 'a fila de Oportunidades' }
  return nomes[de ?? ''] ?? 'o detalhe da Oportunidade'
}
