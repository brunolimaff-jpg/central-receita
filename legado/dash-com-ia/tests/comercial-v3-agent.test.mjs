import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Contrato do Agente Comercial local (plano Task 6 Step 1, l.562-575).
 *
 * O agente é simulado por palavra-chave sobre o `AgentBriefingModel`: nenhum
 * provedor, nenhuma rede. A prova central é que toda resposta carrega apenas
 * valores que já existem no briefing — nenhum número nasce na resposta.
 */

const require = createRequire(import.meta.url)
const Module = require('node:module')
const ts = require('typescript')
Module._extensions['.ts'] = (mod, filename) => {
  const source = readFileSync(filename, 'utf8')
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  mod._compile(output, filename)
}

const { COMMERCIAL_SNAPSHOT } = require('../src/features/comercial-v3/mock-data.ts')
const {
  AGENT_SUPPORTED_QUESTIONS,
  selectAgentBriefing,
  selectAgentOpening,
  selectFocusAnswer,
  selectInterventions,
} = require('../src/features/comercial-v3/model.ts')
const { AGENT_PROMPTS, answerAgentQuestion, detectAgentIntent } = require('../src/features/comercial-v3/agent.ts')
const { formatarComSinal, formatarMilhoes, formatarPercentualInteiro } = require('../src/features/comercial-v3/format.ts')
const { AGENTE_COPY, ASSISTENTE_COPY } = require('../src/features/comercial-v3/copy.ts')

const MES = { period: 'month', solution: 'all', branch: 'all' }
const briefing = selectAgentBriefing(COMMERCIAL_SNAPSHOT, MES)

const PERGUNTAS_DO_PLANO = [
  { pergunta: 'o que mudou hoje?', intent: 'forecast' },
  { pergunta: 'quais oportunidades concentram o desvio?', intent: 'oportunidades' },
  { pergunta: 'quais filiais mais mudaram?', intent: 'filiais' },
  { pergunta: 'como New Names e Cross participam?', intent: 'origem' },
  { pergunta: 'o que mudou na semana atual?', intent: 'semana' },
]

/** Todos os valores monetários que o briefing carrega — a única fonte legítima de R$. */
function valoresDoBriefing() {
  const valores = new Set([
    briefing.movimentos.oficial,
    briefing.movimentos.atual,
    briefing.movimentos.net,
    ...Object.values(briefing.movimentos.byMovement).map((resumo) => resumo.value),
    briefing.origem.realizado,
    briefing.origem.newNames,
    briefing.origem.cross,
    briefing.origem.recorrente,
    briefing.origem.habilitacao,
    briefing.origem.servicos,
    ...briefing.kpis.map((kpi) => kpi.value),
    ...briefing.atencao.flatMap((sinal) => [sinal.realizado, sinal.meta]),
    ...briefing.semanas.flatMap((semana) => [semana.forecast, semana.pace]),
  ])
  return new Set([...valores].map((valor) => formatarMilhoes(valor)))
}

/** Todos os percentuais que o briefing permite derivar. */
function percentuaisDoBriefing() {
  const razoes = [
    briefing.top5Share,
    ...briefing.atencao.map((sinal) => sinal.cobertura),
    ...(briefing.origem.realizado > 0
      ? [
          briefing.origem.newNames / briefing.origem.realizado,
          briefing.origem.cross / briefing.origem.realizado,
          briefing.origem.recorrente / briefing.origem.realizado,
        ]
      : []),
  ]
  return new Set(razoes.map((razao) => formatarPercentualInteiro(razao)))
}

function assertSomenteValoresDoBriefing(resposta) {
  const monetarios = resposta.match(/R\$ [\d.,]+ mi/g) ?? []
  const permitidos = valoresDoBriefing()
  for (const valor of monetarios) {
    assert.ok(permitidos.has(valor), `valor fora do briefing na resposta: ${valor} — "${resposta}"`)
  }

  const percentuais = resposta.match(/\d+%/g) ?? []
  const permitidosPct = percentuaisDoBriefing()
  for (const valor of percentuais) {
    assert.ok(permitidosPct.has(valor), `percentual fora do briefing na resposta: ${valor} — "${resposta}"`)
  }
}

