# PRD-009 v1 — Confiabilidade percebida

**Status:** proposto · **Data:** 08/09/2026 · **Depende de:** todas · **Relacionado:** ADR-005, ADR-006, ADR-009

## Problema

Este produto exibe dinheiro. Um número errado, ou um número certo que **parece** errado, custa a confiança inteira — e o investidor não volta. Além disso, o produto depende de fontes externas gratuitas que falham, atrasam e esgotam cota com frequência. Sem um tratamento consistente disso, cada tela vai inventar o seu, e o produto vira um mosaico de mensagens.

Este PRD não descreve uma tela. Descreve o **comportamento transversal** que todas as telas seguem.

## Quem usa

Todo investidor, em todas as telas, principalmente nos dias ruins.

## Histórias

**H-009.1 — Confiar no número.** Como investidor, quero saber de quando é cada preço que vejo, para julgar se posso decidir com base nele.

**H-009.2 — Distinguir aviso de erro.** Como investidor, quero saber quando algo falhou e quando algo apenas está desatualizado.

**H-009.3 — Entender o erro.** Como investidor, quero mensagens que digam o que eu posso fazer, não códigos.

**H-009.4 — Não perder o que digitei.** Como investidor que recebeu um erro num formulário, quero encontrar meus dados ainda lá.

## Comportamento esperado

### Os três níveis de comunicação

O produto tem exatamente três, e nunca mistura:

| Nível | Quando | Como se comporta |
|---|---|---|
| **Informação** | O dado está aí, com uma ressalva de idade ou origem | Discreto, ao lado do número. Ex.: horário da cotação |
| **Aviso** | A ação **deu certo**, mas com uma condição que o investidor precisa saber | Destaque de atenção, junto do resultado. Não bloqueia. Ex.: "operação registrada com o preço de 15 minutos atrás" |
| **Erro** | A ação **não aconteceu** | Bloqueia, explica o motivo e diz o que fazer |

O caso que mais confunde é o do meio: uma operação registrada com sucesso pode trazer avisos. Se a interface pintar isso de vermelho, o investidor acha que a compra falhou e registra de novo — criando uma operação duplicada de verdade. **Aviso não pode parecer erro.**

### Idade do dado

Todo preço e toda taxa de câmbio na interface aparece com o momento em que foi obtida. Sem exceção e em toda tela.

`[D]` **Passados 15 minutos, o dado ganha marcação visual** — não basta a hora em letra pequena. O limite acompanha o tempo de vida do cache do sistema: dentro dele, o valor é o mais novo que o produto tem; fora dele, ou ninguém atualizou, ou a fonte falhou.

### Quando a fonte externa falha

O produto **degrada, não quebra**. Regras:

- Falha ao obter preço não impede registrar operação: usa o último preço conhecido e avisa
- Falha ao obter câmbio não zera o consolidado: usa a última taxa conhecida e avisa
- Falha numa fonte da barra de mercado remove aquele item, não a barra
- Só quando não existe **nenhum** dado anterior a ação é recusada, e aí a mensagem diz exatamente isso

Nunca, em nenhuma tela: campo em branco, traço, zero ou "—" no lugar de um valor que falhou sem explicação.

### Mensagens de erro

O backend responde erro sempre no mesmo formato, com um código por domínio (`COR-003`, `ACA-004`, `OPE-004`...). Do lado do investidor:

- **O texto é escrito para ele**, não a mensagem crua do servidor
- **O código aparece de forma discreta**, para ele conseguir relatar o problema — mas nunca é a mensagem principal
- **Erro de validação de campo aponta o campo**, não um balão genérico no topo
- **Falha não mapeada** vira uma mensagem honesta e genérica: "Algo deu errado do nosso lado. Tente novamente." Nunca stacktrace, nome de classe ou "Internal Server Error"

Ver ADR-009 para o contrato de erro.

### Formulários

