# Design: confirmação de senha no cadastro

## Contexto

O cadastro do investidor possui um único campo de senha. Um erro de digitação pode criar a conta com uma senha diferente da pretendida, por isso o formulário passará a pedir a confirmação antes de enviar os dados.

A mudança fica restrita à tela de cadastro e à sua cobertura automatizada. O contrato de `POST /auth/cadastro` não muda.

## Direção aprovada

O formulário terá o campo `Confirmar senha` imediatamente abaixo de `Senha`. A relação entre os dois valores será validada no formulário, porque a regra depende dos dois controles e deve ser recalculada quando qualquer um deles mudar.

A divergência será comunicada com a mensagem `As senhas não coincidem` somente depois que o investidor sair do campo de confirmação ou tentar cadastrar. Enquanto ele ainda estiver digitando pela primeira vez, a interface não antecipará o erro.

## Componentes e fluxo de dados

O formulário reativo de `Cadastro` receberá o controle não nulo `confirmarSenha`, obrigatório, com `autocomplete="new-password"`. Um validador cruzado comparará `senha` e `confirmarSenha` e marcará o formulário como inválido enquanto os valores forem diferentes.

Ao enviar, o fluxo atual continuará marcando todos os campos como tocados. Se a confirmação estiver vazia ou divergente, nenhuma requisição será feita. Quando o formulário estiver válido, `confirmarSenha` será removido do objeto local e somente `nome`, `email`, `cpf` sem máscara e `senha` serão entregues a `AcessoService.cadastrar`.

Se a senha original for alterada depois de uma confirmação válida, a comparação será reavaliada automaticamente. O medidor de força continuará ligado somente ao campo `senha`.

## Mensagens e acessibilidade

O novo campo terá rótulo visível `Confirmar senha` e será associado ao formulário reativo. Seus erros terão esta prioridade:

1. vazio: `Confirme sua senha`;
2. preenchido e diferente de `senha`: `As senhas não coincidem`.

A mensagem será renderizada com `mat-error`, mantendo o vínculo acessível e o padrão visual dos demais campos. O botão `Criar conta` não ficará permanentemente desabilitado por invalidez; a tentativa de envio revelará os erros, como já ocorre no formulário.

## Testes e critérios observáveis

Os testes da tela de cadastro devem provar, com critérios de aceite rastreáveis:

- o campo `Confirmar senha` existe logo depois de `Senha` e é obrigatório;
- uma confirmação diferente não mostra erro antes da interação, mas mostra `As senhas não coincidem` após perder o foco;
- uma tentativa de envio também revela a divergência e não chama o backend;
- alterar `senha` depois de confirmá-la revalida a comparação;
- valores iguais permitem o cadastro;
- a requisição preserva o contrato atual e não contém `confirmarSenha`.

A entrega será validada pelos testes unitários relacionados, pelo build do Angular, pelo validador mecânico de UI/UX e pela auditoria da especificação. A interface será conferida nas larguras de 360, 768 e 1280 px se o aplicativo puder ser executado localmente.

## Fora de escopo

- alterar a política de força da senha;
- adicionar controles para mostrar ou ocultar a senha;
- modificar o backend ou o corpo de `POST /auth/cadastro`;
- recuperação, troca ou redefinição de senha;
- reformular os demais campos do cadastro.

## Decisões e perguntas

A exibição da divergência após a perda de foco ou a tentativa de envio foi aprovada pelo dono do produto em 11/09/2026. Não há perguntas em aberto.
