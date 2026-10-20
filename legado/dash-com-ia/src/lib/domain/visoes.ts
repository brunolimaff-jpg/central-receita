import type { ContextoGlobal, Tela } from './navigation'

export interface VisaoPredefinida {
  id: string
  titulo: string
  categoria: string
  descricao: string
  destino: Tela
  contexto: Partial<ContextoGlobal>
  nota?: string
}

export const VISOES_PREDEFINIDAS: VisaoPredefinida[] = [
  {
    id: 'forecast-30',
    titulo: 'Forecast · próximos 30 dias',
    categoria: 'Forecast',
    descricao: 'Acompanhe a variação da projeção móvel na janela curta.',
    destino: 'mudancas',
    contexto: { janelaForecast: 30 },
    nota: 'Projeção móvel, PEX mensal e Forecast congelado são medidas diferentes.',
  },
  {
    id: 'fila-new-name',
    titulo: 'Fila New Name',
    categoria: 'Oportunidades',
    descricao: 'Abra oportunidades classificadas como New Name no fixture local.',
    destino: 'oportunidades',
    contexto: { classificacao: 'New Name / Novo Cliente' },
    nota: 'A classificação observada no fixture não comprova uma regra comercial de produção.',
  },
  {
    id: 'revisao-cross',
    titulo: 'Revisão de Cross',
    categoria: 'Oportunidades',
    descricao: 'Revise oportunidades classificadas como Cross / Up Sell no fixture.',
    destino: 'oportunidades',
    contexto: { classificacao: 'Cross / Up Sell' },
    nota: 'A classificação observada no fixture não substitui a Cartilha nem valida o reconhecimento da venda.',
  },
  {
    id: 'resultado-vendas',
    titulo: 'Resultado · Win / Loss',
    categoria: 'Resultado',
    descricao: 'Compare oportunidades ganhas e perdidas na janela da leitura atual.',
    destino: 'winloss',
    contexto: {},
    nota: 'Win, Pedido e resultado conferido permanecem estados distintos.',
  },
]
