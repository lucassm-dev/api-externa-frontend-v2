# PRD, RFC e TDD

> Os três documentos que os bons times escrevem antes de programar — e como gerar cada um com IA, do jeito profissional.

**Projeto-guia da aula:** um delivery de comida caseira que quer deixar o cliente escolher a janela de entrega (ex.: sábado, 18h–20h). Todo conceito da aula vira um pedaço desse projeto.

**Mapa da aula**

| Bloco | Conteúdo | Frames |
|---|---|---|
| 1 | O problema e a visão geral | 01–03 |
| 2 | PRD e RFC a fundo | 04–09 |
| 3 | TDD a fundo | 10–12 |
| 4 | Decidir, gerar com IA, revisar | 13–18 |
| 5 | Do documento ao código provado | 19–24 |

**As três perguntas**

- **PRD** — O QUÊ construir, para QUEM e POR QUÊ?
- **RFC** — QUAL caminho seguir, entre os possíveis?
- **TDD** — COMO construir, em detalhe?

---

## 02 · Construir sem pensar sai caro

### A reforma sem planta

1. Você decide reformar a cozinha e fazer uma ilha no meio
2. O pedreiro empolgado começa no dia seguinte — sem desenhar planta nenhuma
3. Semana 2: o cano de gás passa exatamente onde a ilha ficaria
4. Refazer = quebrar o piso novo. **3× o preço e 2 meses a mais.**

### No software acontece igual — 3 dores

1. **Retrabalho gigante** — descobrir o problema com o código pronto custa 10× mais que descobrir no papel
2. **Time desalinhado** — cada pessoa constrói uma versão diferente da mesma ideia que ninguém escreveu
3. **Decisão perdida** — seis meses depois: "por que fizemos assim?" Ninguém lembra. Aí mexem — e quebra.

> **Documento não é burocracia. É errar no papel — onde errar custa uma borracha, não um piso novo.**

---

## 03 · Três documentos, três perguntas

Cada documento responde UMA pergunta. Decorou as perguntas, decorou a aula.

### PRD — Product Requirements Document
**Pergunta:** O QUÊ, para QUEM, POR QUÊ?

- **Na reforma:** "A família cresceu. Precisamos de mais um quarto e mais um banheiro até dezembro."
- **No projeto-guia:** "Clientes precisam escolher a janela de entrega" — sem citar nenhuma tecnologia.

### RFC — Request for Comments
**Pergunta:** QUAL caminho, entre os possíveis?

- **Na reforma:** "Fechar a varanda ou dividir a sala? Comparar preço, luz e prazo ANTES de escolher."
- **No projeto-guia:** "3 jeitos de impedir dois clientes na mesma vaga — qual usar, e por quê?"

### TDD — Technical Design Document
**Pergunta:** COMO construir, em detalhe?

- **Na reforma:** "A planta baixa: medidas, fiação, encanamento, ordem das etapas da obra."
- **No projeto-guia:** "As tabelas do banco, as APIs, o plano para desfazer se der errado."

**A ordem:** `PRD → RFC → TDD → Spec → Tasks`

---

## 04 · PRD — o documento do problema

Quem escreve é quem cuida do produto (o PM). Em projeto solo: você mesmo, em 1 página.

### O que vai dentro

1. **Problema e contexto** — que dor existe hoje, com números ("em sábado de pico, 30% atrasam")
2. **Usuários e o "trabalho"** — para que a pessoa "contrata" o produto (ninguém quer furadeira, quer o quadro na parede)
3. **Requisitos** — o que o sistema faz (funcionais) e como se comporta: rápido, seguro, sem overbooking
4. **Métricas de sucesso** — como saber se deu certo ("% de pedidos sem conflito de janela")
5. **Escopo e NÃO-escopo** — o que fica de fora é tão importante quanto o que entra (corta discussão infinita)

### REGRA DE OURO: o PRD descreve o problema. Nunca a solução técnica.

**ERRADO** (isso é solução técnica)
> "Usar PostgreSQL com trava na tabela de vagas para controlar concorrência"

