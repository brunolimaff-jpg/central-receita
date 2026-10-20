'use client'

// Hook de acesso às APIs da Central de Receita (fetch relativo, GET).
// Erros viram estado `erro` para exibição com Alert + "Tentar novamente".
// Enquanto uma nova leitura está em curso, os dados anteriores permanecem
// (dados podem ficar obsoletos durante o carregamento).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type {
  DetalheOportunidade,
  FonteDTO,
  Indicador,
  OportunidadeLinha,
  RegraRadar,
  RegraLeituraDTO,
  RelatorioValidacoes,
  SinalOportunidade,
  SqlSemOportunidadeDTO,
} from '@/lib/domain/types'

// ---------- Envelopes das respostas de API ----------

export interface FilaResposta {
  total: number
  valor_aberto: number
  filtros: { situacao: string; etapa: string; sinal: string; responsavel: string; busca: string; ordenar: string }
  oportunidades: OportunidadeLinha[]
}

export interface SqlResposta {
  sql_sem_oportunidade: SqlSemOportunidadeDTO
}

export interface DetalheResposta extends DetalheOportunidade {
  sinais_detalhados: SinalOportunidade[]
}

export interface RadarResumo {
  criticas: number
  atencao: number
  valor_em_risco: number
  oportunidades_atencao: number
  sinais_distintos: number
}

export interface RadarResposta {
  resumo: RadarResumo
  regras: RegraRadar[]
  principio: string
  snapshot_em: string | null
  versao: string
}

export interface FontesResposta {
  fontes: FonteDTO[]
  regras: RegraLeituraDTO[]
  aviso: string
  snapshot_em: string | null
}

export interface MetaResposta {
  versao: string
  snapshot_em: string
  semente: string
  aviso: string
  contagens: Record<string, number>
  filiais: string[]
}

// ---------- Hook ----------

export interface EstadoApi<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

interface Resultado<T> {
  url: string
  tentativa: number
  dados: T | null
  erro: string | null
}

export function useApi<T>(url: string): EstadoApi<T> {
  const searchParams = useSearchParams()
  const fetchUrl = useMemo(() => {
    const [path, query = ''] = url.split('?', 2)
    const parametros = new URLSearchParams(query)
    for (const chave of ['filial', 'classificacao', 'janela', 'busca']) {
      const valor = searchParams.get(chave)
      if (valor && !parametros.has(chave)) parametros.set(chave, valor)
    }
    const serializado = parametros.toString()
    return serializado ? `${path}?${serializado}` : path
  }, [url, searchParams])
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controle = new AbortController()
    let ativo = true
    fetch(fetchUrl, { signal: controle.signal })
      .then(async (resposta) => {
        let corpo: unknown = null
        try {
          corpo = await resposta.json()
        } catch {
          corpo = null
        }
        if (!resposta.ok) {
          const msg =
            corpo && typeof corpo === 'object' && 'erro' in corpo && typeof (corpo as { erro: unknown }).erro === 'string'
              ? (corpo as { erro: string }).erro
              : `Falha na requisição (HTTP ${resposta.status})`
          throw new Error(msg)
        }
        if (!ativo) return
        setResultado({ url: fetchUrl, tentativa, dados: corpo as T, erro: null })
      })
      .catch((e: unknown) => {
        if (!ativo || (e instanceof DOMException && e.name === 'AbortError')) return
        setResultado({
          url: fetchUrl,
          tentativa,
          dados: null,
          erro: e instanceof Error ? e.message : 'Erro inesperado ao consultar a API',
        })
      })
    return () => {
      ativo = false
      controle.abort()
    }
  }, [fetchUrl, tentativa])

  const carregando = resultado === null || resultado.url !== fetchUrl || resultado.tentativa !== tentativa
  const dados = resultado?.dados ?? null
  const erro = carregando ? null : (resultado?.erro ?? null)
  const recarregar = useCallback(() => setTentativa((t) => t + 1), [])

  return { dados, carregando, erro, recarregar }
}

// ---------- Debounce da busca ----------

export function useDebounce<T>(valor: T, ms: number): T {
  const [valorEfetivo, setValorEfetivo] = useState(valor)
  useEffect(() => {
    const timer = setTimeout(() => setValorEfetivo(valor), ms)
    return () => clearTimeout(timer)
  }, [valor, ms])
  return valorEfetivo
}

export type { Indicador, RelatorioValidacoes }
