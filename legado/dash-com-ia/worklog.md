# Worklog — Senior Emerald Liquid

## 2026-09-22

### Escopo

- Reconstrução local da camada visual/interativa da Central de Receita conforme o contrato de inteligência e decisão.
- Fixture SQLite e APIs locais; sem integração corporativa, dado real, publicação, cronjob ou scheduler.
- Checkout mantido no branch `main` por decisão explícita do usuário; alterações fora do app preservadas.

### Pesquisa e decisões registradas

- Benchmark público em Apple HIG/Liquid Glass, Raycast, Attio, Vercel, Linear, Stripe, Mercury, Ramp e referências B2B/Revenue Intelligence; matriz em `references/design-research/README.md`.
- Consultas públicas feitas ao Brandcenter Senior para cor e tipografia. `#00968C` veio do Design System (o guia de logo contém uma discrepância de HEX, documentada); Public Sans foi adotada.
- Referências de shadcn/UI verificadas pelo MCP e Context7. `InputGroup` veio do MCP; o CLI dry-run indicou sobrescrita de Button/Input/Textarea e não foi aplicado.
- Navegação organizada em Comando, Leitura e Inteligência; `Pergunte`, command palette, Proveniência inline e Modo Reunião ficam no shell.
- Breakpoint de navegação desktop movido para 1280 px após inspeção da largura intermediária. `devIndicators: false` remove o badge do Next sem ocultar erros de build/runtime.

### Dados sintéticos

- Adicionados campos opcionais de fixture para classificação/tipo/subtipo; linha 339001 agora representa ERP GATec e a Conta Agro Horizonte S.A.
- Semente reexecutada no SQLite local: 30 Contas, 97 Oportunidades, 678 ações, 98 compromissos, 66 propostas, 15 pedidos; checagens FK passaram.
- Antes da atualização, `db/custom.db` foi copiado a `%TEMP%` e comparado por SHA-256: `DC2318DF6D75FCBD921E21A9E47D5BC19EF292DA6D2F01259FAD186B73BA95E4`.
- Três colunas opcionais foram aplicadas com `prisma db push` sem `--accept-data-loss`; a seed refez apenas o mock local.
- Fio da Receita 339001 contém SQL 84521 (15 abr), Conta 200001, Oportunidade 339001, Proposta 427070, Win (31 jul) e Pedido 212625 (18 ago, em conferência). SQL sintético 84522 existe separadamente sem relação com Oportunidade.
- As datas sem hora agora são formatadas como datas locais de calendário para não recuarem um dia em fuso negativo.

### Superfícies e padrões

- **Agora:** ribbon desde a última leitura, headline do Forecast, três populações prioritárias e contribuição por Oportunidade.
- **Mudanças:** delta do Forecast por horizonte, Entradas/Saídas/Reforecast/avanços/Win/Loss e contribuições divergentes.
- **Decisões:** filas sem persistência com contexto/evidência e detalhe contextual.
- **Pipeline:** valor aberto, Forecast global, composição por Conta/Origem e etapa não comprovada agregada.
- **Oportunidades:** filtros globais, atributos sintéticos visíveis, nomes autorizados e SQL sem Oportunidade em bloco separado.
- **Win/Loss:** comparação de valor, janela alinhada entre resumo/lista/motivos, Pedido e conferência separados.
- **Radar:** títulos de negócio; `RADAR-R1`–`RADAR-R7` somente dentro de “Ver regra”.
- **Detalhe:** Fio da Receita explícito, origem da navegação, timeline com eventos principais, compromissos separados e painel contextual sólido/vidro.
- **Fontes e Regras:** catálogo expansível por domínio e tabela completa de definições técnicas.
- Componentes criados/revisados incluem `FioDaReceita`, ribbon de movimento, `PerguntePanel`, `ProvenienciaInline`, `CommandPalette` e `ModoReuniao`.

### Execução e validação

- `npx tsc --noEmit`: PASS.
- `npx eslint src/app src/components/central src/lib/domain prisma/seed.ts`: PASS.
- `node --test tests/central-contract.test.mjs`: 6/6 PASS (taxonomia, filtros, janelas, Win/Loss, Fio e 404).
- `npx next build`: PASS, rotas App Router geradas e compilação de produção concluída.
- Visual: inspeção ao vivo pelo navegador da Central em 1060 px para Agora, Mudanças, Decisões, Pipeline, Oportunidades e Detalhe. Chrome isolado por CDP local 9222 para validação; o perfil visível do usuário não foi encerrado.
- **Steering posterior do usuário:** “n precisa de captura, se for so validar to aqui”. O lote de capturas foi interrompido e a entrega não afirma cobertura das 13 telas em imagem. Arquivos parciais do lote estão em `screenshots/final/`; eles não são usados como prova de cobertura total.

