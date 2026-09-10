import { readFileSync } from 'node:fs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarraDeMercado } from '../painel.model';
import { BarraMercado } from './barra-mercado';

const ESTILO = readFileSync('src/app/features/painel/blocos/barra-mercado.scss', 'utf8');

describe('Barra de mercado', () => {
  let fixture: ComponentFixture<BarraMercado>;

  async function montar(barra: BarraDeMercado | null) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(BarraMercado);
    fixture.componentRef.setInput('barra', barra);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const cheia: BarraDeMercado = {
    itens: [
      { simbolo: 'PETR4', nome: 'Petrobras', preco: 38.4, variacaoPercentual: 1.25, logoUrl: null },
      { simbolo: 'VALE3', nome: 'Vale', preco: 61.9, variacaoPercentual: -0.8, logoUrl: null },
    ],
    atualizadoEm: '2026-09-08T13:05:00',
    avisos: [],
  };

  it('@spec:AC-050 cada item traz símbolo, preço e variação, e a barra traz o horário do dado', async () => {
    const elemento = await montar(cheia);

    const petr = elemento.querySelector('[data-item="PETR4"]') as HTMLElement;
    expect(petr.querySelector('[data-simbolo]')?.textContent).toContain('PETR4');
    expect(petr.querySelector('[data-preco]')?.textContent).toContain('38,40');
    expect(petr.textContent).toContain('1,25%');

    expect(elemento.querySelector('[data-item="VALE3"]')?.textContent).toContain('0,80%');
    expect(elemento.querySelector('[data-atualizado-em]')?.textContent).toContain('13:05');
  });

  it('@spec:AC-050 item que a fonte não devolveu simplesmente não aparece', async () => {
    const elemento = await montar({ ...cheia, itens: [cheia.itens[0]] });

    expect(elemento.querySelectorAll('[data-item]')).toHaveLength(1);
    expect(elemento.querySelector('[data-item="VALE3"]')).toBeNull();
  });

  it('@spec:AC-052 o que faltou vira aviso, e nada na barra é apresentado como erro', async () => {
    const elemento = await montar({
      ...cheia,
      avisos: ['Não foi possível obter a cotação do dólar.'],
    });

    const aviso = elemento.querySelector('[data-aviso-mercado] [data-nivel]');
    expect(aviso?.getAttribute('data-nivel')).toBe('aviso');
    expect(aviso?.textContent).toContain('Não foi possível obter a cotação do dólar.');
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
    expect(elemento.querySelector('[role="alert"]')).toBeNull();
  });

  it('@spec:AC-051 sem barra nenhuma o bloco não renderiza nada e não quebra', async () => {
    const elemento = await montar(null);

    expect(elemento.querySelector('[data-barra-mercado]')).toBeNull();
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
  });

  it('@spec:AC-233 os chips deslizam para a esquerda em loop, com a lista duplicada e animação só de transform', async () => {
    const elemento = await montar(cheia);

    const clone = elemento.querySelector('[data-grupo-clone]') as HTMLElement;
    expect(elemento.querySelectorAll('[data-grupo-clone]')).toHaveLength(1);
    expect(clone.getAttribute('aria-hidden')).toBe('true');
    expect(clone.textContent).toContain('PETR4');
    expect(clone.textContent).toContain('VALE3');

    // a cópia é decorativa: não repete os marcadores de item
    expect(elemento.querySelectorAll('[data-item]')).toHaveLength(2);

    const keyframes = ESTILO.match(/@keyframes\s+rolar-barra-mercado\s*{[\s\S]*?\n}/)?.[0] ?? '';
    expect(keyframes).toMatch(/transform:\s*translateX\(-50%\)/);
    expect(keyframes).not.toMatch(/(?:width|height|left|right|top|bottom|margin|padding):/);

    const trecho = ESTILO.replace(/\s+/g, ' ');
    expect(trecho).toMatch(/\.marquee\s*{[^}]*animation:[^;]*linear[^;]*infinite/);
  });

  it('@spec:AC-234 a rolagem pausa quando o ponteiro entra na barra ou um chip recebe foco', () => {
    const trecho = ESTILO.replace(/\s+/g, ' ');

    expect(trecho).toMatch(
      /\.barra-mercado:hover\s+\.marquee[^{]*{[^}]*animation-play-state: paused/,
    );
    expect(trecho).toMatch(
      /:focus-within\s+\.marquee[^{]*{[^}]*animation-play-state: paused/,
    );
  });

  it('@spec:AC-235 movimento reduzido desliga a rolagem e devolve rolagem manual', () => {
    const indice = ESTILO.indexOf('prefers-reduced-motion: reduce');
    expect(indice).toBeGreaterThan(-1);

    const bloco = ESTILO.slice(indice);
    expect(bloco).toMatch(/animation:\s*none/);
    expect(bloco).toMatch(/overflow-x:\s*auto/);
  });

  it('@spec:AC-236 o horário de atualização fica fora da área que rola e legível sempre', async () => {
    const elemento = await montar(cheia);

    const trilha = elemento.querySelector('[data-marquee]') as HTMLElement;
    const horario = elemento.querySelector('[data-atualizado-em]') as HTMLElement;

    expect(trilha).not.toBeNull();
    expect(horario).not.toBeNull();
    expect(trilha.contains(horario)).toBe(false);
    expect(horario.textContent).toContain('13:05');
  });

  it('@spec:AC-237 cada cotação é um chip com símbolo, preço e variação com sinal/seta, em superfície escura própria', async () => {
    const elemento = await montar(cheia);

    for (const simbolo of ['PETR4', 'VALE3']) {
      const chip = elemento.querySelector(`[data-item="${simbolo}"]`) as HTMLElement;
      expect(chip).not.toBeNull();
      expect(chip.querySelector('[data-simbolo]')?.textContent).toContain(simbolo);
      expect(chip.querySelector('[data-preco]')?.textContent?.trim().length).toBeGreaterThan(0);

      const sinal = chip.querySelector('[data-variacao] [data-sinal]')?.textContent?.trim() ?? '';
      expect(['▲', '▼', '–']).toContain(sinal);
    }

    const trecho = ESTILO.replace(/\s+/g, ' ');
    // superfície escura própria, a mesma nos dois temas (tokens --cor-barra-mercado-*)
    expect(trecho).toMatch(/\.barra-mercado\s*{[^}]*background:[^;]*--cor-barra-mercado-fundo/);
    expect(trecho).toMatch(/\.chip\s*{[^}]*background:[^;]*--cor-barra-mercado/);
  });

  it('@spec:AC-274 a faixa é fina, atravessa o painel inteiro e mantém o horário visível', async () => {
    const elemento = await montar(cheia);

    // o horário da última atualização continua visível
    expect(elemento.querySelector('[data-atualizado-em]')?.textContent).toContain('13:05');

    const trecho = ESTILO.replace(/\s+/g, ' ');

    // sem teto próprio: o comprimento é o do painel, e não o que a faixa decidir
    expect(trecho).not.toMatch(/\.barra-mercado\s*{[^}]*max-width:/);
    expect(trecho).not.toMatch(/\.barra-mercado\s*{[^}]*margin-inline:\s*auto/);

    // a espessura vem de token, e sem padding vertical somando altura
    expect(trecho).toMatch(/\.barra-mercado\s*{[^}]*min-height:\s*var\(--altura-cotacoes\)/);
    expect(trecho).toMatch(/\.barra-mercado\s*{[^}]*padding:\s*0\s+var\(--espaco-4\)/);

    // e é mais fina que o alvo de toque — ou seja, mais fina que qualquer cartão
    const escalas = readFileSync('src/styles/_tema.scss', 'utf8');
    const altura = Number(escalas.match(/--altura-cotacoes:\s*(\d+)px/)?.[1]);
    const alvo = Number(escalas.match(/--alvo-toque:\s*(\d+)px/)?.[1]);
    expect(altura).toBeGreaterThan(0);
    expect(altura).toBeLessThan(alvo);

    // o chip perde a moldura e o preenchimento vertical: quem define a
    // espessura da faixa é o token, não a soma do que cada chip acrescenta
    expect(trecho).not.toMatch(/\.chip\s*{[^}]*border:/);
    expect(trecho).toMatch(/\.chip\s*{[^}]*padding:\s*0\s+var\(--espaco-2\)/);
  });

  it('@spec:AC-275 a faixa nunca força largura maior que a tela, e o movimento respeita prefers-reduced-motion', () => {
    const trecho = ESTILO.replace(/\s+/g, ' ');

    // fluida: ocupa a largura que o painel der
    expect(trecho).toMatch(/\.barra-mercado\s*{[^}]*width:\s*100%/);
    // nunca impõe largura mínima maior que a tela estreita
    expect(trecho).not.toMatch(/\.barra-mercado\s*{[^}]*min-width:/);
    // e não estoura a horizontal
    expect(trecho).toMatch(/\.barra-mercado\s*{[^}]*overflow:\s*hidden/);

    // prefers-reduced-motion continua parando a rolagem
    const indice = ESTILO.indexOf('prefers-reduced-motion: reduce');
    expect(indice).toBeGreaterThan(-1);
    expect(ESTILO.slice(indice)).toMatch(/animation:\s*none/);
  });
});
