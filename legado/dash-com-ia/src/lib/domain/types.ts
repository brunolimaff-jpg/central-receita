// Tipos compartilhados do domínio (DTOs serializáveis — datas em ISO string).
// Usados tanto pelas rotas de API quanto pelo frontend.

import type { EtapaResolvida, FonteTaxonomia, ValorTaxonomiaResolvido } from './crm-taxonomy'
import type { CompetenciaPex, ForecastPexDTO, TotalizadorPex } from './forecast-pex'

const NOMES_FONTES = {
  pdf_crm_integrado_mg: 'PDF CRM Integrado MG',
  briefing_anterior: 'briefing anterior',
  fixture: 'fixture',
} as const

function estadoEFonte(valor: EtapaResolvida | ValorTaxonomiaResolvido): string {
  const estado = {
    observado: 'observado',
    autorizado_anterior: 'autorizado pelo briefing anterior',
    fixture: 'fixture',
    nao_mapeado: 'não mapeada',
  }[valor.estado_mapeamento]
  const fontes = valor.fontes.map((fonte) => NOMES_FONTES[fonte])
  return fontes.length ? `${estado}; fontes: ${fontes.join(', ')}` : `${estado}; fonte não identificada`
}

export function rotuloEtapaTaxonomia(etapa: EtapaResolvida): string {
  return `${etapa.rotulo} (${estadoEFonte(etapa)})`
}

export function rotuloNaturezaVendaTaxonomia(natureza: ValorTaxonomiaResolvido): string {
  return `${natureza.rotulo || 'Não informado'} (${estadoEFonte(natureza)})`
}

export type Severidade = 'critica' | 'atencao' | 'info'

export interface UsuarioDTO {
  usuario_id: number
  nome: string
  email: string
  cargo: string
}

export interface ContaDTO {
  conta_id: number
  conta_id_erp: number | null
  razao_social: string
  fantasia: string
  cnpj_ficticio: string
  segmento: string
  filial: string
  municipio: string
  uf: string
  responsavel_id: number
  responsavel_nome: string
  criado_em: string
}

export interface OportunidadeDTO {
  oportunidade_id: number
  conta_id: number
  conta_fantasia: string
  conta_id_erp: number | null
  nome: string
  descricao: string | null
  responsavel_id: number
  responsavel_nome: string
  classificacao_fixture: string | null
  natureza_venda_taxonomia: ValorTaxonomiaResolvido
  tipo_oportunidade: string | null
  subtipo_oportunidade: string | null
  filial: string
  etapa: string
  etapa_taxonomia: EtapaResolvida
  situacao: 'Aberta' | 'Ganha' | 'Perdida'
  probabilidade: number
  origem: string
  suborigem: string | null
  previsao_inicial: string
  previsao_atual: string | null
  fechamento_efetivo: string | null
  valor_previsto: number
  valor_fechado: number | null
  motivo_fechamento: string | null
  motivo_perda: string | null
  criada_em: string
  marcador_teste: string | null
}

// Linha da fila de oportunidades (oportunidade + leituras derivadas determinísticas)
export interface OportunidadeLinha extends OportunidadeDTO {
  dias_em_aberto: number | null
  dias_desde_ultima_acao: number | null
  previsao_vencida_ha_dias: number | null
  dias_ate_previsao: number | null
  sinais: string[]
}

export interface AcaoDTO {
  acao_id: number
  oportunidade_id: number
  data_acao: string
  acao_pedido: boolean
  tipo_acao: string
  muda_oportunidade: boolean
  muda_status: boolean
  notificado: boolean
  observacoes_acao: string | null
  usuario_cadastro_id: number
  usuario_cadastro_nome: string
  data_cadastro: string
  usuario_alteracao_id: number | null
  usuario_alteracao_nome: string | null
  data_alteracao: string | null
}

export interface CompromissoDTO {
  compromisso_id: number
  oportunidade_id: number
  conta_id: number
  data_hora: string
  assunto: string
  atividade: string
  descricao: string | null
  responsavel_id: number
  responsavel_nome: string
  situacao: string
  aceite: string
}

export interface PropostaDTO {
  proposta_id: number
  oportunidade_id: number
  numero: string
  versao: number
  data_emissao: string
  valor: number
  situacao: string
  valida: boolean
}

export interface OcorrenciaDTO {
  ocorrencia_id: number
  oportunidade_id: number
  tipo: string
  situacao: string
  data: string
}

export interface QicDTO {
  qic_id: number
  oportunidade_id: number
  identificador: string | null
  situacao: string
}

