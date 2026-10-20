export type TipoFunil = 'privado' | 'publico' | 'nao_identificado'
export type FonteTaxonomia = 'pdf_crm_integrado_mg' | 'briefing_anterior' | 'fixture'
export type EstadoMapeamento = 'observado' | 'autorizado_anterior' | 'fixture' | 'nao_mapeado'

export interface EtapaResolvida {
  tipo_funil: TipoFunil
  etapa_bruta: string
  rotulo: string
  estado_mapeamento: EstadoMapeamento
  fontes: FonteTaxonomia[]
}

export interface ValorTaxonomiaResolvido {
  valor_bruto: string
  rotulo: string
  estado_mapeamento: EstadoMapeamento
  fontes: FonteTaxonomia[]
}

const ETAPAS_PRIVADAS = new Set([
  'Primeiro Contato de Venda',
  'Mapeamento da Necessidade',
  'Defesa Técnica',
  'Proposta',
  'Negociação',
])

const ETAPAS_PUBLICAS = new Set([
  'Primeiro Contato de Venda',
  'Mapeamento da Necessidade',
  'Análise de Documentos',
  'Proposta',
  'Negociação/Habilitação/Certame',
])

const NATUREZAS = new Map<string, { estado: EstadoMapeamento; fontes: FonteTaxonomia[] }>([
  ['Base', { estado: 'observado', fontes: ['pdf_crm_integrado_mg', 'briefing_anterior', 'fixture'] }],
  ['New Name', { estado: 'observado', fontes: ['pdf_crm_integrado_mg'] }],
  ['Cross', { estado: 'observado', fontes: ['pdf_crm_integrado_mg'] }],
  ['New Name / Novo Cliente', { estado: 'autorizado_anterior', fontes: ['briefing_anterior', 'fixture'] }],
  ['Cross / Up Sell', { estado: 'autorizado_anterior', fontes: ['briefing_anterior', 'fixture'] }],
  ['C4L', { estado: 'autorizado_anterior', fontes: ['briefing_anterior', 'fixture'] }],
])

export function resolverEtapaOportunidade(
  tipoOportunidade: string | null,
  etapaBruta: string,
): EtapaResolvida {
  const tipo_funil: TipoFunil = tipoOportunidade === 'Vendas Instituição Privada'
    ? 'privado'
    : tipoOportunidade === 'Vendas Instituição Pública'
      ? 'publico'
      : 'nao_identificado'
  const observada = tipo_funil === 'privado'
    ? ETAPAS_PRIVADAS.has(etapaBruta)
    : tipo_funil === 'publico' && ETAPAS_PUBLICAS.has(etapaBruta)

  const fontesValor: FonteTaxonomia[] = ['Originação', 'SQL'].includes(etapaBruta)
    ? ['briefing_anterior', 'fixture']
    : []
  return {
    tipo_funil,
    etapa_bruta: etapaBruta,
    rotulo: etapaBruta,
    estado_mapeamento: observada ? 'observado' : 'nao_mapeado',
    fontes: observada ? ['pdf_crm_integrado_mg'] : fontesValor,
  }
}

export function filtrarOportunidadesPorEtapa<T extends { etapa: string; etapa_taxonomia: EtapaResolvida }>(
  oportunidades: T[], etapaFiltro: string,
): T[] {
  if (etapaFiltro === 'todas') return oportunidades
  if (etapaFiltro === 'nao-mapeada' || etapaFiltro === 'nao-comprovado') {
    return oportunidades.filter((o) => o.etapa_taxonomia.estado_mapeamento === 'nao_mapeado')
  }
  return oportunidades.filter((o) => o.etapa === etapaFiltro)
}

export function resolverNaturezaVenda(valorBruto: string): ValorTaxonomiaResolvido {
  const mapeamento = NATUREZAS.get(valorBruto)
  return {
    valor_bruto: valorBruto,
    rotulo: valorBruto,
    estado_mapeamento: mapeamento?.estado ?? 'nao_mapeado',
    fontes: [...(mapeamento?.fontes ?? [])],
  }
}