**CERTO** (isso é o problema)
> "O sistema nunca pode aceitar mais pedidos do que a capacidade da janela"

**Por quê?** Quem decide a tecnologia é a engenharia, mais tarde, no RFC e no TDD. O PRD amarrando a solução cedo demais rouba as opções do time.

> PRD de 40 páginas ninguém lê. O formato moderno: 1 página enxuta.

---

## 05 · O PRD do projeto-guia

`docs/prd/agendamento-de-pedidos.md`

| Seção | Conteúdo |
|---|---|
| **PROBLEMA** | Clientes não escolhem quando receber. No pico de sábado a cozinha não dá conta e 30% das entregas atrasam. |
| **USUÁRIOS** | Cliente: "quero uma janela que caiba na minha rotina". Cozinha: "quero um teto de pedidos por janela". |
| **REQUISITOS** | Criar pedido escolhendo a janela · reagendar · cancelar · pagar online no ato da reserva. |
| **NUNCA PODE** | Aceitar mais pedidos que a capacidade da janela. Demorar mais que 3 s para confirmar. |
| **MÉTRICAS** | % de pedidos sem conflito de janela · taxa de entregas atrasadas · nota do cliente. |
| **FORA DO ESCOPO (V1)** | Rota dos entregadores · preço dinâmico por horário · vários idiomas. |

**Repare em 3 coisas**

1. Cabe numa página.
2. Nenhuma linha fala de tecnologia — nada de banco, linguagem ou framework.
3. O "fora do escopo" evita a feature infinita.

**Gancho:** o PRD está pronto — mas ficou uma pergunta difícil no ar: "como garantir que dois clientes não peguem a última vaga da mesma janela ao mesmo tempo?" Decisão difícil e cara de mudar depois = assunto para um RFC.

---

## 06 · RFC — um pedido de comentários

### A ideia mais antiga da internet

**1969 · nasce o primeiro RFC** — Steve Crocker, um estudante, precisava propor regras para a ARPANET. Para não soar autoritário, chamou o texto de "Request for Comments": pedido de comentários. Tradução: "é uma proposta — me digam o que acham antes de virar regra".

> RFC 1 — "Host Software" — 7 de abril de 1969
> hoje: mais de 8.500 RFCs definem e-mail, HTTP, Wi-Fi…

A internet inteira foi construída assim: propostas abertas + comentários dos colegas.

### Como as empresas usam hoje

| Empresa | Como faz |
|---|---|
| **Google** | "Design Docs" informais — cada projeto escreve do jeito que fizer sentido |
| **Amazon** | memorando de 6 páginas lido EM SILÊNCIO no começo da reunião — todos leem, aí discutem |
| **Uber** | RFCs por e-mail com aprovadores nomeados para propostas grandes |
| **Rust e React** | RFC público no GitHub: arquivo markdown + pull request + comentários do mundo todo |

> **A ideia que sobreviveu 50 anos: ESCREVER a proposta força a clareza. Deixar os outros comentarem pega o erro antes do código.**

---

## 07 · As 7 partes de um bom RFC

A ordem das partes importa tanto quanto o conteúdo — principalmente a posição dos critérios.

1. **Título orientado a ação** — "Adotar reserva com prazo nos slots", não "Sobre slots"
2. **Contexto com NÚMEROS** — a dor de hoje, medida
3. **Premissas** — o que você assume como verdade, com grau de confiança
4. **Critérios de decisão, COM PESOS** — definidos ANTES de olhar as opções — o coração do RFC
5. **Opções — no mínimo 2** — sempre incluindo a opção "não fazer nada"
6. **Recomendação** — amarrada aos critérios, não ao gosto de quem escreve
7. **Resultado** — fica vazio até a decisão; depois vira registro histórico

### Por que critérios ANTES das opções?

Comprar carro. Quem visita a loja primeiro se apaixona por um modelo — e depois INVENTA critérios para justificar a paixão.

Quem define antes "preço, consumo, porta-malas, peso 10/8/5" compara de cabeça fria.

Em RFC é igual: critérios depois das opções viram advogado da opção favorita.

