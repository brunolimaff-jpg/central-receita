/**
 * De-para entre o responsável da carga e o nó da árvore organizacional.
 *
 * O problema: a carga traz `Responsável` como texto livre, sem id, e os nomes
 * do organograma não batem com os da plataforma — "José Tavares" é *Jose
 * Ricardo Porto Tavares*, "Elias Junior" é *Elias Leite Do Nascimento Junior*.
 * São duas populações de nome e nenhuma chave entre elas.
 *
 * A regra que este módulo aplica:
 *
 * 1. Casamento **só por igualdade exata após normalização** (sem acento,
 *    caixa única, espaço colapsado). Nunca por similaridade. "José Tavares" e
 *    "Jose Ricardo Porto Tavares" ficam perto em qualquer métrica de distância
 *    razoável, e um falso positivo atribui carteira à pessoa errada — o pior
 *    erro possível numa tela de gestão.
 * 2. Alias é **declaração humana registrada**, não inferência. Cada alias
 *    carrega a fonte de onde saiu.
 * 3. Quem não casa cai em resíduo nomeado, nunca em distribuição proporcional.
 * 4. Registro sem responsável e registro com responsável não mapeado são
 *    baldes **distintos**: um é falha de cadastro no CRM, o outro é falha do
 *    de-para. A ação para resolver cada um é diferente.
 *
 * O de-para é artefato de produto: fica aqui, versionado, com procedência e
 * data. Quando a exportação passar a trazer id do proprietário, este arquivo
 * vira a trilha de auditoria da transição.
 */

import type { Arvore, NoOrganizacional } from './carteira-arvore.ts'
import { slugPessoa } from './org-2027.ts'

/** Normalização usada em toda comparação: sem acento, caixa única, espaço único. */
export function normalizarResponsavel(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('pt-BR')
}

export type Confianca = 'confirmado' | 'provavel' | 'nao_mapeado'

export type EntradaDePara = {
  /** Nome como aparece no organograma (o nó da árvore). */
  no: string
  /** Formas que a carga pode trazer. A primeira é a grafia curta do organograma. */
  aliases: string[]
  confianca: Confianca
  /** De onde veio a informação: relatório, conferência manual, diretório. */
  fonte: string
}

/**
 * De-para declarado.
 *
 * `confirmado` só quando há conferência humana registrada. As entradas aqui
 * começam como `provavel`: o organograma veio de slide e as divergências de
 * nome já foram documentadas. A tela mostra a cobertura — se for baixa, o
 * número de resíduo é a prova de que falta trabalho, e não um defeito do app.
 *
 * Ampliar esta lista é ampliar a cobertura da cascata. Cada linha acrescentada
 * deve vir com a fonte, para que a atribuição seja auditável.
 */
