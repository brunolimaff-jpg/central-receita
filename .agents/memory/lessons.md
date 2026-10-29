# Registro de lições — Central de Receita

Anti-padrões reutilizáveis que custaram retrabalho neste projeto:

- **Envio não é enviado.** Preencher e clicar não prova entrega; confirme o turno no thread, o compositor vazio e a resposta começando. Ver `Bruno Vault/Projetos/Central de Receita/Lições/evidencia/envio-confirmado-no-thread.md`.
- **Data no fuso que a pessoa vê.** Não fatiar ISO em UTC quando outra tela mostra outro fuso; a mesma gravação aparece em dois dias. Ver `.../Lições/interface/data-com-o-fuso-que-a-pessoa-ve.md`.
- **Tamanho do diff não é defeito.** Procure defeito com arquivo e linha; recorte que perde dependências não é recorte seguro. Ver `.../Lições/evidencia/tamanho-do-diff-nao-e-defeito.md`.
- **Teste que falhou pode estar errado.** Confira a expectativa contra a regra documentada antes de mexer no produto. Ver `.../Lições/evidencia/teste-falhou-confira-a-expectativa.md`.
- **"Não está no código" pode ser "não está nesta branch".** Antes de procurar um componente em todo o repositório, veja de onde o deploy saiu: `gh run list --workflow=homologacao-visual.yml`. Neste projeto a homologação publica da `claude/gifted-mccarthy-odjru5`, não da `main` nem da PR 19 — gastei buscas atrás de uma classe que só existia lá.
- **Ferramenta vazia pode ser permissão, não automação.** A busca da hierarquia da plataforma Senior respondia "Não autorizado" para o usuário do Bruno. Antes de reescrever seletores ou trocar de abordagem, leia a mensagem de erro que a própria interface mostra.