### Riscos e limitações

- Regras e estados de negócio continuam determinísticos e sintéticos; o mock não representa uma política Senior de produção.
- Os rótulos restantes de etapa do fixture não são exibidos individualmente; a UI agrega-os como “Não comprovado”.
- Classificações, origem, filial, segmentos, motivos e nomes restantes são ilustrativos, nunca catálogo corporativo.
- `npm install --no-package-lock` reportou 4 vulnerabilidades moderadas e 5 altas em dependências existentes; nenhuma correção automática foi aplicada.
- O `dev` original usava `tee`; `scripts/dev-local.mjs` agora configura o SQLite local e inicia Next/Webpack no loopback no Windows.
- `START_CENTRAL_LOCAL.cmd` chama `scripts/start-central-local.mjs`, verifica a API, inicia o servidor destacado e abre Agora no Chrome com perfil em `%TEMP%` e CDP loopback 9222. O caminho com servidor ativo reutiliza a instância; o lock Next de um segundo servidor na mesma pasta foi tratado sem finalizar o processo existente.

### Fechamento da validação

- Revisão independente solicitada pelo usuário: somente leitura, em andamento neste fechamento; achados serão consolidados antes de declarar a revisão concluída.
- `npx tsc --noEmit`: PASS.
- `npx eslint .`: PASS na árvore completa.
- `CENTRAL_BASE_URL=http://127.0.0.1:3001 node --test tests/central-contract.test.mjs`: PASS, 6/6 contratos.
- `npx next build`: PASS; gerou as rotas estáticas e dinâmicas. Next informou que ignorou a validação de tipos na build; o TypeScript foi validado pelo comando separado acima.
- `git diff --check`: PASS; Git emitiu somente avisos de conversão LF/CRLF.
- Após o build, `START_CENTRAL_LOCAL.cmd` foi executado novamente; `/api/meta` respondeu HTTP 200 e o servidor permaneceu disponível em `127.0.0.1:3001`.
- As capturas adicionais continuam dispensadas pelo usuário. O QA registra rotas, interações, viewports, limitações e imagens parciais sem apresentá-las como cobertura completa.

### Checkpoint pós-review

- A segunda leitura independente confirmou os sete achados anteriores como corrigidos e não identificou outro defeito de código. A revisão foi somente leitura e não executou testes.
- Corrigido o Modo Reunião para usar `forecast_periodo`, exibir horizonte e direção; o título foi extraído para `src/lib/domain/forecast-headline.ts` e o teste cobre queda, crescimento, estabilidade, 30/60/90 dias e falta de dados.
- Adicionado `scripts/central-runtime.mjs`: launchers recusam qualquer `DATABASE_URL` diferente do SQLite sintético local, sem revelar o valor rejeitado. `/api/meta` assina a Central e os dados sintéticos; o launcher valida a assinatura antes de reutilizar o serviço.
- Sanitização de Pergunte: etapas passam por `etapaParaUI`, tabelas de casos mostram nome do sinal e códigos técnicos saíram das respostas/proveniência visíveis. O funil agrega etapas não comprovadas.
- Modo Reunião agora ignora setas quando o foco está em controle interativo ou diálogo; Escape fecha a camada superior antes de encerrar a leitura. Landmark interno `<main>` virou `<section>`.
- Alinhados README e fallback do teste HTTP à porta 3001.
- Foram escritos testes para os guardas do launcher e para a manchete de Forecast. `local-runtime.mjs` e `local-runtime.test.mjs` estavam ocultos por `.gitignore` (`local-*`); foram renomeados para `central-runtime.mjs` e `runtime-guards.test.mjs`, e os imports/docs foram ajustados.
- Pós-correção: `npx tsc --noEmit` e `npx eslint .` passaram; runtime guards 3/3; headline Forecast 1/1; `node --check` dos scripts locais e `git diff --check` passaram.
- Contratos HTTP ampliados ainda não foram validados: a última tentativa recebeu `fetch failed` porque não havia listener na porta 3001. Build Next passou antes das correções e precisa rodar novamente. QA visual pós-fix para teclas/horizonte também está pendente; capturas continuam dispensadas pelo usuário.
- Estado do servidor no último read-back: parado/não confirmado. Não encerrar com alegação de que está aberto.
- O checkpoint operacional está em `HANDOFF_AI.md`; plano detalhado em `docs/superpowers/plans/2026-09-22-review-followups.md`. Não houve escrita no Vault porque o guia de governança, perfil canônico e pasta do projeto não foram encontrados; estado Vault **NAO VALIDADO**.

