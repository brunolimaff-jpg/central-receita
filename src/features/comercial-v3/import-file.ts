/**
 * Regras puras do campo de arquivo da importação.
 *
 * A leitura de fato fica em `manual-import-client.ts`; aqui só decidimos o que
 * a área de arrastar e soltar aceita e como o arquivo escolhido é descrito.
 * Manter fora do componente permite testar sem navegador.
 *
 * O contrato é o mesmo de `readImportFile`: extensão CSV ou XLSX, arquivo
 * não vazio e até 15 MB. Divergir aqui faria a tela recusar o que o leitor
 * aceita — ou o contrário.
 */

/** Mesmo teto de `readImportFile`: 15 MB. */
export const LIMITE_ARQUIVO_BYTES = 15 * 1024 * 1024

export type ArquivoSoltado = { name: string; size: number }

export type AvaliacaoArquivo = { aceito: true } | { aceito: false; mensagem: string }

/** Extensão em minúsculas, sem o ponto; vazia quando o nome não tem extensão. */
export function extensaoArquivo(nome: string | null | undefined): string {
  if (typeof nome !== 'string') return ''
  const ponto = nome.lastIndexOf('.')
  return ponto > 0 ? nome.slice(ponto + 1).toLowerCase() : ''
}

/**
 * CSV ou XLSX, sem diferenciar maiúsculas. Usa a mesma expressão do leitor
 * vigente (`/\.csv$/i`, `/\.xlsx$/i`) para a tela não recusar um arquivo que
 * `readImportFile` aceitaria.
 */
export function extensaoAceita(nome: string | null | undefined): boolean {
  return typeof nome === 'string' && (/\.csv$/i.test(nome) || /\.xlsx$/i.test(nome))
}

/**
 * Tamanho legível em KB/MB, com vírgula decimal. Abaixo de 1 KB continua em KB
 * para não introduzir uma unidade que a tela nunca usa.
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Tamanho indisponível'
  const kb = bytes / 1024
  if (kb < 1024) return `${formatarNumero(kb)} KB`
  return `${formatarNumero(kb / 1024)} MB`
}

function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: valor < 10 ? 1 : 0, maximumFractionDigits: 1 })
}

/**
 * Mensagem para um arquivo recusado ao soltar. Explica o que aconteceu e o que
 * fazer, sem culpar quem arrastou.
 */
export function mensagemArquivoRecusado(nome: string): string {
  const extensao = extensaoArquivo(nome)
  const identificacao = extensao ? `Este arquivo (.${extensao})` : 'Este arquivo'
  return `${identificacao} não é um CSV nem um XLSX. Solte um CSV UTF-8 ou um XLSX exportado pelo CRM, ou clique para escolher outro.`
}

/**
 * Decide se o arquivo solto pode seguir para a leitura. Recusa extensão errada,
 * arquivo vazio e acima de 15 MB antes de abrir o leitor, para a pessoa ver o
 * motivo exato em vez do erro genérico.
 */
export function avaliarArquivoSoltado(arquivo: ArquivoSoltado | null | undefined): AvaliacaoArquivo {
  if (!arquivo) return { aceito: false, mensagem: 'Nenhum arquivo chegou pela soltura. Clique para escolher um CSV ou XLSX.' }
  if (!extensaoAceita(arquivo.name)) return { aceito: false, mensagem: mensagemArquivoRecusado(arquivo.name) }
  if (arquivo.size === 0) return { aceito: false, mensagem: 'Este arquivo está vazio. Exporte novamente pelo CRM e solte o novo arquivo.' }
  if (arquivo.size > LIMITE_ARQUIVO_BYTES) {
    return { aceito: false, mensagem: `Este arquivo tem ${formatarTamanhoArquivo(arquivo.size)} e passa do limite de 15 MB. Exporte um recorte menor do CRM e solte o novo arquivo.` }
  }
  return { aceito: true }
}
