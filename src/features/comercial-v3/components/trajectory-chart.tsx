'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionTemplate, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import {
  dateChartPositions,
  escalaDeValores,
  lineChartSegments,
  nearestChartPoint,
  separarRotulos,
  suavizar,
  thinAxisPositions,
} from '../chart-math'
import { formatarRealComSinal, formatarRealCompacto, formatarValorExato } from '../format'
import type { BridgeStep, TrajectoryBridge, TrajectoryModel, TrajectoryPoint, TrajectorySeries } from '../trajectory-model'
import { SPRING_SUAVE } from './motion-primitives'

const COR_LANCE: Record<BridgeStep['movimento'], string> = {
  Entrou: 'var(--dado-positivo)',
  Saiu: 'var(--dado-negativo)',
  'Alterou valor': 'var(--dado-info)',
}
const SINAL: Record<BridgeStep['movimento'], string> = { Entrou: '+', Saiu: '−', 'Alterou valor': '±' }

/**
 * Ponte entre cargas em degraus. Só existe com carga anterior; os lances só
 * aparecem quando a conta fecha (`ponte.publicada`). Valores em reais.
 */
function TrajectoryBridgeBlock({ ponte }: { ponte: TrajectoryBridge }) {
  const reduzido = useReducedMotion()
  const maior = Math.max(1, ...ponte.lances.map(lance => Math.abs(lance.valor)))
  const entrada = reduzido ? false : 'hidden'
  return (
    <section aria-label="Ponte entre cargas" className="mt-4 rounded-[10px] border border-hairline bg-white/60 px-3 py-3 text-[12px]">
      <p className="flex items-baseline justify-between gap-3 text-ink-muted">
        Previsto anterior <strong className="num text-[14px] font-bold text-ink-strong">{formatarRealCompacto(ponte.totalAnterior)}</strong>
      </p>
      {ponte.publicada ? (
        <motion.ul
          className="mt-2 grid gap-1.5 border-l border-hairline pl-3"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          initial={entrada}
          animate="show"
        >
          {ponte.lances.map(lance => (
            <motion.li
              key={lance.movimento}
              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: SPRING_SUAVE } }}
              className="grid grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-3"
            >
              <span className="text-ink-muted"><span aria-hidden>{SINAL[lance.movimento]} </span>{lance.movimento}</span>
              <span aria-hidden className="block h-2 rounded-full" style={{ width: `${Math.abs(lance.valor) / maior * 100}%`, background: COR_LANCE[lance.movimento] }} />
              <strong className="num font-semibold" style={{ color: COR_LANCE[lance.movimento] }}>{formatarRealComSinal(lance.valor)}</strong>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <p role="note" className="mt-2 rounded-[8px] bg-dado-atencao-suave px-3 py-2 text-ink-strong">
          Os movimentos não fecham com a diferença entre as cargas. O total de cada carga continua correto; a decomposição fica oculta até a próxima importação.
        </p>
      )}
      <motion.p
        className="mt-2 flex items-baseline justify-between gap-3 border-t border-hairline pt-2 text-ink-muted"
        initial={reduzido ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...SPRING_SUAVE, delay: reduzido ? 0 : ponte.lances.length * 0.08 }}
      >
        <span><span aria-hidden>= </span>Previsto atual</span>
        <strong className="num text-[15px] font-bold text-ink-strong">{formatarRealCompacto(ponte.totalAtual)}</strong>
      </motion.p>
      {/*
        Os totais em milhões e milhares são compactos por desenho. Quem confere
        a ponte precisa da diferença exata: R$ 24 mil → R$ 22 mil pareceria
        −R$ 2 mil quando a variação é −R$ 2.500. Só aparece quando a ponte foi
        publicada — se os movimentos não fecham, a diferença dos totais não é
        uma variação comparável.
      */}
      {ponte.publicada && ponte.totalAnterior !== null && ponte.totalAtual !== null && (
        <p className="mt-1 text-[11px] text-ink-subtle">
          Variação exata: <span className="num font-semibold text-ink-muted">{formatarValorExato(ponte.totalAtual - ponte.totalAnterior)}</span>
        </p>
      )}
    </section>
  )
}

