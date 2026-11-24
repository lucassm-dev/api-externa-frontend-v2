# Tasks: Ações

> feature: acoes

## T-048 — Contratos e serviço do catálogo de ações [concluida]
- Refs: AC-122, AC-126, AC-127, AC-132, AC-133, AC-142, AC-144, AC-147
- Arquivos: src/app/features/acoes/acoes.model.ts, src/app/features/acoes/acoes.service.ts, src/app/features/acoes/acoes.service.spec.ts
- Notas: os cinco endpoints — cadastrar (`{ ticker, mercado }`), listar paginado, buscar por ticker, atualizar cotação (`PUT /acoes/{id}/atualizar-cotacao`, com `forcar=true` só quando pedido) e remover, que usa o **ticker no caminho**, não o id (AC-144). Mais a leitura de `GET /carteiras?page=0&size=1` que responde se o investidor tem carteira: `totalElements > 0` (ASM-031); falha vira `null`, estado desconhecido, nunca `false` (AC-128). `Mercado`, `MERCADOS` e `rotuloDoMercado` são reaproveitados de `carteiras.model` — o mercado é o mesmo domínio, não se duplica. `normalizarTicker` (caixa alta, sem espaços) para o que vai no envio e na consulta (ASM-033). Nenhum estado local de ação é criado aqui: o que o servidor recusou não existe (AC-124).

## T-049 — Desfecho da atualização de cotação [concluida]
- Refs: AC-137, AC-138
- Arquivos: src/app/features/acoes/desfecho-cotacao.ts, src/app/features/acoes/desfecho-cotacao.spec.ts
- Notas: função pura que compara a cotação anterior com a devolvida e classifica o desfecho — `preco-novo` ou `continua-atual` — com o texto de cada um. O caso do cache válido é o que mais parece bug (ADR-005): tem mensagem própria, que diz que o preço continua atual e por quê, e nunca é silêncio nem falha (AC-138). EXT-009 e EXT-010 não passam por aqui: são erro do servidor, traduzidos pela fundação com `{horario}` preenchido pela tela.

## T-050 — Tela de cadastro com bloqueio antecipado do pré-requisito [concluida]
- Refs: AC-121, AC-122, AC-123, AC-124, AC-125, AC-126, AC-127, AC-128, AC-129
- Arquivos: src/app/features/acoes/cadastro/cadastro-acao.ts, src/app/features/acoes/cadastro/cadastro-acao.html, src/app/features/acoes/cadastro/cadastro-acao.scss, src/app/features/acoes/cadastro/cadastro-acao.spec.ts
- Notas: dois campos só, ticker e mercado (AC-121). Antes de renderizar formulário algum, a tela pergunta ao servidor se o investidor tem carteira: sem carteira, nenhum campo é renderizado e no lugar aparece "Crie uma carteira antes de cadastrar ações." com o atalho para `/carteiras/nova` (AC-126, ADR-003); consulta que falhou não vira bloqueio — o formulário abre e o servidor decide no envio (AC-128, ASM-016 do painel). Envio travado durante a consulta, sem segunda requisição (AC-123). A recusa usa o tradutor da fundação, pelo código nunca pelo texto (P-004): EXT-008 mantém ticker e mercado no formulário e destaca o campo (AC-124); ACA-002 consulta `GET /acoes/ticker/{ticker}` e monta o cartão da ação existente com atalho para o detalhe (AC-125, ASM-032, Q-018); ACA-004 repete o atalho de criar carteira, como rede de segurança (AC-129).

## T-051 — Lista do catálogo com busca por ticker e paginação [concluida]
- Refs: AC-130, AC-131, AC-132, AC-133, AC-134, AC-135, AC-136
- Arquivos: src/app/features/acoes/lista/lista-acoes.ts, src/app/features/acoes/lista/lista-acoes.html, src/app/features/acoes/lista/lista-acoes.scss, src/app/features/acoes/lista/lista-acoes.spec.ts
- Notas: título "Ações" e uma linha dizendo que o catálogo é compartilhado — "minhas ações" não aparece em lugar nenhum (AC-130, ADR-002). Cada linha traz ticker, empresa, mercado, moeda e a cotação pelo `app-valor-com-horario` da fundação, que já datou e marca a defasagem de 15 minutos (AC-131, AC-135). **Sem selo de uso**: nenhuma consulta a posições ou consolidado sai desta tela (AC-134, PRD-006). Busca por ticker abre o detalhe; sem resultado, estado vazio oferecendo cadastrar aquele ticker, nunca a mensagem de ACA-001 (AC-133, mesmo padrão de corretoras). A lista não dispara atualização de cotação nenhuma — só lê o que o servidor já tinha (AC-136).

## T-052 — Detalhe da ação: cotação, atualização e remoção [concluida]
- Refs: AC-135, AC-136, AC-137, AC-138, AC-139, AC-140, AC-141, AC-142, AC-143, AC-144, AC-145, AC-146, AC-147
- Arquivos: src/app/features/acoes/detalhe/detalhe-acao.ts, src/app/features/acoes/detalhe/detalhe-acao.html, src/app/features/acoes/detalhe/detalhe-acao.scss, src/app/features/acoes/detalhe/detalhe-acao.spec.ts
- Notas: a tela dos quatro desfechos. Carrega por ticker (`GET /acoes/ticker/{ticker}`) e nunca busca cotação por conta própria (AC-136). Atualizar é botão explícito: `preco-novo` troca número e horário, `continua-atual` diz que o preço segue válido (T-049), EXT-009 e EXT-010 mantêm o preço na tela com textos distintos, cada um com `{horario}` preenchido pela cotação exibida (AC-139, AC-140) — em nenhum dos quatro o preço some. A busca forçada só existe depois do desfecho `continua-atual`, com o aviso de que consome a cota compartilhada (AC-141, AC-142, Q-016). Remoção usa o `DialogoConfirmacao` de `shared/` e manda o **ticker** na rota (AC-143, AC-144); ACA-003 cancela com o texto exato do catálogo, que não nomeia carteira nem investidor (AC-145); aceita, a ação só some — sem lixeira, sem desfazer (AC-146, ADR-007). ACA-001 e ticker inexistente devolvem à lista (AC-147).

## T-053 — Rotas da área de ações [concluida]
- Refs: AC-133, AC-147
- Arquivos: src/app/features/acoes/acoes.routes.ts, src/app/features/acoes/acoes.routes.spec.ts, src/app/app.routes.ts
- Notas: substitui a área em construção pelas três telas — lista, `nova` e `:ticker` — sob a casca e a guarda de sessão, como corretoras já faz. A ordem importa: `nova` antes de `:ticker`, senão o cadastro vira detalhe de uma ação chamada "nova".
