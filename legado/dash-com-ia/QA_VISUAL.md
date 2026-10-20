# QA visual e de interação — 2026-09-22

## Escopo e ambiente

- Aplicação local: `http://127.0.0.1:3001/`.
- Chrome 153 por Chrome DevTools Protocol em loopback `9222`, usando perfil isolado no `%TEMP%`; o perfil visível do usuário não foi encerrado.
- Viewports verificados em sessão de navegador: 1440×900, 1920×1080, 2560×1440 e 390×844.
- O usuário posteriormente dispensou a necessidade de capturas adicionais e ficou disponível para acompanhar a validação ao vivo. O lote completo de 13 screenshots foi interrompido a pedido; imagens parciais em `screenshots/final/` não são apresentadas como cobertura completa.

## Rotas verificadas

| Superfície | Resultado | Evidência observada |
|---|---|---|
| Agora | PASS | Mudança do Forecast, fita de movimento, atenção e primeira decisão aparecem no mesmo fluxo. |
| Mudanças | PASS | Contribuição por Oportunidade, variação de Forecast, Entradas/Saídas/Win/Loss. |
| Decisões | PASS | Estados Precisa revisão, Em análise e Acompanhamento; foco herdado do Radar preserva a população. |
| Pipeline | PASS | Pipeline aberto, Forecast selecionado, etapa sem taxonomia agregada como “Não comprovado”, concentração por Conta. |
| Oportunidades | PASS | New Name/Base/Cross / Up Sell/C4L e tipo/subtipo de fixture; SQL sem Oportunidade aparece separado. |
| Detalhe | PASS | Conta e Oportunidade, responsáveis distintos, contexto de origem, proposta, Pedido e timeline. |
| Fio da Receita | PASS | Seis nós explícitos e datas renderizadas corretamente: SQL 84521 15/04, Win 31/07 e Pedido 212625 18/08. |
| Win/Loss | PASS | Resumo, listas e motivos alinhados à mesma janela móvel de 90 dias; Win e Pedido permanecem distintos. |
| Radar | PASS | Headline usa situação de negócio; definição técnica e `RADAR-R1` aparecem sob “Ver regra”. |
| Fontes/Regras | PASS | Catálogo por domínio expansível e tabela de definições/limitações. |

## Interações

| Fluxo | Resultado |
|---|---|
| Pergunte à Receita | PASS — herdou Agora, respondeu deterministicamente com o snapshot e apresentou proveniência; Escape fechou o painel. |
| Command palette | PASS — Ctrl+K abriu a palette; Escape fechou; filtros e navegação estavam disponíveis. |
| Modo Reunião | PASS — abriu, avançou por seta e mostrou o passo seguinte. |
| Command palette — buscar Oportunidade | PASS — `GATec` retorna somente Oportunidades ERP GATec; Enter abre uma delas. `339001` filtra isoladamente ERP GATec da Agro Horizonte e Enter abre `/...?tela=detalhe&op=339001`. |
| Filtro global Base | PASS — selecionou Base, atualizou `classificacao=Base` na URL e reduziu a fila para 24 Oportunidades. |
| IDs sem registro | PASS — `/api/oportunidades/999999` devolve 404, sem fixture de fallback. |

## Viewports e legibilidade

| Viewport | Largura horizontal | Local da primeira seção “Atenção hoje” |
|---|---|---:|
| 1440×900 | Sem overflow | y≈547 px; primeiro caso termina antes do limite de 900 px. |
| 1920×1080 | Sem overflow | y≈473 px. |
| 2560×1440 | Sem overflow | y≈473 px. |
| 390×844 | Sem overflow horizontal | y≈922 px; é necessário rolar para ver as populações de atenção. |

No viewport mobile, Agora preserva manchete, contexto e ações; a área “Atenção hoje” fica abaixo da primeira dobra. O teste de decisão em 30 segundos é direcionado ao desktop corporativo, como definido no contrato.

## Verificações de aplicação

