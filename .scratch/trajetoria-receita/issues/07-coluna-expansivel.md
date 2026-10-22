# 07 — Coluna de navegação expansível

Status: pronto-pra-agente
Bloqueia: 08
Bloqueado por: —

## Objetivo

Hoje a coluna lateral colapsa sozinha abaixo de 1180px e **esconde o texto para
sempre**: ficam oito ícones sem rótulo e nenhum caminho de volta. Dar ao usuário
o controle, e um rótulo que apareça quando estiver recolhida.

## O que construir

### Estado

`src/features/comercial-v3/nav-collapse.ts` — módulo puro, sem DOM:

```ts
export type NavCollapse = 'expandida' | 'recolhida'

/** Valor inicial da primeira visita, derivado da largura. */
export function collapseInicial(largura: number): NavCollapse

/** Lê a preferência gravada; valor inválido ou ausente cai no inicial. */
export function lerPreferencia(bruto: string | null, largura: number): NavCollapse

/** Serializa para gravação. */
export function gravarPreferencia(estado: NavCollapse): string
```

Chave de armazenamento: `central-receita:navegacao`. Valor `'expandida'` ou
`'recolhida'` — qualquer outra coisa é tratada como ausente.

### Comportamento

- O breakpoint de 1180px **deixa de ser regra permanente** e vira apenas o valor
  inicial da primeira visita (recolhida abaixo de 1180, expandida acima).
- A escolha do usuário sempre vence o breakpoint, inclusive em tela estreita.
- Lida antes da primeira pintura relevante, para não haver salto de layout.
  Usar estado inicial derivado da preferência, não `useEffect` que corrige depois.
- Falha ao ler ou gravar (modo privado, cota) não impede o uso.

### Controle

`<button>` no rodapé da coluna, acima de Configurações:

- `aria-expanded={expandida}`
- `aria-controls` apontando para o `<nav>`
- Rótulo que nomeia a ação: "Recolher navegação" / "Expandir navegação"
- Ícone `PanelLeftClose` / `PanelLeftOpen` (lucide)
- Foco visível; alvo de 40×40 no mínimo

### Rótulo quando recolhida

Duas vias, não só `title`:

1. **Hover** — cartão de rótulo posicionado à direita do item, com 120ms de
   atraso (evita piscar ao passar por vários), fundo sólido, contraste AA.
2. **Foco de teclado** — o mesmo cartão aparece ao receber foco, sem atraso.

Implementar com CSS puro onde possível (`:hover`, `:focus-visible`) sobre um
`span` dentro do item, sem portal e sem dependência nova. Um `title` nativo
continua como fallback.

### Transição de largura

**Curva, não mola.** É mudança de valor entre dois pontos conhecidos, e mola
aqui produz oscilação visível na coluna.

```css
transition: grid-template-columns 220ms cubic-bezier(0.2, 0, 0, 1);
```

A coluna passa de 208px para 72px. `prefers-reduced-motion` remove a transição.

### CSS

`src/app/globals.css`:

- `.revenue-app` e `.revenue-app[data-nav='recolhida']` definem a largura.
- O `@media (max-width: 1180px)` perde o `grid-template-columns` fixo e passa a
  só ajustar padding e esconder rótulos quando `data-nav='recolhida'`.
- A regra que esconde `.revenue-nav-rotulo` e `.revenue-marca-texto`
  (`globals.css:757-760`) passa a depender do atributo, não do breakpoint.

### ⚠️ Abaixo de 780px o controle não existe

`globals.css:753-763` troca `.revenue-app` para `display: block` e prende a
sidebar como **barra inferior fixa** de 62px. Não há coluna nem largura nesse
modo.

**Regra:** o botão de expandir/recolher é **ocultado** abaixo de 780px. A barra
inferior mantém o comportamento atual (4 destinos + Configurações). Tentar
aplicar estado recolhida ali quebraria o layout.

### ⚠️ A transição corre em `grid-template-columns`

A sidebar é item de grid (`.revenue-app` define duas colunas). Animar `width` na
sidebar não funciona — o grid ignora. A transição vai no container:

```css
.revenue-app {
  transition: grid-template-columns 220ms cubic-bezier(0.2, 0, 0, 1);
}
```

Navegador que não suporte animar `grid-template-columns` cai na troca
instantânea. Degradação aceitável, não erro.

## Reaproveitar

- `src/features/comercial-v3/components/commercial-sidebar.tsx` — estrutura atual
- `src/features/comercial-v3/components/commercial-shell.tsx` — onde o estado sobe
- Tokens de raio e cor já em `globals.css`

## Testes — `tests/nav-collapse.test.mjs`

| Cenário | Esperado |
|---|---|
| `collapseInicial(1600)` | `'expandida'` |
| `collapseInicial(900)` | `'recolhida'` |
| preferência gravada `'expandida'` em tela de 900px | `'expandida'` — usuário vence |
| preferência `'xyz'` | cai no inicial por largura |
| preferência `null` | cai no inicial por largura |
| `gravarPreferencia` ida e volta | valor preservado |

## Critério de aceite

- Recolher e expandir funciona em qualquer largura, não só abaixo de 1180px.
- Recolhida, passar o mouse mostra o nome de cada destino.
- Tab mostra o mesmo nome, sem mouse.
- A escolha sobrevive a recarregar a página.
- Sem salto de layout ao abrir com preferência recolhida.
- Período, filial e solução não se alteram ao recolher.
