export const bancoSinteticoLocal = 'file:../db/custom.db'

const CAMPOS_CONTAGEM = [
  'contas',
  'oportunidades',
  'acoes',
  'compromissos',
  'propostas',
  'ocorrencias',
  'qics',
  'concorrentes',
  'pedidos',
]

export function ambienteLocal(ambiente = process.env) {
  const configurado = ambiente.DATABASE_URL
  if (configurado && configurado !== bancoSinteticoLocal) {
    throw new Error('Este launcher aceita somente o SQLite sintético local configurado para a Central.')
  }

  return { ...ambiente, DATABASE_URL: bancoSinteticoLocal }
}

export function ehMetaDaCentral(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return false
  if (meta.produto !== 'Central de Receita' || meta.tipo_dados !== 'sinteticos') return false
  if (typeof meta.versao !== 'string' || !meta.versao.includes('mock')) return false
  if (!meta.contagens || typeof meta.contagens !== 'object' || Array.isArray(meta.contagens)) return false

  return CAMPOS_CONTAGEM.every((campo) => Number.isInteger(meta.contagens[campo]) && meta.contagens[campo] >= 0)
}
