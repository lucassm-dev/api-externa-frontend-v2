# ADR-007: Exclusão lógica com bloqueio por vínculo ativo

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: domínio, integridade, frontend

## Contexto e problema

Nada é apagado de verdade no sistema. Corretora, carteira, ação, operação e investidor são marcados como inativos e desaparecem das consultas. Isso preserva a rastreabilidade do histórico — uma operação excluída não pode levar embora o recálculo que ela já provocou.

Além disso, a exclusão é bloqueada quando existe vínculo ativo: corretora com carteira, carteira com posição aberta, ação com posição aberta em qualquer carteira.

E há uma consequência menos óbvia: a chave natural do registro excluído volta a ficar livre. Um CNPJ, um ticker, um e-mail ou um CPF de registro excluído pode ser cadastrado de novo.

## Fatores de decisão

- Histórico financeiro que some é pior do que registro que fica
- Bloqueio sem explicação é indistinguível de bug
- O investidor não tem por que conhecer o conceito de exclusão lógica

## Opções consideradas

- Exclusão lógica, apresentada como remoção simples, com bloqueios explicados
- Exclusão lógica exposta na interface, com estados "ativo" e "excluído" visíveis
- Exclusão física

## Decisão

**Exclusão lógica apresentada como remoção simples.** Para o investidor, excluir significa "some da minha lista" — e é isso que a interface diz. O produto não expõe registros inativos, não oferece lixeira e não oferece desfazer.

Quando a exclusão é bloqueada, a mensagem nomeia o vínculo e o caminho: "Esta carteira ainda tem posições abertas. Venda ou zere as posições antes de excluí-la." Um erro genérico de regra violada aqui é inaceitável, porque o investidor não tem como adivinhar qual vínculo o impede.

Expor os estados na interface foi recusado por vazar modelagem para uma persona que não precisa dela.

### Consequências positivas

- Histórico e recálculos permanecem íntegros
- Cadastrar de novo algo que foi excluído funciona sem erro de duplicidade
- Bloqueios acionáveis, em vez de recusas mudas

### Consequências negativas

- Exclusão é definitiva do ponto de vista do investidor: não há como desfazer pela interface
- Para excluir uma carteira, é preciso primeiro zerar as posições — dois passos onde ele esperava um
- Um investidor pode remover do catálogo compartilhado algo que outro cadastrou (ver ADR-002)

## Prós e contras

### Lógica, apresentada como simples ✅ Escolhida

- ✅ Integridade preservada
- ✅ Modelo mental simples para o investidor
- ❌ Sem desfazer

### Estados expostos na interface

- ✅ Permitiria restaurar
- ❌ Vaza modelagem para o usuário

### Exclusão física

- ✅ Sem registro morto
- ❌ Destrói o histórico e os recálculos

## Links

- PRD-004 v1, PRD-005 v1, PRD-006 v1, PRD-007 v1
- spec-03-recadastro-exclusao, spec-06-lucro-realizado, spec-10-vazamento-investidor-inativo
