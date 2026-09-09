/** As áreas do produto na barra superior. Desktop apenas, sem menu compacto. */
export interface AreaDoProduto {
  rota: string;
  rotulo: string;
}

export const AREAS_DO_PRODUTO: AreaDoProduto[] = [
  { rota: '/painel', rotulo: 'Painel' },
  { rota: '/corretoras', rotulo: 'Corretoras' },
  { rota: '/carteiras', rotulo: 'Carteiras' },
  { rota: '/acoes', rotulo: 'Ações' },
  { rota: '/operacoes', rotulo: 'Operações' },
  { rota: '/desempenho', rotulo: 'Desempenho' },
];
