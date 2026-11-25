import { NivelFeedback } from '../feedback/feedback.model';

/**
 * O que a tela faz depois do erro. Sai da coluna "Comportamento da tela" da
 * tabela do PRD-009 — e é escolhido pelo código do erro, nunca pelo texto.
 */
export type ComportamentoTela =
  | 'permanecer-no-formulario'
  | 'destacar-campos'
  | 'voltar-a-lista'
  | 'voltar-ao-painel'
  | 'cancelar-exclusao'
  | 'recarregar'
  | 'oferecer-existente'
  | 'ir-ao-login'
  | 'manter-ultimo-valor';

export interface EntradaCatalogo {
  /** Texto escrito para o investidor. `{chave}` é preenchida pelo contexto da tela. */
  mensagem: string;
  comportamento: ComportamentoTela;
  nivel?: NivelFeedback;
  /** Campo do formulário a destacar, quando o erro aponta um. */
  campoDestacado?: string;
  /** Acrescenta o motivo que o servidor informou (só COR-003 precisa). */
  incluiMotivoDoServidor?: boolean;
  encerraSessao?: boolean;
}

export const MENSAGEM_GENERICA = 'Algo deu errado do nosso lado. Tente novamente.';
export const MENSAGEM_SEM_RESPOSTA = 'Não foi possível conectar ao sistema. Verifique sua conexão.';

/** A tabela do PRD-009 inteira. Código que não está aqui degrada para o genérico. */
export const CATALOGO_ERROS: Record<string, EntradaCatalogo> = {
  'COR-001': { mensagem: 'Corretora não encontrada.', comportamento: 'voltar-a-lista' },
  'COR-002': { mensagem: 'Esta corretora já está cadastrada.', comportamento: 'oferecer-existente' },
  'COR-003': {
    mensagem: 'Não foi possível cadastrar esta corretora.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'cnpj',
    incluiMotivoDoServidor: true,
  },
  'COR-004': {
    mensagem: 'Esta corretora tem carteiras vinculadas e não pode ser removida.',
    comportamento: 'cancelar-exclusao',
  },
  'COR-005': {
    mensagem: 'Esta corretora foi descontinuada e não aceita carteiras novas.',
    comportamento: 'permanecer-no-formulario',
  },
  'COR-006': { mensagem: 'Esta corretora já está descontinuada.', comportamento: 'recarregar' },

  'ACA-001': { mensagem: 'Ação não encontrada.', comportamento: 'voltar-a-lista' },

  'CAR-001': { mensagem: 'Carteira não encontrada.', comportamento: 'voltar-a-lista' },
  'CAR-002': {
    mensagem: 'Esta carteira ainda tem posições abertas. Venda ou zere as posições antes de excluí-la.',
    comportamento: 'cancelar-exclusao',
  },

  'OPE-001': { mensagem: 'Operação não encontrada.', comportamento: 'recarregar' },
  'OPE-003': {
    mensagem: 'Você não tem posição nesta ação para vender.',
    comportamento: 'permanecer-no-formulario',
  },
  'OPE-004': {
    mensagem: 'Você tem apenas {quantidade} unidades desta ação.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'quantidade',
  },
  'OPE-005': {
    mensagem: 'O preço pode ter no máximo 2 casas decimais.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'precoUnitario',
  },
  'OPE-006': {
    mensagem: 'A data final não pode ser anterior à data inicial.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'dataFim',
  },

  'AUT-001': {
    mensagem: 'Este e-mail já está em uso.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'email',
  },
  'AUT-002': {
    mensagem: 'Este CPF já está em uso.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'cpf',
  },
  'AUT-003': { mensagem: 'Investidor não encontrado.', comportamento: 'voltar-ao-painel' },
  'AUT-004': {
    mensagem: 'E-mail ou senha incorretos.',
    comportamento: 'permanecer-no-formulario',
  },
  'AUT-005': {
    mensagem: 'Sua sessão não é mais válida. Entre novamente.',
    comportamento: 'ir-ao-login',
    encerraSessao: true,
  },
  'AUT-006': {
    mensagem: 'Sua sessão expirou. Entre novamente.',
    comportamento: 'ir-ao-login',
    encerraSessao: true,
  },
  'AUT-007': { mensagem: 'Você não tem permissão para acessar isto.', comportamento: 'voltar-ao-painel' },
  'AUT-008': {
    mensagem: 'A senha precisa ter ao menos 8 caracteres, com letra e número.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'senha',
  },
  'AUT-009': {
    mensagem: 'Esta conta está bloqueada. Fale com o administrador do sistema.',
    comportamento: 'permanecer-no-formulario',
  },
  'AUT-010': {
    mensagem: 'Sua conta foi bloqueada. Fale com o administrador do sistema.',
    comportamento: 'ir-ao-login',
    encerraSessao: true,
  },
  'AUT-011': { mensagem: 'Você não pode bloquear a sua própria conta.', comportamento: 'permanecer-no-formulario' },
  'AUT-012': { mensagem: 'Usuário não encontrado.', comportamento: 'voltar-a-lista' },
  'AUT-013': {
    mensagem: 'Código inválido ou expirado. Peça um código novo.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'codigo',
  },
  'AUT-014': {
    mensagem: 'A senha atual está incorreta.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'senhaAtual',
  },
  'AUT-015': {
    mensagem: 'Você pediu códigos demais. Aguarde alguns minutos e tente de novo.',
    comportamento: 'permanecer-no-formulario',
  },
  'AUT-016': {
    mensagem: 'A foto pode ter no máximo 2 MB.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'arquivo',
  },
  'AUT-017': {
    mensagem: 'Envie a foto em JPEG, PNG ou WebP.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'arquivo',
  },
  'AUT-018': {
    mensagem: 'A data final não pode ser anterior à data inicial.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'dataFim',
  },

  'EXT-007': {
    mensagem: 'Não conseguimos verificar esta corretora agora. Tente novamente em instantes.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'cnpj',
  },
  'EXT-008': {
    mensagem: 'Não encontramos este ticker no mercado selecionado. Confira o código e o mercado.',
    comportamento: 'permanecer-no-formulario',
    campoDestacado: 'ticker',
  },
  // EXT-009/010/011 chegam como aviso quando existe valor em cache — a operação
  // aconteceu (ADR-006). A tela só os eleva a erro quando nunca houve dado algum.
  'EXT-009': {
    mensagem: 'O limite de consultas da fonte foi atingido. O preço exibido é de {horario}.',
    comportamento: 'manter-ultimo-valor',
    nivel: 'aviso',
  },
  'EXT-010': {
    mensagem: 'A fonte de cotação está indisponível. O preço exibido é de {horario}.',
    comportamento: 'manter-ultimo-valor',
    nivel: 'aviso',
  },
  'EXT-011': {
    mensagem: 'A cotação do dólar está indisponível. O valor usa a taxa de {horario}.',
    comportamento: 'manter-ultimo-valor',
    nivel: 'aviso',
  },

  'EXT-012': {
    mensagem: 'Não conseguimos enviar o e-mail agora. Tente novamente em instantes.',
    comportamento: 'permanecer-no-formulario',
  },

  'VAL-002': {
    mensagem: 'Algum filtro tem um valor inválido. Confira e tente de novo.',
    comportamento: 'permanecer-no-formulario',
  },
  // VAL-001 nunca tem texto próprio: a mensagem vai para cada campo.
  'VAL-001': { mensagem: '', comportamento: 'destacar-campos' },
  'SYS-001': { mensagem: MENSAGEM_GENERICA, comportamento: 'permanecer-no-formulario' },
};
