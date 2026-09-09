# PRD-006 v1 — Catálogo de ações

**Status:** proposto · **Data:** 08/09/2026 · **Depende de:** PRD-005 · **Relacionado:** ADR-002, ADR-003, ADR-005, ADR-007

## Problema

Só é possível comprar uma ação que exista no sistema, com preço vindo de fonte real. O catálogo é a ponte entre "quero comprar PETR4" e "o sistema sabe o que é PETR4 e quanto custa".

## Quem usa

Investidor, sempre que quiser operar um ativo que ainda não está no sistema.

## Histórias

**H-006.1 — Cadastrar ação.** Como investidor, quero cadastrar uma ação informando o ticker e o mercado, para poder operá-la.

**H-006.2 — Consultar o catálogo.** Como investidor, quero listar as ações disponíveis e buscar por ticker, antes de cadastrar uma que já existe.

**H-006.3 — Ver a cotação e saber de quando ela é.** Como investidor, quero ver o preço atual de uma ação junto do horário em que ele foi obtido.

**H-006.4 — Atualizar a cotação.** Como investidor, quero forçar a busca de um preço novo quando o exibido estiver velho demais para o que quero decidir.

**H-006.5 — Remover ação.** Como investidor, quero remover do catálogo uma ação que cadastrei por engano.

## Comportamento esperado

### Cadastro

Dois campos: **ticker** e **mercado** (Brasil ou Estados Unidos). O sistema consulta a fonte do mercado escolhido e traz o nome da empresa, a moeda e a cotação com o horário.

Ticker que não existe na fonte não é cadastrado: "Não encontramos este ticker no mercado selecionado. Confira o código e o mercado."

**Cadastrar ação exige ter pelo menos uma carteira ativa.** Um investidor sem carteira que tenta cadastrar ação recebe uma mensagem que aponta o caminho, não um erro seco: "Crie uma carteira antes de cadastrar ações" com o atalho para a criação. Essa regra vem do domínio (ver ADR-003) e é a que mais gera confusão se a tela não a antecipar — o ideal é a própria entrada do cadastro de ações já estar bloqueada com explicação para quem não tem carteira.

### Listagem

Ticker, nome da empresa, mercado, moeda, cotação e horário da cotação. Paginada, com busca por ticker.

**Assim como as corretoras, o catálogo é compartilhado.** Uma ação cadastrada por qualquer investidor serve a todos, porque o ticker é único no sistema inteiro. Não existe "minhas ações". Ver ADR-002.

### Cotação

Toda cotação exibida traz o momento em que foi obtida — sem exceção, em toda tela. O produto trabalha com preço em cache: o número visto pode ter alguns minutos.

`[D]` **Cotação com mais de 15 minutos é marcada visualmente como desatualizada.** O limite não é arbitrário: 15 minutos é o tempo de vida do cache do sistema. Dentro dele, o preço é o mais novo que o produto tem para oferecer. Passado ele, ou ninguém pediu atualização, ou a fonte falhou — nos dois casos o investidor precisa saber antes de decidir.

`[D]` **A cotação nunca se atualiza sozinha.** Atualizar é ação explícita do investidor, em toda tela. Atualização automática queimaria em minutos a cota gratuita compartilhada por todos os investidores, e transformaria o uso normal do produto numa sequência de erros de limite excedido. Ela pode:
- trazer preço novo
- devolver o mesmo preço (o cache ainda vale) — a tela precisa deixar claro que nada mudou e por quê
- falhar por limite da fonte externa esgotado — "O limite de consultas da fonte foi atingido. O preço exibido é de {horário}."
- falhar por fonte indisponível — mesma ideia, motivo diferente

Em nenhum desses casos a tela quebra. O último preço conhecido continua na tela, sempre com seu horário.

### Exclusão

Bloqueada se a ação tiver posição aberta em qualquer carteira, de qualquer investidor. A mensagem explica: "Esta ação tem posições abertas e não pode ser removida." Exclusão é lógica e o ticker fica livre para novo cadastro depois.

## Critérios de aceite

- Cadastro pede ticker e mercado, e nada mais
- Investidor sem carteira é conduzido à criação de carteira antes de tentar cadastrar ação
- Ticker inexistente na fonte não cria registro
- Ticker duplicado leva à ação existente, não a um erro sem saída
- Toda cotação exibida, em qualquer tela, vem acompanhada do horário
- Cotação com mais de 15 minutos é destacada visualmente como desatualizada
- Nenhuma tela busca cotação nova sem o investidor pedir
- Falha na atualização de cotação mantém o último preço na tela, com o motivo explicado
- Exclusão bloqueada por posição aberta explica o motivo

## Fora do escopo do v1

Gráfico de histórico de preço, dados fundamentalistas, notícias do ativo, favoritos, alertas de preço, edição do cadastro da ação, atualização automática de cotação.

`[D]` **Destacar na lista as ações que o investidor possui também fica fora do v1.** Ao contrário do selo das corretoras, que sai de uma consulta só, este exigiria varrer as posições de todas as carteiras do investidor para montar a marcação. Custo desproporcional ao ganho, e o backend não oferece isso pronto.

## Perguntas em aberto

Nenhuma.