**CONTEXTO VAGO**
> "Nosso processo de deploy tem alguns problemas."

**CONTEXTO COM NÚMEROS**
> "O deploy exige 45 min de passos manuais e causou 3 incidentes neste trimestre."

> **Número convence, adjetivo não. E critério definido antes é o que separa decisão honesta de decisão de estimação.**

---

## 08 · RFC-001 — a última vaga do sábado

**Cenário:** Sábado, 19h02. A janela 18h–20h tem 1 vaga. Dois clientes tocam em "confirmar" no MESMO segundo. Sem proteção: 11 pedidos em 10 vagas — e a cozinha estoura.

### Opção A · Trancar a vaga (`lock pessimista`)
O primeiro pedido TRANCA a janela; o segundo espera a vez dele. O banco de dados faz a fila (`SELECT ... FOR UPDATE`).

- (+) simples de entender e seguro
- (−) em pico, todo mundo espera na fila

### Opção B · Tentar e conferir (`lock otimista`)
Os dois tentam ao mesmo tempo. O banco só grava se a vaga AINDA existia na hora de gravar; quem perdeu tenta de novo sozinho.

- (+) rápido mesmo em pico
- (−) exige lógica de "tentar de novo"

### Opção C · Reserva com prazo (`hold com validade`)
Tocou na vaga? Ela fica presa 10 min no seu nome enquanto você paga. Não pagou, a vaga volta sozinha para a janela.

- (+) melhor experiência de compra
- (−) mais uma peça para operar (Redis)

### Opção D · Não fazer nada
Continuar entregando "no dia", sem hora. Custa zero hoje… e mantém os 30% de atraso que o PRD quer matar. **(Todo RFC precisa dessa opção.)**

### Critérios (definidos antes, com peso)
- nunca estourar capacidade (peso 10)
- aguentar o pico de sábado (peso 8)
- simplicidade de operar (peso 6)

### Recomendação registrada
Opção B (tentar e conferir). Se a disputa por janela crescer muito, evoluir para C. Fica escrito: quem decidiu, quando e por quê.

---

## 09 · Porta de mão dupla × mão única

O filtro da Amazon para saber o que merece RFC: "dá para voltar atrás barato?"

### PORTA DE MÃO DUPLA — reversível, errou, volta e pronto
- **Na vida:** cortar o cabelo · pintar a parede · experimentar um restaurante novo
- **No software:** texto de um botão · cor do site · ordem dos cards na tela inicial

> Decida RÁPIDO, teste, ajuste. Escrever RFC para isso é desperdício de todo mundo.

### PORTA DE MÃO ÚNICA — irreversível, ou caríssima de desfazer
- **Na vida:** fazer uma tatuagem · vender a casa · derrubar uma parede estrutural
- **No software:** como guardar datas e fuso horário · escolher o banco · cobrar pagamento

> Decida DEVAGAR: RFC, opções honestas, revisão dos colegas. Depois de passar, não volta.

**Teste no projeto-guia:** mudar a cor do botão "confirmar" = mão dupla, vai direto. Decidir como guardar as janelas de horário (com ou sem fuso? UTC?) = mão única: migrar milhões de datas gravadas erradas depois é um pesadelo clássico.

> **RFC é para porta de mão única. Para o resto, decidir e seguir é mais barato que documentar.**

---

## 10 · Cuidado: TDD tem duas siglas

A mesma sigla nomeia DUAS coisas totalmente diferentes.

### O DESTA AULA — TDD = Technical Design Document
Documento de Design Técnico. O "COMO construir": arquitetura, tabelas, APIs, riscos, plano para desfazer. O blueprint da obra. É um **DOCUMENTO** que você escreve antes de programar.

### O OUTRO — TDD = Test-Driven Development
Desenvolvimento Guiado por Testes (Kent Beck). Escrever o TESTE antes do código, no ciclo: teste falha → código passa → melhora o código. É uma **PRÁTICA** de programar, não um documento.

