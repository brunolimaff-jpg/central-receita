# ADR-0004: Fluxo contínuo com scrollspy; New Name, Cross e Loss separados

**Status:** aceita (vinculativa — emenda do dono ao plano da revisão geral, 29/09/2026)

## Contexto

O plano do debate propôs 4 "destinos" de navegação (páginas) e um bloco combinado "Cross + Perdas". O dono rejeitou ambos.

## Decisão

- O produto é **UMA página-longa percorrida por scroll**; o indicador lateral é **âncora clicável + marcador de posição** (scrollspy). "Posso tanto clicar como scroll down e passar por todas — assim é mais prático."
- **New Name, Cross e Loss são blocos separados** no fluxo: "Cross é métrica importante, deve ser em separado; o loss também".
- Drill (oportunidade, pedido, origem, ficha de conta/grupo) continua em **subtela com volta à posição exata**.

## Consequências

Sem rotas por seção; navegação por query string continua na rota única; a ordem do fluxo é a de leitura (e a ordem no mobile de 1 coluna).
