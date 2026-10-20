# Revisão de acesso e navegação — 15/10/2026

Site: https://central-vendas-visao-comercial.workspace-947623.chatgpt.site
Publicação verificada: versão 5, commit `38fb4706524a1428c8c74620725f3af7d6dec651`, ambiente 2.

## Falhas encontradas e reparos

- VERIFICADO: a sessão autenticada recebia 403 em `/api/imports/current`. O código comparava IDs de runtime com listas configuradas a partir do controle de acesso. A documentação do Sites distingue IDs próprios por Site de IDs de conta/convite. Corrigida autorização por e-mail fornecido pelo dispatcher, com ID obrigatório e listas explícitas; a audiência não mudou. Após publicação, a sessão IAB recebeu 200.
- VERIFICADO: Forecast/New Name substituíam todo o conteúdo por uma mensagem de acesso. Agora exibem título, estado de carga e ações de recuperação, consulta e demonstração explícita. Não há substituição silenciosa de cargas por exemplos.
- VERIFICADO: o nome fictício Giovanne aparecia como usuário atual. Substituído por identificação do cenário.
- VERIFICADO: no painel estreito o menu ocupava a primeira tela. Agora usa uma faixa horizontal com rolagem. Relatórios/Explorar eram controles desabilitados e foram retirados do menu.
- VERIFICADO: o SVG do gráfico usava proporção livre, distorcendo rótulos. Agora conserva proporção e adapta a altura.

## Percurso observado no IAB

| Passo | Área ou ação | Resultado | Captura |
| --- | --- | --- | --- |
| 1 | Forecast antes da correção | Erro de acesso; conteúdo ausente | 01-forecast-bloqueado.png |
| 2 | Configurações após correção | Consulta autorizada; sem carga confirmada | 03-configuracoes-corrigido.png |
| 3 | Visão Executiva | Navega e exibe cenário identificado | 14-home-estavel.png |
| 4 | Jornada | Navega e exibe conteúdo | 05-journey.png |
| 5 | Sistema de Receita | Navega e exibe conteúdo | 06-system.png |
| 6 | Oportunidades | Navega e exibe conteúdo | 07-opportunities.png |
| 7 | Contas | Navega e exibe conteúdo | 08-accounts.png |
| 8 | Cross | Navega e exibe exemplos | 09-cross.png |
| 9 | Forecast compartilhado | Estado vazio com ações; sem erro de acesso | 10-forecast.png |
| 10 | Forecast demonstração | Renderiza; período, solução e filial preservam demo; retorno remove demo e preserva filtros | 11-forecast-demo-filtros.png |
| 11 | New Name compartilhado | Estado vazio com ações | 12-new-name.png |
| 12 | New Name demonstração | Renderiza cenário identificado | 13-new-name-demo.png |
| 13 | Cross → Indústria Kappa → voltar | Detalhe abre; navegador retorna à lista Cross | 15-detalhe.png |

Captura 04-home.png rejeitada para aceitação visual: corte durante a captura após redimensionamento; substituída pela 14 estável, sem corte. Captura 02 não usada como evidência de Configurações, pois ainda mostrava o estado anterior durante a navegação.

## Verificações e limites

- PASS: 27 testes; typecheck; build de produção; publicação concluída.
- VERIFICADO: GET autenticado 200; estado vazio confirmado na UI. Nenhuma carga foi criada para esta revisão.
- VERIFICADO em laboratório: leitor não grava; importadora grava; e-mail desconhecido, identidade ausente e `X-User-*` não concedem acesso.
- NÃO VERIFICADO: login de Fabi, carga real e leitura por Giovanni em outra sessão; navegação por teclado e leitores de tela completos.
- Risco de compreensão: Home, contas, oportunidades, detalhes e demais áreas continuam usando o cenário fixo; somente Forecast/New Name consultam cargas compartilhadas. A interface agora informa esse limite. Não tratar valores demonstrativos como resultado de CSV.
- O exame de contraste e foco não foi uma certificação de acessibilidade. A rolagem horizontal do menu compacto ainda exige avaliação com teclado e dispositivos reais.
