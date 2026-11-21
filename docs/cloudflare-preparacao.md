# Preparação para hospedar na Cloudflare

Estado em 26/10/2026. Base inspecionada: `546eb20`, branch `fix/p3-forecast-e-importacao`, PR 19. Este roteiro não autoriza deploy, migrações, mudanças de acesso ou merge.

## Arquitetura verificada

- Next.js com exportação estática; não requer servidor Next.js nem migração para vinext/OpenNext.
- `npm run build:sites` gera `dist/client` com os arquivos estáticos e `dist/server/index.js` com o Worker de `backend/worker.js`.
- O build define `NEXT_PUBLIC_IMPORT_STORAGE=shared`.
- O Worker usa `ASSETS` para servir a interface e `DB` para persistir importações no D1.
- O destino atual está descrito em `.openai/hosting.json`. O processo atual do Sites aplica as migrações Drizzle antes da publicação.
- Não há configuração Cloudflare CLI ou Wrangler rastreada na branch inspecionada.

## Destino recomendado

Workers + Workers Static Assets + D1. Cloudflare Access é a opção recomendada para proteger a aplicação interna, condicionada à confirmação do domínio, conta e provedor de identidade disponíveis. Não é necessário acrescentar R2, KV ou Queues para o comportamento atual.

Usar o CLI oficial `cf`, pois o projeto não tem configuração Wrangler. Na inspeção, o npm informou `cf@1.0.0-beta.21`; Node local `v24.22.0`. O CLI é beta: conferir documentação e ajuda da versão antes de gerar configuração. Não instalar Wrangler nem criar seu arquivo de configuração por tradução de exemplos antigos.

## Bloqueio de autenticação

**Não publicar o Worker atual diretamente.** Ele confia nos cabeçalhos `oai-authenticated-user-id` e `oai-authenticated-user-email` inseridos pelo dispatcher autenticado do Sites. Fora desse caminho, o cliente pode forjá-los. Checagem de Origin e allowlists não substitui autenticação.

Para Cloudflare, a preparação de código ainda necessária é:

1. Validar criptograficamente o JWT do Cloudflare Access em `Cf-Access-Jwt-Assertion`, usando emissor, audiência da aplicação e chaves públicas do time configurado. Rejeitar tokens ausentes, inválidos e expirados.
2. Derivar a identidade do token verificado, mantendo autorização de importador/leitor no servidor. Não confiar nos antigos cabeçalhos recebidos do cliente. Confirmar o impacto na hospedagem Sites antes de substituir o contrato atual.
3. Proteger interface e API. Bloquear caminhos alternativos de acesso, incluindo URLs diretas e de preview que escapem da política. Não presumir que um endereço workers.dev esteja protegido.
4. Testar identidade ausente, cabeçalhos forjados, assinatura inválida, emissor/audiência incorretos, token expirado e usuário sem permissão. Leitor não pode executar PUT; importador autorizado pode ler e gravar.

Nenhuma alteração de autenticação ou permissão foi aplicada nesta preparação.

## Configuração ainda não gerada

Gerar a configuração tipada `cloudflare.config.ts` somente depois de resolver o contrato de identidade e confirmar a conta/ambiente. Não preencher identificadores fictícios de D1, domínio, emissor ou audiência.

O CLI deve empacotar os artefatos existentes sem reconverter o framework: `dist/server/index.js` como Worker, `dist/client` como assets, bindings `ASSETS` e `DB`. A documentação de `cf` não usa `assets.directory` na configuração tipada; não copiar o formato Wrangler para ela. Validar o caminho de build suportado pela versão escolhida antes de alterar scripts.

Não conectar automaticamente pushes da PR a produção.

## Dados e migrações

- Novo ambiente deve ter D1 próprio e começar vazio, sem cópia de dados comerciais.
- Conferir `db/schema.ts`, `drizzle/0000_shared_import.sql` e `drizzle/0001_shared_import.sql`.
- Não reaplicar migrações no banco do Sites nem assumir que o novo processo terá a aplicação automática de migrações do hosting anterior.
- Criação de recursos, aplicação de migrações e transferência de dados exigem aprovação explícita.
- Definir retenção das versões antes de uso contínuo; o backend atual não faz exclusão automática do histórico.
- Não embutir credenciais, listas pessoais ou valores server-only em variáveis `NEXT_PUBLIC_*`.

## Gates de preparação e aceite

### Local

Executar na worktree da PR:

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run build:sites
```

Conferir artefatos e diff. Esses gates não comprovam autenticação ou concorrência no ambiente hospedado.

### Ambiente isolado, somente após autorização

- Aplicação sem login não entrega conteúdo interno nem dados da API.
- Leitor autorizado lê e recebe recusa ao tentar gravar.
- Importador autorizado grava e outro usuário autorizado lê a mesma revisão.
- Duas gravações com a mesma revisão anterior: somente uma vence; a outra recebe 409 e não sobrescreve o estado vencedor.
- Falha de gravação mantém a revisão ativa anterior.
- Navegação, assets e endpoints funcionam no domínio protegido; nenhum dado real é usado antes da comprovação de acesso.
- Registrar evidência técnica separada do aceite visual de Bruno.

## Pendências e limites

- NÃO VERIFICADO: acesso à conta Cloudflare, domínio, configuração Access, D1, funcionamento hospedado e concorrência shared.
- NÃO VALIDADO: aceite visual final das telas.
- DECISÃO DO USUÁRIO: aprovar a implementação do contrato de identidade, alterações de acesso, provisionamento, migrações e publicação. Merge é decisão separada.
- O conector MCP Cloudflare exige autenticação. No Claude Code interativo, autorizar pelo `/mcp`; esta sessão desktop não inicia esse fluxo. Alternativamente, uma sessão CLI previamente autenticada pode ser usada sem colocar tokens no chat.

## Fontes consultadas

- `backend/README.md`: contrato de identidade, limites e ativação.
- `scripts/build-sites.mjs`: geração dos artefatos.
- `package.json`: comandos reais.
- https://developers.cloudflare.com/cf/agents/index.md
- https://developers.cloudflare.com/cf/projects/index.md
- https://developers.cloudflare.com/cf/projects/cloudflare-config/index.md
- https://developers.cloudflare.com/workers/static-assets/index.md
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/index.md
