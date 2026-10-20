import { resolverEtapaOportunidade } from './crm-taxonomy'

// Mantém a apresentação anterior da trilha autorizada enquanto as telas
// passam a consumir etapa_taxonomia diretamente na tarefa de integração.
const ETAPAS_BRIEFING = new Set(['Originação', 'SQL'])

export function etapaParaUI(etapa: string, tipoOportunidade: string | null = null): string {
  if (ETAPAS_BRIEFING.has(etapa)) return etapa
  const resolvida = resolverEtapaOportunidade(tipoOportunidade, etapa)
  return resolvida.estado_mapeamento === 'nao_mapeado' ? 'Não comprovado' : resolvida.rotulo
}
