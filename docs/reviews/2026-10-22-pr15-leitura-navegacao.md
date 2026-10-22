# Revisão da PR 15 e ajustes de leitura e navegação

Data: 22/10/2026. Base da revisão cumulativa: `4329ba8795e7438a6221fed434b7dbb31ef8f8b0`; head remoto: `b42cc2cd4db0188e94500bfba4c4a04b1e46fb46`. Os ajustes desta sessão permanecem locais, sem commit, push, merge ou deploy.

## Escopo entregue pelo DeepSeek e supervisionado

- Notas de Previsto descrevem ganhos no CRM e aberto elegível, sem mudar a fórmula.
- O cartão New Name preserva posição e moldura, mas apresenta manutenção informada de pedidos conferidos e suas contagens. A razão entre pedidos e oportunidades foi retirada.
- A saudação informa o recorte mensal da carga e a ausência de filtro por filial/solução. No Forecast, a nota distingue movimentos semanais de indicadores mensais.
- Ganhos no CRM abre o Forecast com Ganhou selecionado no mês; Previsto abre o resumo e Pipeline continua em Oportunidades. Hash específico permite acesso direto e voltar/avançar.
- A supervisão corrigiu o hash da seleção semanal para não publicar um link que representa ganhos mensais. Fixtures de teste ficam em `tests/fixtures/`, não dependem de `.scratch`.
- Não foram alterados modelos de cálculo, Trajetória, Worker, schema, CSS ou a estrutura de colunas da Home.

## Verificação

- VERIFICADO: primeira execução supervisionada, antes do último ajuste do hash semanal: 197 testes PASS, zero FAIL; typecheck PASS.
- VERIFICADO no app de desenvolvimento: Ganhos → Ganhou, Mostrar todos, Semana/Mês, Previsto → resumo, URL direta e voltar/avançar. O navegador usou a carga local já existente; nenhuma carga foi importada ou substituída.
- VERIFICADO: somente uma Home e uma navegação principal no DOM. A sobreposição vista na captura do preview não correspondia a duplicação desses elementos no app; a emulação de viewport foi retirada.
- VERIFICADO: `git diff --check` sem erros; aviso de conversão LF/CRLF em `executive-page.tsx` não é falha de formatação.
- VERIFICADO na execução final supervisionada: 198 testes PASS, zero FAIL/skip; `tsc --noEmit --incremental false` PASS; `next build --webpack` PASS (compilação em 3,2 min, geração estática 3/3, saída zero). O arquivo gerado `next-env.d.ts` foi preservado byte a byte ao executar o build. O servidor de desenvolvimento foi pausado durante o build e reaberto depois.
- VERIFICADO após reabrir o servidor: aba nova sem erros no console; Home renderizada, uma única navegação principal no DOM, cartão de New Name absoluto e ausência da razão antiga. Clique e Enter no cartão Ganhos selecionaram Ganhou. Captura visual realizada sem emulação de viewport. Isso valida o delta de leitura/navegação em desenvolvimento local, não o runtime D1.
- A correção dos dois P2 de histórico foi encaminhada ao mesmo implementador após parecer técnico do planejador: restaura o contrato existente, sem decisão nova de produto. Os gates acima valem para o delta de leitura/navegação anterior a essa correção; a versão que incorporar histórico precisa ser revalidada.
- NÃO VERIFICADO: D1 hospedado, fluxo Fabi → Giovanni, aprovação visual pessoal de Bruno e equivalências comerciais das issues 4/7/8.

## Standards

Dois achados P2 adicionais no diff cumulativo, relacionados ao contrato de fonte e período do glossário e do ADR-0005:

1. O regime C conecta snapshots de referências mensais diferentes. A página descarta `entry.referenceDate` ao preparar o histórico e `buildTrajectory` conta todos os snapshots. Cenário reproduzido em memória: setembro 400/500 e outubro 100 aparecem na mesma série C de outubro. Caminhos: `src/features/comercial-v3/screens/executive-page.tsx` (mapeamento de history) e `src/features/comercial-v3/trajectory-model.ts:132-163`.
2. A atualização exclusiva de pedidos pode gerar novo snapshot de oportunidades preservadas usando a referência da atualização. Cenário reproduzido pelo mesmo cálculo local: oportunidades de outubro continuam com previsto 100, mas uma atualização com referência setembro produz snapshot 0. Caminhos: `backend/worker.js:457-476` e `src/features/comercial-v3/manual-import-client.ts:120-130`.

