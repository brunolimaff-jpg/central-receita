'use client'

import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  Command as CommandIcon,
  FileSearch,
  ListFilter,
  MessageSquareText,
  Radar,
  Bookmark,
  Users,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command'
import type { FilaResposta } from './use-api'
import type { AtualizarContexto, ContextoGlobal, IrPara, Tela } from './navegacao'
import { pontuarBuscaComando } from '@/lib/domain/command-search'
import { podeAbrirAssistenteEmBalao } from '@/lib/domain/navigation'

const PAGINAS: Array<{ tela: Tela; rotulo: string; icone: typeof BarChart3 }> = [
  { tela: 'agora', rotulo: 'Briefing da diretoria', icone: BarChart3 },
  { tela: 'agente', rotulo: 'Pergunte à Receita', icone: MessageSquareText },
  { tela: 'visao', rotulo: 'Explorar · Pipeline', icone: BarChart3 },
  { tela: 'mudancas', rotulo: 'Explorar · Mudanças de Forecast', icone: BarChart3 },
  { tela: 'oportunidades', rotulo: 'Explorar · Oportunidades', icone: ListFilter },
  { tela: 'winloss', rotulo: 'Explorar · Win / Loss', icone: BarChart3 },
  { tela: 'radar', rotulo: 'Explorar · Sinais de atenção', icone: Radar },
  { tela: 'casos', rotulo: 'Explorar · Decisões', icone: ListFilter },
  { tela: 'visoes', rotulo: 'Visões recorrentes', icone: Bookmark },
  { tela: 'fontes', rotulo: 'Fontes & Regras', icone: FileSearch },
  { tela: 'validacoes', rotulo: 'Apoio · Validações', icone: FileSearch },
]

const ROTULOS_TELA: Record<Tela, string> = {
  agora: 'Briefing',
  agente: 'Pergunte à Receita',
  mudancas: 'Explorar · Forecast',
  visao: 'Explorar · Pipeline',
  oportunidades: 'Explorar · Oportunidades',
  winloss: 'Explorar · Win / Loss',
  radar: 'Explorar · Atenção',
  casos: 'Explorar · Decisões',
  fontes: 'Fontes & Regras',
  validacoes: 'Validações',
  detalhe: 'Oportunidade',
  visoes: 'Visões',
}

const CLASSIFICACOES = ['New Name / Novo Cliente', 'Base', 'Cross / Up Sell', 'C4L']

