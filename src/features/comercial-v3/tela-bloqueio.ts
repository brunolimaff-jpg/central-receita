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
  rotulo: 'Portaria digital',
  titulo: 'Identifique-se para entrar',
  subtitulo: 'Registro de acesso da demonstração comercial. A portaria confere a credencial e libera a catraca.',

  /**
   * A dica não nomeia ninguém. Nomear o diretor na tela explica a piada e
   * estraga o easter egg: quem é do time reconhece a fala sozinho, e quem não
   * é continua sabendo que existe uma palavra solta no ar.
   */
  dica: 'Quem já sentou numa reunião de resultado conhece a credencial de cor.',
  alternativa: 'Sem crachá, sem catraca.',

  campo: 'Credencial',
  placeholder: '.......',
  botao: 'Registrar entrada',
  botaoErro: 'Credencial não confere. Tente de novo.',

  /** Boas-vindas depois do acerto. */
  acertoRotulo: 'Acesso liberado',
  acertoTitulo: 'Bem-vindo à Portaria',
  acertoTexto: 'Entrada registrada às {hora}. A catraca está liberada.',
  acertoBotao: 'Passar pela catraca',

  /** Régua da portaria: números reais do produto, não inventados. */
  registros: [
    { valor: '+300 mi', rotulo: 'acessos gerenciados' },
    { valor: '+2.100', rotulo: 'portarias' },
    { valor: '+1.800', rotulo: 'clientes ativos' },
  ],
} as const
