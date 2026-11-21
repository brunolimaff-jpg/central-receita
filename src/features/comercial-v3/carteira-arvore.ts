/**
 * Árvore organizacional da Diretoria de Mercado, com identificador estável.
 *
 * `org-2027.ts` descreve a estrutura por aninhamento de arrays e usa o nome
 * como chave. Nome muda, tem acento e se repete — não serve para atribuir
 * registro de carga a pessoa. Aqui a mesma estrutura é achatada em nós com
 * `id` opaco e ponteiro para o pai; o nome vira rótulo.
 *
 * Fonte: `org-2027.ts` (slides do organograma 2027). O organograma está em
 * construção, sujeito a revisão orçamentária — por isso cada nó carrega
 * `procedencia`, e quem não está confirmado não some: fica marcado.
 *
 * Regra de modelagem: UMA árvore de subordinação, com vertical e território
 * como atributos. Território é recorte geográfico, não degrau — o próprio
 * organograma diz que o Território 05 tem a base anexa ao 02. Duas árvores
 * dariam dois totais diferentes para o mesmo CSO.
 */

import { CSO, HORIZONTAIS_2027, VERTICAIS, type Pessoa, type VerticalId } from './org-2027.ts'

export type CargoNivel = 'cso' | 'diretor' | 'gerente' | 'lider' | 'especialista'

export type NoOrganizacional = {
  /** Opaco e estável. Deriva da posição na estrutura, não do nome. */
  id: string
  /** `null` = vaga aberta: o nó existe para preservar a topologia, mas não recebe registro. */
  nome: string | null
  cargo: string
  nivel: CargoNivel
  pai: string | null
  vertical: VerticalId | null
  horizontais: string[]
  /** Escopo em texto, como o organograma declara ("Sul + Centro-Oeste + Norte"). */
  escopo: string | null
}

/**
 * De onde o nó veio. `slide` é o organograma 2027 — declarado, não confirmado
 * no diretório corporativo. `vaga` é posição em aberto. A distinção importa
 * porque a tela precisa poder dizer "esta estrutura ainda não foi confirmada".
 */
export type Procedencia = 'slide' | 'vaga'

export type Arvore = {
  raiz: string
  nos: Map<string, NoOrganizacional>
  filhos: Map<string, string[]>
  procedencia: Map<string, Procedencia>
}

const slug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Nível a partir do cargo declarado. O organograma mistura gerentes dentro de
 * `lideres` (dois gerentes Enterprise em Demais Segmentos), então o cargo é a
 * única fonte confiável — a profundidade do array não é.
 */
function nivelDoCargo(cargo: string): CargoNivel {
  const texto = slug(cargo)
  if (texto.includes('gerente')) return 'gerente'
  if (texto.includes('especialista')) return 'especialista'
  if (texto.includes('lider')) return 'lider'
  return 'lider'
}

function adicionar(arvore: Arvore, no: NoOrganizacional) {
  arvore.nos.set(no.id, no)
  if (no.pai) {
    const lista = arvore.filhos.get(no.pai) ?? []
    lista.push(no.id)
    arvore.filhos.set(no.pai, lista)
  }
  arvore.procedencia.set(no.id, no.nome === null ? 'vaga' : 'slide')
}

/** Percorre as pessoas de uma vertical/horizontal e devolve os nós criados. */
function descer(arvore: Arvore, pai: string, pessoas: Pessoa[], base: string, vertical: VerticalId | null, horizontais: string[]) {
  for (const pessoa of pessoas) {
    const id = `${base}/${pessoa.nome === null ? 'vaga' : slug(pessoa.nome)}`
    /*
     * Duas vagas seguidas na mesma base colidiriam no id. O sufixo pela posição
     * mantém o identificador único sem depender de ordem estável de array.
     */
    const idFinal = arvore.nos.has(id) ? `${id}-${arvore.nos.size}` : id
    adicionar(arvore, {
      id: idFinal,
      nome: pessoa.nome,
      cargo: pessoa.cargo,
      nivel: nivelDoCargo(pessoa.cargo),
      pai,
      vertical,
      horizontais,
      escopo: pessoa.escopo ?? null,
    })
    if (pessoa.lideres?.length) descer(arvore, idFinal, pessoa.lideres, idFinal, vertical, horizontais)
  }
}

