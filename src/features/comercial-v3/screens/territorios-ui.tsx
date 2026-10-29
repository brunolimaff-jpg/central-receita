/**
 * Peças visuais de Territórios, compartilhadas pelos três níveis
 * (CSO → território → filial).
 *
 * Estavam dentro de `regional-screen.tsx` quando havia uma tela só. Com a
 * navegação em três níveis, os mesmos blocos aparecem em telas diferentes —
 * cópia criaria duas escalas de cor divergindo com o tempo, que é exatamente o
 * defeito que a issue #21 corrigiu. Ficam aqui, num lugar só.
 */
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatarRealCompacto } from '../format'
import { iniciais, slugPessoa } from '../org-2027'
import { tomDoCalor, type CelulaCalor, type Farol, type GrupoCalor, type TomCalor } from '../regional/regional-model'

export const R = (v: number) => formatarRealCompacto(Math.round(v))
/**
 * Percentual da meta. `null` vira "—" e nunca "0%": ausência de meta não é
 * atingimento zero. A tela inteira passa por aqui.
 */
export const P = (v: number | null | undefined) => (v === null || v === undefined || !Number.isFinite(v) ? '—' : `${Math.round(v * 100)}%`)
/** "de" da meta: sem meta, o texto diz o que falta em vez de inventar denominador. */
export const Rm = (v: number | null) => (v === null ? 'sem meta' : R(v))
const FAROL_COR: Record<Farol, string> = { verde: 'bg-[#d9f2dd] text-[#0a5a18]', amarelo: 'bg-[#fbebc0] text-[#6e4b00]', vermelho: 'bg-[#f9dadf] text-[#86172a]' }
const FAROL_PONTO: Record<Farol, string> = { verde: 'bg-[#01a401]', amarelo: 'bg-[#b07a00]', vermelho: 'bg-[#c0283b]' }
const FAROL_NEUTRO = 'bg-[#eef2f1] text-[#5a6b68]'

/** Sem meta não há farol: o chip diz "sem meta" em vez de pintar um estado inventado. */
export function Chip({ farol, children }: { farol: Farol | null; children: ReactNode }) {
  if (farol === null) return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${FAROL_NEUTRO}`}><i className="h-1.5 w-1.5 rounded-full bg-[#9aa9a6]" />sem meta</span>
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${FAROL_COR[farol]}`}><i className={`h-1.5 w-1.5 rounded-full ${FAROL_PONTO[farol]}`} />{children}</span>
}

