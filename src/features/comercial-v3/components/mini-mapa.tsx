'use client'

import { useEffect, useState } from 'react'

/**
 * Mini mapa do Brasil: as UFs de um território pintadas na cor dele, as demais
 * em cinza claro formando o contorno do país. A geometria vem de
 * `/geo/brasil-ufs.json`, simplificada a partir da malha do IBGE (24 KB, 27 UFs,
 * ~1.800 pontos): o suficiente para um mapa de contexto, longe do peso de uma
 * biblioteca de mapas ou de um GeoJSON completo.
 *
 * O desenho é SVG puro, projetado em coordenadas equirretangulares — para a
 * escala de um cartão, a distorção do equador não aparece, e a projeção cabe em
 * oito linhas sem dependência.
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

/** Brasil inteiro; margem de 1 unidade para o traço não encostar na borda. */
const LON = [-74, -34]
const LAT = [-34, 6]
const VISTA = { largura: LON[1] - LON[0], altura: LAT[1] - LAT[0] }
const ESCALA = 8
const LARGURA = VISTA.largura * ESCALA
const ALTURA = VISTA.altura * ESCALA
const projetar = ([lon, lat]: [number, number]): string =>
  `${((lon - LON[0]) * ESCALA).toFixed(1)},${((LAT[1] - lat) * ESCALA).toFixed(1)}`

const caminhos = (malha: Malha, uf: string) =>
  (malha[uf] ?? []).map(anel => `M${anel.map(projetar).join('L')}Z`).join('')

export function MiniMapa({ ufs, cor, rotulo }: { ufs: string[]; cor: string; rotulo: string }) {
  const [malha, mudarMalha] = useState<Malha | null>(null)

  useEffect(() => {
    let vigente = true
    carregarMalha().then(dados => { if (vigente) mudarMalha(dados) }).catch(() => {})
    return () => { vigente = false }
  }, [])

  if (!malha) {
    // O mapa é apoio, não conteúdo: enquanto a malha não chega, ele só não aparece.
    return <div aria-hidden className="aspect-[100/82] w-full" />
  }

  const destacadas = new Set(ufs)
  const todas = Object.keys(malha).sort()

  return (
    <svg
      role="img"
      aria-label={rotulo}
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      className="aspect-[100/82] w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {todas.map(uf => (
        <path
          key={uf}
          d={caminhos(malha, uf)}
          fill={destacadas.has(uf) ? cor : 'rgb(51 70 108 / 9%)'}
          stroke={destacadas.has(uf) ? 'rgb(255 255 255 / 85%)' : 'rgb(51 70 108 / 12%)'}
          strokeWidth={destacadas.has(uf) ? 0.9 : 0.4}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
