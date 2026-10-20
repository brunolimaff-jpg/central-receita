// "Pergunte à Receita" — agente simulado, somente leitura.
// PROIBIDO usar modelo de linguagem: as respostas vêm de funções determinísticas
// sobre os dados locais — as MESMAS funções que alimentam a interface (invariante V8).

import {
  cicloMedioDias,
  fechamentosPorPeriodo,
  origens,
  pipeline,
  previsaoPeriodo,
  slippagemMedia,
  topContas,
  winRate,
} from './metrics'
import { regrasRadar, sinaisDaOportunidade } from './radar'
import { construirDetalhe } from './detalhe'
import { calcularMudancas } from './mudancas'
import { gerarCasos } from './casos'
import { caixaAtencao } from './agora'
import { resultadoWinLoss } from './winloss'
import { rotuloEtapaTaxonomia, rotuloNaturezaVendaTaxonomia } from './types'
import { fmtBRL, fmtData, fmtDataCurta, fmtInt, fmtPct } from './format'
import type { AgenteResposta, BlocoResposta, Snapshot } from './types'
import type { EtapaResolvida, TipoFunil } from './crm-taxonomy'

const LIMITACAO_PADRAO = 'Leitura determinística sobre dados sintéticos locais. Não usa modelo de linguagem e não calcula KPI por estimativa.'

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const SUGESTOES_PADRAO = [
  'O que mudou na projeção móvel desde a última leitura?',
  'Quais oportunidades explicam a maior parte da variação?',
  'Quais negociações em etapa avançada estão sem compromisso futuro?',
  'Por que a oportunidade 339008 apareceu no radar?',
  'Mostre as cinco perdas de maior valor e o último movimento antes do fechamento',
  'Quais assuntos devo levar para a reunião do time?',
  'Qual o valor total do pipeline?',
  'Me fale sobre a oportunidade 339001',
]

function ok(pergunta: string, texto: string, blocos: BlocoResposta[], consulta: string, regra: string, sugestoes?: string[]): AgenteResposta {
  return {
    pergunta,
    reconhecido: true,
    texto,
    blocos,
    sugestoes: sugestoes ?? SUGESTOES_PADRAO.slice(0, 4),
    proveniencia: { consulta, regra, limitacao: LIMITACAO_PADRAO },
  }
}

function naoReconhecido(pergunta: string): AgenteResposta {
  return {
    pergunta,
    reconhecido: false,
    texto:
      'Não sei responder a isso com as leituras disponíveis. Sou um agente simulado, somente leitura, com respostas determinísticas sobre a base sintética — não faço estimativas nem uso modelo de linguagem.',
    blocos: [],
    sugestoes: SUGESTOES_PADRAO,
    proveniencia: {
      consulta: 'nenhuma (pergunta fora das intenções suportadas)',
      regra: 'reconhecimento determinístico por padrões de texto',
      limitacao: 'Se a pergunta não casa com uma leitura suportada, a resposta honesta é "não sei" — sem invenção.',
    },
  }
}

