# Spec: Acesso

> feature: acesso
> status: pronta

## Contexto

As telas que existem sem sessão — cadastro e login — mais o que encerra a sessão:
o botão sair e o aviso de que ela está acabando. Sem conta não existe produto, e
sem estas telas nada da fundação do passo 1 é alcançável. Tudo o que trata erro,
comunica nos três níveis, guarda a sessão e protege as rotas já existe: aqui só se
consome.

## Histórias

### US-011 — Criar conta

Como investidor sem conta, quero me cadastrar informando nome, e-mail, CPF e senha,
para começar a montar carteiras.

#### AC-025 — Cadastro válido leva ao login com o e-mail preenchido

- **Dado** o formulário de cadastro preenchido com dados válidos
- **Quando** o investidor confirma o cadastro e o servidor responde a conta criada
- **Então** ele chega ao login com o e-mail dele já preenchido e uma confirmação visível de que a conta foi criada

#### AC-026 — Cadastrar não entra no sistema

- **Dado** um cadastro concluído com sucesso
- **Quando** a tela reage à resposta do servidor
- **Então** nenhuma sessão é criada e a senha digitada não é reenviada a lugar nenhum, porque o cadastro não devolve token (ADR-001)

#### AC-027 — CPF fora do formato nem chega ao servidor

- **Dado** um CPF com menos de 11 dígitos, ou com letras
- **Quando** o investidor tenta enviar o cadastro
- **Então** o envio é barrado antes de qualquer chamada ao backend e o campo do CPF aponta o que está errado

#### AC-148 — O CPF é formatado enquanto o investidor digita

- **Dado** o campo do CPF no cadastro
- **Quando** o investidor digita os dígitos, com ou sem pontuação
- **Então** o campo mostra o CPF pontuado no padrão `000.000.000-00`, à medida que os dígitos entram, e nada além de dígitos é aceito no campo

#### AC-149 — O que vai ao servidor são os 11 dígitos, sem a máscara

- **Dado** um CPF digitado e exibido com a máscara
- **Quando** o cadastro é enviado
- **Então** o servidor recebe apenas os 11 dígitos, sem pontos nem traço

#### AC-028 — Senha fora da política nem chega ao servidor

- **Dado** uma senha com menos de 8 caracteres, ou sem letra, ou sem número
- **Quando** o investidor tenta enviar o cadastro
- **Então** o envio é barrado antes de qualquer chamada ao backend e o campo da senha aponta a regra

#### AC-029 — E-mail fora de formato nem chega ao servidor

- **Dado** um e-mail sem formato válido
- **Quando** o investidor tenta enviar o cadastro
- **Então** o envio é barrado antes de qualquer chamada ao backend e o campo do e-mail aponta o problema

#### AC-030 — E-mail duplicado preserva o formulário e destaca só o e-mail

- **Dado** um cadastro recusado pelo servidor com o código `AUT-001`
- **Quando** a tela trata o erro
- **Então** tudo o que o investidor digitou continua na tela, a mensagem "Este e-mail já está em uso." aparece no campo de e-mail, e nenhum outro campo é destacado

#### AC-031 — CPF duplicado destaca só o CPF

- **Dado** um cadastro recusado pelo servidor com o código `AUT-002`
- **Quando** a tela trata o erro
- **Então** a mensagem "Este CPF já está em uso." aparece no campo do CPF, e o formulário continua preenchido

#### AC-032 — Senha recusada pelo servidor destaca a senha

- **Dado** um cadastro recusado com o código `AUT-008`, rede de segurança para o que a tela já valida
- **Quando** a tela trata o erro
- **Então** a mensagem da política de senha aparece no campo da senha, sem limpar o formulário

#### AC-033 — Erro de validação do servidor se distribui pelos campos

- **Dado** um cadastro recusado com o código `VAL-001` e uma lista de erros por campo
- **Quando** a tela trata o erro
- **Então** cada mensagem aparece no seu campo e nenhum balão único de topo é exibido

#### AC-034 — As regras aparecem antes de o investidor errar

- **Dado** o formulário de cadastro recém-aberto, ainda sem nada digitado
- **Quando** o investidor olha os campos
- **Então** as regras de CPF, de senha e de e-mail já estão escritas na tela

### US-012 — Entrar

Como investidor cadastrado, quero entrar com e-mail e senha, para acessar minhas carteiras.

#### AC-035 — Login válido guarda a sessão e leva ao destino interno

- **Dado** e-mail e senha corretos
- **Quando** o servidor responde com o token e o momento de expiração
- **Então** a sessão fica guardada e o investidor é levado à área interna

#### AC-036 — Credencial incorreta não revela qual campo errou

- **Dado** um login recusado com o código `AUT-004`
- **Quando** a tela trata o erro
- **Então** o investidor lê "E-mail ou senha incorretos.", o e-mail digitado continua na tela, e nada indica se a conta existe nem qual dos dois campos errou

#### AC-037 — O botão fica indisponível durante o envio

- **Dado** um login em andamento
- **Quando** o investidor tenta enviar de novo
- **Então** o botão está indisponível e nenhuma segunda requisição sai

#### AC-038 — A tela de login não oferece recuperação de senha

