import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gerarCss } from '@/test/tailwind';

const TOKENS = 'src/styles/tokens.css';
const GLOBAL = 'src/styles/global.css';
const folha = readFileSync(TOKENS, 'utf8');
const global = readFileSync(GLOBAL, 'utf8');

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
        ['--cor-barra-mercado-alta', '--cor-barra-mercado-fundo'],
        ['--cor-barra-mercado-baixa', '--cor-barra-mercado-fundo'],
        ['--cor-barra-mercado-estavel', '--cor-barra-mercado-fundo'],
        ['--cor-bloco-texto', '--cor-alta-bloco'],
        ['--cor-bloco-texto', '--cor-baixa-bloco'],
        ['--cor-bloco-texto', '--cor-estavel-bloco'],
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

      expect(contraste(cor(bloco, '--cor-foco'), cor(bloco, '--cor-superficie')), `${tema}: foco`).toBeGreaterThanOrEqual(3);
      expect(contraste(cor(bloco, '--cor-foco'), cor(bloco, '--cor-foco-halo')), `${tema}: foco/halo`).toBeGreaterThanOrEqual(3);
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
      const valor = folha.match(new RegExp(`${degrau}:\\s*(\\d+)px`))?.[1];
      if (!valor) throw new Error(`Degrau ${degrau} não encontrado em tokens.css`);
      return Number(valor);
    });

    expect(Math.min(...tamanhos)).toBeGreaterThanOrEqual(12);
    expect([...tamanhos].sort((a, b) => a - b)).toEqual(tamanhos);

    expect(folha).toMatch(/--peso-normal:|--peso-medio:|--peso-forte:/);
    expect(folha).toMatch(/--fonte-numero:\s*'Roboto Mono'/);

    // No React a escala é também a ÚNICA do Tailwind: os tamanhos padrão foram desligados.
    expect(global).toMatch(/--text-\*:\s*initial/);
    for (const degrau of degraus) {
      expect(global).toContain(`--text-${degrau.slice('--texto-'.length)}: var(${degrau})`);
    }
  });

  it('@spec:AC-283 o produto não passa de duas famílias tipográficas', () => {
    const familias = [...folha.matchAll(/--fonte[a-z-]*:\s*([^;]+);/g)].map(([, valor]) => valor.split(',')[0].trim());

    expect(new Set(familias).size).toBeLessThanOrEqual(2);
    expect(global).toMatch(/--font-\*:\s*initial/);
  });

  it('@spec:AC-289 todo token de acento é da família do amarelo, e nenhum é azul', () => {
    const canais = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

    for (const tema of ['claro', 'escuro'] as const) {
      const bloco = blocoDoTema(tema);

      for (const token of ['--cor-acento', '--cor-acento-forte', '--cor-foco']) {
        const [r, g, b] = canais(cor(bloco, token));

        expect(b, `${tema}: ${token} tem azul demais para ser amarelo`).toBeLessThan(Math.min(r, g) * 0.6);
        expect(Math.abs(r - g) / Math.max(r, g), `${tema}: ${token} não é da família do amarelo`).toBeLessThan(0.25);
      }
    }

    expect(cor(blocoDoTema('escuro'), '--cor-acento')).toBe('#eaef1b');
  });
});