// ---------- Respondedor determinístico ----------
export function responder(perguntaBruta: string, snap: Snapshot, hoje = new Date(), janelaForecastDias = 30): AgenteResposta {
  const pergunta = perguntaBruta.slice(0, 500)
  const q = normalizar(pergunta)

  if (!q) return naoReconhecido(pergunta)

  // --- Intenções de gestão (o que mudou, o que explica, decisões) ---

  // O que mudou desde a última leitura
  if (/\b(o que mudou|mudou (desde|na|no)|mudancas|entradas e saidas)\b/.test(q) || /\bmudou\b/.test(q)) {
    const m = calcularMudancas(snap, hoje, janelaForecastDias)
    if (!m) {
      return ok(
        pergunta,
        'Não há estado anterior registrado neste snapshot para comparar. A leitura de mudanças exige o estado sintético T-7 gerado pelo seed.',
        [],
        'mudancas.calcularMudancas(snapshot)',
        'estado anterior indisponível',
      )
    }
    const forecast = m.forecast_periodo
    const caiu = forecast.delta < 0
    return ok(
      pergunta,
      `Desde ${fmtDataCurta(m.anterior_em)}: a projeção móvel dos próximos ${forecast.dias} dias ${caiu ? 'caiu' : 'cresceu'} para ${fmtBRL(forecast.atual)} (${forecast.delta >= 0 ? '+' : '−'}${fmtBRL(Math.abs(forecast.delta))} sobre ${fmtBRL(forecast.anterior)}). O pipeline aberto passou de ${fmtBRL(m.pipeline.anterior)} para ${fmtBRL(m.pipeline.atual)} (${m.pipeline.delta >= 0 ? '+' : '−'}${fmtBRL(Math.abs(m.pipeline.delta))}). ${fmtInt(m.resumo.entradas)} entradas (${fmtBRL(m.resumo.entradas_valor)}), ${fmtInt(m.resumo.saidas_ganhas)} saídas por Win (${fmtBRL(m.resumo.saidas_ganhas_valor)}), ${fmtInt(m.resumo.saidas_perdidas)} por Loss (${fmtBRL(m.resumo.saidas_perdidas_valor)}), ${fmtInt(m.resumo.deslocamentos)} deslocamentos de previsão e ${fmtInt(m.resumo.avancos)} avanços de etapa.`,
      [
        {
          titulo: 'Movimento do período',
          colunas: ['Tipo', 'Oportunidades', 'Valor'],
          linhas: [
            ['Entradas', fmtInt(m.resumo.entradas), fmtBRL(m.resumo.entradas_valor)],
            ['Saídas por ganho', fmtInt(m.resumo.saidas_ganhas), fmtBRL(m.resumo.saidas_ganhas_valor)],
            ['Saídas por perda', fmtInt(m.resumo.saidas_perdidas), fmtBRL(m.resumo.saidas_perdidas_valor)],
            ['Deslocamentos de previsão', fmtInt(m.resumo.deslocamentos), fmtBRL(m.resumo.deslocamentos_valor)],
            ['Avanços de etapa', fmtInt(m.resumo.avancos), fmtBRL(m.resumo.avancos_valor)],
          ],
        },
        {
          titulo: 'Principais mudanças',
          colunas: ['Oportunidade', 'Conta', 'Movimento'],
          linhas: [
            ...m.entradas.slice(0, 3).map((i) => [i.nome, i.conta_fantasia, `entrada · ${i.detalhe}`]),
            ...m.saidas_ganhas.slice(0, 2).map((i) => [i.nome, i.conta_fantasia, `ganha · ${i.detalhe}`]),
            ...m.saidas_perdidas.slice(0, 2).map((i) => [i.nome, i.conta_fantasia, `perdida · ${i.detalhe}`]),
            ...m.deslocamentos.slice(0, 3).map((i) => [i.nome, i.conta_fantasia, i.detalhe]),
          ].slice(0, 10),
        },
      ],
      'mudancas.calcularMudancas(snapshot) — diff estado anterior (T-7) → atual',
      `o estado anterior é simulação documentada do seed; a janela de ${forecast.dias} dias é medida em cada referência`,
    )
  }

  // O que explica a variação
  if (/\b(explica|explicam|concentram|maior parte)\b/.test(q)) {
    const m = calcularMudancas(snap, hoje, janelaForecastDias)
    if (!m) return naoReconhecido(pergunta)
    const top = m.forecast_periodo.concentracao.itens
    return ok(
      pergunta,
      `${fmtInt(m.forecast_periodo.concentracao.quantidade_explicam)} oportunidades explicam ${fmtPct(m.forecast_periodo.concentracao.pct_explicada)} do movimento absoluto da projeção móvel de ${m.forecast_periodo.dias} dias. Contribuições ordenadas por valor absoluto:`,
      [
        {
          titulo: `Contribuição à projeção móvel · ${m.forecast_periodo.dias} dias`,
          colunas: ['Oportunidade', 'Conta', 'Contribuição', 'Acumulado'],
          linhas: top.slice(0, 8).map((i) => [
            i.nome,
            i.conta_fantasia,
            `${i.contribuicao > 0 ? '+' : '−'}${fmtBRL(Math.abs(i.contribuicao))}`,
            fmtPct(i.acumulado_pct),
          ]),
        },
      ],
      `mudancas.calcularMudancas(snapshot, janela=${m.forecast_periodo.dias}) → contribuição por oportunidade`,
      'compara valor previsto dentro e fora da janela em cada referência; não aplica probabilidade nem explica causa comercial',
    )
  }

  // Por que a oportunidade X apareceu no radar
  const idRadar = q.match(/\b(339\d{3})\b/)
  if (idRadar && /\b(por que|porque|apareceu|radar|atencao|caso)\b/.test(q)) {
    const id = Number(idRadar[1])
    const sinais = sinaisDaOportunidade(snap, id, hoje)
    const o = snap.oportunidades.find((x) => x.oportunidade_id === id)
    if (!o) return naoReconhecido(pergunta)
    if (sinais.length === 0) {
      return ok(
        pergunta,
        `A oportunidade ${id} (${o.nome}) não está em atenção: nenhum sinal do radar está ativo neste registro.`,
        [],
        `radar.sinaisDaOportunidade(snapshot, ${id})`,
        'a ausência de sinal significa que nenhum gatilho determinístico foi acionado — não é um atestado de qualidade',
      )
    }
    return ok(
      pergunta,
      `A oportunidade ${id} (${o.nome}, ${o.conta_fantasia}, ${fmtBRL(o.valor_previsto)}) aparece no Radar por ${fmtInt(sinais.length)} sinal(is): ${sinais.map((s) => s.titulo).join('; ')}. Cada sinal descreve um registro, não o esforço do responsável.`,
      [
        {
          titulo: 'Sinais ativos',
          colunas: ['Sinal', 'Severidade', 'Contexto'],
          linhas: sinais.map((s) => [s.titulo, s.severidade, s.codigo === 'R4' ? 'sem compromisso futuro registrado' : s.detalhe]),
        },
      ],
      `radar.sinaisDaOportunidade(snapshot, ${id})`,
      'as regras determinísticas que alimentam o Radar e a fila de casos',
    )
  }

  // Pauta de reunião
  if (/\b(pauta|preparar reuniao|reuniao do (time|comercial)|levar para (a )?reuniao|assuntos.*reuniao|reuniao.*assuntos)\b/.test(q)) {
    const agora = caixaAtencao(snap, hoje)
    return ok(
      pergunta,
      `Pauta determinística para a próxima reunião comercial — composta a partir do snapshot de ${fmtData(agora.snapshot_em)}:`,
      agora.pauta.map((secao) => ({
        titulo: secao.titulo,
        colunas: ['#', 'Item'],
        linhas: secao.linhas.map((linha, i) => [String(i + 1), linha]),
      })),
      'agora.caixaAtencao(snapshot) → pauta (composição determinística)',
      'a pauta é leitura do momento; decisões tomadas na reunião não são persistidas neste mock',
      ['O que mudou na projeção móvel desde a última leitura?', 'Quais casos concentram o impacto?', 'Quantas decisões estão aguardando revisão?'],
    )
  }

  // Casos de decisão
  if (/\b(casos?|decisoes? pendentes|fila de intervenc|decidir)\b/.test(q)) {
    const casos = gerarCasos(snap, hoje)
    const top = [...casos.casos].sort((a, b) => b.impacto - a.impacto).slice(0, 8)
    return ok(
      pergunta,
      `Há ${fmtInt(casos.resumo.total)} casos de decisão abertos, somando ${fmtBRL(casos.resumo.impacto_total)} sob decisão — ${fmtInt(casos.resumo.criticos)} críticos, ${fmtInt(casos.resumo.aguardando)} aguardando revisão, ${fmtInt(casos.resumo.em_analise)} em análise e ${fmtInt(casos.resumo.acompanhamento)} em acompanhamento. Cada caso deriva de um sinal ativo do radar: 1 sinal = 1 caso.`,
      [
        {
          titulo: 'Casos de maior impacto',
          colunas: ['Caso', 'Oportunidade', 'Conta', 'Sinal', 'Impacto', 'Decisão pendente'],
          linhas: top.map((c) => [c.caso_id, c.oportunidade_nome, c.conta_fantasia, c.sinal_nome, fmtBRL(c.impacto), c.decisao_pendente]),
        },
      ],
      'casos.gerarCasos(snapshot) — derivação 1:1 dos sinais ativos',
      'o caso é camada da Central sobre o CRM; nenhum campo do CRM é alterado',
    )
  }

  // Perdas de maior valor com último movimento antes do fechamento
  if (/\b(perdas? de maior valor|maiores perdas|cinco perdas|5 perdas|perdas? de maior)\b/.test(q)) {
    const wl = resultadoWinLoss(snap, hoje)
    const top = wl.perdidas.slice(0, 5)
    return ok(
      pergunta,
      `As cinco perdas de maior valor somam ${fmtBRL(top.reduce((s, f) => s + f.valor_fechado, 0))}. O último movimento antes do fechamento está em cada linha — é o registro anterior à ação de Perda, não uma inferência.`,
      [
        {
          titulo: 'Perdas de maior valor',
          colunas: ['Oportunidade', 'Conta', 'Valor', 'Motivo', 'Último movimento antes do fechamento'],
          linhas: top.map((f) => [f.nome, f.conta_fantasia, fmtBRL(f.valor_fechado), f.motivo ?? '—', f.ultima_acao_antes_fechamento ?? '—']),
        },
      ],
      'winloss.resultadoWinLoss(snapshot) → perdidas ordenadas por valor',
      'registros com datas inválidas são excluídos das métricas; o motivo é o texto registrado no fechamento',
    )
  }

  // Oportunidades sem compromisso futuro, calculadas pela regra interna do mock.
  if (/\b(sem compromisso|sem proximo compromisso|etapa avancada sem|compromisso futuro)\b/.test(q)) {
    const r4 = regrasRadar(snap, hoje).find((x) => x.codigo === 'R4')!
    return ok(
      pergunta,
      `${fmtInt(r4.quantidade)} oportunidades não têm compromisso futuro agendado — ${fmtBRL(r4.valor_exposto)} expostos e ${fmtInt(r4.responsaveis)} responsáveis. Compromissos podem existir fora da agenda registrada; esta leitura reflete apenas os registros do mock.`,
      [
        {
          titulo: 'Sem compromisso futuro',
          colunas: ['ID', 'Oportunidade', 'Conta', 'Etapa', 'Valor', 'Contexto'],
          linhas: r4.oportunidades.slice(0, 12).map((o) => [String(o.oportunidade_id), o.nome, o.conta_fantasia, rotuloEtapaTaxonomia(o.etapa_taxonomia), fmtBRL(o.valor_previsto), 'sem compromisso futuro registrado']),
        },
      ],
      'radar.regrasRadar(snapshot) → oportunidades sem compromisso futuro',
      'agenda simulada; a decisão pendente é agendar o próximo compromisso ou decidir o seguimento',
    )
  }

  // Cumprimento / ajuda
  if (/^(oi|ola|opa|bom dia|boa tarde|boa noite|hey|hi)\b/.test(q) || /\b(o que voce (pode|sabe)|como funciona|ajuda|quais perguntas)\b/.test(q)) {
    return ok(
      pergunta,
      'Sou o assistente simulado da Central de Receita (somente leitura). Respondo a partir de leituras determinísticas sobre a base sintética local — pipeline, radar, win rate, compromissos, contas, oportunidades específicas e proveniência. Não uso modelo de linguagem e não estimo nada que não esteja registrado.',
      [],
      'capacidades do agente (estáticas)',
      'lista de intenções suportadas pelo matcher determinístico',
      SUGESTOES_PADRAO
    )
  }

  // Oportunidade por id (ex.: 339001)
  const idMatch = q.match(/\b(339\d{3})\b/)
  if (idMatch) {
    const id = Number(idMatch[1])
    const detalhe = construirDetalhe(snap, id, hoje)
    if (!detalhe) return naoReconhecido(pergunta)
    const o = detalhe.oportunidade
    const sinais = sinaisDaOportunidade(snap, id, hoje)
    const ultima = detalhe.acoes[0]
    return ok(
      pergunta,
      `A oportunidade ${id} (${o.nome}) é da conta ${o.conta_fantasia}, responsável ${o.responsavel_nome}. Situação: ${o.situacao} em etapa ${rotuloEtapaTaxonomia(o.etapa_taxonomia)}; natureza ${rotuloNaturezaVendaTaxonomia(o.natureza_venda_taxonomia)}, probabilidade ${o.probabilidade}%. Valor previsto ${fmtBRL(o.valor_previsto)}${o.valor_fechado !== null ? `, fechado por ${fmtBRL(o.valor_fechado)}` : ''}. Previsão atual: ${o.previsao_atual ? fmtData(o.previsao_atual) : 'sem previsão'}. Última ação registrada: ${ultima ? `${ultima.tipo_acao} em ${fmtData(ultima.data_acao)} por ${ultima.usuario_cadastro_nome}` : 'nenhuma'}.${detalhe.pedido ? ` Pedido ${detalhe.pedido.numero} ${detalhe.pedido.conferido ? 'conferido' : 'não conferido'}.` : detalhe.oportunidade.situacao === 'Ganha' ? ' Sem pedido registrado (Win ≠ Pedido).' : ''}${sinais.length ? ` Sinais do Radar: ${sinais.map((s) => s.titulo).join('; ')}.` : ' Sem sinais do Radar.'}`,
      [],
      `detalhe.construirDetalhe(snapshot, ${id}) + radar.sinaisDaOportunidade(snapshot, ${id})`,
      'leitura direta do registro da oportunidade e de seus vínculos (ações, pedido, sinais)'
    )
  }

  // Conta por nome
  const contaEncontrada = snap.contas.find((c) => {
    const n = normalizar(c.fantasia)
    const r = normalizar(c.razao_social)
    const f = n.split(' ')[0]
    return f.length > 3 && (q.includes(n) || q.includes(r) || q.includes(f))
  })
  if (contaEncontrada && /\b(conta|cliente|empresa|falar|resumo|sobre)\b/.test(q)) {
    const opps = snap.oportunidades.filter((o) => o.conta_id === contaEncontrada.conta_id)
    const abertas = opps.filter((o) => o.situacao === 'Aberta')
    const ganhas = opps.filter((o) => o.situacao === 'Ganha')
    const perdidas = opps.filter((o) => o.situacao === 'Perdida')
    return ok(
      pergunta,
      `A conta ${contaEncontrada.fantasia} (${contaEncontrada.razao_social}, ${contaEncontrada.municipio}/${contaEncontrada.uf}, segmento ${contaEncontrada.segmento}) tem ${fmtInt(opps.length)} oportunidades: ${fmtInt(abertas.length)} abertas somando ${fmtBRL(abertas.reduce((s, o) => s + o.valor_previsto, 0))}, ${fmtInt(ganhas.length)} ganhas e ${fmtInt(perdidas.length)} perdidas. Responsável da conta: ${contaEncontrada.responsavel_nome}${contaEncontrada.conta_id_erp !== null ? ` · vínculo ERP ${contaEncontrada.conta_id_erp}` : ' · sem vínculo ERP'}.`,
      [
        {
          titulo: 'Oportunidades da conta',
          colunas: ['ID', 'Nome', 'Situação', 'Etapa', 'Valor previsto'],
          linhas: opps.map((o) => [String(o.oportunidade_id), o.nome, o.situacao, rotuloEtapaTaxonomia(o.etapa_taxonomia), fmtBRL(o.valor_previsto)]),
        },
      ],
      'contas + oportunidades filtradas por conta_id',
      'uma conta pode ter múltiplas oportunidades; responsável da conta ≠ responsável da oportunidade'
    )
  }

  // Radar / sinais
  if (/\b(radar|sinais|sinal|risco|atencao|prioridade)\b/.test(q)) {
    const regras = regrasRadar(snap, hoje)
    return ok(
      pergunta,
      `O radar tem ${fmtInt(regras.length)} regras ativas. ${regras
        .map((r) => `${r.nome}: ${fmtInt(r.quantidade)} (${fmtBRL(r.valor_exposto)})`)
        .join('. ')}. Os sinais são determinísticos: descrevem registros, não esforço — ausência de registro não significa ausência de trabalho.`,
      [
        {
          titulo: 'Sinais por regra',
          colunas: ['Regra', 'Nome', 'Severidade', 'Quantidade', 'Valor exposto'],
          linhas: regras.map((r) => [r.nome, r.severidade, fmtInt(r.quantidade), fmtBRL(r.valor_exposto)]),
        },
      ],
      'radar.regrasRadar(snapshot)',
      'cada regra é uma condição booleana determinística sobre os campos registrados'
    )
  }

  // Previsões vencidas
  if (/\b(vencida|vencidas|venceu|vencendo|atrasad)\b/.test(q) && /\b(previs|forecast|data)\b/.test(q)) {
    const r = regrasRadar(snap, hoje).find((x) => x.codigo === 'R1')!
    return ok(
      pergunta,
      `Há ${fmtInt(r.quantidade)} oportunidades abertas com previsão vencida, expondo ${fmtBRL(r.valor_exposto)} do pipeline. Regra: situacao = "Aberta" e previsao_atual < hoje. O sinal é sobre a data registrada, não sobre o trabalho realizado.`,
      [
        {
          titulo: 'Previsões vencidas',
          colunas: ['ID', 'Oportunidade', 'Conta', 'Etapa', 'Valor', 'Contexto'],
          linhas: r.oportunidades.slice(0, 12).map((o) => [String(o.oportunidade_id), o.nome, o.conta_fantasia, rotuloEtapaTaxonomia(o.etapa_taxonomia), fmtBRL(o.valor_previsto), o.contexto]),
        },
      ],
      'radar.regrasRadar(snapshot) → oportunidades com previsão vencida',
      'previsão vencida = data registrada passou sem fechamento registrado'
    )
  }
  if (/\b(vencida|vencidas|venceu)\b/.test(q)) {
    const r = regrasRadar(snap, hoje).find((x) => x.codigo === 'R1')!
    return ok(
      pergunta,
      `${fmtInt(r.quantidade)} oportunidades com previsão vencida (${fmtBRL(r.valor_exposto)} expostos). Use "quais previsões vencidas" para a lista completa na tela Radar.`,
      [],
      'radar.regrasRadar(snapshot) → oportunidades com previsão vencida',
      'leitura idêntica à da interface (mesma função)'
    )
  }

  // Sem ação registrada
  if (/\b(sem acao|sem registro|sem movimentacao|parado|parad|semanas sem|dias sem)\b/.test(q)) {
    const r = regrasRadar(snap, hoje).find((x) => x.codigo === 'R2')!
    return ok(
      pergunta,
      `${fmtInt(r.quantidade)} oportunidades abertas estão há mais de 21 dias sem ação registrada (${fmtBRL(r.valor_exposto)}). Importante: ação registrada não prova todo o trabalho realizado fora do CRM — o sinal indica ausência de registro, não de trabalho.`,
      [
        {
          titulo: 'Sem ação registrada (>21 dias)',
          colunas: ['ID', 'Oportunidade', 'Conta', 'Valor', 'Contexto'],
          linhas: r.oportunidades.slice(0, 12).map((o) => [String(o.oportunidade_id), o.nome, o.conta_fantasia, fmtBRL(o.valor_previsto), o.contexto]),
        },
      ],
      'radar.regrasRadar(snapshot) → oportunidades sem ação registrada',
      'dias desde a última ação registrada > 21 (crítica > 45)'
    )
  }

  // Pedidos
  if (/\b(pedidos?|faturament|conferid|conferencia)\b/.test(q)) {
    const naoConferidos = snap.pedidos.filter((p) => !p.conferido)
    const conferidos = snap.pedidos.filter((p) => p.conferido)
    const r5 = regrasRadar(snap, hoje).find((x) => x.codigo === 'R5')!
    return ok(
      pergunta,
      `Win ≠ Pedido ≠ Pedido conferido. Existem ${fmtInt(snap.pedidos.length)} pedidos vinculados a ganhas: ${fmtInt(conferidos.length)} conferidos e ${fmtInt(naoConferidos.length)} pendentes de conferência. Além disso, ${fmtInt(r5.quantidade)} oportunidades ganhas há mais de 30 dias seguem sem qualquer pedido registrado.`,
      [
        {
          titulo: 'Pedidos',
          colunas: ['Pedido', 'Oportunidade', 'Valor', 'Conferido'],
          linhas: snap.pedidos.map((p) => {
            const o = snap.oportunidades.find((x) => x.oportunidade_id === p.oportunidade_id)
            return [p.numero, `${p.oportunidade_id} — ${o?.nome ?? '—'}`, fmtBRL(p.valor), p.conferido ? 'sim' : 'não']
          }),
        },
      ],
      'pedidos e sinais de pedido posterior/conferência',
      'pedido é evento posterior ao ganho; conferência é estado do pedido'
    )
  }

  // Compromissos / agenda
  if (/\b(compromissos?|agenda|proximas? reunioes|reuniao)\b/.test(q)) {
    const futuros = snap.compromissos
      .filter((c) => c.situacao === 'Agendado' && new Date(c.data_hora) > hoje)
      .sort((a, b) => (a.data_hora < b.data_hora ? -1 : 1))
    return ok(
      pergunta,
      `Há ${fmtInt(futuros.length)} compromissos agendados no futuro.${futuros.length ? ` O próximo é "${futuros[0].assunto}" (${futuros[0].atividade}) em ${fmtData(futuros[0].data_hora)}, responsável ${futuros[0].responsavel_nome}.` : ''}`,
      [
        {
          titulo: 'Próximos compromissos',
          colunas: ['Data', 'Assunto', 'Atividade', 'Responsável', 'Aceite'],
          linhas: futuros.slice(0, 12).map((c) => [fmtData(c.data_hora), c.assunto, c.atividade, c.responsavel_nome, c.aceite]),
        },
      ],
      'compromissos filtrados por situacao = "Agendado" e data_hora > hoje',
      'agenda simulada; compromissos fora do sistema não aparecem'
    )
  }

  // Win rate / taxa
  if (/\b(win ?rate|taxa de (ganho|conversao)|conversao|taxa)\b/.test(q)) {
    const wr = winRate(snap, hoje, 90)
    return ok(
      pergunta,
      `Taxa de ganho nos últimos 90 dias: ${fmtPct(wr.taxa_contagem)} por contagem (${fmtInt(wr.ganhas)}G/${fmtInt(wr.perdidas)}P) e ${fmtPct(wr.taxa_valor)} por valor (${fmtBRL(wr.valor_ganho)} ganhos contra ${fmtBRL(wr.valor_perdido)} perdidos).`,
      [],
      'metrics.winRate(snapshot, hoje, 90)',
      'ganhas/(ganhas+perdidas) com fechamento efetivo válido no período'
    )
  }

  // Pipeline
  if (/\b(pipeline|valor (em|de|do) (aberto|pipeline|carteira)|aberto)\b/.test(q)) {
    const p = pipeline(snap)
    const prev30 = previsaoPeriodo(snap, hoje, 30)
    return ok(
      pergunta,
      `Pipeline aberto: ${fmtBRL(p.valor)} em ${fmtInt(p.quantidade)} oportunidades. Previsão dos próximos 30 dias: ${fmtBRL(prev30.valor)} (${fmtInt(prev30.quantidade)} oportunidades).`,
      [],
      'metrics.pipeline(snapshot) + metrics.previsaoPeriodo(30)',
      'soma de valor_previsto das oportunidades com situacao = "Aberta" — cada oportunidade contada uma única vez'
    )
  }

  // Ganhas / perdidas no período
  if (/\b(ganhas?|ganho|ganhos|fechament)\b/.test(q)) {
    const f30 = fechamentosPorPeriodo(snap, hoje, 30)
    return ok(
      pergunta,
      `Nos últimos 30 dias: ${fmtInt(f30.ganhas.length)} ganhas (${fmtBRL(f30.ganhas.reduce((s, o) => s + (o.valor_fechado ?? 0), 0))}) e ${fmtInt(f30.perdidas.length)} perdidas (${fmtBRL(f30.perdidas.reduce((s, o) => s + o.valor_previsto, 0))}).`,
      [
        {
          titulo: 'Fechamentos (30 dias)',
          colunas: ['ID', 'Oportunidade', 'Conta', 'Situação', 'Valor'],
          linhas: [...f30.ganhas, ...f30.perdidas]
            .slice(0, 12)
            .map((o) => [String(o.oportunidade_id), o.nome, o.conta_fantasia, o.situacao, fmtBRL(o.valor_fechado ?? o.valor_previsto)]),
        },
      ],
      'metrics.fechamentosPorPeriodo(30)',
      'usa apenas fechamentos com data consistente (exclui registros marcados como inconsistentes)'
    )
  }
  if (/\b(perdidas?|perda|perdas)\b/.test(q)) {
    const f90 = fechamentosPorPeriodo(snap, hoje, 90)
    return ok(
      pergunta,
      `Nos últimos 90 dias foram perdidas ${fmtInt(f90.perdidas.length)} oportunidades (${fmtBRL(f90.perdidas.reduce((s, o) => s + o.valor_previsto, 0))}). Motivos registrados: ${resumoMotivos(f90.perdidas.map((o) => o.motivo_perda))}.`,
      [],
      'metrics.fechamentosPorPeriodo(90) → perdidas',
      'motivo de perda é campo registrado no fechamento (texto do vendedor)'
    )
  }

  // Funil / etapas / jornada
  if (/\b(funil|etapas?|jornada|estagios?)\b/.test(q)) {
    const f = new Map<TipoFunil, Map<string, { quantidade: number; valor: number; etapa: EtapaResolvida }>>()
    for (const oportunidade of snap.oportunidades.filter((o) => o.situacao === 'Aberta')) {
      const resolvida = oportunidade.etapa_taxonomia
      const etapas = f.get(resolvida.tipo_funil) ?? new Map<string, { quantidade: number; valor: number; etapa: EtapaResolvida }>()
      const atual = etapas.get(resolvida.etapa_bruta) ?? { quantidade: 0, valor: 0, etapa: resolvida }
      etapas.set(resolvida.etapa_bruta, { ...atual, quantidade: atual.quantidade + 1, valor: atual.valor + oportunidade.valor_previsto })
      f.set(resolvida.tipo_funil, etapas)
    }
    const nomes: Record<TipoFunil, string> = { privado: 'privado', publico: 'público', nao_identificado: 'não identificado' }
    const ordem: TipoFunil[] = ['privado', 'publico', 'nao_identificado']
    const totais = ordem.map((tipo) => {
      const itens = [...(f.get(tipo)?.values() ?? [])]
      const quantidade = itens.reduce((total, item) => total + item.quantidade, 0)
      const valor = itens.reduce((total, item) => total + item.valor, 0)
      return `${nomes[tipo]}: ${fmtInt(quantidade)} ${quantidade === 1 ? 'oportunidade' : 'oportunidades'} (${fmtBRL(valor)})`
    })
    return ok(
      pergunta,
      `Funil das oportunidades abertas por modalidade: ${totais.join(' · ')}. O Forecast do mês segue a régua PEX do PDF. A jornada do briefing anterior lista Originação → MQL → SAL → SQL → Conta → Oportunidade → Win/Loss → Pedido; MQL, SAL e SQL não são fases do funil observado no PDF.`,
      ordem.map((tipo) => ({
        titulo: `Funil ${nomes[tipo]}`,
        colunas: ['Etapa', 'Oportunidades', 'Valor', 'Estado e fontes'],
        linhas: [...(f.get(tipo)?.values() ?? [])].map((item) => [item.etapa.rotulo, fmtInt(item.quantidade), fmtBRL(item.valor), rotuloEtapaTaxonomia(item.etapa)]),
      })),
      'oportunidades abertas agrupadas por tipo_funil exato e etapa_bruta',
      'contagem e soma por etapa corrente das abertas, com funis separados (não é funil por conversão histórica)'
    )
  }

  // Origens
  if (/\b(origem|origens|de onde vem|origina)\b/.test(q)) {
    const o = origens(snap)
    return ok(
      pergunta,
      `Origens do pipeline aberto: ${o.map((x) => `${x.origem} ${fmtInt(x.quantidade)} (${fmtBRL(x.valor)})`).join(' · ')}.`,
      [],
      'metrics.origens(snapshot)',
      'origem e suborigem são campos registrados na criação da oportunidade'
    )
  }

  // Ciclo médio
  if (/\b(ciclo|tempo medio|duracao)\b/.test(q)) {
    const c = cicloMedioDias(snap, hoje, 90)
    return ok(
      pergunta,
      `Ciclo médio das ganhas (90 dias): ${c.dias ?? '—'} dias, amostra de ${fmtInt(c.amostra)} fechamentos${c.excluidas ? `, com ${fmtInt(c.excluidas)} registros excluídos por datas inválidas` : ''}. O ciclo usa fechamento − criação; datas inconsistentes não entram na métrica.`,
      [],
      'metrics.cicloMedioDias(snapshot, hoje, 90)',
      'registros com datas inválidas (fechamento antes da criação) são excluídos'
    )
  }

  // Top / maiores
  if (/\b(maiores?|top|principais)\b/.test(q)) {
    const contas = topContas(snap, 5)
    const maiores = snap.oportunidades
      .filter((o) => o.situacao === 'Aberta')
      .sort((a, b) => b.valor_previsto - a.valor_previsto)
      .slice(0, 8)
    return ok(
      pergunta,
      `Top contas por pipeline aberto: ${contas.map((c) => `${c.fantasia} ${fmtBRL(c.valor)}`).join(' · ')}.`,
      [
        {
          titulo: 'Maiores oportunidades abertas',
          colunas: ['ID', 'Oportunidade', 'Conta', 'Etapa', 'Natureza e fonte', 'Valor'],
          linhas: maiores.map((o) => [String(o.oportunidade_id), o.nome, o.conta_fantasia, rotuloEtapaTaxonomia(o.etapa_taxonomia), rotuloNaturezaVendaTaxonomia(o.natureza_venda_taxonomia), fmtBRL(o.valor_previsto)]),
        },
      ],
      'metrics.topContas(5) + ordenação determinística por valor_previsto',
      'ordenação estável por valor; empates resolvidos pela ordem de id'
    )
  }

  // Slippage / previsão deslocada
  if (/\b(slip|desloc|remarc|prorroga)\b/.test(q)) {
    const s = slippagemMedia(snap)
    const r3 = regrasRadar(snap, hoje).find((x) => x.codigo === 'R3')!
    return ok(
      pergunta,
      `A previsão atual desloca em média ${s.dias ?? '—'} dias da inicial (${fmtInt(s.amostra)} oportunidades abertas com previsão). ${fmtInt(r3.quantidade)} oportunidades têm deslocamento acima de 60 dias (${fmtBRL(r3.valor_exposto)}).`,
      [],
      'metrics.slippagemMedia + oportunidades com previsão deslocada',
      'diferença entre previsao_atual e previsao_inicial registradas'
    )
  }

  // Contas (quantidade)
  if (/\b(quantas? contas|total de contas|contas existem|base de contas)\b/.test(q)) {
    const semErp = snap.contas.filter((c) => c.conta_id_erp === null).length
    return ok(
      pergunta,
      `A base sintética tem ${fmtInt(snap.contas.length)} contas, das quais ${fmtInt(semErp)} sem vínculo ERP (conta_id_erp nulo). Conta ≠ Oportunidade: há ${fmtInt(snap.oportunidades.length)} oportunidades distribuídas nessas contas — uma conta pode ter múltiplas.`,
      [],
      'contas.count + oportunidades.count',
      'conta_id e conta_id_erp são identificadores distintos; ERP é opcional'
    )
  }

  // Snapshot / proveniência / atualização
  if (/\b(quando atualiz|snapshot|fonte|fontes|provenien|dados de onde|atualiza)\b/.test(q)) {
    return ok(
      pergunta,
      `Snapshot sintético gerado em ${fmtData(snap.meta.snapshot_em)} por seed determinístico (semente ${snap.meta.semente}). Todos os dados são fictícios: nenhuma integração real, nenhum dado corporativo. As regras de leitura estão na tela Fontes & Regras.`,
      [],
      'meta do snapshot (registros Meta)',
      'proveniência simulada — o objetivo é demonstrar rastreabilidade, não integração real'
    )
  }

  return naoReconhecido(pergunta)
}

function resumoMotivos(motivos: (string | null)[]): string {
  const contagem = new Map<string, number>()
  for (const m of motivos) {
    if (!m) continue
    contagem.set(m, (contagem.get(m) ?? 0) + 1)
  }
  if (!contagem.size) return 'sem motivos registrados'
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} (${n})`).join(', ')
}

export const PERGUNTAS_EXEMPLO = SUGESTOES_PADRAO
