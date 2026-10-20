// Debate com o pool Astra (gpt-6-astra) sobre o plano do próximo incremento.
// Uso: node tools/astra-debate.mjs "mensagem do turno"  (sem arg = turno inicial)
// Histórico: tools/astra-debate-history.json · Transcrição: v3/DEBATE-ASTRA.md
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = join(homedir(), 'Tools', 'cli-proxy-api', 'config.yaml')
const yaml = readFileSync(configPath, 'utf8')
const key = yaml.match(/^api-keys:\n\s+- "(.+?)"/m)?.[1]
if (!key) { console.error('chave do proxy não encontrada'); process.exit(1) }

const HIST = join(raiz, 'tools', 'astra-debate-history.json')
const OUT = join(raiz, 'v3', 'DEBATE-ASTRA.md')
const messages = existsSync(HIST) ? JSON.parse(readFileSync(HIST, 'utf8')) : []

const system = `Você é um arquiteto de produto e engenharia de software sênior, atuando como debatedor ADVERSARIAL de um plano. Você recebeu o escopo e a spec de um incremento de um dashboard comercial interno (Central de Receita, Next.js, React, feature comercial-v3 com seletores puros e testes node:test). Seu trabalho NÃO é elogiar: é achar furos, riscos, simplificações possíveis e responder as questões abertas com recomendação firme + contra-argumento honesto. Condições: protótipo interno de exploração (sem dados reais ainda, mock verossímil), público é um head de vendas (diretor), existe uma ferramenta do coordenador (Hunter OS) que a Central NÃO substitui — a Central desce ao detalhe via drill-down. Regras de domínio vinculativas (ADRs, decididas pelo dono do produto, não reabra): assinado sem integrar não vale; não integrou até o último dia do mês = receita do mês seguinte (fim de trimestre desliza o tri); pedido devolvido pela conferência volta ao executivo dono; New Name vs Cross deriva do grupo econômico da conta. Responda em português do Brasil, direto, com seções curtas e acionáveis.`

const turno = process.argv[2]
if (!messages.length) {
  const escopo = readFileSync(join(raiz, 'v3', 'PROXIMO-INCREMENTO-ESCOPO.md'), 'utf8')
  const spec = readFileSync(join(raiz, 'v3', 'SPEC-PEDIDOS-E-AGENTE.md'), 'utf8')
  messages.push({ role: 'system', content: system })
  messages.push({
    role: 'user',
    content: `Documentos do plano abaixo. Depois deles, o pedido deste turno.

===== DOCUMENTO 1: ESCOPO TRAVADO EM GRILL =====
${escopo}

===== DOCUMENTO 2: SPEC (formato to-spec) =====
${spec}

===== PEDIDO DESTE TURNO =====
${turno ?? `Debata o plano como um todo:
1) Furos e inconsistências na spec e nos user stories (seja específico, cite a história/ADR).
2) Os 5 pontos abertos (seção 6 do escopo): recomendação + contra-argumento para cada.
3) A seam mock→real (contratos + seletores puros + adapter): é suficiente? onde quebra?
4) Ordem de implementação em tracer bullets: qual bloco primeiro (A pedidos, B drill, C agente) e por quê.
5) Top 3 riscos do incremento e como mitigar no primeiro corte.
6) O que VOCÊ cortaria deste corte para entregar valor mais rápido sem mentir para o usuário.`}`,
  })
} else {
  messages.push({ role: 'user', content: turno })
}

const res = await fetch('http://127.0.0.1:8317/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model: 'gpt-6-astra',
    reasoning_effort: 'xhigh',
    messages,
    max_tokens: 8000,
  }),
})
if (!res.ok) { console.error('proxy erro', res.status, (await res.text()).slice(0, 300)); process.exit(1) }
const json = await res.json()
const content = json.choices?.[0]?.message?.content ?? '(sem conteúdo)'
messages.push({ role: 'assistant', content })
writeFileSync(HIST, JSON.stringify(messages, null, 2))
const header = existsSync(OUT) ? '' : '# Debate Astra × Plano do Próximo Incremento\n'
writeFileSync(OUT, `${header}\n\n---\n\n## Turno ${Math.floor(messages.length / 2)} (${new Date().toISOString().slice(0, 16).replace('T', ' ')})\n\n${content}\n`, { flag: 'a' })
console.log(content)
console.error(`\n[usage] ${JSON.stringify(json.usage ?? {})}`)
