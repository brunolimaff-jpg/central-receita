# Impeccable — auditoria técnica e crítica de UX

Data: 10/11/2026, America/Cuiaba. Alvo: base local Cloudflare, HEAD `f9fbff04a8a2903741521a37ebe0431c02c7ce55`, preview estático `127.0.0.1:3013`.

**Method: degraded (Assessment A subagent failed mid-run; partial findings received and used. Assessment B complete.)**

Ferramenta: Impeccable 4.8.2, engine Windows 0.1.21, já presente no cache npm. Sem `install`, sem hooks, sem `init`/`document`/`live`, sem overlay injetado, sem download novo. `DO_NOT_TRACK=1`. Nenhum arquivo de aplicação, config, dependência ou hook foi alterado.

**Escopo preservado por decisão do Bruno:** a Cloudflare publicada fica como está por enquanto. Esta revisão é local e não autoriza deploy.

## Placar

| # | Dimensão | Nota | Achado-chave |
|---|---|---|---|
| 1 | Acessibilidade | 2 | Contraste 2,35:1 e alvos de 20×20 px reprovados |
| 2 | Performance | 3 | LCP 2,64 s em lab sem throttling; 1,5 MB de JS |
| 3 | Tematização | 3 | Tokens Senior/Aurora usados; sem dark mode por decisão |
| 4 | Responsivo | 2 | Sem overflow, mas navegação mobile esconde 6 destinos |
| 5 | Integridade da implementação | 2 | Sistema coerente, mas rótulos contradizem os números |
| **Total** | | **12/20** | **Aceitável — trabalho significativo pendente** |

Heurísticas de Nielsen: **25/40** (Aceitável).

| # | Heurística | Nota | Achado |
|---|---|---|---|
| 1 | Status do sistema | 3 | Estados de carga/vazio/erro existem; conflito de rótulo atrapalha |
| 2 | Mundo real | 2 | Vocabulário de domínio bom; "Meta" nomeia valor que não é meta |
| 3 | Controle e liberdade | 3 | Voltar, limpar busca e trilha funcionam |
| 4 | Consistência | 2 | "Previsto" com duas grandezas; mês do seletor ≠ mês do título |
| 5 | Prevenção de erro | 3 | Validação de importação é forte |
| 6 | Reconhecer vs lembrar | 2 | Barra mobile esconde 6 destinos sem alternativa |
| 7 | Flexibilidade | 2 | Sem atalhos ou ações em lote |
| 8 | Minimalismo | 3 | Limpo, porém denso |
| 9 | Recuperação de erro | 3 | Mensagens claras e específicas |
| 10 | Ajuda | 2 | Tooltips existem, mas 20 px e fora da tela no mobile |

## Detector — resultado determinístico

