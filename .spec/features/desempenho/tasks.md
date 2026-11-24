# Tasks: Desempenho

> feature: desempenho

## T-065 — Moeda de cada posição e conversão para real [concluida]
- Refs: AC-193, AC-199
- Arquivos: src/core/sessao/sessao.service.ts, src/features/acoes/acoes.model.ts, src/features/carteiras/carteiras.model.ts, src/features/desempenho/composicao.spec.ts, src/features/desempenho/composicao.ts, src/features/desempenho/contribuicao.spec.ts, src/features/desempenho/contribuicao.ts, src/features/desempenho/desempenho.spec.tsx, src/features/desempenho/desempenho.tsx, src/features/desempenho/moeda-das-posicoes.spec.ts, src/features/desempenho/moeda-das-posicoes.ts, src/features/painel/carteira-preferida.ts, src/rotas.tsx
- Notas: função pura sobre o mapa ticker→moeda (vindo do catálogo de ações) e a taxa do consolidado. `BRL` passa direto, `USD` multiplica pela taxa, ticker fora do catálogo tem moeda desconhecida e sai sem conversão marcado como tal (ASM-048) — nunca converte no escuro. É a armadilha da tela: quem ignora isso plota dólar ao lado de real.

## T-066 — Os quatro números e os percentuais sobre o investido [concluida]
- Refs: AC-183, AC-184, AC-185, AC-186
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/numeros-desempenho.spec.tsx, src/features/desempenho/blocos/numeros-desempenho.tsx, src/features/desempenho/resultados.spec.ts, src/features/desempenho/resultados.ts
- Notas: função pura que monta os quatro números a partir do consolidado e do lucro realizado. Realizado e não realizado saem como campos separados — não existe função que some os dois, e o teste de AC-184 assere isso. Investido zero devolve percentual `null`, como `percentualNaoRealizado` de carteiras já faz.

## T-067 — Composição do valor de mercado e conferência com o consolidado [concluida]
- Refs: AC-192, AC-194, AC-195, AC-196
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/grafico-composicao.spec.tsx, src/features/desempenho/blocos/grafico-composicao.tsx, src/features/desempenho/composicao.spec.ts, src/features/desempenho/composicao.ts, src/features/desempenho/moeda-das-posicoes.ts
- Notas: fatias de `quantidade × cotacaoAtual` convertidas para real, ordenadas da maior à menor, com participação percentual. Devolve junto o resultado da conferência com `valorDeMercado`: fecha ou não fecha, com a diferença. Tolerância de 0,5%. Só posições abertas entram (ticker que só existe no realizado não vira fatia).

## T-068 — Contribuição por ativo [concluida]
- Refs: AC-198, AC-199
- Arquivos: src/features/acoes/acoes.model.ts, src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/grafico-contribuicao.spec.tsx, src/features/desempenho/blocos/grafico-contribuicao.tsx, src/features/desempenho/contribuicao.spec.ts, src/features/desempenho/contribuicao.ts, src/features/desempenho/moeda-das-posicoes.spec.ts, src/features/desempenho/moeda-das-posicoes.ts
- Notas: `rentabilidadeNaoRealizada` de cada posição convertida para real e ordenada do maior ganho à maior perda. Mesma atenção à moeda da composição — reusa T-065.

## T-069 — Lucro realizado por ticker [concluida]
- Refs: AC-202, AC-203
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/grafico-realizado.spec.tsx, src/features/desempenho/blocos/grafico-realizado.tsx, src/features/desempenho/realizado-por-ticker.spec.ts, src/features/desempenho/realizado-por-ticker.ts
- Notas: transforma `porTicker` em barras ordenadas, inclusive de tickers sem posição aberta. Total exibido é o `total` do backend, nunca a soma refeita no cliente. Mapa vazio é o estado "nenhuma venda ainda", distinto de falha de leitura.

## T-070 — Idade das cotações da carteira [concluida]
- Refs: AC-206, AC-207
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/confissoes-desempenho.spec.tsx, src/features/desempenho/blocos/confissoes-desempenho.tsx, src/features/desempenho/idade-das-cotacoes.spec.ts, src/features/desempenho/idade-das-cotacoes.ts
- Notas: acha o `dataHoraCotacao` mais antigo entre as posições — é ele que qualifica a tela — e lista os tickers defasados usando `estaDefasado` da fundação (ADR-005). Sem posições, não há horário: devolve `null`, não a data de hoje.

## T-071 — Contratos e serviço da tela [concluida]
- Refs: AC-189, AC-211
- Arquivos: src/core/sessao/sessao.service.ts, src/features/desempenho/desempenho.service.spec.ts, src/features/desempenho/desempenho.service.ts, src/features/desempenho/desempenho.spec.tsx, src/features/desempenho/desempenho.tsx, src/features/painel/carteira-preferida.ts, src/rotas.tsx
- Notas: quatro leituras por carteira (consolidado, posições, lucro realizado) mais a varredura do catálogo de ações para o mapa ticker→moeda (ASM-045, ASM-046). Cada leitura falha sozinha e vira `null` sem derrubar as outras (ADR-006). Reusa `CarteirasService` e `AcoesService`; nenhum endpoint novo.

