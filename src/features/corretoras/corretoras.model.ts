/**
 * A corretora como o backend devolve. Todo campo além do CNPJ vem de fonte
 * pública (Receita, ViaCEP, CVM) — nenhum é editável pelo investidor.
 */
export interface Corretora {
  id: number;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  situacaoCadastral: string | null;
  validadaNaCvm: boolean;
  /** Data da base oficial da CVM usada na verificação — reflete o último dia útil. */
  dataBaseCvm: string | null;
  dataCadastro: string;
  /** Descontinuada não aceita carteira nova; as existentes continuam (COR-005). */
  descontinuada?: boolean;
}

/** Códigos de situação do CNPJ na Receita Federal, que o backend repassa sem traduzir (ASM-097). */
const SITUACAO_DA_RECEITA: Record<string, string> = { '1': 'Nula', '2': 'Ativa', '3': 'Suspensa', '4': 'Inapta', '8': 'Baixada' };

/** O código vira nome; texto por extenso ou código desconhecido fica como veio (AC-389, AC-390). */
export function situacaoLegivel(situacao: string | null): string | null {
  return situacao === null ? null : (SITUACAO_DA_RECEITA[situacao.trim()] ?? situacao);
}

export const CORRETORAS_POR_PAGINA = 20;
/** Página larga: o selo precisa das carteiras todas, não das primeiras (Q-011). */
export const CARTEIRAS_POR_PAGINA = 200;

export function nomeExibido(corretora: Corretora): string {
  return corretora.nomeFantasia?.trim() || corretora.razaoSocial;
}

export function cidadeComUf(corretora: Corretora): string | null {
  if (!corretora.cidade) {
    return corretora.uf ?? null;
  }
  return corretora.uf ? `${corretora.cidade}/${corretora.uf}` : corretora.cidade;
}
