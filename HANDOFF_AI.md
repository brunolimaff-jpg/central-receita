# Handoff — Central de Receita

Atualizado em 26/10/2026. Modo compact-pr. Bruno encerrou para retomar em outro local.

## Comece por aqui

- Homologação online: https://central-receita-visual.brunolimaff.workers.dev
- Abra essa URL; não precisa iniciar Next.js local para testar visualmente.
- Exposição pública explicitamente autorizada por Bruno, sem Access, API, D1 ou dados reais.
- Worker `central-receita-visual`, conta `Brunolimaff@gmail.com's Account`, versão `dfb0d215-3c61-42b9-b536-a579e133581b`.
- PR [brunolimaff-jpg/central-receita#19](https://github.com/brunolimaff-jpg/central-receita/pull/19): OPEN, draft, head `bb884bb` (delta da homologação pushado), sem merge.
- Branch desta worktree: `fix/p3-forecast-e-importacao`. Não usar a pasta principal main para implementar este delta.

## Atenção ao trocar de local

O delta da homologação foi commitado (`bb884bb`) e enviado à branch `fix/p3-forecast-e-importacao` em 26/10; um clone remoto o recebe com checkout dessa branch. As evidências em `.scratch/p3-20261023/` (550 MB) não são versionadas e continuam apenas nesta máquina — não apagar `.scratch/` nem usar clean/reset. O merge da PR segue decisão do Bruno.

## Alterações locais

- Build separado `npm run build:visual`; flag `NEXT_PUBLIC_VISUAL_PREVIEW=1`, fonte comercial substituída por `visual-branches.json` via alias Webpack.
- Home usa `visual-import.json` das fixtures sintéticas, sem IndexedDB/API. Upload e gravação recusados no modo visual.
- Identificação de homologação, visitante neutro, rótulos e unidades fictícias corretos.
- `wrangler.visual.jsonc` foi criado após Bruno pedir Wrangler. Sem entrypoint backend ou bindings, workers.dev ativo, preview_urls false.
- Pacote publicado: `dist/visual/2026-10-26T14-35-34-624Z/assets` (92 arquivos com SHA-256). A configuração aponta para esse timestamp; não substituir por out de outro modo.
- Arquivos de código alterados: next.config.ts, package.json, commercial-v3-app.tsx, manual-import-client.ts, branch-rail.tsx, commercial-sidebar.tsx, executive-page.tsx, import-screen.tsx.
- Novos scripts build-visual.mjs/serve-visual.mjs e teste visual-preview.test.mjs; documentos Cloudflare em docs/; launch.json local.
- `next-env.d.ts` foi ajustado automaticamente pelo build. `.scratch/p3-20261023/` era preexistente e está preservado.
- real-branches.json, backend/worker.js e scripts/build-sites.mjs originais sem diff.

## Evidências

- PASS final: 255/255 testes, typecheck, build visual 3/3, verificador de pacote e Wrangler dry-run.
- Uma falha intermediária 254/255 foi resolvida antes do build publicado. Ver relatório.
- Local: nove visões renderizaram; amostra responsiva em 375px sem overflow em Jornada.
- Hospedado: Home HTTP 200, dados fictícios, Configurações sem upload, Jornada com superfície nos painéis; nenhum erro de console ou chamada API observado. GET/PUT /api/imports/current retornaram 404.
- GitHub retornou apenas GitGuardian SUCCESS; não atribuir os 255 testes ao CI ou ao commit 546eb20.
- Nenhum servidor local desta sessão ficou ativo; preview estático e login pendente cf encerrados. Sessão legítima Wrangler preservada.

## Pendências

- Aceite visual de Bruno: NAO VALIDADO. Merge é decisão separada, não executar.
- Delta de homologação e documentação enviados ao GitHub (commit `bb884bb`); merge é decisão de Bruno.
- Operação real, identidade, retenção, D1 e concorrência shared hospedada: NAO VALIDADO, fora desta demonstração. Não expor o Worker Sites diretamente.
- Planner GPT Web recebeu checkpoint inicial, mas não o relatório final da publicação. Não alegar que está atualizado até enviar e confirmar.

## Referências

- Relatório: `docs/cloudflare-publicacao-visual.md`; validação: `docs/cloudflare-homologacao-resultado.md`.
- Narrativa canônica: `C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Bruno Vault/Sessões/2026-10/2026-10-26T11-13-59-central-receita-cloudflare-visual-publicada.md`.
- Skills de retomada: cloudflare:wrangler e doc-handoff; sem reinstalar dependências do projeto para servir os assets.
