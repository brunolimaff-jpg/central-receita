# Avaliação B independente — Impeccable 4.8.2

## RESULTADO

**VERIFICADO — 10/11/2026.** Avaliação independente; não consultei A nem auditorias anteriores. Código somente leitura. Detector estático: **2 warnings, regra `side-tab`**. Detector renderizado: **12 warnings + 2 advisories**, exclusivamente na **portaria**, não nas telas internas.

## Método e saída bruta

Usei o shim já disponível em `npm-cache/_npx/eb5356ea3f364053/node_modules/impeccable/cli/bin/cli.js`; pacote 4.8.2, engine Windows opcional 0.1.21. Nenhum novo download. `DO_NOT_TRACK=1`, `IMPECCABLE_HOME=<cwd>/.scratch/impeccable-20261110/cache`, sem instalar skills, hooks, dependências ou configuração.

- `--help`, `detect --help`, `detect --list-rules --json`: **exit 0**. Catálogo: **62 regras**, 31 quality/31 slop; scopes disponíveis apenas `type` e `layout`. **Não limitei a CSS** nem apliquei scope: TS/TSX incluídos. `context` não consta da ajuda; não executado.
- `detect src/ --json --no-config`: **exit 2 = findings**, não falha. [JSON bruto](<b-src.raw.json>); [registro de execução](<b-src-exitcodes.json>). Diretório contém 117 arquivos, dos quais 109 candidatos CSS/TS/TSX, abaixo de 500; não confundir inventário com contagem de arquivos efetivamente analisados pelo engine. [Inventário](<b-files.json>).
- `detect http://127.0.0.1:3013/ --json --no-config --no-consent-hiding --no-overlay-hiding --viewport 1440x900`: **exit 2**. Browser novo, portaria intacta. [JSON bruto](<b-rendered-portaria.raw.json>), [resumo sem textos comerciais](<b-rendered-portaria-summary.json>). Stderr vazio nos dois scans. **0** significa ausência de achados primários; **1** significa falha operacional/parcial. Não houve exit 1 nos scans.

## Rules por arquivo e linha

| Fonte | Contagem/regra | Interpretação independente |
|---|---|---|
| [cso-screen.tsx:96](<../../src/features/comercial-v3/regional/cso-screen.tsx#L96>) | 1 `side-tab` | Borda lateral 4px real, em lista dentro de card. Alvo atual: importado pela tela Territórios. |
| [regional-screen.tsx:96](<../../src/features/comercial-v3/screens/regional-screen.tsx#L96>) | 1 `side-tab` | Mesma estrutura; busca de imports não encontrou uso atual dessa tela antiga. Prioridade menor. |

Aurora proíbe barra lateral **na navegação**; aqui são listas explicativas. Portanto, achado estilístico real, mas **não comprova violação literal dessa regra** nem problema funcional.

Renderizado retorna URL com **linha 0**; abaixo, mapeamento manual à fonte, não source-map fornecido pelo detector:

- [tela-bloqueio.tsx:82](<../../src/features/comercial-v3/components/tela-bloqueio.tsx#L82>) e [globals.css:714–716](<../../src/app/globals.css#L714-L716>): `ai-color-palette` **2**, `dark-glow` **1**. **Prováveis falsos positivos de marca/intenção**: verde/neon Senior sobre fundo escuro; brilho é adaptação local, não componente oficial.
- [tela-bloqueio.tsx:141–149](<../../src/features/comercial-v3/components/tela-bloqueio.tsx#L141-L149>): `kicker-above-heading` **1**; `low-contrast` **2** (3,9:1 e 4,1:1 reportados).
- [tela-bloqueio.tsx:179–195](<../../src/features/comercial-v3/components/tela-bloqueio.tsx#L179-L195>): `gray-on-color` **1**, `low-contrast` advisory **1** (2,2:1; input/placeholder).
- [tela-bloqueio.tsx:220–221](<../../src/features/comercial-v3/components/tela-bloqueio.tsx#L220-L221>): `tiny-text` **2**, `low-contrast` **2** (3,6:1 e 2,7:1).
- [tela-bloqueio.tsx:235](<../../src/features/comercial-v3/components/tela-bloqueio.tsx#L235>): `low-contrast` **1** (3,1:1; detector representa primeiro rótulo).
- [tela-bloqueio.tsx:90](<../../src/features/comercial-v3/components/tela-bloqueio.tsx#L90>): `repeating-stripes-gradient` advisory **1**, reportado no seletor body.

**INFERÊNCIA:** kicker/listras são escolhas intencionais da portaria. Texto de 11px existe na escala Senior/Aurora, logo `tiny-text` não invalida sozinho. **Não dispensar contraste por marca**; os seis alertas exigem confirmação sobre imagem/transparência real, sem tratá-los como medição WCAG definitiva.

## Evidência a11y, motion e responsive

[Registro técnico](<b-browser-evidence.json>): somente minha aba Chrome isolada, liberada com chave local autorizada, depois fechada. Nenhuma aba existente examinada; nenhum `--cdp`. Recursos observados apenas no localhost.

**VERIFICADO:** Public Sans carregada; desktop interno 1440×754, um h1/main, 59 controles visíveis sem nome vazio na checagem heurística, nenhuma imagem sem alt. Mobile 375×812: largura raiz/scroll 375, sidebar fixa, links nomeados e alvos ≥48×68. Tab produziu foco visível. Com reduced-motion: **zero animações**, scroll automático; sem preferência havia seis animações contínuas. CSS contempla reduced-transparency.

**Limites:** duas tabelas de 920px em contêineres roláveis de 318px, sem nome/role/tabindex explícitos; navegação completa por teclado **NÃO VERIFICADA**. Sem certificação visual, contraste interno ou a11y integral. Sem build/testes, pois não alterei produto. **Overlay deliberadamente não executado**; sem live-server, agente automático, init/live/document/install. Apenas resultados em `.scratch`; zero alterações de app/config/deps/hooks.