- Erro nunca limpa o formulário
- Validação que dá para fazer antes do envio é feita antes (formato de CPF, senha, quantidade mínima, casas decimais)
- Enquanto uma ação está em andamento, o botão fica indisponível — nenhuma operação financeira pode ser enviada duas vezes por duplo clique
- `[D]` Ações que recalculam a carteira (editar e excluir operação) e ações destrutivas (excluir carteira, corretora, ação) pedem **confirmação simples** — um diálogo que descreve a consequência e tem dois botões. Nada de digitar o nome do que será excluído: o atrito extra não se justifica num produto sem dinheiro real, e a maioria das exclusões perigosas já está bloqueada por vínculo ativo

### Carregamento

- Consultas a fontes externas (cadastro de corretora, cadastro de ação, atualização de cotação) são lentas por natureza e precisam de indicação clara de progresso
- Listas e painéis carregam com esqueleto no lugar do conteúdo, não spinner de tela inteira
- Nenhuma tela fica em branco por mais de um instante

## Critérios de aceite

- Nenhum preço ou taxa é exibido sem o horário de obtenção
- Aviso e erro têm tratamento visual inequivocamente distinto
- Uma operação registrada com aviso nunca é apresentada como falha
- Toda falha de fonte externa resulta em dado antigo + aviso, nunca em tela quebrada
- Nenhuma mensagem técnica do servidor chega ao investidor como texto principal
- Erro em formulário preserva o que foi digitado e destaca o campo
- Botões de ação ficam indisponíveis durante o envio
- Toda ação destrutiva ou que recalcula a carteira pede confirmação simples com a consequência descrita
- Nenhum preço ou taxa com mais de 15 minutos aparece sem marcação visual

## Fora do escopo do v1

Central de notificações, histórico de avisos, página de status do sistema, modo offline, repetição automática de requisição falha.

## Catálogo de mensagens `[D]`

`[D]` **O código do erro aparece para o investidor**, discreto, no rodapé da mensagem — nunca como texto principal. É o que permite relatar um problema com precisão, e durante o desenvolvimento é o que leva à causa em segundos.

Cada código tem uma mensagem própria, escrita para o investidor, e um comportamento definido de tela. Nenhum deles cai no genérico. A tabela abaixo é o contrato: enquanto ela não estiver coberta, o tratamento de erro não está pronto.

### Corretora

| Código | Mensagem ao investidor | Comportamento da tela |
|---|---|---|
| COR-001 | "Corretora não encontrada." | Volta à lista de corretoras |
| COR-002 | "Esta corretora já está cadastrada." | Mostra a corretora existente e oferece usá-la. Não é beco sem saída |
| COR-003 | Depende do motivo, e o motivo vem no texto do servidor: CNPJ inválido, não encontrado na Receita, CEP inexistente, ou empresa não autorizada na CVM | Permanece no formulário, preserva o CNPJ digitado, destaca o campo |
| COR-004 | "Esta corretora tem carteiras vinculadas e não pode ser removida." | Cancela a exclusão. Não revela de quem são as carteiras |

> **COR-003 é o código mais delicado do sistema.** Ele cobre quatro situações, e uma delas — "não autorizada na CVM" — é uma acusação sobre uma empresa real. A tela precisa reproduzir o motivo que o servidor informou, e nunca resumir os quatro casos numa mensagem só. Ele também não pode ser confundido com EXT-007, que é falha de infraestrutura.

### Ação

| Código | Mensagem ao investidor | Comportamento da tela |
|---|---|---|
| ACA-001 | "Ação não encontrada." | Volta ao catálogo |
| ACA-002 | "Este ticker já está cadastrado." | Mostra a ação existente e oferece usá-la |
| ACA-003 | "Esta ação tem posições abertas e não pode ser removida." | Cancela a exclusão |
| ACA-004 | "Crie uma carteira antes de cadastrar ações." | Oferece o atalho para criar carteira. Este erro deveria ser raro: a entrada do cadastro já é bloqueada antes (ver ADR-003) |

### Carteira

| Código | Mensagem ao investidor | Comportamento da tela |
|---|---|---|
| CAR-001 | "Carteira não encontrada." | Volta à lista de carteiras. **Nunca** dizer "esta carteira é de outro investidor" — o servidor responde o mesmo nos dois casos, de propósito |
| CAR-002 | "Esta carteira ainda tem posições abertas. Venda ou zere as posições antes de excluí-la." | Cancela a exclusão |

