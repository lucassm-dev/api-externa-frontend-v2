# Contrato da API para o frontend

Copie esta pasta (`docs/frontend/`) e o `docs/erros.md` para o repositório do frontend.

| Arquivo | Para que serve |
|---|---|
| `openapi.json` | Rotas, DTOs, enums e campos obrigatórios. Fonte da verdade para gerar os tipos. |
| `../erros.md` | Catálogo de todos os códigos de erro (`codigo` da resposta). |
| `../../api-requests.http` | Exemplo real de cada chamada com o status esperado, testado ponta a ponta. |
| `CONTRATO.md` | Regras que o OpenAPI não descreve (este arquivo). |

## Gerar os tipos

Angular (gera services prontos):

```
npx ng-openapi-gen --input api/openapi.json --output src/app/api
```

Qualquer framework (só tipos):

```
npx openapi-typescript api/openapi.json -o src/api/schema.d.ts
```

Quando o backend mudar: no repositório do backend, rode `./mvnw spring-boot:run`, depois
`curl -s localhost:8080/v3/api-docs > docs/frontend/openapi.json` e copie de novo. O
`/v3/api-docs` só existe no perfil `dev`; o container do docker compose não expõe.

## Endereço e CORS

- API local: `http://localhost:8080`.
- Em dev, o backend libera a origem `http://localhost:4200`.
- No docker compose, o frontend fala com a API pela mesma origem, via nginx (`backend:8080`), sem CORS.

## Autenticação

- `POST /auth/login` devolve `{ token, tipo: "Bearer", expiraEm }`. Envie `Authorization: Bearer <token>` em todo o resto.
- O token vale 1 hora e **não existe refresh**: quando expira, volta 401 `AUT-006`. Mande para o login.
- Rotas públicas: `/auth/cadastro`, `/auth/login`, `/auth/esqueci-senha`, `/auth/redefinir-senha`.
- Depois do login, chame `GET /auth/me` para saber `papel` (`INVESTIDOR` | `ADMIN`), `nome`, `email` e `fotoUrl`.

| Resposta | Significado | O que a tela faz |
|---|---|---|
| 401 `AUT-004` | E-mail ou senha errados (mensagem genérica) | Erro no formulário de login |
| 401 `AUT-005` | Token ausente, inválido ou de antes de uma troca de senha | Limpa a sessão e vai para o login |
| 401 `AUT-006` | Token expirado | Idem, com aviso "sessão expirou" |
| 401 `AUT-010` | Conta bloqueada com sessão aberta | Limpa a sessão e mostra "conta bloqueada" |
| 403 `AUT-009` | Login certo, mas a conta está bloqueada | Mensagem no login |
| 403 `AUT-007` | Papel errado para a rota | Não deveria acontecer se o menu respeitar o papel |

## Papéis e telas

| Papel | Rotas |
|---|---|
| INVESTIDOR | `/investidores`, `/carteiras/**`, `/operacoes/**` (ADMIN recebe 403) |
| ADMIN | `/admin/**`; cadastrar, excluir e descontinuar corretora; `/corretoras/{id}/carteiras-afetadas` |
| Ambos | `/auth/me`, `/auth/senha`, `/auth/email`, `/auth/me/foto`, leitura de `/corretoras` e `/acoes`, `/mercado/barra-cotacoes` |

ADMIN não tem investidor: em `/auth/me`, `nome` vem `null`.

## Regras por tela

**Cadastro e senha**
- Política de senha: mínimo 8 caracteres, com pelo menos uma letra e um número (422 `AUT-008`). Valide também no front.
- CPF: 11 dígitos, só números.
- `PUT /auth/senha` devolve um token NOVO; troque o token salvo. Os tokens anteriores passam a dar 401 `AUT-005`.

**Esqueci a senha**
- `POST /auth/esqueci-senha` responde sempre 202, exista o e-mail ou não. A tela diz "se o e-mail existir, enviamos um código".
- O código tem 6 dígitos e vale 10 minutos. Até 3 pedidos a cada 15 minutos; depois disso, nenhum e-mail novo é enviado.
- `POST /auth/redefinir-senha` com código errado ou expirado: 422 `AUT-013`. 5 erros invalidam o código.

