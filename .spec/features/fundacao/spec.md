# Spec: Fundacao

> feature: fundacao
> status: pronta

## Contexto

A fundação do aplicativo do investidor: o esqueleto Angular e tudo o que atravessa
todas as telas — tema claro/escuro, pt-BR com real e dólar, acesso à API pela mesma
origem, tradução de erro por código, os três níveis de comunicação, exibição de dado
com horário e a sessão com guarda de rota. Nenhuma tela de produto é construída aqui;
o que se constrói é o que as telas vão consumir depois.

## Histórias

### US-001 — Entender o erro em vez de ler código

Como investidor, quero mensagens que digam o que aconteceu e o que posso fazer,
para não ter que interpretar um código técnico do servidor.

#### AC-001 — Código conhecido vira a mensagem do produto

- **Dado** que o servidor recusou uma ação com o código `OPE-004`
- **Quando** a tela pede a tradução desse erro
- **Então** o investidor recebe a mensagem escrita para ele ("Você tem apenas {quantidade} unidades desta ação."), com o código `OPE-004` disponível para exibição discreta, e a decisão nunca depende do texto que o servidor mandou (ADR-009)

#### AC-002 — Código desconhecido cai no genérico com o código visível

- **Dado** que o servidor respondeu um código que não está no catálogo do frontend (por exemplo `XYZ-999`)
- **Quando** a tela pede a tradução desse erro
- **Então** o investidor vê a mensagem genérica "Algo deu errado do nosso lado. Tente novamente." e o código `XYZ-999` continua visível no rodapé, para ele conseguir relatar o problema

#### AC-003 — Erro de validação aponta os campos, nunca um balão único

- **Dado** um erro `VAL-001` com uma lista de erros por campo (`fieldErrors`)
- **Quando** a tela trata esse erro
- **Então** cada mensagem fica associada ao seu campo do formulário e nenhuma mensagem única de topo é produzida

#### AC-004 — Falta de resposta do servidor tem mensagem própria

- **Dado** que a requisição não obteve resposta alguma (rede fora, backend fora do ar)
- **Quando** a tela trata a falha
- **Então** o investidor vê "Não foi possível conectar ao sistema. Verifique sua conexão.", texto diferente do erro interno do servidor (`SYS-001`)

#### AC-005 — Token inválido ou expirado encerra a sessão

- **Dado** que o servidor respondeu `AUT-005` ou `AUT-006`
- **Quando** a tela trata esse erro
- **Então** a sessão é encerrada e o investidor é levado ao login com a mensagem do código correspondente

### US-002 — Distinguir aviso de erro

Como investidor, quero saber quando algo falhou e quando algo apenas aconteceu com
ressalva, para não repetir uma operação que já deu certo e acabar duplicando o lançamento.

#### AC-006 — Os três níveis se apresentam de forma inequivocamente distinta

- **Dado** uma informação, um aviso e um erro para comunicar
- **Quando** cada um é apresentado
- **Então** os três carregam marcação de nível distinta e legível por leitor de tela (papel e rótulo próprios), sem que aviso e erro compartilhem a mesma apresentação

#### AC-007 — Sucesso com aviso nunca é apresentado como falha

- **Dado** uma operação concluída com sucesso que trouxe avisos na resposta (ADR-006)
- **Quando** o resultado é comunicado ao investidor
- **Então** ele é apresentado no nível aviso, junto do resultado, sem bloquear e sem a apresentação de erro

### US-003 — Confiar no número que está na tela

Como investidor, quero saber de quando é cada preço e cada taxa de câmbio que vejo,
para julgar se posso decidir com base nele.

#### AC-008 — Todo preço aparece com o momento em que foi obtido

- **Dado** um preço com o instante de obtenção
- **Quando** ele é exibido
- **Então** o valor formatado e o horário de obtenção aparecem juntos, nunca o valor sozinho

