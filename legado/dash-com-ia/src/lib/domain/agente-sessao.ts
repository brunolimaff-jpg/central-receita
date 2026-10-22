import type { AgenteResposta } from './types'

export interface MensagemAgente {
  id: number
  papel: 'usuario' | 'agente'
  texto: string
  resposta?: AgenteResposta
  inicial?: boolean
}

const MENSAGEM_INICIAL: MensagemAgente = {
  id: 0,
  papel: 'agente',
  inicial: true,
  texto: 'Faça uma pergunta sobre a leitura atual. A resposta inclui os registros consultados e uma limitação para ajudar a interpretar o resultado.',
}

const snapshotServidor: MensagemAgente[] = [MENSAGEM_INICIAL]
let mensagens: MensagemAgente[] = snapshotServidor
let proximoId = 1
const assinantes = new Set<() => void>()

export function getMensagens(): MensagemAgente[] {
  return mensagens
}

export function getServerSnapshotMensagens(): MensagemAgente[] {
  return snapshotServidor
}

export function subscribeMensagens(assinante: () => void): () => void {
  assinantes.add(assinante)
  return () => assinantes.delete(assinante)
}

export function adicionarMensagem(mensagem: Omit<MensagemAgente, 'id'>): MensagemAgente {
  const novaMensagem = { ...mensagem, id: proximoId++ }
  mensagens = [...mensagens, novaMensagem]
  for (const assinante of assinantes) assinante()
  return novaMensagem
}