**Trocar e-mail**
- `POST /auth/email` (`novoEmail`, `senhaAtual`) → 202; o código vai para o e-mail novo.
- Erros: senha errada 422 `AUT-014`, e-mail em uso 409 `AUT-001`, muitos pedidos 422 `AUT-015`, SMTP fora 503 `EXT-012`.
- `POST /auth/email/confirmar` (`codigo`) → 204. Recarregue `/auth/me`.

**Foto de perfil**
- `PUT /auth/me/foto` em `multipart/form-data`, campo `arquivo`. Até 10 MB (422 `AUT-016`); JPEG, PNG ou WebP, detectado pelo conteúdo (422 `AUT-017`).
- `fotoUrl` em `/auth/me` vem `"/auth/me/foto"` quando há foto e `null` quando não há.
- `GET /auth/me/foto` exige o token: um `<img src>` direto não funciona. Busque como blob com o header e use `URL.createObjectURL`. Sem foto: 404.

**Corretoras**
- CNPJ: 14 dígitos ou `00.000.000/0000-00`. O backend valida na CVM (422 `COR-003`; CVM fora do ar: 503 `EXT-007`).
- Antes de descontinuar, mostre `GET /corretoras/{id}/carteiras-afetadas`. Descontinuar exige `motivo`.
- Corretora descontinuada não aceita carteira nova (422 `COR-005`). Excluir com carteira ativa: 422 `COR-004`.

**Ações (catálogo)**
- Não existe cadastro de ação. A busca é `GET /acoes/ticker/{ticker}?mercado=BR|US`: se a ação não estiver no catálogo, ela é incluída na hora.
- Sem `mercado` e fora do catálogo: 404 `ACA-001`. Ticker que não existe na fonte: 422 `EXT-008`.
- `PUT /acoes/{id}/atualizar-cotacao` respeita cache de 15 min; `?forcar=true` ignora o cache.

**Carteiras e operações**
- Carteira pertence ao usuário do token. Carteira de outra pessoa responde 404 `CAR-001`, nunca 403.
- Compra sem `precoUnitario` usa a cotação atual; com `precoUnitario`, vira preço manual. Máximo de 2 casas decimais (422 `OPE-005`).
- `avisos[]` na resposta da operação e do consolidado: mostre como alerta não bloqueante (ex.: preço manual muito longe da cotação).
- Venda: sem posição 422 `OPE-003`; acima da posição 422 `OPE-004`.
- Carteira aceita ações BR e US juntas. Valores de ações US vêm em USD na operação (`moeda`, `taxaCambioNaOperacao`); `lucro-realizado` e `consolidado` já vêm convertidos em BRL.
- Excluir carteira com posição: 422 `CAR-002`. Excluir operação é soft delete; excluir de novo dá 404 `OPE-001`.

**Histórico de operações** (`GET /operacoes`)
- Filtros opcionais: `dataInicio`, `dataFim` (`YYYY-MM-DD`), `ticker`, `carteiraId`, `tipo` (`COMPRA`|`VENDA`), `resultado` (`LUCRO`|`PREJUIZO`).
- Data final antes da inicial: 422 `OPE-006`. Enum inválido: 400 `VAL-002`.

**Admin**
- `GET /admin/usuarios?situacao=&papel=&page=&size=`; excluídos nunca aparecem.
- `GET /admin/usuarios/totais?papel=` devolve `{ "ATIVO": n, "BLOQUEADO": n }`, sempre com as duas chaves.
- Bloquear exige `motivo`; o admin não pode bloquear a si mesmo (422 `AUT-011`).
- `GET /admin/uso?dataInicio=&dataFim=`: sem datas, são os últimos 7 dias. Devolve `total`, `picos[]` (por hora) e `usuarios[]` (top 10).

## Padrões gerais

- Listas paginadas usam `page` (começa em 0), `size` e `sort=campo,asc|desc`. A resposta é a `Page` do Spring: `content`, `totalElements`, `totalPages`, `number`, `size`.
- Datas e horas vêm em ISO-8601, no fuso de Brasília.
- Erro de validação: 400 `VAL-001` com `fieldErrors[{ field, message }]`; use para marcar os campos do formulário.
- 500 `SYS-001`: mensagem genérica de "tente de novo".
