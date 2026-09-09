# ADR-008: Preço de mercado como padrão da operação, com override manual explícito

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: operações, produto, frontend

## Contexto e problema

O produto nasceu com a regra de que nenhum preço seria digitado: toda compra e venda usaria a cotação obtida no momento da operação. A SPEC-04 flexibilizou isso — o preço unitário passou a ser opcional no registro da operação. Informado, é usado como está; omitido, o sistema busca a cotação.

Preço digitado é validado em duas casas decimais. Preço automático não é: como a fonte americana devolve mais casas, o sistema arredonda em vez de recusar.

## Fatores de decisão

- O propósito do produto é simular a preço de mercado, não registrar operação arbitrária
- Investidor reproduzindo uma operação real precisa do preço que ele efetivamente pagou
- Campo de preço aberto por padrão convida a digitar e desvirtua a simulação

## Opções consideradas

- Preço automático por padrão, com override manual em controle explícito
- Campo de preço sempre aberto, preenchido com a cotação como sugestão
- Preço sempre automático, sem override

## Decisão

**Automático por padrão, manual por opt-in.** O formulário de compra e venda pede quantidade, e mostra o preço que será usado e o total estimado antes da confirmação. Informar preço próprio exige uma ação deliberada do investidor ("informar preço manualmente"), que abre o campo.

Campo sempre aberto foi recusado: um campo editável com valor dentro é um convite a alterá-lo, e a maioria das operações do produto não deveria ter preço digitado. A diferença entre sugestão e padrão é comportamental, não estética.

Duas consequências para as telas: a validação de duas casas decimais só se aplica ao campo manual, e o formulário precisa mostrar preço e total **antes** da confirmação — sem isso, o investidor confirma às cegas um valor que ele não escolheu.

### Consequências positivas

- O caminho normal é o da simulação a preço de mercado
- Quem precisa reproduzir uma operação real consegue
- Mensagem de erro de casas decimais só aparece para quem digitou

### Consequências negativas

- Um passo a mais para quem sempre usa preço próprio
- O formulário tem dois modos, e dois modos custam teste
- O preço mostrado antes da confirmação pode não ser exatamente o registrado, se o cache virar entre a exibição e o envio

## Prós e contras

### Automático com opt-in ✅ Escolhida

- ✅ Preserva o propósito do produto
- ✅ Não fecha a porta do preço real
- ❌ Formulário com dois modos

### Campo sempre aberto

- ✅ Um modo só
- ❌ Convida a digitar e desvirtua a simulação

### Sem override

- ✅ O mais simples
- ❌ Já não corresponde ao backend

## Links

- PRD-007 v1 — Operações e movimentações
- spec-04-preco-editavel, `docs/erros.md` (OPE-005)
