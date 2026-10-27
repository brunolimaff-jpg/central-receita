/**
 * Estrutura comercial proposta para 2027 (Diretoria de Mercado · Venda Direta).
 *
 * Fonte: slides "Cobrimos o mercado por vertical e aprofundamos por horizontal",
 * "Organograma" e "Geografia de atuação — Territórios". O modelo está em
 * construção, sujeito a revisão orçamentária e discussão com o CE — por isso
 * os números aqui são a base de MRR declarada nos slides, não cálculo da carga.
 * O Território 03 não veio nos slides: os valores dele são a diferença entre o
 * total por vertical e os demais territórios (`estimado: true`).
 */

export type Pessoa = { nome: string | null; cargo: string; escopo?: string }

export type VerticalId = 'demais' | 'agro' | 'construcao' | 'industria'
export type HorizontalId = 'erp' | 'hcm' | 'logistica'

export type Vertical = {
  id: VerticalId
  nome: string
  cor: string
  icone: string | null
  mrr: number
  participacao: number
  grupos: number
  diretor: Pessoa
  gerentes: Pessoa[]
  /** Produtos que chegam em 2027 dentro da vertical. */
  chegando?: string[]
  resumo: string
}

export type Horizontal = {
  id: HorizontalId
  nome: string
  produtos: string[]
  icone: string
  lider: Pessoa
}

export const CSO: Pessoa = { nome: 'Hermínio Gastaldi', cargo: 'CSO' }

export const MRR_TOTAL = 77.5e6

export const VERTICAIS: Vertical[] = [
  {
    id: 'demais', nome: 'Demais Segmentos', cor: '#6b4fbb', icone: null,
    mrr: 38e6, participacao: 0.49, grupos: 1634,
    diretor: { nome: 'Giovanne Farias', cargo: 'Diretor de segmento' },
    gerentes: [
      { nome: 'José Tavares', cargo: 'Gerente de Vendas Base', escopo: 'Negócios Públicos' },
      { nome: 'Raissa Delamora', cargo: 'Gerente de Vendas Base' },
      { nome: 'Sabrina Bezerra', cargo: 'Gerente de Vendas Novos', escopo: 'Sudeste + Nordeste' },
      { nome: 'Carina Baldissera', cargo: 'Gerente de Vendas Novos', escopo: 'Sul + Centro-Oeste' },
    ],
    resumo: '6 gerentes de vendas · 3 líderes de vendas',
  },
  {
    id: 'construcao', nome: 'Construção', cor: '#e0882b', icone: 'construcao',
    mrr: 15e6, participacao: 0.19, grupos: 1299,
    diretor: { nome: 'Marcos Paulo Malagola', cargo: 'Diretor de segmento' },
    gerentes: [
      { nome: 'Alexandre Kahler', cargo: 'Gerente de Vendas Base' },
      { nome: 'Gabriela Nayara Dias Correa', cargo: 'Gerente de Vendas Novos', escopo: 'Sudeste + Nordeste' },
      { nome: 'Mario Borges', cargo: 'Gerente de Vendas Novos', escopo: 'Sul + Centro-Oeste' },
    ],
    chegando: ['Obra Prima'],
    resumo: '3 gerentes de vendas · 3 líderes de vendas',
  },
  {
    id: 'industria', nome: 'Indústria', cor: '#2f6fc6', icone: 'industria',
    mrr: 14.5e6, participacao: 0.19, grupos: 752,
    diretor: { nome: null, cargo: 'Diretor de segmento' },
    gerentes: [
      { nome: 'Vitor Diego', cargo: 'Gerente de Vendas Base' },
      { nome: 'Daniel Augusto', cargo: 'Gerente de Vendas Novos' },
    ],
    resumo: '2 gerentes de vendas · 2 líderes de vendas',
  },
  {
    id: 'agro', nome: 'Agronegócio', cor: '#2e8b57', icone: 'agronegocio',
    mrr: 10e6, participacao: 0.13, grupos: 407,
    diretor: { nome: 'Fernando Silva', cargo: 'Diretor de segmento' },
    gerentes: [
      { nome: 'Matheus Martins', cargo: 'Gerente de Vendas Base' },
      { nome: 'Alessandra Diniz', cargo: 'Gerente de Vendas Novos' },
    ],
    chegando: ['GATEC'],
    resumo: '2 gerentes de vendas · 2 líderes de vendas',
  },
]

