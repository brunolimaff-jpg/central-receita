# Direção visual — Aurora Glass na Central de Receita

**Status:** em uso
**Última revisão:** 2026-10-19
**Base:** Senior Design System (Brand Center) adaptado ao painel executivo

O painel segue a identidade da Senior — verde predomina, laranja só para
conversão, azul-escuro para texto, Public Sans em tudo — com uma camada própria
que dá profundidade e leitura de dado. Este documento registra as decisões que
não estão no design system e que qualquer nova tela precisa repetir.

---

## 1. Fundo: fotografia como atmosfera, não como paisagem

**Arquivo:** `src/app/globals.css`, classes `.revenue-bg` e `.revenue-bg-faixa`.

O fundo tem duas camadas:

| Camada | O que é | Altura |
|---|---|---|
| `.revenue-bg` | Gradientes radiais esmeralda de baixa frequência | página inteira |
| `.revenue-bg-faixa` | Foto da sede desfocada em 30px, dissolvida por máscara | `clamp(180px, 24vh, 300px)` |

### Por que desfocar

A versão anterior punha a foto em tela cheia sob um véu de 93–96%. O véu
apagava a foto e, ainda assim, o ruído dela atravessava tabelas e números de
11px. Desfocar resolve os três problemas de uma vez:

1. o texto do cabeçalho fica sobre cor uniforme, não sobre grades e galhos;
2. **o vidro tem o que refratar** — é o contraste atrás dele que faz o blur
   existir, não a opacidade do painel;
3. o verde da fachada entra como tom da marca em vez de competir.

**Regra:** glassmorphism não pede fundo opaco, pede fundo com contraste. Foto
nítida atrás de vidro branco a 88% é só uma foto escondida.

### Enquadramento

`center 58%` com `cover`. A foto é 1600×900 e não tem letreiro "Senior" — o que
parece texto na fachada é o símbolo "S". Não buscar o letreiro: ele não existe.

---

## 2. Vidro escalonado: a coluna abre no topo

**Classe:** `.revenue-sidebar`.

A sidebar não é um bloco de vidro uniforme. O gradiente vai de 62% de branco no
topo a 95% na base:

```
0%    → rgb(255 255 255 / 62%)   ← marca sobre a foto
26%   → 66%
50%   → 80%
72%   → 91%
100%  → var(--vidro-forte)       ← navegação sobre superfície limpa
```

**Por que:** a marca respira sobre a fotografia; a navegação, onde o texto de
13px precisa de AA, assenta em superfície. Um gradiente em vez de uma divisa
dura — não há linha de corte visível.

`backdrop-filter: blur(2px)` apenas. Acima de 4px a foto desaparece e a
hierarquia se perde.

---

## 3. Estado ativo: ladrilho de ícone, nunca barra lateral

**Classe:** `.revenue-nav-item[aria-current] .revenue-nav-icon`.

```
inativo  → ícone azul-escuro, sem fundo
hover    → ícone verde-escuro, fundo verde 9%
ativo    → ícone branco sobre verde-institucional, sombra inferior suave
           texto em peso 600
```

### O que foi removido e por quê

A versão anterior usava `box-shadow: inset 3px 0 0 var(--verde-institucional)`
— uma barra verde de 3px à esquerda. **Não usar.** É o carimbo visual de
dashboard gerado: aparece em qualquer template, não diz nada sobre a Central e
desaparece quando a navegação colapsa para ícones.

O ladrilho usa o mesmo raio (8px) e a mesma linguagem dos cartões. Forma e cor,
dois canais para o mesmo sinal, nenhuma barra.

---

## 4. Ícones oficiais de produto

**Arquivo:** `src/features/comercial-v3/components/product-icon.tsx`
**Assets:** `public/brand/produtos/`

