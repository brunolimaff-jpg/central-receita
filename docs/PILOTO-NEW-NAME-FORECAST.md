# Piloto da Central: New Name e Forecast

Consolidação de 05/10/2026. Fontes: pedido de Bruno nesta conversa, transcrição `Apresentação Visões.docx`, documentação recente de `Dash com IA` (`HANDOFF_AI.md`, `CONTEXT.md` e ADRs) e estrutura das duas exportações fornecidas. A transcrição registra propostas e relatos; a autorização para esta entrega vem dos pedidos de Bruno.

## Direção de produto

**DECISÃO DO USUÁRIO:** começar com New Name e Forecast operacionais. Apresentar a visão futura das demais áreas. Fabi fornece e confere os dados; Giovanne consulta o resultado da diretoria. O escopo inicial usa importação manual das exportações do CRM; a API pode substituir essa entrada depois.

New Name e Forecast mantêm funções distintas. Compartilham as fontes reconciliadas, mas carteira prevista, novos clientes e receita realizada não são o mesmo indicador. A prioridade de negócio não revoga as decisões recentes sobre a experiência da Central.

## Entrada manual

Local escolhido: **Configurações → Importação de dados**, na Central existente. Fluxo: informar a data de referência → selecionar um CSV UTF-8 ou XLSX → revisar contagens, problemas e vínculos por ID → salvar a prévia → revisar Forecast e New Name. Os seletores aceitam CSV com os mesmos cabeçalhos dos XLSX abaixo; exportações CSV reais ainda precisam ser conferidas com a Fabi.

A data de referência começa vazia para que uma exportação antiga não seja marcada automaticamente como atual. A referência de cada fonte salva continua visível ao lado da prévia.

| Fonte | Estrutura observada | Uso inicial |
|---|---|---|
| Opp em andamento.xlsx | 42 colunas; uma linha por oportunidade | Carteira, etapa, previsão, responsável, representante e valores informados pela fonte |
| Pedidos Outubro 26.xlsx | 52 colunas; linhas de produtos e serviços, repetindo pedidos | Status do pedido, classificação da fonte, produtos e conferência do vínculo com oportunidades |

O nome do arquivo não determina seu conteúdo. A exportação de oportunidades também contém registros fechados; a de pedidos contém datas de fechamento anteriores a outubro. A importação valida os cabeçalhos e conserva o grão de cada fonte.

**VERIFICADO nesta entrega:** ambos os arquivos completos passaram pela validação estrutural. A leitura sinalizou 169 datas especiais na carteira. A reconciliação encontrou 86 pedidos vinculados por ID, 9 sem oportunidade correspondente e nenhuma divergência de conta entre os pedidos vinculados. Esses resultados descrevem somente as duas cargas fornecidas.

Uma nova seleção substitui o retrato daquela fonte na prévia. Reimportar os mesmos bytes e referência não adiciona registros; selecionar o mesmo arquivo com referência corrigida permite atualizar a prévia. Pedidos com vários itens continuam sendo um pedido nas contagens. Identificadores ausentes, oportunidades repetidas, colunas obrigatórias ausentes e contas conflitantes bloqueiam a gravação. Avisos preservam o campo afetado como indisponível e exigem revisão. Etapa ausente fica fora da carteira aberta. A gravação local é atômica e detecta atualização concorrente por outra aba.

A leitura e a normalização rodam em Web Worker, fora da interface. CSV aceita UTF-8 com ou sem BOM, vírgula ou ponto e vírgula; aspas malformadas e cabeçalhos com delimitador ambíguo são rejeitados. Há limites de 15 MB por arquivo, 50.000 linhas, 100 colunas e 45 segundos de leitura; XLSX também mantém os limites de 64 MiB descompactados e uma aba preenchida. Não há certificação de comportamento para arquivos arbitrários ou malformados.

Campos de contato, e-mail e CPF/CNPJ não entram na prévia implementada. Os arquivos originais permanecem intactos. Não foram incorporados dados comerciais aos arquivos públicos do site.

## Regras que continuam válidas

| Tema | Regra e implicação |
|---|---|
| New Name | Exige fonte e definição próprias. `CLASSIFICACAO DO PEDIDO = Novo` é evidência a validar com Fabi; não certifica o indicador automaticamente. Classificação da conta e origem da oportunidade também não o determinam sozinhas. |
| MRR | Receita recorrente mensal é a prioridade relatada por Fabi. Definir quais linhas e campos a compõem antes de publicar totais; manutenção repetida por serviços pode duplicar valores. `Valor Previsto` não comprova MRR. |
| Realizado | Só integração explícita com data permite reconhecimento no período. Assinado, em conferência, conferido e devolvido permanecem pendentes. Data de conferência e fechamento não substituem a data de integração. |
| Congelado | Preservar lista, valores, período e instante de referência do forecast oficial. A primeira carga atual não recupera o congelado do início do mês. |
| Movimentos | Comparar retratos compatíveis para identificar entrada, perda, postergação e mudança de valor. Ausência em uma exportação isolada não prova perda. |
| Contas | Contar contas e pedidos distintos conforme o indicador. Uma conta com várias oportunidades não vira vários novos clientes. |
| Diretoria | Validar o recorte por representante/filial. Unidade da oportunidade, grupo do proprietário e grupo criador são campos diferentes; Inside não pode ser incluído ou excluído pelo grupo do dono automaticamente. |
| Fonte | Preservar data da exportação e momento da carga. Zero, vazio, dado especial e dado desatualizado são situações distintas. Datas diferentes nas fontes ficam visíveis. |

