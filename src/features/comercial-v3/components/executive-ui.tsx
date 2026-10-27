'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock3, Info, Pencil, XCircle, type LucideIcon } from 'lucide-react'
import { BarraAnimada } from './motion-primitives'
import { formatarRealComSinal, formatarSaldo } from '../format'
import type { MovementLabel } from '../movement-rows'

/**
 * Primitivos visuais do painel (Visão Executiva, Forecast, New Name, Oportunidades).
 *
 * Linguagem aprovada: superfície de vidro sobre o fundo da sede, cartão de indicador
 * com faixa de tom e mini-gráfico, pílula de estado e tabela com cabeçalho tingido.
 * Toda cor vem de token (`globals.css`); nenhum hex solto aqui.
 */

/** Faixa de tom do cartão: muda só a variável `--tom` consumida pelos filhos. */
export type Tom = 'marca' | 'positivo' | 'info' | 'atencao' | 'negativo'

export const PAINEL = 'revenue-panel vidro min-w-0'

/** Cartão de indicador com rótulo, valor, nota e mini-gráfico decorativo. */
/** Botão de informação: guarda a regra de cálculo fora do texto do cartão. */
export function InfoTip({ texto }: { texto: string }) {
  return (
    <span className="revenue-info relative inline-flex">
      <button type="button" aria-label={`Como é calculado: ${texto}`} onClick={evento => { evento.preventDefault(); evento.stopPropagation() }} className="peer grid h-5 w-5 place-items-center rounded-full text-ink-subtle transition-colors hover:text-brand-escuro focus-visible:outline-2 focus-visible:outline-brand-escuro">
        <Info aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span role="tooltip" className="pointer-events-none absolute right-0 top-6 z-20 w-56 rounded-[10px] bg-ink-strong px-3 py-2 text-[12px] font-normal leading-4 text-white opacity-0 shadow-lg transition-opacity peer-hover:opacity-100 peer-focus-visible:opacity-100">
        {texto}
      </span>
    </span>
  )
}

export function MetricCard({ rotulo, valor, nota, info, tom = 'marca', href, onActivate }: {
  rotulo: string
  valor: string
  nota?: string
  /** Regra de cálculo, mostrada no botão de informação. */
  info?: string
  tom?: Tom
  href?: string
  /**
   * Ação local do clique (ex.: abrir o Forecast já com um movimento). Mantém o
   * link para teclado e menu de contexto; só o clique simples é interceptado.
   */
  onActivate?: () => void
}) {
  const conteudo = (
    <>
      <span aria-hidden className="revenue-metric-dot" />
      <div className="min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="revenue-metric-label block truncate">{rotulo}</span>
          {info && <InfoTip texto={info} />}
        </span>
        <strong className="revenue-metric-value num block tabular-nums text-ink-strong">{valor}</strong>
        {nota && <small className="revenue-metric-note block truncate">{nota}</small>}
      </div>
    </>
  )
  const base = `revenue-metric vidro tone-${tom}`
  if (href) {
    return (
      <Link
        href={href}
        onClick={(evento) => {
          // Clique simples aplica o recorte; abrir em nova aba e o menu de
          // contexto seguem o link, sem estado local a carregar.
          if (evento.button === 0 && !evento.metaKey && !evento.ctrlKey && !evento.shiftKey && !evento.altKey) onActivate?.()
        }}
        className={`${base} transition-premium hover:-translate-y-px`}
      >
        {conteudo}
      </Link>
    )
  }
  return <article className={base}>{conteudo}</article>
}

/** Painel de vidro com título e subtítulo opcionais. */
export function Panel({ titulo, subtitulo, acao, children, className = '' }: {
  titulo?: string
  subtitulo?: string
  acao?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`${PAINEL} ${className}`}>
      {(titulo || acao) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-[15px] font-bold tracking-[-0.02em] text-ink-strong">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-[12px] text-ink-muted">{subtitulo}</p>}
          </div>
          {acao}
        </div>
      )}
      {children}
    </section>
  )
}

type PanelSectionProps = {
  id: string
  titulo: string
  /** Contexto curto da seção. Uma linha, sem virar parágrafo explicativo. */
  contexto?: string
  acao?: React.ReactNode
  nivel?: 'h1' | 'h2'
  children: React.ReactNode
}