export interface ConcorrenteDTO {
  concorrente_id: number
  oportunidade_id: number
  nome: string
  situacao: string
}

export interface PedidoDTO {
  pedido_id: number
  oportunidade_id: number
  numero: string
  data_pedido: string
  valor: number
  conferido: boolean
  data_conferencia: string | null
}

export interface Snapshot {
  meta: Record<string, string>
  usuarios: UsuarioDTO[]
  contas: ContaDTO[]
  oportunidades: OportunidadeDTO[]
  acoes: AcaoDTO[]
  compromissos: CompromissoDTO[]
  propostas: PropostaDTO[]
  ocorrencias: OcorrenciaDTO[]
  qics: QicDTO[]
  concorrentes: ConcorrenteDTO[]
  pedidos: PedidoDTO[]
}

// ---------- Radar ----------
export interface SinalOportunidade {
  codigo: string
  titulo: string
  severidade: Severidade
  detalhe: string
}

export interface ReferenciaOportunidade {
  oportunidade_id: number
  nome: string
  conta_fantasia: string
  etapa: string
  etapa_taxonomia: EtapaResolvida
  situacao: string
  valor_previsto: number
  contexto: string
}

export interface RegraRadar {
  codigo: string
  nome: string
  severidade: Severidade
  regra: string
  limitacao: string
  decisao_pendente: string
  quantidade: number
  valor_exposto: number
  responsaveis: number
  concentracao_etapas: string
  oportunidades: ReferenciaOportunidade[]
}

// ---------- Visão ----------
export interface Indicador {
  rotulo: string
  valor: string
  contexto?: string
  tom: 'neutro' | 'positivo' | 'atencao' | 'critico'
}

export interface ItemFunil {
  etapa: string
  etapa_taxonomia: EtapaResolvida
  quantidade: number
  valor: number
}

export interface MudancaRecente {
  data: string
  oportunidade_id: number
  oportunidade_nome: string
  conta_fantasia: string
  tipo: 'Situação' | 'Etapa' | 'Pedido'
  descricao: string
  responsavel: string
}

export interface VisaoDTO {
  briefing: string[]
  indicadores: Indicador[]
  forecast_pex: ForecastPexDTO
  naturezas_mes: NaturezaComercialMesDTO[]
  funil: ItemFunil[]
  origens: Array<{ origem: string; quantidade: number; valor: number }>
  topContas: Array<{ conta_id: number; fantasia: string; segmento: string; quantidade: number; valor: number }>
  atencao: {
    criticas: number
    atencao: number
    valor_em_risco: number
    oportunidades_atencao: number
  }
  mudancas_recentes: MudancaRecente[]
  jornada: { etapa: string; descricao: string; quantidade: number }[]
  snapshot_em: string
  // Anexado por spread na rota /api/visao — visaoComercial não produz (por isso opcional).
  gestao?: GestaoDTO
}

export type NaturezaComercialMes = 'New Name / Novo Cliente' | 'Cross / Up Sell'

export interface NaturezaComercialMesDTO {
  natureza: NaturezaComercialMes
  rotulo: 'New Name' | 'Cross / Up Sell'
  estado_mapeamento: 'observado' | 'autorizado_anterior'
  fontes: FonteTaxonomia[]
  entradas_criadas: number
  ganhos_mes: TotalizadorPex
  perdidas_mes: number
  abertas_previstas_mes: TotalizadorPex
}

// ---------- Detalhe ----------
export interface EventoTimeline {
  data: string
  tipo_evento: 'criacao' | 'acao' | 'compromisso' | 'proposta' | 'ocorrencia' | 'pedido' | 'fechamento'
  titulo: string
  descricao: string
  origem_dado: string
  meta: Record<string, string>
}

export interface DetalheOportunidade {
  oportunidade: OportunidadeLinha
  snapshot_em: string | null
  versao_snapshot: string
  conta: ContaDTO
  acoes: AcaoDTO[]
  compromissos: CompromissoDTO[]
  propostas: PropostaDTO[]
  proposta_valida: PropostaDTO | null
  ocorrencias: OcorrenciaDTO[]
  qic: QicDTO | null
  concorrentes: ConcorrenteDTO[]
  pedido: PedidoDTO | null
  fio_da_receita: FioReceitaNo[]
  timeline: EventoTimeline[]
  irmas: Array<{ oportunidade_id: number; nome: string; situacao: string; etapa: string; valor_previsto: number }>
  observacoes: string[]
  sinais_detalhe: SinalDetalhe[]
}

