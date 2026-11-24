# Tasks: Acesso

> feature: acesso

## T-013 — Corrigir o contrato da sessão para o que o backend devolve [concluida]

- Refs: AC-046
- Arquivos: src/app/core/sessao/sessao.model.ts, src/app/core/sessao/sessao.service.ts, src/app/core/sessao/sessao.service.spec.ts, src/app/core/sessao/sessao.guard.spec.ts, src/app/core/sessao/autenticacao.interceptor.spec.ts, src/app/core/erros/erro.interceptor.spec.ts
- Notas: a fundação assumiu `{ token, expiraEm, investidor }` (ASM-001); o backend devolve `{ token, tipo, expiraEm }`. A sessão passa a guardar esses três campos mais o e-mail digitado no login. Os testes da fundação que montam sessão precisam acompanhar. Nenhuma outra tarefa começa antes desta.

## T-014 — Serviço de acesso: cadastrar e entrar [concluida]

- Refs: AC-025, AC-026, AC-035, AC-046
- Arquivos: src/app/features/acesso/acesso.model.ts, src/app/features/acesso/acesso.service.ts, src/app/features/acesso/acesso.service.spec.ts
- Notas: as duas únicas rotas públicas — POST /auth/cadastro e POST /auth/login. Entrar guarda a sessão com o e-mail digitado; cadastrar não cria sessão nenhuma e não guarda a senha (ADR-001).

## T-015 — Validação no cliente: CPF, senha e e-mail [concluida]

- Refs: AC-027, AC-028, AC-029
- Arquivos: src/app/features/acesso/validadores.ts, src/app/features/acesso/validadores.spec.ts
- Notas: mesma política do backend (11 dígitos; 8+ caracteres com letra e número). O que dá para validar antes do envio é validado antes; AUT-008 vindo do servidor é rede de segurança.

## T-016 — Tela de cadastro [concluida]

- Refs: AC-025, AC-026, AC-030, AC-031, AC-032, AC-033, AC-034
- Arquivos: src/app/features/acesso/cadastro/cadastro.ts, src/app/features/acesso/cadastro/cadastro.html, src/app/features/acesso/cadastro/cadastro.scss, src/app/features/acesso/cadastro/cadastro.spec.ts, src/app/core/erros/erro-em-formulario.ts
- Notas: quatro campos obrigatórios, regras visíveis desde a abertura, erro nunca limpa o formulário e o destaque vai no campo que o código do erro aponta.

## T-017 — Tela de login [concluida]

- Refs: AC-035, AC-036, AC-037, AC-038, AC-039, AC-045
- Arquivos: src/app/features/acesso/login/login.ts, src/app/features/acesso/login/login.html, src/app/features/acesso/login/login.scss, src/app/features/acesso/login/login.spec.ts
- Notas: mensagem genérica em AUT-004, sem link de recuperação de senha, e-mail preenchido quando vem do cadastro, motivo de expiração exibido quando vem de AUT-006.

## T-018 — Casca da área interna: sair e aviso de sessão acabando [concluida]

- Refs: AC-041, AC-043, AC-044
- Arquivos: src/app/layout/casca.ts, src/app/layout/casca.html, src/app/layout/casca.scss, src/app/layout/casca.spec.ts
- Notas: botão sair sempre visível, e-mail do investidor ao lado. O aviso de expiração sai do `expiraEm` guardado, no nível aviso, sem bloquear e sem consultar o servidor.

## T-019 — Rotas de acesso e destino mínimo da área interna [concluida]

- Refs: AC-039, AC-040, AC-042
- Arquivos: src/app/app.routes.ts, src/app/features/acesso/acesso.routes.ts, src/app/features/acesso/acesso.routes.spec.ts, src/app/features/acesso/visitante.guard.ts
- Notas: /entrar e /criar-conta públicas com link entre elas; a área interna guardada pela guarda da fundação; /painel provisório — substituído pelo painel de verdade na T-029.

## T-054 — Máscara do CPF no cadastro [concluida]
- Refs: AC-148, AC-149, AC-027, AC-034
- Arquivos: src/app/features/acesso/validadores.ts, src/app/features/acesso/validadores.spec.ts, src/app/features/acesso/cadastro/cadastro.ts, src/app/features/acesso/cadastro/cadastro.html, src/app/features/acesso/cadastro/cadastro.spec.ts
- Notas: o campo passa a mostrar `000.000.000-00` enquanto o investidor digita, como já acontece com o CNPJ em corretoras — pontuação é a forma como o brasileiro lê CPF, e conferir onze dígitos corridos é onde o erro de digitação se esconde. A máscara é só apresentação: o validador olha os dígitos e o envio manda os 11 dígitos limpos (AC-149), porque o backend valida `\d{11}`. A regra escrita no campo acompanha a mudança, senão o texto passa a contradizer o que a tela faz (AC-034).
