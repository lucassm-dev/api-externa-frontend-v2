# Design: ações e identidade no cabeçalho

## Contexto

A área autenticada exibe o e-mail do investidor e dois botões textuais para alternar o tema e sair. A mudança reduz o peso visual das ações, mantém o investidor identificável e preserva o acesso direto ao encerramento da sessão.

O trabalho fica restrito à casca autenticada. Navegação, sessão, rotas, temas e demais superfícies não mudam.

## Direção aprovada

O canto superior direito seguirá a composição escolhida na opção C:

1. bloco textual com o rótulo `Investidor` e o e-mail da sessão;
2. avatar circular de destaque com as iniciais derivadas do e-mail;
3. botão de ícone para alternar o tema;
4. botão de ícone para sair.

O avatar é informativo. Ele não abre menu e não recebe comportamento que não tenha sido solicitado.

## Componentes e comportamento

`Casca` continua responsável por obter o e-mail da sessão, alternar o tema e encerrar a sessão. Ela passa a importar e reutilizar o componente existente `BotaoIcone` para as duas ações.

As iniciais serão calculadas a partir do e-mail: a primeira letra da parte local e a primeira letra do domínio, em maiúsculas. Assim, `lucas@exemplo.com` produz `LE`. Se uma das partes não estiver disponível, a inicial existente será usada; sem conteúdo utilizável, o avatar exibirá `IN`.

O botão de tema mostrará lua quando a ação disponível for ativar o tema escuro e sol quando a ação disponível for ativar o tema claro. O nome acessível e o `title` também descreverão a ação disponível, não apenas o estado atual.

O botão de saída usará um ícone inequívoco de saída e manterá a ação atual: limpar a sessão e navegar para a rota de login. Os atributos `data-alternar-tema` e `data-sair` serão preservados para compatibilidade com os testes e a automação existentes.

Os ícones serão SVGs embutidos, com `aria-hidden="true"`, enquanto o nome acessível ficará no botão. Não será adicionada uma biblioteca de ícones.

## Layout responsivo

No desktop, identidade e ações ficam alinhadas ao fim da barra superior. O avatar usa a cor de destaque existente e as demais cores vêm exclusivamente dos tokens atuais.

Abaixo de 768 px, o bloco continua na segunda linha da casca compacta. O texto da identidade poderá encolher e o e-mail terá elipse visual quando faltar espaço, mas seu conteúdo completo permanecerá disponível no `title` e no texto do DOM. Avatar e ações manterão alvos de toque de pelo menos 44 px nessa faixa.

## Acessibilidade e estados

- Tema e saída terão nome acessível, `title`, foco visível, hover e estado desabilitado herdados de `BotaoIcone`.
- A troca de tema continuará expondo o estado atual por `data-tema-atual`.
- A identidade terá texto real; o avatar será decorativo em relação ao e-mail já exibido e ficará oculto da árvore de acessibilidade.
- A ordem visual acompanhará a ordem do DOM: identidade, avatar, tema e saída.
- Nenhuma informação dependerá somente de cor.

## Testes e validação

Os testes da casca devem provar:

- exibição do rótulo `Investidor`, do e-mail e das iniciais esperadas;
- nomes acessíveis dos botões de tema e saída;
- mudança do ícone e do nome acessível do tema depois da alternância;
- preservação do encerramento da sessão e da navegação para o login;
- permanência das ações na própria barra, sem menu suspenso;
- estrutura compatível com a largura mínima de 360 px.

A entrega será verificada com os testes unitários relacionados, build do Angular e o validador mecânico de UI/UX nos arquivos alterados. Se o aplicativo puder ser executado, haverá uma inspeção visual limitada nos temas claro e escuro, em 360, 768 e 1280 px.

## Fora de escopo

- menu de perfil ou dropdown no avatar;
- foto enviada pelo investidor;
- edição de e-mail ou perfil;
- mudanças na lógica de autenticação ou persistência do tema;
- reformulação da navegação da casca.
