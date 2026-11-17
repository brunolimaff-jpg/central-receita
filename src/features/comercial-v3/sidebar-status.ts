/**
 * Rótulo do estado da carga na lateral.
 *
 * Diz em texto o mesmo fato que a Home mostra no corpo: “Dados carregados” só
 * existe quando há carga confirmada; consulta em andamento e falha têm rótulo
 * próprio; sem carga é demonstração. Antes, o rótulo seguia a aba aberta e
 * anunciava “Dados carregados” mesmo sem carga ou quando a consulta falhava.
 */
import type { EstadoHome } from './central-vendas-mrr'

export type RotuloLateral = { titulo: string; detalhe: string }

/** `cargaEm` já vem formatada (`dd/mm/aaaa`) ou nula. */
export function rotuloDaLateral(estado: EstadoHome, cargaEm: string | null, compartilhada: boolean): RotuloLateral {
  if (estado === 'com-carga') {
    return {
      titulo: 'Dados carregados',
      detalhe: cargaEm ? `Carga de ${cargaEm}` : compartilhada ? 'Carga compartilhada' : 'Prévia local · importação',
    }
  }
  if (estado === 'carregando') return { titulo: 'Carregando dados', detalhe: 'Consultando a carga' }
  if (estado === 'erro') return { titulo: 'Falha na carga', detalhe: 'A carga não pôde ser consultada' }
  return { titulo: 'Demonstração', detalhe: 'Cenário demonstrativo · set/2026' }
}