- **Estático** (`detect src/`): exit 2 = achados. **2 warnings**, regra `side-tab`: [cso-screen.tsx:96](../../src/features/comercial-v3/regional/cso-screen.tsx#L96) e [regional-screen.tsx:96](../../src/features/comercial-v3/screens/regional-screen.tsx#L96). É borda lateral de 4 px em lista dentro de cartão. A Aurora proíbe barra lateral **na navegação**; aqui são listas explicativas. Achado estilístico real, sem violação literal comprovada.
- **Renderizado** (`detect http://127.0.0.1:3013/`): exit 2. **12 warnings + 2 advisories**, todos na **portaria**, nenhum nas telas internas. Inclui `low-contrast` (2,2:1 a 4,1:1), `tiny-text`, `gray-on-color`, `kicker-above-heading`, `dark-glow`, `ai-color-palette`.
- **Falsos positivos prováveis:** `ai-color-palette` e `dark-glow` batem no verde/neon Senior sobre fundo escuro — é marca e adaptação local, não componente oficial. `tiny-text` sozinho não invalida: 11 px está na escala Senior/Aurora.
- **Não dispensar contraste por marca:** os alertas de baixo contraste na portaria precisam de confirmação sobre imagem/transparência real. Não são medição WCAG definitiva.
- **Overlay deliberadamente não executado.** Sem live-server, sem agente automático com bypass de approvals.

## Lighthouse (snapshot mobile)

Acessibilidade **93**, Boas práticas **100**, SEO **100**. Duas auditorias falharam:

1. **`color-contrast`** — 2,35:1 em rótulos de marcas "fora do modelo" ([diretorias-section.tsx:327](../../src/features/comercial-v3/components/diretorias-section.tsx#L327) aplica `opacity-60` sobre `text-ink-muted`). Referência: 4,5:1.
2. **`target-size`** — botões de "Como é calculado" com **20×20 px** ([executive-ui.tsx:27](../../src/features/comercial-v3/components/executive-ui.tsx#L27)). Referência: 24×24 px.

## Problemas prioritários

### [P1] "Previsto" nomeia duas grandezas diferentes na mesma tela

`VERIFICADO` no fixture sintético: o cartão "Previsto para o mês" mostra **14.000** (ganhos + em aberto) e a curva "Previsto" mostra **7.500** (só o aberto). Mesmo rótulo, dois universos.

- Origem: cartão usa `resultado.projected` ([executive-page.tsx:215](../../src/features/comercial-v3/screens/executive-page.tsx#L215)); a curva usa `trajectory.previsto`, que soma só `forecast.predicted` ([trajectory-model.ts:178–179](../../src/features/comercial-v3/trajectory-model.ts#L178-L179)).
- **Por que importa:** o diretor lê dois números com o mesmo nome e não sabe qual é o compromisso do mês. É falha de confiança, não de estética.
- **Correção:** renomear a curva para "Em aberto" ou o cartão para "Previsto total", e alinhar a legenda. Não mudar cálculo sem decisão.

### [P1] O cartão "Previsto para o mês" exibe a nota "Meta de outubro"

`VERIFICADO` em [executive-page.tsx:215](../../src/features/comercial-v3/screens/executive-page.tsx#L215): a nota é `` `Meta de ${mesCurto}` ``, mas o valor é previsão, não meta. A meta não vem na planilha — o [plano:99](../PLANO-VISAO-EXECUTIVA.md#L99) manda mostrar "Meta indisponível".

- **Por que importa:** sugere comparação com meta que o dado não sustenta.
- **Correção:** trocar a nota para o que o número é, ou exibir a meta real quando existir.

### [P1] A rosca "Composição do previsto" contradiz o próprio centro

`VERIFICADO`: centro mostra **46%** = ganhos ÷ (ganhos + aberto). As fatias desenhadas incluem "Perdido no mês", somando **14.900**, não 14.000. O comentário em [charts.tsx:16](../../src/features/comercial-v3/components/charts.tsx#L16) promete "as fatias somam o total exibido no centro" — não somam.

- **Correção:** ou o denominador do centro inclui o perdido, ou o perdido sai da rosca. Uma das duas.

### [P1] Navegação mobile esconde seis destinos

`VERIFICADO` em 390 px: a barra inferior mostra **6 links** (Visão Executiva, Diretorias, Forecast, New Name, Oportunidades, Configurações). Carteira, Territórios, Jornada, Sistema, Contas e Cross existem no desktop e ficam `display: none` abaixo de 780 px ([globals.css:1550–1553](../../src/app/globals.css#L1550-L1553)).

- **Por que importa:** Territórios é a tela de leitura da liderança e não tem entrada no celular. Não há menu alternativo.
- **Correção:** agrupar em "Mais" ou liberar os preliminares na barra.

### [P2] Tooltip de ajuda fica fora da tela no mobile

`VERIFICADO` em 390 px: ao focar o botão, o tooltip tem `left: -51,6 px` e largura 224 px — começa fora da viewport. No toque, `opacity` permanece 0. O `peer-focus-visible` funciona no desktop (opacidade 1 após assentar).

- **Correção:** posicionar com `position: fixed` e clamp nas bordas, como já é feito em [metric-detail.tsx:26](../../src/features/comercial-v3/components/metric-detail.tsx#L26).

### [P2] Botões de ajuda aninhados dentro de links

`VERIFICADO`: 2 botões dentro de `<a>` na Home. Aninhamento inválido de interativos; leitor de tela e teclado recebem dois alvos no mesmo ponto.

## O que está funcionando

- **Identidade Senior preservada:** Public Sans carregada, tokens de cor, Aurora Glass com vidro e faixa. Nada aqui pede troca de direção visual.
- **`prefers-reduced-motion` respeitado:** com a preferência ligada, **zero animações** rodando e sem overflow em 390 px. Sem a preferência, seis animações contínuas (os blobs de deriva).
- **Foco visível:** Tab produz indicador; 69 controles visíveis sem outline ausente na verificação anterior.
- **Sem overflow horizontal** em 375, 390 e 1440 px nos estados amostrados.
- **Estados de carga, vazio e erro** existem e são distintos — não há fallback silencioso.

## Performance

`INFERÊNCIA` a partir de uma navegação local: LCP **2.644 ms**, CLS **0,01**, TTFB 21 ms, sem throttling de CPU/rede e com movimento reduzido. Pacote: **1,52 MB de JS** em 2,62 MB totais; maior chunk 354 KB.

- **NÃO VERIFICADO:** performance em produção, em rede real, com CPU móvel e sem reduced-motion. Não usar este número como SLA.
- Oportunidades apontadas pelo trace: cache de longo prazo, JS legado (44 KB) e imagens (40 KB). Nenhuma é bloqueante.

## Limitações desta revisão

- **Assessment A falhou no meio** (aba do navegador desapareceu duas vezes). Aproveitei os achados parciais: navegação mobile, mês divergente em Territórios, conflito de "Previsto", rosca com perdido. O restante do julgamento visual é meu, com as capturas de 390 e 1440 px.
- **Assessment B completo**, sem exit 1.
- Sem leitor de tela, sem dispositivo físico, sem percurso integral de Tab.
- Não abri imagens de pessoas nem valores de planejamento; os números citados vêm do fixture sintético.
- Sem build/testes de produto nesta rodada além dos 43 testes de contrato executados (todos PASS).

## Próxima sequência sugerida

1. `/impeccable clarify` — alinhar "Previsto", "Meta" e o denominador da rosca. É o de maior impacto na confiança do número.
2. `/impeccable adapt` — navegação mobile e tooltip fora da tela.
3. `/impeccable audit` de novo após as correções, para medir o placar.
4. Contraste das marcas "fora do modelo" e alvo de 24 px nos botões de ajuda.

Nada foi corrigido nesta rodada: o pedido era aplicar a revisão, não redesenhar.