export function Card({ titulo, hint, children, className = '' }: { titulo?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)] ${className}`}>
      {titulo && <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">{titulo}</h2>}
      {hint && <p className="mt-0.5 text-[12px] text-[#63748a]">{hint}</p>}
      <div className={titulo || hint ? 'mt-3' : ''}>{children}</div>
    </section>
  )
}

export function Kpi({ rotulo, valor, sub, farol }: { rotulo: string; valor: string; sub?: string; farol?: Farol | null }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2"><span className="text-[12px] font-semibold text-[#50647d]">{rotulo}</span>{farol && <Chip farol={farol}>{farol}</Chip>}</div>
      <div className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#0d2340]">{valor}</div>
      {sub && <div className="mt-0.5 text-[12px] text-[#63748a]">{sub}</div>}
    </Card>
  )
}

export function Barra({ pct, cor = '#086b6b' }: { pct: number | null; cor?: string }) {
  // Sem meta não há barra a preencher: o trilho fica vazio, não em zero.
  const largura = pct === null || !Number.isFinite(pct) ? 0 : Math.min(100, Math.max(0, pct * 100))
  return <div className="h-2 overflow-hidden rounded bg-[#ecf0ef]"><div className="h-full rounded" style={{ width: `${largura}%`, background: cor }} /></div>
}

/**
 * Cartão de nível: a navegação de Territórios no padrão da Carteira.
 *
 * Na Carteira, "quem responde abaixo" são cartões que já mostram nome, cargo e
 * número **antes** do clique — a pessoa vê para onde vai antes de ir. Aqui a
 * mesma ideia vale para geografia: quem lê o CSO vê o território com base, meta
 * e farol na mão; quem lê o território, a filial.
 *
 * Pílula de filtro esconde o número até depois do clique, e foi por isso que a
 * tela pareceu vazia. O cartão carrega a informação que motiva a descida.
 */
export function CartaoNivel({
  href,
  titulo,
  subtitulo,
  base,
  meta,
  pct,
  farol,
  rodape,
  selo,
  cor,
  numero,
}: {
  href: string
  titulo: string
  subtitulo: string
  base: number
  meta: number
  pct: number | null
  farol: Farol | null
  rodape?: string
  /** Marca o nível aberto agora, para o cartão dizer onde a pessoa está. */
  selo?: boolean
  /** Cor do território no organograma. É o que distingue um cartão do outro na Home. */
  cor?: string
  /** Número do território, no selo redondo que a Home usa. */
  numero?: number
}) {
  const tom = cor ?? '#086b6b'
  return (
    <Link
      href={href}
      aria-current={selo ? 'page' : undefined}
      className={`revenue-panel vidro group flex min-w-0 flex-col gap-2.5 p-3.5 transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] ${selo ? 'ring-2 ring-[#086b6b]/35' : ''}`}
      style={cor ? { ['--tom' as string]: cor } : undefined}
    >
      <div className="flex items-start gap-2.5">
        {numero !== undefined ? (
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white"
            style={{ background: tom, boxShadow: `0 8px 18px -8px ${tom}` }}
          >
            {numero}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-bold text-[#0d2340]">{titulo}</p>
          <p className="truncate text-[11px]" style={cor ? { color: `color-mix(in srgb, ${tom} 70%, black)` } : undefined}>{subtitulo}</p>
        </div>
        <ArrowRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b0bccb] transition-transform group-hover:translate-x-0.5 group-hover:text-[#086b6b]" />
      </div>

      <div className="flex items-end justify-between gap-2 border-t border-[#eef2f6] pt-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7b8ba1]">Base</p>
          <p className="num text-[16px] font-bold tabular-nums text-[#0d2340]">{R(base)}</p>
          <p className="mt-0.5 text-[10.5px] text-[#7b8ba1]">meta {meta > 0 ? R(meta) : 'sem meta'}</p>
        </div>
        <Chip farol={farol}>{P(pct)}</Chip>
      </div>

      <Barra pct={pct} cor={cor ?? (farol === 'verde' ? '#0a7a3a' : farol === 'amarelo' ? '#b07a00' : farol === 'vermelho' ? '#c0283b' : '#c9d4d2')} />
      {rodape && <p className="text-[10.5px] leading-4 text-[#8a9a97]">{rodape}</p>}
      <span className="sr-only">Abrir {titulo} e ver o nível abaixo</span>
    </Link>
  )
}

/**
 * Foto oficial da pessoa, no mesmo caminho e mesma versão de cache que a Home
 * usa (`components/diretorias-section.tsx`). A foto é fundo do avatar; quem não
 * tem arquivo mostra as iniciais, porque a imagem simplesmente não cobre.
 *
 * O `?v=` existe porque o navegador guarda o 404 da primeira tentativa: sem ele,
 * foto que entra depois continua invisível.
 */
const VERSAO_FOTO = '3'
export const fotoPessoa = (nome: string) => `/pessoas/${slugPessoa(nome)}.jpg?v=${VERSAO_FOTO}`

/** Avatar com foto e iniciais por baixo. `aria-hidden`: o nome já está no texto. */
export function AvatarPessoa({ nome, tamanho = 32 }: { nome: string; tamanho?: number }) {
  return (
    <span
      aria-hidden
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold text-white"
      style={{
        width: tamanho,
        height: tamanho,
        background: 'linear-gradient(140deg, #2f9c93, #086b6b)',
        border: '2px solid rgb(255 255 255 / 85%)',
      }}
    >
      {iniciais(nome)}
      <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${fotoPessoa(nome)})` }} />
    </span>
  )
}

/**
 * Cor do mapa de calor. No modo percentual, a cor vem da **mesma** escala do
 * farol (`tomDoCalor`): o mapa e o chip passam a dizer a mesma coisa sobre o
 * mesmo número. Antes havia cinco faixas aqui e três no farol, e 60% saía
 * salmão na célula e vermelho no chip ao lado.
 *
 * Ausente tem cor própria (cinza), distinta de zero (vermelho de verdade).
 */
const CORES_CALOR: Record<TomCalor, { bg: string; fg: string }> = {
  verde: { bg: '#0a7a3a', fg: '#fff' },
  amarelo: { bg: '#f2d27a', fg: '#4a3300' },
  vermelho: { bg: '#d9534f', fg: '#fff' },
  indisponivel: { bg: '#eff2f1', fg: '#8c9a97' },
}

