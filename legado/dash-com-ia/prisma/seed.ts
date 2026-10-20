// ============================================================
// Central de Receita V1 — Seed determinístico (base sintética)
// ============================================================
// TODOS OS DADOS SÃO FICTÍCIOS. Nenhum CNPJ, nome, valor ou
// identificador corresponde a dados reais. O schema espelha o
// contrato físico conhecido; o conteúdo é 100% sintético.
//
// Execução: bun prisma/seed.ts   (bun run db:seed)
// Determinismo: PRNG mulberry32 com semente fixa (20250601).
// Datas ancoradas no dia da execução (snapshot).

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ---------- PRNG determinístico ----------
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(20250601)
const randInt = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1))
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
const chance = (p: number) => rng() < p

// ---------- Datas ----------
const AGORA = new Date()
const ANCORAA = new Date(AGORA.getFullYear(), AGORA.getMonth(), AGORA.getDate()) // hoje 00:00
const dias = (n: number) => {
  const d = new Date(ANCORAA)
  d.setDate(d.getDate() + n)
  return d
}
const comHora = (n: number, h: number, m = 0) => {
  const d = dias(n)
  d.setHours(h, m, 0, 0)
  return d
}
const diaDoFixture = (ano: number, mes: number, dia: number, hora = 12, minuto = 0) => {
  const alvo = new Date(ano, mes, dia, hora, minuto, 0, 0)
  return Math.round((alvo.getTime() - ANCORAA.getTime()) / 86400000)
}
const dataDoFixture = (ano: number, mes: number, dia: number, hora = 12, minuto = 0) =>
  new Date(ano, mes, dia, hora, minuto, 0, 0)

// ---------- Pools fictícios ----------
const USUARIOS = [
  { usuario_id: 1, nome: 'Marina Castro', email: 'marina.castro@exemplo-mock.com.br', cargo: 'Consultora de Contas' },
  { usuario_id: 2, nome: 'Rafael Nogueira', email: 'rafael.nogueira@exemplo-mock.com.br', cargo: 'Executivo de Vendas' },
  { usuario_id: 3, nome: 'Letícia Prado', email: 'leticia.prado@exemplo-mock.com.br', cargo: 'Executiva de Vendas' },
  { usuario_id: 4, nome: 'Diego Fernandes', email: 'diego.fernandes@exemplo-mock.com.br', cargo: 'Executivo de Vendas' },
  { usuario_id: 5, nome: 'Camila Torres', email: 'camila.torres@exemplo-mock.com.br', cargo: 'Consultora de Contas' },
  { usuario_id: 6, nome: 'Eduardo Lima', email: 'eduardo.lima@exemplo-mock.com.br', cargo: 'Executivo de Vendas' },
  { usuario_id: 7, nome: 'Patrícia Souza', email: 'patricia.souza@exemplo-mock.com.br', cargo: 'Executiva de Vendas Sênior' },
  { usuario_id: 8, nome: 'Henrique Alves', email: 'henrique.alves@exemplo-mock.com.br', cargo: 'Consultor de Contas' },
  { usuario_id: 9, nome: 'Gabriela Matos', email: 'gabriela.matos@exemplo-mock.com.br', cargo: 'Executiva de Vendas' },
  { usuario_id: 10, nome: 'Lucas Rocha', email: 'lucas.rocha@exemplo-mock.com.br', cargo: 'Analista de Pré-Vendas' },
]
const nomeDe = (id: number) => USUARIOS.find((u) => u.usuario_id === id)!.nome
const VENDEDORES = [2, 3, 4, 6, 7, 9] // responsáveis por oportunidade
const CONSULTORES_CONTA = [1, 5, 8] // responsáveis por conta (sempre ≠ vendedor)

const CONTAS_BASE: Array<[string, string, string, string, number | null]> = [
  // [fantasia, segmento, municipio, uf, conta_id_erp]
  ['Agro Horizonte', 'Agroindústria', 'Sorriso', 'MT', 36001],
  ['Sementes Vale Verde', 'Agroinsumos', 'Rio Verde', 'GO', 36002],
  ['Laticínios Pampa Dourado', 'Indústria de Alimentos', 'Pelotas', 'RS', 36003],
  ['Cooperativa Campo Claro', 'Cooperativa', 'Cascavel', 'PR', 36004],
  ['Distribuidora Ponta Sul', 'Distribuição', 'Joinville', 'SC', null],
  ['Transportes Rota Norte', 'Logística', 'Uberlândia', 'MG', 36005],
  ['Agro Cerrado Azul', 'Agroindústria', 'Barreiras', 'BA', 36006],
  ['Alimentos Serra Fina', 'Indústria de Alimentos', 'Serra', 'ES', null],
  ['Insumos Horizonte do Vale', 'Agroinsumos', 'Rondonópolis', 'MT', 36007],
  ['Casa & Obra Ponta Firme', 'Varejo', 'Cuiabá', 'MT', 36008],
  ['Óleo Brasil Tropical', 'Indústria de Alimentos', 'Dourados', 'MS', 36009],
  ['Agro Panorama', 'Agroindústria', 'Rio Verde', 'GO', null],
  ['Frigorífico Serra Branca', 'Indústria de Alimentos', 'Cuiabá', 'MT', 36010],
  ['Cooperativa Alto Vale', 'Cooperativa', 'Videira', 'SC', null],
  ['Log Expresso Meridional', 'Logística', 'Campinas', 'SP', 36011],
  ['Varejo Bom Preço Mais', 'Varejo', 'Fortaleza', 'CE', null],
  ['BioEnergia Mata Alta', 'Energia', 'Araçariguama', 'SP', 36012],
  ['Sementes Planalto Oeste', 'Agroinsumos', 'Palotina', 'PR', null],
  ['Distribuidora Minas Norte', 'Distribuição', 'Contagem', 'MG', 36013],
  ['Agro Rio Bonito', 'Agroindústria', 'Barra do Garças', 'MT', 36014],
  ['Laticínios Campo Belo', 'Indústria de Alimentos', 'Patos de Minas', 'MG', null],
  ['Transporte Carga Certa', 'Logística', 'Ribeirão Preto', 'SP', 36015],
  ['Cooperativa Vale do Sol', 'Cooperativa', 'Passo Fundo', 'RS', 36016],
  ['Varejo Ponta de Estoque', 'Varejo', 'Goiânia', 'GO', null],
  ['Agro Ipê Amarelo', 'Agroindústria', 'Primavera do Leste', 'MT', 36017],
  ['Alimentos Crosta Dourada', 'Indústria de Alimentos', 'Maringá', 'PR', 36018],
  ['Insumos Raiz Forte', 'Agroinsumos', 'Sinop', 'MT', null],
  ['TecnoTec Componentes', 'Indústria', 'São José dos Pinhais', 'PR', 36019],
  ['Agro Boa Safra', 'Agroindústria', 'Chapadão do Sul', 'MS', 36020],
  ['Distribuidora Litoral Vivo', 'Distribuição', 'Itajaí', 'SC', null],
]

const SUBTIPOS_OPORTUNIDADE = ['ERP GATec', 'ERP Senior', 'HCM Senior'] as const
const CLASSIFICACOES_FIXTURE = ['New Name / Novo Cliente', 'Base', 'Cross / Up Sell', 'C4L'] as const
const taxonomiaFixture = (id: number) => ({
  classificacao_fixture: CLASSIFICACOES_FIXTURE[(id - 339001) % CLASSIFICACOES_FIXTURE.length],
  tipo_oportunidade: 'Vendas Instituição Privada',
  subtipo_oportunidade: SUBTIPOS_OPORTUNIDADE[(id - 339001) % SUBTIPOS_OPORTUNIDADE.length],
})

