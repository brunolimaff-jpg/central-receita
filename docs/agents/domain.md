# Documentação de domínio

Como as skills de engenharia consultam o domínio deste projeto antes de explorar o código.

## Antes de explorar, leia

- **`GLOSSARY.md`** na raiz do projeto: os termos do negócio, com o significado que o projeto usa.
- **`docs/adr/`**: as decisões de arquitetura que valem para a área em que você vai trabalhar.

Se algum desses arquivos não existir, **siga em silêncio**. Não avise e não sugira criar antes da hora.
O `/domain-modeling` cria esses arquivos quando um termo ou uma decisão for realmente resolvida.

## Estrutura

Este projeto tem **contexto único**:

```
/
├── GLOSSARY.md
├── docs/
│   ├── adr/
│   └── agents/
└── src/
```

## Use o vocabulário do glossário

Quando a sua saída nomear um conceito de domínio (título de ticket, proposta, hipótese,
nome de teste), use o termo como está no `GLOSSARY.md`. Não troque por sinônimo que o
glossário mostra que foi evitado de propósito.

Se o conceito que você precisa não está no glossário, isso é um sinal: ou você está
inventando uma linguagem que o projeto não usa (reconsidere), ou existe uma lacuna de
verdade (anote para o `/domain-modeling`).

## Aponte conflito de ADR

Se a sua saída contradisser uma ADR, diga isso na hora em vez de sobrescrever em silêncio:

> _Contradiz a ADR-000X, mas vale reabrir porque…_