- Nenhum erro de console ou `pageerror` observado no roteiro via Chrome/CDP.
- Nenhuma tela em branco ou overlay de framework no conjunto de rotas verificado.
- `npx tsc --noEmit`: PASS.
- `npx eslint .`: PASS na árvore completa, incluindo hooks e scripts/configuração.
- `node --test tests/central-contract.test.mjs`: 9/9 passou após as correções, com o servidor local na porta 3001.
- `npx next build`: PASS após as correções do reviewer. Next informou que a validação de tipos foi ignorada pela configuração; `npx tsc --noEmit` passou separadamente.
- `START_CENTRAL_LOCAL.cmd`: PASS — com servidor parado, iniciou o Next local, aguardou `/api/meta` HTTP 200, abriu Agora no Chrome e ativou depuração loopback em 9222; depois do build final, foi executado novamente e a API respondeu HTTP 200 em `127.0.0.1:3001`.
- Uma tentativa controlada de iniciar um segundo `next dev` do mesmo checkout em 3002, enquanto 3001 permanecia ativo, foi recusada pelo lock padrão do Next. O bootstrap encerrou sem matar/substituir o processo existente.

## Limitações honestas

- O usuário dispensou a captura de novas imagens durante o QA ao vivo; portanto, a galeria completa de 13 screenshots prevista originalmente não foi produzida nesta execução.
- 390×844 é funcional, mas a seção de atenção não fica na primeira dobra; não foi tratado como requisito principal no brief.
- Chrome foi iniciado com perfil em `%TEMP%`, extensões/sync/background networking solicitados como desativados; a depuração ficou apenas em loopback. Uma instalação de Chrome gerenciada pode ainda carregar componentes próprios do navegador.
- O mock usa regras determinísticas e não valida políticas, métricas ou causalidade da operação comercial real da Senior.
- O lote de screenshots continua parcial por orientação explícita do usuário; a validação final foi feita no navegador disponível e por verificações executáveis, sem gerar novas capturas.

## Reteste após revisão independente

- A segunda revisão de código confirmou os sete achados anteriores como corrigidos e não apontou outro defeito remanescente. O reviewer não executou testes; a regressão abaixo foi executada localmente depois.
- `npx tsc --noEmit`: PASS após as correções.
- `npx eslint .`: PASS após as correções.
- `node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/central-contract.test.mjs tests/runtime-guards.test.mjs tests/forecast-headline.test.mjs`: 13/13 PASS. Cobre taxonomia/filtros, janelas, Fio, Win sem Pedido, respostas de Pergunte, guardas do launcher e manchete de Forecast.
- Navegador Chromium via CDP 9222, sem capturas: manchete em 30/60/90 dias corresponde à janela e informa direção; ArrowRight/Left não alteram a etapa enquanto palette ou Pergunte está em foco; Escape fecha a camada superior sem encerrar a reunião; seta no conteúdo avança a etapa; 0 `pageerror`.
- Detalhe da oportunidade sintética 339095: situação Ganha e “Sem Pedido registrado” aparecem como estados distintos; 0 `pageerror`.
- `START_CENTRAL_LOCAL.cmd`: após o build, iniciou a app; `/api/meta` retornou HTTP 200, `Central de Receita`, `sinteticos` e 97 Oportunidades.
- `npx next build`: PASS após as correções. Next ignorou a verificação de tipos da build; TSC separado passou.
- `node --check` nos três scripts locais, `git diff --check` e validação de que os novos helper/testes não são ignorados pelo Git: PASS.
- Servidor local deixado ativo em `127.0.0.1:3001`; o launcher abriu o Chrome isolado com a Central no Agora.

## Correção posterior — busca de Oportunidades

- Reproduzido pelo navegador: pesquisar `GATec` e pressionar Enter destacava “Perguntar à Receita” por causa da busca aproximada textual; Enter abria Pergunte em vez de uma Oportunidade. O comando também mostrava só as primeiras 18 Oportunidades.
- Corrigido com filtro textual por termos, sem falsos positivos aproximados, e inclusão de todas as Oportunidades/Contas da fila sintética na palette.
- Chromium/CDP confirmou `GATec` listando apenas oportunidades correspondentes, incluindo 339001. Enter em `GATec` abriu a Oportunidade 339097; busca por `339001` abriu a Agro Horizonte, URL `?tela=detalhe&op=339001&de=oportunidades`, com Fio da Receita correto.
- `tests/command-search.test.mjs`: 2/2 PASS para correspondência relevante, exclusão de Pergunte, termos em qualquer ordem e acentos.

## Unificação Agêntica — 2026-09-25

### Fluxos revistos no navegador local

