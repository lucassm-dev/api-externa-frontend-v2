# Tasks: Corretoras

> feature: corretoras

## T-030 — CNPJ: normalizar, mascarar e validar antes do envio [concluida]
- Refs: AC-067
- Arquivos: src/app/features/corretoras/cnpj.ts, src/app/features/corretoras/cnpj.spec.ts
- Notas: funções puras. `somenteDigitos` para o que vai no envio e na consulta por CNPJ (ASM-018), `formatarCnpj` para exibição, e a checagem de 14 dígitos com dígito verificador para o que dá para barrar antes do envio (PRD-009). Máscara e dígitos puros são o mesmo CNPJ — o formato nunca é motivo de recusa local. O veredito sobre a empresa é sempre do servidor.

## T-031 — Contratos e serviço das corretoras [concluida]
- Refs: AC-078, AC-079, AC-081, AC-083, AC-074
- Arquivos: src/app/features/corretoras/corretoras.model.ts, src/app/features/corretoras/corretoras.service.ts, src/app/features/corretoras/corretoras.service.spec.ts
- Notas: os cinco endpoints do catálogo — cadastrar (só `{ cnpj }`), listar paginado, buscar por identificador, buscar por CNPJ e remover — mais a leitura das carteiras do investidor para o selo, percorrendo todas as páginas com `size=200` (Q-011). A contagem por corretora nunca propaga erro: falha vira mapa vazio, a lista segue sem selo (ADR-006, AC-083). Nenhum estado local de corretora é criado aqui: o que o servidor recusou não existe (AC-074).

## T-032 — Selo de uso: contagem e rótulo [concluida]
- Refs: AC-081, AC-082
- Arquivos: src/app/features/corretoras/selo-de-uso.ts, src/app/features/corretoras/selo-de-uso.spec.ts
- Notas: função pura que agrupa carteiras por `corretoraId` e devolve o rótulo no singular e no plural ("1 carteira sua" / "2 carteiras suas"). Zero carteiras não gera rótulo. Não ordena nada — a ordem da lista é a do servidor (AC-082).

## T-033 — Diálogo de confirmação simples (compartilhado) [concluida]
- Refs: AC-087
- Arquivos: src/app/shared/confirmacao/dialogo-confirmacao.ts, src/app/shared/confirmacao/dialogo-confirmacao.html, src/app/shared/confirmacao/dialogo-confirmacao.scss, src/app/shared/confirmacao/dialogo-confirmacao.spec.ts
- Notas: o padrão do PRD-009 para toda ação destrutiva: título, consequência descrita em texto e dois botões. Nada de digitar o nome. Mora em `shared/` porque carteiras, ações e operações vão usar o mesmo — apresentação sem regra de domínio.

## T-034 — Tela de cadastro pelo CNPJ [concluida]
- Refs: AC-066, AC-067, AC-068, AC-069, AC-070, AC-071, AC-072, AC-073, AC-074, AC-075
- Arquivos: src/app/features/corretoras/cadastro/cadastro-corretora.ts, src/app/features/corretoras/cadastro/cadastro-corretora.html, src/app/features/corretoras/cadastro/cadastro-corretora.scss, src/app/features/corretoras/cadastro/cadastro-corretora.spec.ts
- Notas: o ponto mais delicado da feature. Um campo só (AC-066). Enquanto a consulta corre, a tela diz que está consultando Receita, endereço e CVM, e o envio fica travado — nem um segundo clique dispara requisição (AC-068, AC-069). A recusa usa o tradutor da fundação: COR-003 já acrescenta o motivo do servidor ao texto e destaca o campo (AC-071, AC-073), e EXT-007 tem mensagem própria que nunca insinua reprovação (AC-072). O comportamento sai do código do erro, nunca do texto (P-004). COR-002 monta o cartão da corretora existente consultando por CNPJ e oferece abrir o detalhe dela (AC-075, ASM-017, Q-009).

## T-035 — Lista do catálogo com busca, paginação e selo [concluida]
- Refs: AC-076, AC-077, AC-078, AC-080, AC-081, AC-082, AC-083
- Arquivos: src/app/features/corretoras/lista/lista-corretoras.ts, src/app/features/corretoras/lista/lista-corretoras.html, src/app/features/corretoras/lista/lista-corretoras.scss, src/app/features/corretoras/lista/lista-corretoras.spec.ts
- Notas: título "Corretoras" e uma linha de texto dizendo que o catálogo é compartilhado — "Minhas corretoras" não aparece em lugar nenhum (AC-076, ADR-002). Cada linha traz nome, CNPJ formatado, cidade/UF e validação. Busca por CNPJ abre o detalhe; sem resultado, estado vazio com oferta de cadastrar, nunca a mensagem de COR-001 (AC-080, Q-010). O selo entra depois, sem reordenar (AC-082), e some sem alarde se a contagem falhar (AC-083).

## T-036 — Detalhe da corretora e remoção [concluida]
- Refs: AC-084, AC-085, AC-086, AC-088, AC-089, AC-090
- Arquivos: src/app/features/corretoras/detalhe/detalhe-corretora.ts, src/app/features/corretoras/detalhe/detalhe-corretora.html, src/app/features/corretoras/detalhe/detalhe-corretora.scss, src/app/features/corretoras/detalhe/detalhe-corretora.spec.ts
- Notas: dados cadastrais, endereço completo, marca de validação na CVM e a data da base oficial formatada — ela importa porque a base reflete o último dia útil (AC-085). Remover está disponível para qualquer corretora, sem checagem de autoria (AC-090, ADR-002); usa o diálogo da T-033 e, na volta, a corretora só some da lista — sem lixeira, sem desfazer (AC-088, ADR-007). COR-004 cancela a exclusão com o texto exato do catálogo, que não nomeia investidor nem quantidade (AC-089). COR-001 devolve à lista (AC-086).

## T-037 — Rotas da área de corretoras [concluida]
- Refs: AC-079, AC-086
- Arquivos: src/app/features/corretoras/corretoras.routes.ts, src/app/features/corretoras/corretoras.routes.spec.ts, src/app/app.routes.ts
- Notas: substitui a área em construção pelas três telas — lista, `nova` e `:id` — carregadas por rota sob a casca e a guarda de sessão, como o painel já faz. A ordem importa: `nova` antes de `:id`.
