/**
 * Regra do blocos da demonstração.
 *
 * Homologação é pública. Uma senha aqui não protege nada de verdade — ela
 * existe para o momento em que alguém abre o link numa sala de reunião e o
 * telão mostra "Bom dia, Visitante" antes de o apresentador chegar. É um
 * convite, não uma fechadura, e o comentário fica no código para que ninguém
 * trate isto como controle de acesso.
 *
 * A senha é `RACE`, a fala do Hermínio que o time reconhece. Quem não sabe a
 * fala lê a dica na tela — o easter egg é para quem sabe, a porta é para todos.
 *
 * Módulo puro, sem DOM: mesma forma de `nav-collapse.ts`, para a regra ser
 * testável sem navegador.
 */

export const SENHA = 'RACE'

/** Chave única no armazenamento local do navegador. */
export const CHAVE_BLOQUEIO = 'central-receita:bloqueio'

/**
 * Normalização da entrada.
 *
 * Só trim e colapso de espaço: a caixa é parte da senha. `race` minúsculo
 * reprova, `RACE` entra. É a fala do Hermínio em caixa alta, e o easter egg
 * perde a graça se aceitar qualquer forma.
 *
 * Espaço no meio também reprova (`RA CE`): aí a pessoa não digitou a fala,
 * digitou outra coisa.
 */
export function normalizarSenha(bruta: string): string {
  return bruta.trim().replace(/\s+/g, ' ')
}

export function senhaCorreta(bruta: string): boolean {
  return normalizarSenha(bruta) === SENHA
}

/** Formato gravado. Versão na string para que uma mudança futura invalide a marca. */
const VALOR_DESTRAVADO = 'liberado-v1'

/**
 * A demonstração já foi aberta neste navegador.
 *
 * Ausência de valor, valor de outra versão ou armazenamento bloqueado contam
 * como bloqueado — falhar para o lado da tela é preferível a entregar a visão
 * a quem não digitou nada.
 */
export function estaLiberado(bruto: string | null): boolean {
  return bruto === VALOR_DESTRAVADO
}

export function gravarLiberado(): string {
  return VALOR_DESTRAVADO
}

/* ------------------------------------------------------------------ */
/*  Copy da tela                                                       */
/* ------------------------------------------------------------------ */

/**
 * Tom de voz Senior: frase curta, voz ativa, sem jargão. O humor mora no
 * conteúdo, não no formato — sem exclamação empilhada, sem emoji de circo.
 */
export const TEXTO_BLOQUEIO = {
  rotulo: 'Acesso restrito',
  titulo: 'Ops! Esta porta está protegida',
  subtitulo: 'Digite a senha para entrar na demonstração e continuar explorando.',

  /** Dica que casa com o easter egg: quem conhece a fala do Hermínio entra na hora. */
  dica: 'A senha é a palavra que o Hermínio repete em toda apresentação.',
  alternativa: 'Se você já esteve numa reunião com ele, sabe de cor.',

  campo: 'Senha',
  placeholder: '.......',
  botao: 'Abrir a demonstração',
  botaoErro: 'Não foi essa. Tente de novo',

  /** Boas-vindas depois do acerto. */
  acertoRotulo: 'Senha correta',
  acertoTitulo: 'É isso. Pode entrar.',
  acertoTexto: 'A casa é sua. Os números são fictícios, mas o cuidado com eles não.',
  acertoBotao: 'Entrar',

  /** A marca 5 bi aparece como contexto, não como decoração. */
  metaRotulo: 'A caminho dos',
  metaValor: 'R$ 5 bi',
} as const
