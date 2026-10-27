'use client'

import { motion } from 'framer-motion'
import { formatarRealCompacto } from '../format'
import { AQUISICOES, CSO, HORIZONTAIS_2027, iniciais, MRR_TOTAL, TERRITORIOS, VERTICAIS, type Pessoa, type Vertical } from '../org-2027'
import { InfoTip, PanelSection } from './executive-ui'
import { SPRING_SUAVE } from './motion-primitives'
import { ProductIcon } from './product-icon'

const pct = (razao: number) => `${Math.round(razao * 100)}%`
const grupos = (n: number) => n.toLocaleString('pt-BR')
/** Marcas do grupo com arquivo oficial no design system; as demais seguem por nome. */
const LOGO_MARCA: Record<string, string> = {
  Konviva: '/brand/marcas/konviva.png',
  Jobconvo: '/brand/marcas/jobconvo.png',
  Hypnobox: '/brand/marcas/hypnobox.png',
  GATEC: '/brand/marcas/gatec.png',
  Novasoft: '/brand/marcas/novasoft.png',
  Wiipo: '/brand/marcas/wiipo.png',
  'Senior Capital': '/brand/marcas/senior-capital.png',
}
const TOTAL_GRUPOS = VERTICAIS.reduce((soma, v) => soma + v.grupos, 0)

/** Avatar por iniciais na cor da vertical; vaga aberta vira contorno tracejado. */
function Avatar({ pessoa, cor, tamanho = 36 }: { pessoa: Pessoa; cor: string; tamanho?: number }) {
  const vaga = !pessoa.nome
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-bold"
      style={{
        width: tamanho, height: tamanho, fontSize: tamanho * 0.36,
        color: vaga ? cor : '#fff',
        background: vaga ? 'transparent' : `linear-gradient(140deg, color-mix(in srgb, ${cor} 70%, white), ${cor})`,
        border: vaga ? `1.5px dashed ${cor}` : '2px solid rgb(255 255 255 / 85%)',
        boxShadow: vaga ? 'none' : `0 6px 14px -6px ${cor}`,
      }}
    >
      {vaga ? '+' : iniciais(pessoa.nome)}
    </span>
  )
}

function LinhaPessoa({ pessoa, cor }: { pessoa: Pessoa; cor: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <Avatar pessoa={pessoa} cor={cor} tamanho={30} />
      <span className="min-w-0 leading-tight">
        <strong className={`block truncate text-[13px] font-semibold ${pessoa.nome ? 'text-ink-strong' : 'text-ink-muted'}`}>{pessoa.nome ?? 'Vaga aberta'}</strong>
        <small className="block truncate text-[11px] text-ink-muted">{pessoa.cargo.replace('Gerente de Vendas ', '')}{pessoa.escopo ? ` · ${pessoa.escopo}` : ''}</small>
      </span>
    </li>
  )
}

