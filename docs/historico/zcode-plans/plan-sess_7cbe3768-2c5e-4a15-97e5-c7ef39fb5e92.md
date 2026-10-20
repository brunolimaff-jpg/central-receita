# Digestão do acervo Copilot/Criado pelo 5.3-Flash

**Objetivo:** extrair do acervo (755 arquivos, 142 famílias em `Documentos/Copilot/Criado`) os princípios de produto que alimentam a Central de Receita — cockpit proativo, sinais por conta, assistente no contexto, RevOps agêntico — e consolidar num documento rastreável.

## Fase A — Triagem (1 agente flash)
- Deduplicar por família (ex.: "Analise_Loss_GRS_Final 2–21" = 1 família) e eleger a **versão final de cada** (mais recente por data de modificação).
- Classificar: produto (pilotos Scout 360), método (playbooks, Raio-X), estratégia (Planta Baixa RevOps/agentic), análise (Win-Loss, Loss GRS), comunicação (transcrições, tom de voz), descartável (`cb_page*`, `retrieved*`, `viz_*`, ícones).
- Saída: lista `família | versão eleita | caminho | por que importa (ou descartado)`.

## Fase B — Leitura profunda (4 agentes flash em paralelo, um por bloco)
1. **Scout 360 pilotos** (v4/v5/v10-jornada-assistente, conversa-v3, sinais-v2, toda-conta-deixa-sinais): o que é o produto, princípios, o que o assistente faz, sinais por conta.
2. **Método comercial** (Playbook Scout-GD versão final + Raio-X 360 + Biblioteca/Fichas): primeira camada de análise, o que o vendedor/líder usa, formatos.
3. **Estratégia RevOps** (Planta Baixa 2025-2026 + agentic_revops PDF + ap07_priorizacao_lacunas): jornada comercial, onde a Central se encaixa, lacunas comprovadas.
4. **Análises e evidência** (ciclo_1_win_loss_new_name.pdf + 1 versão final do Loss GRS xlsx — estrutura e conclusões, não 617 arquivos) + transcrições/tom de voz (formato executivo).

Extração técnica (read-only, pelos agentes): HTML lido direto; DOCX/PPTX/XLSX via `unzip -p … document.xml/slide*.xml` (texto puro); PDF via node + pdf.js `getText()` (reusando os arquivos já baixados no temp). Imagem pura sem texto = NÃO VERIFICADO visual (inspeção seletiva fica com o principal).

## Fase C/D — Consolidação + crítica (2 agentes flash)
- Consolidador grava `Dash com IA/docs/design/acervo-copilot-sintese.md`: famílias, princípios de produto, **conexões explícitas com a Central** (cockpit/sinais/agente/proatividade), lacunas, conflitos — toda afirmação com arquivo+versão de origem.
- Leitor crítico (contexto limpo) aponta confusão, afirmação sem fonte e pergunta que o plano novo vai precisar; consolidador corrige.

## Fase E — Principal (GLM-5.3)
- Cruza a síntese com o plano v2 e a Fase 1.5 em andamento; atualiza o roadmap (plano v3: o que o acervo muda no cockpit, nos sinais e no assistente) e apresenta a você.

## Regras e limites
- Ler SÓ a versão final de cada família (nunca as 21 cópias); máx. ~600 palavras por frente; NÃO ENCONTRADO/NÃO VERIFICADO explícitos; nada de conteúdo comercial sensível além da síntese local.
- Acervo intocado: nenhum arquivo do Copilot/Criado é movido, editado ou apagado.
- A Fase 1.5 (cockpit) em andamento não é bloqueada: a síntese a alimenta na sequência.
- Gates: síntese com rastreio de origem; leitura crítica independente; fechamento pelo principal.