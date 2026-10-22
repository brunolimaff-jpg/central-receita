import type { FioReceitaNo } from './types'

// Relações explícitas do exemplo sintético autorizado; não são deduzidas do CRM.
const FIO_339001: FioReceitaNo[] = [
  { objeto: 'SQL', id: '84521', data: '2026-04-15', estado: 'Aceito', fonte: 'CRM sintético', relacao_entrada: null },
  { objeto: 'Conta', id: '200001', data: null, estado: 'Agro Horizonte S.A.', fonte: 'CRM sintético', relacao_entrada: 'aceito como Conta' },
  { objeto: 'Oportunidade', id: '339001', data: null, estado: 'ERP GATec', fonte: 'CRM sintético', relacao_entrada: 'oportunidade criada para a Conta' },
  { objeto: 'Proposta', id: '427070', data: null, estado: 'Válida', fonte: 'CRM sintético', relacao_entrada: 'proposta vinculada à Oportunidade' },
  { objeto: 'Win/Loss', id: null, data: '2026-07-31', estado: 'Win', fonte: 'CRM sintético', relacao_entrada: 'fechamento registrado na Oportunidade' },
  { objeto: 'Pedido', id: '212625', data: '2026-08-18', estado: 'Em conferência', fonte: 'CRM sintético', relacao_entrada: 'Pedido posterior ao Win' },
]

export function fioDaReceita(oportunidadeId: number): FioReceitaNo[] {
  return oportunidadeId === 339001 ? FIO_339001.map((no) => ({ ...no })) : []
}

// Registro sintético separado para exercitar SQL aceito sem Oportunidade criada.
// A ausência de relação é intencional; não sugere falha nem conversão automática.
export const SQL_SEM_OPORTUNIDADE = {
  objeto: 'SQL' as const,
  id: '84522',
  data: '2026-08-20',
  estado: 'Aceito',
  fonte: 'CRM sintético',
  oportunidade_id: null,
  relacao: null,
}
