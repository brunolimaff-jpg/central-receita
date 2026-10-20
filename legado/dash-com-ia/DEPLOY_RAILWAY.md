# DEPLOY RAILWAY — Central de Receita

**URL atual:** https://central-de-receita-production.up.railway.app
**Conta:** brunolimaff@gmail.com · **Plano:** Free ($0/mês, US$1 crédito de uso, **sem cartão**)
Critério do Bruno: zero custo. Sem cartão cadastrado, o Railway não consegue cobrar — se o
crédito estourar, o serviço pausa (não fatura).

## Como atualizar (fluxo de todo dia)

```bash
cd "Central de Receita/Dash com IA"
railway up --ci          # sobe o diretório (respeita .gitignore), builda e deploia
```

Pronto. Volume e variáveis já estão configurados no serviço.

## O que já está configurado (não refazer)

| Item | Valor |
|---|---|
| Projeto | `fantastic-alignment` (Free bloqueia projeto novo; o app mora dentro dele) |
| Serviço | `central-de-receita` |
| Volume | `central-de-receita-volume` montado em `/data` (500 MB) |
| Variáveis | `DATABASE_URL=file:/data/custom.db` · `NODE_ENV=production` |
| Domínio | gerado pela CLI, apontando para o serviço |

## Como recriar do zero (se apagarem tudo)

```bash
npm install -g @railway/cli
railway login                    # abre o navegador
railway link --project <id> --environment production --service central-de-receita
MSYS_NO_PATHCONV=1 railway volume add --mount-path /data
MSYS_NO_PATHCONV=1 railway variables --set "DATABASE_URL=file:/data/custom.db" --set "NODE_ENV=production"
railway up --ci
railway domain                   # gera a URL pública
```

## Gotchas que já nos morderam

1. **Next standalone escuta em `HOSTNAME`**: o container injeta `HOSTNAME=<hostname-do-container>`
   e o server liga nesse endereço em vez de `0.0.0.0` → gateway responde **502** com o app "Ready".
   O script `start` do `package.json` já força `HOSTNAME=0.0.0.0`. Não remover.
2. **Seed do banco**: o `start` copia `db/custom.db` → `/data/custom.db` se o arquivo não existir.
   Sem isso o banco nasce vazio e todas as APIs quebram. Volume persiste entre deploys.
3. **Git Bash converte `/data`** em path do Windows ao chamar a CLI → usar `MSYS_NO_PATHCONV=1`.
4. **`prisma generate` precisa estar no script `build`** (Nixpacks não roda sozinho).
5. **Free força serverless** (`sleepApplication`): o serviço dorme sem tráfego; o primeiro acesso
   pode demorar ~30–60s e o gateway pode devolver 502 — dar F5.
6. **Free bloqueia criação de projeto novo** quando há recursos provisionados; criar serviço
   dentro de um projeto existente funciona.
7. `railway.json` (Config as Code) está deprecado e **não é aplicado** — não usá-lo; a fonte de
   verdade é o `package.json` (build/start) + variáveis do serviço.

## Custos e limites do Free

- $0/mês com US$1 de crédito de uso (uso medido por CPU/RAM ativa; dormindo, custo ~zero).
- 0,5 GB RAM, 1 vCPU, 0,5 GB volume por serviço — suficiente para este mock.
- Se algum dia precisar de "sempre ligado" ou mais recursos, aí é plano Hobby (US$5/mês, cartão)
  — decisão do Bruno, nunca automática.
