Encontrei 25 reuniões na busca por “painel + Nolasco”. A reunião correta é Apresentação Nolasco, realizada na sexta-feira, 18 de setembro de 2026, organizada por Marlus Moraes. Ela foi transcrita, você participou, e Márcio Nolasco conduziu a demonstração do painel/CRM que construiu. Abaixo está a transcrição analítica mais detalhada, já organizada para você usar como base de um painel mais evoluído.

1. Problema que originou a solução

Márcio Nolasco explicou que a solução não nasceu como um projeto de CRM completo. Ela começou para resolver problemas operacionais na montagem de orçamentos:

Alterar descontos exige navegar produto por produto e tela por tela.
Aplicar desconto em serviço também exige intervenção individual.
Executivos enviavam propostas de formas diferentes, como apresentação, e-mail ou outros formatos, sem padronização.
Era difícil comparar o contrato atual do cliente com uma proposta de upgrade e visualizar a mensalidade final.
A geração e a comparação de versões de orçamento eram trabalhosas.

A primeira resposta foi um simulador de orçamento, criado a partir dos HTMLs dos produtos. Nolasco utilizou IA para interpretar os arquivos e gerar uma estrutura de orçamento. Depois, adicionou:

Contrato atual do cliente;
Comparação entre contrato atual e upgrade;
Mensalidade final projetada;
IPO;
Planilha global;
Condições comerciais;
Saída da proposta em PPT e HTML para envio por e-mail.

A intenção era criar um padrão comercial e permitir que o executivo percorresse o orçamento de ponta a ponta em um único ambiente.

2. Segunda dor: forecast

Depois do orçamento, Nolasco passou a atacar o acompanhamento do forecast. As perguntas que ele queria responder eram:

O que foi congelado?
O que foi congelado sem valor?
Quais produtos aparecem mais ou menos no forecast?
O que estava previsto e efetivamente entrou?
O que entrou sem estar inicialmente previsto?
Como o forecast se comporta por executivo e por conta?

Segundo ele, essas análises dependiam de extrações constantes do CRM e tabelas dinâmicas. O protótipo passou a importar pedidos e oportunidades e comparar:

Congelado versus realizado;
Dentro versus fora do congelamento;
Entradas adicionais não previstas;
Movimentações posteriores ao congelamento;
Vendas do mês que não participaram da fotografia oficial do forecast.

Foi essa expansão gradual, de orçamento para forecast e depois oportunidades, que terminou formando o CRM demonstrado.

3. Estrutura geral do sistema

A estrutura apresentada possuía autenticação própria por usuário e senha, ainda sem SSO. O ambiente foi dividido em:

Painel do executivo

Um ponto de entrada para o trabalho diário, reunindo:

Metas e apuração individual;
Metas da filial;
Metas dos gestores;
Clientes;
NPS;
Referências;
Compromissos do CRM;
Oportunidades;
Oportunidades por módulo;
Atas e compromissos.
Cadastros gerais

O sistema permite manter:

Logos da Senior;
Imagens dos clientes;
Imagens dos executivos;
Estrutura das equipes;
Produtos e módulos;
Tabelas de preço;
Usuários;
Perfis de acesso;
Histórico;
Backup da base.
Importação de dados

A carga ainda é majoritariamente manual, por arquivos exportados. Foram citadas como fontes:

Planilha de clientes;
Recorrência;
Oportunidades;
Oportunidades por módulo;
Pedidos;
Contas;
Compromissos;
Contatos;
Ativações de recorrência;
NPS;
Churn;
Municípios do IBGE;
Clientes de referência.

O usuário arrasta os arquivos para a área de importação, e o sistema atualiza a base local.

4. Jornada comercial guiada

Nolasco criou uma jornada “da conta ao pedido”, formando um rito comercial. O executivo começa escolhendo uma conta e uma oportunidade.

A evolução entre etapas contém verificações obrigatórias. Antes de avançar de proposta para negociação, por exemplo, o sistema verifica se foram tratados:

Previsão;
Condução da oportunidade;
Descontos;
Registros no CRM;
Pendências necessárias para a próxima etapa.

Se as condições não estiverem atendidas, a lógica proposta é impedir o avanço e orientar o executivo a retornar e concluir as pendências. Essa parte ainda estava em construção.

Também foi apresentada uma visão do mês do executivo com:

Previsões dentro e fora da régua;
Carteira com cobertura travada;
Espaços em branco por produto;
Contas e grupos sem movimentação;
Negócios que precisam avançar ou sair do forecast;
Ações direcionadas para grupos que ficaram sem contato.
5. Analytics de pipeline e território

O painel de pipeline foi uma das áreas mais desenvolvidas.