#### AC-009 — Dado com mais de 15 minutos ganha marcação visual

- **Dado** um preço obtido há mais de 15 minutos
- **Quando** ele é exibido
- **Então** ele recebe a marcação de dado defasado, além do horário em texto (ADR-005)

#### AC-010 — O limite de 15 minutos é exato

- **Dado** um preço obtido há exatamente 15 minutos e outro há 15 minutos e um segundo
- **Quando** a idade de cada um é avaliada
- **Então** o primeiro ainda não é defasado e o segundo é

### US-004 — Continuar entrado entre sessões, e sair quando quiser

Como investidor, quero que fechar o navegador não me deslogue e que sair encerre
de fato a sessão, para não reentrar a cada uso e ainda proteger uma máquina compartilhada.

#### AC-011 — A sessão sobrevive ao fechamento do navegador

- **Dado** que o investidor entrou e depois fechou o navegador
- **Quando** ele abre a aplicação de novo, antes do prazo do token
- **Então** a sessão é recuperada do armazenamento persistente e ele continua entrado

#### AC-012 — Sair apaga a sessão

- **Dado** um investidor com sessão ativa
- **Quando** ele sai
- **Então** nada da sessão permanece armazenado e a aplicação passa a se comportar como sem sessão

#### AC-013 — Token vencido não é sessão

- **Dado** uma sessão armazenada cujo momento de expiração já passou
- **Quando** a aplicação é carregada
- **Então** ela é tratada como ausência de sessão e o armazenamento é limpo, sem consultar o servidor

#### AC-014 — O aviso de sessão acabando sai do próprio login

- **Dado** uma sessão cujo momento de expiração está a menos de 5 minutos
- **Quando** a aplicação avalia o estado da sessão
- **Então** ela sinaliza que a sessão está para acabar, usando apenas o instante de expiração devolvido no login, sem nenhuma requisição ao servidor

### US-005 — Nenhuma tela interna sem sessão

Como investidor, quero que minhas telas não apareçam para quem não entrou,
nem por um instante.

#### AC-015 — Sem sessão, a tela interna não renderiza

- **Dado** que não há sessão válida
- **Quando** um endereço interno é acessado
- **Então** o acesso é negado antes de qualquer renderização e o investidor vai para o login

#### AC-016 — Com sessão, a tela interna libera

- **Dado** uma sessão válida e dentro do prazo
- **Quando** um endereço interno é acessado
- **Então** o acesso é liberado sem redirecionamento

### US-006 — Toda requisição autenticada leva a identidade do investidor

Como investidor, quero que minhas consultas cheguem ao servidor identificadas,
para ver as minhas carteiras e não as de outra pessoa.

#### AC-017 — O token vai no cabeçalho Authorization

- **Dado** uma sessão válida
- **Quando** uma requisição à API é enviada
- **Então** ela leva o cabeçalho `Authorization` com o valor `Bearer <token>`

#### AC-018 — Sem sessão, nada de cabeçalho

- **Dado** que não há sessão
- **Quando** uma requisição à API é enviada
- **Então** nenhum cabeçalho `Authorization` é adicionado

### US-007 — Números e datas em português, nas duas moedas

Como investidor brasileiro, quero valores e datas na convenção que eu leio,
com o símbolo distinguindo real de dólar, para não confundir as duas moedas.

#### AC-019 — Real e dólar saem formatados em pt-BR e distinguíveis

- **Dado** o mesmo valor numérico em real e em dólar
- **Quando** os dois são formatados
- **Então** ambos usam vírgula decimal e ponto de milhar, e o símbolo diferencia um do outro (`R$` e `US$`)

#### AC-020 — Data e hora seguem a convenção brasileira

- **Dado** um instante qualquer
- **Quando** ele é formatado para exibição
- **Então** aparece em dia/mês/ano e hora de 24 horas

### US-008 — Ganho e perda legíveis sem depender de cor