> Como saber qual TDD é? Pelo assunto da conversa: papo de documentos e arquitetura → Design Técnico · papo de testes → Test-Driven

**Daqui em diante, nesta aula: TDD = sempre o documento.**

---

## 11 · O blueprint: o que vai no TDD

Escrito por quem vai liderar a construção, DEPOIS que o RFC decidiu a direção.

| Seção | O que entra |
|---|---|
| Contexto e problema | resumo — com link para PRD e RFCs |
| Escopo | o que este projeto cobre e o que não cobre |
| Solução técnica | arquitetura, modelo de dados, contratos de API |
| Alternativas | o que foi considerado e por que perdeu |
| Riscos | o que pode dar errado e o plano B |
| Plano de implementação | etapas, ordem e dependências |
| Segurança | OBRIGATÓRIA com pagamento ou dado pessoal |
| Testes | como saber que funciona antes de lançar |
| Monitoramento | que alarme toca se quebrar em produção |
| Rollback | como DESFAZER o lançamento em minutos |

### O teste da longevidade

Na dúvida se um detalhe entra no TDD, pergunte:

> "Se trocarmos de framework amanhã, essa frase continua verdadeira?"

- **SIM** → entra (é uma decisão)
- **NÃO** → fica fora (é detalhe de código)

**FORA DO TDD (detalhe de código):** colar comandos kubectl, código de controller, nome de biblioteca da moda

**DENTRO DO TDD (decisão e contrato):** "toda tentativa de pagamento carrega um código único e repetição não cobra de novo"

> Regra prática do Google: o projeto vai tomar 1 mês ou mais de trabalho? Escreva design doc.

> **O TDD guarda DECISÕES e CONTRATOS — nunca código. Código muda toda semana; decisão bem escrita vale por anos.**

---

## 12 · O TDD do agendamento

O RFC-001 escolheu a opção B (tentar e conferir). O TDD agora detalha os contratos:

### Modelo de dados

```
tabela slot           # cada janela de entrega
  janela      sáb 18h–20h
  capacidade  10
  versao      7   # p/ "tentar e conferir"

tabela reserva
  status      hold → confirmada | cancelada
  expira_em   19:12  # hold vale 10 min
  chave_unica ab12-...  # anti-clique-duplo
```

### Contratos de API

```
POST   /reservas            # cria o hold
POST   /reservas/:id/confirmar
DELETE /reservas/:id        # desiste
GET    /slots?data=2026-08-01

# regra: confirmar 2× com a mesma
# chave_unica NUNCA cobra 2×
```

### Idempotência (em bom português)
Cliente clicou 2× no "pagar" porque o 4G travou? Cobra UMA vez. Toda tentativa leva um código único; repetiu, o servidor reconhece e ignora a segunda.

### O robô da expiração
A cada minuto, um processo varre os holds vencidos e devolve as vagas para a janela. Sem ele, vaga "presa" nunca volta.

### Rollback: o botão de desfazer
Lança atrás de uma feature flag: agendamento ligado para só 10% dos clientes. Deu problema? Desliga em 1 clique — sem novo deploy.

> **Repare: o TDD não colou uma linha de código — só decisões e contratos. Qualquer dev (ou IA) consegue implementar a partir daqui.**

---

## 13 · A ordem completa — e quando quebrá-la

```
PRD → RFC(s) → TDD → Spec → Tasks
```

| Etapa | Entrega |
|---|---|
| PRD | o problema e o porquê |
| RFC(s) | a direção escolhida |
| TDD | o blueprint detalhado |
| Spec | requisitos rastreáveis |
| Tasks | tarefas atômicas |

### Três exceções que os profissionais usam

**1. Mudança 100% técnica** — Migrar de MySQL para PostgreSQL não tem "produto" envolvido — pode nem existir PRD. O caminho começa direto no RFC.

**2. RFC que já é o design** — Em muitas empresas (Google, Squarespace) RFC e design doc são a MESMA coisa. Se o RFC já detalhou a arquitetura, não escreva TDD separado: 2 documentos = 2 verdades.