test('as perguntas do plano resolvem na intenção esperada', () => {
  for (const { pergunta, intent } of PERGUNTAS_DO_PLANO) {
    assert.equal(detectAgentIntent(pergunta), intent, `intenção errada para "${pergunta}"`)
  }
})

test('a ordem de precedência não confunde filial, semana e forecast', () => {
  assert.equal(detectAgentIntent('quais filiais mais mudaram?'), 'filiais')
  assert.equal(detectAgentIntent('o que mudou na semana atual?'), 'semana')
  assert.equal(detectAgentIntent('o que mudou no forecast?'), 'forecast')
  assert.equal(detectAgentIntent('como está New Names x Cross?'), 'origem')
  assert.equal(detectAgentIntent('  '), 'desconhecida')
  assert.equal(detectAgentIntent(''), 'desconhecida')
})

test('toda resposta carrega apenas valores presentes no briefing', () => {
  for (const { pergunta } of PERGUNTAS_DO_PLANO) {
    const resposta = answerAgentQuestion(pergunta, briefing)
    assert.ok(resposta.text.length > 0, `resposta vazia para "${pergunta}"`)
    assertSomenteValoresDoBriefing(resposta.text)
  }

  for (const { question } of AGENT_PROMPTS) {
    const resposta = answerAgentQuestion(question, briefing)
    assertSomenteValoresDoBriefing(resposta.text)
  }
})

test('a resposta de forecast reconcilia com o contrato congelado', () => {
  const resposta = answerAgentQuestion('o que mudou hoje?', briefing)
  assert.equal(resposta.intent, 'forecast')
  assert.ok(resposta.text.includes(formatarMilhoes(briefing.movimentos.oficial)))
  assert.ok(resposta.text.includes(formatarMilhoes(briefing.movimentos.atual)))
  assert.ok(resposta.text.includes(formatarMilhoes(11.0)))
  assert.ok(resposta.text.includes(formatarMilhoes(10.2)))
})

test('a resposta de filiais fala de cobertura de meta, não de variação', () => {
  const resposta = answerAgentQuestion('quais filiais mais mudaram?', briefing)
  assert.equal(resposta.intent, 'filiais')
  assert.ok(resposta.text.includes('cobertura de meta'))
  assert.equal(resposta.text.includes('mudaram'), false, 'a resposta não pode afirmar variação por filial')
  for (const sinal of briefing.atencao) {
    assert.ok(resposta.text.includes(sinal.branch))
  }
})

test('a resposta semanal usa a semana corrente derivada do snapshot', () => {
  const resposta = answerAgentQuestion('o que mudou na semana atual?', briefing)
  assert.equal(resposta.intent, 'semana')
  const atual = briefing.semanas.find((semana) => semana.current)
  assert.ok(atual, 'o briefing precisa expor a semana corrente')
  assert.equal(atual.week, 3)
  assert.ok(resposta.text.includes(atual.label))
  assert.ok(resposta.text.includes(atual.rangeLabel))
})

test('pergunta fora do retrato devolve a limitação, sem inventar valor', () => {
  const resposta = answerAgentQuestion('quantos clientes temos na carteira?', briefing)
  assert.equal(resposta.intent, 'desconhecida')
  assert.equal(
    resposta.text,
    'Não encontrei essa resposta no retrato atual. Posso detalhar forecast, oportunidades, filiais, New Names x Cross ou a semana corrente.',
  )
  assert.equal(resposta.text, AGENTE_COPY.limitacao)
  assertSomenteValoresDoBriefing(resposta.text)
})

test('o agente não chama rede nem provedor: módulo puro e síncrono', () => {
  const raiz = fileURLToPath(new URL('..', import.meta.url))
  const fonte = readFileSync(join(raiz, 'src', 'features', 'comercial-v3', 'agent.ts'), 'utf8')
  for (const proibido of ['fetch(', 'await ', 'async ', 'http://', 'https://', 'process.env']) {
    assert.equal(fonte.includes(proibido), false, `agent.ts não pode conter ${proibido}`)
  }
  assert.equal(typeof answerAgentQuestion('o que mudou hoje?', briefing).text, 'string')
})

// ---------------------------------------------------------------------------
// Casa do assistente (revisão geral — ticket 01): fundação de contratos,
// seletores puros e mock. Sem UI; a UI é construída contra estes nomes.
// ---------------------------------------------------------------------------

