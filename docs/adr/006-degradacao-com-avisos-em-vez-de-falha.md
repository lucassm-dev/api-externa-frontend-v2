# ADR-006: Degradação com avisos em vez de falha quando a fonte externa cai

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: resiliência, mensagens, frontend

## Contexto e problema

O produto depende de fontes externas gratuitas para cotação, câmbio, CNPJ, CEP e validação na CVM. Elas caem, atrasam e esgotam cota.

Desde a SPEC-07, cota estourada ou fonte indisponível **não derrubam mais** uma compra ou venda: a operação é concluída com a última cotação conhecida e a resposta traz uma lista de avisos. O mesmo padrão vale para câmbio e para a barra de mercado, que simplesmente omite as fontes que falharam. A recusa só acontece quando nunca houve dado algum para aquele ativo.

Ou seja: existe uma classe de resposta que é **sucesso com ressalva**, e ela não se encaixa nem em "deu certo" nem em "deu erro".

## Fatores de decisão

- Uma operação recusada por cota de API é frustração sem causa do investidor
- Um sucesso pintado como erro faz o investidor repetir a operação e duplicar o lançamento
- O aviso precisa ser visto, senão o investidor decide com dado velho sem saber

## Opções consideradas

- Três níveis de comunicação: informação, aviso e erro, visualmente distintos
- Dois níveis, tratando aviso como um tipo de erro
- Dois níveis, ignorando o aviso silenciosamente

## Decisão

**Três níveis distintos.** Informação é a ressalva discreta ao lado do número (o horário da cotação). Aviso acompanha uma ação que **deu certo** sob condição, com destaque de atenção e sem bloquear. Erro bloqueia, explica e diz o que fazer.

Ignorar o aviso foi recusado por ser o pior dos mundos: o investidor decide com preço de horas atrás achando que é de agora. Tratar aviso como erro foi recusado pelo risco de duplicação — o investidor vê vermelho, acha que a compra falhou, registra de novo, e agora tem duas compras reais no extrato.

Regra derivada, válida em todo o produto: falha de fonte externa nunca resulta em campo vazio, traço ou zero sem explicação. Resulta em último valor conhecido mais aviso.

### Consequências positivas

- A operação acontece mesmo com a fonte fora do ar
- O investidor sabe quando está decidindo com dado velho
- Elimina a classe de bug "duplicou a compra porque achou que falhou"

### Consequências negativas

- Três níveis exigem disciplina visual em todas as telas
- Avisos frequentes podem virar ruído que o investidor aprende a ignorar
- Cada resposta de operação precisa ser lida além do "deu certo"

## Prós e contras

### Três níveis ✅ Escolhida

- ✅ Fiel ao que o backend devolve
- ✅ Evita duplicação de lançamento
- ❌ Mais trabalho de interface

### Aviso como erro

- ✅ Simples
- ❌ Provoca operação duplicada

### Aviso ignorado

- ✅ Tela limpa
- ❌ Investidor decide com dado velho sem saber

## Links

- PRD-007 v1 — Operações · PRD-009 v1 — Confiabilidade percebida
- `docs/erros.md` (EXT-009, EXT-010, EXT-011), spec-07-cache-cotacao
