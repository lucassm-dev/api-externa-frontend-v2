import { globSync, readFileSync } from 'node:fs';

const folha = readFileSync('src/styles/_tokens.scss', 'utf8');
const escalas = readFileSync('src/styles/_tema.scss', 'utf8');

function blocoDoTema(tema: 'claro' | 'escuro'): string {
  const inicio = tema === 'claro' ? folha.indexOf(":root[data-tema='claro']") : folha.indexOf(":root[data-tema='escuro']");
  const abertura = folha.indexOf('{', inicio);
  let profundidade = 0;

  for (let indice = abertura; indice < folha.length; indice++) {
    if (folha[indice] === '{') profundidade++;
    if (folha[indice] === '}') profundidade--;
    if (profundidade === 0) return folha.slice(abertura + 1, indice);
  }

  throw new Error(`Bloco do tema ${tema} não encontrado`);
}

function cor(bloco: string, token: string): string {
  const valor = bloco.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!valor) throw new Error(`Token ${token} não encontrado`);
  return valor;
}

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((inicio) => Number.parseInt(hex.slice(inicio, inicio + 2), 16) / 255);
  const lineares = canais.map((canal) => (canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lineares[0] + 0.7152 * lineares[1] + 0.0722 * lineares[2];
}

function contraste(primeira: string, segunda: string): number {
  const [clara, escura] = [luminancia(primeira), luminancia(segunda)].sort((a, b) => b - a);
  return (clara + 0.05) / (escura + 0.05);
}

describe('Tokens da fundação visual', () => {
  it('@spec:AC-226 os novos pares de texto e fundo passam em contraste AA nos dois temas', () => {
    for (const tema of ['claro', 'escuro'] as const) {
      const bloco = blocoDoTema(tema);
      const pares = [
        ['--cor-sucesso-texto', '--cor-sucesso-fundo'],
        ['--cor-barra-mercado-texto', '--cor-barra-mercado-fundo'],
        ['--cor-barra-mercado-fraco', '--cor-barra-mercado-fundo'],
        ['--cor-destaque-texto', '--cor-destaque'],
      ];

      for (const [texto, fundo] of pares) {
        expect(contraste(cor(bloco, texto), cor(bloco, fundo)), `${tema}: ${texto}/${fundo}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('@spec:AC-227 a barra de mercado tem tokens próprios e superfície escura nos dois temas', () => {
    for (const tema of ['claro', 'escuro'] as const) {
      const bloco = blocoDoTema(tema);
      expect(cor(bloco, '--cor-barra-mercado-fundo')).not.toBe(cor(bloco, '--cor-superficie'));
      expect(luminancia(cor(bloco, '--cor-barra-mercado-fundo'))).toBeLessThan(0.08);
    }
  });

  it('@spec:AC-232 o destaque usa o amarelo aprovado como preenchimento com texto escuro', () => {
    for (const tema of ['claro', 'escuro'] as const) {
      const bloco = blocoDoTema(tema);
      expect(cor(bloco, '--cor-destaque')).toBe('#eaef1b');
      expect(luminancia(cor(bloco, '--cor-destaque-texto'))).toBeLessThan(0.02);
      expect(contraste(cor(bloco, '--cor-destaque-texto'), cor(bloco, '--cor-destaque'))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('@spec:AC-282 o acento de marca entra com contraste aprovado nos dois temas', () => {
    for (const tema of ['claro', 'escuro'] as const) {
      const bloco = blocoDoTema(tema);
      const pares = [
        ['--cor-acento-contraste', '--cor-acento'],
        ['--cor-destaque-texto', '--cor-destaque'],
        ['--cor-destaque-texto', '--cor-destaque-forte'],
        ['--cor-perigo-contraste', '--cor-perigo'],
        ['--cor-texto', '--cor-superficie'],
        ['--cor-texto-fraco', '--cor-superficie'],
        ['--cor-texto', '--cor-fundo'],
      ];

      for (const [texto, fundo] of pares) {
        expect(contraste(cor(bloco, texto), cor(bloco, fundo)), `${tema}: ${texto}/${fundo}`).toBeGreaterThanOrEqual(4.5);
      }

      // O anel de foco não é texto: 3:1 contra a superfície onde ele aparece basta,
      // e o halo é o que o mantém visível também sobre preenchimento saturado.
      expect(contraste(cor(bloco, '--cor-foco'), cor(bloco, '--cor-superficie')), `${tema}: foco`).toBeGreaterThanOrEqual(3);
      expect(contraste(cor(bloco, '--cor-foco'), cor(bloco, '--cor-foco-halo')), `${tema}: foco/halo`).toBeGreaterThanOrEqual(3);
    }
  });

  it('@spec:AC-282 nenhuma cor literal vive fora dos tokens', () => {
    const estilosDeTela = globSync('src/app/**/*.scss');
    expect(estilosDeTela.length).toBeGreaterThan(0);

    for (const arquivo of estilosDeTela) {
      const conteudo = readFileSync(arquivo, 'utf8');
      expect(conteudo, arquivo).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
    }
  });

  it('@spec:AC-283 a escala de tipos é declarada em degraus nomeados', () => {
    const degraus = [
      '--texto-rotulo',
      '--texto-apoio',
      '--texto-base',
      '--texto-medio',
      '--texto-grande',
      '--texto-titulo',
      '--texto-display',
    ];

    const tamanhos = degraus.map((degrau) => {
      const valor = escalas.match(new RegExp(`${degrau}:\\s*(\\d+)px`))?.[1];
      if (!valor) throw new Error(`Degrau ${degrau} não encontrado em _tema.scss`);
      return Number(valor);
    });

    // Escala estritamente crescente, e nenhum degrau abaixo do piso de leitura.
    expect(Math.min(...tamanhos)).toBeGreaterThanOrEqual(12);
    expect([...tamanhos].sort((a, b) => a - b)).toEqual(tamanhos);

    expect(escalas).toMatch(/--peso-normal:|--peso-medio:|--peso-forte:/);
    expect(escalas).toMatch(/--fonte-numero:\s*'Roboto Mono'/);
  });

  it('@spec:AC-283 o produto não passa de duas famílias tipográficas', () => {
    const familias = [...escalas.matchAll(/--fonte[a-z-]*:\s*([^;]+);/g)].map(([, valor]) =>
      valor.split(',')[0].trim(),
    );

    expect(new Set(familias).size).toBeLessThanOrEqual(2);
  });
});