/** Seção da página corrida: âncora para a sidebar, título e contexto curto. */
export function PanelSection({ id, titulo, contexto, acao, nivel = 'h2', children }: PanelSectionProps) {
  const Titulo = nivel
  return (
    <section id={id} data-home-nav={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-6 grid min-w-0 gap-4 border-t border-hairline pt-7 first:border-t-0 first:pt-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Titulo id={`${id}-titulo`} className="text-[22px] font-bold leading-tight tracking-[-0.035em] text-ink-strong">{titulo}</Titulo>
          {contexto && <p className="mt-1 text-[13px] text-ink-muted">{contexto}</p>}
        </div>
        {acao}
      </header>
      {children}
    </section>
  )
}

export const MOVIMENTO: Record<MovementLabel, { icon: LucideIcon; tom: Tom }> = {
  Entrou: { icon: ArrowUpRight, tom: 'positivo' },
  Ganhou: { icon: CheckCircle2, tom: 'positivo' },
  Saiu: { icon: ArrowDownRight, tom: 'negativo' },
  Perdeu: { icon: XCircle, tom: 'negativo' },
  Postergou: { icon: Clock3, tom: 'atencao' },
  'Alterou valor': { icon: Pencil, tom: 'info' },
}

/** `03/10/2026` a partir de `2026-10-03`; `—` quando a carga não traz a data. */
export function formatarDataCurta(iso: string | null): string {
  if (!iso) return '—'
  const partes = iso.split('-')
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : iso
}

type MovementCardProps = {
  movimento: MovementLabel
  titulo?: string
  valor: number | null
  contagem: string
  nota: string
  disponivel: boolean
  /**
   * Por que o cartão está indisponível. Padrão é a primeira carga; quando a
   * anterior é de outro mês, a tela precisa dizer isso em vez de sugerir que
   * não há carga nenhuma.
   */
  motivoIndisponivel?: { contagem: string; nota: string }
  href?: string
  selecionado?: boolean
  onSelecionar?: () => void
}

/** Cartão de movimento: ícone em quadrado tingido, valor com sinal e uma legenda curta. */
const SEM_CARGA_ANTERIOR = { contagem: 'Sem carga anterior', nota: 'A comparação começa na próxima importação' } as const

export function MovementCard({ movimento, titulo, valor, contagem, nota, disponivel, motivoIndisponivel = SEM_CARGA_ANTERIOR, href, selecionado = false, onSelecionar }: MovementCardProps) {
  // Sem base de comparação o cartão não tem o que dizer: some em vez de mostrar "—".
  if (!disponivel) return null
  const visual = MOVIMENTO[movimento]
  const Icone = visual.icon
  const corValor = !disponivel || valor === null || valor === 0
    ? 'text-ink-strong'
    : valor > 0 ? 'text-dado-positivo' : 'text-dado-negativo'
  const conteudo = (
    <>
      <span className="flex items-center gap-2.5">
        <span aria-hidden className={`revenue-brief-icon grid shrink-0 place-items-center tone-${visual.tom}`}>
          <Icone size={17} strokeWidth={2.2} />
        </span>
        <span className="text-[13px] font-semibold text-ink-strong">{titulo ?? movimento}</span>
      </span>
      <span className="mt-3 block">
        <strong className={`num block text-[24px] font-bold leading-none tracking-[-0.035em] ${corValor}`}>
          {disponivel ? formatarRealComSinal(valor) : '—'}
        </strong>
        <span className="mt-1.5 block text-[12px] text-ink-muted">{disponivel ? contagem : motivoIndisponivel.contagem}</span>
      </span>
      <span className="mt-2 block text-[11px] leading-4 text-ink-muted">{disponivel ? nota : motivoIndisponivel.nota}</span>
    </>
  )
  const base = `revenue-panel vidro revenue-glow tone-${visual.tom} flex min-h-[132px] min-w-0 flex-col justify-between text-left transition-premium ${selecionado ? 'ring-2 ring-brand' : 'hover:-translate-y-px'}`
  if (href) return <Link href={href} className={base}>{conteudo}</Link>
  if (onSelecionar) {
    return (
      <button type="button" aria-pressed={selecionado} disabled={!disponivel} onClick={onSelecionar} className={`${base} disabled:cursor-not-allowed disabled:opacity-60`}>
        {conteudo}
      </button>
    )
  }
  return <article className={base}>{conteudo}</article>
}

export type RingGroup = { rotulo: string; movimento: MovementLabel; valor: number | null; peso: number }

const COR_ANEL: Record<MovementLabel, string> = {
  Entrou: 'var(--dado-positivo)',
  Ganhou: 'var(--verde-institucional)',
  Saiu: 'var(--dado-negativo)',
  Perdeu: 'var(--dado-negativo)',
  Postergou: 'var(--dado-atencao)',
  'Alterou valor': 'var(--dado-info)',
}

/**
 * Impacto dos movimentos em barras, não em rosca.
 *
 * A rosca anterior tinha dois defeitos: as parcelas de valor zero sumiam do
 * anel (dando a impressão de que só existiam duas), e o saldo no centro não
 * correspondia à soma visual das fatias — o número contradizia o desenho.
 * Aqui cada movimento ocupa uma barra proporcional à própria magnitude, e o
 * saldo é uma linha à parte, com sinal. Lê-se de cima para baixo.
 */
export function ImpactRing({ titulo, legenda, grupos, saldo, rotuloSaldo = 'Saldo no mês' }: { titulo: string; legenda: string; grupos: RingGroup[]; saldo: number | null; rotuloSaldo?: string }) {
  const maior = grupos.reduce((maximo, grupo) => Math.max(maximo, grupo.peso), 0)
  const comValor = grupos.some(grupo => grupo.valor !== null)
  if (!comValor) return null
  return (
    <Panel titulo={titulo} subtitulo={legenda} className="self-start">
      {comValor ? (
        <>
          <ul className="grid gap-2.5">
            {grupos.map((grupo) => {
              const proporcao = maior > 0 ? Math.max(0, Math.min(1, grupo.peso / maior)) : 0
              return (
                <li key={`${grupo.movimento}-${grupo.rotulo}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-[12px]">
                  <span className="truncate text-ink-muted">{grupo.rotulo}</span>
                  <span className="num font-semibold text-ink-strong">{grupo.valor === null ? '—' : formatarRealComSinal(grupo.valor)}</span>
                  <span className="col-span-2">
                    <BarraAnimada proporcao={proporcao} cor={COR_ANEL[grupo.movimento]} />
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
            <span className="text-[12px] font-medium text-ink-muted">{rotuloSaldo}</span>
            <strong className={`num text-[18px] font-bold tracking-[-0.02em] ${saldo === null ? 'text-ink-strong' : saldo > 0 ? 'text-dado-positivo' : saldo < 0 ? 'text-dado-negativo' : 'text-ink-strong'}`}>
              {formatarSaldo(saldo)}
            </strong>
          </div>
        </>
      ) : (
        <p className="text-[12px] text-ink-muted">A comparação começa na próxima importação.</p>
      )}
    </Panel>
  )
}

/** Barra de progresso (realizado sobre previsto). */
export function BarraProgresso({ valor, rotulo }: { valor: number; rotulo: string }) {
  const largura = Math.max(0, Math.min(100, valor))
  return (
    <div role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(largura)} className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
      <span className="block h-full rounded-full bg-[linear-gradient(90deg,var(--verde-institucional),var(--verde-claro))] transition-[width] duration-500" style={{ width: `${largura}%` }} />
    </div>
  )
}

/** Variante animada da barra de progresso; usada onde a largura é o dado principal. */
export function BarraProgressoAnimada({ valor, rotulo }: { valor: number; rotulo: string }) {
  const largura = Math.max(0, Math.min(100, valor))
  return (
    <div role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(largura)}>
      <BarraAnimada proporcao={largura / 100} cor="linear-gradient(90deg, var(--verde-institucional), var(--verde-claro))" altura={8} />
    </div>
  )
}


/** Pílula de estado do movimento. */
export function Selo({ movimento }: { movimento: MovementLabel }) {
  return <span className={`revenue-pill tone-${MOVIMENTO[movimento].tom}`}>{movimento}</span>
}

/** Anel de participação (61% etc.), com o valor no centro. */
export function Donut({ valor, rotulo, tom = 'marca' }: { valor: number; rotulo: string; tom?: Tom }) {
  const graus = Math.max(0, Math.min(100, valor)) * 3.6
  return (
    <span aria-hidden className={`revenue-donut tone-${tom}`} style={{ ['--donut' as string]: `${graus}deg` }}>
      <span>
        <strong className="num block text-[15px] font-bold leading-none text-ink-strong">{Math.round(valor)}%</strong>
        <small className="mt-1 block text-[11px] text-ink-muted">{rotulo}</small>
      </span>
    </span>
  )
}

/** Lista de barras horizontais: etapa, fase ou filial com valor proporcional. */
export function BarList({ itens, vazio }: {
  itens: Array<{ rotulo: string; valor: string; proporcao: number }>
  vazio: string
}) {
  if (itens.length === 0) return <p className="text-[12px] text-ink-muted">{vazio}</p>
  return (
    <ul className="revenue-bar-list">
      {itens.map(item => (
        <li key={item.rotulo}>
          <span className="truncate font-medium text-ink-strong" title={item.rotulo}>{item.rotulo}</span>
          <i aria-hidden><em style={{ width: `${Math.round(Math.max(0, Math.min(1, item.proporcao)) * 100)}%` }} /></i>
          <span className="num text-right text-ink-muted">{item.valor}</span>
        </li>
      ))}
    </ul>
  )
}
