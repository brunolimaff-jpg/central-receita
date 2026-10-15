# Central de Receita — Sites

Experiência comercial V3. `npm run build` empacota os assets estáticos com o Worker de importação para hospedagem no Sites; `npm run build:static` gera somente a exportação estática para desenvolvimento.

- Dados demonstrativos embutidos na interface.
- Importação local aceita XLSX e CSV UTF-8 com os cabeçalhos das duas exportações do piloto.
- O preview local usa IndexedDB. A versão hospedada usa Worker/D1 e identidade do Sites quando publicada.
- Fonte funcional copiada de `Dash com IA/src/features/comercial-v3`.

O código e a migração D1 estão preparados no checkout, mas a versão publicada ainda é estática até o próximo deploy. Nenhum arquivo original CSV/XLSX é enviado; o Worker recebe só registros normalizados.

Validação local:

```powershell
npm run typecheck
npm run build
```

`npm run build:sites` é um alias de `npm run build`. O build de publicação compila a interface com o modo compartilhado e empacota `out/` em `dist/client` junto com o Worker em `dist/server/index.js`. Mudanças no schema D1 geram migrações com `npm run db:generate`; Sites aplica as migrações pendentes ao publicar.
