import Link from 'next/link'
import { ArrowRight, CircleAlert, Info, TrendingDown, Users } from 'lucide-react'
import { ViewToolbar } from '../components/view-toolbar'
import { formatarRealCompacto } from '../format'
import { VOLTAR_POR_ORIGEM, VIEW_LABELS } from '../copy'
import { iniciais } from '../org-2027'
import type { CommercialNav } from '../nav'
import { ALL_FILTERS, type CommercialView } from '../types'
import type { Carteira, CarteiraNo } from '../carteira-model'
import { coberturaDoNivel, ordenarPorGap } from '../carteira-model'
import { ROTULO_ESTADO } from '../carteira-fila'
import { lenteTerritorios } from '../carteira-territorio'
import { trilha as trilhaDoNo, type Arvore } from '../carteira-arvore'

/**
 * Carteira por nível da estrutura.
 *
 * A pergunta que esta tela responde, em cinco segundos: "esta pessoa cobre o
 * mês, e qual subordinado não cobre?". Por isso o cabeçalho é a **pessoa**,
 * não o número, e os filhos são ordenados por gap — a ordem é a própria
 * resposta.
 *
 * Regras herdadas do modelo e que a tela não pode quebrar:
 * - Nulo aparece como "—" com motivo, nunca como R$ 0.
 * - Sem meta por pessoa, o número grande é **previsto**, não atingimento.
 *   Inventar denominador seria pior que não mostrar.
 * - O resíduo é linha de primeira classe e clicável: é ele que prova que a
 *   cascata está vendo tudo, e é ele que dirige o trabalho do de-para.
 */

type Props = {
  carteira: Carteira | null
  arvore: Arvore
  idNo: string
  referenceDate: string
  from?: CommercialView
  nav: CommercialNav
  /** Recorte de filial ativo, se houver — a tela precisa dizer que ele existe. */
  branch: string
  solucao: string
}

const CARGO_CURTO: Record<string, string> = {
  cso: 'CSO',
  diretor: 'Diretor de segmento',
  gerente: 'Gerente de vendas',
  lider: 'Líder de vendas',
  especialista: 'Especialista',
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`revenue-panel vidro min-w-0 p-4 ${className}`}>{children}</section>
}

/** Número da régua. Sempre com o rótulo — nenhum número solto na tela. */
function Numero({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7b8ba1]">{rotulo}</p>
      <p className="num mt-1 text-[19px] font-bold tabular-nums text-[#0d2340]">{valor}</p>
      {nota && <p className="mt-0.5 text-[11px] leading-tight text-ink-muted">{nota}</p>}
    </div>
  )
}