### Fechamento pós-review — 2026-09-22

- Launcher final executado: `START_CENTRAL_LOCAL.cmd` iniciou o serviço, abriu o Chrome isolado e confirmou `/api/meta` HTTP 200, produto `Central de Receita`, tipo `sinteticos`, 97 Oportunidades. Servidor deixado ativo em `127.0.0.1:3001`, depuração local solicitada em 9222.
- Suíte combinada `node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/central-contract.test.mjs tests/runtime-guards.test.mjs tests/forecast-headline.test.mjs`: **13/13 PASS**. Inclui Win sem Pedido (oportunidade sintética 339095), filtros, Fio, sanitização de Pergunte, guardas de launcher e direção/horizonte.
- Browser via Playwright/Chrome CDP sem capturas: Forecast foi conferido em 30/60/90 dias; palette/Pergunte mantiveram o slide ao usar setas; Escape fechou só o overlay; seta no conteúdo avançou; detalhe 339095 mostrou `Sem Pedido registrado`; `pageerror=0`.
- `npx tsc --noEmit`: PASS; `npx eslint .`: PASS.
- `npx next build`: PASS após correções; Next ignorou sua checagem de tipos configurada, compensada por `tsc` separado.
- `git diff --check`: PASS, com avisos conhecidos de conversão LF/CRLF. Arquivos preexistentes fora do escopo permanecem intactos.
- Screenshots completos seguem dispensados por orientação explícita do usuário. Não foram adicionadas capturas.

### Correção posterior — busca de ERP GATec

- Reprodução em Chrome: digitar `GATec` na command palette e pressionar Enter abria “Pergunte à Receita”. A causa era a busca fuzzy da cmdk, que aceitava uma correspondência parcial entre palavras; além disso, o componente limitava a lista a 18 Oportunidades, excluindo 339001 das sugestões iniciais.
- Aplicado filtro de termos literais normalizados sem acento (`pontuarBuscaComando`) e removidos os cortes de 18 Oportunidades/12 Contas. Agora o usuário pode buscar por nome, conta ou ID nos registros disponibilizados pelo contexto atual.
- Navegador validou: `GATec` mostra apenas oportunidades correspondentes; Enter abre uma delas (339097). Busca por ID `339001` abre Agro Horizonte e mostra o Fio da Receita.
- Teste unitário `tests/command-search.test.mjs`: 2/2 PASS. Suíte combinada passou 15/15; `npx tsc --noEmit`, `npx eslint .` e `npx next build` passaram após a mudança.
- Launcher executado novamente após o build; `/api/meta` confirmou a Central sintética e 97 Oportunidades. Navegador deixado no detalhe da oportunidade 339001.

### Unificação Agêntica — 2026-09-25

- Navegação reorganizada em Briefing, Pergunte à Receita, Explorar, Visões e Fontes & Regras. Forecast, Oportunidades e Atenção ganharam subnavegação; telas e deep links existentes foram mantidos.
- A home agora se apresenta como Visão da Diretoria. O assistente abre como balão lateral e reaproveita a conversa determinística; filial, classificação e horizonte só são enviados quando presentes no contexto da tela.
- Detalhes acionados por análise abrem em painel sobre a origem e retornam à tela/decisão anterior. Rotas diretas de detalhe continuam disponíveis.
- Visões locais abrem os presets Forecast 30 dias, New Name, Cross e Win/Loss. Atalhos salvos usam store em memória e desaparecem ao reiniciar; nada é gravado em banco ou `localStorage`.
- Command Palette foi montada no shell com busca, navegação e filtros. O comando “Iniciar leitura executiva” foi removido porque não havia handler conectado.
- Recortes foram restringidos aos destinos que os consomem: janela móvel em Briefing/Forecast/Pergunte; busca em Oportunidades/detalhe; filial e classificação nas leituras suportadas.
- Causa confirmada do EPERM no launcher: Next/Webpack tentava limpar `.next/dev/server/app/api/agente`, um caminho de diretório reparse/read-only no checkout OneDrive. Ambos os launchers locais passaram a usar Turbopack. `npm run dev` subiu no loopback e `/api/meta` retornou a assinatura sintética.
- Verificação: `npx tsc --noEmit`, `npx eslint .`, `npx next build` e 57/57 testes passaram. O navegador local verificou os fluxos principais em viewport desktop; 390 px não foi verificado nesta rodada.
- Sem commit, reset do Git, integração externa, modelo real, escrita no CRM ou mudança de base. As 171 exclusões preparadas já existentes no índice foram preservadas.