/** Compara valores monetários em milhões tolerando ruído de ponto flutuante. */
function perto(atual, esperado, tolerancia = 1e-9) {
  assert.ok(Math.abs(atual - esperado) <= tolerancia, `esperado ${esperado}, recebido ${atual}`)
}

function oppMes(id) {
  return COMMERCIAL_SNAPSHOT.periods.month.forecastOpportunities.find((o) => o.id === id)
}

test('o assistente expõe exatamente as três perguntas suportadas', () => {
  assert.deepEqual(
    AGENT_SUPPORTED_QUESTIONS.map((questao) => questao.id),
    ['exige-atencao', 'o-que-mudou', 'explique-o-gap'],
  )
  assert.equal(AGENT_SUPPORTED_QUESTIONS[0].label, 'O que exige minha atenção?')
  assert.equal(AGENT_SUPPORTED_QUESTIONS[1].label, 'O que mudou?')
  assert.equal(AGENT_SUPPORTED_QUESTIONS[2].label, 'Explique o gap')
  for (const questao of AGENT_SUPPORTED_QUESTIONS) {
    assert.ok(questao.hint.length > 0, `hint ausente em ${questao.id}`)
  }
})

test('abertura saúda e descreve a posição do recorte sem inventar movimento', () => {
  const abertura = selectAgentOpening(COMMERCIAL_SNAPSHOT, MES)

  assert.equal(abertura.greeting, ASSISTENTE_COPY.saudacao)
  assert.deepEqual(abertura.supportedQuestions, AGENT_SUPPORTED_QUESTIONS)
  assert.ok(abertura.synthesis.length >= 2 && abertura.synthesis.length <= 4, 'síntese precisa ter 2 a 4 frases')

  const texto = abertura.synthesis.join(' ')
  assert.ok(texto.includes('Posição de setembro'), `síntese sem período: ${texto}`)
  assert.ok(texto.includes(formatarMilhoes(10.2)), 'síntese sem forecast atual')
  assert.ok(texto.includes(formatarMilhoes(12.0)), 'síntese sem meta')
  assert.ok(texto.includes(formatarMilhoes(8.4)), 'síntese sem realizado')
  assert.ok(texto.includes(formatarMilhoes(1.8)), 'síntese sem gap para a meta')
  assert.ok(texto.includes('70%'), 'síntese sem percentual do realizado')

  for (const proibido of ['piorou', 'melhorou', 'atrasou', 'atrasado', 'cresceu', 'caiu']) {
    assert.equal(texto.includes(proibido), false, `síntese não pode afirmar movimento (${proibido}): ${texto}`)
  }
})

test('abertura assume e explicita os filtros do recorte', () => {
  const sp = selectAgentOpening(COMMERCIAL_SNAPSHOT, { ...MES, branch: 'SP' })
  const textoSp = sp.synthesis.join(' ')
  assert.ok(textoSp.includes('Recorte filtrado: filial SP'), `filtros ausentes: ${textoSp}`)
  assert.ok(textoSp.includes(formatarMilhoes(2.0)), 'síntese deve carregar o forecast do recorte SP')
  assert.equal(textoSp.includes(formatarMilhoes(10.2)), false, 'síntese filtrada não pode citar o número global')

  const spHcm = selectAgentOpening(COMMERCIAL_SNAPSHOT, { ...MES, branch: 'SP', solution: 'HCM' })
  assert.ok(spHcm.synthesis.join(' ').includes('filial SP · solução HCM'))

  const semFiltro = selectAgentOpening(COMMERCIAL_SNAPSHOT, MES).synthesis.join(' ')
  assert.ok(semFiltro.includes('Recorte sem filtro'), `recorte completo não declarado: ${semFiltro}`)

  const trimestre = selectAgentOpening(COMMERCIAL_SNAPSHOT, { ...MES, period: 'quarter' }).synthesis.join(' ')
  assert.ok(trimestre.includes('Posição do trimestre'))
})

