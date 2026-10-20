// Fontes & Regras — proveniência simulada e registro de regras de leitura.
// Mostra para cada domínio: origem, atualização, volume, regras e limitações.

import { REGRAS } from './radar'
import { gerarCasos } from './casos'
import { fmtInt } from './format'
import type { FonteDTO, RegraLeituraDTO, Snapshot } from './types'

const ORIGEM_FIXTURE = 'Fixture sintético (seed determinístico, semente 20250601) — schema espelhado no contrato físico conhecido do CRM'
const ORIGEM_FIXTURE_AGENDA = 'Fixture sintético — agenda simulada vinculada à oportunidade e à conta'
const LIMITACAO_SINTETICO = 'Conteúdo 100% fictício: nomes, CNPJs, valores e identificadores não correspondem a dados reais.'

export function fontesERegras(snap: Snapshot): { fontes: FonteDTO[]; regras: RegraLeituraDTO[]; aviso: string; snapshot_em: string } {
  const snapshotEm = snap.meta.snapshot_em ?? new Date().toISOString()

  const fontes: FonteDTO[] = [
    {
      dominio: 'Contas',
      origem: ORIGEM_FIXTURE,
      atualizacao: snapshotEm,
      volume: snap.contas.length,
      regras: [
        'conta_id é a chave da Central; conta_id_erp é opcional e pertence a outro espaço de identificadores',
        'uma conta pode concentrar múltiplas oportunidades',
        'responsável da conta é papel distinto do responsável da oportunidade',
      ],
      limitacoes: [LIMITACAO_SINTETICO, 'sem integração real com cadastro corporativo'],
    },
    {
      dominio: 'Oportunidades',
      origem: ORIGEM_FIXTURE,
      atualizacao: snapshotEm,
      volume: snap.oportunidades.length,
      regras: [
        'estado corrente lido dos campos (etapa, situação, probabilidade, previsões, valores)',
        'histórico não é inferido do estado: vem das ações registradas',
        'registros marcados como teste não entram em métricas de ciclo',
      ],
      limitacoes: [LIMITACAO_SINTETICO, 'previsão atual pode ser nula (sem reforecast registrado)'],
    },
    {
      dominio: 'Ações',
      origem: ORIGEM_FIXTURE,
      atualizacao: snapshotEm,
      volume: snap.acoes.length,
      regras: [
        'uma linha por ação, com auditoria completa (cadastro e alteração)',
        'flags muda_oportunidade / muda_status alimentam as mudanças recentes da Visão',
        'a data usada nas leituras é data_acao (não data_cadastro)',
      ],
      limitacoes: ['ação registrada não prova todo o trabalho realizado fora do CRM'],
    },
    {
      dominio: 'Compromissos',
      origem: ORIGEM_FIXTURE_AGENDA,
      atualizacao: snapshotEm,
      volume: snap.compromissos.length,
      regras: ['compromissos futuros = situação "Agendado" e data_hora > agora', 'aceite é campo próprio (Aceito/Pendente/Recusado)'],
      limitacoes: ['agenda externa (e-mail, telefone pessoal) não é capturada'],
    },
    {
      dominio: 'Propostas',
      origem: ORIGEM_FIXTURE,
      atualizacao: snapshotEm,
      volume: snap.propostas.length,
      regras: ['somente uma proposta marcada como válida por oportunidade', 'versões anteriores ficam como Substituída/Cancelada'],
      limitacoes: [LIMITACAO_SINTETICO],
    },
    {
      dominio: 'Ocorrências',
      origem: ORIGEM_FIXTURE,
      atualizacao: snapshotEm,
      volume: snap.ocorrencias.length,
      regras: ['apenas tipo, situação e data — sem conteúdo sensível'],
      limitacoes: ['contrato mínimo proposital: sem transcrições'],
    },
    {
      dominio: 'QIC',
      origem: ORIGEM_FIXTURE,
      atualizacao: snapshotEm,
      volume: snap.qics.length,
      regras: ['possui_qic é derivado da existência de registro vinculado', 'identificador opcional'],
      limitacoes: ['sem detalhamento interno do comitê (fora do escopo V1)'],
    },
    {
      dominio: 'Concorrentes',
      origem: ORIGEM_FIXTURE,
      atualizacao: snapshotEm,
      volume: snap.concorrentes.length,
      regras: ['zero ou múltiplos por oportunidade', 'situação: Presente / Forte / Citado'],
      limitacoes: ['nomes fictícios de concorrentes'],
    },
    {
      dominio: 'Pedidos',
      origem: ORIGEM_FIXTURE,
      atualizacao: snapshotEm,
      volume: snap.pedidos.length,
      regras: ['pedido é evento posterior ao ganho (vinculado à oportunidade ganha)', 'conferido é estado próprio, distinto do pedido'],
      limitacoes: [LIMITACAO_SINTETICO, 'Win ≠ Pedido ≠ Pedido conferido'],
    },
    {
      dominio: 'Estado anterior (T-7)',
      origem: 'Simulação sintética gerada pelo seed — registro Meta "estado_anterior" com regras documentadas',
      atualizacao: snapshotEm,
      volume: (snap.meta['estado_anterior'] ? (JSON.parse(snap.meta['estado_anterior']) as { oportunidades: unknown[] }).oportunidades.length : 0),
      regras: [
        'oportunidade criada após a referência não existia (entrada)',
        'fechamento após a referência: situação anterior = Aberta',
        'abertas com id ≡ 3 (mod 7): avanço de etapa na semana — etapa anterior uma posição atrás',
        'deslocadas da semana: previsão anterior = previsão atual − 45 a 60 dias',
      ],
      limitacoes: [
        'é uma simulação para demonstrar a leitura de mudanças — não é um snapshot histórico real',
        'a janela de 30 dias do forecast é medida em cada referência (limites de período distintos)',
      ],
    },
    {
      dominio: 'Casos de Decisão',
      origem: 'Camada derivada da Central — gerada em tempo de leitura sobre os sinais do radar (nenhuma persistência)',
      atualizacao: snapshotEm,
      volume: gerarCasos(snap).casos.length,
      regras: [
        '1 sinal ativo (oportunidade × regra) = 1 caso — derivação 1:1, sem seleção manual',
        'evidência: última ação, compromisso futuro, proposta válida e dias em aberto do próprio snapshot',
        'estado do caso é simulado: "em análise" (ação ≤ 7 dias), "acompanhamento" (compromisso futuro), "aguardando revisão" (demais)',
      ],
      limitacoes: [
        'o caso não altera o CRM — é camada decisória somente leitura',
        'decisões tomadas não são persistidas neste mock',
      ],
    },
  ]

  const regras: RegraLeituraDTO[] = [
    { codigo: 'M1', objeto: 'Pipeline aberto', formula: 'Σ valor_previsto das oportunidades com situacao = "Aberta" (uma linha por oportunidade, sem join)', limitacao: 'não reflete desconto aprovado; valor é o registrado' },
    { codigo: 'M2', objeto: 'Previsão 30 dias', formula: 'situacao = "Aberta" e 0 ≤ (previsao_atual − hoje) ≤ 30 dias', limitacao: 'oportunidades sem previsão atual ficam fora' },
    { codigo: 'M3', objeto: 'Taxa de ganho', formula: 'ganhas/(ganhas+perdidas) com fechamento válido nos últimos 90 dias; por valor usa valor_fechado × valor_previsto', limitacao: 'registros com data inválida são excluídos' },
    { codigo: 'M4', objeto: 'Ciclo médio', formula: 'média de (fechamento_efetivo − criada_em) das ganhas válidas em 90 dias', limitacao: 'exclui registros inconsistentes; amostra informada junto' },
    { codigo: 'M5', objeto: 'Slippagem média', formula: 'média de (previsao_atual − previsao_inicial) das abertas com previsão', limitacao: 'não avalia causa do deslocamento' },
    { codigo: 'M6', objeto: 'Mudanças — pipeline', formula: 'pipeline_atual − pipeline_anterior, onde cada pipeline = Σ valor_previsto das abertas no respectivo estado', limitacao: 'o estado anterior é simulação documentada do seed' },
    { codigo: 'M7', objeto: 'Mudanças — forecast 30d', formula: 'Σ valor_previsto das abertas com previsão na janela [referência, referência+30d] em cada estado; delta entre os dois', limitacao: 'janelas medidas em referências distintas — os limites do período não são idênticos' },
    { codigo: 'M8', objeto: 'Mudanças — concentração', formula: 'entradas (+valor) e saídas (−valor) ordenadas por contribuição absoluta; acumulado ≥ 80% define quantas explicam a variação', limitacao: 'deslocamentos de previsão alteram o forecast, não o pipeline — não entram nesta concentração' },
    { codigo: 'M9', objeto: 'Casos de decisão', formula: 'para cada sinal ativo do radar: caso com sinal, oportunidade, impacto (valor_previsto), evidência e decisão pendente da regra', limitacao: 'camada derivada somente leitura; estado do caso é simulado sem persistência' },
    { codigo: 'M10', objeto: 'Pauta de reunião', formula: 'composição determinística: resultado, mudanças, forecast, populações do radar, top casos e decisões pendentes', limitacao: 'leitura do momento — não registra decisões tomadas na reunião' },
    { codigo: 'M11', objeto: 'Win/Loss', formula: 'fechamentos com data válida em 90 dias; taxa por valor = Σ valor_fechado das ganhas ÷ Σ total; ciclo = fechamento − criação', limitacao: 'registros com datas inválidas (fechamento antes da criação) são excluídos e contabilizados' },
    { codigo: 'M12', objeto: 'Última ação antes do fechamento', formula: 'última ação com data_acao < fechamento_efetivo, excluindo as ações de Ganho/Perda', limitacao: 'é o registro anterior ao fechamento — não uma inferência de causa' },
    ...REGRAS.map((r) => ({
      codigo: r.codigo,
      objeto: `Radar — ${r.nome}`,
      formula: r.regra,
      limitacao: r.limitacao,
    })),
    { codigo: 'A1', objeto: 'Pergunte à Receita', formula: 'matcher determinístico de intenções → funções de metrics/radar sobre o mesmo snapshot', limitacao: 'sem modelo de linguagem; respostas fora do repertório são "não sei"' },
  ]

  return {
    fontes,
    regras,
    aviso: `Base sintética gerada em ${snapshotEm} — ${fmtInt(snap.oportunidades.length)} oportunidades, ${fmtInt(snap.contas.length)} contas. ${snap.meta.aviso ?? ''}`,
    snapshot_em: snapshotEm,
  }
}