/**
 * Curva da Trajetória da Receita.
 *
 * Consome o `TrajectoryModel` sem decidir regime: o modelo entrega as séries e o
 * componente só desenha. Movimento contido — um traço por série contínua, todos
 * com a mesma curva de 420ms; sem cascata, sem mola na área e sem rótulo entrando
 * depois. `pathLength` normaliza o comprimento pelo caminho, então o SVG mantém a
 * proporção (`xMidYMid meet`) para não deformar traço, espessura e pontos.
 */

const LARGURA_PADRAO = 960
const ALTURA = 300
const ESQUERDA = 78
const MARGEM_DIREITA = 24
const TOPO = 18
const ESPACO_ROTULOS_X = 40
const DESENHO = { duration: 0.9, ease: [0.2, 0, 0, 1] as const }
const MOLA_GUIA = { stiffness: 320, damping: 34, mass: 0.7 }

/** Valor que rola do anterior ao novo ao trocar de ponto; nasce já no valor, sem contar de zero. */
function ValorRolando({ valor }: { valor: number }) {
  const alvo = useMotionValue(valor)
  const mola = useSpring(alvo, { stiffness: 260, damping: 32, mass: 0.6 })
  const texto = useTransform(mola, atual => formatarRealCompacto(atual))
  useEffect(() => { alvo.set(valor) }, [valor, alvo])
  return <motion.span className="tabular-nums">{texto}</motion.span>
}

/** Ponto que desliza entre colunas seguindo a série, com halo. */
function CursorDaSerie({ x, y, cor }: { x: number; y: number; cor: string }) {
  const alvoX = useMotionValue(x)
  const alvoY = useMotionValue(y)
  const mx = useSpring(alvoX, MOLA_GUIA)
  const my = useSpring(alvoY, MOLA_GUIA)
  useEffect(() => { alvoX.set(x); alvoY.set(y) }, [x, y, alvoX, alvoY])
  return (
    <motion.g aria-hidden pointerEvents="none" style={{ x: mx, y: my }}
      initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
      <circle r="13" fill={cor} opacity="0.16" />
      <circle r="6.5" fill={cor} stroke="white" strokeWidth="2.5" />
    </motion.g>
  )
}

const COR: Record<TrajectorySeries['kind'], string> = {
  previsto: 'var(--verde-institucional)',
  realizado: 'var(--verde-escuro)',
  restante: 'var(--ink-subtle)',
}

/** Ordem de desenho da spec: área, ganhos no CRM, previsto e "restante" por último. */
const ORDEM_DESENHO: TrajectorySeries['kind'][] = ['realizado', 'previsto', 'restante']

const valorDoPonto = (serie: TrajectorySeries, ponto: TrajectoryPoint): number | null =>
  serie.kind === 'realizado' ? ponto.realized : ponto.forecast

const descrever = (rotulo: string, valor: number) => `${rotulo} ${formatarRealCompacto(valor)}`

/** Legenda direta nos traços: cada série pelo próprio nome e estilo, sem código de cor. */
export function TrajectoryLegend({ model }: { model: TrajectoryModel }) {
  const presentes = new Set(model.series.map(serie => serie.kind))
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-ink-muted" aria-label="Legenda do gráfico">
      {presentes.has('previsto') && (
        <span className="inline-flex items-center gap-1.5"><i aria-hidden className="h-[3px] w-4 rounded-full bg-brand" />Previsto</span>
      )}
      {presentes.has('realizado') && (
        <span className="inline-flex items-center gap-1.5"><i aria-hidden className="h-[3px] w-4 rounded-full bg-brand-escuro" />Ganhos no CRM</span>
      )}
      {presentes.has('restante') && (
        <span className="inline-flex items-center gap-1.5"><i aria-hidden className="w-4 border-t-2 border-dashed border-ink-subtle" />Sem data</span>
      )}
    </span>
  )
}

