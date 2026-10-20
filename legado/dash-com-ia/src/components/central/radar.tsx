'use client'

// Tela 07 — Radar: o motor de atenção da Central.
// A unidade visual não é a regra técnica — é a SITUAÇÃO DE NEGÓCIO em
// linguagem de decisão ("R$ 3,6M precisam de revisão de previsão"). Cada
// situação expande para definição, limitação, decisão pendente, a tabela de
// oportunidades afetadas (drill-down com contexto de origem) e o CTA para a
// fila de casos correspondente.

import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  BadgeSeveridade,
  CabecalhoTela,
  ErroApi,
  EsqueletoPainel,
  NotaSintetico,
  Painel,
  PillSituacao,
  Secao,
} from './primitivas'
import type { IrPara } from './navegacao'
import { useApi, type RadarResposta } from './use-api'
import { fmtBRL, fmtInt } from '@/lib/domain/format'
import type { RegraRadar, ReferenciaOportunidade, Severidade } from '@/lib/domain/types'
import { cn } from '@/lib/utils'
import { rotuloEtapaTaxonomia } from '@/lib/domain/types'

const COR_BARRA: Record<Severidade, string> = {
  critica: 'bg-rose-600',
  atencao: 'bg-amber-500',
  info: 'bg-stone-400',
}

// Manchete de decisão por código — a situação de negócio que abre cada
// leitura (mesmo padrão do AGORA): o impacto (valor ou população) abre a
// frase em .num e o restante fixa o enquadramento de decisão.
const MANCHETE: Record<string, (r: RegraRadar) => { valor: string; texto: string }> = {
  R1: (r) => ({ valor: fmtBRL(r.valor_exposto), texto: 'precisam de revisão de previsão' }),
  R2: (r) => ({
    valor: fmtInt(r.quantidade),
    texto: r.quantidade === 1 ? 'registro sem ação há mais de 21 dias' : 'registros sem ação há mais de 21 dias',
  }),
  R3: (r) => ({ valor: fmtBRL(r.valor_exposto), texto: 'em deslocamento de previsão acumulado' }),
  R4: (r) => ({ valor: fmtBRL(r.valor_exposto), texto: 'em etapa avançada sem compromisso futuro' }),
  R5: (r) => ({
    valor: fmtInt(r.quantidade),
    texto: r.quantidade === 1 ? 'ganho aguarda pedido registrado' : 'ganhos aguardam pedido registrado',
  }),
  R6: (r) => ({
    valor: fmtInt(r.quantidade),
    texto: r.quantidade === 1 ? 'pedido aguarda conferência' : 'pedidos aguardam conferência',
  }),
  R7: (r) => ({ valor: fmtInt(r.quantidade), texto: 'probabilidades divergem da previsão' }),
}

function mancheteSituacao(r: RegraRadar): { valor: string; texto: string } {
  const template = MANCHETE[r.codigo]
  if (template) return template(r)
  return { valor: fmtInt(r.quantidade), texto: `ocorrências de ${r.nome.toLowerCase()}` }
}

