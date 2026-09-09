# ADRs — decisões que amarram o frontend

Decisões já tomadas e implementadas no backend, registradas aqui porque cada uma
restringe o que as telas podem prometer.

| ADR | Decisão | Impacto principal no frontend |
|---|---|---|
| [001](001-sessao-por-token-de-prazo-fixo-sem-renovacao.md) | Sessão por token de prazo fixo, sem renovação | Cadastro e login são dois passos; expiração devolve ao login |
| [002](002-corretora-e-acao-como-catalogo-compartilhado.md) | Corretora e ação são catálogo compartilhado | "Corretoras" e "Ações", nunca "minhas" |
| [003](003-ordem-obrigatoria-corretora-carteira-acao.md) | Ordem obrigatória corretora → carteira → ação → operação | Painel mostra um próximo passo; cadastro de ação bloqueado sem carteira |
| [004](004-carteira-multimercado-com-consolidacao-em-moeda-unica.md) | Carteira multimercado com consolidação em moeda única | Nenhuma tela afirma um mercado por carteira; taxa e horário sempre visíveis |
| [005](005-cotacao-como-snapshot-com-cache.md) | Cotação é snapshot datado, com cache | Todo preço vem com horário; sem tempo real, sem polling |
| [006](006-degradacao-com-avisos-em-vez-de-falha.md) | Degradação com avisos em vez de falha | Três níveis: informação, aviso, erro — aviso nunca parece erro |
| [007](007-exclusao-logica-com-bloqueio-por-vinculo-ativo.md) | Exclusão lógica com bloqueio por vínculo ativo | Sem lixeira, sem desfazer; bloqueio sempre explicado |
| [008](008-preco-de-mercado-como-padrao-com-override-manual.md) | Preço de mercado por padrão, manual por opt-in | Formulário mostra preço e total antes de confirmar |
| [009](009-contrato-unico-de-erro-com-codigo-por-dominio.md) | Contrato único de erro com código por domínio | Frontend trata por código, escreve os próprios textos |
| [010](010-consultas-paginadas-sem-filtro-e-sem-serie-historica.md) | Consultas paginadas, sem filtro e sem série histórica | Extrato sem filtros no v1; nenhum gráfico de evolução |
