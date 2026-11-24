<!-- onp-spec:documentation-contract=v1 -->

# Spec: Migracao react

> feature: migracao-react
> status: em-implementacao

## Contexto

O investidor continua com o mesmo produto, com as mesmas telas, regras e mensagens, agora escrito em React. A aparência fica mais bonita com as bibliotecas que o cliente escolheu ([PRD](prd.md)). Os 298 critérios de aceite existentes continuam valendo e passam a ser provados pela suíte React com a mesma tag. Esta spec cobre só o que a migração acrescenta.

## Histórias

### US-083 — O investidor usa o mesmo produto, agora em React

Como investidor, quero que tudo continue funcionando do mesmo jeito depois da troca de tecnologia, para não reaprender nada nem perder nenhuma regra.

#### AC-299 — Cada endereço abre a mesma tela de antes, e sem sessão o investidor vai para o login

- **Dado** a aplicação React
- **Quando** o investidor abre `/painel`, `/corretoras`, `/carteiras`, `/acoes`, `/operacoes` ou `/desempenho`
- **Então** com sessão válida a tela daquela área aparece dentro da casca, e sem sessão ele vai para `/entrar` sem ver a tela
- **E** `/` leva ao painel e um endereço desconhecido leva para `/entrar`

#### AC-305 — Depois do corte, o produto não depende mais de Angular

- **Dado** o projeto depois do corte final
- **Quando** se lê o `package.json` da raiz
- **Então** não há nenhum pacote `@angular/*`, `@lucide/angular`, `@tanstack/angular-table` nem `ngx-oneforall`
- **E** o comando de teste do projeto roda a suíte React

### US-084 — A aparência melhora sem quebrar as regras visuais já aprovadas

Como investidor, quero telas mais bonitas e vivas, sem perder legibilidade, os dois temas e o respeito a "reduzir movimento".

#### AC-300 — Nenhuma tela escreve cor solta (P-003 no React)

- **Dado** o código React do produto
- **Quando** se procura cor literal (hex, `rgb()`, `hsl()`, `oklch()`) ou classe de cor arbitrária do Tailwind (como `bg-[#0b1017]`)
- **Então** só o arquivo de tokens contém cor
- **E** a paleta padrão do Tailwind está desligada, então `bg-red-500` não gera cor nenhuma

#### AC-301 — Os temas claro e escuro têm as mesmas cores definidas

- **Dado** os tokens de cor do React
- **Quando** se comparam o tema claro e o escuro
- **Então** todo token de cor do tema claro existe no escuro e vice-versa

#### AC-302 — O movimento novo para quando o sistema pede para reduzir movimento

- **Dado** o sistema com "reduzir movimento" ligado
- **Quando** a barra de cotações, os números do consolidado e a moldura de acesso aparecem
- **Então** nada se anima: a barra vira rolagem manual, os números já aparecem no valor final e o fundo da moldura fica parado

#### AC-303 — Botões, campos, tabelas, confirmações e avisos têm o mesmo visual em todas as telas

- **Dado** o código das telas
- **Quando** se procura botão, campo de texto, tabela, diálogo de confirmação ou aviso flutuante
- **Então** todos vêm do kit compartilhado (`components/ui`, baseado em shadcn/ui), e nenhuma tela monta `<button>`, `<input>` ou `<table>` cru

#### AC-304 — O texto continua legível nos dois temas, inclusive nas cores do kit

- **Dado** os pares de texto e fundo do kit (texto/fundo, primário, secundário, atenuado, cartão, destrutivo)
- **Quando** se calcula o contraste nos temas claro e escuro
- **Então** todos os pares têm contraste de pelo menos 4,5:1

### US-085 — Os bugs achados no Angular saem corrigidos no React

Como investidor, quero que os defeitos encontrados na auditoria do Angular não sejam levados para a versão nova.

Decisão do cliente em 2026-11-23: "quero que corriga os bugs que achou em angular para react".

#### AC-306 — Venda recusada por falta de ações mostra a quantidade real

- **Dado** uma venda recusada pelo servidor com o código OPE-004
- **Quando** a recusa chega ao formulário de operação
- **Então** a mensagem diz quantas unidades o investidor tem, lidas de novo da carteira, e nunca mostra o marcador `{quantidade}` cru

#### AC-307 — Excluir o último item da última página não esvazia a lista

- **Dado** uma lista paginada (extrato de operações ou carteiras) aberta na última página, com um único item
- **Quando** o investidor exclui esse item
- **Então** a tela volta para a página anterior e mostra os itens que restam, sem o estado de "nenhum item"

#### AC-308 — As listas de escolha oferecem todo o catálogo do investidor típico

- **Dado** mais de 20 ações, carteiras ou corretoras cadastradas
- **Quando** o investidor abre o formulário de operação ou a criação de carteira
- **Então** as listas de escolha oferecem até 200 itens, a mesma página larga já aprovada para o desempenho (ASM-046)

#### AC-309 — Trocar de carteira rápido nunca mostra dados da carteira anterior

- **Dado** o painel, o desempenho ou o formulário de operação com uma carteira escolhida
- **Quando** o investidor troca de carteira antes de a leitura anterior terminar
- **Então** a resposta atrasada da carteira anterior é descartada e a tela mostra só os dados da carteira escolhida

#### AC-310 — Cadastrar o CNPJ buscado já abre o cadastro preenchido

- **Dado** uma busca por CNPJ sem resultado no catálogo de corretoras
- **Quando** o investidor escolhe "Cadastrar este CNPJ"
- **Então** o cadastro abre com esse CNPJ já no campo

## Fora de escopo

- Mudar regra, mensagem, rota, fluxo ou contrato com o backend, exceto as correções da US-085.
- Aceitar CNPJ com letras: depende de o backend aceitar primeiro.
- Funcionalidade nova, como celebração, série histórica ou "vs mês anterior" (ADR-010).
- Bibliotecas pagas da lista.
- Trocar a navegação no topo por barra lateral.
- Renderização no servidor: o produto continua um SPA.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-073 | O AC-024 cita "o servidor de desenvolvimento do Angular" porque era a stack da época. O comportamento exigido (a API na mesma origem, encaminhada a `localhost:8080`) passa a ser provado pelo proxy do Vite, sem reescrever a spec da fundação | aberta | — |
| ASM-074 | Os testes que hoje leem SCSS para provar estrutura de CSS (rolagem contida, botão-ícone, esqueleto, barra de cotações, tokens) provam o mesmo critério lendo as classes Tailwind e o CSS de tokens do React. A asserção muda de forma, não de exigência | aberta | — |
| ASM-075 | "As bibliotecas que te passei" significa as gratuitas da lista. Cada componente é conferido de novo na instalação (registro shadcn e código copiado), e o que não servir fica registrado na pesquisa | aberta | — |
| ASM-076 | Deixar "mais bonito" não inclui mudar o layout da casca (topo para barra lateral) nem acrescentar animação de celebração | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-040 | No corte final, a linha de verificação do P-003 (`src/app/**/*.scss`) deixa de alcançar o código. Aprovar a proposta de constituição v1.3.0, que estende a verificação ao React (arquivos `.tsx`, `.ts`, `.css`, exceto tokens)? | respondida | "Aprovo a v1.3.0 (Recomendado)" — Lucas, AskUserQuestion no Claude Code, 2026-11-23. Gravada em [constituicao.md](../../constituicao.md); a v1.2.0 fica em `constituicao-v1.2.0.md` |

## Documentos relacionados

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)
