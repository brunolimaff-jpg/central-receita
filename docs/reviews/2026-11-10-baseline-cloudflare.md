# Baseline Cloudflare — retorno da Etapa 3

Data: 10/11/2026. Base: `local/cloudflare-a19b386`. Nada foi mesclado, enviado, publicado ou migrado.

## 1. Entregue

Commit `8243c4a` sobre `a19b386`: 3 arquivos, +36/−27.

| Correção | Arquivo | Delta aplicado |
| --- | --- | --- |
| Fixture `forecastDate` | `tests/local-import-snapshot.test.mjs` | 1 linha; só o teste, produção intacta |
| Rótulos na barra inferior | `src/app/globals.css` | regra que esconde o rótulo no estado recolhido passou a valer só em `min-width: 781px`; barra com altura automática; item vira coluna; rótulo sai do bloco `display: none` |
| Avisos e perfil | `src/features/comercial-v3/components/commercial-sidebar.tsx` | Avisos vira botão `disabled` com `title` e texto; perfil vira `div` com `pointer-events-none`; `ChevronDown` sai do import |

## 2. Resultados reais

- `npm test`: **353/353 PASS** (antes 352/353).
- Teste isolado da fixture: 7/7 PASS.
- `npm run typecheck`: exit 0.
- `npm run build:visual`: PASS, 118 arquivos, "sem backend ou referências à fonte comercial".
- `npm run preview:visual`: HTTP 200 em `127.0.0.1:3013`.

## 3. Validação visual

- **Mobile 320, 375 e 390 px**: 6 rótulos visíveis (Visão Executiva, Diretorias, Forecast, New Name, Oportunidades, Configurações), nenhum cortado, sem rolagem horizontal.
- **1440 px na Jornada**: botão "Avisos indisponíveis" `disabled` com `title`; perfil deixou de ser botão.
- **Carteira** em 1440 e 390 px: `h1` "Hermínio Gastaldi"; seções "Quem responde abaixo", "Fila de pedidos", "Maiores previstas desta cadeira", "Territórios"; sem rolagem horizontal.
- **Territórios** em 1440 e 390 px: `h1` "Visão CSO · Outubro/2026"; seções "Territórios · quem responde abaixo", "Comparação entre territórios", "O que merece atenção hoje", "Para onde ir daqui" e "Escopo desta tela"; os quatro primeiros territórios aparecem; sem rolagem horizontal.
- **Console**: zero erro e zero aviso nas telas visitadas.
- **Drill CSO → território → filial** em 390 e 320 px: `?territorio=territorio-01` abre "Território 01 · Outubro/2026" com "Filiais · quem responde abaixo", "Filial por filial" e o mapa de calor; `&branch=RS` abre "RS · Rio Grande do Sul" com "Rubrica por rubrica" e "Continuar a análise". Os dois retornos ("← Visão CSO" e "← Voltar à visão executiva") estão presentes. Sem rolagem horizontal e com os 6 rótulos visíveis.

## 4. Limitações e regressões

- Rótulos quebram no meio da palavra em 320/390 px ("Configu rações"). Vem do `overflow-wrap: anywhere` portado; não corta nem estoura, mas é feio.
- O critério "estados de avisos: carregado, vazio e indisponível" **não é aplicável** a esta base. Existe só o estado indisponível (`commercial-sidebar.tsx:340-342`, botão desabilitado). Não há funcionalidade de avisos, logo não há estados carregado nem vazio para testar; construí-la está fora do escopo desta recuperação.
- Leitor de tela e aparelho físico **não verificados**.
- Nenhuma tela do fluxo de importação foi exercitada nesta rodada.
- Nenhuma regressão observada em Carteira, Diretorias e Territórios pela varredura visual das telas citadas.

## 5. M1 — dossiê técnico

`VERIFICADO`: o percentual consolidado do território é `pctBase = base ÷ meta` em `src/features/comercial-v3/regional/regional-model.ts:290`, com `base = ganho + esperado + fora` (`:280`) e `meta` somada de todas as filiais em `resultadoTotal` (`:210`).

`INFERÊNCIA`: filial sem meta contribui com ganho no numerador e com zero no denominador, portanto **infla** o percentual — é a inflação registrada (75% → 106%).

`VERIFICADO`: o modelo já expõe a cobertura. `LinhaTerritorio` carrega `filiaisComMeta` e `filiais` (`territorios-model.ts:184-201`), e a visão CSO lista "X de Y filiais sem meta cadastrada — não entram na comparação" (`:272-274`). Isso informa a cobertura; não corrige o percentual.

As três perguntas de produto seguem abertas:

1. O percentual representa o território inteiro ou só as filiais comparáveis?
2. O ganho de filial sem meta aparece separado, fora do numerador comparável?
3. Territórios com coberturas diferentes podem ser comparados, ou é preciso exigir cobertura integral?

## 6. M2 — mapa de evidência

`VERIFICADO` na fonte (`AP_Auditoria_Completa_2026-10-29.xlsx`, auditoria da exportação AP de 29/10):

- A exportação tem **42 campos** (`Dicionario_42`). O único campo ligado a integração é `W Status Pedido`; existe `Z Data Conferência`, mas **não existe campo de data de integração**.
- A aba `Qualidade`, gate **Q07**, registra literalmente: *"O status de integração existe; a data dedicada não. Conferido não equivale a integrado."*
- `Pedidos_estado`: 7.545 pedidos em "Integrado com ERP" e 272 em "Conferido" — estados sem equivalência automática.
- `Fontes_e_metodo`: a **data de extração declarada é NÃO INFORMADA**.

`VERIFICADO` no código: `new-name-model.ts:45-46` e `:84` traduzem `INTEGRADO`/`INTEGRADO COM ERP` em substatus; `manual-import.ts:300` conta comparando o texto do status.

`INFERÊNCIA`: sem data, a tela pode dizer "integrado", mas não pode afirmar em que competência o evento ocorreu.

**Conclusão de M2**: não é falha de código nem de modelagem — é ausência no **dado de origem**. A correção exige outra extração, com a data de integração, não outro cálculo.

## 7. Próximo passo

M1 depende de decisão do Bruno sobre as três perguntas acima. M2 depende de evidência da fonte. Nenhuma das duas foi implementada.