**3. Mudança pequena e reversível** — Porta de mão dupla? Pula tudo: spec + tasks direto. No máximo um ADR de 1 página registrando a decisão.

### ADR = Architecture Decision Record
Registro de 1 página, imutável: contexto → decisão → consequências. A diferença de papel: o **RFC PROPÕE** (ainda vai se discutir) · o **ADR REGISTRA** (já se decidiu, fica para a posteridade).

> **A ordem é um mapa, não uma lei. O critério para pular etapa é sempre o mesmo: quanto custa errar essa decisão?**

---

## 14 · Quando usar o quê — a matriz

| Situação | O que fazer |
|---|---|
| Pequena · reversível · 1 pessoa · tecnologia que o time já domina<br>*ex.: novo filtro na listagem de pedidos* | Spec + Tasks direto (ou ADR de 1 página) |
| Média · 1 time · algum risco<br>*ex.: tela de reagendamento com regras de prazo* | TDD leve (~8 seções) |
| Decisão em aberto que afeta vários times<br>*ex.: overbooking — toca API, app, cozinha e financeiro* | RFC obrigatório → depois TDD |
| Pagamento · dado pessoal · irreversível ou regulado<br>*ex.: guardar cartão para cobrar reagendamento* | PRD + RFC + TDD completos e revisados |

### Sinais de que precisa de doc formal
- vários times afetados
- custo de reversão alto
- dinheiro ou dado de usuário no meio
- tecnologia nova para o time
- 1 mês ou mais de trabalho

> Quanto mais sinais acumular, mais formalidade a decisão merece.

> **O erro clássico acontece dos dois lados: documentar DEMAIS o trivial e DE MENOS o irreversível. A matriz existe para calibrar.**

---

## 15 · Seis jeitos de estragar um documento

**#1 · RFC de mentirinha** — a decisão JÁ FOI tomada e o RFC é teatro: "Opção 2: não usar Kubernetes (obviamente errada)" — opções de palha para coroar a favorita.

**#2 · Contexto sem números** — "nosso processo tem alguns problemas" não convence ninguém de nada. Meça a dor: minutos, incidentes, reais.

**#3 · Sem "não fazer nada"** — toda comparação honesta inclui o custo de ficar como está. Se essa opção sumiu, desconfie do autor.

**#4 · PRD que virou spec** — o documento de produto escolhendo banco de dados e biblioteca — rouba a decisão de quem vai construir.

**#5 · As 40 páginas** — documento que ninguém lê não protege ninguém — só dá sensação de trabalho. O tamanho certo é o que se lê inteiro.

**#6 · O documento fóssil** — o código mudou, o doc ficou. Doc que mente é PIOR que doc nenhum: alguém vai confiar nele — e quebrar tudo.

> **Um documento só cumpre o papel se puder mudar a decisão de alguém. Se não pode, é cerimônia — corte sem culpa.**

---

## 16 · Gerando cada documento com IA

As skills fazem a entrevista, validam as partes e escrevem o rascunho. Você decide.

**1 · PRD — à mão mesmo** — O pacote da Tech Leads Club NÃO tem skill de PRD. Escreva 1 página você mesmo (frame 05 é o modelo) e salve em `docs/prd/`.

**2 · RFC — skill `create-rfc`** — Te entrevista (impacto? urgência? opções?), exige critérios com peso e a opção "não fazer nada", e escreve em português. Um RFC por decisão → `docs/rfc/`.

**3 · TDD — skill `technical-design-doc-creator`** — O slug é comprido mesmo — NÃO existe "create-tdd". Auto-dimensiona: projeto pequeno ~8 seções; com pagamento, a seção de Segurança vira obrigatória → `docs/tdd/`.

**4 · Spec + Tasks — `onp-spec-driven`** — Aponta para o TDD pronto e gera spec com requisitos rastreáveis + tarefas atômicas em `.specs/` — dali nasce o código.

### Instalação (1 comando)

```bash
npx @tech-leads-club/agent-skills
# instala em .claude/skills/
# dispara: /create-rfc
# ou frase natural: "escreva um RFC…"
```