Funil

O painel separa os funis privado e público e permite abrir as oportunidades em cada estágio:

Fechadas e ganhas;
Fechadas e perdidas;
Em negociação;
Em proposta;
Outras etapas do pipeline.

Na demonstração, o painel exibia 39,3% de taxa de ganho sobre as oportunidades decididas. Como esse número veio da base carregada no protótipo, ele precisa ser validado antes de ser usado como indicador oficial.

Navegação da oportunidade

Ao selecionar uma oportunidade, o usuário pode avançar para:

Orçamento;
Contrato;
Condições de pagamento;
Negociação;
IPO;
Alçada global;
Análise de viabilidade;
Contrapropostas;
Proposta final.
Viabilidade

A análise de viabilidade contempla:

Fluxo de caixa;
Faturamento mensal;
Licença;
Habilitação;
Serviço mensal;
Custos por mês;
Saldo acumulado;
Custo versus rentabilidade;
Margem;
Custo de SaaS;
Comparação entre proposta original e contraproposta.

Ao final, o sistema gera uma proposta em HTML ou PPT e retorna o executivo ao ponto do pipeline em que estava.

6. Mapa territorial

Foi criado um mapa de Minas Gerais com posição comercial por região e município. O painel permite analisar:

MRR contratado;
Quantidade de contratos;
Oportunidades ativas;
Tamanho das oportunidades;
Contas sem oportunidade;
Carteira por executivo;
Pipeline ativo por executivo;
Forecast de MRR;
MRR vendido por origem;
New name, cross-sell e upsell/base;
Visitas por executivo;
Resultado por praça.

Na demonstração, Nolasco mencionou R$ 236 mil de MRR em uma concentração regional e 2,38 no forecast de MRR, com 688 realizados, mas a unidade e a escala desses dois últimos números não ficaram explicitadas na transcrição. Portanto, não devem ser reutilizados sem reconciliação com a fonte original.

O painel também revelou cidades duplicadas ou separadas incorretamente, provavelmente por problemas de cadastro no CRM. Isso foi registrado como necessidade de correção da qualidade cadastral.

7. Painel de time e desempenho

O painel de time foi pensado para acompanhar:

Remuneração variável;
Resultados trimestrais;
Recorrente;
Não recorrente;
Serviços;
Resultado absoluto;
Resultado ponderado;
Metas mensais e trimestrais;
Evolução de janeiro a junho;
Projeção de julho a setembro;
Carteira, visitas e contas por executivo;
Resultados por natureza da venda.

As naturezas citadas foram:

Venda na base;
Sistema adicional;
Upgrade;
New name;
Migração;
Cross-sell;
Redução;
Ampliação;
Serviços.

Cada executivo possui um cartão com atingimento, carteira, visitas, MRR, pipeline aberto e oportunidades.

8. Cross-sell e espaço em branco

A solução distingue:

Cross-sell aberto;
Cross-sell ganho;
Cross-sell que deveria estar com o time Hunter;
Potencial comercial em aberto;
Potencial endereçável;
Cobertura do portfólio;
Produtos já contratados;
Produtos com oportunidade ativa;
Produtos que podem ser retomados;
Produtos sem avaliação.

A visualização do espaço em branco utiliza estados visuais, como:

Contratado;
Oportunidade ativa;
Perdido há mais de 12 meses e passível de retomada;
Perdido há menos de 12 meses;
Concorrente mapeado;
Sem caminho atual;
Não avaliado;
Em estudo.

Ao identificar um produto possível, o sistema pode preparar a abertura da oportunidade, preenchendo dados iniciais e benefícios esperados. Quando a resposta é “não é para agora”, a intenção é exigir o registro do motivo.

O sistema também estima o MRR potencial com base em:

Média de preço do produto;
Histórico de precificação do executivo;
Região;
Oportunidades existentes;
Espaços ainda não ocupados.

Nolasco alertou, porém, que a estimativa ainda não possui parâmetros suficientes de descontos, pois essa informação não está estruturada adequadamente no CRM.

9. Linha do tempo do executivo

Foi demonstrada uma linha do tempo capaz de contar a história profissional do executivo:

Entrada no time;
Primeira visita;
Primeira venda;
Melhor resultado;
Novos produtos vendidos;
Migrações;
Cross-sell;
Meses de maior resultado;
Reconhecimentos e conquistas.

A mesma lógica poderia ser aplicada à história de:

Um executivo;
Uma conta;
Uma oportunidade.

A linha do tempo possui metas e realizados mensais, visitas dos últimos seis meses e uma síntese de carreira, incluindo:

