# 06 — Série de três ou mais cargas

Status: ready-for-agent
Bloqueia: —
Bloqueado por: 01, 03

## Objetivo

Com o `snapshot` gravado em cada carga (ticket 03), a trajetória passa a ter
série temporal real. Este ticket liga a leitura.

## O que construir

Em `trajectory-model.ts`, o ramo `regime: 'C'`.

### Eixo X

Datas reais de `history[].at`, ordenadas. Não interpolar. Se duas cargas
aconteceram no mesmo dia, são **dois pontos distintos**, com a hora no rótulo —
não um ponto médio.

### Séries

- **Previsto por carga** — `snapshot.forecastTotal` de cada entrada.
- **Realizado por carga** — `snapshot.realized` de cada entrada.

Mesmo tratamento visual do regime A: previsto sólido verde-institucional,
realizado verde-escuro.

### Movimento

Reaproveitar a orquestração do ticket 02. Este ticket **não** anima nada novo:
a entrada já existe.

### Rótulo do eixo

Com mais de 6 pontos, mostrar no máximo 6 marcas, escolhendo por índice
(`Math.round(i * (n-1) / 5)`), e sempre incluindo o primeiro e o último.

### Entrada sem snapshot

Ignorada na série. Se sobrar menos de 3 pontos válidos, cair para regime B.

## Testes

| Cenário | Esperado |
|---|---|
| 3 cargas com snapshot | 3 pontos, regime C |
| 5 cargas, 2 sem snapshot | 3 pontos válidos, regime C |
| 3 cargas, 2 sem snapshot | cai para B |
| 2 cargas no mesmo dia | 2 pontos no mesmo X, hora no rótulo |
| 10 cargas | 6 marcas no eixo, primeira e última sempre presentes |

## Critério de aceite

- Regime C só aparece com 3+ pontos válidos.
- Carga antiga sem snapshot não quebra a leitura.
- Eixo nunca mostra semana inventada — só datas de carga.
