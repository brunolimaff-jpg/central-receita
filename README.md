# Central de Receita — Sites

Experiência comercial V3. `npm run build` empacota os assets estáticos com o Worker de importação para hospedagem no Sites; `npm run build:static` gera somente a exportação estática para desenvolvimento.

- Dados demonstrativos embutidos na interface.
- Importação local aceita XLSX e CSV UTF-8 com os cabeçalhos das duas exportações do piloto.
- O preview local usa IndexedDB. A versão hospedada usa Worker/D1 e identidade do Sites quando publicada.
- Fonte funcional copiada de `Dash com IA/src/features/comercial-v3`.

O Site está publicado na versão 2 com Worker e D1 (`DB`). O banco tem as três tabelas de importação; `import_current` ainda está vazio, então não há CSV carregado e os números continuam demonstrativos. Fabi está configurada para importar; Giovanni, Bruno e Marlus para consultar. A audiência do Site permanece personalizada. A entrada real dessas pessoas e a leitura cruzada ainda não foram confirmadas.

O Worker persiste registros normalizados e metadados de origem. O arquivo CSV/XLSX original não é enviado nem armazenado. A validação de cabeçalhos de uma exportação CSV real ainda precisa ser feita com Fabi.

Validação local:

```powershell
npm run typecheck
npm run build
```

`npm run build:sites` é um alias de `npm run build`. O build de publicação compila a interface com o modo compartilhado e empacota `out/` em `dist/client` junto com o Worker em `dist/server/index.js`. Mudanças no schema D1 geram migrações com `npm run db:generate`; Sites aplica as migrações pendentes ao publicar.
