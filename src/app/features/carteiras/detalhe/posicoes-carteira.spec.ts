import { readFileSync } from 'node:fs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Posicao } from '../carteiras.model';
import { PosicoesCarteira } from './posicoes-carteira';

const PETR4: Posicao = {
  id: 1,
  ticker: 'PETR4',
  nomeEmpresa: 'Petróleo Brasileiro S.A.',
  quantidade: 100,
  precoMedio: 10,
  cotacaoAtual: 12.5,
  dataHoraCotacao: '',
  rentabilidadeNaoRealizada: 250,
};

function minutosAtras(minutos: number): string {
  return new Date(Date.now() - minutos * 60_000).toISOString();
}

describe('Posições da carteira', () => {
  let fixture: ComponentFixture<PosicoesCarteira>;
  let elemento: HTMLElement;

  async function montar(posicoes: Posicao[], porTicker: Record<string, number> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(PosicoesCarteira);
    fixture.componentRef.setInput('posicoes', posicoes);
    fixture.componentRef.setInput('lucroPorTicker', porTicker);
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  it('@spec:AC-106 cada posição traz ticker, empresa, quantidade, preço médio e cotação com horário', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }]);

    const linha = elemento.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    expect(linha.textContent).toContain('PETR4');
    expect(linha.textContent).toContain('Petróleo Brasileiro S.A.');
    expect(linha.querySelector('[data-quantidade]')?.textContent).toContain('100');
    expect(linha.querySelector('[data-preco-medio]')?.textContent).toContain('10,00');

    const cotacao = linha.querySelector('[data-cotacao] [data-valor-com-horario]') as HTMLElement;
    expect(cotacao.querySelector('[data-numero]')?.textContent).toContain('12,50');
    expect(cotacao.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-107 a rentabilidade não realizada aparece em valor e em percentual', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }]);

    const linha = elemento.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    expect(linha.querySelector('[data-rentabilidade-valor]')?.textContent).toContain('250,00');
    expect(linha.querySelector('[data-rentabilidade-percentual]')?.textContent).toContain('25,00%');
    expect(linha.querySelector('[data-rentabilidade-valor] [data-sinal]')?.textContent).toBe('▲');
  });

  it('@spec:AC-107 custo zero não inventa percentual', async () => {
    await montar([{ ...PETR4, precoMedio: 0, dataHoraCotacao: minutosAtras(2) }]);

    const linha = elemento.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    expect(linha.querySelector('[data-rentabilidade-percentual]')).toBeNull();
  });

  it('@spec:AC-108 só a cotação com mais de 15 minutos aparece marcada', async () => {
    await montar([
      { ...PETR4, dataHoraCotacao: minutosAtras(2) },
      { ...PETR4, id: 2, ticker: 'VALE3', dataHoraCotacao: minutosAtras(40) },
    ]);

    const recente = elemento.querySelector('[data-posicao="PETR4"] [data-valor-com-horario]');
    const velha = elemento.querySelector('[data-posicao="VALE3"] [data-valor-com-horario]');

    expect(recente?.getAttribute('data-defasado')).toBe('false');
    expect(recente?.querySelector('[data-marcacao-defasado]')).toBeNull();
    expect(velha?.getAttribute('data-defasado')).toBe('true');
    expect(velha?.querySelector('[data-marcacao-defasado]')?.textContent?.trim()).toBeTruthy();
  });

  it('@spec:AC-109 a seção "Encerradas" lista os tickers com resultado realizado e sem posição aberta', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }], {
      PETR4: 120.5,
      VALE3: -40,
      MGLU3: 12.34,
    });

    const encerradas = elemento.querySelector('[data-encerradas]') as HTMLElement;
    const tickers = Array.from(encerradas.querySelectorAll('[data-encerrada]')).map((l) =>
      l.getAttribute('data-encerrada'),
    );
    expect(tickers).toEqual(['VALE3', 'MGLU3']);
  });

  it('@spec:AC-110 sem ativo encerrado a seção não aparece', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }], { PETR4: 120.5 });

    expect(elemento.querySelector('[data-encerradas]')).toBeNull();
    expect(elemento.textContent).not.toMatch(/encerrada/i);
  });

  it('@spec:AC-111 a encerrada mostra ticker e resultado, e nada de posição', async () => {
    await montar([], { VALE3: -40 });

    const linha = elemento.querySelector('[data-encerrada="VALE3"]') as HTMLElement;
    expect(linha.textContent).toContain('VALE3');
    expect(linha.querySelector('[data-resultado-realizado]')?.textContent).toContain('40,00');
    expect(linha.querySelector('[data-quantidade]')).toBeNull();
    expect(linha.querySelector('[data-preco-medio]')).toBeNull();
    expect(linha.querySelector('[data-cotacao]')).toBeNull();
  });

  it('@spec:AC-244 as colunas numéricas ficam à direita, em fonte de largura fixa e com dígitos de mesma largura', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }]);

    const linha = elemento.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    for (const seletor of [
      '[data-quantidade]',
      '[data-preco-medio]',
      '[data-cotacao]',
      '[data-rentabilidade-valor]',
      '[data-rentabilidade-percentual]',
    ]) {
      const celula = linha.querySelector(seletor) as HTMLElement;
      expect(celula.tagName).toBe('TD');
      expect(celula.hasAttribute('data-numero')).toBe(true);
    }

    const estilo = readFileSync(
      'src/app/features/carteiras/detalhe/posicoes-carteira.scss',
      'utf8',
    );
    const regra = estilo.match(/\[data-numero\][\s\S]*?\}/)?.[0] ?? '';
    expect(regra).toMatch(/text-align:\s*right/);
    expect(regra).toMatch(/font-family:\s*var\(--fonte-numero\)/);
    expect(regra).toMatch(/font-variant-numeric:\s*[^;]*tabular-nums/);
  });

  it('@spec:AC-246 o resultado de uma encerrada vira selo com texto e símbolo, nunca só cor', async () => {
    await montar([], { VALE3: -40, MGLU3: 12.34 });

    const perda = elemento.querySelector(
      '[data-encerrada="VALE3"] [data-resultado-realizado] [data-selo]',
    ) as HTMLElement;
    expect(perda).toBeTruthy();
    expect(perda.textContent).toContain('40,00');
    expect(perda.getAttribute('data-variante')).toBe('baixa');
    expect(perda.querySelector('svg[data-icone]')).toBeTruthy();

    const ganho = elemento.querySelector(
      '[data-encerrada="MGLU3"] [data-resultado-realizado] [data-selo]',
    ) as HTMLElement;
    expect(ganho.getAttribute('data-variante')).toBe('alta');
  });

  it('@spec:AC-247 cada linha de ativo traz o monograma junto do ticker', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }], { VALE3: -40 });

    const aberta = elemento.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    const monogramaAberta = aberta.querySelector('app-monograma [data-monograma]') as HTMLElement;
    expect(monogramaAberta).toBeTruthy();
    expect(monogramaAberta.getAttribute('aria-label')).toContain('PETR4');
    expect(aberta.querySelector('.identificacao strong')?.textContent).toContain('PETR4');

    const encerrada = elemento.querySelector('[data-encerrada="VALE3"]') as HTMLElement;
    expect(
      encerrada.querySelector('app-monograma [data-monograma]')?.getAttribute('aria-label'),
    ).toContain('VALE3');
  });

  it('@spec:AC-250 sem posições a tabela dá lugar a um estado vazio com próximo passo', async () => {
    await montar([]);

    expect(elemento.querySelector('table.tabela')).toBeNull();
    const vazio = elemento.querySelector('[data-sem-posicao]') as HTMLElement;
    expect(vazio).toBeTruthy();
    expect(vazio.textContent?.trim()).toBeTruthy();
    const passo = vazio.querySelector('[data-proximo-passo]') as HTMLAnchorElement;
    expect(passo).toBeTruthy();
    expect(passo.getAttribute('href')).toContain('/operacoes');
  });

  it('@spec:AC-250 enquanto carrega a tabela mostra o esqueleto com a silhueta das linhas', async () => {
    await montar([]);
    fixture.componentRef.setInput('carregando', true);
    await fixture.whenStable();

    expect(elemento.querySelector('[data-sem-posicao]')).toBeNull();
    const esqueleto = elemento.querySelector(
      '[data-carregando-posicoes] [data-esqueleto]',
    ) as HTMLElement;
    expect(esqueleto).toBeTruthy();
    expect(esqueleto.getAttribute('data-formato')).toBe('tabela');
    expect(esqueleto.querySelectorAll('[data-linha]').length).toBeGreaterThan(1);
    expect(esqueleto.getAttribute('aria-hidden')).toBe('true');
  });
});
