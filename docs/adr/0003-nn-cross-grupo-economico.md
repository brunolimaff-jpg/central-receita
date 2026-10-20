# ADR-0003: Hipótese histórica de classificação por grupo econômico

**Status:** superada pela emenda de 30/09/2026

## Contexto

Este registro preserva a hipótese provisória debatida em 29/09/2026. Ela foi substituída pelas definições aprovadas para as áreas New Name e Cross.

## Hipótese então registrada

- **New Name** = primeira venda do grupo; **Cross** = grupo já cliente antes da assinatura.
- A conta carrega `economicGroup`; a origin é **derivada**, nunca digitada.
- Sem evidência de grupo → **"classificação indisponível"** — nunca New Name por padrão, nunca redistribuir no donut.

## Consequências históricas

Mock precisa de conta com grupo conhecido (Cross), grupo novo (NN) e grupo desconhecido (indisponível). Frase original do dono ficou cortada ("mas não…"); a hipótese acima é provisória e documentada como tal.

## Decisão vigente — emenda de 30/09/2026

- **New Name** depende de fonte própria, independente da classificação informada na oportunidade. A fonte real segue pendente; sem evidência, mostrar **"classificação indisponível"**.
- **Cross** depende de evidência conjunta da condição de cliente, de produto ou módulo novo e do representante executivo. Se faltar qualquer elemento, mostrar **"classificação indisponível"**.
- Nenhuma das classificações deriva apenas do grupo econômico, do canal de aquisição ou da classificação informada na oportunidade.
- **Upsell** é upgrade de licenças no módulo atual e permanece separado de Cross. As regras específicas de Cross por produto serão definidas depois.