export function corCalor(v: number | null, modo: 'pct' | 'valor', max: number) {
  if (modo === 'pct') return CORES_CALOR[tomDoCalor(v)]
  if (v === null || !Number.isFinite(v) || max <= 0) return CORES_CALOR.indisponivel
  const t = v / max
  if (t === 0) return CORES_CALOR.indisponivel
  const a = 0.12 + 0.88 * t
  return { bg: `rgba(0,149,139,${a})`, fg: a > 0.55 ? '#fff' : '#0d2340' }
}

/**
 * Legenda do mapa. A issue #21 pede que a leitura não dependa só da cor: cada
 * faixa aparece com o nome do estado, e a célula carrega o estado no `title`.
 */
export function LegendaCalor() {
  const itens: Array<{ tom: TomCalor; texto: string }> = [
    { tom: 'verde', texto: '≥ 100% da meta' },
    { tom: 'amarelo', texto: '70% a 99%' },
    { tom: 'vermelho', texto: 'abaixo de 70%' },
    { tom: 'indisponivel', texto: 'sem meta' },
  ]
  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#63748a]">
      {itens.map(({ tom, texto }) => (
        <li key={tom} className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CORES_CALOR[tom].bg, border: tom === 'indisponivel' ? '1px solid #d5dedc' : undefined }} />
          {texto}
        </li>
      ))}
    </ul>
  )
}

const TOM_LEGIVEL: Record<TomCalor, string> = {
  verde: 'na meta',
  amarelo: 'atenção',
  vermelho: 'abaixo de 70%',
  indisponivel: 'sem meta',
}

export function MapaCalor({ colunas, linhas, celulas, modo, grupos, formatarColuna = (c: string) => c }: { colunas: string[]; linhas: string[]; celulas: CelulaCalor[]; modo: 'pct' | 'valor'; grupos?: GrupoCalor[]; formatarColuna?: (c: string) => string }) {
  // Ausente fica de fora do máximo: `null` não participa de escala.
  const max = Math.max(0, ...celulas.map(c => c.valor ?? 0))
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-[12px]">
          <thead>
            {/* O agrupamento evita a leitura errada de que as cinco colunas medem a mesma coisa. */}
            {grupos && (
              <tr>
                <th />
                {grupos.map(g => (
                  <th key={g.rotulo} colSpan={g.ate - g.de + 1} scope="colgroup" className="pb-0.5 text-center text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a9a97]">{g.rotulo}</th>
                ))}
              </tr>
            )}
            <tr><th />{colunas.map(c => <th key={c} scope="col" className="px-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-[#63748a]">{formatarColuna(c)}</th>)}</tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={l}>
                <th scope="row" className="pr-2 text-left font-bold text-[#0d2340]">{l}</th>
                {colunas.map(c => {
                  const cel = celulas.find(x => x.linha === l && x.coluna === c)!
                  const { bg, fg } = corCalor(cel.valor, modo, max)
                  const texto = modo === 'pct'
                    ? cel.rotulo
                    : cel.valor === null || !Number.isFinite(cel.valor) ? '—' : R(cel.valor).replace('R$ ', '')
                  // O estado vai no title, para quem chega pela cor chegar também pelo texto.
                  const title = `${l} · ${formatarColuna(c)}: ${texto}${modo === 'pct' ? ` (${TOM_LEGIVEL[cel.tom]})` : ''}`
                  return <td key={c} title={title} className="h-10 min-w-[64px] rounded-md text-center font-bold" style={{ background: bg, color: fg }}>{texto}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modo === 'pct' && <LegendaCalor />}
    </div>
  )
}

export function Tabela({ cab, linhas, alinhar = [] }: { cab: string[]; linhas: ReactNode[][]; alinhar?: ('l' | 'r')[] }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-[#dfe8ef] bg-white">
      <table className="w-full border-collapse text-[12.5px]">
        <thead><tr>{cab.map((c, i) => <th key={c} className={`whitespace-nowrap border-b border-[#dfe8ef] bg-[#f8faf9] px-3 py-2 text-[10.5px] font-bold uppercase tracking-wide text-[#63748a] ${alinhar[i] === 'r' ? 'text-right' : 'text-left'}`}>{c}</th>)}</tr></thead>
        <tbody>{linhas.map((l, i) => <tr key={i} className="border-b border-[#eef2f1] last:border-0">{l.map((c, j) => <td key={j} className={`px-3 py-2 align-top text-[#33466c] ${alinhar[j] === 'r' ? 'whitespace-nowrap text-right tabular-nums' : ''}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

