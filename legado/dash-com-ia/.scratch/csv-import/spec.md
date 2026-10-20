# Carga compartilhada de CSV e XLSX para New Name e Forecast

**Type:** task  
**Status:** implemented-locally; hosted activation pending explicit approval  
**Blocked by:** None

## Problem Statement

Fabi precisa importar as exportações do CRM uma vez e fazer os números atualizados aparecerem para Giovanni e leitores autorizados. O fluxo aceita XLSX localmente, não aceita CSV e ainda salva a prévia só no navegador de quem importou.

## Solution

Aceitar CSV em UTF-8 junto com os XLSX atuais. Processar ambos no Web Worker e passar as linhas ao normalizador atual. Depois da revisão de Fabi, salvar uma única versão confirmada no Worker/D1 do Site; leitores autorizados buscam a mesma versão. A prévia local fica restrita ao desenvolvimento. Não arquivar os arquivos originais.

## User Stories

1. Como Fabi, quero selecionar um CSV de oportunidades, para revisar a carteira na mesma prévia que já uso com XLSX.
2. Como Fabi, quero selecionar um CSV de pedidos, para conferir os pedidos e suas oportunidades pelo ID.
3. Como Fabi, quero que o importador reconheça CSV delimitado por vírgula ou ponto e vírgula, para usar exportações do CRM em português ou formatos CSV comuns.
4. Como Fabi, quero que aspas, aspas escapadas e quebras de linha dentro de uma célula sejam preservadas, para que delimitadores dentro de um valor não desloquem as colunas.
5. Como Fabi, quero que acentos e arquivos UTF-8 com ou sem BOM sejam lidos corretamente, para que os cabeçalhos continuem reconhecíveis.
6. Como Fabi, quero receber um erro claro quando o CSV tiver aspas inválidas, delimitador ambíguo ou codificação não suportada, para corrigir a exportação antes de salvar.
7. Como Fabi, quero que as mesmas regras de IDs, datas, valores, fontes e vínculos se apliquem a CSV e XLSX, para comparar os formatos sem mudar a semântica da leitura.
8. Como Fabi, quero que um arquivo inválido não substitua a prévia salva, para conservar a última carga revisada.
9. Como Fabi, quero que o sistema mantenha os limites de tamanho, linhas, colunas e tempo de leitura, para processar arquivos compatíveis sem travar a interface.
10. Como usuária da Central, quero continuar usando XLSX sem mudança na seleção, leitura ou prévia, para preservar o fluxo existente.
11. Como Fabi, quero que só a confirmação depois da revisão publique uma nova versão compartilhada, para evitar atualizar os números dos leitores com uma seleção ainda não conferida.
12. Como Giovanni ou outro leitor autorizado, quero ver a última versão confirmada ao abrir ou atualizar a Central, para usar os mesmos números que Fabi publicou.
13. Como leitor, quero ver quando e com qual referência a carga foi confirmada, para avaliar a atualidade dos números.
14. Como leitor sem permissão de importação, quero uma interface somente para consulta, para não receber controles que não posso concluir.
15. Como Fabi, quero que conflito ou falha de gravação preserve a versão anterior, para ninguém ver uma carga parcial.

## Implementation Decisions

- O contrato CSV usa os mesmos cabeçalhos das duas exportações XLSX descritas no piloto; não cria mapeamento automático de colunas.
- A codificação aceita é UTF-8, com ou sem BOM. A codificação inválida produz erro explícito.
- O delimitador é detectado pelo cabeçalho entre vírgula e ponto e vírgula; empate é rejeitado.
- O parser puro preserva campos vazios, suporta aspas duplas escapadas, delimitadores citados, quebras de linha citadas e CRLF/LF. Aspas malformadas são rejeitadas com posição, sem mostrar valores comerciais.
- CSV rejeita dados preenchidos além da largura do cabeçalho; células extras vazias podem ser ignoradas sem deslocar campos mapeados.
- CSV e XLSX convergem para o mesmo normalizador e o mesmo fluxo de revisão.
- Em operação compartilhada, a gravação usa o Worker no mesmo domínio e o binding D1 `DB`. A gravação mantém versões completas imutáveis em blocos, metadados e a revisão atual; o arquivo CSV/XLSX original não é enviado nem arquivado.
- A Fabi tem permissão de gravação. Giovanni e as demais pessoas autorizadas têm permissão de leitura. A lista exata de identidades e o acesso do Site precisam ser verificados antes da ativação.
- A prévia IndexedDB continua disponível em desenvolvimento local; a versão hospedada deve usar a carga compartilhada e informar erro se ela não puder ser lida ou salva, sem simular sucesso local.
- O campo de referência começa vazio; a pessoa que importa escolhe a data do retrato do CRM, sem assumir a data de hoje.
- A interface agrupa problemas por gravidade, código e campo. Como o parser guarda até 50 detalhes, grupos parciais são identificados como amostra e ficam separados das contagens do arquivo completo.
- O `GET` autenticado retorna a prévia e um booleano `canImport` derivado no servidor, inclusive antes da primeira carga, para que leitores recebam uma tela somente de consulta. O Worker continua autorizando cada `PUT` independentemente.
- Permanecem os limites atuais: arquivo até 15 MB, 50.000 linhas de dados, 100 colunas e 45 segundos de leitura.
- Nenhuma dependência nova ou regra de negócio de Forecast/New Name faz parte da entrega.
- A configuração, criação/vinculação do D1, aplicação do schema, permissões e publicação no Sites continuam fora do lote sem aprovação explícita. A implementação local prepara esses passos.
- A retenção atual mantém versões históricas completas sem expiração; a política precisa de revisão antes de uso sustentado.

## Testing Decisions

- Testes verificam o comportamento observável do parser e a normalização final, não detalhes do algoritmo.
- Cobrir os dois delimitadores, BOM, acentos, campos citados, aspas escapadas, quebras de linha, campos vazios, linha final sem quebra, sintaxe inválida, empate de delimitadores, codificação inválida e limites de coluna.
- Confirmar que CSV de oportunidades e pedidos produz os mesmos registros e contagens que a normalização recebe de uma matriz equivalente.
- Regressão usa os testes existentes de importação XLSX e do contrato do Shared Worker: autorização, revisão concorrente, leitura compartilhada, falha atômica e preservação da versão anterior.
- Validação do navegador cobre revisão e confirmação da importadora, leitura/freshness para leitores e erros visíveis quando o serviço compartilhado está indisponível.
- Validação em Site real é separada dos testes locais e só ocorre após aprovação e configuração do D1 e dos acessos.

## Out of Scope

- Arquivamento dos arquivos CSV/XLSX originais em R2 ou outra store.
- Alteração das regras de New Name, Forecast, MRR ou reconhecimento de receita.
- Mapeamento de cabeçalhos diferentes, importação de planilhas arbitrárias ou preservação do CSV original.
- Ativação ou publicação do Site, criação/aplicação de schema, alterações de acesso ou valores de ambiente sem aprovação explícita.

## Further Notes

O material disponível descreve duas exportações XLSX e não contém CSV de exemplo. A equivalência dos cabeçalhos e os testes com dados sintéticos precisam ser explicitados; a compatibilidade com uma exportação CSV real permanece não verificada até receber esse arquivo. A inspeção read-only do Site retornou zero bindings D1 e zero tabelas; a hospedagem estática atual não fornece a rota Worker necessária para compartilhar a carga.