| Fluxo | Resultado | Evidência observada |
|---|---|---|
| Briefing da Diretoria | PASS | Manchete de projeção, movimento, Atenção e Agenda preservados sob a entrada executiva. |
| Navegação primária e subnavegação | PASS | Briefing, Pergunte, Explorar, Visões e Fontes; Forecast/Pipeline-Mudanças, Oportunidades/Carteira-Win/Loss e Atenção/Sinais-Decisões. |
| Pergunte contextual | PASS | Balão abriu sobre o Briefing; pergunta de projeção respondeu com tabelas, limitação e consulta/regra. |
| Visões | PASS | Quatro presets abriram as telas existentes; “Salvar” persistiu na sessão e o atalho Forecast abriu `mudancas&janela=30`. |
| Recortes globais | PASS | Classificação New Name exibiu chip e filtrou a fila para 25 oportunidades; janela de 30 dias foi removida ao mudar para Radar/Decisões. |
| Detalhe contextual | PASS | “Revisar caso” abriu o detalhe sobre Decisões; URL reteve `op`, `de` e `foco`; “Voltar à leitura” retornou à fila e limpou filtros fora de escopo. |
| Command palette | PASS | Abriu por botão, listou as áreas e filtros; nenhuma ação de Modo Reunião sem handler aparece. |

### Ambiente e verificações

- Navegador local observado em 1162×904 px; Briefing, Visões, Forecast/Mudanças e Atenção foram inspecionados por captura ao vivo. Não foram salvas capturas em arquivo nesta rodada.
- `npm run dev`: PASS em `127.0.0.1:3001` com Turbopack; `/api/meta` HTTP 200 assinou `Central de Receita`, `sinteticos`, `v1.1.0-mock` e 97 oportunidades.
- `npx tsc --noEmit`: PASS.
- `npx eslint .`: PASS.
- Suítes `tests/*.test.mjs`: 57/57 PASS, incluindo contratos HTTP com `CENTRAL_BASE_URL=http://127.0.0.1:3001`.
- `npx next build`: PASS; Next informou que ignorou sua validação de tipos configurada, compensada pelo TSC separado.

### Limites

- Viewport mobile de 390 px não foi ajustado nesta rodada; responsividade foi revisada no código, sem alegar verificação visual mobile atual.
- Não foi exercitada no navegador uma pergunta com filial/classificação não vazias; o envio condicional desses recortes foi verificado no código, e o endpoint atual aceita esses campos.
- A conversa segue determinística e somente leitura. Não existe conexão real com ChatGPT/LLM nem com CRM.

## Reteste de identidade Senior e Briefing — 2026-09-25

- Wordmark branco oficial da Senior, extraído sem alteração do PPTX autorizado `Icones Senior.pptx`, aparece no topo da navegação lateral (`slide-13-logo-01.svg`). As demais variantes extraídas permanecem em `public/brand/senior-official-logos/`.
- A interface usa Public Sans, já definida no layout como direção tipográfica deste projeto. O PPTX fornecido é um conjunto de logos; ele não confirma sozinho que Public Sans seja a fonte corporativa oficial.
- Navegador local em 1600×900: página `/?tela=agora` identificada como Central de Receita, conteúdo carregado com manchete/atenção/agenda, wordmark visível; balão Pergunte abriu com três sugestões e fechou retornando ao Briefing.
- `GET /api/meta`: HTTP 200; produto `Central de Receita`, tipo `sinteticos`, versão `v1.1.0-mock`, 30 contas e 97 oportunidades.
- Verificações refeitas após as correções: TSC PASS, ESLint PASS, suítes `tests/*.test.mjs` 60/60 PASS e `npx next build` PASS. Next ignora a validação de tipos na build; TSC foi executado separadamente.
- `npm run dev` reiniciado com Turbopack e deixado ativo em `http://127.0.0.1:3001/?tela=agora`.
- Console do navegador não foi lido nesta retomada; logs do servidor mostraram as leituras/API do fluxo com HTTP 200. Mobile não foi reavaliado visualmente nesta retomada.

## Briefing visual-first — 2026-09-25

### Leitura verificada