export function Radar({ irPara }: { irPara: IrPara }) {
  const radar = useApi<RadarResposta>('/api/radar')
  // Estado local de expansão: a primeira regra crítica nasce aberta, as
  // demais nascem fechadas (Record<string, boolean>).
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})

  const regras = radar.dados?.regras ?? []
  const criticas = regras.filter((r) => r.severidade === 'critica')
  const atencao = regras.filter((r) => r.severidade !== 'critica')
  const primeiroCritico = criticas[0]?.codigo

  function alternar(codigo: string, aberto: boolean) {
    setAbertos((atual) => ({ ...atual, [codigo]: aberto }))
  }

  return (
    <div className="space-y-8">
      <CabecalhoTela
        kicker="Situações que merecem atenção · leitura do snapshot"
        titulo="Radar"
        sub={
          radar.dados?.principio ??
          'Sete leituras determinísticas sobre o que está registrado — cada situação com sua limitação explícita.'
        }
        acao={<NotaSintetico />}
      />

      {radar.carregando && !radar.dados ? (
        <div className="space-y-6">
          <EsqueletoPainel linhas={2} />
          <EsqueletoPainel linhas={8} />
        </div>
      ) : radar.erro || !radar.dados ? (
        <ErroApi erro={radar.erro ?? 'Radar indisponível'} aoTentar={radar.recarregar} />
      ) : (
        <>
          <p className="-mt-3 text-[14px] text-muted-foreground">{fmtInt(radar.dados.resumo.oportunidades_atencao)} Oportunidades aparecem em situações ativas. O valor em risco considera somente previsões vencidas.</p>
          <Secao
            numero="01"
            titulo="Situações e oportunidades afetadas"
            sub="impacto, população e decisão; detalhes da regra sob demanda"
          >
            <div className="space-y-5">
              {criticas.length > 0 ? (
                <GrupoRegras
                  rotulo="Críticas"
                  tomRotulo="text-rose-800"
                  regras={criticas}
                  abertos={abertos}
                  aoAlternar={alternar}
                  abertoPorPadrao={primeiroCritico}
                  versao={radar.dados.versao}
                  irPara={irPara}
                />
              ) : null}
              {atencao.length > 0 ? (
                <GrupoRegras
                  rotulo="Atenção"
                  tomRotulo="text-amber-800"
                  regras={atencao}
                  abertos={abertos}
                  aoAlternar={alternar}
                  abertoPorPadrao={primeiroCritico}
                  versao={radar.dados.versao}
                  irPara={irPara}
                />
              ) : null}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Os sinais descrevem registros, não esforço — ausência de registro ≠ ausência de trabalho.
            </p>
          </Secao>
        </>
      )}
    </div>
  )
}

// ---------- Grupo de severidade (kicker + painel com hairlines) ----------

function GrupoRegras({
  rotulo,
  tomRotulo,
  regras,
  abertos,
  aoAlternar,
  abertoPorPadrao,
  versao,
  irPara,
}: {
  rotulo: string
  tomRotulo: string
  regras: RegraRadar[]
  abertos: Record<string, boolean>
  aoAlternar: (codigo: string, aberto: boolean) => void
  abertoPorPadrao?: string
  versao: string
  irPara: IrPara
}) {
  return (
    <div>
      <p className={cn('kicker mb-2', tomRotulo)}>{rotulo}</p>
      <Painel className="divide-y divide-border overflow-hidden">
        {regras.map((regra) => (
          <LinhaRegra
            key={regra.codigo}
            regra={regra}
            aberto={abertos[regra.codigo] ?? regra.codigo === abertoPorPadrao}
            aoAlternar={(aberto) => aoAlternar(regra.codigo, aberto)}
            versao={versao}
            irPara={irPara}
          />
        ))}
      </Painel>
    </div>
  )
}

// ---------- Linha de situação (Collapsible: manchete → contrato → ocorrências) ----------

