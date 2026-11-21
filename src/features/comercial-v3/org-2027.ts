/**
 * Estrutura comercial proposta para 2027 (Diretoria de Mercado · Venda Direta).
 *
 * Fonte: slides "Cobrimos o mercado por vertical e aprofundamos por horizontal",
 * "Organograma" e "Geografia de atuação — Territórios". O modelo está em
 * construção, sujeito a revisão orçamentária e discussão com o CE — por isso
 * os números aqui são a base de MRR declarada nos slides, não cálculo da carga.
 *
 * VALORES FICTÍCIOS: o repositório é público, então MRR, participação e grupos
 * (por vertical e por território) foram trocados por números inventados, com a
 * mesma forma dos originais — inclusive o resíduo da matriz por vertical, que
 * continua não fechando com o total. Os valores reais ficam fora do git.
 * Cinco territórios: o 05 (Norte) faz novos negócios via canais e tem a base
 * anexa ao Território 02, por isso não traz grupos nem MRR próprios.
 */

export type Pessoa = { nome: string | null; cargo: string; escopo?: string; /** Líderes de vendas abaixo do gerente. */ lideres?: Pessoa[] }

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

export const MRR_TOTAL = 52e6

export const VERTICAIS: Vertical[] = [
  {
    id: 'demais', nome: 'Demais Segmentos', cor: '#6b4fbb', icone: null,
    mrr: 24e6, participacao: 0.46, grupos: 1180,
    diretor: { nome: 'Giovanne Farias', cargo: 'Diretor de segmento' },
    gerentes: [
      { nome: 'José Tavares', cargo: 'Gerente de Vendas Base', escopo: 'Negócios Públicos', lideres: [
        { nome: null, cargo: 'Especialista', escopo: 'Negócios Públicos' },
      ] },
      { nome: 'Raíssa Delamora', cargo: 'Gerente de Vendas Base', lideres: [
        { nome: 'Elias Junior', cargo: 'Gerente de Vendas Enterprise', escopo: 'Sul + Centro-Oeste + Norte' },
        { nome: 'Felipe Santos', cargo: 'Gerente de Vendas Enterprise', escopo: 'Sudeste + Nordeste' },
        { nome: 'Alice da Silveira dos Reis', cargo: 'Líder de Vendas Base', escopo: 'Sul + Centro-Oeste + Norte' },
        { nome: 'Juliana Escarabelin Martins', cargo: 'Líder de Vendas Base', escopo: 'SP' },
        { nome: 'Edmilson Tadeu de Freitas', cargo: 'Líder de Vendas Base', escopo: 'MG · RJ · ES · Nordeste' },
      ] },
      { nome: 'Sabrina Bowens', cargo: 'Gerente de Vendas Novos', escopo: 'Sudeste + Nordeste' },
      { nome: 'Carina Baldissera', cargo: 'Gerente de Vendas Novos', escopo: 'Sul + Centro-Oeste' },
    ],
    resumo: '6 gerentes de vendas · 3 líderes de vendas',
  },
  {
    id: 'construcao', nome: 'Construção', cor: '#e0882b', icone: 'construcao',
    mrr: 11e6, participacao: 0.21, grupos: 860,
    diretor: { nome: 'Marcos Paulo Malagola', cargo: 'Diretor de segmento' },
    gerentes: [
      { nome: 'Alexandre Kahler', cargo: 'Gerente de Vendas Base', lideres: [
        { nome: 'Ana Cristina Santos', cargo: 'Líder de Vendas Base', escopo: 'Nacional Tech Touch' },
        { nome: 'Luiz Andre Bento Ribeiro', cargo: 'Líder de Vendas Base', escopo: 'Sul + Centro-Oeste + Norte' },
        { nome: 'Andre Luis de Oliveira', cargo: 'Líder de Vendas Base', escopo: 'Sudeste + Nordeste' },
      ] },
      { nome: 'Gabriele Nayara Dias Correa', cargo: 'Gerente de Vendas Novos', escopo: 'Sudeste + Nordeste' },
      { nome: 'Mario Borges', cargo: 'Gerente de Vendas Novos', escopo: 'Sul + Centro-Oeste' },
    ],
    chegando: ['Obra Prima'],
    resumo: '3 gerentes de vendas · 3 líderes de vendas',
  },
  {
    id: 'industria', nome: 'Indústria', cor: '#2f6fc6', icone: 'industria',
    mrr: 10e6, participacao: 0.19, grupos: 540,
    diretor: { nome: null, cargo: 'Diretor de segmento' },
    gerentes: [
      { nome: 'Vitor Diego', cargo: 'Gerente de Vendas Base', lideres: [
        { nome: 'Samanta de Andrade Alves', cargo: 'Líder de Vendas Base', escopo: 'Sul + Centro-Oeste + Norte' },
        { nome: 'Vinnicius Gomes de Arruda', cargo: 'Líder de Vendas Base', escopo: 'Sudeste + Nordeste' },
      ] },
      { nome: 'Daniel Augusto', cargo: 'Gerente de Vendas Novos' },
    ],
    resumo: '2 gerentes de vendas · 2 líderes de vendas',
  },
  {
    id: 'agro', nome: 'Agronegócio', cor: '#2e8b57', icone: 'agronegocio',
    mrr: 7e6, participacao: 0.13, grupos: 320,
    diretor: { nome: 'Fernando Silva', cargo: 'Diretor de segmento' },
    gerentes: [
      { nome: 'Matheus Martins', cargo: 'Gerente de Vendas Base', lideres: [
        { nome: 'Agnaldo Paz', cargo: 'Líder de Vendas Base', escopo: 'Sul + Centro-Oeste + Norte' },
        { nome: 'Frederico Freitas', cargo: 'Líder de Vendas Base', escopo: 'Sudeste + Nordeste' },
      ] },
      { nome: 'Alessandra Di Sicco', cargo: 'Gerente de Vendas Novos' },
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
  /**
   * Portfólio comercial não é subordinação: estas marcas reportam formalmente
   * à Diretoria de Novos Negócios e RI, não à Diretoria de Mercado
   * (diretório corporativo, out/2026).
   */
  novosNegocios: ['Konviva', 'Hypnobox', 'GATEC', 'Jobconvo'],
}

export type Territorio = {
  numero: number
  nome: string
  ufs: string
  cor: string
  grupos: number
  mrr: number
  /** Território sem base própria: só a regra de atuação. */
  nota?: string[]
  /** MRR por vertical, na ordem de `VERTICAIS`. */
  porVertical: Record<VerticalId, { grupos: number; mrr: number }> | null
}

export const TERRITORIOS: Territorio[] = [
  { numero: 1, nome: 'Território 01', ufs: 'RS · SC · PR', cor: '#12b5bf', grupos: 770, mrr: 13.7e6,
    porVertical: { agro: { grupos: 70, mrr: 1.6e6 }, construcao: { grupos: 110, mrr: 1.5e6 }, industria: { grupos: 190, mrr: 3.4e6 }, demais: { grupos: 400, mrr: 7.2e6 } } },
  { numero: 2, nome: 'Território 02', ufs: 'MT + MS · DF · GO / TO', cor: '#ee8f3f', grupos: 530, mrr: 7.2e6,
    porVertical: { agro: { grupos: 90, mrr: 2.0e6 }, construcao: { grupos: 300, mrr: 2.4e6 }, industria: { grupos: 30, mrr: 0.45e6 }, demais: { grupos: 110, mrr: 2.3e6 } } },
  { numero: 3, nome: 'Território 03', ufs: 'São Paulo Capital · Interior', cor: '#8cc63f', grupos: 960, mrr: 19.7e6,
    porVertical: { agro: { grupos: 80, mrr: 1.8e6 }, construcao: { grupos: 240, mrr: 4.1e6 }, industria: { grupos: 220, mrr: 4.2e6 }, demais: { grupos: 420, mrr: 9.6e6 } } },
  { numero: 4, nome: 'Território 04', ufs: 'Nordeste · MG · RJ / ES', cor: '#2fae6c', grupos: 640, mrr: 11.4e6,
    porVertical: { agro: { grupos: 80, mrr: 1.5e6 }, construcao: { grupos: 210, mrr: 2.9e6 }, industria: { grupos: 100, mrr: 1.9e6 }, demais: { grupos: 250, mrr: 5.0e6 } } },
  { numero: 5, nome: 'Território 05', ufs: 'Norte', cor: '#f2a974', grupos: 0, mrr: 0, porVertical: null,
    nota: ['Novos negócios via canais', 'Base anexa ao Território 02'] },
]

export const iniciais = (nome: string | null) =>
  nome ? nome.split(/\s+/).filter(p => p.length > 2 || /^[A-ZÁ-Ú]/.test(p)).slice(0, 2).map(p => p[0]).join('').toUpperCase() : '?'

/** Foto opcional em `public/pessoas/<slug>.jpg`; sem arquivo, o avatar usa as iniciais. */
export const slugPessoa = (nome: string) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
