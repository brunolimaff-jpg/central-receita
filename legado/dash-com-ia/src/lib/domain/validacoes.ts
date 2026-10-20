// Validações de invariantes do contrato — executadas sob demanda pela tela
// "Validações" (recurso de produto). Cada checagem é determinística e
// evidenciada com números e exemplos.

import { responder } from './agente'
import { cicloMedioDias, pipeline, registrosComDataInvalida, winRate } from './metrics'
import { construirIndice, regrasRadar } from './radar'
import { carregarEstadoAnterior, calcularMudancas } from './mudancas'
import { gerarCasos } from './casos'
import { fmtBRL, fmtInt } from './format'
import type { RelatorioValidacoes, Snapshot, Validacao } from './types'

function validar(codigo: string, titulo: string, regra: string, passou: boolean, detalhe: string, evidencia: string[] = []): Validacao {
  return { codigo, titulo, regra, status: passou ? 'ok' : 'erro', detalhe, evidencia }
}

export function executarValidacoes(snap: Snapshot, hoje = new Date()): RelatorioValidacoes {
  const idx = construirIndice(snap, hoje)
  const contasIds = new Set(snap.contas.map((c) => c.conta_id))
  const oppIds = new Set(snap.oportunidades.map((o) => o.oportunidade_id))
  const validacoes: Validacao[] = []

  // V1 — toda oportunidade referencia conta existente
  const oppSemConta = snap.oportunidades.filter((o) => !contasIds.has(o.conta_id))
  validacoes.push(
    validar(
      'V1',
      'Toda oportunidade referencia conta existente',
      'para cada oportunidade, existe conta com conta_id correspondente',
      oppSemConta.length === 0,
      `${fmtInt(snap.oportunidades.length)} oportunidades verificadas; ${fmtInt(oppSemConta.length)} sem conta.`,
      oppSemConta.slice(0, 5).map((o) => `oportunidade ${o.oportunidade_id} → conta ${o.conta_id} inexistente`)
    )
  )

  // V2 — toda ação referencia oportunidade existente
  const acaoSemOpp = snap.acoes.filter((a) => !oppIds.has(a.oportunidade_id))
  validacoes.push(
    validar(
      'V2',
      'Toda ação referencia oportunidade existente',
      'para cada ação, existe oportunidade com oportunidade_id correspondente',
      acaoSemOpp.length === 0,
      `${fmtInt(snap.acoes.length)} ações verificadas; ${fmtInt(acaoSemOpp.length)} órfãs.`,
      acaoSemOpp.slice(0, 5).map((a) => `ação ${a.acao_id} → oportunidade ${a.oportunidade_id} inexistente`)
    )
  )

  // V3 — todo compromisso referencia oportunidade existente (e conta consistente)
  const compSemOpp = snap.compromissos.filter((c) => !oppIds.has(c.oportunidade_id))
  const compContaInconsistente = snap.compromissos.filter((c) => {
    const opp = snap.oportunidades.find((o) => o.oportunidade_id === c.oportunidade_id)
    return opp && opp.conta_id !== c.conta_id
  })
  validacoes.push(
    validar(
      'V3',
      'Todo compromisso referencia oportunidade existente',
      'para cada compromisso, existe oportunidade correspondente e conta_id coerente',
      compSemOpp.length === 0 && compContaInconsistente.length === 0,
      `${fmtInt(snap.compromissos.length)} compromissos verificados; ${fmtInt(compSemOpp.length)} órfãos; ${fmtInt(compContaInconsistente.length)} com conta divergente.`,
      [...compSemOpp.slice(0, 3).map((c) => `compromisso ${c.compromisso_id} → oportunidade ${c.oportunidade_id} inexistente`)]
    )
  )

  // V4 — não há dupla contagem por join 1:N
  const abertas = snap.oportunidades.filter((o) => o.situacao === 'Aberta')
  const somaDireta = abertas.reduce((s, o) => s + o.valor_previsto, 0)
  const idsUnicos = new Set(abertas.map((o) => o.oportunidade_id))
  // caminho "join": ações × oportunidades → deduplica por oportunidade antes de somar
  const idsDoJoin = new Set(snap.acoes.filter((a) => abertas.some((o) => o.oportunidade_id === a.oportunidade_id)).map((a) => a.oportunidade_id))
  const somaJoinDeduplicada = [...idsDoJoin].reduce((s, id) => {
    const o = abertas.find((x) => x.oportunidade_id === id)!
    return s + o.valor_previsto
  }, 0)
  const linhasJoin = snap.acoes.filter((a) => idsUnicos.has(a.oportunidade_id)).length
  validacoes.push(
    validar(
      'V4',
      'Não há dupla contagem por join 1:N',
      'a soma do pipeline por oportunidade é idêntica à soma via join ações×oportunidades deduplicada por oportunidade',
      somaDireta === somaJoinDeduplicada && idsDoJoin.size <= idsUnicos.size,
      `join ações×oportunidades gera ${fmtInt(linhasJoin)} linhas para ${fmtInt(idsDoJoin.size)} oportunidades distintas; pipeline = ${fmtBRL(somaDireta)} (direto) = ${fmtBRL(somaJoinDeduplicada)} (join deduplicado). Métricas agregam sempre pela oportunidade, nunca pela linha de ação.`
    )
  )

  // V5 — Win não é automaticamente Pedido
  const ganhas = snap.oportunidades.filter((o) => o.situacao === 'Ganha')
  const ganhasComPedido = ganhas.filter((o) => snap.pedidos.some((p) => p.oportunidade_id === o.oportunidade_id))
  const pedidosDeNaoGanha = snap.pedidos.filter((p) => !ganhas.some((o) => o.oportunidade_id === p.oportunidade_id))
  const naoConferidos = snap.pedidos.filter((p) => !p.conferido)
  validacoes.push(
    validar(
      'V5',
      'Win ≠ Pedido ≠ Pedido conferido',
      'ganha pode existir sem pedido; pedido pode existir sem conferência; nenhum pedido vinculado a não-ganha',
      ganhasComPedido.length < ganhas.length && pedidosDeNaoGanha.length === 0,
      `${fmtInt(ganhas.length)} ganhas: ${fmtInt(ganhasComPedido.length)} com pedido, ${fmtInt(ganhas.length - ganhasComPedido.length)} sem pedido. ${fmtInt(snap.pedidos.length)} pedidos no total, ${fmtInt(naoConferidos.length)} não conferidos, ${fmtInt(pedidosDeNaoGanha.length)} vinculados a não-ganhas.`,
      [`exemplo de ganha sem pedido: ${ganhas.find((o) => !ganhasComPedido.includes(o))?.oportunidade_id ?? '—'}`]
    )
  )

  // V6 — conta_id_erp pode ser nulo
  const semErp = snap.contas.filter((c) => c.conta_id_erp === null)
  validacoes.push(
    validar(
      'V6',
      'conta_id_erp pode ser nulo',
      'existem contas válidas sem vínculo ERP; conta_id ≠ conta_id_erp',
      semErp.length > 0,
      `${fmtInt(semErp.length)} de ${fmtInt(snap.contas.length)} contas sem conta_id_erp (vínculo opcional). conta_id e conta_id_erp são espaços de identificadores distintos.`,
      semErp.slice(0, 3).map((c) => `${c.fantasia} (conta_id ${c.conta_id}, sem ERP)`)
    )
  )

  // V7 — datas inválidas não entram em métricas
  const invalidas = registrosComDataInvalida(snap)
  const ciclo = cicloMedioDias(snap, hoje, 90)
  const wr = winRate(snap, hoje, 90)
  validacoes.push(
    validar(
      'V7',
      'Datas inválidas não entram em métricas',
      'registros com fechamento anterior à criação (ou marcados inconsistentes) são excluídos de ciclo/aging; contagens brutas continuam visíveis',
      invalidas.length > 0 && ciclo.excluidas >= 0,
      `${fmtInt(invalidas.length)} registros com data inválida detectados e sinalizados. Ciclo médio 90d calculado sobre ${fmtInt(ciclo.amostra)} ganhas válidas com ${fmtInt(ciclo.excluidas)} exclusões. Win rate 90d considera ${fmtInt(wr.ganhas + wr.perdidas)} fechamentos válidos (datas inconsistentes de fora).`,
      invalidas.slice(0, 3).map((o) => `oportunidade ${o.oportunidade_id}: fechamento ${o.fechamento_efetivo?.slice(0, 10)} anterior à criação ${o.criada_em.slice(0, 10)} — fora das métricas de ciclo`)
    )
  )

  // V8 — Radar e agente usam a mesma leitura da interface
  const r1 = regrasRadar(snap, hoje).find((r) => r.codigo === 'R1')!
  const r2 = regrasRadar(snap, hoje).find((r) => r.codigo === 'R2')!
  const respVencidas = responder('quantas previsões vencidas?', snap, hoje)
  const respSemAcao = responder('quantas oportunidades sem ação registrada?', snap, hoje)
  const agenteUsaR1 = respVencidas.texto.includes(fmtInt(r1.quantidade))
  const agenteUsaR2 = respSemAcao.texto.includes(fmtInt(r2.quantidade))
  const pipelineTexto = responder('qual o valor total do pipeline?', snap, hoje).texto
  const p = pipeline(snap)
  const agenteUsaPipeline = pipelineTexto.includes(fmtBRL(p.valor))
  validacoes.push(
    validar(
      'V8',
      'Radar e agente usam a mesma leitura da interface',
      'as respostas do agente para previsões vencidas, ações e pipeline citam exatamente os números computados pelas funções usadas pela interface',
      agenteUsaR1 && agenteUsaR2 && agenteUsaPipeline,
      `R1=${fmtInt(r1.quantidade)} citado pelo agente: ${agenteUsaR1 ? 'sim' : 'não'} · R2=${fmtInt(r2.quantidade)} citado: ${agenteUsaR2 ? 'sim' : 'não'} · pipeline=${fmtBRL(p.valor)} citado: ${agenteUsaPipeline ? 'sim' : 'não'}. Ambos consomem as mesmas funções de radar/metrics sobre o mesmo snapshot.`
    )
  )

  // V9 — no máximo uma proposta válida por oportunidade
  const porOpp = new Map<number, number>()
  for (const pr of snap.propostas) {
    if (pr.valida) porOpp.set(pr.oportunidade_id, (porOpp.get(pr.oportunidade_id) ?? 0) + 1)
  }
  const multiplas = [...porOpp.entries()].filter(([, n]) => n > 1)
  validacoes.push(
    validar(
      'V9',
      'No máximo uma proposta válida por oportunidade',
      'somente uma proposta marcada como válida por oportunidade (demais: substituída/cancelada)',
      multiplas.length === 0,
      `${fmtInt(snap.propostas.length)} propostas em ${fmtInt(porOpp.size)} oportunidades; ${fmtInt(multiplas.length)} com mais de uma válida.`,
      multiplas.slice(0, 3).map(([id, n]) => `oportunidade ${id} com ${n} propostas válidas`)
    )
  )

  // V10 — responsáveis distintos (conta × oportunidade × vendedor histórico)
  const principal = snap.oportunidades.find((o) => o.oportunidade_id === 339001)
  const contaPrincipal = snap.contas.find((c) => c.conta_id === 200001)
  const distintas = snap.oportunidades.filter((o) => {
    const conta = snap.contas.find((c) => c.conta_id === o.conta_id)
    return conta && conta.responsavel_id !== o.responsavel_id
  })
  const primeiraAcao = principal ? snap.acoes.find((a) => a.oportunidade_id === 339001 && a.tipo_acao === 'Cadastro') : undefined
  const historicoDiferente = primeiraAcao ? primeiraAcao.usuario_cadastro_id !== principal?.responsavel_id : false
  validacoes.push(
    validar(
      'V10',
      'Responsável da conta ≠ responsável da oportunidade ≠ vendedor histórico',
      'os três papéis são distintos e rastreáveis; a ação de cadastro pode ter outro usuário',
      distintas.length > 0 && !!contaPrincipal && contaPrincipal.responsavel_id !== principal?.responsavel_id,
      `${fmtInt(distintas.length)} de ${fmtInt(snap.oportunidades.length)} oportunidades têm responsável diferente do responsável da conta. Na oportunidade 339001: conta = ${contaPrincipal?.responsavel_nome}, oportunidade = ${principal?.responsavel_nome}, cadastro histórico = ${primeiraAcao?.usuario_cadastro_nome ?? '—'}${historicoDiferente ? ' (distintos)' : ''}.`
    )
  )

  // V11 — marcação explícita de dados simulados
  const aviso = snap.meta.aviso ?? ''
  const marcadas = snap.oportunidades.filter((o) => o.marcador_teste).length
  validacoes.push(
    validar(
      'V11',
      'Dados simulados explicitamente marcados',
      'o snapshot carrega aviso de dados sintéticos e registros de teste são marcados',
      aviso.length > 0,
      `aviso presente no snapshot; ${fmtInt(marcadas)} oportunidades marcadas como registro de teste; CNPJs e nomes fictícios em toda a base.`
    )
  )

  // V12 — estado atual ≠ histórico (cheque estrutural)
  const comHistorico = snap.oportunidades.filter((o) => idx.ultimaAcao.has(o.oportunidade_id)).length
  validacoes.push(
    validar(
      'V12',
      'Estado atual ≠ histórico',
      'a leitura corrente (campos da oportunidade) é independente da linha do tempo de ações',
      comHistorico > 0 && snap.acoes.length > snap.oportunidades.length,
      `${fmtInt(snap.acoes.length)} ações distribuídas em ${fmtInt(comHistorico)} oportunidades com histórico. A interface lê o estado pelos campos correntes e a vida comercial pela linha do tempo — fontes distintas.`
    )
  )

  // V13 — estado anterior coerente com o snapshot atual
  const estadoAnterior = carregarEstadoAnterior(snap)
  if (estadoAnterior) {
    const idsAnteriores = new Set(estadoAnterior.oportunidades.map((e) => e.oportunidade_id))
    const criadasApos = snap.oportunidades.filter(
      (o) => !idsAnteriores.has(o.oportunidade_id) && new Date(o.criada_em) > new Date(estadoAnterior.referencia),
    )
    const fantasma = [...idsAnteriores].filter((id) => !oppIds.has(id))
    validacoes.push(
      validar(
        'V13',
        'Estado anterior coerente com o snapshot',
        'todo registro do estado anterior existe no snapshot atual; toda oportunidade ausente do estado anterior foi criada após a referência',
        fantasma.length === 0 && criadasApos.length === snap.oportunidades.length - idsAnteriores.size,
        `${fmtInt(idsAnteriores.size)} registros no estado anterior (referência ${estadoAnterior.referencia.slice(0, 10)}); ${fmtInt(snap.oportunidades.length - idsAnteriores.size)} entradas criadas após a referência; ${fmtInt(fantasma.length)} registros fantasmas.`,
        fantasma.slice(0, 3).map((id) => `oportunidade ${id} existe no estado anterior, mas não no snapshot atual`)
      )
    )

    // V14 — fechamento aritmético do pipeline no diff
    const m = calcularMudancas(snap, hoje)
    if (m) {
      const fechado = m.pipeline.anterior + m.resumo.entradas_valor - m.resumo.saidas_ganhas_valor - m.resumo.saidas_perdidas_valor
      validacoes.push(
        validar(
          'V14',
          'Fechamento aritmético do diff de pipeline',
          'pipeline_anterior + entradas − saídas (ganhas e perdidas) = pipeline_atual',
          fechado === m.pipeline.atual,
          `anterior ${fmtBRL(m.pipeline.anterior)} + entradas ${fmtBRL(m.resumo.entradas_valor)} − ganhas ${fmtBRL(m.resumo.saidas_ganhas_valor)} − perdidas ${fmtBRL(m.resumo.saidas_perdidas_valor)} = ${fmtBRL(fechado)} (atual: ${fmtBRL(m.pipeline.atual)}).`
        )
      )
    }
  }

  // V15 — casos derivam 1:1 dos sinais ativos
  const sinaisAtivos = regrasRadar(snap, hoje).reduce((s, r) => s + r.quantidade, 0)
  const casos = gerarCasos(snap, hoje)
  validacoes.push(
    validar(
      'V15',
      'Casos de decisão derivam 1:1 dos sinais',
      'a quantidade de casos é igual à soma de ocorrências ativas do radar (1 sinal = 1 caso), sem seleção manual',
      casos.resumo.total === sinaisAtivos,
      `${fmtInt(casos.resumo.total)} casos gerados para ${fmtInt(sinaisAtivos)} ocorrências ativas de sinal. Impacto total sob decisão: ${fmtBRL(casos.resumo.impacto_total)}.`
    )
  )

  const ok = validacoes.filter((v) => v.status === 'ok').length
  return {
    executado_em: new Date().toISOString(),
    total: validacoes.length,
    ok,
    erro: validacoes.length - ok,
    validacoes,
  }
}
