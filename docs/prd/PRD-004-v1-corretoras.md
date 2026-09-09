# PRD-004 v1 — Corretoras

**Status:** proposto · **Data:** 08/09/2026 · **Depende de:** PRD-002 · **Relacionado:** ADR-002, ADR-003, ADR-007

## Problema

Toda carteira pertence a uma corretora. Antes de montar carteira, o investidor precisa registrar onde ela existiria. E o produto só aceita corretora **de verdade e autorizada a operar** — não um nome digitado à mão.

## Quem usa

Investidor, no primeiro acesso (obrigatoriamente) e depois eventualmente, ao adicionar outra corretora.

## Histórias

**H-004.1 — Cadastrar corretora pelo CNPJ.** Como investidor, quero informar só o CNPJ e ter o resto preenchido pelo sistema, para não digitar razão social e endereço.

**H-004.2 — Entender por que uma corretora foi recusada.** Como investidor que teve o cadastro negado, quero saber se a corretora não é autorizada ou se o sistema não conseguiu verificar, porque são coisas diferentes.

**H-004.3 — Ver as corretoras disponíveis.** Como investidor, quero listar e buscar corretoras já cadastradas, para não recadastrar uma que já existe.

**H-004.4 — Remover uma corretora.** Como investidor, quero remover uma corretora que cadastrei por engano.

## Comportamento esperado

### Cadastro

Um único campo: **CNPJ**. Aceita com ou sem máscara.

Ao confirmar, o sistema busca em fontes públicas a razão social, o nome fantasia, o endereço completo e verifica se a corretora está autorizada. Isso leva tempo — a tela precisa mostrar que está consultando fontes externas, não apenas travar o botão.

Se der certo, o investidor vê a corretora completa, com todos os dados preenchidos e a marca de que foi validada, junto da data da base oficial usada na verificação.

Se der errado, o cadastro **não acontece** — não existe corretora salva "pela metade" ou "pendente de validação". E a mensagem distingue três situações que o investidor confunde se a tela não separar:

| O que houve | O que dizer |
|---|---|
| CNPJ mal formado ou inexistente na Receita | "CNPJ inválido ou não encontrado." |
| Corretora existe mas **não é autorizada** | "Esta empresa não consta como corretora autorizada." |
| **Não foi possível verificar** (fonte fora do ar) | "Não conseguimos verificar esta corretora agora. Tente novamente em instantes." |

> A terceira linha é regra de produto, não detalhe técnico. Dizer "não autorizada" quando na verdade a consulta falhou é acusar uma empresa real de irregularidade. A tela **nunca** pode colapsar as duas mensagens em uma.

Se o CNPJ já estiver cadastrado, a tela não trata como erro bruto: mostra a corretora existente e oferece usá-la.

### Listagem

Lista com razão social/nome fantasia, CNPJ, cidade/UF e situação de validação. Paginada. Busca por CNPJ leva direto ao registro.

`[D]` **As corretoras que o investidor já usa recebem um selo discreto** com a quantidade de carteiras dele vinculadas ("2 carteiras suas"). Numa lista compartilhada, é o que separa as poucas que importam do catálogo inteiro. O selo é informativo e não altera a ordenação.

**As corretoras são um catálogo compartilhado, não "as minhas corretoras".** O investidor vê corretoras cadastradas por qualquer um, e pode usar qualquer uma nas suas carteiras. A tela precisa comunicar isso — o título "Corretoras" funciona, "Minhas corretoras" mente. Ver ADR-002.

### Detalhe

Todos os dados cadastrais e de endereço, a marca de validação e a **data da base oficial** usada. Essa data importa: uma corretora autorizada hoje de manhã pode ainda não constar na base do dia.

### Exclusão

Só é possível remover corretora que não tenha nenhuma carteira ativa vinculada. Quando houver, a tela explica o motivo do bloqueio em vez de mostrar erro genérico: "Esta corretora tem carteiras vinculadas. Remova as carteiras primeiro."

`[D]` **Qualquer investidor pode remover qualquer corretora do catálogo**, inclusive uma cadastrada por outro — o catálogo é compartilhado e não tem dono (ver ADR-002). O bloqueio por carteira vinculada é a única proteção, e ele vale para carteiras de qualquer investidor. A mesma regra vale para ações. **Carteira é a exceção:** ninguém remove, vê nem renomeia carteira que não seja sua.

Quando o bloqueio for causado por carteira de outro investidor, a mensagem não pode revelar de quem: "Esta corretora tem carteiras vinculadas e não pode ser removida."

A remoção é lógica: o histórico continua íntegro (ver ADR-007). Para o investidor, isso só significa que a corretora some das listas.

## Critérios de aceite

- Cadastro pede exatamente um campo, o CNPJ
- Durante a consulta às fontes externas, a tela indica que está consultando e impede envio duplicado
- Recusa por "não autorizada" e falha de verificação produzem mensagens diferentes
- Cadastro recusado não deixa nenhum registro parcial na lista
- CNPJ duplicado leva à corretora existente, não a um erro sem saída
- Exclusão bloqueada explica que há carteiras vinculadas
- A data da base de validação aparece no detalhe da corretora

## Fora do escopo do v1

Edição de dados da corretora (são de fonte externa, não editáveis), revalidação manual, favoritar corretora, logo da corretora.

## Perguntas em aberto

Nenhuma.