test('intervenções vêm de oportunidades paradas antes da Negociação, por valor', () => {
  const intervencoes = selectInterventions(COMMERCIAL_SNAPSHOT, MES)

  assert.ok(intervencoes.length <= 3, 'Exige você tem no máximo 3 prioridades')
  assert.deepEqual(
    intervencoes.map((item) => item.opportunityId),
    ['opp-011', 'opp-013', 'opp-001'],
    'ordem esperada: 0,7 · 0,65 · 0,6 (empate resolvido por dias sem avanço)',
  )

  for (const item of intervencoes) {
    const opp = oppMes(item.opportunityId)
    assert.ok(opp, `oportunidade ${item.opportunityId} não existe no mock`)
    assert.equal(opp.stage, 'Proposta', 'intervenção precisa estar antes da Negociação')
    assert.notEqual(opp.stage, 'Negociação')
    perto(item.value, opp.forecastCurrent)
    assert.equal(item.executive, opp.executive)
    assert.ok(item.headline.includes(opp.account), 'headline precisa nomear a conta')
    assert.ok(item.headline.includes(String(item.daysIdle)), 'headline precisa citar os dias')
    assert.ok(item.reason.includes(opp.executive), 'reason precisa citar o executivo')
    assert.ok(item.reason.includes(opp.branch), 'reason precisa citar a filial')
  }

  for (let indice = 1; indice < intervencoes.length; indice += 1) {
    assert.ok(
      intervencoes[indice - 1].value >= intervencoes[indice].value,
      'intervenções precisam estar ordenadas por valor decrescente',
    )
  }
})

test('dias sem avanço derivam do history contra o asOf do snapshot', () => {
  const intervencoes = selectInterventions(COMMERCIAL_SNAPSHOT, MES)
  const diaAsOf = new Date(COMMERCIAL_SNAPSHOT.asOf).getUTCDate()
  const esperados = { 'opp-011': 9, 'opp-013': 6, 'opp-001': 7 }

  for (const item of intervencoes) {
    const opp = oppMes(item.opportunityId)
    const ultimoDia = Math.max(...opp.history.map((evento) => new Date(evento.at).getUTCDate()))
    assert.equal(item.daysIdle, diaAsOf - ultimoDia, `daysIdle de ${item.opportunityId} deve derivar do history`)
    assert.equal(item.daysIdle, esperados[item.opportunityId])
  }

  // Empate de valor 0,6 entre opp-001 (7 dias) e opp-016 (5 dias): o desempate
  // por dias sem avanço mantém opp-001 nas 3 prioridades.
  assert.equal(
    intervencoes.some((item) => item.opportunityId === 'opp-016'),
    false,
    'opp-016 perde o desempate para opp-001',
  )
})

test('intervenções respeitam o recorte e podem ficar vazias', () => {
  const sp = selectInterventions(COMMERCIAL_SNAPSHOT, { ...MES, branch: 'SP' })
  assert.deepEqual(
    sp.map((item) => item.opportunityId),
    ['opp-001'],
  )

  const servicos = selectInterventions(COMMERCIAL_SNAPSHOT, { ...MES, solution: 'Serviços' })
  assert.deepEqual(servicos, [], 'Serviços não tem oportunidade parada antes da Negociação')

  const trimestre = selectInterventions(COMMERCIAL_SNAPSHOT, { ...MES, period: 'quarter' })
  assert.deepEqual(
    trimestre.map((item) => item.opportunityId),
    ['opp-011', 'opp-013', 'opp-001'],
  )
  perto(trimestre[0].value, 3 * oppMes('opp-011').forecastCurrent)
})

test('pergunta não suportada devolve null, nunca resposta inventada', () => {
  assert.equal(selectFocusAnswer(COMMERCIAL_SNAPSHOT, MES, 'inventada'), null)
  assert.equal(selectFocusAnswer(COMMERCIAL_SNAPSHOT, MES, ''), null)
  assert.equal(selectFocusAnswer(COMMERCIAL_SNAPSHOT, MES, 'exige atencao sem hifen'), null)
})

test('resposta em foco de atenção aponta as intervenções com evidência e próximo passo', () => {
  const foco = selectFocusAnswer(COMMERCIAL_SNAPSHOT, MES, 'exige-atencao')

  assert.ok(foco)
  assert.equal(foco.questionId, 'exige-atencao')
  assert.equal(foco.questionLabel, 'O que exige minha atenção?')
  assert.ok(foco.conclusion.includes('Têxtil Sigma'), 'conclusão precisa nomear a maior prioridade')
  assert.ok(foco.conclusion.includes(formatarMilhoes(oppMes('opp-011').forecastCurrent)))
  assert.ok(foco.evidence.length >= 1)
  assert.equal(foco.evidence[0].view, 'opportunity')
  assert.equal(foco.evidence[0].opportunityId, 'opp-011')
  assert.ok(foco.limits.length >= 1)
  assert.ok(foco.limits.some((limite) => limite.includes('cenário simulado')))
  assert.equal(foco.nextStep.view, 'opportunity')
  assert.equal(foco.nextStep.opportunityId, 'opp-011')
})