- **Dado** a tela de login
- **Quando** o investidor procura por "esqueci minha senha"
- **Então** não existe link algum, porque o backend não tem recuperação de senha e um link morto é pior que a ausência dele

#### AC-039 — Quem já tem sessão não fica na tela de login

- **Dado** um investidor com sessão válida guardada
- **Quando** ele abre o endereço do login
- **Então** ele é levado à área interna, sem precisar entrar de novo

### US-013 — Ir do login ao cadastro e voltar

Como investidor que tentou entrar e percebeu que não tem conta, quero chegar ao
cadastro em um clique, e voltar ao login depois.

#### AC-040 — Login e cadastro se alcançam em um clique, nos dois sentidos

- **Dado** que o investidor está no login
- **Quando** ele procura o caminho para criar conta, e o inverso a partir do cadastro
- **Então** existe um link direto em cada uma das duas telas

### US-014 — Sair

Como investidor, quero encerrar minha sessão, para que ninguém no mesmo computador
veja minhas carteiras.

#### AC-041 — Sair limpa a sessão e leva ao login

- **Dado** um investidor na área interna
- **Quando** ele clica em sair
- **Então** nada da sessão continua guardado e ele chega ao login

#### AC-042 — Depois de sair, voltar pelo navegador não mostra tela interna

- **Dado** um investidor que acabou de sair
- **Quando** ele tenta voltar a um endereço interno, como faz o botão voltar do navegador
- **Então** a tela interna não renderiza e ele permanece no login

### US-015 — Saber que a sessão está acabando, e que acabou

Como investidor, quero ser avisado antes de a sessão vencer e saber o motivo quando
ela vencer, em vez de encontrar a tela de login sem explicação.

#### AC-043 — O aviso sai do próprio login, cinco minutos antes

- **Dado** uma sessão cujo momento de expiração está a menos de 5 minutos
- **Quando** a área interna avalia o estado da sessão
- **Então** o aviso aparece, calculado do `expiraEm` devolvido no login, sem nenhuma requisição ao servidor

#### AC-044 — O aviso não bloqueia e oferece entrar de novo

- **Dado** o aviso de sessão acabando na tela
- **Quando** o investidor o vê
- **Então** ele é comunicado no nível aviso, não impede o trabalho em andamento, e oferece o caminho de entrar novamente

#### AC-045 — Sessão vencida durante uma ação explica o motivo no login

- **Dado** uma ação que o servidor recusa com o código `AUT-006`
- **Quando** o investidor volta ao login
- **Então** ele lê "Sua sessão expirou. Entre novamente." em vez de encontrar a tela de login sem explicação

### US-016 — Sessão fiel ao que o backend devolve

Como quem constrói as telas seguintes, quero a sessão montada sobre a resposta real
do login, para não escrever tela sobre um contrato que não existe.

#### AC-046 — A sessão nasce de token, tipo e expiraEm

- **Dado** a resposta real de `POST /auth/login`, que traz `token`, `tipo` e `expiraEm` e **não** traz dados do investidor
- **Quando** a sessão é criada
- **Então** ela guarda esses três campos mais o e-mail que o próprio investidor digitou, e nada além disso

## Fora de escopo

- Recuperação e troca de senha, edição de perfil, exclusão da própria conta, verificação de e-mail, login social, dois fatores (PRD-002, fora do v1)
- O painel inicial e qualquer outra tela de produto: a área interna recebe apenas um destino mínimo, substituído no passo seguinte
- Renovação de sessão, refresh token e qualquer consulta ao servidor para saber se a sessão ainda vale (ADR-001)

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-006 | `POST /auth/login` responde `{ token, tipo, expiraEm }` e `POST /auth/cadastro` responde `{ id, nome, email }` | confirmada | Lido em `AuthResource.java` e nos DTOs do backend em 08/09/2026; invalida a ASM-001 da fundação, que assumia um investidor na resposta do login |
| ASM-007 | A identidade exibida na área interna é o e-mail que o investidor digitou no login | confirmada | Decidido pelo dono do produto em 08/09/2026: o backend não tem endpoint de "quem sou eu" e o id só existe dentro do token |
| ASM-008 | O aviso de sessão acabando dispara a 5 minutos do fim | confirmada | Token dura 24 horas (`jwt.expiration-ms=86400000`): 5 minutos é raro o bastante para não virar ruído e suficiente para terminar um formulário curto |
| ASM-009 | `expiraEm` chega como instante ISO-8601 em UTC | confirmada | O DTO usa `java.time.Instant`, serializado pelo Jackson em ISO-8601 |
| ASM-010 | A política de senha do cliente é a mesma do servidor: 8+ caracteres, com ao menos uma letra e um número | confirmada | Mesma expressão de `AutenticacaoService.POLITICA_SENHA` no backend |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-005 | Como a sessão guarda a identidade, se o login não devolve o investidor? | respondida | Guarda o e-mail digitado no login; não decodifica o token nem inventa endpoint |
| Q-006 | Onde mora o botão sair, já que o painel ainda não existe? | respondida | Uma casca mínima da área interna, com o botão sempre visível, mais uma rota de destino que o próximo passo substitui |
