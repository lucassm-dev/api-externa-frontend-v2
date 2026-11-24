export interface RetanguloDoMapa {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export interface BlocoDoMapa {
  indice: number;
  peso: number;
  retangulo: RetanguloDoMapa;
}

const PRECISAO = 1_000_000;

/** ViewBox 0 0 100 100: a área toda é a carteira. */
const AREA_TOTAL: RetanguloDoMapa = { x: 0, y: 0, largura: 100, altura: 100 };

interface ItemPesado {
  indice: number;
  peso: number;
}

function arredondar(valor: number): number {
  const arredondado = Math.round(valor * PRECISAO) / PRECISAO;
  return Object.is(arredondado, -0) ? 0 : arredondado;
}

function folha(item: ItemPesado, area: RetanguloDoMapa): BlocoDoMapa {
  return {
    indice: item.indice,
    peso: item.peso,
    retangulo: {
      x: arredondar(area.x),
      y: arredondar(area.y),
      largura: arredondar(area.largura),
      altura: arredondar(area.altura),
    },
  };
}

/**
 * Corta a lista em dois grupos cujo peso fica o mais perto possível da metade,
 * sempre deixando os dois lados não vazios. É o "por faixas" da ASM-068: a
 * divisão não é por contagem de ativos, é por peso.
 */
function corteNaMetade(itens: ItemPesado[], total: number): number {
  let acumulado = 0;
  for (let i = 1; i < itens.length; i += 1) {
    acumulado += itens[i - 1].peso;
    if (acumulado >= total / 2) {
      return i;
    }
  }
  return itens.length - 1;
}

function dividir(itens: ItemPesado[], area: RetanguloDoMapa): BlocoDoMapa[] {
  if (itens.length === 1) {
    return [folha(itens[0], area)];
  }

  const total = itens.reduce((soma, item) => soma + item.peso, 0);
  const corte = corteNaMetade(itens, total);
  const primeiros = itens.slice(0, corte);
  const resto = itens.slice(corte);
  const fracao = primeiros.reduce((soma, item) => soma + item.peso, 0) / total;

  // Corta pelo lado mais longo do retângulo: mantém os blocos menos alongados.
  if (area.largura >= area.altura) {
    const larguraPrimeiros = area.largura * fracao;
    return [
      ...dividir(primeiros, { ...area, largura: larguraPrimeiros }),
      ...dividir(resto, {
        x: area.x + larguraPrimeiros,
        y: area.y,
        largura: area.largura - larguraPrimeiros,
        altura: area.altura,
      }),
    ];
  }

  const alturaPrimeiros = area.altura * fracao;
  return [
    ...dividir(primeiros, { ...area, altura: alturaPrimeiros }),
    ...dividir(resto, {
      x: area.x,
      y: area.y + alturaPrimeiros,
      largura: area.largura,
      altura: area.altura - alturaPrimeiros,
    }),
  ];
}

/**
 * Converte pesos (o valor de mercado de cada posição) em retângulos que
 * ladrilham a área sem sobra nem sobreposição, por divisão recursiva por
 * faixas de peso. A área de cada bloco é proporcional ao seu peso.
 *
 * Peso não positivo ou não finito não vira bloco — não há retângulo de área
 * zero nem coordenada `NaN` no SVG. O índice original é preservado para o
 * chamador reconhecer a posição.
 */
export function blocosDoMapa(
  pesos: readonly number[],
  area: RetanguloDoMapa = AREA_TOTAL,
): BlocoDoMapa[] {
  const validos: ItemPesado[] = pesos
    .map((peso, indice) => ({ indice, peso }))
    .filter(({ peso }) => Number.isFinite(peso) && peso > 0);

  if (validos.length === 0) {
    return [];
  }

  return dividir(validos, area);
}