Licenças vendidas;
Serviços vendidos;
MRR acumulado;
Contas vendidas;
Carteira atual;
Taxa de ganho;
Meses de atingimento;
Quantidade de visitas;
Produto mais vendido;
Praça de maior atuação.

A navegação apresentava saltos irregulares durante a demonstração e precisa ser corrigida.

10. Limitação crítica: atividades do CRM

A solução ainda não consegue incorporar adequadamente as ações comerciais do CRM porque, segundo Nolasco, a exportação de ações não traz de forma clara a oportunidade ou a conta relacionada.

Consequência: o painel só utiliza visitas como aproximação da atividade comercial e não consegue reconstruir toda a atuação do executivo.

A necessidade técnica é identificar, no banco do CRM, as chaves que relacionam:

Atividade;
Oportunidade;
Conta;
Executivo;
Data;
Tipo de interação;
Resultado da interação.

Essa é uma das lacunas mais relevantes caso o objetivo seja construir um painel de produtividade comercial real, e não apenas de resultados.

11. Forecast detalhado

O módulo de forecast apresentou:

Meta;
Previsto;
Vendido;
Congelado;
Projeção ajustada;
Resultado da filial;
Meta de new name;
Resultado de cross-sell;
Contas abertas no pipeline;
Oportunidades incluídas na fotografia;
Oportunidades vendidas fora da fotografia;
Movimentações depois do congelamento;
Postergadas;
Perdidas;
Ainda congeladas;
Assertividade;
Histórico de versões;
Detalhamento por oportunidade;
Detalhamento por módulo;
Oportunidades sem valor;
Reconhecimentos.

Na demonstração de setembro, o painel mostrava:

121% de atingimento previsto do time de novos;
R$ 31 mil vendidos;
R$ 92 mil ainda congelados;
R$ 123 mil previstos;
Meta de R$ 101 mil.

Foi apontada uma pendência para automatizar as metas de novos negócios, incluindo a meta de Fred. Também faltava incorporar reconhecimentos atribuídos a outro executivo fora da política padrão.

12. Gestão de área

A visão gerencial consolida alertas como:

Oportunidades paradas há mais de 20 ou 21 dias;
Previsão vencida;
New name sem oportunidade;
Contas sem contato;
Grupos sem oportunidade por mais de um ano;
Grupos sem compra há mais de dois anos;
Prospecção sem abertura de oportunidade.

O gestor pode alternar entre visão do time e visão individual. Cada executivo apresenta:

Meta;
Realizado;
Projeção;
Valor faltante para a meta;
Oportunidades vencidas;
Compromissos ausentes;
Contas sem contato;
Resultado com e sem descontos.

Nolasco demonstrou uma simulação segundo a qual determinada executiva tinha 182% de atingimento em serviços, poderia chegar a 228% sem descontos ou 205% se todos os negócios tivessem somente 10% de desconto. Isso mostra uma funcionalidade interessante de análise do impacto de desconto sobre atingimento, mas a regra precisa ser validada antes de virar indicador oficial.

13. Clientes, grupos econômicos e visão 360°

A solução tenta resolver a divergência entre “clientes”, “contas” e “grupos econômicos”.

Na base demonstrada:

Havia 459 grupos econômicos;
Havia 246 contas independentes;
Os valores recorrentes estavam conciliados com a origem utilizada por Nolasco.

A ficha de cada grupo reúne:

Código do grupo;
Quantidade de contas;
Contas principais;
Responsável;
MRR contratado;
Produtos;
Oportunidades;
Histórico do funil;
Executivo;
Valores por produto e módulo;
Cobertura do portfólio;
Penetração;
Espaços em branco;
Candidatos à migração;
Potencial de manutenção futura.

Da ficha do cliente é possível navegar novamente até oportunidade e orçamento.

14. Churn, NPS e clientes de referência

O painel de churn permite analisar:

Churn mês a mês;
Comparação de 2025 e 2026;
Motivo da perda;
Origem da decisão;
Concorrente;
Segmentação;
Executivo responsável;
Ramo de atividade;
Principais perdas.

No NPS, o painel distingue:

Detratores;
Neutros;
Promotores;
Promotores que ainda não são clientes de referência;
Grupos que precisam de plano de ação.

Existe também uma busca de clientes de referência por porte, ramo, aderência e nome, mas Nolasco declarou que essa busca ainda não estava satisfatória.

15. Reuniões e atas

Nolasco mostrou uma função ainda em desenvolvimento para registrar reuniões. A proposta é:

Selecionar o tipo de reunião;
Carregar um TXT, DOCX ou outro documento;
Transformar o conteúdo em registro estruturado;
Gerar uma ata;
Preparar a ata para envio ao cliente.