### Prompt bom (dita as regras do jogo)

```
"Escreva um RFC para decidir a estratégia
 de concorrência do agendamento: pessimista,
 otimista ou hold no Redis. Inclua a opção
 de não mudar nada e critérios com pesos."
```

> **Repare no prompt: ele já exige opções honestas e critérios com pesos. Quem conhece a anatomia do documento pede — e recebe — coisa melhor.**

---

## 17 · A IA escreve bonito — e às vezes errado

> O perigo não é a IA escrever mal. É ela escrever BEM DEMAIS: texto fluente, confiante e volumoso — que soa impressionante e passa na revisão sem ninguém conferir.

1. **Rascunho, não verdade** — você é o revisor. Nenhum doc gerado vai para o time sem leitura linha a linha.
2. **Pode sem dó** — a seção não muda a decisão de ninguém? Corta. Documento incha rápido com IA.
3. **Exija contras reais** — peça a opção "não fazer nada" e os pontos fracos da favorita — senão vem RFC de conclusão pronta.
4. **Date e versione** — decisão sem data e sem autor confunde todo mundo daqui a 6 meses. Git é a fonte da verdade.
5. **Documento vivo** — mudou o código? Reabra o doc no mesmo PR. Doc fóssil mente para o próximo que ler.
6. **Um link, não uma cópia** — docs se APONTAM (PRD ← RFC ← TDD). Copiar trecho entre docs cria duas versões — uma sempre desatualiza.

> **Menos é mais: PRD de 1 página · RFC de UMA decisão · ADR de 1 página. O documento certo é o menor que faz o time decidir bem.**

---

## 18 · Resumo e dever de casa

### As três perguntas (o resumo da aula inteira)

| Sigla | Pergunta | O que é |
|---|---|---|
| **PRD** | O QUÊ, para quem, por quê? | o documento do problema |
| **RFC** | QUAL caminho? | opções honestas + critérios com peso |
| **TDD** | COMO construir? | decisões e contratos, nunca código |

> O filtro que decide tudo: porta de mão dupla → decide e segue · porta de mão única → RFC.

### Dever de casa — o agendamento do delivery, passo a passo

1. Escreva o PRD de 1 página (copie a estrutura do frame 05) → `docs/prd/`
2. Rode `/create-rfc` para as 3 portas de mão única: RFC-001 overbooking, RFC-002 pagamento×reserva, RFC-003 fuso horário → `docs/rfc/`
3. Com os RFCs decididos, rode a skill de TDD UMA vez → `docs/tdd/`
4. Aponte a `onp-spec-driven` para o TDD → spec + tasks em `.specs/`
5. Tudo no Git: numerado (RFC-001, 002…), com data, autor e links entre os docs.

> **Documento bom é o menor documento que faz o time decidir certo.**

---

## 19 · Do documento à prova mecânica

### Quem confere o combinado depois que o código nasce?

O passo 4 do dever de casa — "aponte a onp-spec-driven para o TDD" — merece zoom. É nele que o combinado sai do papel e vira coisa que a máquina confere.

**Os três documentos param na porta do código** — O PRD combina o quê. O RFC escolhe o caminho. O TDD desenha o como. Mas depois que o código nasce e começa a mudar… quem garante que ele CONTINUA honrando o combinado? Releitura manual não escala — e "parece pronto" é opinião, não prova.

**Lembra do antipadrão #6 — o documento fóssil?** "O código mudou, o doc ficou. Doc que mente é PIOR que doc nenhum". Sem verificação mecânica, todo documento caminha para o fóssil. Não é desleixo do time — é só questão de tempo.

### SPEC-FIRST (a maioria das ferramentas)
spec impecável no dia 1 → gera o código → o código evolui com pressa → a spec fica para trás.

Resultado: documentação que PARECE verdadeira e não é — falsa confiança.

### SPEC-ANCHORED (o antídoto)
um verificador automático confere spec ↔ código o tempo todo, no CI: ou evoluíram juntos, ou o portão fecha (`exit 1`).

É exatamente aqui que o documento fóssil deixa de ser possível.