## T-072 — Tokens de cor das séries dos gráficos [concluida]
- Refs: AC-187, AC-200
- Arquivos: src/features/desempenho/blocos/grafico-contribuicao.spec.tsx, src/features/desempenho/blocos/grafico-contribuicao.tsx, src/features/desempenho/blocos/numeros-desempenho.spec.tsx, src/features/desempenho/blocos/numeros-desempenho.tsx, src/features/desempenho/contribuicao.ts, src/features/desempenho/resultados.ts
- Notas: paleta categórica para as fatias e tokens de ganho/perda dos gráficos, em claro e escuro. Cor literal só existe aqui (P-003). Nenhum gráfico depende só dela: a distinção vem de sinal, rótulo e padrão.

## T-073 — Gráfico de composição em SVG [concluida]
- Refs: AC-192, AC-195, AC-197
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/grafico-composicao.spec.tsx, src/features/desempenho/blocos/grafico-composicao.tsx, src/features/desempenho/composicao.spec.ts, src/features/desempenho/composicao.ts, src/features/desempenho/moeda-das-posicoes.ts
- Notas: SVG próprio, sem biblioteca. Cada fatia tem ticker, valor e percentual em texto — o desenho não é a única forma de ler. Ressalva de conferência aparece junto do gráfico quando a soma não fecha. Sem eixo de tempo, e o título não usa a palavra evolução.

## T-074 — Gráfico de contribuição em SVG [concluida]
- Refs: AC-198, AC-200, AC-201
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/grafico-contribuicao.spec.tsx, src/features/desempenho/blocos/grafico-contribuicao.tsx, src/features/desempenho/contribuicao.spec.ts, src/features/desempenho/contribuicao.ts, src/features/desempenho/moeda-das-posicoes.ts
- Notas: barras divergentes a partir de uma linha zero, ganho para um lado e perda para o outro, com sinal e a direção escrita em cada uma. Ordenado do maior ganho à maior perda. Sem eixo de tempo.

## T-075 — Gráfico de lucro realizado em SVG [concluida]
- Refs: AC-202, AC-204
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/grafico-realizado.spec.tsx, src/features/desempenho/blocos/grafico-realizado.tsx, src/features/desempenho/realizado-por-ticker.spec.ts, src/features/desempenho/realizado-por-ticker.ts
- Notas: barras por ticker do que já foi apurado. É número fechado: não muda com cotação, e o texto do bloco diz isso. Sem eixo de tempo.

## T-076 — Bloco dos quatro números [concluida]
- Refs: AC-183, AC-184, AC-185, AC-186, AC-187, AC-188
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/numeros-desempenho.spec.tsx, src/features/desempenho/blocos/numeros-desempenho.tsx, src/features/desempenho/resultados.spec.ts, src/features/desempenho/resultados.ts
- Notas: os quatro na ordem do PRD-008, valor absoluto e percentual sobre o investido, resultados via `Variacao` (seta e palavra, nunca só cor). Realizado e não realizado em cartões separados e rotulados. Nenhum rótulo promete anualizada.

## T-077 — Confissões permanentes e idade dos preços [concluida]
- Refs: AC-205, AC-206, AC-207, AC-208
- Arquivos: src/core/sessao/sessao.service.ts, src/features/carteiras/carteiras.model.ts, src/features/desempenho/blocos/confissoes-desempenho.spec.tsx, src/features/desempenho/blocos/confissoes-desempenho.tsx, src/features/desempenho/desempenho.spec.tsx, src/features/desempenho/desempenho.tsx, src/features/desempenho/idade-das-cotacoes.spec.ts, src/features/desempenho/idade-das-cotacoes.ts, src/features/painel/carteira-preferida.ts, src/rotas.tsx
- Notas: os dois avisos que a tela precisa fazer — sem dividendos nem JCP, e preços são snapshots de idades diferentes com o horário mais antigo à vista — mais os avisos vindos do consolidado (câmbio) e a marcação de cotação defasada. Tudo no corpo da tela, nunca em tooltip ou rodapé.

## T-078 — Tela de desempenho: seletor, orquestração e estados vazios [concluida]
- Refs: AC-189, AC-190, AC-191, AC-209, AC-210, AC-211
- Arquivos: src/core/sessao/sessao.service.ts, src/features/desempenho/desempenho.service.spec.ts, src/features/desempenho/desempenho.service.ts, src/features/desempenho/desempenho.spec.tsx, src/features/desempenho/desempenho.tsx, src/features/painel/carteira-preferida.ts, src/rotas.tsx
- Notas: seletor no topo com carteiras concretas apenas, escolha lembrada por `CarteiraPreferida` (a mesma do painel, para que a escolha valha nas duas telas). Sem carteira, convite a criar; carteira sem posição e sem realizado, convite a registrar a primeira compra em vez de gráficos zerados. Leitura que falha degrada o bloco.

## T-079 — Rota de desempenho no lugar da área em construção [concluida]
- Refs: AC-209, AC-210
- Arquivos: src/core/sessao/sessao.service.ts, src/features/desempenho/desempenho.spec.tsx, src/features/desempenho/desempenho.tsx, src/features/painel/carteira-preferida.ts, src/rotas.tsx
- Notas: substitui o destino mínimo de `/desempenho` (Q-008 da fundação). Última área do produto a sair da construção.
