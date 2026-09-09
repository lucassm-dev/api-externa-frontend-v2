# Tasks: Operacoes

> feature: operacoes

## T-055 — Contratos e serviço de operações [concluida]
- Refs: AC-154, AC-163, AC-169, AC-171, AC-172, AC-176
- Arquivos: src/app/features/operacoes/operacoes.model.ts, src/app/features/operacoes/operacoes.service.ts, src/app/features/operacoes/operacoes.service.spec.ts
- Esforço: medio
- Notas: cinco chamadas — `POST /operacoes/compra`, `POST /operacoes/venda`, `GET /operacoes?page&size`, `PUT /operacoes/{id}` e `DELETE /operacoes/{id}`. `precoUnitario` é **omitido do corpo** quando o preço é automático: mandar `null` ou `0` seria dizer ao backend que o investidor escolheu esse preço (AC-154, AC-163, AC-176). A leitura do extrato nunca acrescenta parâmetro de filtro — só `page` e `size` (AC-172, ADR-010). O item do extrato traz `lucroRealizado` e `precoMedioCompraNoMomento` como opcionais (ASM-038): ausente é ausente, não é zero.

## T-056 — Preço da operação: estimativa e casas decimais [concluida]
- Refs: AC-164, AC-165
- Arquivos: src/app/features/operacoes/preco-da-operacao.ts, src/app/features/operacoes/preco-da-operacao.spec.ts
- Esforço: baixo
- Notas: duas funções puras. A estimativa combina a última cotação conhecida com a quantidade e devolve preço, total e o horário da cotação — nunca sem o horário (ADR-005), e nada quando não há cotação ou quantidade. A validação de duas casas decimais vale só para preço digitado (ADR-008): preço automático é arredondado pelo backend e nunca passa por aqui (AC-164).

## T-057 — Disponível para venda: derivação pura [concluida]
- Refs: AC-157, AC-158
- Arquivos: src/app/features/operacoes/disponivel-para-venda.ts, src/app/features/operacoes/disponivel-para-venda.spec.ts
- Esforço: baixo
- Notas: das posições da carteira saem as ações vendáveis e a quantidade disponível de cada uma. Ação sem posição não entra na lista — é o que previne OPE-003 antes do erro existir (AC-157). Quantidade acima do disponível é recusada aqui, antes de qualquer envio (AC-158, previne OPE-004).

## T-058 — Formulário de compra e venda [concluida]
- Refs: AC-150, AC-151, AC-152, AC-153, AC-154, AC-156, AC-157, AC-158, AC-159, AC-161, AC-162, AC-163, AC-164, AC-165
- Arquivos: src/app/features/operacoes/formulario/formulario-operacao.ts, src/app/features/operacoes/formulario/formulario-operacao.html, src/app/features/operacoes/formulario/formulario-operacao.scss, src/app/features/operacoes/formulario/formulario-operacao.spec.ts
- Esforço: alto
- Notas: o coração da feature. Seletor de tipo como par de opções lado a lado, primeiro elemento da tela, marcado sem interação — nunca campo suspenso (AC-150). Trocar o tipo preserva a carteira e limpa quantidade e preço: um número válido na compra pode exceder a posição na venda, e o investidor confirmaria sem reler (AC-151). Na compra a ação vem do catálogo; na venda, só as posições da carteira escolhida (AC-152, AC-157). Preço é opt-in: sem o controle ativado não existe campo de preço na tela (AC-162, ADR-008). Antes de confirmar, preço e total **estimados**, com o horário da cotação e a ressalva de que o efetivo pode diferir (AC-165). OPE-004 vindo do servidor destaca a quantidade e mantém tudo preenchido (AC-161). Depois de registrar, o formulário não fecha: carteira preservada, quantidade limpa (AC-156).

## T-059 — Resultado da operação: registrada, com avisos que não são erro [concluida]
- Refs: AC-155, AC-160, AC-166, AC-167, AC-168
- Arquivos: src/app/features/operacoes/resultado/resultado-operacao.ts, src/app/features/operacoes/resultado/resultado-operacao.html, src/app/features/operacoes/resultado/resultado-operacao.scss, src/app/features/operacoes/resultado/resultado-operacao.spec.ts
- Esforço: medio
- Notas: **o ponto crítico da feature.** A operação aconteceu; o bloco afirma isso e mostra os números da resposta — inclusive o `precoUnitario` efetivo, que pode não ser a estimativa que estava no formulário (AC-155). Cada aviso usa o nível "aviso" da fundação, jamais o componente de erro: aviso pintado de vermelho faz o investidor registrar de novo e criar uma compra que nunca existiu (AC-166, AC-167, ADR-006). Lista vazia não vira mensagem nenhuma (AC-168). Nas vendas, resultado realizado e preço médio de compra no momento — o número que o investidor foi ali buscar (AC-160).