Como investidor com dificuldade de distinguir cores, quero reconhecer ganho e perda
pelo símbolo, para ler a tela sem depender de verde e vermelho (PRD-001).

#### AC-021 — Variação positiva e negativa têm sinal próprio

- **Dado** uma variação positiva, uma negativa e uma nula
- **Quando** cada uma é exibida
- **Então** cada caso traz um sinal ou seta próprio junto do número, e o significado não depende da cor

### US-009 — Tema claro e escuro

Como investidor, quero escolher entre tema claro e escuro e reencontrar a escolha
depois, para trabalhar confortável na tela em que passo o dia.

#### AC-022 — A escolha de tema é aplicada e lembrada

- **Dado** um investidor que escolheu o tema escuro
- **Quando** ele volta à aplicação
- **Então** o tema escuro está aplicado ao documento, restaurado do que ficou guardado

### US-010 — Consumir a API do backend como ela é

Como quem constrói as telas seguintes, quero os contratos do backend já tipados
e a mesma origem em desenvolvimento, para escrever tela sem descobrir contrato
nem esbarrar em CORS.

#### AC-023 — Resposta paginada do Spring é lida pelos campos dela

- **Dado** uma resposta paginada do backend (`content`, `totalElements`, `totalPages`, `number`, `size`)
- **Quando** ela é consumida
- **Então** os itens e os dados de paginação ficam acessíveis por esses nomes, e uma resposta de erro do backend sem `fieldErrors` é aceita normalmente (o campo é omitido quando vazio)

#### AC-024 — O navegador enxerga a API na mesma origem

- **Dado** o servidor de desenvolvimento do Angular
- **Quando** o navegador chama uma rota de recurso do backend
- **Então** a chamada é encaminhada para `http://localhost:8080` sem sair da origem, cobrindo todas as raízes de recurso que o backend expõe

## Fora de escopo

- Qualquer tela de produto: login, cadastro, painel, corretoras, carteiras, ações, operações, desempenho
- Responsividade para celular e menu para telas pequenas (PRD-001: desktop no v1)
- Infraestrutura de tradução para outros idiomas
- Renovação de token, refresh e recuperação de senha (ADR-001, PRD-002)
- Chamadas reais aos endpoints do backend — aqui só os tipos e a camada de transporte

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-001 | `POST /auth/login` devolve `{ token, expiraEm, investidor }` | confirmada | Confirmado pelo dono do produto em 08/09/2026 |
| ASM-002 | `expiraEm` chega como texto de data-hora interpretável por `Date.parse` (ISO-8601) | confirmada | O leitor da sessão é tolerante: qualquer valor não interpretável é tratado como sessão inválida |
| ASM-003 | As raízes de recurso do backend são `/auth`, `/investidores`, `/corretoras`, `/carteiras`, `/acoes`, `/operacoes` e `/mercado` | confirmada | Derivadas de `docs/erros.md` e dos PRDs 002 a 009; nenhum endpoint novo foi inventado |
| ASM-004 | O limite de 15 minutos da marcação visual é o mesmo TTL de cache do backend | confirmada | ADR-005 e PRD-009 dizem que o limite acompanha o tempo de vida do cache (padrão 15 min) |
| ASM-005 | O aviso de sessão acabando dispara a 5 minutos do fim | confirmada | Decidido pelo dono do produto em 08/09/2026; PRD-002 dizia apenas "alguns minutos antes" |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-001 | Qual runner de testes usar no projeto Angular? | respondida | Vitest, pelo builder `@angular/build:unit-test` |
| Q-002 | Qual o formato exato da resposta do login? | respondida | `{ token, expiraEm, investidor }` |
| Q-003 | Com quanta antecedência avisar que a sessão vai acabar? | respondida | 5 minutos |
| Q-004 | Onde guardar a sessão, já que ela sobrevive ao fechamento do navegador? | respondida | `localStorage` |
