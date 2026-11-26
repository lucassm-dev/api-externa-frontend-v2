/** As áreas do produto na barra superior. Em tela estreita, atrás do botão de menu. */
export interface AreaDoProduto {
  rota: string;
  rotulo: string;
  /** O ADMIN recebe 403 nestas áreas: elas nem aparecem para ele. */
  somenteInvestidor?: boolean;
  /** Painel administrativo: o investidor nem vê (AC-350). */
  somenteAdmin?: boolean;
}

export const AREAS_DO_PRODUTO: AreaDoProduto[] = [
  { rota: '/admin/usuarios', somenteAdmin: true, rotulo: 'Usuários' },
  { rota: '/admin/uso', somenteAdmin: true, rotulo: 'Uso' },
  { rota: '/painel', somenteInvestidor: true, rotulo: 'Painel' },
  { rota: '/corretoras', rotulo: 'Corretoras' },
  { rota: '/carteiras', somenteInvestidor: true, rotulo: 'Carteiras' },
  { rota: '/acoes', rotulo: 'Ações' },
  { rota: '/operacoes', somenteInvestidor: true, rotulo: 'Operações' },
  { rota: '/desempenho', somenteInvestidor: true, rotulo: 'Desempenho' },
];
