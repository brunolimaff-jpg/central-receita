'use client'

import { useEffect, useState } from 'react'

/**
 * Recorte geográfico do território: só as UFs dele, na cor dele, enquadradas na
 * própria extensão. Diferente de um mapa do Brasil inteiro — aqui o desenho é o
 * território, não o país com ele pintado dentro.
 *
 * A geometria vem de `/geo/brasil-ufs.json`, simplificada da malha do IBGE
 * (24 KB, 27 UFs, ~1.800 pontos). O SVG é puro, em coordenadas
 * equirretangulares: na escala de um cartão a distorção não aparece, e a
 * projeção cabe em poucas linhas sem biblioteca de mapas.
 */

type Malha = Record<string, Array<Array<[number, number]>>>
let cache: Promise<Malha> | null = null
const carregarMalha = () => {
  cache ??= fetch('/geo/brasil-ufs.json').then(resposta => {
    if (!resposta.ok) throw new Error('malha indisponível')
    return resposta.json() as Promise<Malha>
  })
  return cache
}

/**
 * Aspecto do quadro. Os extremos do organograma vão de um estado só (SP, quase
 * quadrado) ao Norte inteiro (largo e achatado); o limite evita que o recorte
 * esprema o cartão.
 */
const ASPECTO_MIN = 0.75
const ASPECTO_MAX = 1.6
const ALTURA = 56

export function MiniMapa({ ufs, cor, rotulo }: { ufs: string[]; cor: string; rotulo: string }) {
  const [malha, mudarMalha] = useState<Malha | null>(null)

  useEffect(() => {
    let vigente = true
    carregarMalha().then(dados => { if (vigente) mudarMalha(dados) }).catch(() => {})
    return () => { vigente = false }
  }, [])

  const aneis = malha ? ufs.flatMap(uf => malha[uf] ?? []) : []

  if (!malha || aneis.length === 0) {
    // O mapa é apoio, não conteúdo: enquanto a malha não chega, ele só não aparece.
    return <div aria-hidden style={{ height: ALTURA }} />
  }

  // Enquadramento pela extensão real das UFs destacadas, com folga de 4%.
  const longitudes = aneis.flatMap(anel => anel.map(([lon]) => lon))
  const latitudes = aneis.flatMap(anel => anel.map(([, lat]) => lat))
  const oeste = Math.min(...longitudes)
  const leste = Math.max(...longitudes)
  const sul = Math.min(...latitudes)
  const norte = Math.max(...latitudes)
  const folga = Math.max(leste - oeste, norte - sul) * 0.04 || 0.2
  const larguraGeo = leste - oeste + folga * 2
  const alturaGeo = norte - sul + folga * 2
  const largura = Math.min(Math.max(larguraGeo / alturaGeo, ASPECTO_MIN), ASPECTO_MAX) * ALTURA
  const escala = Math.min(largura / larguraGeo, ALTURA / alturaGeo)
  const deslocarX = (largura - larguraGeo * escala) / 2
  const deslocarY = (ALTURA - alturaGeo * escala) / 2

  const projetar = ([lon, lat]: [number, number]) =>
    `${(deslocarX + (lon - oeste + folga) * escala).toFixed(1)},${(deslocarY + (norte + folga - lat) * escala).toFixed(1)}`
  // Traço proporcional ao quadro: some no detalhe grande sem engrossar no pequeno.
  const traco = Math.max(escala * 0.12, 0.5)

  return (
    <svg
      role="img"
      aria-label={rotulo}
      viewBox={`0 0 ${largura.toFixed(1)} ${ALTURA}`}
      width={Math.round(largura)}
      height={ALTURA}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}
    >
      {aneis.map((anel, indice) => (
        <path
          key={indice}
          d={`M${anel.map(projetar).join('L')}Z`}
          fill={cor}
          fillOpacity={0.82}
          stroke="rgb(255 255 255 / 92%)"
          strokeWidth={traco}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
