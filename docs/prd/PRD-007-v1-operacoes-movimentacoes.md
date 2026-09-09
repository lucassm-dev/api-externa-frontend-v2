# PRD-007 v1 — Operações e movimentações

**Status:** proposto · **Data:** 08/09/2026 · **Depende de:** PRD-005, PRD-006 · **Relacionado:** ADR-005, ADR-006, ADR-007, ADR-008, ADR-010

## Problema

Registrar compras e vendas é o ato central do produto — é o que transforma uma carteira vazia numa tese sendo acompanhada. E é a ação que o investidor mais repete, então cada clique a mais custa.

## Quem usa

Investidor, com frequência. É o fluxo mais usado depois do painel inicial.

## Histórias

**H-007.1 — Registrar compra.** Como investidor, quero registrar a compra de uma quantidade de uma ação numa carteira, com o preço vindo do mercado, sem digitar nada além da quantidade.

**H-007.2 — Registrar venda.** Como investidor, quero registrar a venda de parte ou de toda a minha posição e ver o resultado realizado dessa venda.

**H-007.3 — Usar um preço meu.** Como investidor que está reproduzindo uma operação real, quero poder informar o preço em vez de usar o de mercado.

**H-007.4 — Ver todas as movimentações.** Como investidor, quero um extrato de todas as minhas compras e vendas.

**H-007.5 — Corrigir um lançamento.** Como investidor que errou a quantidade, quero editar a operação e ver a posição recalculada.

**H-007.6 — Excluir um lançamento.** Como investidor que registrou uma operação que não aconteceu, quero removê-la.

## Comportamento esperado

### Uma tela, dois tipos

`[D]` **Compra e venda vivem no mesmo formulário**, com um seletor de tipo no topo. Os campos são os mesmos nos dois casos, e duplicar a tela duplicaria também cada correção feita nela.

O seletor é a primeira coisa da tela e precisa ser inequívoco: o investidor tem que saber o que está prestes a registrar sem reler o formulário. Um par de opções lado a lado, com o selecionado claramente marcado — não um campo de seleção suspenso, que esconde o tipo atrás de um clique.

O que muda entre os dois tipos:

| | Compra | Venda |
|---|---|---|
| Quantidade | Livre | Limitada à posição atual, com o disponível à vista |
| Ação | Qualquer uma do catálogo | Só as que têm posição na carteira escolhida |
| Após confirmar | Operação registrada | Operação registrada **e o resultado realizado** |
| Botão de confirmação | "Registrar compra" | "Registrar venda" |

Trocar o tipo com o formulário preenchido **preserva a carteira e limpa quantidade e preço**. Manter a quantidade seria perigoso: um número válido para compra pode exceder a posição na venda, e o investidor confirmaria sem reler.

### Compra

Campos: **carteira**, **ação**, **quantidade** e, opcionalmente, **preço unitário**.

Por padrão o preço **não é digitado** — vem do mercado no momento do registro. O formulário mostra o preço que será usado e o total estimado antes da confirmação, para o investidor não confirmar às cegas. Ver ADR-008.

Quem quiser informar o próprio preço ativa um controle explícito ("informar preço manualmente"). Preço manual aceita no máximo duas casas decimais; preço automático não tem essa restrição porque é arredondado pelo sistema.

Ação não cadastrada: atalho para o cadastro (PRD-006), com retorno ao formulário.

Após confirmar, o investidor vê a operação registrada com quantidade, preço unitário efetivo, valor total, horário, e — quando houver — os **avisos** da operação (ver abaixo).

`[D]` **Registrar não fecha o formulário.** A confirmação aparece e os campos ficam prontos para a próxima operação, com a carteira preservada e a quantidade limpa. Quem registra uma compra normalmente registra várias na mesma sessão; obrigar a voltar à carteira e entrar de novo a cada lançamento é o atrito mais caro do produto. Há sempre um caminho visível de volta à carteira.

### Venda

Mesmos campos, mesmo formulário. Regras que a tela precisa antecipar em vez de deixar o investidor descobrir no erro:

- Não se vende ação sem posição na carteira
- Não se vende mais do que a posição atual — o formulário mostra a quantidade disponível e impede exceder
- Venda que zera a posição a remove da lista de posições; o histórico e o lucro realizado permanecem

Depois da venda, o investidor vê o **resultado realizado daquela venda** e o preço médio de compra que estava vigente. Esse é o número que ele foi ali buscar.

### Avisos numa operação

Uma operação pode ser registrada com sucesso e ainda assim carregar avisos: o preço usado veio do cache e tem X minutos, o limite da fonte externa foi atingido, a taxa de câmbio usada não é a mais recente. Esses avisos **não são erros** — a operação aconteceu. Eles aparecem junto do resultado, com destaque de atenção, e não devem ser confundidos com falha. Ver ADR-006 e PRD-009.

### Histórico de movimentações

Extrato com todas as compras e vendas do investidor, em todas as carteiras: data e hora, carteira, tipo, ticker, quantidade, preço unitário, valor total e moeda. Ordenado do mais recente para o mais antigo. Paginado.

Nas vendas, também o resultado realizado.

> **Restrição conhecida:** o extrato completo vem do servidor sem filtros — não há busca por carteira, ticker, tipo ou período no servidor. Filtrar apenas o que está na página atual induz o investidor ao erro ("filtrei por PETR4 e não apareceu nada").
>
> `[D]` **Sem filtros no v1.** O extrato entrega ordenação e paginação. O recorte por carteira é atendido pela visão de movimentações dentro da própria carteira, que já existe. Filtro de verdade entra no v2, e depende de o backend aceitar filtro no servidor. Ver ADR-010.

### Editar

Editáveis: **quantidade** e **preço unitário**. Nada mais — nem a ação, nem a carteira, nem o tipo, nem a data.

A edição recalcula preço médio, posição e resultado. A tela precisa avisar disso antes de confirmar: "Editar esta operação vai recalcular a posição e o resultado da carteira." Não é uma correção isolada de uma linha.

Ao editar sem informar preço novo, o sistema reutiliza a última cotação conhecida da ação, sem buscar preço novo. O investidor precisa saber disso.

### Excluir

Remove a operação do extrato e recalcula posição e resultado. Exige confirmação com o mesmo aviso de recálculo. A exclusão é lógica — para o investidor, a operação simplesmente sai do extrato, e não há como desfazer pela interface.

## Critérios de aceite

- Compra e venda são o mesmo formulário, com o tipo selecionado sempre visível sem interação
- Trocar o tipo preserva a carteira e limpa quantidade e preço
- Na venda, o seletor de ação lista apenas as que têm posição na carteira escolhida
- O formulário mostra preço e total estimados antes da confirmação
- Preço manual é opt-in explícito, nunca o padrão
- O formulário de venda mostra a quantidade disponível e impede vender mais do que ela
- Após a venda, o resultado realizado daquela venda é exibido
- Avisos de operação aparecem visualmente separados de erros
- O extrato mostra somente operações do investidor logado
- Editar e excluir pedem confirmação avisando do recálculo
- Após editar ou excluir, os números da carteira na tela refletem o recálculo sem exigir recarga manual
- Não existe filtro que aparente filtrar tudo enquanto filtra só a página atual
- Após registrar uma operação, o formulário continua aberto e pronto para a próxima, com a carteira preservada

## Fora do escopo do v1

Operação em data passada, importação de nota de corretagem, taxas e corretagem, operação recorrente, desfazer exclusão, exportar extrato.

## Perguntas em aberto

Nenhuma.
