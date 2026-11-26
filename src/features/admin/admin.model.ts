import { Papel } from '@/core/sessao/sessao.model';

/** Excluídos nunca chegam do servidor; o front só conhece estas duas. */
export type Situacao = 'ATIVO' | 'BLOQUEADO';

/** Linha de `GET /admin/usuarios`. O ADMIN vem com `nome` nulo. */
export interface UsuarioAdmin {
  id: number;
  email: string;
  nome: string | null;
  papel: Papel;
  situacao: Situacao;
  motivoBloqueio: string | null;
  carteirasAtivas: number;
  temPosicaoAberta: boolean;
}

/** `GET /admin/usuarios/totais` devolve sempre as duas chaves (ASM-087). */
export type TotaisPorSituacao = Record<Situacao, number>;

export const USUARIOS_POR_PAGINA = 20;

export const ROTULO_DO_PAPEL: Record<Papel, string> = { INVESTIDOR: 'Investidor', ADMIN: 'Administrador' };
export const ROTULO_DA_SITUACAO: Record<Situacao, string> = { ATIVO: 'Ativo', BLOQUEADO: 'Bloqueado' };
