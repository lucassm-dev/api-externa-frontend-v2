# ADR-003: Ordem obrigatória de cadastro — corretora, carteira, ação, operação

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: fluxo, onboarding, frontend

## Contexto e problema

Duas regras do backend criam uma dependência em cadeia entre os cadastros:

1. Criar carteira exige informar uma corretora existente
2. Cadastrar ação exige que o investidor já tenha ao menos uma carteira ativa (erro `ACA-004`)

A segunda é contraintuitiva — ninguém espera que cadastrar um ativo dependa de ter carteira. Um investidor novo que tentar cadastrar ação como primeiro passo recebe uma recusa que não consegue explicar sozinho.

## Fatores de decisão

- A regra existe no backend e o frontend não pode contorná-la
- Erro de pré-requisito descoberto depois de preencher um formulário é a pior forma de comunicá-lo
- O primeiro uso é o momento de maior abandono do produto

## Opções consideradas

- Conduzir o investidor pela ordem, bloqueando antecipadamente o que ainda não é possível
- Deixar todas as telas abertas e tratar `ACA-004` como um erro qualquer
- Criar um assistente de primeiro uso em várias etapas, obrigatório

## Decisão

**Conduzir pela ordem, bloqueando antes do formulário.** O painel inicial mostra sempre **um** próximo passo, calculado pelo estado do investidor: sem corretora → cadastre corretora; com corretora e sem carteira → crie carteira; com carteira e sem operação → registre a primeira compra.

A entrada do cadastro de ação fica indisponível para quem não tem carteira, com a explicação e o atalho para criá-la. O erro `ACA-004` continua tratado, mas como rede de segurança, não como o caminho normal de descoberta.

O assistente obrigatório em etapas foi recusado: a persona é de investidor experiente, que tolera densidade e detesta ser conduzido à força. Um próximo passo sugerido no painel dá a mesma condução sem prender.

### Consequências positivas

- O investidor novo nunca esbarra num pré-requisito depois de preencher formulário
- O painel vazio vira um caminho, não uma tela morta
- A ordem do produto fica explícita para quem for construir as telas

### Consequências negativas

- O frontend precisa conhecer o estado do investidor (tem corretora? tem carteira? tem operação?) para decidir o que habilitar
- Menus com itens desabilitados podem frustrar quem quer explorar
- Se a regra `ACA-004` mudar no backend, a condução precisa mudar junto

## Prós e contras

### Condução com bloqueio antecipado ✅ Escolhida

- ✅ Evita erro tardio no formulário
- ✅ Resolve o estado vazio do primeiro acesso
- ❌ Acopla a interface ao estado do investidor

### Só tratar o erro quando acontecer

- ✅ Frontend mais simples
- ❌ Investidor descobre o pré-requisito depois de digitar

### Assistente obrigatório

- ✅ Ninguém se perde
- ❌ Contraria a persona

## Links

- PRD-003 v1 — Painel inicial · PRD-006 v1 — Catálogo de ações
- `docs/erros.md` (ACA-004), spec-05-carteira-obrigatoria