> **Spec-driven development: o combinado vira arquivo versionado que a máquina confere contra o código — o elo que faltava depois do TDD.**

---

## 20 · O fluxo do onp-spec-driven em 7 fases

```
ESPECIFICAR → PROJETAR → TAREFAS → PLANO → EXECUTAR → AUDITAR → APRENDER
  sempre      se preciso  se grande  2+ tarefas  sempre    o gate   fecha o ciclo
```

### A fase nova: PLANO — execução em paralelo
Com 2+ tarefas, `onp-spec plano` agrupa tarefas de arquivos disjuntos em faixas paralelas — 1 faixa = 1 git worktree + 1 agente rodando em background, com tabela de andamento a cada minuto.

### Onde os seus documentos entram

**PRD → Especificar** — as histórias de usuário e os critérios de aceite nascem dos requisitos e do "NUNCA PODE" do PRD (frame 05).

**RFCs → Projetar** — cada decisão registrada (RFC-001 a 003) entra no `design.md` como premissa — pergunta de mão única JÁ tem resposta.

**TDD → design e constituição** — contratos e modelo de dados alimentam o design; regra inviolável vira princípio `[DEVE]` com verificação executável.

> Auto-dimensionamento: feature pequena pula Projetar, Tarefas e Plano — Especificar e Auditar NUNCA.

> **Você não aprende outro processo: os documentos desta aula são os insumos. O spec-driven é o trilho que os leva até o código — com prova.**

---

## 21 · A spec do agendamento

### O TDD do frame 12 vira spec verificável

`.spec/features/agendamento-entrega/spec.md`

```markdown
# Spec: Agendamento de entrega
> feature: agendamento-entrega
> status: em-implementacao

## Histórias

### US-001 — Cliente escolhe a janela
Como cliente, quero escolher a janela de
entrega, para receber quando estou em casa.

#### AC-001 — Reserva com vaga
- Dado    a janela sáb 18h–20h com 1 vaga
- Quando  o cliente confirma a reserva
- Então   a vaga decrementa e o pedido
          fica "agendado"

#### AC-002 — Janela lotada
- Dado    uma janela sem vagas livres
- Quando  o cliente tenta reservar
- Então   recusa e sugere a próxima janela
```

### De onde veio cada critério
Direto do PRD (frame 05): "NUNCA PODE aceitar mais pedidos que a capacidade" virou o AC-002 — observável, um teste consegue checar.

E o RFC-001 (opção B) decidiu COMO implementar o AC-001 sem overbooking.

### Observável, ou não vale
- ✗ "a confirmação deve ser rápida"
- ✓ "confirma em menos de 3 s" (o PRD já dizia!)
- ✗ "não pode estourar capacidade"
- ✓ "janela sem vaga recusa reserva"

```bash
$ onp-spec new agendamento-entrega
# cria .spec/features/agendamento-entrega/
# códigos de rastreio únicos e contínuos
```

> A pasta `.spec/` mora DENTRO do repositório, do lado do código — não num wiki que ninguém abre.

> **O documento decide; a spec transforma a decisão em critérios que um teste checa. O TDD continua sendo o blueprint — a spec é a parte que a máquina confere.**

---

## 22 · Suposições, perguntas — o gancho dos RFCs

### Suposição (ASM-xxx)
> "preenchi a lacuna com um palpite razoável e SEGUI em frente"

*ex.: assumo que o hold de 10 min do TDD (frame 12) segura o pico de sábado*

### Pergunta em aberto (Q-xxx)
> "PAREI — essa decisão é do dono do produto, não minha"

*ex.: qual fuso horário define a janela de entrega?*

### PERGUNTA EM ABERTO + PORTA DE MÃO ÚNICA = RFC

A Q-001 do fuso é literalmente o RFC-003 do dever de casa. O RFC decide de cabeça fria (critérios com peso, opção "não fazer nada") — e a decisão volta para a spec como resolução. A pergunta fecha com rastro: quem decidiu, quando e por quê.