São achados de integridade, não opiniões de estilo. Foram corrigidos localmente após confirmação do planejador de que restauram o contrato existente: a página transporta a referência e o modelo filtra competências antes de selecionar a série C; cliente local e Worker geram snapshot somente quando o par hash/referência da própria fonte de oportunidades muda. Não houve migração ou regravação do histórico.

## Spec

Dois achados P2, os mesmos cenários acima, confrontados com a definição de curva do mês e dos valores de cada carga em `docs/PLANO-VISAO-EXECUTIVA.md` e `.scratch/trajetoria-receita/`.

A proteção contra mudança de mês está presente na ponte entre duas cargas, mas não na série C. O comentário do Worker afirma que carga só de pedidos não gera snapshot; a condição real apenas verifica se há oportunidades no workspace, incluindo uma fonte anterior preservada.

## Conferência visual de histórico e auditoria remota

- VERIFICADO em `qa-historico.localhost:3011`, origem isolada e previamente sem carga: fixture totalmente sintética inserida para depuração, com três referências de outubro e duas de setembro. A aplicação exibiu somente os três pontos de outubro (200, 150, 100), selo de três cargas e aviso das duas entradas descartadas. Captura realizada; nenhuma carga em `127.0.0.1` ou `localhost` foi substituída. Isso testa apresentação de fixture persistida, não upload nem D1.
- A supervisão ligou o aviso calculado ao texto de contexto já existente na Home; antes disso o aviso do modelo não chegava à tela. Essa última alteração visual está sendo submetida novamente à suíte, tipos e build.
- A auditoria remota do planejador identificou um P2 adicional de fuso. VERIFICADO pela supervisão: `2026-10-23T03:10:00Z` recebia rótulo UTC `23/10 03:10` na série C, enquanto o histórico em `America/Cuiaba` apresenta `22/10/2026, 23:10`. **Corrigido localmente:** dia e hora da série C usam `America/Cuiaba`, o mesmo fuso do histórico; a ordenação continua pelo instante e a competência continua vindo de `referenceDate`. Gravação com horário inválido fica fora da curva e entra no aviso existente, sem recolocar rótulo inventado nem apagar armazenamento.
- A supervisão acrescentou regressões para virada de dia, virada de mês, mesmo dia local cruzando UTC, horário inválido e mesmo dia local com hora. Um teste falhou primeiro por expectativa incorreta da própria supervisão (a hora só aparece quando duas cargas dividem o dia local); o teste foi corrigido e o comportamento do modelo estava certo.

## Eixo da Trajetória no regime C

- VERIFICADO no app: o último rótulo do eixo mostrava `22/10 08:00`, embora o valor desenhado ali fosse o da carga de 23:10, e passava 7,7 px para fora do SVG. Duas cargas no mesmo X faziam a marca ficar com a primeira.
- Correção local mínima: a última marca do eixo usa a carga mais recente daquela posição e é ancorada à direita. Não muda cálculo, ordem nem a composição da Home.
- VERIFICADO após a correção: eixo com `08/10`, `15/10` e `22/10 23:10`, sem estouro horizontal; os botões de inspeção continuam com as duas cargas distintas.
- A validação completa desse último ajuste (testes, tipos e build) está rodando; resultado declarado apenas no fechamento.

## Fechamento dos gates

Execução única e supervisionada do artefato final, após fuso e eixo: **215 testes PASS, zero FAIL/skip; typecheck PASS; build estático PASS**, compilação em 4,0 minutos, geração 3/3, saída zero, `next-env.d.ts` preservado. No app, origem isolada com fixture sintética: eixo `08/10`, `15/10`, `22/10 23:10`, sem estouro; setembro fora da curva com aviso na Home; os dois botões de inspeção do dia 22 continuam distintos.

## Parecer final do planejador