## T-060 — Extrato paginado, sem filtro nenhum [concluida]
- Refs: AC-169, AC-170, AC-171, AC-172, AC-179, AC-180, AC-182
- Arquivos: src/app/features/operacoes/extrato/extrato-operacoes.ts, src/app/features/operacoes/extrato/extrato-operacoes.html, src/app/features/operacoes/extrato/extrato-operacoes.scss, src/app/features/operacoes/extrato/extrato-operacoes.spec.ts
- Esforço: alto
- Notas: data e hora, carteira, tipo, ticker, quantidade, preço unitário, valor total e moeda, do mais recente para o mais antigo, paginado (AC-169, AC-171). Nas vendas, o resultado realizado; ausente, o campo some da linha em vez de virar traço ou zero (AC-170, ASM-038). **Nenhum controle de filtro ou busca é construído** — filtrar só a página carregada faria o investidor concluir que o sistema perdeu um lançamento (AC-172, ADR-010). Excluir usa o diálogo compartilhado com o aviso de recálculo e a ausência de desfazer (AC-179); OPE-001 relê o extrato em vez de insistir (AC-182).

## T-061 — Edição de quantidade e preço [concluida]
- Refs: AC-174, AC-175, AC-176, AC-177, AC-182
- Arquivos: src/app/features/operacoes/edicao/editar-operacao.ts, src/app/features/operacoes/edicao/editar-operacao.html, src/app/features/operacoes/edicao/editar-operacao.scss, src/app/features/operacoes/edicao/editar-operacao.spec.ts
- Esforço: medio
- Notas: só quantidade e preço unitário são editáveis; ação, carteira, tipo e data aparecem como informação, sem controle que insinue edição (AC-174). Salvar pede confirmação dizendo que a edição recalcula a posição e o resultado da carteira inteira — não é correção de uma linha isolada (AC-175). Sem preço novo, a tela avisa que o sistema reutiliza a última cotação conhecida da ação, e o envio realmente não leva preço (AC-176). A resposta pode trazer avisos, tratados como no registro (ASM-039).

## T-062 — Tela de operações: formulário no topo, extrato abaixo [concluida]
- Refs: AC-153, AC-156, AC-173, AC-177, AC-180
- Arquivos: src/app/features/operacoes/operacoes.ts, src/app/features/operacoes/operacoes.html, src/app/features/operacoes/operacoes.scss, src/app/features/operacoes/operacoes.spec.ts
- Esforço: alto
- Notas: uma tela só (Q-019), que honra `?carteira=&tipo=` vindos do detalhe da carteira e continua sendo o destino de "ver o extrato completo". Compõe formulário, resultado, extrato e edição. Registrar, editar e excluir releem o extrato ali mesmo, sem recarga manual (AC-173, AC-177, AC-180). O caminho de volta à carteira fica sempre visível, e o formulário nunca fecha (AC-156).

## T-063 — Editar e excluir a partir da carteira, com os números recalculados [concluida]
- Refs: AC-178, AC-181
- Arquivos: src/app/features/carteiras/detalhe/movimentacoes-carteira.ts, src/app/features/carteiras/detalhe/movimentacoes-carteira.html, src/app/features/carteiras/detalhe/movimentacoes-carteira.spec.ts, src/app/features/carteiras/detalhe/detalhe-carteira.ts, src/app/features/carteiras/detalhe/detalhe-carteira.html, src/app/features/carteiras/detalhe/detalhe-carteira.spec.ts
- Esforço: medio
- Notas: é no detalhe da carteira que o recálculo fica visível (Q-020). A seção de movimentações ganha editar e excluir e avisa o detalhe quando algo mudou; o detalhe relê posições, consolidado, resultado realizado e movimentações (AC-178, AC-181). Nenhum outro comportamento da tela de carteira é alterado.

## T-064 — Rotas da área de operações [concluida]
- Refs: AC-150, AC-172
- Arquivos: src/app/features/operacoes/operacoes.routes.ts, src/app/features/operacoes/operacoes.routes.spec.ts, src/app/app.routes.ts
- Esforço: baixo
- Notas: substitui a área em construção pela tela real, sob a casca e a guarda de sessão, mantendo `/operacoes` como o endereço que os links existentes já usam.