export interface FioReceitaNo {
  objeto: 'SQL' | 'Conta' | 'Oportunidade' | 'Proposta' | 'Win/Loss' | 'Pedido'
  id: string | null
  data: string | null
  estado: string
  fonte: string
  relacao_entrada: string | null
}

export interface SqlSemOportunidadeDTO {
  objeto: 'SQL'
  id: string
  data: string
  estado: string
  fonte: string
  oportunidade_id: null
  relacao: null
}

export interface SinalDetalhe {
  codigo: string
  nome: string
  severidade: Severidade
  contexto: string
  decisao_pendente: string
  limitacao: string
}

// ---------- Agente ----------
export interface BlocoResposta {
  titulo: string
  colunas: string[]
  linhas: string[][]
}

export interface Proveniencia {
  consulta: string
  regra: string
  limitacao: string
}

export interface AgenteResposta {
  pergunta: string
  reconhecido: boolean
  texto: string
  blocos: BlocoResposta[]
  sugestoes: string[]
  proveniencia: Proveniencia
}

// ---------- Validações ----------
export interface Validacao {
  codigo: string
  titulo: string
  regra: string
  status: 'ok' | 'erro'
  detalhe: string
  evidencia: string[]
}

export interface RelatorioValidacoes {
  executado_em: string
  total: number
  ok: number
  erro: number
  validacoes: Validacao[]
}

// ---------- Fontes & Regras ----------
export interface FonteDTO {
  dominio: string
  origem: string
  atualizacao: string
  volume: number
  regras: string[]
  limitacoes: string[]
}

export interface RegraLeituraDTO {
  codigo: string
  objeto: string
  formula: string
  limitacao: string
}

// ---------- Mudanças (estado anterior → atual) ----------

export interface EstadoOportunidadeAnterior {
  oportunidade_id: number
  etapa: string
  tipo_oportunidade?: string | null
  situacao: 'Aberta' | 'Ganha' | 'Perdida'
  probabilidade: number
  previsao_atual: string | null
  valor_previsto: number
}

export interface ItemMudanca {
  oportunidade_id: number
  nome: string
  conta_fantasia: string
  responsavel_nome: string
  valor: number
  detalhe: string
}

export interface MudancaConcentrada extends ItemMudanca {
  contribuicao: number // com sinal: entrada +, saída −
  acumulado_pct: number
}

export interface MudancasDTO {
  anterior_em: string
  atual_em: string
  pipeline: { anterior: number; atual: number; delta: number }
  forecast_30d: { anterior: number; atual: number; delta: number }
  forecast_periodo: {
    dias: number
    anterior: number
    atual: number
    delta: number
    concentracao: { quantidade_explicam: number; pct_explicada: number; itens: MudancaConcentrada[] }
  }
  resumo: {
    entradas: number
    entradas_valor: number
    saidas_ganhas: number
    saidas_ganhas_valor: number
    saidas_perdidas: number
    saidas_perdidas_valor: number
    deslocamentos: number
    deslocamentos_valor: number
    avancos: number
    avancos_valor: number
  }
  concentracao: {
    quantidade_explicam: number
    pct_explicada: number
    itens: MudancaConcentrada[]
  }
  entradas: ItemMudanca[]
  saidas_ganhas: ItemMudanca[]
  saidas_perdidas: ItemMudanca[]
  deslocamentos: ItemMudanca[]
  avancos: ItemMudanca[]
}

// ---------- Casos de Decisão ----------

export interface CasoDecisao {
  caso_id: string
  sinal_codigo: string
  sinal_nome: string
  severidade: Severidade
  oportunidade_id: number
  oportunidade_nome: string
  conta_fantasia: string
  etapa: string
  etapa_taxonomia: EtapaResolvida
  responsavel_nome: string
  impacto: number
  contexto: string
  evidencia: {
    ultima_acao: string | null
    ultima_acao_ha_dias: number | null
    compromisso_futuro: string | null
    proposta_valida: boolean
    dias_em_aberto: number | null
  }
  decisao_pendente: string
  estado: 'aguardando revisão' | 'em análise' | 'acompanhamento'
}

export interface CasosDTO {
  casos: CasoDecisao[]
  resumo: {
    total: number
    impacto_total: number
    criticos: number
    aguardando: number
    em_analise: number
    acompanhamento: number
  }
}

// ---------- Agora (caixa de atenção executiva) ----------

export interface ExemploAtencao {
  oportunidade_id: number
  nome: string
  conta_fantasia: string
  contexto: string
  valor: number
}