A transcrição agrega necessidades concretas: acompanhar o congelado e o atual; destacar MRR; mostrar pendências por estado; expor previsões vencidas; reduzir preparação manual da Fabi; e permitir a Giovanne descer da filial à oportunidade. Relatos de fechamento em grupos de gestores são sinais de defasagem, não fatos de integração confirmada. Os números narrados na reunião não foram promovidos a controles reconciliados.

## Entrega local e limite operacional

A implementação desta etapa fica em `central-receita-sites`. Há dois seletores CSV/XLSX, validação, prévia, conferência por ID, registro das gravações locais e consultas provisórias de Forecast e New Name. Os filtros dessas consultas ficam na URL; representante e unidade têm recortes independentes. As demais áreas preservam a demonstração existente.

O armazenamento IndexedDB guarda apenas uma **prévia temporária, local e não autoritativa**. O histórico conserva até 20 registros de gravação; não guarda versões restauráveis nem comprova movimentos comerciais. A tela comunica esse limite. Nenhum serviço persistente, banco compartilhado, publicação, alteração no CRM ou integração externa foi criado.

**NÃO CONCLUÍDO para operação entre Fabi e Giovanne:** uma carga feita no computador de Fabi ainda não aparece no computador de Giovanne. O site atual é estático. A operação compartilhada exige armazenamento de servidor, acesso controlado e separação entre permissão de importar e de consultar. Esse passo precisa de decisão sobre o ambiente antes de transmitir dados reais.

## Critério para apresentar o piloto já rodando

1. Confirmar com Fabi a definição e a fonte de New Name, incluindo os casos contestados de novo CNPJ em conta existente.
2. Confirmar composição de MRR, regra de recorrência, data de integração e recorte das filiais da diretoria.
3. Disponibilizar armazenamento compartilhado e acesso controlado: Fabi importa; Giovanne lê a mesma carga. Manter uma versão anterior recuperável e registrar fonte, operador, referência e resultado de cada importação.
4. Obter uma lista oficial congelada, ou iniciar uma referência nova explicitamente datada. Preservá-la nas atualizações e reconciliar suas contas e valores.
5. Validar uma carga de ponta a ponta: valores e contas com Fabi, leitura com Giovanne, repetição sem duplicidade, falha sem perda da carga anterior e distinção entre realizado e pendente.

Até esses pontos estarem atendidos, apresentar a importação como prévia funcional local. Manter MRR, New Names validados, meta e forecast oficial como indisponíveis onde não há evidência suficiente. Cross, Upsell, visitas, demais métricas e integrações futuras permanecem na visão de evolução, sem ampliar automaticamente esta implementação.

## Verificação reproduzível

Comandos do checkout: `npm test`, `npm run typecheck`, `npm run build` e `git diff --check`. Os testes de importação usam registros sintéticos para validar vazio versus zero, datas especiais, grão de itens, classificação informada, IDs, reconciliação e carteira mensal. A leitura dos XLSX reais em navegador foi conferida por contagens e estados, sem imprimir contatos ou linhas comerciais.

A verificação de interface cobre seleção das duas fontes, bloqueio antes da revisão dos avisos, gravação, consultas, retenção após recarregar, carga repetida, referência corrigível, arquivo no seletor errado, leitura em Worker e preservação dos filtros na navegação. Foram corrigidos os dois achados concretos da revisão de código: etapa vazia entrando na carteira e impossibilidade de corrigir a referência de um arquivo idêntico. Não equivale a validação de uso simultâneo por usuários em computadores diferentes, integração oficial, leitor de tela ou certificação de acessibilidade.

## Retomada CSV — 15/10/2026

- Implementação local: parser CSV estrito no Web Worker; XLSX mantido; data de referência explícita; avisos agrupados; viewers recebem tela somente de consulta. Arquivos originais não são enviados nem armazenados.
- `npm run typecheck` e `npm run build` passaram. A suíte de testes não foi executada; uma exportação CSV real ainda precisa ser conferida com a Fabi.
- `backend/worker.js`, `db/schema.ts` e a migração inicial gerada estão preparados; `.openai/hosting.json` agora declara Worker+D1. A lista personalizada de viewers e as variáveis de identidade estão configuradas no Sites; D1 será provisionado e a migração aplicada quando a versão Worker for publicada.
- Próximo passo operacional requer OK textual para criar/vincular D1, aplicar schema, configurar identidades Fabi/viewers e publicar no Sites. A validação entre computadores ainda está pendente.
- A revisão visual viu Configurações, Forecast e New Name no IAB, mas as capturas não foram salvas como PNG. O servidor local está na porta 3011; após o build, a atualização automática do IAB foi bloqueada pela política do navegador.
