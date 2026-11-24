export type PassoDoInvestidor = 'cadastrar-corretora' | 'criar-carteira' | 'registrar-compra';

export interface ProximoPasso {
  id: PassoDoInvestidor;
  titulo: string;
  explicacao: string;
  acao: string;
  rota: string;
}

/**
 * `null` em qualquer campo é estado desconhecido — a leitura falhou. Sem saber,
 * o painel não inventa passo nenhum (ASM-016).
 */
export interface EstadoDoInvestidor {
  catalogoTemCorretora: boolean | null;
  temCarteira: boolean | null;
  temOperacao: boolean | null;
}

const PASSOS: Record<PassoDoInvestidor, ProximoPasso> = {
  'cadastrar-corretora': {
    id: 'cadastrar-corretora',
    titulo: 'Comece cadastrando a corretora onde você investe',
    explicacao: 'A corretora é o catálogo que a carteira usa. Sem nenhuma cadastrada, não há como criar carteira.',
    acao: 'Cadastrar corretora',
    rota: '/corretoras',
  },
  'criar-carteira': {
    id: 'criar-carteira',
    titulo: 'Crie sua primeira carteira',
    explicacao: 'A carteira é onde as compras e vendas são registradas e o resultado é consolidado.',
    acao: 'Criar carteira',
    rota: '/carteiras',
  },
  'registrar-compra': {
    id: 'registrar-compra',
    titulo: 'Registre sua primeira compra',
    explicacao: 'Com a primeira operação registrada, o painel passa a mostrar o consolidado da carteira.',
    acao: 'Registrar compra',
    rota: '/operacoes',
  },
};

/**
 * Um passo por vez, na ordem que o domínio obriga (ADR-003). A primeira
 * pergunta é do CATÁLOGO de corretoras, que é compartilhado (ADR-002): não
 * existe corretora "do investidor".
 */
export function decidirProximoPasso(estado: EstadoDoInvestidor): ProximoPasso | null {
  const { catalogoTemCorretora, temCarteira, temOperacao } = estado;

  if (catalogoTemCorretora === null || temCarteira === null || temOperacao === null) {
    return null;
  }
  if (!catalogoTemCorretora) {
    return PASSOS['cadastrar-corretora'];
  }
  if (!temCarteira) {
    return PASSOS['criar-carteira'];
  }
  if (!temOperacao) {
    return PASSOS['registrar-compra'];
  }
  return null;
}
