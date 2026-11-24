export interface SetorDaRosca {
  indice: number;
  participacaoNormalizada: number;
  caminho: string;
}

const CENTRO = 60;
const RAIO_EXTERNO = 52;
const RAIO_INTERNO = 32;
const ANGULO_INICIAL = -90;
const VOLTA_COMPLETA = 360;
const PRECISAO = 1_000_000;

interface Ponto {
  x: number;
  y: number;
}

function arredondar(valor: number): number {
  const arredondado = Math.round(valor * PRECISAO) / PRECISAO;
  return Object.is(arredondado, -0) ? 0 : arredondado;
}

function pontoNoCirculo(raio: number, angulo: number): Ponto {
  const radianos = (angulo * Math.PI) / 180;
  return {
    x: arredondar(CENTRO + raio * Math.cos(radianos)),
    y: arredondar(CENTRO + raio * Math.sin(radianos)),
  };
}

function caminhoDaVoltaCompleta(): string {
  const topoExterno = pontoNoCirculo(RAIO_EXTERNO, ANGULO_INICIAL);
  const baseExterna = pontoNoCirculo(RAIO_EXTERNO, ANGULO_INICIAL + 180);
  const topoInterno = pontoNoCirculo(RAIO_INTERNO, ANGULO_INICIAL);
  const baseInterna = pontoNoCirculo(RAIO_INTERNO, ANGULO_INICIAL + 180);

  return [
    `M ${topoExterno.x} ${topoExterno.y}`,
    `A ${RAIO_EXTERNO} ${RAIO_EXTERNO} 0 1 1 ${baseExterna.x} ${baseExterna.y}`,
    `A ${RAIO_EXTERNO} ${RAIO_EXTERNO} 0 1 1 ${topoExterno.x} ${topoExterno.y}`,
    `L ${topoInterno.x} ${topoInterno.y}`,
    `A ${RAIO_INTERNO} ${RAIO_INTERNO} 0 1 0 ${baseInterna.x} ${baseInterna.y}`,
    `A ${RAIO_INTERNO} ${RAIO_INTERNO} 0 1 0 ${topoInterno.x} ${topoInterno.y}`,
    'Z',
  ].join(' ');
}

function caminhoDoSetor(inicio: number, fim: number): string {
  const angulo = fim - inicio;
  if (angulo >= VOLTA_COMPLETA) {
    return caminhoDaVoltaCompleta();
  }

  const inicioExterno = pontoNoCirculo(RAIO_EXTERNO, inicio);
  const fimExterno = pontoNoCirculo(RAIO_EXTERNO, fim);
  const fimInterno = pontoNoCirculo(RAIO_INTERNO, fim);
  const inicioInterno = pontoNoCirculo(RAIO_INTERNO, inicio);
  const arcoGrande = angulo > 180 ? 1 : 0;

  return [
    `M ${inicioExterno.x} ${inicioExterno.y}`,
    `A ${RAIO_EXTERNO} ${RAIO_EXTERNO} 0 ${arcoGrande} 1 ${fimExterno.x} ${fimExterno.y}`,
    `L ${fimInterno.x} ${fimInterno.y}`,
    `A ${RAIO_INTERNO} ${RAIO_INTERNO} 0 ${arcoGrande} 0 ${inicioInterno.x} ${inicioInterno.y}`,
    'Z',
  ].join(' ');
}

/**
 * Converte participações positivas em setores de uma rosca com viewBox 0 0 120 120.
 * A geometria é normalizada pela soma recebida: uma divergência do consolidado
 * continua sendo comunicada pela tela, mas nunca gera uma volta incompleta ou
 * sobreposta. Valores inválidos e não positivos não viram desenho.
 */
export function setoresDaRosca(participacoes: readonly number[]): SetorDaRosca[] {
  const validas = participacoes
    .map((participacao, indice) => ({ indice, participacao }))
    .filter(({ participacao }) => Number.isFinite(participacao) && participacao > 0);
  const total = validas.reduce((soma, { participacao }) => soma + participacao, 0);

  if (total <= 0) {
    return [];
  }

  let cursor = ANGULO_INICIAL;
  return validas.map(({ indice, participacao }, posicao) => {
    const participacaoNormalizada = (participacao / total) * 100;
    const fim =
      posicao === validas.length - 1
        ? ANGULO_INICIAL + VOLTA_COMPLETA
        : cursor + (participacaoNormalizada / 100) * VOLTA_COMPLETA;
    const setor = {
      indice,
      participacaoNormalizada,
      caminho: caminhoDoSetor(cursor, fim),
    };
    cursor = fim;
    return setor;
  });
}
