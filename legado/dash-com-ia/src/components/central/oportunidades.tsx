'use client'

// Tela 2 — Oportunidades: fila de trabalho comercial.
// Toolbar com segmentado de situação, filtros com rótulo, chips de filtros
// ativos e tabela densa com faixa de severidade para sinais críticos.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SearchX, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CabecalhoTela, ErroApi, EsqueletoLinhas, EstadoVazio, NotaSintetico, Painel, PillSituacao, Secao, SINAIS_META } from './primitivas'
import type { ContextoGlobal, IrPara, AtualizarContexto } from '@/lib/domain/navigation'
import { useApi, useDebounce, type FilaResposta, type SqlResposta } from './use-api'
import { fmtBRL, fmtData, fmtInt } from '@/lib/domain/format'
import type { OportunidadeLinha } from '@/lib/domain/types'
import { cn } from '@/lib/utils'
import { rotuloEtapaTaxonomia, rotuloNaturezaVendaTaxonomia } from '@/lib/domain/types'

const ETAPAS = [
  { valor: 'todas', rotulo: 'Todas as etapas' },
  { valor: 'Originação', rotulo: 'Originação (briefing/fixture)' },
  { valor: 'SQL', rotulo: 'SQL (briefing/fixture)' },
  { valor: 'nao-mapeada', rotulo: 'Não mapeada' },
]
const SITUACOES_SEG = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'Aberta', rotulo: 'Abertas' },
  { valor: 'Ganha', rotulo: 'Ganhas' },
  { valor: 'Perdida', rotulo: 'Perdidas' },
]
const SINAIS = [
  { valor: 'todos', rotulo: 'Todas as situações' },
  { valor: 'R1', rotulo: SINAIS_META.R1.nome },
  { valor: 'R2', rotulo: SINAIS_META.R2.nome },
  { valor: 'R3', rotulo: SINAIS_META.R3.nome },
  { valor: 'R4', rotulo: SINAIS_META.R4.nome },
  { valor: 'R5', rotulo: SINAIS_META.R5.nome },
  { valor: 'R6', rotulo: SINAIS_META.R6.nome },
  { valor: 'R7', rotulo: SINAIS_META.R7.nome },
]
const RESPONSAVEIS = [
  { valor: 'todos', rotulo: 'Todos os responsáveis' },
  { valor: '2', rotulo: 'Rafael Nogueira' },
  { valor: '3', rotulo: 'Letícia Prado' },
  { valor: '4', rotulo: 'Diego Fernandes' },
  { valor: '6', rotulo: 'Eduardo Lima' },
  { valor: '7', rotulo: 'Patrícia Souza' },
  { valor: '9', rotulo: 'Gabriela Matos' },
]
const ORDENACOES = [
  { valor: 'valor', rotulo: 'Valor previsto' },
  { valor: 'previsao', rotulo: 'Previsão de fechamento' },
  { valor: 'risco', rotulo: 'Risco (sinais do radar)' },
  { valor: 'recente', rotulo: 'Atividade recente' },
]

// Memória de filtros no escopo do módulo: preserva a seleção quando o
// usuário navega para o detalhe e volta à fila (sem persistir entre recargas).
const MEMORIA_FILTROS = {
  situacao: 'todas',
  etapa: 'todas',
  sinal: 'todos',
  responsavel: 'todos',
  ordenar: 'valor',
  busca: '',
}

