# Catálogo de códigos de erro

Toda resposta de erro da API segue o mesmo formato (`StandardError`):

```json
{
  "timestamp": "2026-09-04T19:30:00Z",
  "status": 404,
  "codigo": "ACA-001",
  "error": "Not Found",
  "message": "Ação não encontrada: PETR4",
  "path": "/acoes/ticker/PETR4",
  "fieldErrors": []
}
```

`fieldErrors` só é preenchido em erro de validação (`VAL-001`, 400). Nenhuma
resposta de erro traz stacktrace ou nome de classe interna — exceção não
mapeada (bug) vira `SYS-001` (500) genérico.

## Hierarquia de exceções

```
NegocioException (abstrata)
├── RecursoNaoEncontradoException   → 404
├── RecursoDuplicadoException       → 409
├── RegraVioladaException           → 422
├── IntegracaoExternaException      → 429 (limiteExcedido=true) ou 503 (limiteExcedido=false)
├── CredenciaisInvalidasException   → 401 (login incorreto — único caso de negócio fixo em 401)
└── PreRequisitoNaoAtendidoException → 409 (pré-requisito de estado não satisfeito, ex.: cadastrar ação sem carteira)
```

401/403 de autenticação/autorização (token ausente, expirado, acesso negado)
**não** passam pela hierarquia acima — são escritos direto pelo
`JwtAuthenticationEntryPoint`/`JwtAccessDeniedHandler` no filtro de
segurança, antes do Spring MVC processar a requisição (ver `AUT-005/006/007`).

Implementação: `src/main/java/com/apiexternabackend/resources/exceptions/`.

## COR — Corretora

| Código | Situação | Status HTTP | Exceção |
|---|---|---|---|
| COR-001 | Corretora não encontrada | 404 | RecursoNaoEncontradoException |
| COR-002 | Corretora já cadastrada (CNPJ duplicado) | 409 | RecursoDuplicadoException |
| COR-003 | Regra de cadastro violada: CNPJ com formato/dígitos inválidos, CNPJ não encontrado na Receita, CEP não encontrado, ou corretora não autorizada na CVM (a fonte respondeu e disse que não está OK) | 422 | RegraVioladaException |
| COR-004 | Exclusão bloqueada: existe carteira ativa vinculada à corretora | 422 | RegraVioladaException |

## ACA — Ação

| Código | Situação | Status HTTP | Exceção |
|---|---|---|---|
| ACA-001 | Ação não encontrada (inclui ação existente porém inativa — busca individual e operação nunca enxergam ação excluída) | 404 | RecursoNaoEncontradoException |
| ACA-002 | Ação já cadastrada (ticker duplicado **entre ativas** — ticker de ação excluída pode ser reutilizado) | 409 | RecursoDuplicadoException |
| ACA-003 | Exclusão bloqueada: ação tem posição ativa (quantidade > 0) em pelo menos uma carteira | 422 | RegraVioladaException |
| ACA-004 | Cadastro bloqueado: investidor não tem nenhuma carteira ativa (cadastre uma carteira antes de cadastrar ações) | 409 | PreRequisitoNaoAtendidoException |

## CAR — Carteira

| Código | Situação | Status HTTP | Exceção |
|---|---|---|---|
| CAR-001 | Carteira não encontrada (ou inativa, ou de outro investidor — SPEC-02) | 404 | RecursoNaoEncontradoException |
| CAR-002 | Exclusão bloqueada: carteira tem posição ativa (quantidade > 0) em pelo menos uma ação | 422 | RegraVioladaException |

## OPE — Operação

> Desde a SPEC-06, `DELETE /operacoes/{id}` é soft delete (marca `ativo=false`,
> não apaga a linha). Uma operação já excluída passa a responder OPE-001 —
> mesma semântica de "não existe" — tanto em `PUT` quanto em `DELETE`.
>
> `OPE-002` foi **removido na SPEC-08** (Q-MAP-09): a carteira aceita ações
> BR e US juntas, sem checagem de mercado entre carteira e ação.

