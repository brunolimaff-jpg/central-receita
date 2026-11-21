# Auditoria — exposição, coerência e completude

Data: 10/11/2026, America/Cuiaba. Revisão local e consultas HTTP públicas somente leitura.

**Veredito: PRECISA AJUSTES / NÃO LIBERAR COMO PACOTE INTEGRALMENTE SINTÉTICO.** Testes e compilação passam; isso não fecha privacidade, contrato de indicadores ou completude funcional. Nenhuma correção de aplicação, merge, push, deploy, migração ou envio ao Planejador foi feito nesta revisão.

## Escopo e limites

- Projeto confirmado: checkout `central-receita-cloudflare`, branch `local/cloudflare-a19b386`, HEAD `f9fbff04a8a2903741521a37ebe0431c02c7ce55`.
- Base fixa: `a19b38627a8db5fc27ca53e89bc131f49f015a3d`. `git diff a19b386...HEAD`: 6 arquivos, 11 commits; árvore inicialmente limpa.
- Dois eixos independentes de review (Standards e Spec), mais auditoria de privacidade. Os três revisores trabalharam somente leitura. Lead repetiu testes e reproduções críticas.
- Inspeção do pacote recém-gerado: 118 arquivos, 2.620.395 bytes, SHA-256 de todos confere. HTML/JS da homologação pública também consultados sem cookies ou credenciais.
- Esta auditoria substitui a conclusão ampla de que “o restante está verificado” do [retorno anterior](2026-11-10-baseline-cloudflare.md#L98-L100). Não substitui decisões de produto do Bruno.
- Não houve auditoria exaustiva de todas as imagens/documentos históricos, vulnerabilidades de dependências, dados corporativos de origem ou operação produtiva.

## 1. Segurança e privacidade

### S1 — ALTO: planejamento e identidades acessíveis no endereço público

**VERIFICADO:** [org-2027.ts](../../src/features/comercial-v3/org-2027.ts#L1-L9) identifica o conteúdo como estrutura proposta para 2027 e base de MRR declarada em slides; não como números gerados pela carga sintética. Há pessoas/cargos, valores de planejamento e segmentação no módulo. A interface importa esse módulo no pacote visual.

- A homologação pública respondeu HTML 200; seu chunk de aplicação respondeu 200 **sem autenticação**, contendo nomes, rótulos do planejamento e valores correspondentes à fonte. Uma fotografia da categoria `pessoas` respondeu HEAD 200, `image/jpeg`.
- Endereço examinado: https://central-receita-visual.brunolimaff.workers.dev . Não se copiam aqui nomes ou números do planejamento.
- O pacote local inclui **16 JPG** da categoria de pessoas. O revisor comparou hashes: os 16 são idênticos aos arquivos-fonte rastreados. O conteúdo visual de cada fotografia não foi examinado nesta rodada.
- [build-visual.mjs:19–34](../../scripts/build-visual.mjs#L19-L34) copia todo `out` e só veta caminhos e marcadores específicos da fonte de filiais. O alias em [next.config.ts:10–14](../../next.config.ts#L10-L14) substitui somente essa fonte. O manifesto, mesmo assim, declara `data: synthetic`.
- **Contraprova/limite:** existia autorização anterior para exposição pública de demonstração e uso de fotos. Isso não permite concluir automaticamente que os valores de planejamento estejam autorizados nem que as fotos sejam um vazamento novo. A exposição é comprovada; seu caráter indevido e a classificação de confidencialidade precisam ser reconciliados com a autorização efetiva.

**Ação recomendada:** priorizar decisão de contenção e inventário explícito do conteúdo permitido. Não basta ocultar cards: quem baixa o JavaScript obtém o conteúdo. Restringir acesso ou republicar requer autorização textual do Bruno; nada foi alterado remotamente.

### S2 — ALTO condicional: a portaria é apresentação, não autenticação

**VERIFICADO:** [regra da portaria:4–11](../../src/features/comercial-v3/tela-bloqueio.ts#L4-L11) assume que não é controle de acesso. A liberação é local no navegador e a regra é entregue no próprio JavaScript. O teste “a tela não promete segurança” só lê comentário do módulo ([teste:66–69](../../tests/tela-bloqueio.test.mjs#L66-L69)); não verifica o texto efetivamente mostrado ao visitante.

**INFERÊNCIA:** combinada com dados de planejamento, a aparência de credencial pode gerar falsa expectativa de proteção. Não é descoberta de quebra de autenticação: autenticação real não foi implementada nessa portaria. `noindex` e CSP não tornam os assets privados.

### S3 — ALTO se ativado fora do Sites: identidade do backend depende do dispatcher

**VERIFICADO no código/teste local do revisor:** [worker.js:366–391](../../backend/worker.js#L366-L391) aceita os cabeçalhos permitidos pelo dispatcher sem assinatura. Em memória, cabeçalho inventado mas presente na allowlist retorna 200; ausência 401, não autorizado 403, sem allowlist 503. A [documentação:19–25](../../backend/README.md#L19-L25) reconhece a fronteira e exige bloquear URL direta.

**Contraprova:** o pacote visual auditado não contém backend/D1 nem endpoints de importação. Esta auditoria não encontrou uma exploração do backend na homologação visual. Rotas, listas e proteção do backend Sites em runtime: **NÃO VERIFICADO**; não publicar esse backend diretamente em Cloudflare.

### S4 — MÉDIO: backup de Git rastreado e proteção preventiva incompleta

**VERIFICADO:** 172 arquivos rastreados no backup de Git preexistente; 148 objetos. O revisor examinou 124 blobs históricos e 2 commits alcançáveis. A [.gitignore](../../.gitignore#L1-L12) não cobre `.env` nem esse formato de backup.

- **NÃO ENCONTRADO:** `.env` rastreado e correspondências nos padrões de tokens/chaves/URLs credenciadas examinados.
- **Contraprova:** o pacote visual não inclui a raiz nem o backup. Repositório privado e assets públicos são superfícies diferentes.
- Remover backup/histórico é operação separada, requer análise e autorização; nenhum arquivo foi excluído.

### Superfície de saída examinada

**VERIFICADO no pacote local:** zero marcadores de endpoints `/api/imports/`, `D1Database`, source maps, arquivos `.env`/SQL/CSV/XLSX e padrões de tokens examinados; zero referências aos marcadores da fonte comercial de filiais bloqueada. Recursos observados no browser vieram só da origem local. Esses resultados **não** demonstram ausência universal de informação sensível, como S1 comprova.

**VERIFICADO:** `/api/imports/current`, `/api/imports/previous`, `/.env` e `/.git/config` deram 404 no preview. Site público entrega CSP, noindex, no-referrer e nosniff. Preview local só entrega CSP/noindex: diferença de headers, não vazamento comprovado.

**Dispatch anterior:** nenhum listener nas portas 8787/8788/8789 no momento examinado. O [servidor temporário:29–44](../../../central-receita-sites/.scratch/planejador-20261110/server-retorno.mjs#L29-L44) usa CORS `*`: não reativar com conteúdo sensível. A aba do Planejador ainda tinha 4.362 caracteres em `window.name`; compositor visível vazio. Só o tamanho foi lido; conteúdo não foi copiado nem enviado. Não se afirma que esse resíduo esteja acessível a outra origem ou represente novo vazamento externo.

## 2. Standards — eixo independente

**0 achados novos acionáveis confirmados no diff.** As correções de foco, rótulos e controles são coerentes com os padrões lidos. Nenhum smell foi promovido a defeito por preferência estética.

- [globals.css:312–317](../../src/app/globals.css#L312-L317) limita ocultação de rótulos ao desktop; regras mobile mantêm nomes inclusive no estado recolhido.
- [sidebar:340–350](../../src/features/comercial-v3/components/commercial-sidebar.tsx#L340-L350): Avisos desabilitado com texto; perfil deixa de simular ação. Nome/cargo fixos eram preexistentes; build visual usa visitante genérico.
- Remover `outline-none` devolve o indicador global à busca e filtros. Lead examinou 69 controles focáveis visíveis na Jornada em 1440 px: zero sem outline/sombra no foco programático. Isso não equivale a percurso completo de Tab ou teste de leitor de tela.
- Mobile 375 px: seis rótulos, sem overflow horizontal; barra aproximadamente 83,56 px + margem 10 px, dentro da reserva inferior de 96 px. Quebra feia de palavras já era reconhecida; sem prova de perda funcional.

**Resumo Standards: 0 achados novos; segurança preexistente e lacunas de contrato ficam nos seus eixos, não são anuladas por este resultado.**

## 3. Spec — eixo independente

**6 achados: 3 novos documentais, 3 preexistentes.** Contrato: preservar Cloudflare, não implementar M1 sem Bruno e tratar M2 como evidência parcial.

1. **P1 — Proposta M1 incompleta para Q3.** [alternativa:24–27](2026-11-10-m1-opcoes.md#L24-L27) cobre linhas territoriais/duas telas, mas o total CSO calcula `forecastFluxo(s)` independentemente em [modelo:260–262,289](../../src/features/comercial-v3/regional/territorios-model.ts#L260-L289). Segui-la como escrita deixa o consolidado sem universo elegível/cobertura. Incluir isso no contrato antes de implementar.
2. **P1 — M2 absolvido indevidamente.** [baseline:77](2026-11-10-baseline-cloudflare.md#L77) afirma não ser problema de código/modelagem. Porém [new-name-model:294–305](../../src/features/comercial-v3/new-name-model.ts#L294-L305) usa conferência/fechamento e converte status em conferido quando há data; [realizado:409–415](../../src/features/comercial-v3/new-name-model.ts#L409-L415) soma somente conferido. Já era risco registrado na [evidência anterior:34–50](../EVIDENCIA-REALIZADO-E-PENDENCIAS.md#L34-L50). Repro sintético: integrado sem data → 0; conferido com data → 100; status desconhecido com data → 100. A ausência de data na origem existe, mas não elimina a divergência de modelagem. Sem impacto financeiro real medido; não alterar fórmula sem decisão.
3. **P2 — Conta de M1 errada na reconciliação.** [baseline:94–96](2026-11-10-baseline-cloudflare.md#L94-L96) associa diferença de 54.670 a 143.190 → 87.030; essa subtração é 56.160. Os 54.670 correspondem a 141.700 → 87.030, no cenário parcial. Reprodução real do modelo com fixture: original 143.189,55; parcial 141.700,46; comparável 87.030,06. Diferença parcial 54.670,40 = ganho 43.130 + esperado 11.540,40; Fora da filial excluída é zero nesse cenário. A diferença original acrescenta 1.489,09 de Fora.
4. **P1 preexistente — M1 continua incoerente.** [modelo:274](../../src/features/comercial-v3/regional/territorios-model.ts#L274) diz que sem meta não entra na comparação, mas o percentual em [208–225](../../src/features/comercial-v3/regional/territorios-model.ts#L208-L225) usa todas as filiais. Reproduzidos 118,0837% versus 72,5251%, inflação de 45,5587 p.p. no fixture. O [teste parcial:113–122](../../tests/territorios.test.mjs#L113-L122) só verifica contagens. M1 não foi alterado, corretamente aguardando Q1/Q2/Q3 do Bruno.
5. **P2 preexistente — Troca de filtros perde contexto e não muda o período territorial.** [trocarFiltros:287–307](../../src/features/comercial-v3/commercial-v3-app.tsx#L287-L307) não preserva território/nó; [injeção:378–379](../../src/features/comercial-v3/commercial-v3-app.tsx#L378-L379) usa snapshot fixo e a [tela:44–50](../../src/features/comercial-v3/screens/territorios-screen.tsx#L44-L50) ignora período/solução. **Reproduzido no Chrome:** filial → clicar Trimestre → URL perde território, volta ao CSO, continua Outubro/2026 com Trimestre selecionado. O aceite anterior só testou navegação mantendo `period=month`.
6. **P2 preexistente — Orientações conflitantes de destino/publicação.** README e handoffs antigos orientam Sites/branches antigas; [guia:27–34](../cloudflare-homologacao-visual.md#L27-L34) diz não haver CI automático, mas [workflow:3–6,32–40](../../.github/workflows/homologacao-visual.yml#L3-L40) publica em push de duas branches. Configuração Wrangler aponta timestamp ausente neste checkout; CI gera configuração runtime, portanto isso não prova falha do deploy publicado. Não usar build padrão/Sites como substituto de `build:visual`.

**Resumo Spec: 6 achados; piores novos no eixo: cobertura incompleta da proposta M1 e conclusão indevida de M2. Nada autoriza antecipar a decisão de produto.**

## 4. Interface e AI Design Check

Ferramenta já instalada, versão **0.16.3**, usada sem instalação, autofix ou redesign.

- Estático restrito ao código ativo `src`: **897 errors, 424 warnings, 14 notes**, exit 1. Principais contagens: type-scale 707, radius-scale 189, spacing-scale 98. São ocorrências de regra, não 1.335 defeitos validados. Escala padrão da ferramenta não equivale ao Design System Senior; tamanhos/raios documentados não devem ser substituídos em massa.
- Não comparar diretamente com o relatório Sites de 06/11: outra base, versão 0.12.0 versus 0.16.3 e escopo diferente. Contagens anteriores sobre a raiz inteira também não são comparáveis ao recorte `src`.
- Primeira chamada `scan` deu 0 erros, 52 avisos, 8 notas, **mas mediu somente a portaria** nos quatro endereços. Resultado descartado como aceite das telas internas.
- Repetição no mesmo navegador isolado com liberação local da demonstração: Home, Jornada, Configurações, Territórios × 1440/390 = oito estados internos; `gate=false` e zero overflow em todos. Sem API/carga real.
- Rodada interna inicial: 11 erros de imagens na Home desktop; após aguardar `decode()` e repetir, **22 imagens carregadas, zero quebradas, zero erros**. Alertas transitórios não foram tratados como defeitos persistentes.
- Restam alertas de contraste: Home 18 por largura; Jornada 34 por largura; Territórios 4 por largura. Não deduplicar isso como número de defeitos únicos.
- Exemplo confirmado na Jornada: indicador de 12 px com contraste medido 3,5:1 (referência 4,5:1); navegador confirmou a cor e a superfície clara. Orientações/contextos em cerca de 4,2:1 também foram sinalizados. Priorizar informação de estado/métrica; não reestilizar toda a interface por regras estéticas genéricas.
- Sem capturas revisadas nesta rodada; DOM/estilos calculados e scanner não certificam qualidade visual, leitor de tela ou toque real.

## 5. Verificações executadas e cobertura faltante

| Verificação | Resultado observado |
| --- | --- |
| `npm test` | PASS, 353 testes, 0 falhas, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `NEXT_TELEMETRY_DISABLED=1 npm run build:visual` | PASS, Next 16.3.8, 118 arquivos, exit 0 |
| SHA-256 do pacote | PASS, zero divergência nos 118 arquivos |
| `git diff --check` | PASS na base e ao revisar resultados |
| Lint convencional | NÃO VERIFICADO: não existe script lint/config do app ativo; não instalar ferramenta nesta auditoria |
| Checker estático | FAIL pelas regras padrão, exit 1; exige triagem contra padrões reais, não autofix |
| Scanner interno | Alertas remanescentes de contraste/tamanho; imagens não reproduziram após carregar |
| Browser 375/390/1440 | Estados amostrados sem overflow; bug de mudança de período reproduzido |
| Secrets | 595 textos rastreados sem matches nos padrões examinados; revisor também examinou 124 blobs; binários e formatos fora dos padrões não cobertos |
| Runtime público | HTML/chunk/foto acessíveis sem autenticação; não é certificação de produção |

**NÃO VERIFICADO:** fluxo completo de importação/gravação, identidade real do backend hospedado, retenção, todas as telas/combinações de filtros, dispositivo físico, leitor de tela, Tab integral, arquivos corporativos M2 e regras oficiais de realizado. Importação é intencionalmente bloqueada no visual, portanto não usá-lo como evidência de operação real.

Evidência resumida local sem valores pessoais/comerciais: [evidence-summary.json](../../.scratch/review-20261110/evidence-summary.json). Saídas brutas do checker em `%TEMP%/central-cloudflare-static-20261110.json` e `%TEMP%/central-cloudflare-runtime-unlocked-20261110.json`; não publicar automaticamente.

## Próxima sequência

1. Bruno decide contenção do conteúdo público (restrição de acesso ou nova versão sanitizada). Nenhuma mudança remota sem autorização.
2. Corrigir a classificação do pacote e explicitar fontes permitidas; adicionar teste que falhe se planejamento não autorizado entrar no visual.
3. Corrigir contrato/navegação de filtros, com regressão executável.
4. Fechar Q1/Q2/Q3 e o escopo do consolidado CSO antes de M1; obter fonte/evento/data antes de encerrar M2.
5. Tratar contrastes confirmados, testar importação sintética no ambiente próprio e atualizar instruções operacionais antigas.

## O que não funcionou / lições

- Verificar apenas nomes de filiais não detecta planejamento importado por outro módulo; examinar fontes e artefato completo.
- `scan` sem verificar pouso mede a portaria e pode produzir um falso verde para o produto.
- Onze alertas de imagens eram transitórios; esperar carregamento e repetir antes de registrar defeito.
- O MCP rejeitou escrita de relatório com `Access denied ... is not within any of the configured workspace roots`. Nenhuma escalada/contorno de escrita MCP; evidências salvas pelas ferramentas locais permitidas.
- A tentativa de mensagem para identificador de subagente retornou `active teammate ... not found`. Não foi assumida entrega; a conclusão veio pelos retornos originais e foi conferida pelo Lead.