Nove ícones copiados sem redesenho de `Senior Design System/assets/Segmentos e
produtos`. O de **Serviços** não existe em PNG: foi extraído do SVG
`Brandcenter_Assets/03_Icones_Segmento/icone-servicos.svg` (o bitmap embutido
tem três painéis; o do meio é o ícone branco puro, recolorido para
#009B83).

### Regras

- Sempre acompanhado do nome do produto. Nunca sozinho.
- Mínimo 24px de altura; não ampliar além do tamanho do arquivo.
- Quando a solução da carga não casa com nenhum produto, **não inventar
  ícone** — mostra só o texto.
- Casamento por texto, com aliases (`src/features/comercial-v3/components/product-icon.tsx`,
  constante `ALIASES`), porque a planilha traz nomes livres.

Onde aparece hoje: filtro de solução do cabeçalho e coluna Solução da tabela
de oportunidades.

---

## 5. Contraste: medido, não estimado

Toda cor de texto é validada por cálculo no navegador, não por impressão visual.
Duas correções que saíram dessa medição:

| Token | Valor | Antes | Depois |
|---|---|---|---|
| `--ink-muted` | `#6b6763` | 4,46:1 ✗ | 5,31:1 ✓ |
| `--revenue-metric-note` | `color-mix(68% tom, 32% cinza-900)` | 3,66:1 ✗ | 5,21:1 ✓ |

**Regra:** `verde-institucional` (#00968C) em texto só passa AA em corpo ≥24px
ou negrito ≥19px (3,66:1). Para texto de 12px, escurecer com
`color-mix(in srgb, var(--tom) 68%, var(--cinza-900))`.

`verde-medio` (#00AF9B) nunca em texto sobre branco — 2,76:1, reprovado em
qualquer tamanho.

---

## 6. Movimento: mola, uma orquestração

**Arquivo:** `src/features/comercial-v3/components/motion-primitives.tsx`

```ts
SPRING = { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 }
```

### Regras

- **Uma orquestração por seção**, não `whileInView` em cada cartão. FadeUp no
  bloco, Stagger na grade, fim.
- **Nunca tween seco** em dado. A mola dá o peso que um número de receita pede.
- **Número não conta de zero.** A primitiva `AnimatedNumber` existe mas está
  reservada: contar de 0 até o valor sugere uma evolução que não foi medida. Só
  usar quando houver valor anterior comparável e conhecido (troca de carga).
- **Barra proporcional** cresce uma vez ao entrar na tela (`BarraAnimada`), e a
  largura final é o dado — a animação só mostra de onde vem.
- `MotionConfig reducedMotion="user"` no topo da árvore. Com a preferência
  ligada, nada se desloca.

---

## 7. Tipografia e escala

Public Sans servida localmente em 4 pesos (`src/app/layout.tsx`).

Escala em uso no painel: 11 / 12 / 13 / 15 / 18 / 20 / 22 / 24 / 26 / 32.

| Papel | Tamanho | Peso |
|---|---|---|
| Saudação (h1) | 32 | 700 |
| Título de seção (h2) | 22 | 700 |
| Título de painel (h2) | 15 | 700 |
| Valor de cartão | 24 | 700 |
| Rótulo de cartão | 12,5 | 500 |
| Corpo e apoio | 12–13 | 400 |
| Nota de cartão | 12 | 700 |

Raios em uso, por hierarquia: **10px** painel e cartão, **8px** controle e
navegação, **6px** elemento interno, **999px** pílula.

---

## 8. Checklist para uma tela nova

- [ ] O fundo é aurora + faixa, não foto em tela cheia
- [ ] Nenhum `inset 3px 0 0` de barra verde em item de navegação
- [ ] Ícone de produto sempre com o nome ao lado
- [ ] Contraste de todo texto medido, não estimado
- [ ] Uma orquestração de movimento por seção
- [ ] Raio 10 / 8 / 6 / 999 apenas
- [ ] Public Sans, no máximo 3 pesos por tela
- [ ] `prefers-reduced-motion` e `prefers-reduced-transparency` conferidos
