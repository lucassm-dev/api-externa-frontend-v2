# PRD-002 v1 — Acesso e identidade

**Status:** proposto · **Data:** 08/09/2026 · **Depende de:** — · **Relacionado:** ADR-001, ADR-009

## Problema

O investidor precisa de uma conta porque carteira, operação e desempenho são dele e de mais ninguém. Sem conta não existe produto: não há como separar a carteira de um investidor da de outro.

## Quem usa

Investidor novo (não tem conta) e investidor recorrente (já tem).

## Histórias

**H-002.1 — Criar conta.** Como investidor sem conta, quero me cadastrar informando nome, e-mail, CPF e senha, para começar a montar carteiras.

**H-002.2 — Entrar.** Como investidor cadastrado, quero entrar com e-mail e senha, para acessar minhas carteiras.

**H-002.3 — Ir do login ao cadastro e voltar.** Como investidor que tentou entrar e percebeu que não tem conta, quero chegar ao cadastro em um clique, e voltar ao login já com o e-mail que acabei de cadastrar.

**H-002.4 — Sair.** Como investidor, quero encerrar minha sessão, para que ninguém no mesmo computador veja minhas carteiras.

**H-002.5 — Saber que fui deslogado.** Como investidor cuja sessão expirou, quero ser avisado do motivo ao voltar para o login, em vez de simplesmente encontrar a tela de login sem explicação.

## Comportamento esperado

### Cadastro

Quatro campos: nome, e-mail, CPF, senha. Todos obrigatórios.

Regras que o investidor precisa ver **antes** de errar, não depois:
- CPF: 11 dígitos numéricos
- Senha: mínimo 8 caracteres, com pelo menos uma letra e um número
- E-mail em formato válido

E-mail e CPF são únicos entre contas ativas. Se o investidor tentar um e-mail ou CPF já em uso, a mensagem diz qual dos dois está duplicado.

Cadastro bem-sucedido **não** entra no sistema automaticamente. O investidor é levado ao login, com o e-mail já preenchido e uma confirmação visível de que a conta foi criada.

> Decisão: cadastrar e entrar são dois passos porque o backend não devolve sessão no cadastro. Não inventar login automático no frontend. Ver ADR-001.

### Login

Dois campos: e-mail e senha. Erro de credencial é sempre a mesma mensagem genérica, sem dizer se o e-mail existe ou se foi a senha que errou — isso é intencional, é proteção de privacidade, e o frontend não deve tentar ser mais específico.

Login bem-sucedido leva ao painel inicial (PRD-003).

### Sessão

A sessão tem prazo de validade e **não se renova sozinha**. Quando expira, qualquer ação do investidor o leva de volta ao login com a mensagem "sua sessão expirou, entre novamente". O trabalho não salvo — um formulário pela metade — se perde; o produto aceita isso no v1.

`[D]` **A sessão sobrevive ao fechamento do navegador.** Ela termina de duas formas apenas: pelo prazo do token, ou porque o investidor clicou em sair. Fechar a aba não desloga.

O raciocínio: o token já expira sozinho no prazo dele, então morrer junto com a aba não acrescenta segurança real — o prazo do lado do servidor continua o mesmo — e custa muito em conveniência. O que protege máquina compartilhada é o botão de sair, que precisa estar sempre visível e nunca escondido em submenu.

`[D]` **O investidor é avisado antes da expiração.** Alguns minutos antes do prazo, um aviso não bloqueante informa que a sessão está para acabar e oferece o caminho de entrar novamente antes de perder o que estiver fazendo. Isso não depende do backend: o login já informa o momento exato da expiração.

### Enquanto não há sessão

Só duas telas existem sem sessão: login e cadastro. Qualquer outro endereço acessado sem sessão vai para o login.

## Estados e mensagens

| Situação | O que o investidor vê |
|---|---|
| E-mail já cadastrado | "Este e-mail já está em uso." Campo e-mail destacado |
| CPF já cadastrado | "Este CPF já está em uso." Campo CPF destacado |
| Senha fora da política | "A senha precisa ter ao menos 8 caracteres, com letra e número." |
| E-mail ou senha incorretos | "E-mail ou senha incorretos." Sem detalhar qual |
| Sessão expirada | Volta ao login: "Sua sessão expirou. Entre novamente." |
| Backend fora do ar | "Não foi possível conectar ao sistema. Tente novamente." Nunca tela em branco |

## Critérios de aceite

- Cadastro com dados válidos cria a conta e leva ao login com o e-mail preenchido
- Cadastro com e-mail duplicado mantém o investidor no formulário, preserva o que ele digitou e destaca só o campo do erro
- Login válido leva ao painel inicial
- Sessão expirada durante qualquer ação leva ao login com mensagem de expiração
- Sair limpa a sessão e impede voltar às telas internas pelo botão "voltar" do navegador
- Nenhuma tela interna é renderizada, nem por um instante, sem sessão válida

## Fora do escopo do v1

Troca de senha, edição de perfil, exclusão da própria conta, verificação de e-mail, login social, dois fatores.

> O backend tem exclusão de investidor, mas ela não está exposta como funcionalidade do próprio investidor. Não construir tela para isso no v1.

## Bloqueado por backend

**Recuperação de senha.** O dono do produto quer a funcionalidade no v1, mas ela **não existe no backend**: não há endpoint de solicitar redefinição, token de redefinição, envio de e-mail nem troca de senha. Construir a tela sem o backend produziria um formulário que não faz nada.

Enquanto isso não existir, o investidor que esquece a senha perde o acesso à conta — e a tela de login **não deve exibir** um link de "esqueci minha senha" que leve a lugar nenhum.

Entra num PRD-002 **v2** assim que o backend suportar.

## Perguntas em aberto

Nenhuma. A única pendência é a dependência de backend acima.