function LinhaRegra({
  regra,
  aberto,
  aoAlternar,
  versao,
  irPara,
}: {
  regra: RegraRadar
  aberto: boolean
  aoAlternar: (aberto: boolean) => void
  versao: string
  irPara: IrPara
}) {
  const critica = regra.severidade === 'critica'
  const manchete = mancheteSituacao(regra)
  return (
    <Collapsible open={aberto} onOpenChange={aoAlternar}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="group relative w-full px-5 py-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
          aria-label={`${manchete.valor} ${manchete.texto}. Expandir detalhes da situação.`}
        >
          <span
            className={cn('absolute inset-y-3 left-0 w-[2.5px] rounded-r', COR_BARRA[regra.severidade])}
            aria-hidden
          />
          <span className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
            <span className="min-w-0">
              <span className="block text-[17px] font-semibold leading-snug tracking-tight text-foreground">
                <span className="num">{manchete.valor}</span> {manchete.texto}
              </span>
              <span className="num mt-1.5 block text-[12.5px] text-muted-foreground">
                <span className="font-semibold text-foreground">{fmtInt(regra.quantidade)}</span>{' '}
                {regra.quantidade === 1 ? 'oportunidade' : 'oportunidades'}
                <span className="mx-1.5 text-muted-foreground/50">·</span>
                <span className="font-semibold text-foreground">{fmtInt(regra.responsaveis)}</span>{' '}
                {regra.responsaveis === 1 ? 'responsável' : 'responsáveis'}
              </span>
              <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                <BadgeSeveridade severidade={regra.severidade} />
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="num text-[13px] text-muted-foreground">
                <span className={cn('font-semibold', critica ? 'text-rose-800' : 'text-amber-800')}>
                  {fmtInt(regra.quantidade)}
                </span>{' '}
                · <span className="font-medium text-foreground">{fmtBRL(regra.valor_exposto)}</span>
              </span>
              <ChevronDown
                className={cn('size-4 shrink-0 text-muted-foreground/60 transition-transform', aberto && 'rotate-180')}
                aria-hidden
              />
            </span>
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 border-t border-border p-5">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Ver regra · RADAR-{regra.codigo}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Versão {versao} · Fonte: CRM sintético</p>
              <p className="mt-2 text-[12px] leading-relaxed text-foreground">{regra.regra}</p>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Limitação</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{regra.limitacao}</p>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Decisão pendente</p>
              <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-foreground">{regra.decisao_pendente}</p>
            </div>
          </div>

          <div>
            <p className="kicker text-muted-foreground">Oportunidades afetadas</p>
            {regra.quantidade === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">Nenhuma ocorrência ativa.</p>
            ) : (
              <div className="mt-2 overflow-hidden rounded-md border border-border">
                <div className="max-h-[420px] overflow-auto scroll-discreta">
                  <TabelaOportunidades regra={regra} irPara={irPara} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => irPara('casos', undefined, { de: 'radar', foco: regra.codigo })}
              aria-label="Revisar os casos desta situação na fila de decisões"
            >
              Revisar casos
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ---------- Ocorrências da situação (tabela densa, linha clicável) ----------

const CLASSE_COLUNA = 'h-9 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground'

function TabelaOportunidades({ regra, irPara }: { regra: RegraRadar; irPara: IrPara }) {
  const critica = regra.severidade === 'critica'
  return (
    <Table className="min-w-[640px]">
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(CLASSE_COLUNA, 'w-[250px] pl-5')}>Oportunidade</TableHead>
          <TableHead className={cn(CLASSE_COLUNA, 'w-[130px]')}>Etapa</TableHead>
          <TableHead className={cn(CLASSE_COLUNA, 'w-[104px]')}>Situação</TableHead>
          <TableHead className={CLASSE_COLUNA}>Contexto</TableHead>
          <TableHead className={cn(CLASSE_COLUNA, 'pr-5 text-right')}>Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {regra.oportunidades.map((o) => (
          <LinhaOportunidadeRadar
            key={o.oportunidade_id}
            o={o}
            critica={critica}
            foco={regra.codigo}
            irPara={irPara}
          />
        ))}
      </TableBody>
    </Table>
  )
}

function LinhaOportunidadeRadar({
  o,
  critica,
  foco,
  irPara,
}: {
  o: ReferenciaOportunidade
  critica: boolean
  foco: string
  irPara: IrPara
}) {
  function abrir() {
    irPara('detalhe', o.oportunidade_id, { de: 'radar', foco })
  }
  return (
    <TableRow
      className="h-[52px] cursor-pointer hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalhe da oportunidade ${o.nome} (${o.conta_fantasia})`}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          abrir()
        }
      }}
    >
      <TableCell className="max-w-[250px] py-2.5 pl-5">
        <div className="truncate text-[13px] font-medium text-foreground">{o.nome}</div>
        <div className="truncate text-[11px] text-muted-foreground">{o.conta_fantasia}</div>
      </TableCell>
          <TableCell className="py-2.5 text-[13px] text-foreground/80">{rotuloEtapaTaxonomia(o.etapa_taxonomia)}</TableCell>
      <TableCell className="py-2.5">
        <PillSituacao situacao={o.situacao} />
      </TableCell>
      <TableCell className="max-w-[280px] py-2.5">
        <span className={cn('text-xs leading-snug', critica ? 'text-rose-700' : 'text-amber-700')}>{o.contexto}</span>
      </TableCell>
      <TableCell className="py-2.5 pr-5 text-right">
        <span className="num text-[13px] font-medium text-foreground">{fmtBRL(o.valor_previsto)}</span>
      </TableCell>
    </TableRow>
  )
}