export const DE_PARA: EntradaDePara[] = [
  // CSO — o nome é único e aparece em toda a documentação da estrutura.
  { no: 'Hermínio Gastaldi', aliases: ['Hermínio Gastaldi', 'Herminio Gastaldi', 'Hermínio', 'Herminio'], confianca: 'provavel', fonte: 'org-2027.ts (CSO)' },

  // Diretores de segmento.
  { no: 'Giovanne Farias', aliases: ['Giovanne Farias', 'Giovanne'], confianca: 'provavel', fonte: 'org-2027.ts (Diretor de segmento)' },
  { no: 'Fernando Silva', aliases: ['Fernando Silva'], confianca: 'provavel', fonte: 'org-2027.ts (Diretor de segmento)' },
  { no: 'Alexandre Mancini', aliases: ['Alexandre Mancini', 'Mancini'], confianca: 'provavel', fonte: 'org-2027.ts (Diretor de soluções horizontais)' },

  // Gerentes e líderes nomeados no organograma.
  { no: 'Raíssa Delamora', aliases: ['Raíssa Delamora', 'Raissa Delamora'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'José Tavares', aliases: ['José Tavares', 'Jose Tavares', 'Jose Ricardo Porto Tavares'], confianca: 'provavel', fonte: 'relatório de 27/10: nome completo confirmado na plataforma' },
  { no: 'Elias Junior', aliases: ['Elias Junior', 'Elias Leite Do Nascimento Junior'], confianca: 'provavel', fonte: 'relatório de 27/10: nome completo confirmado na plataforma' },
  { no: 'Felipe Santos', aliases: ['Felipe Santos'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Alice da Silveira dos Reis', aliases: ['Alice da Silveira dos Reis', 'Alice Silveira'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Juliana Escarabelin Martins', aliases: ['Juliana Escarabelin Martins', 'Juliana Escarabelin'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Edmilson Tadeu de Freitas', aliases: ['Edmilson Tadeu de Freitas', 'Edmilson Freitas'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Sabrina Bowens', aliases: ['Sabrina Bowens'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Carina Baldissera', aliases: ['Carina Baldissera'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Andre Luís de Oliveira', aliases: ['Andre Luís de Oliveira', 'André Luís de Oliveira', 'Andre Luis de Oliveira'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Gabriele Nayara Dias Correa', aliases: ['Gabriele Nayara Dias Correa', 'Gabriele Correa'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Mario Borges', aliases: ['Mario Borges', 'Mário Borges'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Daniel Augusto', aliases: ['Daniel Augusto'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Alessandra Di Sicco', aliases: ['Alessandra Di Sicco', 'Alessandra DiSicco'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Matheus Martins', aliases: ['Matheus Martins'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Vitor Diego', aliases: ['Vitor Diego'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Marcos Paulo Malagola', aliases: ['Marcos Paulo Malagola', 'Malagola'], confianca: 'provavel', fonte: 'org-2027.ts' },
  { no: 'Alberty Vinnicius Gomes de Arruda', aliases: ['Alberty Vinnicius Gomes de Arruda', 'Vinnicius Gomes de Arruda', 'Vinnicius'], confianca: 'provavel', fonte: 'relatório de 27/10: nome completo confirmado na plataforma' },
]

/** Índice alias normalizado → nó da árvore. Construído uma vez. */
function construirIndice(arvore: Arvore) {
  const porNome = new Map<string, NoOrganizacional>()
  for (const no of arvore.nos.values()) {
    if (no.nome) porNome.set(normalizarResponsavel(no.nome), no)
  }

  const indice = new Map<string, NoOrganizacional>()
  for (const entrada of DE_PARA) {
    const alvo = porNome.get(normalizarResponsavel(entrada.no)) ?? null
    if (!alvo) continue
    for (const alias of entrada.aliases) {
      indice.set(normalizarResponsavel(alias), alvo)
    }
  }
  return indice
}

export type ResultadoAtribuicao = {
  /** Responsável da carga → nó. */
  mapa: Map<string, NoOrganizacional>
  /**
   * Chaves normalizadas que não casaram. Separadas por motivo, porque a ação
   * para cada uma é diferente.
   */
  semResponsavel: string[]
  naoCadastrado: string[]
  naoMapeado: string[]
}

/**
 * Atribui cada responsável distinto da carga a um nó.
 *
 * Recebe a lista de responsáveis brutos; devolve o mapa e os três baldes de
 * resíduo. `null` ou vazio é "sem responsável na carga" — não é erro do
 * de-para, é erro do CRM.
 */
export function atribuirResponsaveis(arvore: Arvore, responsaveis: Array<string | null>): ResultadoAtribuicao {
  const indice = construirIndice(arvore)
  const mapa = new Map<string, NoOrganizacional>()
  const semResponsavel: string[] = []
  const naoCadastrado: string[] = []
  const naoMapeado: string[] = []

  const vistos = new Set<string>()
  for (const bruto of responsaveis) {
    const texto = (bruto ?? '').trim()
    if (texto === '') {
      if (!semResponsavel.includes('')) semResponsavel.push('')
      continue
    }
    const chave = normalizarResponsavel(texto)
    if (vistos.has(chave)) continue
    vistos.add(chave)

    const alvo = indice.get(chave)
    if (alvo) {
      mapa.set(chave, alvo)
      continue
    }
    /*
     * Não é heurística de nome: é só a diferença entre "a pessoa existe na
     * estrutura com outra grafia" e "não existe". A grafia ainda é do de-para.
     */
    const existe = [...arvore.nos.values()].some(n => n.nome !== null && normalizarResponsavel(n.nome as string) === chave)
    if (existe) naoMapeado.push(texto)
    else naoCadastrado.push(texto)
  }

  return { mapa, semResponsavel, naoCadastrado, naoMapeado }
}

/**
 * Cobertura do de-para, para a tela expor como número de primeira classe.
 * Percentual de nós nomeados que têm ao menos um alias declarado.
 */
export function coberturaDePara(arvore: Arvore): { declarados: number; total: number; percentual: number } {
  const indice = construirIndice(arvore)
  const nomeados = [...arvore.nos.values()].filter(n => n.nome !== null)
  const declarados = nomeados.filter(n => {
    for (const alvo of indice.values()) if (alvo.id === n.id) return true
    return false
  }).length
  return { declarados, total: nomeados.length, percentual: nomeados.length === 0 ? 0 : declarados / nomeados.length }
}

/** Nó da árvore para um responsável bruto, ou `null`. Usado nos testes e na tela. */
export function noDoResponsavel(arvore: Arvore, bruto: string | null): NoOrganizacional | null {
  const resultado = atribuirResponsaveis(arvore, [bruto])
  return resultado.mapa.get(normalizarResponsavel(bruto ?? '')) ?? null
}

export { slugPessoa }
