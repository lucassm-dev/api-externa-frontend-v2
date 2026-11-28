# Spec: Duração das mensagens do painel

> feature: duracao-mensagens
> status: implementada

## Contexto

As confirmações de remover ou alterar algo ("Operação removida do extrato.") saem pelo
painel de feedback, que não tinha tempo de saída nem botão de dispensar: a mensagem ficava
presa na tela ("tem que ficar um tempinho e já sair, uns 5 segundos ou menos", Lucas,
28/11/2026). Issue #68. Segue a regra já decidida para a notificação de sucesso (Q-028):
o que não bloqueia some em cerca de cinco segundos; erro fica até ser dispensado (AC-214).

## Histórias

### US-112 — Mensagens que não ficam no caminho

Como investidor, quero que as confirmações saiam sozinhas depois de um instante, para que
elas não cubram a tela enquanto eu continuo trabalhando.

#### AC-406 — Informação e aviso saem sozinhos em 5 segundos

- **Dado** uma mensagem de informação ou de aviso no painel
- **Quando** passam 5 segundos
- **Então** ela sai do painel sem o investidor fazer nada

#### AC-407 — Erro fica até ser dispensado

- **Dado** uma mensagem de erro no painel
- **Quando** passam 5 segundos ou mais
- **Então** ela continua no painel

#### AC-408 — Toda mensagem pode ser dispensada antes

- **Dado** qualquer mensagem no painel
- **Quando** o investidor usa o botão "Dispensar mensagem"
- **Então** ela sai do painel na hora

## Fora de escopo

- Pausar a contagem com o ponteiro em cima: a mensagem é curta e repete o que a tela já
  mostra (o extrato, o comprovante).

## Suposições

Nenhuma.

## Perguntas em aberto

Nenhuma.