test('resposta em foco do que mudou usa os movimentos oficiais do período', () => {
  const foco = selectFocusAnswer(COMMERCIAL_SNAPSHOT, MES, 'o-que-mudou')

  assert.ok(foco)
  assert.equal(foco.questionLabel, 'O que mudou?')
  assert.ok(foco.conclusion.includes(formatarMilhoes(11.0)), 'conclusão sem a fotografia oficial')
  assert.ok(foco.conclusion.includes(formatarMilhoes(10.2)), 'conclusão sem o forecast atual')
  assert.ok(foco.conclusion.includes('saídas'), 'conclusão precisa detalhar os movimentos')
  assert.ok(foco.conclusion.includes(formatarComSinal(-0.8)), 'conclusão sem o movimento líquido')
  assert.ok(foco.evidence.some((item) => item.view === 'forecast'))
  assert.ok(foco.evidence.some((item) => item.view === 'opportunity' && item.opportunityId))
  assert.ok(
    foco.limits.some((limite) => limite.includes('não descrevem meses anteriores')),
    'limites precisam declarar a ausência de histórico',
  )
  assert.equal(foco.nextStep.view, 'forecast')
})

test('resposta em foco do gap explica a composição sem somar realizado ao forecast', () => {
  const foco = selectFocusAnswer(COMMERCIAL_SNAPSHOT, MES, 'explique-o-gap')

  assert.ok(foco)
  assert.equal(foco.questionLabel, 'Explique o gap')
  assert.ok(foco.conclusion.includes(formatarMilhoes(10.2)), 'conclusão sem forecast atual')
  assert.ok(foco.conclusion.includes(formatarMilhoes(12.0)), 'conclusão sem meta')
  assert.ok(foco.conclusion.includes(formatarMilhoes(8.4)), 'conclusão sem realizado')
  assert.ok(foco.conclusion.includes(formatarMilhoes(1.8)), 'conclusão sem o gap')
  assert.ok(foco.conclusion.includes('15%'))
  assert.equal(
    foco.conclusion.includes(formatarMilhoes(18.6)),
    false,
    'realizado + forecast sobre a meta seria dupla contagem',
  )
  assert.ok(foco.limits.some((limite) => limite.includes('não soma os dois')))
  assert.ok(foco.evidence.some((item) => item.view === 'forecast'))
  assert.ok(foco.evidence.some((item) => item.view === 'branch'), 'evidência deve incluir a filial de menor cobertura')
  assert.equal(foco.nextStep.view, 'forecast')
})

test('gap responde pelo recorte filtrado, não pelo número global', () => {
  const sp = selectFocusAnswer(COMMERCIAL_SNAPSHOT, { ...MES, branch: 'SP' }, 'explique-o-gap')

  assert.ok(sp)
  assert.ok(sp.conclusion.includes(formatarMilhoes(2.0)), 'gap de SP precisa do forecast do recorte')
  assert.ok(sp.conclusion.includes(formatarMilhoes(2.4)), 'gap de SP precisa da meta do recorte')
  assert.ok(sp.conclusion.includes(formatarMilhoes(0.4)), 'gap de SP é 2,0 − 2,4 = 0,4')
  assert.equal(sp.conclusion.includes(formatarMilhoes(1.8)), false, 'gap filtrado não pode citar o gap global')
})

test('foco de atenção sem intervenções no recorte é honesto', () => {
  const foco = selectFocusAnswer(COMMERCIAL_SNAPSHOT, { ...MES, solution: 'Serviços' }, 'exige-atencao')

  assert.ok(foco)
  assert.ok(foco.conclusion.includes('Nenhuma oportunidade'), 'sem prioridades, a conclusão declara o vazio')
  assert.deepEqual(foco.evidence, [])
  assert.equal(foco.nextStep.view, 'home')
  assert.equal(foco.nextStep.opportunityId, undefined)
})