const ORIGENS: Record<string, string[]> = {
  Inbound: ['Site institucional', 'Mídia paga', 'Webinar fictício'],
  Outbound: ['Prospecção ativa', 'Campanha de e-mail'],
  Indicação: ['Parceiro comercial', 'Cliente da base fictícia'],
  Evento: ['Feira fictícia do agronegócio', 'Congresso setorial fictício'],
  'Base instalada': ['Renovação de contrato', 'Upsell de módulos'],
  Portal: ['Chat do site'],
}

const ETAPAS = ['Originação', 'SQL', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento']
const PROB_POR_ETAPA: Record<string, [number, number]> = {
  Originação: [10, 20],
  SQL: [20, 30],
  Qualificação: [30, 45],
  Proposta: [50, 70],
  Negociação: [70, 85],
  Fechamento: [85, 95],
}

const MOTIVOS_FECHAMENTO = [
  'Prazo competitivo',
  'Condição de pagamento',
  'Relacionamento com a conta',
  'Superioridade técnica na demonstração',
  'Indicação de parceiro comercial',
]
const MOTIVOS_PERDA = [
  'Preço acima do esperado pelo cliente',
  'Concorrente escolhido',
  'Sem orçamento no cliente',
  'Projeto adiado pelo cliente',
  'Sem decisão / silêncio',
  'Escopo fora do padrão de produto',
]

const TIPOS_ACAO = ['Ligação', 'E-mail', 'Reunião', 'Follow-up', 'Demonstração', 'Visita técnica', 'Negociação', 'Proposta enviada']

const OBS_POR_TIPO: Record<string, string[]> = {
  Cadastro: ['Oportunidade registrada a partir de {origem}.', 'Criação do registro e enquadramento inicial.'],
  Ligação: ['Ligação de qualificação: dores atuais e urgência.', 'Contato telefônico com o decisor comercial.', 'Ligação de follow-up agendada pelo cliente.'],
  'E-mail': ['Envio de materiais e cases do segmento.', 'Follow-up por e-mail com resumo da conversa.'],
  Reunião: ['Reunião de diagnóstico com áreas comercial e fiscal.', 'Alinhamento de escopo com a diretoria.', 'Reunião de apresentação de proposta.'],
  'Follow-up': ['Follow-up sem resposta do cliente.', 'Retorno solicitado pelo cliente.'],
  Demonstração: ['Demonstração do produto para equipe do cliente.', 'Demonstração técnica com pré-vendas.'],
  'Visita técnica': ['Visita à unidade operacional do cliente.', 'Levantamento de infraestrutura em campo.'],
  Negociação: ['Discussão de condições comerciais e desconto.', 'Negociação de prazo de implantação.'],
  'Proposta enviada': ['Proposta enviada por e-mail ao decisor.', 'Revisão da proposta após ajuste de escopo.'],
  Ganho: ['Contrato assinado. Registro de fechamento.', 'Fechamento aprovado pelo comitê do cliente.'],
  Perda: ['Registro de perda com motivo informado.', 'Cliente comunicou decisão por outra solução.'],
  'Pedido registrado': ['Pedido emitido no ERP (número fictício).', 'Pedido registrado pelo back-office.'],
}

const CONCORRENTES_POOL = ['SoftSul Sistemas', 'ERPGlobal do Brasil', 'TecnoPar ERP', 'DeltaSoft', 'Núcleo Sistemas', 'MasterAgro TI']
const ATIVIDADES_COMPROMISSO = ['Reunião', 'Ligação', 'Demonstração', 'Visita técnica', 'Workshop']

function cnpjFicticio() {
  const d = () => randInt(0, 9)
  const dig = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${dig(d())}${dig(d())}.${dig(d())}${dig(d())}${dig(d())}.${dig(d())}${dig(d())}${dig(d())}/0001-${dig(d())}${dig(d())}`
}

function valorArredondado(min: number, max: number) {
  return randInt(min / 500, max / 500) * 500
}

// ---------- Estruturas de saída ----------
type ContaSeed = {
  conta_id: number; conta_id_erp: number | null; razao_social: string; fantasia: string; cnpj_ficticio: string;
  segmento: string; filial: string; municipio: string; uf: string; responsavel_id: number; criado_em: Date
}
type OportunidadeSeed = {
  oportunidade_id: number; conta_id: number; nome: string; descricao: string; responsavel_id: number;
  classificacao_fixture: string; tipo_oportunidade: string; subtipo_oportunidade: string; etapa: string;
  situacao: string; probabilidade: number; origem: string; suborigem: string; previsao_inicial: Date;
  previsao_atual: Date | null; fechamento_efetivo: Date | null; valor_previsto: number; valor_fechado: number | null;
  motivo_fechamento: string | null; motivo_perda: string | null; criada_em: Date; marcador_teste: string | null
}
type AcaoSeed = {
  acao_id: number; oportunidade_id: number; data_acao: Date; acao_pedido: boolean; tipo_acao: string;
  muda_oportunidade: boolean; muda_status: boolean; notificado: boolean; observacoes_acao: string;
  usuario_cadastro_id: number; usuario_cadastro_nome: string; data_cadastro: Date;
  usuario_alteracao_id: number | null; usuario_alteracao_nome: string | null; data_alteracao: Date | null
}

const contas: ContaSeed[] = []
const oportunidades: OportunidadeSeed[] = []
const acoes: AcaoSeed[] = []
const compromissos: Array<{
  compromisso_id: number; oportunidade_id: number; conta_id: number; data_hora: Date; assunto: string;
  atividade: string; descricao: string | null; responsavel_id: number; responsavel_nome: string; situacao: string; aceite: string
}> = []
const propostas: Array<{
  proposta_id: number; oportunidade_id: number; numero: string; versao: number; data_emissao: Date; valor: number; situacao: string; valida: boolean
}> = []
const ocorrencias: Array<{ ocorrencia_id: number; oportunidade_id: number; tipo: string; situacao: string; data: Date }> = []
const qics: Array<{ qic_id: number; oportunidade_id: number; identificador: string; situacao: string }> = []
const concorrentes: Array<{ concorrente_id: number; oportunidade_id: number; nome: string; situacao: string }> = []
const pedidos: Array<{
  pedido_id: number; oportunidade_id: number; numero: string; data_pedido: Date; valor: number; conferido: boolean; data_conferencia: Date | null
}> = []

let acaoSeq = 900001
let compromissoSeq = 700001
let propostaSeq = 600001
let ocorrenciaSeq = 500001
let qicSeq = 1
let concorrenteSeq = 1

// ---------- Contas ----------
CONTAS_BASE.forEach(([fantasia, segmento, municipio, uf, erp], i) => {
  const sufixo = pick(['Ltda.', 'Ltda.', 'S.A.'])
  contas.push({
    conta_id: 200001 + i,
    conta_id_erp: erp,
    razao_social: i === 0 ? 'Agro Horizonte S.A.' : `${fantasia} ${sufixo}`,
    fantasia,
    cnpj_ficticio: cnpjFicticio(),
    segmento,
    filial: i % 4 === 0 ? `Matriz — ${municipio}` : `Filial — ${municipio}`,
    municipio,
    uf,
    responsavel_id: CONSULTORES_CONTA[i % CONSULTORES_CONTA.length],
    criado_em: dias(-randInt(200, 900)),
  })
})

// ---------- Oportunidade principal (339001 — construída à mão) ----------
oportunidades.push({
  oportunidade_id: 339001,
  conta_id: 200001,
  nome: 'ERP GATec',
  descricao: 'Oportunidade fictícia usada para demonstrar transições explícitas entre SQL, Conta, Oportunidade, Proposta, Win e Pedido.',
  responsavel_id: 2, // Rafael Nogueira (≠ responsável da conta: Marina Castro)
  classificacao_fixture: 'New Name / Novo Cliente',
  tipo_oportunidade: 'Vendas Instituição Privada',
  subtipo_oportunidade: 'ERP GATec',
  etapa: 'Fechamento',
  situacao: 'Ganha',
  probabilidade: 100,
  origem: 'Indicação',
  suborigem: 'Parceiro comercial',
  previsao_inicial: dataDoFixture(2026, 5, 30),
  previsao_atual: dataDoFixture(2026, 6, 31),
  fechamento_efetivo: dataDoFixture(2026, 6, 31, 17, 42),
  valor_previsto: 285000,
  valor_fechado: 268500,
  motivo_fechamento: 'Prazo e condição de pagamento',
  motivo_perda: null,
  criada_em: dataDoFixture(2026, 3, 20, 9, 12),
  marcador_teste: null,
})

// 12 ações da oportunidade principal (vida comercial completa)
type AcaoPrincipalSpec = {
  d: number; h: number; m?: number; tipo: string; obs: string;
  muda_oportunidade?: boolean; muda_status?: boolean; acao_pedido?: boolean; notificado?: boolean;
  usuario_cadastro_id?: number; usuario_alteracao_id?: number; horasAlteracao?: number
}
const ACOES_PRINCIPAL: AcaoPrincipalSpec[] = [
  { d: diaDoFixture(2026, 3, 20), h: 9, m: 12, tipo: 'Cadastro', muda_oportunidade: true, muda_status: true, obs: 'Oportunidade sintética criada após SQL aceito. Conta e Oportunidade permanecem objetos distintos.', usuario_cadastro_id: 2 },
  { d: diaDoFixture(2026, 3, 22), h: 10, m: 30, tipo: 'Ligação', obs: 'Contato de qualificação registrado no fixture.', usuario_cadastro_id: 2 },
  { d: diaDoFixture(2026, 4, 1), h: 14, tipo: 'Reunião', notificado: true, obs: 'Reunião registrada com a Conta fictícia.', usuario_cadastro_id: 10 },
  { d: diaDoFixture(2026, 4, 10), h: 9, tipo: 'Demonstração', obs: 'Demonstração registrada para ERP GATec.', usuario_cadastro_id: 2 },
  { d: diaDoFixture(2026, 5, 1), h: 16, m: 20, tipo: 'Proposta enviada', muda_oportunidade: true, notificado: true, obs: 'Proposta 427070 emitida e vinculada à Oportunidade.', usuario_cadastro_id: 2 },
  { d: diaDoFixture(2026, 5, 20), h: 11, m: 5, tipo: 'E-mail', obs: 'Follow-up registrado sobre a Proposta.', usuario_cadastro_id: 2 },
  { d: diaDoFixture(2026, 6, 1), h: 15, tipo: 'Negociação', muda_oportunidade: true, obs: 'Mudança de etapa registrada após conversa comercial.', usuario_cadastro_id: 2 },
  { d: diaDoFixture(2026, 6, 10), h: 8, m: 30, tipo: 'Visita técnica', obs: 'Visita técnica registrada no histórico sintético.', usuario_cadastro_id: 10 },
  { d: diaDoFixture(2026, 6, 15), h: 13, m: 15, tipo: 'Reunião', muda_oportunidade: true, notificado: true, obs: 'Revisão da proposta 427070, mantida como válida.', usuario_cadastro_id: 2, usuario_alteracao_id: 4, horasAlteracao: 20 },
  { d: diaDoFixture(2026, 6, 25), h: 10, tipo: 'Negociação', muda_oportunidade: true, obs: 'Condições finais registradas no mock.', usuario_cadastro_id: 2 },
  { d: diaDoFixture(2026, 6, 31), h: 17, m: 42, tipo: 'Ganho', muda_status: true, notificado: true, obs: 'Win registrado em 31 jul 2026. Win e Pedido são eventos distintos.', usuario_cadastro_id: 2 },
  { d: diaDoFixture(2026, 7, 18), h: 11, m: 20, tipo: 'Pedido registrado', acao_pedido: true, obs: 'Pedido 212625 registrado em 18 ago 2026; estado: em conferência.', usuario_cadastro_id: 4 },
]
ACOES_PRINCIPAL.forEach((a) => {
  const dataAcao = comHora(a.d, a.h, a.m ?? 0)
  const cadastroId = a.usuario_cadastro_id ?? 2
  acoes.push({
    acao_id: acaoSeq++,
    oportunidade_id: 339001,
    data_acao: dataAcao,
    acao_pedido: a.acao_pedido ?? false,
    tipo_acao: a.tipo,
    muda_oportunidade: a.muda_oportunidade ?? false,
    muda_status: a.muda_status ?? false,
    notificado: a.notificado ?? false,
    observacoes_acao: a.obs,
    usuario_cadastro_id: cadastroId,
    usuario_cadastro_nome: nomeDe(cadastroId),
    data_cadastro: new Date(dataAcao.getTime() + randInt(5, 90) * 60000),
    usuario_alteracao_id: a.usuario_alteracao_id ?? null,
    usuario_alteracao_nome: a.usuario_alteracao_id ? nomeDe(a.usuario_alteracao_id) : null,
    data_alteracao: a.usuario_alteracao_id ? new Date(dataAcao.getTime() + (a.horasAlteracao ?? 20) * 3600000) : null,
  })
})

// 5 compromissos da oportunidade principal (com variedade de situação/aceite)
const COMPROMISSOS_PRINCIPAL: Array<{ d: number; h: number; assunto: string; atividade: string; resp: number; situacao: string; aceite: string; desc: string }> = [
  { d: -129, h: 14, assunto: 'Diagnóstico comercial e fiscal', atividade: 'Reunião', resp: 2, situacao: 'Realizado', aceite: 'Aceito', desc: 'Levantamento de processos com diretoria.' },
  { d: -121, h: 9, assunto: 'Demonstração da plataforma', atividade: 'Demonstração', resp: 10, situacao: 'Realizado', aceite: 'Aceito', desc: 'Demonstração de módulos agro e fiscal.' },
  { d: -83, h: 8, assunto: 'Visita técnica — unidade piloto', atividade: 'Visita técnica', resp: 2, situacao: 'Realizado', aceite: 'Aceito', desc: 'Validação de infraestrutura em campo.' },
  { d: -52, h: 15, assunto: 'Alinhamento de condições comerciais', atividade: 'Reunião', resp: 2, situacao: 'Cancelado', aceite: 'Pendente', desc: 'Cancelado pelo cliente (pauta interna). Reagendado informalmente.' },
  { d: 30, h: 10, assunto: 'Check-in pós-implementação', atividade: 'Reunião', resp: 1, situacao: 'Agendado', aceite: 'Pendente', desc: 'Follow-up de implantação com a consultora da conta.' },
]
COMPROMISSOS_PRINCIPAL.forEach((c) => {
  compromissos.push({
    compromisso_id: compromissoSeq++,
    oportunidade_id: 339001,
    conta_id: 200001,
    data_hora: comHora(c.d, c.h),
    assunto: c.assunto,
    atividade: c.atividade,
    descricao: c.desc,
    responsavel_id: c.resp,
    responsavel_nome: nomeDe(c.resp),
    situacao: c.situacao,
    aceite: c.aceite,
  })
})

// Propostas da oportunidade principal (v1 substituída; v2 válida)
propostas.push(
  { proposta_id: propostaSeq++, oportunidade_id: 339001, numero: '427070-v1', versao: 1, data_emissao: dataDoFixture(2026, 5, 1, 16), valor: 296000, situacao: 'Substituída', valida: false },
  { proposta_id: 427070, oportunidade_id: 339001, numero: '427070', versao: 2, data_emissao: dataDoFixture(2026, 6, 15, 13), valor: 285000, situacao: 'Válida', valida: true },
)
// Ocorrências, QIC, concorrentes e pedido da oportunidade principal
ocorrencias.push(
  { ocorrencia_id: ocorrenciaSeq++, oportunidade_id: 339001, tipo: 'Dúvida técnica — integração fiscal', situacao: 'Resolvida', data: comHora(-90, 9) },
  { ocorrencia_id: ocorrenciaSeq++, oportunidade_id: 339001, tipo: 'Solicitação comercial — desconto adicional', situacao: 'Aberta', data: comHora(-40, 11) },
)
qics.push({ qic_id: qicSeq++, oportunidade_id: 339001, identificador: 'QIC-1042', situacao: 'Ativo' })
concorrentes.push(
  { concorrente_id: concorrenteSeq++, oportunidade_id: 339001, nome: 'SoftSul Sistemas', situacao: 'Forte' },
  { concorrente_id: concorrenteSeq++, oportunidade_id: 339001, nome: 'ERPGlobal do Brasil', situacao: 'Presente' },
)
pedidos.push({ pedido_id: 212625, oportunidade_id: 339001, numero: '212625', data_pedido: dataDoFixture(2026, 7, 18, 11, 20), valor: 268500, conferido: false, data_conferencia: null })

// Oportunidades irmãs da conta principal (uma conta, múltiplas oportunidades)
oportunidades.push({
  oportunidade_id: 339002,
  conta_id: 200001,
  nome: 'HCM Senior',
  descricao: 'Oportunidade sintética para exercitar outra instância do Subtipo da Oportunidade.',
  responsavel_id: 3, // Letícia (≠ Marina, responsável da conta)
  classificacao_fixture: 'Base',
  tipo_oportunidade: 'Vendas Instituição Privada',
  subtipo_oportunidade: 'HCM Senior',
  etapa: 'Negociação',
  situacao: 'Aberta',
  probabilidade: 75,
  origem: 'Base instalada',
  suborigem: 'Upsell de módulos',
  previsao_inicial: comHora(-30, 12),
  previsao_atual: comHora(18, 12),
  fechamento_efetivo: null,
  valor_previsto: 96000,
  valor_fechado: null,
  motivo_fechamento: null,
  motivo_perda: null,
  criada_em: comHora(-38, 10),
  marcador_teste: null,
})
oportunidades.push({
  oportunidade_id: 339003,
  conta_id: 200001,
  nome: 'ERP Senior',
  descricao: 'Oportunidade sintética encerrada, sem inferência de regra corporativa.',
  responsavel_id: 7,
  classificacao_fixture: 'Cross / Up Sell',
  tipo_oportunidade: 'Vendas Instituição Privada',
  subtipo_oportunidade: 'ERP Senior',
  etapa: 'Proposta',
  situacao: 'Perdida',
  probabilidade: 0,
  origem: 'Outbound',
  suborigem: 'Prospecção ativa',
  previsao_inicial: comHora(-320, 12),
  previsao_atual: comHora(-230, 12),
  fechamento_efetivo: comHora(-210, 16),
  valor_previsto: 62000,
  valor_fechado: null,
  motivo_fechamento: null,
  motivo_perda: 'Preço acima do esperado pelo cliente',
  criada_em: comHora(-340, 9),
  marcador_teste: null,
})

// Ações/compromissos das oportunidades irmãs
;(function acoesIras() {
  // 339002 (aberta, negociação)
  const spec2: AcaoPrincipalSpec[] = [
    { d: -38, h: 10, tipo: 'Cadastro', muda_oportunidade: true, muda_status: true, obs: 'Oportunidade criada a partir da base instalada (upsell).', usuario_cadastro_id: 3 },
    { d: -33, h: 11, tipo: 'Reunião', obs: 'Reunião de escopo com o gerente comercial da conta.', usuario_cadastro_id: 3 },
    { d: -27, h: 9, tipo: 'Demonstração', obs: 'Demonstração do CRM para o time de pré-vendas do cliente.', usuario_cadastro_id: 10 },
    { d: -19, h: 14, tipo: 'Proposta enviada', muda_oportunidade: true, notificado: true, obs: 'Proposta PROP-339002-1 enviada (v1). Etapa avançada para Proposta.', usuario_cadastro_id: 3 },
    { d: -8, h: 16, tipo: 'Negociação', muda_oportunidade: true, obs: 'Avanço para Negociação. Cliente pediu simulação de ROI.', usuario_cadastro_id: 3 },
    { d: -2, h: 10, tipo: 'Follow-up', obs: 'Follow-up da simulação de ROI. Sem resposta até o momento.', usuario_cadastro_id: 3 },
  ]
  spec2.forEach((a) => {
    const dataAcao = comHora(a.d, a.h, a.m ?? 0)
    acoes.push({
      acao_id: acaoSeq++, oportunidade_id: 339002, data_acao: dataAcao, acao_pedido: false, tipo_acao: a.tipo,
      muda_oportunidade: a.muda_oportunidade ?? false, muda_status: a.muda_status ?? false, notificado: a.notificado ?? false,
      observacoes_acao: a.obs, usuario_cadastro_id: 3, usuario_cadastro_nome: 'Letícia Prado',
      data_cadastro: new Date(dataAcao.getTime() + 3600000), usuario_alteracao_id: null, usuario_alteracao_nome: null, data_alteracao: null,
    })
  })
  compromissos.push({
    compromisso_id: compromissoSeq++, oportunidade_id: 339002, conta_id: 200001, data_hora: comHora(6, 10),
    assunto: 'Apresentação de simulação de ROI', atividade: 'Reunião', descricao: 'Decisão sobre avanço para fechamento.',
    responsavel_id: 3, responsavel_nome: 'Letícia Prado', situacao: 'Agendado', aceite: 'Pendente',
  })
  propostas.push({ proposta_id: propostaSeq++, oportunidade_id: 339002, numero: 'PROP-339002-1', versao: 1, data_emissao: comHora(-19, 14), valor: 96000, situacao: 'Válida', valida: true })
  concorrentes.push({ concorrente_id: concorrenteSeq++, oportunidade_id: 339002, nome: 'TecnoPar ERP', situacao: 'Citado' })

  // 339003 (perdida, ciclo anterior)
  const spec3: AcaoPrincipalSpec[] = [
    { d: -340, h: 9, tipo: 'Cadastro', muda_oportunidade: true, muda_status: true, obs: 'Prospecção ativa a partir de lista setorial (fictícia).', usuario_cadastro_id: 7 },
    { d: -330, h: 11, tipo: 'Ligação', obs: 'Ligação de abertura com o decisor de TI da conta.', usuario_cadastro_id: 7 },
    { d: -300, h: 15, tipo: 'Reunião', obs: 'Reunião de diagnóstico do portal atual.', usuario_cadastro_id: 7 },
    { d: -260, h: 10, tipo: 'Proposta enviada', muda_oportunidade: true, obs: 'Proposta PROP-339003-1 enviada.', usuario_cadastro_id: 7 },
    { d: -210, h: 16, tipo: 'Perda', muda_status: true, obs: 'Cliente optou por solução concorrente por preço.', usuario_cadastro_id: 7 },
  ]
  spec3.forEach((a) => {
    const dataAcao = comHora(a.d, a.h, a.m ?? 0)
    acoes.push({
      acao_id: acaoSeq++, oportunidade_id: 339003, data_acao: dataAcao, acao_pedido: false, tipo_acao: a.tipo,
      muda_oportunidade: a.muda_oportunidade ?? false, muda_status: a.muda_status ?? false, notificado: false,
      observacoes_acao: a.obs, usuario_cadastro_id: 7, usuario_cadastro_nome: 'Patrícia Souza',
      data_cadastro: new Date(dataAcao.getTime() + 3600000), usuario_alteracao_id: null, usuario_alteracao_nome: null, data_alteracao: null,
    })
  })
  propostas.push({ proposta_id: propostaSeq++, oportunidade_id: 339003, numero: 'PROP-339003-1', versao: 1, data_emissao: comHora(-260, 10), valor: 62000, situacao: 'Cancelada', valida: false })
  concorrentes.push({ concorrente_id: concorrenteSeq++, oportunidade_id: 339003, nome: 'DeltaSoft', situacao: 'Forte' })
})()

// ---------- Geração das demais oportunidades ----------
//  339004..339010  → abertas com previsão vencida (3 com probabilidade alta)
//  339011..339018  → abertas sem ação registrada há >21d (2 críticas >45d)
//  339019..339024  → abertas com previsão deslocada (slip > 60d)
//  339025..339055  → abertas variadas (algumas sem previsão atual)
//  339056..339076  → ganhas (13 com pedido; 2 registros com datas inconsistentes simuladas)
//  339077..339087  → perdidas
const contasDisponiveis = contas.map((c) => c.conta_id)

function inserirAcao(o: OportunidadeSeed, d: number, tipo: string, opts: { mudaOpp?: boolean; mudaStatus?: boolean; notificado?: boolean; obs?: string; respId?: number; alteracao?: boolean; acaoPedido?: boolean }) {
  const dataAcao = comHora(d, randInt(8, 18), randInt(0, 59))
  const resp = opts.respId ?? o.responsavel_id
  const temAlteracao = opts.alteracao ?? chance(0.12)
  const alterador = temAlteracao ? pick(USUARIOS).usuario_id : null
  const obsBase = opts.obs ?? pick(OBS_POR_TIPO[tipo] ?? OBS_POR_TIPO['Follow-up'])
  acoes.push({
    acao_id: acaoSeq++,
    oportunidade_id: o.oportunidade_id,
    data_acao: dataAcao,
    acao_pedido: opts.acaoPedido ?? false,
    tipo_acao: tipo,
    muda_oportunidade: opts.mudaOpp ?? (tipo === 'Cadastro' ? true : chance(0.15)),
    muda_status: opts.mudaStatus ?? (tipo === 'Ganho' || tipo === 'Perda' || tipo === 'Cadastro'),
    notificado: opts.notificado ?? chance(0.3),
    observacoes_acao: obsBase.replace('{origem}', o.origem.toLowerCase()),
    usuario_cadastro_id: resp,
    usuario_cadastro_nome: nomeDe(resp),
    data_cadastro: new Date(dataAcao.getTime() + randInt(5, 120) * 60000),
    usuario_alteracao_id: alterador,
    usuario_alteracao_nome: alterador ? nomeDe(alterador) : null,
    data_alteracao: alterador ? new Date(dataAcao.getTime() + randInt(12, 48) * 3600000) : null,
  })
}

function gerarAcoesPara(o: OportunidadeSeed, ultimaAcaoDias: number | null, vendedorHistorico?: number) {
  const diasCriacao = -Math.round((Date.now() - o.criada_em.getTime()) / 86400000)
  const fim = ultimaAcaoDias === null ? -randInt(1, 6) : -ultimaAcaoDias
  const n = o.situacao === 'Ganha' ? randInt(5, 11) : o.situacao === 'Perdida' ? randInt(3, 8) : randInt(3, 9)
  const middle: string[] = []
  for (let i = 0; i < Math.max(1, n - 2); i++) middle.push(pick(TIPOS_ACAO))
  const tipos = ['Cadastro', ...middle, o.situacao === 'Ganha' ? 'Ganho' : o.situacao === 'Perdida' ? 'Perda' : pick(['Follow-up', 'Negociação', 'E-mail'])]
  tipos.forEach((tipo, i) => {
    const fracao = tipos.length <= 1 ? 0 : i / (tipos.length - 1)
    const d = Math.round(diasCriacao + fracao * (fim - diasCriacao))
    const respId = i === 0 && vendedorHistorico ? vendedorHistorico : chance(0.15) ? 10 : undefined
    inserirAcao(o, d, tipo, { respId })
  })
}

function gerarContextoPara(o: OportunidadeSeed) {
  const nComp = chance(0.45) ? randInt(1, 3) : 0
  const idadeDias = Math.round((Date.now() - o.criada_em.getTime()) / 86400000)
  for (let i = 0; i < nComp; i++) {
    const futuro = o.situacao === 'Aberta' && chance(0.4)
    const d = futuro ? randInt(2, 25) : -randInt(5, Math.max(6, idadeDias - 2))
    const situ = futuro ? 'Agendado' : pick(['Realizado', 'Realizado', 'Cancelado', 'Reagendado', 'No-show'])
    const resp = chance(0.8) ? o.responsavel_id : 10
    compromissos.push({
      compromisso_id: compromissoSeq++,
      oportunidade_id: o.oportunidade_id,
      conta_id: o.conta_id,
      data_hora: comHora(d, randInt(8, 17), pick([0, 15, 30, 45])),
      assunto: pick(['Alinhamento comercial', 'Demonstração de produto', 'Revisão de proposta', 'Visita de diagnóstico', 'Workshop de escopo']),
      atividade: pick(ATIVIDADES_COMPROMISSO),
      descricao: 'Compromisso sintético para o mock (fictício).',
      responsavel_id: resp,
      responsavel_nome: nomeDe(resp),
      situacao: situ,
      aceite: situ === 'Realizado' ? 'Aceito' : pick(['Aceito', 'Pendente', 'Recusado']),
    })
  }
  const etapaIndex = ETAPAS.indexOf(o.etapa)
  if (etapaIndex >= 3 || o.situacao !== 'Aberta') {
    if (chance(0.7)) {
      const duasVersoes = chance(0.2)
      const val = o.valor_previsto
      if (duasVersoes) {
        propostas.push({ proposta_id: propostaSeq++, oportunidade_id: o.oportunidade_id, numero: `PROP-${o.oportunidade_id}-1`, versao: 1, data_emissao: comHora(-randInt(60, 110), 10), valor: Math.round(val * 1.06), situacao: 'Substituída', valida: false })
        propostas.push({ proposta_id: propostaSeq++, oportunidade_id: o.oportunidade_id, numero: `PROP-${o.oportunidade_id}-2`, versao: 2, data_emissao: comHora(-randInt(20, 55), 10), valor: val, situacao: 'Válida', valida: true })
      } else {
        propostas.push({ proposta_id: propostaSeq++, oportunidade_id: o.oportunidade_id, numero: `PROP-${o.oportunidade_id}-1`, versao: 1, data_emissao: comHora(-randInt(15, 90), 10), valor: val, situacao: 'Válida', valida: true })
      }
    }
  }
  if (chance(0.3)) {
    ocorrencias.push({
      ocorrencia_id: ocorrenciaSeq++,
      oportunidade_id: o.oportunidade_id,
      tipo: pick(['Dúvida técnica', 'Reclamação — suporte', 'Solicitação comercial', 'Atraso de proposta', 'Impasse de prazo']),
      situacao: chance(0.6) ? 'Resolvida' : 'Aberta',
      data: comHora(-randInt(3, 60), randInt(8, 18)),
    })
  }
  if (chance(0.16)) {
    qics.push({ qic_id: qicSeq++, oportunidade_id: o.oportunidade_id, identificador: `QIC-${randInt(1000, 1200)}`, situacao: chance(0.8) ? 'Ativo' : 'Encerrado' })
  }
  if ((etapaIndex >= 3 && o.situacao === 'Aberta') || o.situacao === 'Perdida') {
    const n = chance(0.5) ? 1 : 2
    for (let i = 0; i < n; i++) {
      concorrentes.push({ concorrente_id: concorrenteSeq++, oportunidade_id: o.oportunidade_id, nome: pick(CONCORRENTES_POOL), situacao: pick(['Presente', 'Forte', 'Citado']) })
    }
  }
}

function novaOportunidade(id: number, cfg: {
  situacao: 'Aberta' | 'Ganha' | 'Perdida'
  etapa?: string
  criadaA: number
  previsaoInicialA: number
  previsaoAtualA: number | null
  marcador?: string
}): OportunidadeSeed {
  const contaId = contasDisponiveis[(id - 339001) % contasDisponiveis.length]
  const etapa = cfg.etapa ?? pick(ETAPAS)
  const probRange = PROB_POR_ETAPA[etapa]
  const prob = cfg.situacao === 'Ganha' ? 100 : cfg.situacao === 'Perdida' ? 0 : randInt(probRange[0], probRange[1])
  const origem = pick(Object.keys(ORIGENS))
  const valor = valorArredondado(18000, 640000)
  const valorFechado = cfg.situacao === 'Ganha' ? (randInt(85, 100) / 100) * valor : null
  return {
    oportunidade_id: id,
    conta_id: contaId,
    nome: taxonomiaFixture(id).subtipo_oportunidade,
    descricao: 'Oportunidade sintética gerada para o mock. Nenhum dado real. Fictício.',
    responsavel_id: pick(VENDEDORES),
    ...taxonomiaFixture(id),
    etapa,
    situacao: cfg.situacao,
    probabilidade: prob,
    origem,
    suborigem: pick(ORIGENS[origem]),
    previsao_inicial: comHora(cfg.previsaoInicialA, 12),
    previsao_atual: cfg.previsaoAtualA !== null ? comHora(cfg.previsaoAtualA, 12) : null,
    fechamento_efetivo: null,
    valor_previsto: valor,
    valor_fechado: valorFechado !== null ? Math.round(valorFechado / 500) * 500 : null,
    motivo_fechamento: cfg.situacao === 'Ganha' ? pick(MOTIVOS_FECHAMENTO) : null,
    motivo_perda: cfg.situacao === 'Perdida' ? pick(MOTIVOS_PERDA) : null,
    criada_em: comHora(cfg.criadaA, randInt(8, 18)),
    marcador_teste: cfg.marcador ?? null,
  }
}

// — Abertas com previsão vencida (7; 3 com probabilidade alta) —
for (const id of [339004, 339005, 339006, 339007, 339008, 339009, 339010]) {
  const o = novaOportunidade(id, {
    situacao: 'Aberta',
    etapa: pick(['Qualificação', 'Proposta', 'Negociação', 'Proposta']),
    criadaA: -randInt(80, 200),
    previsaoInicialA: -randInt(20, 60),
    previsaoAtualA: -randInt(1, 45),
  })
  if (id <= 339006) o.probabilidade = randInt(70, 90) // inconsistência: prob. alta com previsão vencida
  oportunidades.push(o)
  gerarAcoesPara(o, randInt(3, 12))
  gerarContextoPara(o)
}

// — Abertas sem ação registrada (8; 2 críticas >45d) —
for (let i = 0; i < 8; i++) {
  const id = 339011 + i
  const critica = i >= 6
  const semAcao = critica ? randInt(46, 70) : randInt(22, 44)
  const o = novaOportunidade(id, {
    situacao: 'Aberta',
    etapa: pick(['SQL', 'Qualificação', 'Proposta', 'Negociação']),
    criadaA: -(semAcao + randInt(30, 120)),
    previsaoInicialA: -(Math.max(2, semAcao - randInt(5, 25))),
    previsaoAtualA: randInt(2, 60),
  })
  oportunidades.push(o)
  gerarAcoesPara(o, semAcao)
  gerarContextoPara(o)
}

// — Abertas com previsão deslocada (slip > 60d) —
for (const id of [339019, 339020, 339021, 339022, 339023, 339024]) {
  const inicial = -randInt(90, 160)
  const o = novaOportunidade(id, {
    situacao: 'Aberta',
    etapa: pick(['Qualificação', 'Proposta', 'Negociação']),
    criadaA: inicial - randInt(10, 30),
    previsaoInicialA: inicial,
    previsaoAtualA: inicial + randInt(70, 150),
  })
  oportunidades.push(o)
  gerarAcoesPara(o, randInt(2, 15))
  gerarContextoPara(o)
}

// — Abertas variadas (31; algumas sem previsão atual) —
for (let id = 339025; id <= 339055; id++) {
  const criada = -randInt(20, 120)
  const previsaoInicial = criada + randInt(15, 60)
  const semPrevisaoAtual = (id - 339025) % 12 === 5 // 3 oportunidades sem previsão atual
  const o = novaOportunidade(id, {
    situacao: 'Aberta',
    criadaA: criada,
    previsaoInicialA: previsaoInicial,
    previsaoAtualA: semPrevisaoAtual ? null : randInt(-4, 75),
  })
  oportunidades.push(o)
  gerarAcoesPara(o, null)
  gerarContextoPara(o)
}

// — Ganhas (21; 2 com datas inconsistentes simuladas) —
const GANHAS_IDS = Array.from({ length: 21 }, (_, i) => 339056 + i)
const INCONSISTENTES = [339071, 339074]
for (const id of GANHAS_IDS) {
  const inconsistente = INCONSISTENTES.includes(id)
  const fechamentoA = inconsistente ? -randInt(120, 150) : -randInt(2, 150)
  const o = novaOportunidade(id, {
    situacao: 'Ganha',
    etapa: 'Fechamento',
    criadaA: fechamentoA - randInt(20, 120),
    previsaoInicialA: fechamentoA - randInt(-5, 30),
    previsaoAtualA: fechamentoA - randInt(-5, 25),
    marcador: inconsistente ? 'data-inconsistente (registro simulado para validar exclusão de métricas)' : undefined,
  })
  o.fechamento_efetivo = comHora(fechamentoA, randInt(9, 18))
  if (inconsistente) {
    // fechamento ANTES da criação → data inválida; deve ser excluída de métricas de ciclo
    o.criada_em = comHora(-randInt(60, 90), 10)
    o.previsao_inicial = comHora(randInt(30, 60), 12)
    o.previsao_atual = comHora(randInt(30, 60), 12)
    o.fechamento_efetivo = comHora(fechamentoA, 12)
  }
  oportunidades.push(o)
  gerarAcoesPara(o, Math.abs(fechamentoA))
  gerarContextoPara(o)
}

// Pedidos das ganhas (13 de 21 não-inconsistentes; 8 conferidos, 5 pendentes — 2 antigos)
const ganhasNormais = GANHAS_IDS.filter((id) => !INCONSISTENTES.includes(id))
ganhasNormais.slice(0, 13).forEach((id, i) => {
  const o = oportunidades.find((x) => x.oportunidade_id === id)!
  const dataPedido = new Date(o.fechamento_efetivo!.getTime() + randInt(1, 10) * 86400000)
  const conferido = i < 8
  const antigoPendente = !conferido && i >= 11
  const dataFinal = antigoPendente ? new Date(Date.now() - randInt(18, 40) * 86400000) : dataPedido
  pedidos.push({
    pedido_id: pedidos.length + 1,
    oportunidade_id: id,
    numero: `PED-${88001 + i + 1}`,
    data_pedido: dataFinal,
    valor: o.valor_fechado ?? o.valor_previsto,
    conferido,
    data_conferencia: conferido ? new Date(dataFinal.getTime() + randInt(2, 7) * 86400000) : null,
  })
})

// Ações de pedido alinhadas aos pedidos gerados (a principal 339001 já tem a ação alinhada à mão)
for (const p of pedidos) {
  if (p.oportunidade_id === 339001) continue
  const o = oportunidades.find((x) => x.oportunidade_id === p.oportunidade_id)!
  const d = -Math.round((Date.now() - p.data_pedido.getTime()) / 86400000)
  inserirAcao(o, d, 'Pedido registrado', { acaoPedido: true, respId: 4, obs: `Pedido ${p.numero} emitido no ERP (número fictício).` })
}

// — Perdidas (11) —
for (let id = 339077; id <= 339087; id++) {
  const fechamentoA = -randInt(10, 150)
  const o = novaOportunidade(id, {
    situacao: 'Perdida',
    etapa: pick(['Qualificação', 'Proposta', 'Negociação']),
    criadaA: fechamentoA - randInt(25, 130),
    previsaoInicialA: fechamentoA - randInt(-10, 25),
    previsaoAtualA: fechamentoA - randInt(-5, 20),
  })
  o.fechamento_efetivo = comHora(fechamentoA, randInt(9, 18))
  oportunidades.push(o)
  gerarAcoesPara(o, Math.abs(fechamentoA))
  gerarContextoPara(o)
}

// Garantir mudanças recentes (últimos 14 dias) entre as abertas
const abertasRecentes = oportunidades.filter((o) => o.situacao === 'Aberta' && o.oportunidade_id >= 339025)
abertasRecentes.slice(0, 8).forEach((o, i) => {
  if (i % 2 === 0) {
    inserirAcao(o, -randInt(1, 13), 'Negociação', { mudaOpp: true, obs: 'Avanço de etapa registrado (sintético).' })
  }
})

// Garantir compromissos futuros para 14 abertas em etapa avançada
const abertasAvancadas = oportunidades.filter((o) => o.situacao === 'Aberta' && ['Proposta', 'Negociação', 'Fechamento'].includes(o.etapa))
abertasAvancadas.slice(0, 14).forEach((o) => {
  compromissos.push({
    compromisso_id: compromissoSeq++,
    oportunidade_id: o.oportunidade_id,
    conta_id: o.conta_id,
    data_hora: comHora(randInt(2, 25), randInt(8, 17), pick([0, 30])),
    assunto: pick(['Apresentação de proposta', 'Negociação final', 'Alinhamento de contrato', 'Revisão de escopo']),
    atividade: 'Reunião',
    descricao: 'Compromisso futuro sintético (fictício).',
    responsavel_id: o.responsavel_id,
    responsavel_nome: nomeDe(o.responsavel_id),
    situacao: 'Agendado',
    aceite: pick(['Aceito', 'Pendente']),
  })
})

// ---------- Semana de referência: entradas, saídas e mudanças ----------
// Garante que o diff T-7 → T tenha história determinística para contar.

// Entradas: 6 oportunidades criadas nos últimos 7 dias
const ENTRADAS_SPEC: Array<{ id: number; etapa: string; previsaoA: number | null }> = [
  { id: 339088, etapa: 'Originação', previsaoA: 18 },
  { id: 339089, etapa: 'SQL', previsaoA: 26 },
  { id: 339090, etapa: 'Qualificação', previsaoA: 40 },
  { id: 339091, etapa: 'Originação', previsaoA: null },
  { id: 339092, etapa: 'SQL', previsaoA: 55 },
  { id: 339093, etapa: 'Qualificação', previsaoA: 22 },
]
for (const spec of ENTRADAS_SPEC) {
  const o = novaOportunidade(spec.id, {
    situacao: 'Aberta',
    etapa: spec.etapa,
    criadaA: -randInt(1, 6),
    previsaoInicialA: spec.previsaoA !== null ? spec.previsaoA - 30 : randInt(20, 45),
    previsaoAtualA: spec.previsaoA,
  })
  oportunidades.push(o)
  gerarAcoesPara(o, randInt(0, 3))
  gerarContextoPara(o)
}

// Saídas ganhas: 2 fechamentos na semana (uma com pedido não conferido)
for (const [i, id] of [339094, 339095].entries()) {
  const o = novaOportunidade(id, {
    situacao: 'Ganha',
    etapa: 'Fechamento',
    criadaA: -randInt(60, 110),
    previsaoInicialA: -randInt(5, 20),
    previsaoAtualA: -randInt(0, 4),
  })
  o.fechamento_efetivo = comHora(-(i === 0 ? 3 : 5), randInt(9, 18))
  oportunidades.push(o)
  gerarAcoesPara(o, i === 0 ? 3 : 5)
  gerarContextoPara(o)
}
const saidaGanha1 = oportunidades.find((o) => o.oportunidade_id === 339094)!
pedidos.push({
  pedido_id: pedidos.length + 1,
  oportunidade_id: 339094,
  numero: 'PED-88100',
  data_pedido: comHora(-1, 11),
  valor: saidaGanha1.valor_fechado ?? saidaGanha1.valor_previsto,
  conferido: false,
  data_conferencia: null,
})
inserirAcao(saidaGanha1, -1, 'Pedido registrado', { acaoPedido: true, respId: 4, obs: 'Pedido PED-88100 emitido no ERP (número fictício).' })

// Saídas perdidas: 2 fechamentos na semana
for (const [i, id] of [339096, 339097].entries()) {
  const o = novaOportunidade(id, {
    situacao: 'Perdida',
    etapa: 'Negociação',
    criadaA: -randInt(45, 100),
    previsaoInicialA: -randInt(5, 15),
    previsaoAtualA: -randInt(0, 6),
  })
  o.fechamento_efetivo = comHora(-(i === 0 ? 2 : 6), randInt(9, 18))
  oportunidades.push(o)
  gerarAcoesPara(o, i === 0 ? 2 : 6)
  gerarContextoPara(o)
}

// ---------- Estado anterior sintético (T-7) ----------
// Simulação documentada: o estado "semana passada" é construído com regras
// fixas para que o diff T-7 → T tenha narrativa. Regras:
//  1. Oportunidade criada após T-7 não existia (entrada).
//  2. Fechada após T-7 estava Aberta: ganha → etapa Negociação, prob. 85;
//     perdida → etapa mantida, prob. atual + 25 (limitada a 20–60).
//  3. Abertas com id ≡ 3 (mod 7) avançaram de etapa na semana:
//     etapa anterior = uma atrás, probabilidade = atual − 10.
//  4. Deslocadas da semana (subconjunto selecionado): previsão anterior =
//     previsão atual − 45 a 60 dias (o empurrão ocorreu na semana).
const T7 = dias(-7)
const JORNADA_ETAPAS = ['Originação', 'SQL', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento']

// Deslocadas: abertas com previsão futura entre T+45 e T+75 (até 5)
const deslocaveis = oportunidades.filter(
  (o) =>
    o.situacao === 'Aberta' &&
    o.criada_em <= T7 &&
    o.previsao_atual !== null &&
    o.previsao_atual.getTime() > AGORA.getTime() + 45 * 86400000 &&
    o.previsao_atual.getTime() < AGORA.getTime() + 75 * 86400000,
)
const DESLOCADAS = new Map<number, Date>() // oportunidade_id → previsão anterior
for (const o of deslocaveis.slice(0, 5)) {
  const anterior = new Date(o.previsao_atual!.getTime() - randInt(45, 60) * 86400000)
  DESLOCADAS.set(o.oportunidade_id, anterior)
}

const estadoAnterior: Array<{
  oportunidade_id: number; etapa: string; situacao: string; probabilidade: number; previsao_atual: string | null; valor_previsto: number
}> = []
for (const o of oportunidades) {
  if (o.criada_em > T7) continue // entrada: não existia na referência
  let etapa = o.etapa
  let situacao = o.situacao
  let probabilidade = o.probabilidade
  let previsao: Date | null = o.previsao_atual
  const saiuNaSemana = o.fechamento_efetivo !== null && o.fechamento_efetivo > T7
  if (saiuNaSemana) {
    situacao = 'Aberta'
    if (o.situacao === 'Ganha') {
      etapa = 'Negociação'
      probabilidade = 85
    } else {
      probabilidade = Math.max(20, Math.min(60, o.probabilidade + 25))
    }
  } else if (situacao === 'Aberta') {
    const idx = JORNADA_ETAPAS.indexOf(etapa)
    if (idx > 0 && o.oportunidade_id % 7 === 3) {
      etapa = JORNADA_ETAPAS[idx - 1]
      probabilidade = Math.max(5, probabilidade - 10)
    }
    if (DESLOCADAS.has(o.oportunidade_id)) {
      previsao = DESLOCADAS.get(o.oportunidade_id)!
    }
  }
  estadoAnterior.push({
    oportunidade_id: o.oportunidade_id,
    etapa,
    situacao,
    probabilidade,
    previsao_atual: previsao ? previsao.toISOString() : null,
    valor_previsto: o.valor_previsto,
  })
}

// ---------- Persistência ----------
async function main() {
  console.log('Limpando base sintética...')
  await db.pedido.deleteMany()
  await db.concorrente.deleteMany()
  await db.qic.deleteMany()
  await db.ocorrencia.deleteMany()
  await db.proposta.deleteMany()
  await db.compromisso.deleteMany()
  await db.acao.deleteMany()
  await db.oportunidade.deleteMany()
  await db.conta.deleteMany()
  await db.usuario.deleteMany()
  await db.meta.deleteMany()

  console.log(`Inserindo ${USUARIOS.length} usuários, ${contas.length} contas, ${oportunidades.length} oportunidades...`)
  for (const u of USUARIOS) await db.usuario.create({ data: u })
  for (const c of contas) await db.conta.create({ data: c })
  for (const o of oportunidades) await db.oportunidade.create({ data: o })
  console.log(`Inserindo ${acoes.length} ações, ${compromissos.length} compromissos, ${propostas.length} propostas, ${pedidos.length} pedidos...`)
  for (const a of acoes) await db.acao.create({ data: a })
  for (const c of compromissos) await db.compromisso.create({ data: c })
  for (const p of propostas) await db.proposta.create({ data: p })
  for (const o of ocorrencias) await db.ocorrencia.create({ data: o })
  for (const q of qics) await db.qic.create({ data: q })
  for (const c of concorrentes) await db.concorrente.create({ data: c })
  for (const p of pedidos) await db.pedido.create({ data: p })

  const meta: Record<string, string> = {
    snapshot_em: AGORA.toISOString(),
    semente: '20250601',
    versao: 'v1.1.0-mock',
    gerado_por: 'seed determinístico (mulberry32)',
    aviso: 'Dados 100% sintéticos e fictícios. Nenhum dado real de clientes, CNPJs ou valores corporativos.',
    estado_anterior: JSON.stringify({
      referencia: T7.toISOString(),
      regras: [
        'Oportunidade criada após a referência não existia no estado anterior (entrada).',
        'Fechamento após a referência: situação anterior = Aberta (ganha → etapa Negociação, prob. 85; perdida → etapa mantida, prob. atual + 25, limitada a 20–60).',
        'Abertas com id ≡ 3 (mod 7): avanço de etapa na semana — etapa anterior uma posição atrás na jornada, probabilidade − 10.',
        'Deslocadas da semana: subconjunto de abertas com previsão futura; previsão anterior = previsão atual − 45 a 60 dias.',
        'Demais campos idênticos ao snapshot atual (o diff não inventa valores fora dessas regras).',
      ],
      oportunidades: estadoAnterior,
    }),
    contagem_contas: String(contas.length),
    contagem_oportunidades: String(oportunidades.length),
    contagem_acoes: String(acoes.length),
    contagem_compromissos: String(compromissos.length),
    contagem_propostas: String(propostas.length),
    contagem_ocorrencias: String(ocorrencias.length),
    contagem_qics: String(qics.length),
    contagem_concorrentes: String(concorrentes.length),
    contagem_pedidos: String(pedidos.length),
  }
  for (const [chave, valor] of Object.entries(meta)) {
    await db.meta.create({ data: { chave, valor } })
  }

  // ---------- Resumo e autochecagem ----------
  const abertas = oportunidades.filter((o) => o.situacao === 'Aberta')
  const ganhas = oportunidades.filter((o) => o.situacao === 'Ganha')
  const perdidas = oportunidades.filter((o) => o.situacao === 'Perdida')
  const vencidas = abertas.filter((o) => o.previsao_atual && o.previsao_atual < AGORA)
  const erpNulo = contas.filter((c) => c.conta_id_erp === null).length
  const oppPorConta = new Map<number, number>()
  oportunidades.forEach((o) => oppPorConta.set(o.conta_id, (oppPorConta.get(o.conta_id) ?? 0) + 1))
  const multiplas = [...oppPorConta.values()].filter((n) => n > 1).length
  const ganhasSemPedido = ganhas.filter((g) => !pedidos.some((p) => p.oportunidade_id === g.oportunidade_id)).length

  console.log('--- RESUMO DO SNAPSHOT SINTÉTICO ---')
  console.log(`Contas: ${contas.length} (ERP nulo: ${erpNulo}) | Contas com múltiplas oportunidades: ${multiplas}`)
  console.log(`Oportunidades: ${oportunidades.length} (abertas ${abertas.length}, ganhas ${ganhas.length}, perdidas ${perdidas.length})`)
  console.log(`Ações: ${acoes.length} | Compromissos: ${compromissos.length} | Propostas: ${propostas.length} | Pedidos: ${pedidos.length} | Ganhas sem pedido: ${ganhasSemPedido}`)
  console.log(`Radar — previsões vencidas: ${vencidas.length} | Oportunidade principal 339001: ${acoes.filter((a) => a.oportunidade_id === 339001).length} ações, ${compromissos.filter((c) => c.oportunidade_id === 339001).length} compromissos`)
  console.log(`Estado anterior (T-7): ${estadoAnterior.length} registros | Entradas da semana: ${oportunidades.length - estadoAnterior.length} | Deslocadas: ${DESLOCADAS.size} | Avanços (mod 7): ${estadoAnterior.filter((e) => oportunidades.find((o) => o.oportunidade_id === e.oportunidade_id)?.etapa !== e.etapa).length}`)
  const fkOk = oportunidades.every((o) => contas.some((c) => c.conta_id === o.conta_id))
  const acoesFkOk = acoes.every((a) => oportunidades.some((o) => o.oportunidade_id === a.oportunidade_id))
  const compFkOk = compromissos.every((c) => oportunidades.some((o) => o.oportunidade_id === c.oportunidade_id))
  const umaPropostaValida = propostas.every((p) => {
    const doMesmo = propostas.filter((x) => x.oportunidade_id === p.oportunidade_id && x.valida)
    return doMesmo.length <= 1
  })
  console.log(`Checagens: FK opp→conta ${fkOk ? 'OK' : 'ERRO'} | FK ação→opp ${acoesFkOk ? 'OK' : 'ERRO'} | FK compromisso→opp ${compFkOk ? 'OK' : 'ERRO'} | ≤1 proposta válida por opp ${umaPropostaValida ? 'OK' : 'ERRO'}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