export function construirArvore(): Arvore {
  const arvore: Arvore = { raiz: 'cso', nos: new Map(), filhos: new Map(), procedencia: new Map() }

  adicionar(arvore, {
    id: 'cso',
    nome: CSO.nome,
    cargo: CSO.cargo,
    nivel: 'cso',
    pai: null,
    vertical: null,
    horizontais: [],
    escopo: null,
  })

  for (const vertical of VERTICAIS) {
    const idDiretor = `v-${vertical.id}`
    adicionar(arvore, {
      id: idDiretor,
      nome: vertical.diretor.nome,
      cargo: vertical.diretor.cargo,
      nivel: 'diretor',
      pai: 'cso',
      vertical: vertical.id,
      horizontais: [],
      escopo: null,
    })
    descer(arvore, idDiretor, vertical.gerentes, idDiretor, vertical.id, [])
  }

  /*
   * As horizontais são atuação matricial, não uma quarta diretoria: o líder de
   * ERP vende dentro das verticais. Ficam sob o CSO para não inventar um
   * degrau que o organograma não declara, e não entram na cascata principal.
   */
  for (const horizontal of HORIZONTAIS_2027) {
    const idDiretor = `h-${horizontal.id}`
    adicionar(arvore, {
      id: idDiretor,
      nome: horizontal.lider.nome,
      cargo: horizontal.lider.cargo,
      nivel: 'lider',
      pai: 'cso',
      vertical: null,
      horizontais: [horizontal.id],
      escopo: null,
    })
  }

  return arvore
}

/** Árvore única do app. Construída uma vez; é estrutura estática. */
export const ARVORE = construirArvore()

/* ------------------------------------------------------------------ */
/*  Consultas                                                          */
/* ------------------------------------------------------------------ */

export function no(arvore: Arvore, id: string): NoOrganizacional | null {
  return arvore.nos.get(id) ?? null
}

/** Cadeia da raiz até o nó, para a trilha de navegação. */
export function trilha(arvore: Arvore, id: string): NoOrganizacional[] {
  const caminho: NoOrganizacional[] = []
  let atual: string | null = id
  let guarda = 0
  while (atual && guarda++ < 20) {
    const encontrado: NoOrganizacional | undefined = arvore.nos.get(atual)
    if (!encontrado) break
    caminho.unshift(encontrado)
    atual = encontrado.pai
  }
  return caminho
}

/** Filhos diretos, na ordem declarada. */
export function filhosDe(arvore: Arvore, id: string): NoOrganizacional[] {
  return (arvore.filhos.get(id) ?? []).map(filho => arvore.nos.get(filho)!).filter(Boolean)
}

/**
 * Todos os descendentes, inclusive o próprio nó. É o conjunto que a carteira
 * de um diretor soma: ele mais os gerentes e líderes abaixo.
 */
export function subarvore(arvore: Arvore, id: string): NoOrganizacional[] {
  const resultado: NoOrganizacional[] = []
  const visitar = (atual: string) => {
    const encontrado = arvore.nos.get(atual)
    if (!encontrado) return
    resultado.push(encontrado)
    for (const filho of arvore.filhos.get(atual) ?? []) visitar(filho)
  }
  visitar(id)
  return resultado
}

/** Nós nomeados (que podem receber registro), ignorando vagas. */
export function nomeados(arvore: Arvore, id: string): NoOrganizacional[] {
  return subarvore(arvore, id).filter(n => n.nome !== null)
}

/** Nomes para a tela, sem repetir o mesmo nome duas vezes. */
export function nomesConhecidos(arvore: Arvore): string[] {
  return [...arvore.nos.values()].filter(n => n.nome !== null).map(n => n.nome as string)
}
