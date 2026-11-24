import { readFileSync } from 'node:fs';
import { render } from '@testing-library/react';
import { classesDe, gerarCss } from '@/test/tailwind';
import { BarraDeMercado } from '../painel.model';
import { BarraMercado } from './barra-mercado';

const MOVIMENTO = readFileSync('src/components/ui/movimento.css', 'utf8');
const TEMA = readFileSync('src/styles/tokens.css', 'utf8');

const cheia: BarraDeMercado = {
  itens: [
    { simbolo: 'PETR4', nome: 'Petrobras', preco: 38.4, variacaoPercentual: 1.25, logoUrl: null },
    { simbolo: 'VALE3', nome: 'Vale', preco: 61.9, variacaoPercentual: -0.8, logoUrl: null },
  ],
  atualizadoEm: '2026-09-08T13:05:00',
  avisos: [],
};

const montar = (barra: BarraDeMercado | null) => render(<BarraMercado barra={barra} />).container;
const cssDe = async (elemento: Element | null) => gerarCss(classesDe(elemento!));

describe('Barra de mercado', () => {
  it('@spec:AC-050 cada item traz símbolo, preço e variação', () => {
    const elemento = montar(cheia);
    const petr = elemento.querySelector('[data-item="PETR4"]')!;

    expect(petr.querySelector('[data-simbolo]')?.textContent).toContain('PETR4');
    expect(petr.querySelector('[data-preco]')?.textContent).toContain('38,40');
    expect(petr.textContent).toContain('1,25%');
    expect(elemento.querySelector('[data-item="VALE3"]')?.textContent).toContain('0,80%');
  });

  it('@spec:AC-050 item que a fonte não devolveu simplesmente não aparece', () => {
    const elemento = montar({ ...cheia, itens: [cheia.itens[0]] });

    expect(elemento.querySelectorAll('[data-item]')).toHaveLength(1);
    expect(elemento.querySelector('[data-item="VALE3"]')).toBeNull();
  });

  it('@spec:AC-052 o que faltou vira aviso, e nada na barra é apresentado como erro', () => {
    const elemento = montar({ ...cheia, avisos: ['Não foi possível obter a cotação do dólar.'] });
    const aviso = elemento.querySelector('[data-aviso-mercado] [data-nivel]');

    expect(aviso?.getAttribute('data-nivel')).toBe('aviso');
    expect(aviso?.textContent).toContain('Não foi possível obter a cotação do dólar.');
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
    expect(elemento.querySelector('[role="alert"]')).toBeNull();
  });

  it('@spec:AC-051 sem barra nenhuma o bloco não renderiza nada e não quebra', () => {
    const elemento = montar(null);

    expect(elemento.querySelector('[data-barra-mercado]')).toBeNull();
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
  });

  it('@spec:AC-051 barra que chega sem itens nem avisos não quebra a tela', () => {
    const elemento = montar({ atualizadoEm: cheia.atualizadoEm } as BarraDeMercado);

    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
    expect(elemento.querySelectorAll('[data-aviso-mercado]')).toHaveLength(0);
  });

  it('@spec:AC-233 os chips deslizam para a esquerda em loop, com a lista repetida e animação só de transform', async () => {
    const elemento = montar(cheia);
    const clones = [...elemento.querySelectorAll('[data-grupo-clone]')];

    // Cópias decorativas cobrem a tela larga, sem começo nem fim visíveis.
    expect(clones.length).toBeGreaterThanOrEqual(1);
    for (const clone of clones) {
      expect(clone.getAttribute('aria-hidden')).toBe('true');
      expect(clone.textContent).toContain('PETR4');
      expect(clone.textContent).toContain('VALE3');
    }
    // a cópia é decorativa: não repete os marcadores de item
    expect(elemento.querySelectorAll('[data-item]')).toHaveLength(2);

    const keyframes = MOVIMENTO.match(/@keyframes\s+marquee\s*{[\s\S]*?\n}/)?.[0] ?? '';
    expect(keyframes).toMatch(/transform:\s*translateX\(/);
    expect(keyframes).not.toMatch(/(?:width|height|left|right|top|bottom|margin|padding):/);

    const grupo = await cssDe(elemento.querySelector('[data-marquee] > ul'));
    expect(grupo).toMatch(/animation:\s*marquee[^;]*linear[^;]*infinite/);
  });

  it('@spec:AC-234 a rolagem pausa quando o ponteiro entra na barra ou um chip recebe foco', async () => {
    const grupo = await cssDe(montar(cheia).querySelector('[data-marquee] > ul'));

    expect(grupo).toMatch(/:hover[\s\S]*?animation-play-state:\s*paused/);
    expect(grupo).toMatch(/:focus-within[\s\S]*?animation-play-state:\s*paused/);
  });

  it('@spec:AC-235 @spec:AC-302 movimento reduzido desliga a rolagem e devolve rolagem manual (barra)', async () => {
    const elemento = montar(cheia);
    const grupo = await cssDe(elemento.querySelector('[data-marquee] > ul'));
    const pista = await cssDe(elemento.querySelector('[data-marquee]'));
    const clone = await cssDe(elemento.querySelector('[data-grupo-clone]'));

    const reduzido = (css: string) => css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduzido(grupo)).toMatch(/animation:\s*none/);
    expect(reduzido(pista)).toMatch(/overflow-x:\s*auto/);
    expect(reduzido(clone)).toMatch(/display:\s*none/);
  });

  it('@spec:AC-236 a faixa não tem moldura nem horário fixo: só os chips rolando', async () => {
    const elemento = montar(cheia);

    expect(elemento.querySelector('[data-marquee]')).not.toBeNull();
    expect(elemento.querySelector('[data-atualizado-em]')).toBeNull();
    expect(elemento.querySelector('[data-barra-mercado]')?.textContent).not.toContain('13:05');
    const barra = await cssDe(elemento.querySelector('[data-barra-mercado]'));
    expect(barra).not.toMatch(/border(-radius|-width|-style)?:/);
  });

  it('@spec:AC-237 cada cotação é um chip com símbolo, preço e variação com sinal/seta, em superfície escura própria', async () => {
    const elemento = montar(cheia);

    for (const simbolo of ['PETR4', 'VALE3']) {
      const chip = elemento.querySelector(`[data-item="${simbolo}"]`)!;
      expect(chip.querySelector('[data-simbolo]')?.textContent).toContain(simbolo);
      expect(chip.querySelector('[data-preco]')?.textContent?.trim().length).toBeGreaterThan(0);
      expect(['▲', '▼', '–']).toContain(chip.querySelector('[data-variacao] [data-sinal]')?.textContent?.trim() ?? '');
    }

    expect(await cssDe(elemento.querySelector('[data-barra-mercado]'))).toMatch(/background-color:\s*var\(--cor-barra-mercado-fundo\)/);
    expect(await cssDe(elemento.querySelector('[data-item]'))).toMatch(/--cor-barra-mercado/);
  });

  it('@spec:AC-274 a faixa vai de ponta a ponta', async () => {
    const elemento = montar(cheia);
    const barra = await cssDe(elemento.querySelector('[data-barra-mercado]'));

    expect(barra).toMatch(/max-width:\s*100%/);
    expect(barra).toMatch(/width:\s*100%/);
    expect(barra).not.toMatch(/margin-inline:\s*auto/);
    expect(barra).toMatch(/min-height:\s*var\(--altura-cotacoes\)/);
    expect(barra).toMatch(/padding:\s*calc\(var\(--spacing\) \* 0\)|padding:\s*0/);

    const altura = Number(TEMA.match(/--altura-cotacoes:\s*(\d+)px/)?.[1]);
    const alvo = Number(TEMA.match(/--alvo-toque:\s*(\d+)px/)?.[1]);
    expect(altura).toBeGreaterThan(0);
    expect(altura).toBeLessThan(alvo);

    const chip = classesDe(elemento.querySelector('[data-item]')!);
    expect(chip.some((classe) => /^border(-|$)/.test(classe))).toBe(false);
    expect(chip).toContain('px-2');
    expect(chip.some((classe) => /^p[ty]-/.test(classe))).toBe(false);
  });

  it('@spec:AC-290 cada elo entre o conteúdo que rola e a janela tem piso zero', async () => {
    const elemento = montar(cheia);
    const painel = readFileSync('src/features/painel/painel.tsx', 'utf8');
    const global = readFileSync('src/styles/global.css', 'utf8').replace(/\s+/g, ' ');

    expect(global).toMatch(/\*,\s*\*::before,\s*\*::after\s*{[^}]*box-sizing:\s*border-box/);
    expect(painel).toMatch(/grid-cols-\[minmax\(0,1fr\)\]/);
    expect(await cssDe(elemento.querySelector('[data-barra-mercado]'))).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);

    const pista = await cssDe(elemento.querySelector('[data-marquee]'));
    expect(pista).toMatch(/min-width:\s*calc\(var\(--spacing\) \* 0\)|min-width:\s*0/);
    expect(pista).toMatch(/overflow:\s*hidden/);
  });

  it('@spec:AC-275 a faixa nunca força largura maior que a tela, e o movimento respeita prefers-reduced-motion', async () => {
    const barra = await cssDe(montar(cheia).querySelector('[data-barra-mercado]'));

    expect(barra).toMatch(/width:\s*100%/);
    expect(barra).not.toMatch(/(^|[^-])min-width:/);
    expect(barra).toMatch(/overflow:\s*hidden/);
    expect(MOVIMENTO.slice(MOVIMENTO.indexOf('prefers-reduced-motion: reduce'))).toMatch(/\.animate-marquee[\s\S]*?animation:\s*none/);
  });
});