export interface SituacaoAtencao {
  ordem: number
  origem: 'mudanca' | 'radar'
  codigo: string
  severidade: Severidade
  titulo: string
  subtitulo: string
  quantidade: number
  impacto: number
  responsaveis: number
  concentracao_etapas: string
  por_que_apareceu: string
  limitacao: string
  decisao_pendente: string
  cta: { tela: 'casos' | 'mudancas' | 'radar'; rotulo: string }
  exemplos: ExemploAtencao[]
}

export interface SecaoPauta {
  titulo: string
  linhas: string[]
  quantidade: number
}

export type MotivoFila = 'previsao_vazia' | 'previsao_vencida' | 'sem_compromisso' | 'sem_atividade_registrada' | 'fecha_mes' | 'perda_ritmo'
export type MotivoMutirao = Extract<MotivoFila, 'previsao_vazia' | 'previsao_vencida' | 'sem_compromisso'>
export type GrupoFila = 'parado' | 'fecha_mes' | 'perda_ritmo' | 'mutirao'
export type AcaoSimulada = 'abrir' | 'retomar' | 'reprogramar'

export interface ItemFilaExecutiva {
  grupo: GrupoFila
  oportunidade_id: number
  conta_id: number
  conta_nome: string
  responsavel_id: number
  responsavel_nome: string
  etapa_taxonomia: EtapaResolvida
  natureza_venda_taxonomia: ValorTaxonomiaResolvido
  fontes: FonteTaxonomia[]
  motivos: MotivoFila[]
  impacto: number
  dias_desde_ultima_atividade: number | null
  criterio_ordenacao: string
  regra: string
  limitacao: string
  acao_simulada: AcaoSimulada[]
}

export interface GrupoMutiraoPorMotivo {
  motivo: MotivoMutirao
  oportunidade_ids: number[]
}

export interface AgoraDTO {
  situacoes: SituacaoAtencao[]
  pauta: SecaoPauta[]
  agenda_executiva: {
    competencia: CompetenciaPex
    fuso_horario: string
    itens: ItemFilaExecutiva[]
    mutirao_por_motivo: GrupoMutiraoPorMotivo[]
    limitacao_perda_ritmo: string
  }
  janela_forecast_dias: number
  snapshot_em: string
  anterior_em: string
}

// ---------- Win / Loss ----------

export interface FechoDTO {
  oportunidade_id: number
  nome: string
  conta_fantasia: string
  responsavel_nome: string
  data_fechamento: string
  valor_fechado: number
  motivo: string | null
  ciclo_dias: number | null
  pedido: { numero: string; conferido: boolean } | null
  ultima_acao_antes_fechamento: string | null
}

export interface MotivoAgregado {
  motivo: string
  quantidade: number
  valor: number
}

export interface WinLossDTO {
  janela_dias: number
  resumo: {
    ganhas: number
    valor_ganhas: number
    perdidas: number
    valor_perdidas: number
    taxa_ganho_valor: number | null
    ciclo_medio_dias: number | null
    ganhas_sem_pedido: number
    pedidos_nao_conferidos: number
    excluidas_datas_invalidas: number
  }
  ganhas: FechoDTO[]
  perdidas: FechoDTO[]
  motivos_perda: MotivoAgregado[]
  motivos_ganho: MotivoAgregado[]
}

// ---------- Gestão (cockpit de unidades) ----------

export interface SinalUnidadeDTO {
  codigo: string
  severidade: Severidade
  quantidade: number
  valor_exposto: number
}

export interface UnidadeResumoDTO {
  filial: string
  pipeline_qtd: number
  pipeline_valor: number
  entra_7d_qtd: number
  entra_7d_valor: number
  variacao_pipeline: number | null
  sinais: SinalUnidadeDTO[]
}

export interface EntradaDiaDTO {
  data: string
  quantidade: number
  valor: number
}

export interface EntradaTopDTO {
  oportunidade_id: number
  nome: string
  conta_fantasia: string
  filial: string
  valor_previsto: number
  previsao_atual: string
}

export interface EntraSemanaDTO {
  janela_dias: 7
  hoje: string
  total_qtd: number
  total_valor: number
  por_dia: EntradaDiaDTO[]
  top: EntradaTopDTO[]
}

export interface ItemExigeVoceDTO {
  filial: string
  codigo: string
  severidade: Severidade
  quantidade: number
  valor_exposto: number
  decisao_pendente: string
  oportunidades: ReferenciaOportunidade[]
}

export interface GestaoDTO {
  por_unidade: UnidadeResumoDTO[]
  entra_semana: EntraSemanaDTO
  exige_voce: ItemExigeVoceDTO[]
  limitacao_ranking: string
}