| Código | Situação | Status HTTP | Exceção |
|---|---|---|---|
| OPE-001 | Operação não encontrada (ou já excluída — soft delete, SPEC-06) | 404 | RecursoNaoEncontradoException |
| ~~OPE-002~~ | ~~Incompatibilidade de mercado entre carteira e ação~~ — removido na SPEC-08 (Q-MAP-09) | — | — |
| OPE-003 | Sem posição na ação para vender | 422 | RegraVioladaException |
| OPE-004 | Quantidade de venda excede a posição atual | 422 | RegraVioladaException |
| OPE-005 | Preço unitário **digitado manualmente** com mais de 2 casas decimais (BRL/USD usam 2 casas de subunidade) — preço automático (buscado na fonte) nunca cai aqui, é arredondado em vez de validado | 422 | RegraVioladaException |

## AUT — Investidor / autenticação

> Desde a SPEC-02, `Investidor` tem cadastro com senha (`POST /auth/cadastro`)
> e login com JWT (`POST /auth/login`). AUT-005/006/007 são escritos direto
> pelo `JwtAuthenticationEntryPoint`/`JwtAccessDeniedHandler` — não passam
> pelo `GlobalExceptionHandler` porque acontecem no filtro de segurança,
> antes do Spring MVC.
>
> Desde a SPEC-10, investidor excluído (`ativo=false`) some de todas as
> consultas: não faz login (AUT-004), não aparece em `GET /investidores/{id}`
> (AUT-003) e libera o e-mail/CPF para recadastro — mesmo tratamento que
> ticker e CNPJ já tinham desde a SPEC-03.

| Código | Situação | Status HTTP | Exceção |
|---|---|---|---|
| AUT-001 | E-mail já cadastrado **entre investidores ativos** (e-mail de conta excluída pode ser reutilizado — SPEC-10) | 409 | RecursoDuplicadoException |
| AUT-002 | CPF já cadastrado **entre investidores ativos** (idem AUT-001) | 409 | RecursoDuplicadoException |
| AUT-003 | Investidor não encontrado (inclui investidor existente porém excluído — SPEC-10) | 404 | RecursoNaoEncontradoException |
| AUT-004 | Login com e-mail ou senha incorretos, **ou conta excluída** (mensagem genérica, não revela qual campo errou nem que a conta existiu) | 401 | CredenciaisInvalidasException |
| AUT-005 | Token ausente, malformado ou com assinatura inválida | 401 | `JwtAuthenticationEntryPoint` |
| AUT-006 | Token expirado | 401 | `JwtAuthenticationEntryPoint` |
| AUT-007 | Acesso negado (autenticado, sem permissão) | 403 | `JwtAccessDeniedHandler` |
| AUT-008 | Senha fora da política mínima (8+ caracteres, com letra e número) | 422 | RegraVioladaException |

## EXT — Integração externa

| Código | Situação | Status HTTP | Exceção |
|---|---|---|---|
| EXT-007 | Falha de infraestrutura ao consultar fonte externa durante o cadastro de corretora (CNPJ/Receita, CEP/ViaCEP ou CVM indisponíveis — a fonte não respondeu, diferente de COR-003 onde ela respondeu e disse "não autorizada") | 503 | IntegracaoExternaException (limiteExcedido=false) |
| EXT-008 | Ticker não encontrado na fonte de cotação (brapi/Twelve Data) | 422 | RegraVioladaException |
| EXT-009 | Limite de requisições da fonte de cotação excedido — em `PUT /acoes/{id}/atualizar-cotacao` continua 429 explícito; em compra/venda, desde a SPEC-07 (Q-MAP-06), não derruba mais a operação | 429 (atualizar-cotacao) / prossegue com aviso (compra/venda) | IntegracaoExternaException (limiteExcedido=true) |
| EXT-010 | Fonte de cotação indisponível (não é limite de cota) — mesmo tratamento: 503/fallback em atualizar-cotacao, prossegue com aviso em compra/venda | 503 (atualizar-cotacao) / prossegue com aviso (compra/venda) | IntegracaoExternaException (limiteExcedido=false) |
| EXT-011 | Câmbio USD-BRL indisponível — AwesomeAPI (primária) e PTAX BCB (fallback) falharam. Em compra/venda ou consolidado, prossegue com a última taxa em cache (com aviso); sem taxa em cache alguma vez, a operação é recusada | prossegue com aviso, ou recusa se nunca houve taxa em cache | IntegracaoExternaException (limiteExcedido=false) |