export function CommandPalette({
  aberto,
  aoMudar,
  tela,
  irPara,
  contexto,
  filiais,
  atualizarContexto,
  abrirPergunte,
  oportunidades,
}: {
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  tela: Tela
  irPara: IrPara
  contexto: ContextoGlobal
  filiais: string[]
  atualizarContexto: AtualizarContexto
  abrirPergunte: () => void
  oportunidades: FilaResposta | null
}) {
  const executar = (acao: () => void) => {
    acao()
    aoMudar(false)
  }

  const aplicarFiltro = (patch: Partial<ContextoGlobal>) =>
    executar(() => atualizarContexto(patch, patch.janelaForecast !== undefined ? 'mudancas' : 'oportunidades'))

  const contas = new Map<number, { nome: string; oportunidadeId: number }>()
  for (const oportunidade of oportunidades?.oportunidades ?? []) {
    if (!contas.has(oportunidade.conta_id)) {
      contas.set(oportunidade.conta_id, {
        nome: oportunidade.conta_fantasia,
        oportunidadeId: oportunidade.oportunidade_id,
      })
    }
  }

  return (
    <CommandDialog
      open={aberto}
      onOpenChange={aoMudar}
      title="Buscar e comandar"
      description="Navegue, encontre um registro ou aplique um filtro. Escape fecha esta janela."
      filter={pontuarBuscaComando}
      className="chrome-glass w-[min(94vw,720px)] rounded-2xl border-white/80 shadow-[0_28px_80px_rgb(20_45_40/18%)]"
      showCloseButton={false}
    >
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 text-[13px] text-muted-foreground">
        <CommandIcon className="size-4 text-[var(--senior-emerald-hover)]" aria-hidden />
        <span>Contexto atual: {ROTULOS_TELA[tela]}</span>
        <span className="ml-auto rounded-md border border-border bg-white/80 px-2 py-1 text-[11px]">Ctrl/Cmd + K</span>
      </div>
      <CommandInput placeholder="Buscar conta, oportunidade ou comando…" aria-label="Buscar no mock" />
      <CommandList className="max-h-[min(65vh,520px)] p-2">
        <CommandEmpty>Nenhum resultado neste mock.</CommandEmpty>

        <CommandGroup heading="Navegação">
          {PAGINAS.map(({ tela: destino, rotulo, icone: Icon }) => (
            <CommandItem key={destino} value={rotulo} onSelect={() => executar(() => irPara(destino))}>
              <Icon data-icon="inline-start" className="text-muted-foreground" aria-hidden />
              <span>{rotulo}</span>
              {destino === tela ? <span className="ml-auto text-[11px] text-[var(--senior-emerald-hover)]">Atual</span> : null}
            </CommandItem>
          ))}
          {podeAbrirAssistenteEmBalao(tela) ? (
            <CommandItem value="Abrir balão do assistente Pergunte à Receita" onSelect={() => executar(abrirPergunte)}>
              <MessageSquareText data-icon="inline-start" className="text-muted-foreground" aria-hidden />
              <span>Abrir assistente em balão</span>
              <CommandShortcut>Contextual</CommandShortcut>
            </CommandItem>
          ) : null}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Classificação do fixture">
          {CLASSIFICACOES.map((classificacao) => (
            <CommandItem
              key={classificacao}
              value={`Filtrar ${classificacao}`}
              onSelect={() => aplicarFiltro({ classificacao })}
            >
              <ListFilter data-icon="inline-start" className="text-muted-foreground" aria-hidden />
              <span>Filtrar {classificacao}</span>
              {contexto.classificacao === classificacao ? <CommandShortcut>Ativo</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        {filiais.length > 0 ? (
          <CommandGroup heading="Filial">
            {filiais.map((filial) => (
              <CommandItem key={filial} value={`Filtrar filial ${filial}`} onSelect={() => aplicarFiltro({ filial })}>
                <Users data-icon="inline-start" className="text-muted-foreground" aria-hidden />
                <span>Filtrar filial · {filial}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Janela da projeção móvel">
          {[30, 60, 90].map((dias) => (
            <CommandItem key={dias} value={`Mudar janela da projeção móvel próximos ${dias} dias`} onSelect={() => aplicarFiltro({ janelaForecast: dias as ContextoGlobal['janelaForecast'] })}>
              <CalendarDays data-icon="inline-start" className="text-muted-foreground" aria-hidden />
              <span>Próximos {dias} dias</span>
              {contexto.janelaForecast === dias ? <CommandShortcut>Ativo</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        {(oportunidades?.oportunidades.length ?? 0) > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Oportunidades">
              {(oportunidades?.oportunidades ?? []).map((oportunidade) => (
                <CommandItem
                  key={oportunidade.oportunidade_id}
                  value={`Abrir oportunidade ${oportunidade.oportunidade_id} ${oportunidade.nome} ${oportunidade.conta_fantasia}`}
                  onSelect={() => executar(() => irPara('detalhe', oportunidade.oportunidade_id, { de: 'oportunidades' }))}
                >
                  <CircleHelp data-icon="inline-start" className="text-muted-foreground" aria-hidden />
                  <span className="min-w-0 truncate">{oportunidade.nome}</span>
                  <span className="truncate text-muted-foreground">{oportunidade.conta_fantasia}</span>
                  <CommandShortcut>{oportunidade.oportunidade_id}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Contas">
              {[...contas.entries()].map(([contaId, conta]) => (
                <CommandItem
                  key={contaId}
                  value={`Abrir conta ${conta.nome} ${contaId}`}
                  onSelect={() => executar(() => atualizarContexto({ busca: conta.nome }, 'oportunidades'))}
                >
                  <Users data-icon="inline-start" className="text-muted-foreground" aria-hidden />
                  <span>{conta.nome}</span>
                  <CommandShortcut>Conta {contaId}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
      <div className="flex items-center justify-between border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span>Dados sintéticos · nenhuma ação é gravada</span>
        <span>↑ ↓ navegar · Enter abrir · Esc fechar</span>
      </div>
    </CommandDialog>
  )
}