### Marca Senior e validação final — 2026-09-25

- Incluído no shell o wordmark branco Senior oficial do PPTX autorizado. Variantes originais coloridas/brancas foram extraídas para `public/brand/senior-official-logos/`; navegação funcional segue com Lucide.
- Public Sans é a fonte que o projeto já havia adotado; o PPTX de logos não é evidência de que seja a tipografia corporativa oficial.
- Reteste: TypeScript, ESLint, build Next e 60/60 testes aprovados; `/api/meta` HTTP 200 identificou o mock sintético v1.1.0, 30 contas e 97 oportunidades.
- Navegador a 1600×900 mostrou o Briefing com wordmark e dados carregados; “Pergunte à Receita” abriu com sugestões e retornou ao Briefing ao fechar.
- `npm run dev` segue ativo em `127.0.0.1:3001`. Console e viewport mobile não foram reavaliados nesta retomada; índice Git preexistente com 171 exclusões foi mantido.

### Briefing visual-first — 2026-09-25

- Substituído o Briefing textual por gráficos/comparações de Forecast, PEX, movimentos, New Name/Cross, pipeline privado/público, sinais, agenda e contribuições.
- Adicionados controles de horizonte, escala global das visualizações e densidade executiva/completa, além do resumo mensal de New Name/Cross com datas no fuso de competência.
- Regras preservadas: valor Ganho usa `valor_fechado`; fila aberta por previsão não é tratada como PEX; perda não vira receita; etapas e fontes não comprovadas continuam rotuladas.
- `docs/briefing-visual-spec.md` e `docs/superpowers/plans/2026-09-25-briefing-visual.md` registram leitura, estados e verificação.
- Gate final após a escala global: TypeScript, ESLint, 61/61 testes e `npx next build` PASS; Next pula sua checagem de tipos, validada separadamente por TSC.
- Restart validado: servidor Turbopack ativo em `127.0.0.1:3001`; `/api/meta` HTTP 200, mock sintético v1.1.0, 30 contas e 97 oportunidades. IAB deixada no Briefing com `janela=30`.
- Viewports: IAB/CUA 1070×900; Playwright CLI com Chrome 1600×900 e 390×844. Console do navegador não foi lido. Screenshots temporários ficaram em `%TEMP%`, fora do checkout.
- Reviewer independent found four Important issues: truncated pipeline totals, controls gated by Forecast API, stale numbers while recut fetches, and unlabeled slider Thumb. Fixed all four; the executive card now still reports the full 59 opp/R$18.33m while showing four stages, controls sit in the page header, refresh has a live status/busy state, and AX tree identifies `slider Tamanho dos gráficos`.

### Fechamento e pesquisa de skills — 2026-09-25

- Corrigido o rótulo da severidade informativa: usa “Informativa” e tratamento neutro/azul, separado de “Atenção”. Revisão, CUA e regressão local concluídas.
- TSC, ESLint, `npx next build` e testes `tests/*.test.mjs` 61/61 passaram; a suíte HTTP precisa de `CENTRAL_BASE_URL=http://127.0.0.1:3001`. `/api/meta` respondeu HTTP 200 e o servidor ficou ativo em 3001.
- Pesquisa de skills: não foi encontrada uma skill específica de C-level/RevOps. Combinar `ui-ux` (hierarquia e visualização), `better-ui` (polimento) e `emil-design-eng` (movimento funcional e discreto); usar `find-animation-opportunities` como auditoria read-only. A disponibilidade ativa de `ui-ux` não foi confirmada.
- Encaminhamento: definir a narrativa e a semântica executiva de cada tela antes de detalhar gráficos; adicionar movimento só para explicar mudança/causa e com respeito a `prefers-reduced-motion`.
