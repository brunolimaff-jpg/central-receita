# Briefing da Diretoria — contrato visual

## Objetivo

Transformar o Briefing em uma leitura executiva visual. A primeira passada deve mostrar resultado, Forecast, mudança recente e onde a liderança pode agir. Texto serve para rótulo, fonte, regra e limitação; não substitui o sinal visual.

## Caminho de leitura

1. **Resultado e projeção do mês:** PEX mostra Ganhas no mês e abertas elegíveis como parcelas distintas. O total é um indicador comercial do fixture, não receita reconhecida.
2. **Mudança de Forecast:** comparação direta da janela móvel entre a leitura anterior e a atual, com horizonte 30/60/90 dias.
3. **New Name e Cross / Up Sell:** para cada categoria, comparar entradas criadas no mês, Ganhas no mês, perdas por quantidade e oportunidades abertas com previsão no mês. O valor aberto usa `valor_previsto`; o valor Ganho usa `valor_fechado`.
4. **Pipeline por etapa:** valores e quantidades de etapas abertas, separados por funil privado e público. Não chamar a distribuição de conversão ou de taxa de avanço.
5. **Atenção e agenda:** tamanho do impacto, quantidade de oportunidades e próxima ação; exemplos e fonte permanecem disponíveis no detalhe.

## Regras de visualização

- Direção de arte Senior Emerald Liquid já adotada: superfícies claras, verde Senior focal, azul neutro para comparação e âmbar/vermelho somente para atenção e perda. Não usar cor como único identificador.
- Gráficos com valores rotulados diretamente. O hover é complementar. Incluir resumo/tabela acessível com as mesmas medidas e limitações.
- Usar cartões shadcn e os componentes Recharts já instalados. Sem dependência nova, fundo atmosférico ou animação decorativa.
- No mobile, empilhar gráficos com a projeção e o resultado primeiro; controles ficam recolhidos, sem empurrar a evidência principal para baixo.

## Interação

- Horizonte do Forecast: 30, 60 ou 90 dias, refletido no recorte existente da URL.
- Escala de todos os visuais: controles −/+ entre 80% e 130%, em passos de 10%, com indicador visível e restaurar padrão. Barras e área de gráfico aumentam; rótulos não encolhem.
- Densidade: `Executivo` (resumo e três itens prioritários) ou `Completo` (todas as etapas/filas e detalhes existentes). O modo completo preserva CTAs, proveniência e simulações locais.
- Escala e densidade são preferências temporárias da tela, sem escrita em banco, `localStorage` ou compartilhamento na URL.
- Teclado, toque, foco visível e `prefers-reduced-motion`; todo controle tem nome acessível e alternativa sem hover.

## Evidência, fontes e limites

- Fontes: endpoints locais `/api/visao`, `/api/mudancas` e `/api/agora`, calculados sobre o fixture sintético.
- PEX conserva a regra documentada já implementada: etapa/tipo observados compatíveis, probabilidade ≥75%, previsão no mês; Ganhas usam fechamento efetivo no mês e `valor_fechado`.
- New Name / Novo Cliente e Cross / Up Sell entram apenas quando o rótulo exato está mapeado como observado ou autorizado no briefing anterior. “Aberta com previsão no mês” é uma leitura de fila e não afirma elegibilidade PEX.
- Entrada no mês usa `criada_em` no fuso da competência; Ganho/Perda usam `fechamento_efetivo`. Sem valor fechado permanece sem valor; não substituir por previsão.
- Não há meta certificada neste fixture. Não exibir atingimento de meta, receita reconhecida ou causalidade como se fossem medidos.
- Estado vazio, erro parcial, atraso e atualização continuam explícitos. O último snapshot mostra sua data.
- A soma do pipeline representa a carteira completa em qualquer densidade; Executivo só limita as linhas visíveis.
- Horizonte, escala e densidade permanecem acessíveis quando uma leitura falha parcialmente.
- Enquanto os endpoints buscam o recorte escolhido, um aviso nomeia o recorte e esclarece que os valores visíveis podem vir do anterior.
- Nome e percentual do slider precisam alcançar o thumb focável que tem `role="slider"`.

## Aprovação e referência

O usuário autorizou converter o Briefing para uma experiência visual executiva mantendo a direção do mock `central-receita-agentic.html`. O HTML não está no checkout ativo nesta retomada; a implementação preserva a direção e os conceitos aprovados, sem alegar paridade pixel a pixel com o arquivo ausente.