export function CarteiraScreen({ carteira, arvore, idNo, referenceDate, from, nav, branch, solucao }: Props) {
  const voltar = { label: VOLTAR_POR_ORIGEM[from ?? 'home'], href: nav.href(from ?? 'home') }

  const caminho = trilhaDoNo(arvore, idNo)
  const trilha = caminho.map((no, indice) => ({
    label: no.nome ?? 'Vaga aberta',
    href: indice < caminho.length - 1 ? nav.carteiraHref(no.id) : undefined,
  }))

  if (!carteira) {
    return (
      <div className="grid gap-3">
        <ViewToolbar trilha={trilha} voltar={voltar} />
        <Card className="grid gap-3">
          <p className="text-[15px] font-bold text-ink-strong">Nó não encontrado na estrutura.</p>
          <p className="text-[13px] text-ink-muted">
            O identificador da URL não corresponde a nenhuma pessoa do organograma. A carteira abre na raiz.
          </p>
          <Link href={nav.carteiraHref()} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-[10px] bg-brand-escuro px-4 text-[13px] font-semibold text-white transition-premium hover:bg-verde-escuro">
            Abrir a carteira do CSO
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    )
  }

  const { raiz } = carteira
  const nome = raiz.no.nome ?? 'Vaga aberta'
  const cobertura = coberturaDoNivel(raiz.filhos)
  const filhos = ordenarPorGap(raiz.filhos.filter(f => f.no.nome !== null))
  const vagas = raiz.filhos.filter(f => f.no.nome === null)
  const temResiduo = raiz.residuo.quantidade > 0
  const recorte = [branch !== ALL_FILTERS ? `filial: ${branch}` : '', solucao !== ALL_FILTERS ? `solução: ${solucao}` : ''].filter(Boolean)

  return (
    <div className="grid gap-3">
      <ViewToolbar trilha={trilha} voltar={voltar} />

      {/* Quem é esta carteira. O título é a pessoa — é a diferença entre um
          painel de indicadores e a carteira de alguém. */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
              style={{ background: raiz.no.vertical ? 'linear-gradient(140deg, #00AF9C, #086B6B)' : 'linear-gradient(140deg, #33466C, #0d2340)' }}
            >
              {iniciais(raiz.no.nome)}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#086b6b]">{CARGO_CURTO[raiz.no.nivel] ?? raiz.no.cargo}</p>
              <h1 className="truncate text-[20px] font-bold leading-tight tracking-[-0.02em] text-[#0d2340]">{nome}</h1>
              {raiz.no.escopo && <p className="text-[12px] text-ink-muted">{raiz.no.escopo}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
            {recorte.length > 0 && (
              <span className="rounded-full bg-[#eef4f8] px-2.5 py-1 font-semibold text-[#33466c]">Recorte: {recorte.join(' · ')}</span>
            )}
            {referenceDate && <span className="rounded-full bg-[#eef4f8] px-2.5 py-1">Carga de {referenceDate.split('-').reverse().join('/')}</span>}
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-[#dfe8ef] pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Numero rotulo="Previsto do mês" valor={formatarRealCompacto(raiz.metricas.previsto)} nota="Proposta ou negociação, 75%+, na competência" />
          <Numero rotulo="Ganhos no CRM" valor={formatarRealCompacto(raiz.metricas.ganhos)} nota={raiz.metricas.ganhos === null ? 'Sem efetivação na competência' : 'Não é realizado de vendas'} />
          <Numero
            rotulo="Travadas"
            valor={raiz.metricas.travadasValor === null ? '—' : formatarRealCompacto(raiz.metricas.travadasValor)}
            nota={`${raiz.metricas.travadasQuantidade} ${raiz.metricas.travadasQuantidade === 1 ? 'oportunidade' : 'oportunidades'} sem previsão ou vencida`}
          />
          <Numero
            rotulo={raiz.filhos.length > 0 ? 'Cobrem o mês' : 'Carteira aberta'}
            valor={raiz.filhos.length > 0 ? `${cobertura.comValor} de ${cobertura.total}` : String(raiz.metricas.oportunidades)}
            nota={raiz.filhos.length > 0 ? 'Com previsto acima de zero' : `${raiz.metricas.contas} ${raiz.metricas.contas === 1 ? 'conta' : 'contas'}`}
          />
        </div>

        {!carteira.probabilidadeDisponivel && (
          <p className="mt-3 flex items-start gap-1.5 rounded-[10px] bg-[#fff8e6] px-3 py-2 text-[11.5px] leading-snug text-[#8a6100]">
            <Info aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />
            A exportação não trouxe a probabilidade, então o corte de 75% não foi aplicado. O previsto pode estar maior que o Book PEX.
          </p>
        )}
      </Card>

      {/* Subordinados: a pergunta "quem está atrasando" mora aqui. */}
      {filhos.length > 0 && (
        <section aria-labelledby="carteira-equipe" className="grid gap-2">
          <h2 id="carteira-equipe" className="flex items-center gap-1.5 px-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[#50647d]">
            <Users aria-hidden className="h-3.5 w-3.5" />
            Quem responde abaixo
          </h2>
          <div className="grid min-w-0 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {filhos.map(filho => (
              <CartaoFilho key={filho.no.id} filho={filho} nav={nav} />
            ))}
          </div>
        </section>
      )}

      {vagas.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold text-[#0d2340]">
              {vagas.length} {vagas.length === 1 ? 'posição em aberto' : 'posições em aberto'}
            </p>
            <p className="text-[12px] text-ink-muted">Sem dono, a carteira dessas cadeiras fica no resíduo até a contratação.</p>
          </div>
          <span className="text-[11px] text-ink-muted">{vagas.map(v => v.no.cargo).join(' · ')}</span>
        </Card>
      )}

      {/* Resíduo: linha de primeira classe. Reconcilia o total e dirige o
          trabalho do de-para — se é alto, a cascata ainda não vale. */}
      {temResiduo && (
        <Card className="border-l-[3px] border-l-[#ef8833]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#0d2340]">
                <CircleAlert aria-hidden className="h-4 w-4 text-[#b95e00]" />
                Não atribuído à estrutura
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">
                {raiz.residuo.semResponsavel > 0 && `${raiz.residuo.semResponsavel} sem responsável na carga`}
                {raiz.residuo.semResponsavel > 0 && raiz.residuo.naoMapeado > 0 && ' · '}
                {raiz.residuo.naoMapeado > 0 && `${raiz.residuo.naoMapeado} com nome fora do de-para`}
              </p>
              {raiz.residuo.grafias.length > 0 && (
                <p className="mt-1 truncate text-[11px] text-[#8ea0c5]" title={raiz.residuo.grafias.join(', ')}>
                  Grafias: {raiz.residuo.grafias.slice(0, 4).join(', ')}{raiz.residuo.grafias.length > 4 ? '…' : ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="num text-[17px] font-bold tabular-nums text-[#b95e00]">{formatarRealCompacto(raiz.residuo.valor)}</p>
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-ink-muted">{raiz.residuo.quantidade} registros</p>
            </div>
          </div>
        </Card>
      )}

      {/*
        Fila de pedidos. Bloco separado por regra: a fila é dependência, não
        acréscimo — nunca soma ao previsto nem aos ganhos. Quando não há pedido
        atribuído, o bloco não aparece, para não sugerir zero onde não houve
        medição.
      */}
      {raiz.fila.pedidos > 0 && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#50647d]">Fila de pedidos</h2>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">Pendência de conferência. Não soma ao previsto nem aos ganhos.</p>
            </div>
            <div className="text-right">
              <p className="num text-[17px] font-bold tabular-nums text-[#0d2340]">{raiz.fila.pedidos}</p>
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-ink-muted">{raiz.fila.pedidos === 1 ? 'pedido' : 'pedidos'}</p>
            </div>
          </div>
          <ul className="mt-3 grid gap-1.5">
            {raiz.fila.estados.map(estado => (
              <li key={estado.estado} className="flex items-center justify-between gap-2 border-t border-[#eef2f6] pt-1.5 text-[12px]">
                <span className="text-[#33466c]">{ROTULO_ESTADO[estado.estado] ?? estado.estado}</span>
                <span className="flex items-center gap-3">
                  <span className="text-ink-muted">{estado.pedidos} {estado.pedidos === 1 ? 'pedido' : 'pedidos'}</span>
                  <span className="num w-20 text-right font-semibold tabular-nums text-[#0d2340]">{formatarRealCompacto(estado.valor)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-[#62748b]">{raiz.fila.nota}</p>
        </Card>
      )}

      {/* Evidência: o que sustenta o número do nó. */}
      {raiz.evidencias.length > 0 && (
        <Card className="overflow-hidden">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#50647d]">Maiores previstas desta cadeira</h2>
          <ul className="mt-2 divide-y divide-[#eef2f6]">
            {raiz.evidencias.map(registro => (
              <li key={`${registro.opportunityId}-${registro.row}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#0d2340]">{registro.account}</span>
                <span className="text-[11px] text-ink-muted">{registro.stage}</span>
                <span className="num w-24 text-right text-[12.5px] font-semibold tabular-nums text-[#0d2340]">{formatarRealCompacto(registro.predictedValue)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {filhos.length === 0 && raiz.metricas.oportunidades === 0 && !temResiduo && (
        <Card className="grid gap-2">
          <p className="text-[15px] font-bold text-ink-strong">Nenhuma oportunidade atribuída a esta cadeira.</p>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            Ou a carga não trouxe oportunidades com responsável desta cadeira, ou o recorte de filial e solução está estreito demais. A cadeira existe na estrutura; o número é que ainda não chegou.
          </p>
        </Card>
      )}

      <LenteTerritorio />

      <p className="px-1 text-[11px] leading-relaxed text-[#62748b]">
        Previsto é o Book PEX do mês. Ganhos no CRM não é realizado de vendas. A fila de pedidos não soma a nenhum dos dois.
        {' '}A meta por pessoa ainda não está na carga, por isso esta tela mostra previsto, não atingimento.
      </p>
    </div>
  )
}

/** Cartão de subordinado: quem, quanto, estado. Só isso. */
function CartaoFilho({ filho, nav }: { filho: { no: CarteiraNo['no']; metricas: CarteiraNo['metricas'] }; nav: CommercialNav }) {
  const nome = filho.no.nome ?? 'Vaga aberta'
  const temFilhos = filho.no.nivel !== 'lider'
  const zero = filho.metricas.previsto === 0

  return (
    <Link
      href={nav.carteiraHref(filho.no.id)}
      className="revenue-panel vidro group flex min-w-0 flex-col gap-2 p-3.5 transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b]"
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e6f4f1] text-[11px] font-bold text-[#086b6b]">
          {iniciais(filho.no.nome)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#0d2340]">{nome}</p>
          <p className="truncate text-[10.5px] text-ink-muted">{filho.no.escopo ?? CARGO_CURTO[filho.no.nivel] ?? filho.no.cargo}</p>
        </div>
        <ArrowRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#b0bccb] transition-transform group-hover:translate-x-0.5 group-hover:text-[#086b6b]" />
      </div>

      <div className="flex items-end justify-between gap-2 border-t border-[#eef2f6] pt-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7b8ba1]">Previsto</p>
          <p className={`num text-[16px] font-bold tabular-nums ${zero ? 'text-[#8ea0c5]' : 'text-[#0d2340]'}`}>
            {formatarRealCompacto(filho.metricas.previsto)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7b8ba1]">Travadas</p>
          <p className={`num text-[13px] font-semibold tabular-nums ${filho.metricas.travadasQuantidade > 0 ? 'text-[#b95e00]' : 'text-[#8ea0c5]'}`}>
            {filho.metricas.travadasQuantidade === 0 ? '—' : `${filho.metricas.travadasQuantidade}`}
            {filho.metricas.travadasQuantidade > 0 && <span className="ml-1 text-[10px] font-normal">{formatarRealCompacto(filho.metricas.travadasValor)}</span>}
          </p>
        </div>
      </div>

      {zero && (
        <p className="flex items-center gap-1 text-[10.5px] text-[#8a6100]">
          <TrendingDown aria-hidden className="h-3 w-3" />
          Sem previsto no mês
        </p>
      )}
      {temFilhos && <span className="sr-only">Abrir a carteira de {nome} e ver quem responde abaixo</span>}
    </Link>
  )
}


/**
 * Lente de território.
 *
 * O território é recorte geográfico, não degrau da cascata — e a carga não tem
 * UF, então nada dela pode ser atribuído a um território. O que a lente mostra
 * é a base **declarada** no organograma de 2027, com a ressalva à vista e a
 * diferença da matriz calculada, não escondida.
 */
function LenteTerritorio() {
  const lente = lenteTerritorios()
  const { reconciliacao } = lente

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#50647d]">Territórios</h2>
          <p className="mt-0.5 max-w-[540px] text-[11px] leading-snug text-ink-muted">{lente.aviso}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#fff8e6] px-2.5 py-1 text-[10.5px] font-semibold text-[#8a6100]">
          Declarado, não medido
        </span>
      </div>

      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
        {lente.territorios.map(territorio => (
          <li key={territorio.numero} className="flex items-center justify-between gap-2 rounded-[9px] border border-[#eef2f6] px-2.5 py-2">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: territorio.cor }} />
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-semibold text-[#0d2340]">{territorio.nome}</span>
                <span className="block truncate text-[10px] text-ink-muted">{territorio.ufs}</span>
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="num block text-[12.5px] font-bold tabular-nums text-[#0d2340]">
                {territorio.temBasePropria ? formatarRealCompacto(territorio.mrr) : 'Sem base própria'}
              </span>
              {territorio.temBasePropria && territorio.diferencaDaMatriz !== 0 && (
                <span className="block text-[10px] text-[#8a6100]">linha fecha {territorio.diferencaDaMatriz > 0 ? '+' : '−'}{formatarRealCompacto(Math.abs(territorio.diferencaDaMatriz))}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-[#eef2f6] pt-2 text-[11px] leading-snug text-[#62748b]">
        <p>
          Total declarado {formatarRealCompacto(reconciliacao.totalDeclarado)} · a abertura por vertical soma{' '}
          {formatarRealCompacto(reconciliacao.somaDaMatriz)} — diferença de{' '}
          <strong className="text-[#8a6100]">{formatarRealCompacto(Math.abs(reconciliacao.diferencaDaMatriz))}</strong>, mantida à vista e não redistribuída.
        </p>
      </div>
    </Card>
  )
}