function ColunaVertical({ vertical, indice }: { vertical: Vertical; indice: number }) {
  const { cor } = vertical
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...SPRING_SUAVE, delay: indice * 0.07 }}
      className="vidro relative flex min-w-0 flex-col overflow-hidden rounded-[18px]"
    >
      <header className="relative overflow-hidden px-4 pb-4 pt-4 text-white" style={{ background: cor }}>
        {/*
          Fundo oficial do design system (malha com granulado, grupo Fundos),
          tingido com a cor da vertical; ícone branco do segmento em marca
          d'água e a malha de pontos como elemento de apoio.
        */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/brand/apoio/fundo-gradiente-verde-roxo.jpg)' }} />
        <span aria-hidden className="pointer-events-none absolute inset-0 mix-blend-color" style={{ background: cor }} />
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${cor} 35%, transparent), color-mix(in srgb, ${cor} 75%, black) 120%)` }} />
        <span aria-hidden className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 bg-contain bg-no-repeat opacity-25" style={{ backgroundImage: 'url(/brand/apoio/pontos-branco.png)' }} />
        {vertical.icone && (
          <motion.img
            aria-hidden
            alt=""
            src={`/brand/produtos/${vertical.icone}-branco.png`}
            className="pointer-events-none absolute -bottom-5 -right-3 h-28 w-auto"
            initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
            whileInView={{ opacity: 0.22, scale: 1, rotate: -6 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.15 + indice * 0.07 }}
          />
        )}
        <div className="relative flex min-h-9 items-center justify-between gap-2">
          <h3 className="text-[16px] font-bold tracking-[-0.02em]">{vertical.nome}</h3>
          {vertical.icone && (
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/90 shadow-sm">
              <ProductIcon solucao={vertical.nome} tamanho={20} />
            </span>
          )}
        </div>
        <p className="num relative mt-3 text-[28px] font-bold leading-none tracking-[-0.03em]">{formatarRealCompacto(vertical.mrr)}</p>
        <p className="relative mt-1 text-[12px] text-white/85">MRR · {pct(vertical.participacao)} da base · {grupos(vertical.grupos)} grupos</p>
        <span aria-hidden className="relative mt-3 block h-1.5 overflow-hidden rounded-full bg-white/25">
          <motion.span className="block h-full rounded-full bg-white" initial={{ width: 0 }} whileInView={{ width: pct(vertical.participacao / 0.49) }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 90, damping: 22, delay: 0.2 + indice * 0.07 }} />
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3 rounded-[12px] bg-white/70 p-2.5 ring-1 ring-white">
          <Avatar pessoa={vertical.diretor} cor={cor} tamanho={42} />
          <span className="min-w-0 leading-tight">
            <small className="block text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: cor }}>Diretor de segmento</small>
            <strong className={`block truncate text-[14px] font-bold ${vertical.diretor.nome ? 'text-ink-strong' : 'text-ink-muted'}`}>{vertical.diretor.nome ?? 'Vaga nova'}</strong>
          </span>
        </div>
        <ul className="grid gap-2.5">
          {vertical.gerentes.map(pessoa => <LinhaPessoa key={`${pessoa.nome}-${pessoa.escopo}`} pessoa={pessoa} cor={cor} />)}
        </ul>
        <div className="mt-auto grid gap-2 border-t border-hairline pt-3 text-[11px] text-ink-muted">
          <span>{vertical.resumo}</span>
          <span className="flex min-h-[22px] flex-wrap gap-1.5">
            {vertical.chegando?.map(produto => (
              <span key={produto} className="rounded-full px-2 py-0.5 font-semibold" style={{ color: cor, background: `color-mix(in srgb, ${cor} 12%, transparent)` }}>Chega em 2027 · {produto}</span>
            ))}
          </span>
        </div>
      </div>
    </motion.article>
  )
}

/**
 * Diretorias 2027: quem responde por cada vertical, quanto de MRR ela carrega
 * e as horizontais de produto que atravessam todas. Leitura de liderança —
 * pessoas e base, não contas.
 */
export function DiretoriasSection() {
  return (
    <PanelSection
      id="diretorias"
      titulo="Diretorias 2027"
      contexto="Cobrimos o mercado por vertical e aprofundamos por horizontal."
      acao={<InfoTip texto="Modelo em construção, sujeito a revisões orçamentárias e discussões com o CE. MRR e grupos são a base declarada no planejamento." />}
    >
      {/* CSO e composição do MRR */}
      <div className="vidro grid items-center gap-5 rounded-[18px] p-5 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex items-center gap-4">
          <span className="relative">
            <span aria-hidden className="absolute -inset-1.5 rounded-full bg-[linear-gradient(167deg,#00AF9C,#12F7D1)] opacity-90" />
            <span className="relative block rounded-full bg-white p-0.5"><Avatar pessoa={CSO} cor="#0d4a55" tamanho={64} /></span>
          </span>
          <span className="leading-tight">
            <small className="block text-[11px] font-bold uppercase tracking-[0.1em] text-brand-escuro">CSO · Diretoria de Mercado</small>
            <strong className="block text-[20px] font-bold tracking-[-0.02em] text-ink-strong">{CSO.nome}</strong>
            <span className="text-[12px] text-ink-muted">Venda Direta · 4 verticais · 3 horizontais</span>
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[12px] font-semibold text-ink-muted">MRR da base</span>
            <span><strong className="num text-[26px] font-bold tracking-[-0.03em] text-ink-strong">{formatarRealCompacto(MRR_TOTAL)}</strong> <span className="text-[12px] text-ink-muted">· {grupos(TOTAL_GRUPOS)} grupos</span></span>
          </div>
          <div aria-label="MRR por vertical" className="mt-2 flex h-4 overflow-hidden rounded-full bg-surface-sunken">
            {VERTICAIS.map((v, i) => (
              <motion.span key={v.id} title={`${v.nome} ${pct(v.participacao)}`} className="h-full first:rounded-l-full last:rounded-r-full" style={{ background: v.cor }} initial={{ width: 0 }} whileInView={{ width: pct(v.mrr / MRR_TOTAL) }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: i * 0.08 }} />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted">
            {VERTICAIS.map(v => (
              <li key={v.id} className="inline-flex items-center gap-1.5"><i aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: v.cor }} />{v.nome} <strong className="num font-semibold text-ink-strong">{pct(v.participacao)}</strong></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Verticais */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {VERTICAIS.map((v, i) => <ColunaVertical key={v.id} vertical={v} indice={i} />)}
      </div>

      {/* Horizontais atravessam todas as verticais */}
      <div className="grid gap-2.5">
        {HORIZONTAIS_2027.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ ...SPRING_SUAVE, delay: i * 0.08 }}
            className="vidro relative grid items-center gap-3 overflow-hidden rounded-[14px] p-3 lg:grid-cols-[190px_minmax(0,1fr)_250px]"
          >
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgb(31_57_96/7%))]" />
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[11px] bg-[#1c3a63] shadow-md"><span className="grid h-7 w-7 place-items-center rounded-[8px] bg-white"><ProductIcon solucao={h.nome} tamanho={18} /></span></span>
              <span className="leading-tight">
                <small className="block text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">Horizontal</small>
                <strong className="block text-[15px] font-bold text-ink-strong">{h.nome}</strong>
                {h.id === 'erp' && <small className="block text-[11px] text-ink-muted">Vendedores de novos clientes</small>}
              </span>
            </div>
            <div className="grid min-w-0 gap-2">
              <ul className="flex flex-wrap gap-1.5">
                {h.produtos.map(p => (
                  <li key={p} className="inline-flex h-7 items-center rounded-full border border-hairline bg-white/85 px-2.5 text-[12px] font-semibold text-ink-strong">
                    {LOGO_MARCA[p] ? <img src={LOGO_MARCA[p]} alt={p} className="h-3.5 w-auto" /> : p}
                  </li>
                ))}
              </ul>
              <ul aria-label={`${h.nome} atua em todas as verticais`} className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {VERTICAIS.map(v => (
                  <li key={v.id} className="flex items-center gap-1.5 truncate rounded-[8px] px-2 py-1 text-[11px] font-semibold" style={{ color: `color-mix(in srgb, ${v.cor} 75%, black)`, background: `color-mix(in srgb, ${v.cor} 11%, white)` }}>
                    <i aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: v.cor }} />
                    <span className="truncate">{v.nome}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2.5 lg:border-l lg:border-hairline lg:pl-4">
              <Avatar pessoa={h.lider} cor="#1c3a63" tamanho={34} />
              <span className="leading-tight">
                <strong className={`block text-[13px] font-semibold ${h.lider.nome ? 'text-ink-strong' : 'text-ink-muted'}`}>{h.lider.nome ?? 'Vaga nova'}</strong>
                <small className="block text-[11px] text-ink-muted">{h.lider.cargo}{h.lider.escopo ? ` · ${h.lider.escopo}` : ''}</small>
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Territórios */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TERRITORIOS.map((t, i) => (
          <motion.article
            key={t.numero}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ ...SPRING_SUAVE, delay: i * 0.06 }}
            className="vidro revenue-glow rounded-[16px] p-4"
            style={{ ['--tom' as string]: t.cor }}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full text-[17px] font-bold text-white" style={{ background: t.cor, boxShadow: `0 8px 18px -8px ${t.cor}` }}>{t.numero}</span>
              <span className="min-w-0 leading-tight">
                <strong className="block text-[14px] font-bold text-ink-strong">{t.nome}{t.estimado && <span className="ml-1.5 rounded-full bg-surface-sunken px-1.5 py-0.5 align-middle text-[10px] font-semibold text-ink-muted">estimado</span>}</strong>
                <small className="block truncate text-[12px]" style={{ color: t.cor }}>{t.ufs}</small>
              </span>
            </div>
            <div className="mt-3">
              <strong className="num block whitespace-nowrap text-[24px] font-bold leading-none tracking-[-0.03em] text-ink-strong">{formatarRealCompacto(t.mrr)}</strong>
              <span className="mt-1 block text-[12px] text-ink-muted">{grupos(t.grupos)} grupos · {pct(t.mrr / MRR_TOTAL)} do MRR</span>
            </div>
            <ul className="mt-3 grid gap-1.5">
              {VERTICAIS.map(v => {
                const item = t.porVertical[v.id]
                return (
                  <li key={v.id} className="grid grid-cols-[8.2rem_minmax(0,1fr)_2.8rem] items-center gap-2 text-[12px]">
                    <span className="truncate text-ink-muted">{v.nome}</span>
                    <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                      <motion.span className="block h-full rounded-full" style={{ background: v.cor }} initial={{ width: 0 }} whileInView={{ width: pct(item.mrr / t.mrr) }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 90, damping: 22 }} />
                    </span>
                    <span className="num text-right font-semibold text-ink-strong">{pct(item.mrr / t.mrr)}</span>
                  </li>
                )
              })}
            </ul>
          </motion.article>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="font-semibold text-ink-muted">Aquisições no modelo</span>
        {AQUISICOES.contempla.map(n => (
          <span key={n} className="inline-flex h-9 items-center rounded-[10px] border border-white bg-white/85 px-2.5 shadow-sm">
            {LOGO_MARCA[n] ? <img src={LOGO_MARCA[n]} alt={n} className="h-5 w-auto" /> : <span className="font-semibold text-ink-strong">{n}</span>}
          </span>
        ))}
        <span className="ml-2 font-semibold text-ink-muted">Fora do modelo</span>
        {AQUISICOES.naoContempla.map(n => (
          <span key={n} className="inline-flex h-9 items-center rounded-[10px] bg-surface-sunken px-2.5 opacity-60 grayscale">
            {LOGO_MARCA[n] ? <img src={LOGO_MARCA[n]} alt={n} className="h-5 w-auto" /> : <span className="text-ink-muted">{n}</span>}
          </span>
        ))}
      </div>
    </PanelSection>
  )
}
