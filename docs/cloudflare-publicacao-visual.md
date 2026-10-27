# Homologação visual publicada — 26/10/2026

## Decisão e destino

DECISÃO DO USUÁRIO: Bruno autorizou criar e publicar `central-receita-visual` na conta confirmada, em link público sem Access, somente com pacote sintético, sem API, D1 ou dados reais. Essa decisão substitui a preferência anterior por homologação privada. Depois, Bruno pediu o caminho Wrangler.

URL: https://central-receita-visual.brunolimaff.workers.dev
Conta: `Brunolimaff@gmail.com's Account`.
Worker: `central-receita-visual`.
Versão: `dfb0d215-3c61-42b9-b536-a579e133581b`.
Configuração local: `wrangler.visual.jsonc`.
Pacote enviado: `dist/visual/2026-10-26T14-35-34-624Z/assets`.

## Execução verificada

Wrangler `4.135.0` executado via npx, sem instalar dependência no checkout. A sessão OAuth já estava autenticada na conta correta. O fluxo pendente de login do cf foi cancelado.

Antes do envio:
- Manifesto conferido: 92 arquivos com hash SHA-256 correspondente, nenhum arquivo extra.
- `wrangler deploy --config wrangler.visual.jsonc --no-autoconfig --dry-run`: PASS; nenhum binding.
- Configuração assets-only sem entrypoint de backend, sem bindings, com workers.dev ativo e preview_urls desativado.

Publicação:
- `wrangler deploy --config wrangler.visual.jsonc --no-autoconfig`: código zero.
- Worker e URL retornados pelo executor; 83 assets enviados e 8 já existentes no armazenamento de assets.
- Nenhuma política Access salva pelo agente, nenhum D1, API, domínio de produção ou integração de dados criado.

## Verificação hospedada

VERIFICADO na URL pública, sem autenticação:
- Home HTTP 200, com identificação “Homologação visual · dados fictícios · importação e armazenamento desativados”.
- Home hidratou e mostrou a carga sintética, trajetória e indicadores.
- Nenhum erro de console retornado na consulta.
- Nenhuma chamada `/api/` observada na consulta de rede.
- GET e PUT `/api/imports/current`: HTTP 404.
- Configurações: zero inputs de arquivo e mensagem de importação desativada.
- Jornada: tela renderizou e quatro painéis apresentaram fundo rgba(255,255,255,0.88).
- Screenshot final obtido no navegador integrado.

Os gates locais anteriores passaram 255 testes, typecheck e build. Isso não equivale a teste exaustivo hospedado nem a aceite visual de Bruno.

## Limites

A URL é pública e seus arquivos podem ser copiados. Não inserir dados reais ou ativar importação neste Worker. `noindex` não oferece privacidade.

Não houve commit, push ou merge. As mudanças de homologação e os documentos permanecem locais; a publicação foi direta do pacote validado. Não há servidor local necessário para abrir a URL.

As instruções anteriores de usar apenas cf e aguardar decisão de exposição são históricas e foram substituídas pela autorização de publicação pública e pela escolha Wrangler nesta sessão.