### Operação

| Código | Mensagem ao investidor | Comportamento da tela |
|---|---|---|
| OPE-001 | "Operação não encontrada." | Recarrega o extrato — provavelmente ela foi excluída em outra aba |
| OPE-003 | "Você não tem posição nesta ação para vender." | Permanece no formulário |
| OPE-004 | "Você tem apenas {quantidade} unidades desta ação." | Permanece no formulário e destaca a quantidade. Deveria ser raro: o formulário já mostra e limita a quantidade disponível |
| OPE-005 | "O preço pode ter no máximo 2 casas decimais." | Destaca o campo de preço. Só acontece com preço digitado manualmente |

### Autenticação

| Código | Mensagem ao investidor | Comportamento da tela |
|---|---|---|
| AUT-001 | "Este e-mail já está em uso." | Permanece no cadastro, destaca o campo de e-mail |
| AUT-002 | "Este CPF já está em uso." | Permanece no cadastro, destaca o campo de CPF |
| AUT-003 | "Investidor não encontrado." | Volta ao painel |
| AUT-004 | "E-mail ou senha incorretos." | Permanece no login. **Nunca** detalhar qual dos dois errou, nem se a conta existe |
| AUT-005 | "Sua sessão não é mais válida. Entre novamente." | Encerra a sessão e vai ao login |
| AUT-006 | "Sua sessão expirou. Entre novamente." | Encerra a sessão e vai ao login |
| AUT-007 | "Você não tem permissão para acessar isto." | Volta ao painel |
| AUT-008 | "A senha precisa ter ao menos 8 caracteres, com letra e número." | Destaca o campo de senha. Deveria ser raro: a regra é validada antes do envio |

### Integração externa

| Código | Mensagem ao investidor | Comportamento da tela |
|---|---|---|
| EXT-007 | "Não conseguimos verificar esta corretora agora. Tente novamente em instantes." | Permanece no formulário com o CNPJ preservado. **Nunca** apresentar como reprovação — é falha de infraestrutura, não veredito sobre a empresa |
| EXT-008 | "Não encontramos este ticker no mercado selecionado. Confira o código e o mercado." | Permanece no formulário |
| EXT-009 | "O limite de consultas da fonte foi atingido. O preço exibido é de {horário}." | Mantém o último preço na tela. Em compra e venda isso chega como **aviso**, não erro — a operação aconteceu |
| EXT-010 | "A fonte de cotação está indisponível. O preço exibido é de {horário}." | Idem EXT-009 |
| EXT-011 | "A cotação do dólar está indisponível. O valor usa a taxa de {horário}." | Chega como aviso quando há taxa em cache; só é erro quando nunca houve taxa alguma |

### Genéricos

| Código | Mensagem ao investidor | Comportamento da tela |
|---|---|---|
| VAL-001 | Uma mensagem por campo, vinda da lista de erros da resposta | Destaca cada campo com erro. **Nunca** um balão único no topo |
| SYS-001 | "Algo deu errado do nosso lado. Tente novamente." | Preserva o que o investidor digitou. Nunca stacktrace, nome de classe ou "Internal Server Error" |
| — | Sem resposta do servidor (rede, backend fora do ar) | "Não foi possível conectar ao sistema. Verifique sua conexão." |
| — | Código desconhecido, não previsto nesta tabela | Mesma mensagem de SYS-001, com o código exibido no rodapé |

### Regras que valem para a tabela inteira

- O comportamento é decidido pelo **código**, jamais pelo texto da mensagem (ver ADR-009)
- Um código que não está nesta tabela degrada para a mensagem genérica **com o código visível** — assim ele aparece num relato e vira uma linha nova aqui
- Códigos que a tabela marca como "deveria ser raro" são rede de segurança: se aparecerem com frequência, é sinal de que o formulário deixou de prevenir algo que deveria

## Perguntas em aberto

Nenhuma.