const COR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\boklab\(/;
const COR_ARBITRARIA_TAILWIND = /\b[a-z-]+-\[(?:#|rgba?\(|hsla?\(|oklch\(|oklab\(|color:)/;

// Código de produto: tudo em src/, menos o arquivo de tokens e os próprios testes
// (que precisam escrever cor literal para conferir os valores aprovados).
function codigoDeProduto(): string[] {
  return globSync('src/**/*.{ts,tsx,css}')
    .filter((arquivo) => path.normalize(arquivo) !== path.normalize(TOKENS))
    .filter((arquivo) => !/\.spec\.tsx?$/.test(arquivo))
    .sort();
}


describe('Cor só nos tokens, no React', () => {
  it('@spec:AC-282 @spec:AC-300 só o arquivo de tokens contém cor, e nenhuma classe escreve cor arbitrária', () => {
    const arquivos = codigoDeProduto();
    expect(arquivos.length).toBeGreaterThan(0);

    const infracoes = arquivos.flatMap((arquivo) => {
      const conteudo = readFileSync(arquivo, 'utf8');
      return [COR_LITERAL, COR_ARBITRARIA_TAILWIND]
        .filter((padrao) => padrao.test(conteudo))
        .map((padrao) => `${arquivo}: ${conteudo.match(padrao)?.[0]}`);
    });

    expect(infracoes, infracoes.join('\n')).toEqual([]);
    expect(folha).toMatch(COR_LITERAL);
  });

  it('@spec:AC-300 a paleta padrão do Tailwind está desligada: bg-red-500 não gera cor nenhuma', async () => {
    expect(global).toMatch(/--color-\*:\s*initial/);

    const css = await gerarCss(['bg-red-500', 'text-blue-600', 'bg-superficie', 'text-texto-fraco', 'bg-primary']);

    expect(css).not.toContain('.bg-red-500');
    expect(css).not.toContain('.text-blue-600');
    expect(css).toMatch(/\.bg-superficie\s*{[^}]*var\(--cor-superficie\)/);
    expect(css).toMatch(/\.text-texto-fraco\s*{[^}]*var\(--cor-texto-fraco\)/);
    expect(css).toMatch(/\.bg-primary\s*{[^}]*var\(--primary\)/);
  });

  it('@spec:AC-300 os nomes que o código copiado do shadcn usa geram CSS, ligados aos tokens', async () => {
    const css = await gerarCss(['rounded-md', 'rounded-lg', 'shadow-xs', 'shadow-sm', 'text-xs', 'text-sm']);

    // @theme inline: a classe sai direto no token, sem passar pelo apelido.
    expect(css).toMatch(/\.rounded-md\s*{[^}]*border-radius:\s*var\(--raio\)/);
    expect(css).toMatch(/\.rounded-lg\s*{[^}]*border-radius:\s*var\(--raio-grande\)/);
    expect(css).toMatch(/\.shadow-xs\s*{[^}]*var\(--sombra-baixa\)/);
    expect(css).toMatch(/\.shadow-sm\s*{[^}]*var\(--sombra-cartao\)/);
    expect(css).toMatch(/\.text-xs\s*{[^}]*font-size:\s*var\(--texto-rotulo\)/);
    expect(css).toMatch(/\.text-sm\s*{[^}]*font-size:\s*var\(--texto-base\)/);
  });
});

describe('Dois temas, mesmas cores', () => {
  const nomes = (bloco: string) => new Set([...bloco.matchAll(/(--cor-[a-z0-9-]+):/g)].map(([, nome]) => nome));

  it('@spec:AC-301 todo token de cor do tema claro existe no escuro e vice-versa', () => {
    const claro = nomes(blocoDoTema('claro'));
    const escuro = nomes(blocoDoTema('escuro'));

    expect(claro.size).toBeGreaterThan(50);
    expect([...claro].filter((nome) => !escuro.has(nome)), 'faltam no escuro').toEqual([]);
    expect([...escuro].filter((nome) => !claro.has(nome)), 'faltam no claro').toEqual([]);
  });

  it('@spec:AC-301 cada token de cor vira utilitário do Tailwind ligado ao token', () => {
    for (const nome of nomes(blocoDoTema('claro'))) {
      const curto = nome.slice('--cor-'.length);
      expect(global, nome).toContain(`--color-${curto}: var(${nome});`);
    }
  });
});

describe('Kit shadcn legível nos dois temas', () => {
  // Variável do kit → token de cor, lido do global.css (a fonte da verdade do mapeamento).
  function tokenDoKit(variavel: string): string {
    const raiz = global.slice(global.indexOf('\n:root {'));
    const alvo = raiz.match(new RegExp(`\\n\\s*${variavel}:\\s*var\\((--cor-[a-z0-9-]+)\\)`))?.[1];
    if (!alvo) throw new Error(`${variavel} não aponta para um token --cor-*`);
    return alvo;
  }

  it('@spec:AC-304 os pares de texto e fundo do kit têm contraste de pelo menos 4,5:1 nos dois temas', () => {
    const pares = [
      ['--foreground', '--background'],
      ['--card-foreground', '--card'],
      ['--popover-foreground', '--popover'],
      ['--primary-foreground', '--primary'],
      ['--secondary-foreground', '--secondary'],
      ['--muted-foreground', '--muted'],
      ['--muted-foreground', '--background'],
      ['--muted-foreground', '--card'],
      ['--accent-foreground', '--accent'],
      ['--destructive-foreground', '--destructive'],
    ];

    for (const tema of ['claro', 'escuro'] as const) {
      const bloco = blocoDoTema(tema);
      for (const [texto, fundo] of pares) {
        const valor = contraste(cor(bloco, tokenDoKit(texto)), cor(bloco, tokenDoKit(fundo)));
        expect(valor, `${tema}: ${texto}/${fundo} = ${valor.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
