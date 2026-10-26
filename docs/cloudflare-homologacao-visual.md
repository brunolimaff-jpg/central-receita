# Homologação visual na Cloudflare

Preparação local autorizada por Bruno em 26/10/2026. Publicação NÃO autorizada: confirmar destino e exposição antes de enviar arquivos.

## Escopo

- Interface candidata de `546eb20`, sem redesenho de telas.
- Modo compilado `NEXT_PUBLIC_VISUAL_PREVIEW=1`, independente do build Sites.
- Dados mockados existentes e fixture `visual-branches.json` criada sem usar números da exportação real.
- Alias Webpack substitui `real-branches.json` apenas neste build. O arquivo original permanece intacto.
- Leitura de cargas retorna uma carga sintética fixa de `visual-import.json`, gerada das fixtures de teste; não acessa IndexedDB ou API. Leitura de arquivos e gravação são recusadas antes de processar conteúdo.
- Configurações explica que a importação está desativada; todas as telas mostram identificação de homologação.
- Pacote contém somente o export estático; não contém Worker de backend, SQL, bindings, banco, credenciais ou configuração de produção.

## Gerar

Na worktree `p3-forecast-import`:

```bash
npm run build:visual
```

A saída fica em `dist/visual/<timestamp>/assets`. O manifesto com SHA-256 de cada arquivo fica fora de `assets`; `dist/visual/latest.json` identifica a última geração aprovada pelo verificador. Apenas `assets` é candidato a upload. Nunca enviar a raiz do repositório, `dist/client` do build Sites ou `.next`.

O verificador recusa fonte/nomes da exportação real, source maps, SQL e diretórios de backend. Essa checagem complementa a troca explícita da fonte; não é um detector universal de informações sensíveis.

## Destino proposto, ainda não criado

- Produto: Worker dedicado exclusivamente a Static Assets, sem código de API.
- Nome proposto: `central-receita-visual` (disponibilidade não consultada).
- Conta e subdomínio workers.dev: NÃO VERIFICADOS; nenhum identificador inventado.
- Sem D1, rotas do Sites ou domínio de produção.
- Sem CI automático: nenhum push publica por acidente.
- CLI: manter `cf` conforme a skill oficial; não acrescentar plugin Vite ou Wrangler ao projeto para servir arquivos já exportados. A configuração efetiva deve ser gerada/validada na versão do CLI após confirmar o destino, em pasta de implantação separada do app Next.js. O empacotamento pelo cf ainda NÃO foi validado.

## Exposição para Bruno decidir

Recomendação: homologação restrita por Cloudflare Access, se o time/conta tiver esse recurso configurado. Isso exige confirmação antes de criar a política e verificar que nenhum endereço alternativo fica público.

Alternativa: endereço público workers.dev, estritamente com dados fictícios e importação desativada. Link não listado NÃO é controle de acesso. Qualquer pessoa com o endereço pode ver e copiar a interface e os dados demonstrativos. `noindex` reduz indexação cooperativa; não torna o conteúdo privado. Essa exposição só pode ser usada com aprovação explícita de Bruno.

Não efetuar upload antes de confirmar a conta, o nome/destino e a exposição escolhida. Não reaproveitar o backend do Sites nesta homologação.

## Verificação local

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run preview:visual
```

O servidor de preview serve apenas os arquivos estáticos em `127.0.0.1:3013`; `/api/*` retorna 404. Iniciar pelo preview do aplicativo. Desligar após a inspeção para não deixar processo consumindo RAM.

Validar navegação das nove visões, sidebar recolhida, painéis de Jornada/Contas, ausência de campos de upload, ausência de chamadas `/api/`, ausência de erros de console e comportamento em viewport estreita. A inspeção técnica não substitui o aceite visual de Bruno.

## Separação de ambientes

`npm run build:sites` continua sem flag de homologação e usa a fonte original. Os dois comandos usam `.next`/`out`; executar sequencialmente, nunca em paralelo. Cada pacote visual tem pasta própria para não sobrescrever o resultado do Sites em `dist/client` e `dist/server`.

Nenhuma dependência nova instalada no checkout. Nenhum deploy, login Cloudflare, recurso, banco, migração, permissão, commit ou push faz parte desta preparação.