O planejador encerrou o ciclo técnico local: os defeitos auditados no head remoto `b42cc2c` estão corrigidos no diff local, e a diferença entre o SHA remoto e o checkout é de estado, não reprovação das correções. Os P3 herdados (probabilidade acima de 100% e leitura separada de atual/anterior) não foram promovidos a bloqueios. D1, autenticação hospedada e gates comerciais #4/#7/#8 ficam fora do aceite desta entrega local.

Sequência recomendada por ele: autorizar commit e publicação da revisão → conferir o novo SHA → aceite visual de Bruno → decisão explícita de merge. Nenhuma autorização foi presumida e nenhuma ação externa foi executada.

## Commit preparado (não executado)

Escopo de 13 arquivos rastreados (+515/−95) mais quatro caminhos novos: `docs/reviews/2026-10-22-pr15-leitura-navegacao.md`, `src/features/comercial-v3/forecast-focus.ts`, `tests/executive-reading.test.mjs` e `tests/fixtures/` (dois CSVs sintéticos).

Fora do commit: `.scratch/` (evidências e backup), `.claude/`, `.agents/`, `next-env.d.ts` (restaurado, sem alteração) e qualquer dado comercial. Mensagem sugerida: `Home: leitura separada, navegação para Ganhou e integridade da série C`.

Nada foi commitado, enviado, mesclado ou publicado. O commit e a publicação dependem de autorização de Bruno; o merge exige o pedido explícito "MERGE", separado.

## Publicação e merge

- Commit `275fc9b` publicado em `feat/trajetoria-receita`; `git ls-remote` confirmou o mesmo SHA no remoto. Escopo: 13 arquivos rastreados mais `docs/reviews/`, `forecast-focus.ts`, `executive-reading.test.mjs` e dois CSVs sintéticos em `tests/fixtures/`. `.scratch/`, `.claude/`, `.agents/` e `next-env.d.ts` ficaram fora.
- PR #15 marcada como pronta e mesclada: `state MERGED`, merge commit `ef2c8dd04af3eb3e68d8243ddbba4b7b02000374`, em 2026-10-22T16:32:42Z. `origin/main` confirmada por fetch e log.
- Pós-merge, worktree destacado e isolado sobre `origin/main` (`ef2c8dd`): **215/215 testes PASS**, saída zero. Typecheck e build não foram repetidos nesse worktree.
- Sem deploy, sem D1, sem permissões e sem dados comerciais reais.

## Cobertura e decisão

Revisão estática dirigida aos caminhos ativos de importação, histórico/snapshot, trajetória, Worker/schema/migração e navegação, com duas leituras independentes e reprodução sintética supervisionada. Isso não equivale a auditoria individual dos 247 arquivos, binários ou runtime D1.

Resumo: Standards 2 achados P2; Spec 2 achados P2, com sobreposição dos mesmos defeitos. O tamanho da PR não é um defeito. O checkpoint isolado depende de implementações anteriores; não foi recomendado cherry-pick cego.

Estado local: os dois problemas de histórico foram corrigidos. A versão completa passou na execução supervisionada: **211 testes PASS, zero FAIL/skip**, typecheck sem erros e build estático PASS, compilação em 3,1 minutos e geração 3/3, saída zero. A supervisão acrescentou regressão da série C com três snapshots válidos, outro mês, data inválida e referência ausente, confirmando que o histórico recebido não sofre mutação. A auditoria do planejador no GitHub examina somente o head remoto antigo, sem essas correções, e ainda não terminou. Não há aprovação integral da PR nem autorização de merge.

Limite do histórico legado: a filtragem exclui referências ausentes, inválidas ou de outra competência. Um snapshot antigo numericamente incorreto, mas gravado com referência aparentemente válida do mês exibido, não pode ser identificado ou reparado por esse filtro. Não foi feita reconstituição por inferência, exclusão ou migração de dados. Atestar valores antigos requer confrontar a carga original; runtime D1 e integridade de dados existentes continuam NÃO VERIFICADOS.

As confirmações comerciais e o runtime compartilhado permanecem critérios separados de uso gerencial. Qualquer merge depende de autorização explícita de Bruno.
