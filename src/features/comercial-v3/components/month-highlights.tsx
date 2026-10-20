import { BLOCOS_HOME, DESTAQUES_COPY } from '../copy'
import { formatarComSinal, formatarMilhoes, formatarPercentualInteiro } from '../format'
import type { Movimentos, OrigemRealizado, SinalAtencao } from '../model'

/**
 * `Destaques do mês` (plano Task 5 Step 6, l.522-525).
 *
 * Toda frase sai do `HomeModel` filtrado: participação de New Names, saídas,
 * entradas e filiais em atenção. Nenhum número duplicado ou escrito à mão.
 */

type MonthHighlightsProps = {
  origem: OrigemRealizado
  movimentos: Movimentos
  atencao: SinalAtencao[]
}

export function MonthHighlights({ origem, movimentos, atencao }: MonthHighlightsProps) {
  const participacaoNewNames = origem.realizado > 0 ? origem.newNames / origem.realizado : 0
  const saidas = movimentos.byMovement.Saiu
  const entradas = movimentos.byMovement.Entrou

  const destaques = [
    {
      chave: 'new-names',
      icone: 'N',
      tom: 'bg-[#e8f7f3] text-[#009b83]',
      titulo: `New Names representa ${formatarPercentualInteiro(participacaoNewNames)} do realizado`,
      detalhe: `${formatarMilhoes(origem.newNames)} de ${formatarMilhoes(origem.realizado)} no mês.`,
    },
    {
      chave: 'saidas',
      icone: '−',
      tom: 'bg-[#fff0f2] text-[#ef4c64]',
      titulo: `${saidas.count} ${saidas.count === 1 ? 'oportunidade saiu' : 'oportunidades saíram'} do forecast oficial`,
      detalhe: `Impacto líquido de ${formatarComSinal(saidas.value)}.`,
    },
    {
      chave: 'entradas',
      icone: '+',
      tom: 'bg-[#eaf2ff] text-[#2f78ea]',
      titulo: `${entradas.count} ${entradas.count === 1 ? 'oportunidade entrou' : 'oportunidades entraram'} no forecast`,
      detalhe: `Contribuição de ${formatarComSinal(entradas.value)}.`,
    },
    {
      chave: 'atencao',
      icone: '!',
      tom: 'bg-[#fff7e8] text-[#d89426]',
      titulo: `${atencao.length} ${atencao.length === 1 ? 'filial pede' : 'filiais pedem'} atenção`,
      detalhe: `${DESTAQUES_COPY.atencaoDescricao}: ${atencao
        .map((sinal) => `${sinal.branch} (${formatarPercentualInteiro(sinal.cobertura)})`)
        .join(' · ')}.`,
    },
  ]

  return (
    <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <h2 className="mb-2 text-[15px] font-bold tracking-[-0.02em] text-[#0d2340]">
        {BLOCOS_HOME.destaques}
      </h2>

      <ul className="grid gap-2">
        {destaques.map((item) => (
          <li
            key={item.chave}
            className="grid grid-cols-[28px_1fr] items-start gap-2.5 rounded-[10px] border border-[#edf1f3] bg-[#fbfdfe] p-2.5"
          >
            <span
              aria-hidden
              className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-black ${item.tom}`}
            >
              {item.icone}
            </span>
            <span>
              <strong className="block text-[11px] leading-snug font-bold text-[#0d2340]">
                {item.titulo}
              </strong>
              <span className="num mt-0.5 block text-[11px] leading-snug text-[#6b7d91]">
                {item.detalhe}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