Ele afirmou explicitamente que essa funcionalidade ainda não estava 100% pronta.

16. Agenda comercial automática

A evolução desejada é transformar a tela inicial do executivo em uma agenda priorizada. O sistema deveria apresentar automaticamente:

Oportunidades vencidas;
Oportunidades que vencerão nos próximos dias;
Pendências acumuladas;
Próximas ações necessárias;
Itens mínimos do dia;
Riscos de atraso.

Nolasco também começou a calcular o tempo médio entre abertura e fechamento por tipo de oportunidade:

Serviço;
MRR;
Upgrade;
Outras naturezas.

O objetivo é usar o ciclo histórico como referência operacional. No exemplo, se uma oportunidade de upgrade costuma levar três dias, o sistema passaria a cobrar ações dentro desse intervalo.

17. Riscos e limitações explicitados
Elefante branco

Nolasco reconheceu que, se continuar ampliando o protótipo sem integração, ele pode se tornar um sistema grande, pesado e difícil de manter.

Dados offline

Como a solução está na máquina dele e depende de arquivos, ela não opera em tempo real.

Dupla operação

O executivo receberia a orientação no painel, mas ainda precisaria realizar a ação no CRM. Depois seria necessário exportar e importar novamente os dados.

Dependência individual

A manutenção, atualização e conhecimento estão concentrados em Nolasco.

Regras comerciais

GPS e QIC têm regras específicas que precisam ser documentadas antes da integração.

Segurança e acesso

Há autenticação própria e perfis em construção, mas não há SSO nem integração corporativa demonstrada.

Qualidade dos dados

Foram identificadas falhas de cidades, vínculos de atividade, metas ausentes e parâmetros insuficientes de desconto.

18. Direção proposta na reunião

Marlus Moraes reconheceu como principal ganho a reunião de informações dispersas e a facilidade de uso em comparação com o CRM atual. A direção proposta foi conectar a iniciativa ao trabalho com a TIC, avaliar tecnicamente o protótipo e entender o que poderia ser produtizado para o time como um todo.

A arquitetura sugerida por Nolasco foi:

Conectar a solução à base de homologação do CRM;
Manter inicialmente GPS/QIC como estão;
Criar uma camada de visualização e operação mais simples;
Usar o módulo de orçamento como camada separada;
Simular múltiplas versões de proposta;
Comparar rentabilidade para a Senior e valor para o cliente;
Após aprovação, enviar apenas o resultado final ao GPS;
Tratar a integração mais profunda com GPS como fase posterior.
19. Pendências objetivas extraídas da reunião
Disponibilizar uma base de homologação do CRM para avaliação da TIC.
Documentar as regras de GPS/QIC.
Obter e carregar as metas de novos negócios, incluindo a meta de Fred.
Corrigir cadastros de cidades.
Ajustar a navegação da linha do tempo.
Melhorar a busca de clientes de referência.
Incluir reconhecimentos fora da política padrão.
Concluir a agenda automática do executivo.
Calcular ciclo médio por tipo de oportunidade.
Identificar no banco o vínculo entre atividades, contas e oportunidades.
Avaliar SSO, perfis, segurança, hospedagem e atualização automática.
Validar os números e regras do protótipo antes de qualquer uso corporativo.
Minha leitura para o painel evoluído

O principal aprendizado não é copiar todas as telas. O diferencial do protótipo está em unir quatro camadas:

Decisão: o que requer atenção agora.
Diagnóstico: por que exige atenção.
Ação: o que o executivo deve fazer.
Execução: permitir realizar ou registrar a ação no próprio fluxo.

Um painel apenas informativo repetiria o problema atual. O modelo mais forte seria um cockpit comercial orientado a ação, com:

Resumo do dia;
Alertas priorizados;
Forecast e desvios;
Carteira e espaço em branco;
Oportunidades e próxima ação;
Conta 360°;
Simulador comercial;
Qualidade dos dados;
Histórico e auditoria.

Principal risco: tentar incorporar orçamento, CRM, BI, agenda, gestão de carteira, NPS, churn, remuneração e atas numa primeira versão. Isso reproduziria o “elefante branco” citado na própria reunião.

Próximo passo recomendado: antes de desenhar telas, definir qual decisão o painel precisa melhorar primeiro. Minha sugestão, baseada na reunião, é começar pelo fluxo“prioridades do executivo hoje + forecast + próxima ação por oportunidade”. Essa parte concentra valor operacional, tem uso diário e permite validar integração e qualidade de dados antes de ampliar o escopo.

Internet: não foi consultada. A resposta foi sustentada pela transcrição interna de Apresentação Nolasco e pela busca nas reuniões do Microsoft 365.