type Coluna = {
  id: number
  /** Data ISO do ponto (no regime C, a data da carga). */
  date: string
  label: string
  /** Valores por série, na mesma ordem de `model.series`. */
  valores: Array<number | null>
}

/**
 * Colunas de inspeção. No regime C cada carga é um ponto — duas cargas no mesmo
 * dia continuam distintas, no mesmo X da data civil, com a hora no rótulo; o
 * eixo desenha um rótulo por posição. Em A e B as séries compartilham datas,
 * então a coluna é a data.
 */
function colunasDe(model: TrajectoryModel): Coluna[] {
  if (model.regime === 'C') {
    const base = model.series.find(serie => serie.kind === 'previsto')?.points ?? model.series[0]?.points ?? []
    return base.map((ponto, indice) => ({
      id: indice,
      date: ponto.date,
      label: ponto.label,
      valores: model.series.map(serie => {
        const item = serie.points[indice]
        return item && item.date === ponto.date ? valorDoPonto(serie, item) : null
      }),
    }))
  }
  const datas = [...new Set(model.series.flatMap(serie => serie.points.map(ponto => ponto.date)))].sort((a, b) => a.localeCompare(b))
  return datas.map((data, id) => ({
    id,
    date: data,
    label: model.series.flatMap(serie => serie.points).find(ponto => ponto.date === data)?.label ?? data,
    valores: model.series.map(serie => {
      const ponto = serie.points.find(item => item.date === data)
      return ponto ? valorDoPonto(serie, ponto) : null
    }),
  }))
}

/**
 * `altura` permite a versão compacta da Home sem mexer no desenho: eixo, escala
 * e rótulos seguem os mesmos cálculos, só a área do SVG encolhe.
 */