```markdown
## Perguntas em aberto
| ID    | Pergunta                    | Status     | Resolução           |
| Q-001 | Qual fuso define a janela?  | respondida | RFC-003: sempre UTC |

## Suposições
| ID      | Suposição                     | Status | Resolução |
| ASM-001 | Hold de 10 min segura o pico  | aberta |     —     |
```

> Dono do produto na conversa? Pergunte NA HORA e registre a resposta — não deixe a dúvida envelhecer.

> **REGRA DURA: a feature não vira "implementada" com suposição aberta — o audit acusa `ASM_ABERTA`. A falsa confiança não passa pelo portão.**

---

## 23 · Executar e auditar: pronto vira exit code

O teste nasce antes do código — e o veredito final é da máquina, não do agente.

### O teste do AC-002 — a tag `@spec` é o elo que a máquina lê

```javascript
// test/agendamento.spec.test.js
test('AC-002: janela lotada @spec:AC-002', () => {
  const janela = { id: 'sab-18h', vagas: 0 };
  const r = reservar({ janela, cliente });
  assert.equal(r.ok, false);  // observável!
});
```

### O ciclo da fase Executar
1. `scaffold` — gera um teste que FALHA para cada critério de aceite
2. implemente até o teste passar
3. `verify` — o runner roda e GRAVA a prova por critério em `.spec/verification/`

### O veredito é um exit code, não uma opinião

```
$ onp-spec audit --ci

✗ critério de aceite sem teste (AC_SEM_TESTE)
    AC-001 — reserva com vaga
✗ suposição em aberto (ASM_ABERTA)
    ASM-001 — hold de 10 min no pico
✗ teste órfão (TESTE_ORFAO)
    "AC-009" não existe na spec

exit code: 1   →   NÃO está pronto
```

### O catálogo (os achados mais comuns)

```
critério sem teste         AC_SEM_TESTE
critério sem prova         AC_SEM_PROVA
teste órfão (drift!)       TESTE_ORFAO
concluída sem prova        TASK_CONCLUIDA_SEM_PROVA
princípio violado          PRINCIPIO_VIOLADO
código órfão               ARQUIVO_ORFAO
prova desatualizada        VERIFY_OBSOLETO
```

> **Teste PULADO (skip / todo) não é prova — o verify recusa. E NUNCA enfraqueça ou apague um teste para o portão abrir: conserte o código. Quem decide se passou é o test runner.**

> **O "parece pronto" do vibe coding não sobrevive aqui: pronto é `exit 0` no audit — colado na conversa, não prometido.**

---

## 24 · A corrente completa — do PRD à prova

A rastreabilidade de ponta a ponta: cada elo aponta o próximo — e elo quebrado é achado no audit.

```
PRD ──────→ RFC-001…003 ──────→ TDD ──────→ SPEC
o problema  as decisões de      contratos    US-001 · AC-001 · AC-002
e o porquê  mão única           e modelo
                                de dados         │
                                                 ↓
CÓDIGO ←────── PROVA ←────── TESTE ←────── TAREFA
src/reservas.js  verification/   @spec:AC-001   T-001 · Refs:
— sem órfão      ….json: pass    no título      US-001, AC-001
```

**Elo quebrado vira achado:** critério sem teste (`AC_SEM_TESTE`) · teste órfão (`TESTE_ORFAO`) · código órfão (`ARQUIVO_ORFAO`) · referência fantasma (`REF_QUEBRADA`) · prova velha (`VERIFY_OBSOLETO`)

### Dever de casa — parte 2: feche o ciclo do agendamento

1. `onp-spec init` na pasta do delivery — cria `.spec/` e instala a skill no seu agente
2. `onp-spec new agendamento-entrega` — traduza o TDD em histórias e critérios (Dado/Quando/Então)
3. Registre suposições e perguntas; pergunta de mão única sem resposta? Você já sabe: RFC antes
4. `scaffold` → implemente até o verde → `verify` → `audit --ci`. Só apresente com `exit 0` — a saída é a prova

> **Os documentos fazem o time decidir certo. A spec ancorada garante que o código continua honrando a decisão.**
