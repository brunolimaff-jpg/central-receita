# Resultado da preparação visual — 26/10/2026

## Artefato candidato

VERIFICADO em laboratório local. Base: `546eb20`, com alterações locais não commitadas.

Pacote: `dist/visual/2026-10-26T14-35-34-624Z/assets`.
Manifesto: `dist/visual/2026-10-26T14-35-34-624Z/manifest.json`.
Total: 92 arquivos, com SHA-256 individual. Não enviar o manifesto nem o repositório como assets.

## Gates finais

- PASS: `npm test`, 255 testes aprovados, zero falhas.
- PASS: `npm run typecheck`; a sequência prosseguiu com código zero.
- PASS: `npm run build:visual`, export estático 3/3 e verificador de pacote aprovado.
- PASS: `git diff --check`, sem erros; Git avisou apenas sobre normalização LF/CRLF no arquivo executive-page.tsx.
- VERIFICADO: nenhum diff em `real-branches.json`, `backend/worker.js` ou `scripts/build-sites.mjs`.
- VERIFICADO: nenhuma dependência adicionada ao checkout.

## Navegador local no pacote final

Endereço usado: `http://127.0.0.1:3013`.

- Home: carga sintética populou indicadores e trajetória, com identificação de homologação e saudação neutra.
- Forecast Semana e Mês: telas e seções renderizaram com a carga sintética.
- New Name: seção renderizou com a carga sintética.
- Configurações: importação desativada, zero inputs de arquivo.
- Jornada: quatro painéis com fundo `rgba(255, 255, 255, 0.88)`.
- Sistema: rótulos fictícios, sem “Agregado real exportado” ou a unidade monetária incorreta da primeira tentativa.
- Contas: painel com fundo `rgba(255, 255, 255, 0.88)`.
- Cross: tela e conteúdo preliminar renderizaram.
- Sidebar: clique em Recolher ocultou a legenda (`display: none`). A largura foi amostrada durante a transição; não é prova isolada da largura final de 72px.
- Responsividade amostrada em Jornada a 375px: sem overflow horizontal. Isso não é auditoria responsiva completa das nove visões.
- Nenhum erro de console retornado na consulta final.
- Nenhuma chamada `/api/` feita pelo navegador na consulta de rede.
- Requisições diretas por curl no preview: GET e PUT de `/api/imports/current` retornaram 404.
- Screenshot final obtido no navegador integrado. O aceite visual de Bruno permanece pendente.

## Falha intermediária resolvida

Uma execução intermediária teve 254 PASS e 1 FAIL: teste baseado na forma da expressão que marca origem dos dados em Sistema. O componente foi preservado e o modo visual passou a informar a origem demonstrativa pelo chamador. A execução final passou 255/255. Também foram corrigidas a escala da fixture (milhões de reais, não reais) e a identificação do visitante somente em homologação.

## Limites de entrega

- Pronto: pacote estático local para a próxima etapa de homologação.
- NÃO VERIFICADO: empacotamento/upload pelo `cf`, conta, disponibilidade do nome proposto e funcionamento Cloudflare hospedado.
- NÃO VALIDADO: aceite visual de Bruno.
- Nenhum login Cloudflare, upload, provisionamento, D1, API, migração, alteração de acesso, commit, push ou merge executado.
- O preview foi encerrado após a inspeção para não manter servidor consumindo RAM.

## Decisão antes da publicação

Proposta de destino: Worker dedicado de Static Assets `central-receita-visual`, sem backend ou bindings. Nome não reservado; conta e subdomínio não confirmados.

Recomendação: acesso restrito por Cloudflare Access, caso a conta disponha dessa configuração. Alternativa: URL pública workers.dev, somente com os dados fictícios, sabendo que qualquer pessoa pode acessar e copiar. `noindex` não é privacidade.

Confirmar com Bruno conta/destino e exposição antes de qualquer upload. Não usar o backend autenticado do Sites nessa homologação.