- Identidade/rota: página `http://127.0.0.1:3001/?janela=30`, título da Central, wordmark Senior e Briefing da Diretoria presentes; sem tela em branco ou overlay de framework.
- Desktop 1600×900 via Playwright CLI com canal Chrome: Forecast móvel e PEX aparecem lado a lado; movimentação, New Name/Cross, composição por etapa, riscos, agenda e contribuições seguem na página.
- Mobile portrait 390×844 via Playwright CLI com canal Chrome: conteúdo empilhado, horizonte e ajuste de exibição acessíveis; gráfico principal aparece no primeiro viewport sem overflow horizontal visível. PEX e demais blocos continuam abaixo da dobra.
- PEX setembro: Ganhas no mês R$ 240.000 + Forecast aberto elegível R$ 168.500 = R$ 408.500. O card diz que o indicador não representa receita oficial/Pedido conferido.
- New Name: 2 criadas, 0 Ganhas, 2 Perdidas e 4 abertas com previsão no mês (R$ 1.648.500). Cross / Up Sell: 1 criada, 1 Ganha (R$ 54.500), 1 Perdida e 2 abertas previstas (R$ 852.500). A tela separa as entradas, os fechamentos e a fila; perdas são contadas, sem somar valor previsto como realizado.
- Etapas privadas/públicas ficam separadas e exibem mapeamento desconhecido sem inventar conversão. Pendências por motivo alertam que as populações podem se sobrepor.

### Interações e verificações

- Forecast: 30/60/90 dias atualiza query `janela` e valores exibidos. Conferido em 30, 60 e 90 dias; 30 dias ficou selecionado na aba entregue.
- Escala: botão − levou a 80%, limites 80–130%, botão + levou a 130%, ArrowLeft no slider moveu 130→120 e Restaurar voltou para 100%. Escala altera a área dos gráficos/barras sem reduzir os rótulos.
- Densidade: modo Completo expandiu funil e agenda com 29 itens; Restaurar voltou a Executivo.
- `npx tsc --noEmit`: PASS; `npx eslint .`: PASS; `tests/*.test.mjs`: 61/61 PASS; `npx next build`: PASS. Next pulou sua validação de tipos; TSC passou separadamente.
- Após o build, `npm run dev` ficou ativo em `127.0.0.1:3001`; `/api/meta` HTTP 200 confirmou `Central de Receita`, `sinteticos`, v1.1.0-mock, 30 contas e 97 oportunidades.
- Console do navegador não foi acessado pela CUA. Logs de desenvolvimento mostraram os endpoints do fluxo com HTTP 200; nenhum erro de render apareceu no navegador visualmente inspecionado.
- O screenshot mobile foi mantido fora do repositório em `%TEMP%`; não foi criado arquivo de captura no checkout.

### Correções da revisão

- Total do pipeline permanece 59 oportunidades / R$ 18.330.500 no modo Executivo embora só mostre quatro das seis etapas; o modo Completo exibe as outras duas mantendo o mesmo total.
- Os controles 30/60/90, escala e densidade agora ficam no cabeçalho do Briefing e continuam disponíveis sem a resposta de Mudanças.
- Ao atualizar horizonte/filtros, o aviso ao vivo nomeia o recorte atual, informa que valores visíveis ainda podem refletir o anterior e as regiões afetadas carregam `aria-busy`.
- Slider agora anuncia nome “Tamanho dos gráficos” e valor percentual no thumb focável; confirmado na árvore de acessibilidade local.
- Não foi injetada falha de rede nem latência no browser; ramo de erro parcial foi inspecionado por código. As demais verificações são reportadas acima.

### Limites da evidência

- Dados são sintéticos e determinísticos; não há CRM, LLM, meta oficial ou reconhecimento contábil de receita.
- O HTML de conceito `docs/mockups/central-receita-agentic.html` não está no checkout atual. A implementação usa o conceito/direção Senior aprovado, mas não alega comparação pixel a pixel com esse arquivo.

### Reteste final — 2026-09-25

- A revisão independente aprovou as quatro correções principais. Também ajustei a severidade informativa para exibir “Informativa” com tratamento visual neutro/azul, em vez de “Atenção”.
- CUA confirmou o Briefing carregado em `/?janela=30`, incluindo Forecast, PEX, movimentos, New Name/Cross, pipeline (59 oportunidades / R$ 18.330.500), riscos e agenda.
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS; `npx next build`: PASS (Next pula a validação de tipos, coberta pelo TSC separado).
- `node --test tests/*.test.mjs`: 61/61 PASS com `CENTRAL_BASE_URL=http://127.0.0.1:3001`. A primeira tentativa sem a variável usou a porta padrão 3000 e falhou por conexão recusada; repetida na porta configurada, passou.
- Após a build, `npm run dev` reiniciado; `/api/meta` respondeu HTTP 200 e confirmou a Central sintética v1.1.0-mock, 30 contas e 97 oportunidades. Serviço ativo em `127.0.0.1:3001`.
- `git diff --check`: PASS. As 171 exclusões já preparadas no índice foram preservadas; nenhum commit/reset/limpeza foi feito.
- Console do browser não foi lido nesta retomada.