export const HORIZONTAIS_2027: Horizontal[] = [
  { id: 'erp', nome: 'ERP', produtos: ['ERP', 'Senior Capital'], icone: 'erp', lider: { nome: null, cargo: 'Gerente executivo de vendas', escopo: 'Atuação matricial' } },
  { id: 'hcm', nome: 'HCM', produtos: ['HCM', 'GRS', 'Wiipo'], icone: 'hcm', lider: { nome: null, cargo: 'Gerente executivo de vendas' } },
  { id: 'logistica', nome: 'Logística', produtos: ['Soluções de Logística'], icone: 'logistica', lider: { nome: 'Alexandre Mancini', cargo: 'Diretor de soluções horizontais' } },
]

export const AQUISICOES = {
  contempla: ['Forbiz', 'Konviva', 'Jobconvo', 'Hypnobox'],
  naoContempla: ['GATEC', 'CIGAM', 'Novasoft', 'Salú'],
}

export type Territorio = {
  numero: number
  nome: string
  ufs: string
  cor: string
  grupos: number
  mrr: number
  estimado?: boolean
  /** MRR por vertical, na ordem de `VERTICAIS`. */
  porVertical: Record<VerticalId, { grupos: number; mrr: number }>
}

export const TERRITORIOS: Territorio[] = [
  { numero: 1, nome: 'Território 01', ufs: 'RS · SC · PR', cor: '#12b5bf', grupos: 1104, mrr: 21.2e6,
    porVertical: { agro: { grupos: 109, mrr: 2.7e6 }, construcao: { grupos: 153, mrr: 2.2e6 }, industria: { grupos: 275, mrr: 5.0e6 }, demais: { grupos: 567, mrr: 11.3e6 } } },
  { numero: 2, nome: 'Território 02', ufs: 'MT · MS · DF · GO · Norte', cor: '#ee8f3f', grupos: 731, mrr: 10.0e6,
    porVertical: { agro: { grupos: 94, mrr: 2.1e6 }, construcao: { grupos: 450, mrr: 3.6e6 }, industria: { grupos: 37, mrr: 0.677e6 }, demais: { grupos: 150, mrr: 3.6e6 } } },
  { numero: 3, nome: 'Território 03', ufs: 'SP', cor: '#6b4fbb', grupos: 1375, mrr: 30.6e6, estimado: true,
    porVertical: { agro: { grupos: 103, mrr: 3.0e6 }, construcao: { grupos: 352, mrr: 5.9e6 }, industria: { grupos: 323, mrr: 6.4e6 }, demais: { grupos: 597, mrr: 15.3e6 } } },
  { numero: 4, nome: 'Território 04', ufs: 'Nordeste · MG · RJ / ES', cor: '#2fae6c', grupos: 882, mrr: 15.8e6,
    porVertical: { agro: { grupos: 101, mrr: 2.2e6 }, construcao: { grupos: 344, mrr: 3.3e6 }, industria: { grupos: 117, mrr: 2.4e6 }, demais: { grupos: 320, mrr: 7.8e6 } } },
]

export const iniciais = (nome: string | null) =>
  nome ? nome.split(/\s+/).filter(p => p.length > 2 || /^[A-ZÁ-Ú]/.test(p)).slice(0, 2).map(p => p[0]).join('').toUpperCase() : '?'

/** Foto opcional em `public/pessoas/<slug>.jpg`; sem arquivo, o avatar usa as iniciais. */
export const slugPessoa = (nome: string) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
