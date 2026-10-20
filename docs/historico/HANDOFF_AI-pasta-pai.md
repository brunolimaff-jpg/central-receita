# Handoff — Central de Receita / importação CSV

Atualizado em 16/10/2026.

## Estado

- Site publicado: https://central-vendas-visao-comercial.workspace-947623.chatgpt.site, versão 6.
- Sites confirmou o deployment `appgdep_6ad11ec4a7cc8191ae568458256389d5` como `succeeded`. Commit do artefato: `12d7c160b254f9fa279977898ab142d43f8cd9a8`.
- Código-fonte: `central-receita-sites`; checkout de publicação: `sites-worker-activation-20261015`.
- Runtime Worker/D1 com binding `DB` e tabelas `import_chunks`, `import_current` e `import_versions`.
- Fabi está configurada para importar; Giovanni, Bruno e Marlus para consulta. Audiência personalizada, e-mail autenticado conferido pelo dispatcher e ID autenticado obrigatório; env revision 2.
- A última consulta registrada encontrou `import_current` vazio; esta revisão não alterou o D1. Confirme o estado atual antes da próxima importação. O Site mantém números demonstrativos até a primeira carga.
- A carga persiste registros normalizados e metadados, não o arquivo CSV/XLSX original. Versões antigas não têm retenção automática.

## Revisão de gráficos publicada

- Dois agentes Luna Max alteraram 15 arquivos de código/testes. No relatório: 35/35 testes, typecheck e build final passaram.
- QA no IAB local conferiu interação, teclado, escalas, proporções, vazios e redução de movimento. A tela hospedada após publicação e toque em aparelho real continuam NÃO VERIFICADOS.
- Nenhuma carga D1 foi criada ou substituída pela revisão; `qa-datas.csv` não foi importado.
- Somente Forecast/New Name consomem cargas. Home e outras áreas continuam demonstrativas; a importação não atualiza todos os indicadores.
- Evidências e limites: [relatório da revisão dos gráficos](docs/charts-20261015/REVISAO.md).

## Próximo passo

1. Fabi confere os cabeçalhos e importa um CSV real pelo Site.
2. Giovanni entra em outra sessão e confirma que vê os mesmos números em modo somente leitura.
3. Verificar a interface publicada no IAB quando o acesso permitir e definir retenção antes de uso contínuo.

## Vault oficial

- Sessões, decisão, lições e índices da Central de Receita estão copiados em `C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Bruno Vault`; veja [hub do projeto](<C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Bruno Vault/Projetos/Central de Receita.md>). Os originais na pasta Documents foram preservados.
- Checagem direcionada: 8 documentos com metadados e links válidos; os 7 arquivos de origem mantêm os hashes originais. `validate-vault.mjs` ainda aponta 69 falhas preexistentes em documentos de outras áreas; nenhuma falha na Central de Receita.

## Continuidade

- [Fechamento oficial no Bruno Vault](<C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Bruno Vault/Sessões/2026-10/2026-10-15T14-48-00-central-receita-graficos-e-importacao.md>). Os originais sob Documents/Bruno Vault permanecem preservados até validação.
- Revisão publicada comprova deployment e QA local; não declara a interface hospedada visualmente validada nem validação de produção.
