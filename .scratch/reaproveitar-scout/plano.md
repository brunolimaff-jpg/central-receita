# Plano — reaproveitar o Senior Scout 360 v0.4.0 na Central de Receita

Fonte: `Senior-Scout-360-v0.4.0-completo.zip` (extraído fora do repo, só leitura).
Critério de entrada: a peça precisa servir à leitura do diretor ou à carga da Fabi.
Copiamos padrão e código pequeno; não trazemos shadcn/Radix (48 componentes) nem dependência nova.

## O que já temos do Scout

- `SPRING`, `FadeUp`, `Stagger`, `StaggerItem`, `AnimatedNumber`, `MotionRoot` (em `motion-primitives.tsx`)
- Fundo aurora com 4 blobs em deriva 46–72s e grão anti-banding
- Vidro com sombra em camadas

## Achado ao comparar

`MotionRoot` existe mas **não está montado em lugar nenhum** (VERIFICADO: zero usos fora do arquivo).
Efeito: quem liga "reduzir movimento" no Windows continua vendo as animações do Framer.
O CSS já respeita a preferência; só a camada do Framer falta. Correção de uma linha no shell.

## Fase 1 — base de movimento (pequena, sem risco)

| Item | Origem no Scout | Onde entra |
|---|---|---|
| Montar `MotionRoot` no shell | `MotionConfig reducedMotion="user"` | `commercial-shell.tsx` |
| `SPRING_SUAVE` e `EASE_OUT` | tokens do `primitives.tsx` | `motion-primitives.tsx` (o ticket 05 já cita `SPRING_SUAVE`) |
| `SectionReveal` | revela seção ao rolar, uma vez | seções da Visão Executiva |
| `SpringCard` | levita 3px no hover, só se clicável | cartões de indicador com detalhe |
| `ScaleIn` | entrada de menu fora do Radix | `filter-select`, `metric-detail` |

Regras que adotamos junto (MOTION-SPEC §6): mola para entrada, 150/200ms para hover,
`once: true` ao rolar, cascata só em lista curta, dado comercial nunca pisca.

## Fase 2 — tela de importação (o maior ganho visível)

Hoje `CampoArquivo` é um rótulo tracejado sem arrastar e soltar.
Do `upload-card.tsx` do Scout trazemos:

1. **Arrastar e soltar de verdade** — `onDragOver`/`onDrop` na área, com teclado (Enter/Espaço).
2. **Três estados visuais** — parado (ícone flutuando 6px), arrastando (borda cônica girando, `@property --ang`), lendo (barra com brilho correndo, sem porcentagem falsa).
3. **Cartão do arquivo escolhido** — nome, tamanho, "Trocar arquivo" e a ação principal, no lugar do link "Descartar seleção".
4. **Chips das colunas exigidas** — no lugar da lista `<details>` fechada, como as "pistas aceitas" do Scout.
5. **Prévia pronta** — faixa verde "Pronto para conferir" com contagem de linhas.

Mantemos tudo o que a nossa tela já faz certo: data de referência obrigatória antes de liberar,
validação por coluna, conferência pedidos × oportunidades, aviso que exige confirmação.
O que **não** trazemos: a aba "colar pistas" e a "leitura inteligente" — não existem neste fluxo.

## Fase 3 — acabamentos de estado

| Item | Origem | Onde |
|---|---|---|
| `pulse-suave` (onda de 6px) | badge "processando" | rodapé da sidebar enquanto a carga é lida |
| `shimmer` | barra de progresso | leitura de XLSX grande |
| Filtro nunca vazio | regra do `BatchDetailCard` | filtros de solução/filial: se o recorte zera, volta para "Todas" com aviso |
| `DistBar` | barra segmentada | mix de origem e etapas, se substituir a barra atual sem perda |

## Fora do plano (avaliado e descartado)

- shadcn/Radix: pesaria o bundle e mudaria a convenção do repo; nossos 6 pacotes bastam.
- `AuroraBackground` como componente: já temos a mesma aurora em CSS.
- `cover-sheen`: brilho decorativo contínuo; a regra "uma assinatura por tela" já é a aurora.
- Score, dossiê, enriquecimento de CNPJ: domínio de prospecção, não de receita.

## Adendo de performance — o que vale para este repositório

O adendo audita um `src.7z` diferente deste repo (G0 do próprio adendo). Conferência:

| Achado | Situação aqui |
|---|---|
| PERF-01, 02, 05 (API, `src/lib/domain`, Prisma) | NÃO SE APLICA: `src/app/api`, `src/lib/domain` e `prisma` não existem. O backend é `backend/worker.js` (503 linhas, D1). |
| PERF-03 (lista inteira na tabela) | Parcial: a tabela renderiza `rows.map` sem limite. Só importa se a carga real passar de centenas de linhas — medir com a planilha da Fabi. |
| PERF-04 (todas as telas importadas, seletores sempre rodando) | Vale: 12 telas importadas de forma estática; 4 seletores em `useMemo` rodam em qualquer tela. Candidato real, após medir o bundle. |
| PERF-07 (blur em muitas superfícies) | Vale: 10 `backdrop-filter` no CSS. `prefers-reduced-transparency` já tratado. |
| PERF-08 (fonte e foto) | Foto da sede tem 403 KB e fica borrada a 30px — dá para servir bem menor sem perda visível. Medir LCP antes. |

Princípio que adotamos do adendo: medir antes, sem ganho inventado. Vira uma fase própria (G1 baseline) depois das fases visuais.

## Execução

Escrita do código delegada ao agente `verboo-deepseek` (DeepSeek 4.1 Flash) — DECISÃO DO USUÁRIO.
O agente-pai planeja, revisa o diff, roda as verificações e mescla.

## Ordem e verificação

1. Fase 1 inteira num commit (inclui a correção do `MotionRoot`).
2. Fase 2 com teste do arrastar-e-soltar e do teclado; screenshot dos três estados.
3. Fase 3 item a item.

Cada fase: typecheck, testes, build estático e captura em 1366/1440/1920 com
"reduzir movimento" ligado e desligado.
Começa depois que os tickets 04 e 05 da trajetória forem mesclados, para não disputar arquivo.