## VAL — Validação de payload

| Código | Situação | Status HTTP |
|---|---|---|
| VAL-001 | Corpo da requisição inválido — detalhe de cada campo em `fieldErrors` | 400 |

## SYS — Erro interno inesperado

| Código | Situação | Status HTTP |
|---|---|---|
| SYS-001 | Exceção não mapeada (bug). Mensagem genérica ao cliente; stacktrace completo só no log do servidor | 500 |

## Notas

- `EXT-007` cobre hoje CNPJ, CEP e CVM juntos porque as três falhas acontecem
  dentro do mesmo fluxo (`POST /corretoras`) e todas significam a mesma coisa
  para quem consome a API: "não deu pra completar o cadastro por falha de
  infraestrutura externa, tente de novo". Se algum consumidor precisar
  distinguir qual das três falhou, isso vira um código mais granular depois —
  não foi necessário até aqui.
- Cota de API externa estourada (`EXT-009`) ou fonte indisponível (`EXT-010`)
  não derrubam mais compra/venda desde a SPEC-07 (Q-MAP-06): a operação
  prossegue com a última cotação conhecida (`Acao.cotacaoAtual`), com um
  aviso em `avisos[]` sobre a idade do dado. Só quando a ação nunca teve
  cotação salva (nunca foi buscada com sucesso) é que a operação é recusada
  — sem fallback possível.
- Desde a SPEC-07, `cotacaoAtual`/`dataHoraCotacao` funcionam como cache com
  TTL (`cotacao.cache-ttl-minutos`, padrão 15min): dentro do TTL, comprar,
  vender e atualizar cotação reaproveitam o valor salvo sem chamar a fonte
  externa. `PUT /acoes/{id}/atualizar-cotacao?forcar=true` ignora o cache.
- Desde a SPEC-08, câmbio USD-BRL segue o mesmo padrão de cache com TTL
  (`cambio.cache-ttl-minutos`, padrão 15min, cache global — não por ação) e
  o mesmo padrão de fallback: AwesomeAPI (campo `ask`) é a fonte primária,
  PTAX BCB é o fallback; se as duas falharem, prossegue com a última taxa
  conhecida (aviso), recusando só se nunca houve taxa em cache (`EXT-011`).
- Desde a SPEC-08, `OPE-002` (incompatibilidade de mercado) foi removido —
  carteira aceita ações BR e US juntas (Q-MAP-09).
- Desde a SPEC-10, a unicidade de e-mail/CPF do investidor é **parcial**
  (índice `WHERE ativo = true`, migration `V16`), igual a ticker (`V12`) e
  CNPJ. Toda consulta por chave natural do sistema filtra `ativo` — não
  existe mais busca por ticker/CNPJ/e-mail sem filtro, justamente porque
  duas linhas com a mesma chave (uma ativa, uma inativa) fazem uma consulta
  que devolve `Optional` estourar `IncorrectResultSizeDataAccessException`
  (foi o que causou o 500 em `GET /corretoras/cnpj/{cnpj}` em 06/09/2026).
- `GET /mercado/barra-cotacoes` (SPEC-09) não tem código de erro próprio —
  agrega brapi, AwesomeAPI e CoinGecko, e cada fonte que falhar simplesmente
  não aparece no resultado, com um aviso em `avisos[]`. Nunca retorna
  4xx/5xx por causa de uma fonte externa fora do ar; a resposta é sempre
  200, com o que deu certo. Cache com TTL de 15min (`mercado.barra-cache-ttl-minutos`).