export function Oportunidades({
  irPara,
  contexto,
  atualizarContexto,
}: {
  irPara: IrPara
  contexto: ContextoGlobal
  atualizarContexto: AtualizarContexto
}) {
  const [situacao, setSituacao] = useState(MEMORIA_FILTROS.situacao)
  const [etapa, setEtapa] = useState(MEMORIA_FILTROS.etapa)
  const [sinal, setSinal] = useState(MEMORIA_FILTROS.sinal)
  const [responsavel, setResponsavel] = useState(MEMORIA_FILTROS.responsavel)
  const [ordenar, setOrdenar] = useState(MEMORIA_FILTROS.ordenar)
  const [buscaTexto, setBuscaTexto] = useState(contexto.busca || MEMORIA_FILTROS.busca)
  const busca = useDebounce(buscaTexto, 300)
  const buscaContextualAnterior = useRef(contexto.busca)

  useEffect(() => {
    if (buscaContextualAnterior.current === contexto.busca) return
    buscaContextualAnterior.current = contexto.busca
    const novaBusca = contexto.busca ?? ''
    setBuscaTexto(novaBusca)
    MEMORIA_FILTROS.busca = novaBusca
  }, [contexto.busca])

  useEffect(() => {
    MEMORIA_FILTROS.situacao = situacao
    MEMORIA_FILTROS.etapa = etapa
    MEMORIA_FILTROS.sinal = sinal
    MEMORIA_FILTROS.responsavel = responsavel
    MEMORIA_FILTROS.ordenar = ordenar
    MEMORIA_FILTROS.busca = buscaTexto
  }, [situacao, etapa, sinal, responsavel, ordenar, buscaTexto])

  const url = useMemo(() => {
    const params = new URLSearchParams({ situacao, etapa, sinal, responsavel, ordenar, busca })
    return `/api/oportunidades?${params.toString()}`
  }, [situacao, etapa, sinal, responsavel, ordenar, busca])

  const fila = useApi<FilaResposta>(url)
  const sql = useApi<SqlResposta>('/api/sql')

  const chips: Array<{ rotulo: string; limpar: () => void }> = []
  if (etapa !== 'todas') chips.push({ rotulo: `Etapa · ${etapa}`, limpar: () => setEtapa('todas') })
  if (sinal !== 'todos') chips.push({ rotulo: `Situação · ${SINAIS.find((item) => item.valor === sinal)?.rotulo ?? 'Não comprovada'}`, limpar: () => setSinal('todos') })
  if (responsavel !== 'todos')
    chips.push({
      rotulo: `Resp. · ${RESPONSAVEIS.find((r) => r.valor === responsavel)?.rotulo ?? responsavel}`,
      limpar: () => setResponsavel('todos'),
    })
  if (buscaTexto.trim() !== '') chips.push({ rotulo: `Busca · “${buscaTexto.trim()}”`, limpar: () => {
    setBuscaTexto('')
    if (contexto.busca) atualizarContexto({ busca: undefined }, 'oportunidades')
  } })

  function limparTudo() {
    setSituacao('todas')
    setEtapa('todas')
    setSinal('todos')
    setResponsavel('todos')
    setOrdenar('valor')
    setBuscaTexto('')
    atualizarContexto({ busca: undefined, filial: undefined, classificacao: undefined, janelaForecast: undefined }, 'oportunidades')
  }

  return (
    <div className="space-y-8">
      <CabecalhoTela
        kicker="Pipeline de Oportunidades"
        titulo="Oportunidades"
        sub="Cada linha é uma Oportunidade vinculada a uma Conta. Classificação e dimensões vêm do fixture sintético."
        acao={<NotaSintetico />}
      />

      {sql.dados ? (
        <section aria-label="SQL sem Oportunidade" className="grid gap-3 rounded-xl border border-[var(--senior-emerald)]/20 bg-[var(--senior-emerald-soft)]/45 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--senior-emerald-hover)]">SQL aceito sem Oportunidade vinculada</p>
            <p className="mt-0.5 text-[13px] text-foreground">SQL {sql.dados.sql_sem_oportunidade.id} · {fmtData(sql.dados.sql_sem_oportunidade.data)} · estado {sql.dados.sql_sem_oportunidade.estado}</p>
          </div>
          <p className="text-[12px] text-muted-foreground">SQL e Oportunidade são objetos distintos. Registro sintético sem relação inferida.</p>
        </section>
      ) : null}

      <Secao numero="01" titulo="Filtros e leitura da fila" sub="situação, etapa, sinal e responsável">
        <Painel className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
            <div className="relative xl:col-span-4">
              <span className="kicker absolute -top-[7px] left-3 bg-card px-1 text-muted-foreground/70">Busca</span>
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
              <Input
                type="search"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="Oportunidade, conta, responsável ou nº…"
                className="h-9 pl-8 text-[13px]"
                aria-label="Buscar oportunidades"
              />
            </div>

            <div className="relative xl:col-span-4">
              <span className="kicker absolute -top-[7px] left-3 bg-card px-1 text-muted-foreground/70">Situação</span>
              <div
                className="grid h-9 grid-cols-4 rounded-md border border-input bg-card p-0.5"
                role="tablist"
                aria-label="Filtrar por situação"
              >
                {SITUACOES_SEG.map((s) => {
                  const ativo = situacao === s.valor
                  return (
                    <button
                      key={s.valor}
                      type="button"
                      role="tab"
                      aria-selected={ativo}
                      onClick={() => setSituacao(s.valor)}
                      className={cn(
                        'rounded-[4px] text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                        ativo ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {s.rotulo}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="relative xl:col-span-2">
              <span className="kicker absolute -top-[7px] left-3 bg-card px-1 text-muted-foreground/70">Etapa</span>
              <Select value={etapa} onValueChange={setEtapa}>
                <SelectTrigger className="h-9 w-full text-[13px]" aria-label="Filtrar por etapa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>{ETAPAS.map((e) => <SelectItem key={e.valor} value={e.valor}>{e.rotulo}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="relative xl:col-span-2">
              <span className="kicker absolute -top-[7px] left-3 bg-card px-1 text-muted-foreground/70">Sinal</span>
              <Select value={sinal} onValueChange={setSinal}>
                <SelectTrigger className="h-9 w-full text-[13px]" aria-label="Filtrar por sinal do radar">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>{SINAIS.map((s) => <SelectItem key={s.valor} value={s.valor}>{s.rotulo}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="relative md:col-span-2 xl:col-span-3">
              <span className="kicker absolute -top-[7px] left-3 bg-card px-1 text-muted-foreground/70">Responsável</span>
              <Select value={responsavel} onValueChange={setResponsavel}>
                <SelectTrigger className="h-9 w-full text-[13px]" aria-label="Filtrar por responsável">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>{RESPONSAVEIS.map((r) => <SelectItem key={r.valor} value={r.valor}>{r.rotulo}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="relative xl:col-span-2">
              <span className="kicker absolute -top-[7px] left-3 bg-card px-1 text-muted-foreground/70">Ordenar por</span>
              <Select value={ordenar} onValueChange={setOrdenar}>
                <SelectTrigger className="h-9 w-full text-[13px]" aria-label="Ordenar fila">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>{ORDENACOES.map((o) => <SelectItem key={o.valor} value={o.valor}>{o.rotulo}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="hidden items-end justify-end xl:col-span-3 xl:flex">
              <ResumoFila fila={fila} className="text-right" />
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              <span className="kicker text-muted-foreground/60">Filtros ativos</span>
              {chips.map((chip) => (
                <button
                  key={chip.rotulo}
                  type="button"
                  onClick={chip.limpar}
                  className="group inline-flex items-center gap-1 rounded-sm border border-border bg-secondary px-2 py-0.5 text-[11.5px] text-secondary-foreground transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  aria-label={`Remover filtro: ${chip.rotulo}`}
                >
                  {chip.rotulo}
                  <X className="size-3 opacity-50 group-hover:opacity-100" aria-hidden />
                </button>
              ))}
              <button
                type="button"
                onClick={limparTudo}
                className="ml-1 text-[11.5px] text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                limpar tudo
              </button>
            </div>
          ) : (
            <div className="mt-3 border-t border-border pt-3 xl:hidden">
              <ResumoFila fila={fila} />
            </div>
          )}
        </Painel>
      </Secao>

      <Secao numero="02" titulo="Fila" sub="ordenada conforme seleção acima">
        {fila.carregando && !fila.dados ? (
          <Painel>
            <EsqueletoLinhas quantidade={10} />
          </Painel>
        ) : fila.erro ? (
          <ErroApi erro={fila.erro} aoTentar={fila.recarregar} />
        ) : !fila.dados || fila.dados.oportunidades.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma oportunidade corresponde aos filtros."
            descricao="Ajuste a busca ou limpe os filtros para ver a fila completa."
          >
            <SearchX className="mx-auto mb-2 size-5 text-muted-foreground/40" aria-hidden />
          </EstadoVazio>
        ) : (
          <Painel className="overflow-hidden">
            <div className="max-h-[72vh] overflow-y-auto scroll-discreta">
              <Table className="min-w-[1180px]">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 w-[260px] pl-5 text-[11px] font-medium text-muted-foreground">
                      Oportunidade
                    </TableHead>
                    <TableHead className="h-9 w-[170px] text-[11px] font-medium text-muted-foreground">Conta</TableHead>
                    <TableHead className="h-9 w-[120px] text-right text-[11px] font-medium text-muted-foreground">
                      Valor previsto
                    </TableHead>
                    <TableHead className="h-9 w-[96px] text-[11px] font-medium text-muted-foreground">Prob.</TableHead>
                    <TableHead className="h-9 w-[120px] text-[11px] font-medium text-muted-foreground">Etapa</TableHead>
                    <TableHead className="h-9 w-[100px] text-[11px] font-medium text-muted-foreground">Situação</TableHead>
                    <TableHead className="h-9 w-[150px] text-[11px] font-medium text-muted-foreground">Responsável</TableHead>
                    <TableHead className="h-9 w-[130px] text-[11px] font-medium text-muted-foreground">Previsão</TableHead>
                    <TableHead className="h-9 pr-5 text-[11px] font-medium text-muted-foreground">Sinais</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fila.dados.oportunidades.map((o) => (
                    <LinhaOportunidade key={o.oportunidade_id} o={o} irPara={irPara} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="border-t border-border bg-secondary/50 px-5 py-2.5 text-[11px] text-muted-foreground">
              A faixa vermelha identifica um sinal crítico. Sinais descrevem registros, não esforço; clique para abrir o caso.
            </p>
          </Painel>
        )}
      </Secao>
    </div>
  )
}

function ResumoFila({
  fila,
  className,
}: {
  fila: { dados: FilaResposta | null; carregando: boolean; erro: string | null }
  className?: string
}) {
  if (!fila.dados) {
    return (
      <p className={cn('text-[13px] leading-snug', fila.erro ? 'text-[var(--critical-red)]' : 'text-muted-foreground', className)} role={fila.erro ? 'alert' : 'status'}>
        {fila.erro ? 'A leitura da fila falhou.' : 'Carregando oportunidades…'}
      </p>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 gap-x-4 gap-y-1', className)}>
      <p>
        <span className="num block text-[15px] font-semibold leading-tight text-foreground">{fmtInt(fila.dados.total)}</span>
        <span className="text-[11px] text-muted-foreground">oportunidades</span>
      </p>
      <p>
        <span className="num block whitespace-nowrap text-[14px] font-semibold leading-tight text-foreground">{fmtBRL(fila.dados.valor_aberto)}</span>
        <span className="text-[11px] text-muted-foreground">em aberto</span>
      </p>
      {fila.carregando ? <span className="col-span-2 text-[11px] text-muted-foreground">atualizando…</span> : null}
    </div>
  )
}

function LinhaOportunidade({ o, irPara }: { o: OportunidadeLinha; irPara: IrPara }) {
  const critico = o.sinais.includes('R1')
  function abrir() {
    irPara('detalhe', o.oportunidade_id, { de: 'oportunidades' })
  }
  return (
    <TableRow
      className={cn(
        'relative h-[56px] cursor-pointer hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none',
        critico && 'before:absolute before:inset-y-1.5 before:left-0 before:w-[2.5px] before:rounded-r before:bg-rose-600',
      )}
      role="button"
      tabIndex={0}
      aria-label={'Abrir detalhe da oportunidade ' + o.nome + ' (' + o.conta_fantasia + '); ' + rotuloNaturezaVendaTaxonomia(o.natureza_venda_taxonomia) + '; ' + (o.tipo_oportunidade ?? 'tipo não comprovado') + '; ' + (o.subtipo_oportunidade ?? 'subtipo não comprovado') + '; ' + o.filial}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          abrir()
        }
      }}
    >
      <TableCell className="max-w-[260px] py-2 pl-5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 truncate text-[13px] font-medium text-foreground">{o.nome}</span>
          <span className="num shrink-0 font-mono text-[10.5px] text-muted-foreground">#{o.oportunidade_id}</span>
        </div>
        <div
          className="mt-0.5 truncate text-[11px] text-muted-foreground"
          title={`${rotuloNaturezaVendaTaxonomia(o.natureza_venda_taxonomia)} · ${o.filial}`}
        >
          {rotuloNaturezaVendaTaxonomia(o.natureza_venda_taxonomia)} · {o.filial}
        </div>
      </TableCell>
      <TableCell className="max-w-[210px]">
        <div className="truncate text-[13px] text-foreground/90">{o.conta_fantasia}</div>
        <div className="num truncate font-mono text-[11px] text-muted-foreground">
          {o.conta_id}
          {o.conta_id_erp !== null ? ` · ERP ${o.conta_id_erp}` : ' · sem ERP'}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span className="num text-[13px] font-semibold text-foreground">{fmtBRL(o.valor_previsto)}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="num w-8 text-xs text-foreground/80">{o.probabilidade}%</span>
          <span className="h-1 w-14 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`Probabilidade ${o.probabilidade}%`}>
            <span className="block h-full rounded-full bg-[var(--senior-emerald)]" style={{ width: `${o.probabilidade}%` }} />
          </span>
        </div>
      </TableCell>
      <TableCell className="text-[13px] text-foreground/80">{rotuloEtapaTaxonomia(o.etapa_taxonomia)}</TableCell>
      <TableCell>
        <PillSituacao situacao={o.situacao} />
      </TableCell>
      <TableCell className="text-[13px] text-foreground/80">{o.responsavel_nome}</TableCell>
      <TableCell>
        {o.previsao_atual ? (
          <div>
            <div className="num text-[13px] text-foreground/80">{fmtData(o.previsao_atual)}</div>
            {o.previsao_vencida_ha_dias !== null ? (
              <div className="text-[11px] font-medium text-rose-700">venceu há {o.previsao_vencida_ha_dias}d</div>
            ) : o.dias_ate_previsao !== null ? (
              <div className="text-[11px] text-muted-foreground">em {o.dias_ate_previsao}d</div>
            ) : null}
          </div>
        ) : (
          <span className="text-[13px] text-muted-foreground/50">sem previsão</span>
        )}
      </TableCell>
      <TableCell className="pr-5">
        {o.sinais.length === 0 ? (
          <span className="text-muted-foreground/40">—</span>
        ) : (
          <div className="flex flex-wrap justify-end gap-1">
            {o.sinais.map((s) => (
              <span key={s} className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', SINAIS_META[s.replace('!', '')]?.severidade === 'critica' ? 'border-[var(--critical-red-soft)] bg-[var(--critical-red-soft)] text-[var(--critical-red)]' : 'border-[var(--attention-amber-soft)] bg-[var(--attention-amber-soft)] text-[var(--attention-amber)]')}>
                {SINAIS_META[s.replace('!', '')]?.nome ?? 'Situação para revisão'}
              </span>
            ))}
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}