export function TrajectoryChart({ model, altura = ALTURA }: { model: TrajectoryModel; altura?: number }) {
  const reduzido = useReducedMotion()
  const [indicePointer, setIndicePointer] = useState<number | null>(null)
  const [indiceFoco, setIndiceFoco] = useState<number | null>(null)
  const [indiceEscolhido, setIndiceEscolhido] = useState<number | null>(null)
  const [largura, setLargura] = useState(LARGURA_PADRAO)
  const areaRef = useRef<HTMLDivElement>(null)
  const guia = useMotionValue(ESQUERDA)
  const larguraMovel = useMotionValue(LARGURA_PADRAO)
  const percentualMovel = useTransform([guia, larguraMovel], ([gx, lw]: number[]) => Math.min(96, Math.max(4, gx / lw * 100)))
  const leftCartao = useMotionTemplate`${percentualMovel}%`
  const transicao = reduzido ? { duration: 0 } : DESENHO

  /*
   * O viewBox acompanha a largura real. Com `xMidYMid meet` a proporção é
   * preservada, então só restam duas escolhas para o eixo Y — mais altura (traço
   * fino e esticado) ou largura fixa (curva achatada). Medir a largura mantém a
   * espessura do traço e o raio dos pontos iguais em qualquer tela.
   */
  useEffect(() => {
    const elemento = areaRef.current
    if (!elemento || typeof ResizeObserver === 'undefined') return
    const observador = new ResizeObserver(entradas => {
      const medida = entradas[0]?.contentRect.width
      if (medida && medida > 0) { setLargura(Math.round(medida)); larguraMovel.set(Math.round(medida)) }
    })
    observador.observe(elemento)
    return () => observador.disconnect()
    // O gráfico nasce vazio enquanto a carga chega: sem refazer a medida
    // quando os dados aparecem, o SVG ficava em 960px encolhido na tela.
  }, [model.regime === 'vazio'])

  const direita = Math.max(ESQUERDA + 120, largura - MARGEM_DIREITA)
  const base = altura - ESPACO_ROTULOS_X
  const colunas = useMemo(() => colunasDe(model), [model])

  const xPorColuna = useMemo(() => {
    /*
     * O X é sempre a data civil. Em C, duas cargas no mesmo dia ficam no mesmo X
     * — são dois pontos preservados, com a hora no rótulo, não um ponto médio.
     */
    return dateChartPositions(colunas.map(coluna => coluna.date.slice(0, 10)), ESQUERDA, direita)
  }, [colunas, direita])

  const escala = useMemo(() => {
    const valores = model.series.flatMap(serie => serie.points.map(ponto => valorDoPonto(serie, ponto)))
      .filter((valor): valor is number => valor !== null)
    return escalaDeValores(valores)
  }, [model.series])

  /* Primeira entrada salta direto ao ponto; dali em diante a guia desliza. */
  const alvoGuia = indicePointer ?? indiceFoco ?? indiceEscolhido
  const xAtivo = alvoGuia !== null && alvoGuia < colunas.length ? (xPorColuna[alvoGuia] ?? ESQUERDA) : null
  const estavaAtivo = useRef(false)
  useEffect(() => {
    if (xAtivo === null) { estavaAtivo.current = false; return }
    if (!estavaAtivo.current) guia.jump(xAtivo)
    else animate(guia, xAtivo, { type: 'spring', ...MOLA_GUIA })
    estavaAtivo.current = true
  }, [xAtivo, guia])

  if (model.regime === 'vazio') {
    return (
      <div className="grid min-h-[210px] place-items-center rounded-[10px] border border-dashed border-hairline bg-white/45 px-4 text-center">
        <div>
          <p className="text-[14px] font-semibold text-ink-strong">A curva aparece quando houver carga do mês.</p>
          <p className="mt-1 text-[12px] text-ink-muted">Importe a planilha de oportunidades para acompanhar o acumulado dia a dia.</p>
        </div>
      </div>
    )
  }

  const y = (valor: number) => base - Math.min(Math.max(valor, 0), escala.topo) / escala.topo * (base - TOPO)

  /*
   * O ponto do traço "restante" carrega o acumulado do previsto, porque é dele
   * que o segmento tracejado sobe. O que ele representa para leitura é a
   * diferença sem data — nunca o total inteiro —, então rótulo e cartão usam
   * `previsto − datado`.
   */
  const restante = model.previsto !== null && model.datado !== null ? model.previsto - model.datado : null
  const valorDeLeitura = (indice: number, posicao: number): number | null =>
    model.series[posicao].kind === 'restante' ? restante : colunas[indice].valores[posicao]

  const lerColuna = (indice: number): Array<{ rotulo: string; valor: number; cor: string }> =>
    colunas[indice].valores.flatMap((_, posicao) => {
      const valor = valorDeLeitura(indice, posicao)
      return valor === null ? [] : [{ rotulo: model.series[posicao].rotulo, valor, cor: COR[model.series[posicao].kind] }]
    })

  const caminhos = model.series.map((serie, posicao) => ({
    serie,
    segmentos: lineChartSegments(colunas.map((_, indice) => {
      const valor = colunas[indice].valores[posicao]
      const x = xPorColuna[indice] ?? ESQUERDA
      return [x, valor === null ? null : y(valor)] as [number, number | null]
    })),
  }))

  const areaPrevisto = caminhos.find(caminho => caminho.serie.kind === 'previsto')?.segmentos
    .filter(segmento => segmento.length > 1)
    .map(segmento => `${suavizar(segmento)} L ${segmento[segmento.length - 1][0]} ${base} L ${segmento[0][0]} ${base} Z`) ?? []

  const rotulos = model.series.flatMap((serie, posicao) => {
    const indice = colunas.findLastIndex(coluna => valorDeLeitura(coluna.id, posicao) !== null)
    if (indice < 0) return []
    const valor = valorDeLeitura(indice, posicao) as number
    return [{
      id: serie.kind,
      x: xPorColuna[indice] ?? ESQUERDA,
      y: y(valor),
      valor,
      coluna: indice,
      texto: `${serie.rotulo} ${formatarRealCompacto(valor)}`,
      cor: COR[serie.kind],
    }]
  })
  const rotulosVisiveis = new Set(separarRotulos(rotulos))

  // Depois de uma nova carga, um índice escolhido antes pode não existir mais.
  const candidato = indicePointer ?? indiceFoco ?? indiceEscolhido
  const indiceAtivo = candidato !== null && candidato < colunas.length ? candidato : null
  const inspecionando = indiceAtivo !== null
  const leitura = indiceAtivo !== null ? lerColuna(indiceAtivo) : []
  const colunaAtiva = indiceAtivo !== null ? colunas[indiceAtivo] : null

  const ativar = (indice: number) => {
    setIndiceFoco(null)
    setIndiceEscolhido(indice)
    document.getElementById(`trajectory-ponto-${indice}`)?.focus()
  }
  const navegar = (event: KeyboardEvent<HTMLElement>, indice: number) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const proximo = Math.min(Math.max(indice + (event.key === 'ArrowRight' ? 1 : -1), 0), colunas.length - 1)
      ativar(proximo)
    } else if (event.key === 'Escape') {
      setIndiceEscolhido(null)
      setIndicePointer(null)
      setIndiceFoco(null)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIndiceFoco(null)
      setIndiceEscolhido(indice)
    }
  }
  const inspecionar = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') return
    const matriz = event.currentTarget.getScreenCTM()
    if (!matriz) return
    const ponto = new DOMPoint(event.clientX, event.clientY).matrixTransform(matriz.inverse())
    if (ponto.x < ESQUERDA || ponto.x > direita) { setIndicePointer(null); return }
    const indice = nearestChartPoint(ponto.x, xPorColuna)
    if (indice < 0) return
    setIndicePointer(indice)
  }

  const percentualGuia = indiceAtivo !== null ? (xPorColuna[indiceAtivo] ?? ESQUERDA) / largura * 100 : 50
  const cartaoADireita = percentualGuia < 50
  // Um rótulo por posição: cargas do mesmo dia compartilham o X, então as marcas
  // repetidas caem. Fica a primeira ocorrência de cada posição; a última posição
  // do eixo continua presente, porque a primeira ocorrência dela é ela mesma.
  const marcas = (() => {
    const vistos = new Set<number>()
    const unicas = thinAxisPositions(colunas.length).filter(indice => {
      const x = xPorColuna[indice]
      if (vistos.has(x)) return false
      vistos.add(x)
      return true
    })
    // Datas a menos de 56px da anterior encavalam ("20/10 21/10"); a última
    // data do eixo sempre fica, e quem sai é a vizinha.
    const espacadas: number[] = []
    unicas.forEach((indice, posicao) => {
      const anterior = espacadas.at(-1)
      const perto = anterior !== undefined && xPorColuna[indice] - xPorColuna[anterior] < 56
      if (!perto) espacadas.push(indice)
      else if (posicao === unicas.length - 1 && espacadas.length > 1) espacadas[espacadas.length - 1] = indice
    })
    return espacadas
  })()
  const ultimaMarca = marcas[marcas.length - 1]
  /*
   * Quando duas cargas dividem o X, a marca fica com a primeira. Só a última
   * posição do eixo precisa seguir a carga mais recente: ali o valor lido é o
   * dela, e um rótulo antigo ("08:00") contradiria o ponto desenhado ("23:10").
   */
  const rotuloDaMarca = (indice: number) => {
    if (indice !== ultimaMarca) return colunas[indice].label
    const mesmaPosicao = colunas.filter((_, i) => xPorColuna[i] === xPorColuna[indice])
    return mesmaPosicao.at(-1)?.label ?? colunas[indice].label
  }
  const semDataSufixo = model.semData === 1 ? '1 registro sem data' : `${model.semData} registros sem data`

  return (
    <div className="min-w-0">
      <div ref={areaRef} className="relative min-w-0" onPointerLeave={() => setIndicePointer(null)}>
        <svg
          role="group"
          aria-label="Trajetória da receita: acumulado por data. Use as setas para inspecionar cada ponto."
          onPointerMove={inspecionar}
          viewBox={`0 0 ${largura} ${altura}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto w-full"
        >
          <defs>
            <linearGradient id="trajectory-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--verde-institucional)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--verde-institucional)" stopOpacity="0.015" />
            </linearGradient>
          </defs>

          {Array.from({ length: escala.divisoes + 1 }, (_, divisao) => {
            const valor = divisao === escala.divisoes ? escala.topo : divisao * escala.passo
            const linha = y(valor)
            return (
              <g key={divisao}>
                <line x1={ESQUERDA} x2={direita} y1={linha} y2={linha} stroke="var(--hairline)" strokeDasharray="3 5" />
                <text x={ESQUERDA - 8} y={linha + 4} textAnchor="end" fill="var(--ink-muted)" fontSize="11" fontWeight="600">
                  {formatarRealCompacto(valor)}
                </text>
              </g>
            )
          })}

          {areaPrevisto.map((caminho, indice) => (
            <motion.path
              key={`area-${indice}`}
              d={caminho}
              fill="url(#trajectory-area-gradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transicao}
            />
          ))}

          {ORDEM_DESENHO.flatMap(kind => caminhos.filter(caminho => caminho.serie.kind === kind)).flatMap(({ serie, segmentos }, indiceSerie) => segmentos
            .filter(segmento => segmento.length > 1)
            .map((segmento, indiceSegmento) => (
              <motion.path
                key={`${serie.kind}-${indiceSerie}-${indiceSegmento}`}
                d={suavizar(segmento)}
                fill="none"
                stroke={COR[serie.kind]}
                strokeWidth={serie.kind === 'restante' ? 2.5 : 3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={serie.tracejado ? '6 5' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={transicao}
              />
            )))}

          {colunas.flatMap((coluna, indice) => coluna.valores.flatMap((valor, posicao) => {
            if (valor === null) return null
            return (
              <motion.circle
                key={`ponto-${indice}-${posicao}`}
                cx={xPorColuna[indice]}
                cy={y(valor)}
                r={3.5}
                fill={COR[model.series[posicao].kind]}
                stroke="white"
                strokeWidth="1.5"
                initial={reduzido ? false : { opacity: 0 }}
                animate={{ opacity: inspecionando && indice !== indiceAtivo ? 0.45 : 1 }}
                transition={reduzido ? { duration: 0 } : { duration: 0.25, delay: inspecionando ? 0 : 0.6 + indice / Math.max(1, colunas.length) * 0.3 }}
              />
            )
          }))}

          {inspecionando && colunaAtiva && (
            /* A guia é o único movimento com mola: ela acompanha o ponteiro. */
            <motion.g aria-hidden pointerEvents="none" style={{ x: guia }}>
              <line x1="0" x2="0" y1={TOPO} y2={base} stroke="var(--verde-escuro)" strokeWidth="1.5" strokeDasharray="4 3" />
            </motion.g>
          )}

          <AnimatePresence>
            {indiceAtivo !== null && colunas[indiceAtivo].valores.map((valor, posicao) => valor === null ? null : (
              <CursorDaSerie key={`cursor-${posicao}`} x={xPorColuna[indiceAtivo] ?? ESQUERDA} y={y(valor)} cor={COR[model.series[posicao].kind]} />
            ))}
          </AnimatePresence>

          {marcas.map(indice => (
            <text
              key={`marca-${indice}-${colunas[indice].label}`}
              x={xPorColuna[indice]}
              y={altura - 10}
              textAnchor={colunas.length === 1 ? 'middle' : indice === 0 ? 'start' : indice === ultimaMarca ? 'end' : 'middle'}
              fill="var(--ink-muted)"
              fontSize="11"
              fontWeight="600"
            >
              {rotuloDaMarca(indice)}
            </text>
          ))}
        </svg>

        <AnimatePresence>
          {inspecionando && colunaAtiva && leitura.length > 0 && (
            <motion.div
              key="cartao"
              className="pointer-events-none absolute top-3 z-10 w-max max-w-[min(260px,85%)] rounded-xl border border-white/70 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-md"
              style={{ left: leftCartao }}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: cartaoADireita ? 14 : 'calc(-100% - 14px)' }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
              <span className="block text-[11px] font-semibold text-ink-muted">{colunaAtiva.label}</span>
              {leitura.map(item => (
                <strong key={item.rotulo} className="num block text-[13px] font-bold" style={{ color: item.cor }}>
                  {item.rotulo} <ValorRolando valor={item.valor} />
                </strong>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sr-only focus-within:not-sr-only focus-within:mt-1 focus-within:flex focus-within:min-w-0 focus-within:gap-1 focus-within:overflow-x-auto" aria-label="Inspecionar datas da trajetória">
        {colunas.map((coluna, indice) => {
          const resumo = lerColuna(indice).map(item => descrever(item.rotulo, item.valor)).join(', ')
          return (
            <button
              id={`trajectory-ponto-${indice}`}
              key={`ponto-${indice}`}
              type="button"
              aria-pressed={indiceEscolhido === indice}
              aria-label={`Inspecionar ${coluna.label}${resumo ? `: ${resumo}` : ''}`}
              onPointerEnter={event => { if (event.pointerType !== 'touch') { setIndicePointer(indice); } }}
              onPointerLeave={event => { if (event.pointerType !== 'touch') setIndicePointer(null) }}
              onFocus={() => { setIndicePointer(null); setIndiceFoco(indice); }}
              onBlur={() => setIndiceFoco(null)}
              onClick={() => setIndiceEscolhido(indice)}
              onKeyDown={event => navegar(event, indice)}
              className="min-w-14 flex-1 whitespace-nowrap rounded-[6px] px-1 py-1.5 text-center text-[11px] text-ink-muted transition-colors hover:bg-dado-positivo-suave focus-visible:outline-2 focus-visible:outline-brand-escuro aria-pressed:bg-dado-positivo-suave aria-pressed:font-bold aria-pressed:text-brand-escuro"
            >
              {coluna.label}
            </button>
          )
        })}
      </div>

      <div role="status" aria-live="polite" className={colunaAtiva && leitura.length > 0 ? 'mt-2 rounded-[8px] border border-hairline bg-white/75 px-3 py-2 text-[12px]' : 'sr-only'}>
        {colunaAtiva && leitura.length > 0 && <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-ink-muted">{colunaAtiva.label}</span>{leitura.map(item => <strong key={item.rotulo} className="num font-bold" style={{ color: item.cor }}>{item.rotulo} {formatarRealCompacto(item.valor)}</strong>)}</span>}
      </div>

      <footer className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-hairline pt-3 text-[12px]">
        <span className="text-ink-muted">Previsto <strong className="num text-[15px] font-bold text-ink-strong">{formatarRealCompacto(model.previsto)}</strong></span>
        <span className="text-ink-muted">Ganhos no CRM <strong className="num text-[15px] font-bold text-ink-strong">{formatarRealCompacto(model.realizado)}</strong></span>
        {model.semData > 0 && <span className="text-ink-muted">{semDataSufixo} · <strong className="num font-semibold text-ink-strong">{formatarRealCompacto(model.datado)}</strong> com data</span>}
      </footer>

      {(model.regime === 'B' || model.regime === 'C') && model.ponte && <TrajectoryBridgeBlock ponte={model.ponte} />}
    </div>
  )
}
