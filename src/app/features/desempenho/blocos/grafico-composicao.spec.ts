import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Composicao } from '../composicao';
import { GraficoComposicao } from './grafico-composicao';

function composicao(parcial: Partial<Composicao> = {}): Composicao {
  return {
    fatias: [
      {
        ticker: 'PETR4',
        nomeEmpresa: 'Petrobras',
        valor: 3000,
        participacao: 75,
        moedaOriginal: 'BRL',
        convertido: true,
      },
      {
        ticker: 'AAPL',
        nomeEmpresa: 'Apple',
        valor: 1000,
        participacao: 25,
        moedaOriginal: 'USD',
        convertido: true,
      },
    ],
    soma: 4000,
    valorDeMercado: 4000,
    diferenca: 0,
    fecha: true,
    ...parcial,
  };
}

describe('Gráfico de composição da carteira', () => {
  let fixture: ComponentFixture<GraficoComposicao>;

  async function montar(dados: Composicao) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(GraficoComposicao);
    fixture.componentRef.setInput('composicao', dados);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-192 cada fatia traz ticker, participação e valor em real, da maior à menor', async () => {
    const elemento = await montar(composicao());

    const tickers = [...elemento.querySelectorAll('[data-fatia-ticker]')].map((no) =>
      no.textContent?.trim(),
    );
    expect(tickers).toEqual(['PETR4', 'AAPL']);
    expect(
      elemento.querySelector('[data-fatia="PETR4"] [data-fatia-participacao]')?.textContent,
    ).toContain('75,0%');
    expect(elemento.querySelector('[data-fatia="AAPL"] [data-fatia-valor]')?.textContent).toContain(
      '1.000,00',
    );
  });

  it('@spec:AC-192 a fatia é legível sem enxergar o setor: o número está em texto', async () => {
    const elemento = await montar(composicao());

    const setor = elemento.querySelector('[data-setor="PETR4"]');
    expect(setor?.getAttribute('d')).toMatch(/^M .* A .* L .* A .* Z$/);
    expect(setor?.getAttribute('aria-hidden')).toBe('true');
    expect(
      elemento.querySelector('[data-fatia="PETR4"] [data-fatia-participacao]')?.textContent,
    ).toContain('75,0%');
  });

  it('@spec:AC-259 apresenta setores de rosca e o valor de mercado no centro', async () => {
    const elemento = await montar(composicao());

    expect(elemento.querySelectorAll('[data-fatia-setor]')).toHaveLength(2);
    expect(elemento.querySelectorAll('[data-fatia-barra]')).toHaveLength(0);
    expect(elemento.querySelector('[data-rosca-composicao]')?.textContent).toContain('4.000,00');
  });

  it('@spec:AC-260 ticker, valor e participação ficam disponíveis em texto na legenda', async () => {
    const elemento = await montar(composicao());
    const legenda = elemento.querySelector('[data-fatia="AAPL"]');

    expect(legenda?.querySelector('[data-fatia-ticker]')?.textContent).toContain('AAPL');
    expect(legenda?.querySelector('[data-fatia-valor]')?.textContent).toContain('1.000,00');
    expect(legenda?.querySelector('[data-fatia-participacao]')?.textContent).toContain('25,0%');
  });

  it('@spec:AC-261 entrar no setor ou na legenda destaca os dois juntos e sair limpa o destaque', async () => {
    const elemento = await montar(composicao());
    const setor = elemento.querySelector('[data-setor="PETR4"]') as SVGPathElement;
    const legenda = elemento.querySelector('[data-fatia="PETR4"]') as HTMLElement;

    setor.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(setor.classList.contains('ativa')).toBe(true);
    expect(legenda.classList.contains('ativa')).toBe(true);

    setor.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(setor.classList.contains('ativa')).toBe(false);

    legenda.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(setor.classList.contains('ativa')).toBe(true);
    expect(legenda.classList.contains('ativa')).toBe(true);
  });

  it('@spec:AC-195 composição que não fecha confessa junto do gráfico, e o gráfico continua visível', async () => {
    const elemento = await montar(
      composicao({
        fatias: [
          {
            ticker: 'XPTO3',
            nomeEmpresa: 'Desconhecida',
            valor: 200,
            participacao: 100,
            moedaOriginal: 'desconhecida',
            convertido: false,
          },
        ],
        soma: 200,
        valorDeMercado: 1000,
        diferenca: -800,
        fecha: false,
      }),
    );

    const ressalva = elemento.querySelector('[data-ressalva-composicao]');
    expect(ressalva?.textContent).toContain('não fecha com o valor de mercado');
    expect(ressalva?.textContent).toContain('XPTO3');
    expect(elemento.querySelectorAll('[data-fatia]').length).toBe(1);
  });

  it('@spec:AC-262 a ressalva de soma divergente permanece junto da rosca visível', async () => {
    const elemento = await montar(composicao({ fecha: false, diferenca: -250 }));

    expect(elemento.querySelector('[data-ressalva-composicao]')).not.toBeNull();
    expect(elemento.querySelector('[data-rosca-composicao]')).not.toBeNull();
  });

  it('@spec:AC-259 agrupa do nono ativo em diante como demais', async () => {
    const fatias = Array.from({ length: 10 }, (_, indice) => ({
      ticker: `ATV${indice + 1}`,
      nomeEmpresa: `Ativo ${indice + 1}`,
      valor: 100,
      participacao: 10,
      moedaOriginal: 'BRL' as const,
      convertido: true,
    }));
    const elemento = await montar(composicao({ fatias, soma: 1000, valorDeMercado: 1000 }));

    expect(elemento.querySelectorAll('[data-fatia]')).toHaveLength(9);
    expect(elemento.querySelector('[data-fatia="DEMAIS"]')?.textContent).toContain('20,0%');
  });

  it('@spec:AC-195 composição que fecha não inventa ressalva', async () => {
    const elemento = await montar(composicao());

    expect(elemento.querySelector('[data-ressalva-composicao]')).toBeNull();
  });

  it('@spec:AC-197 não há eixo de tempo nem promessa de evolução', async () => {
    const elemento = await montar(composicao());
    const texto = elemento.textContent ?? '';

    expect(texto).not.toMatch(/evolu|hist[óo]ric|ao longo do tempo|per[íi]odo/i);
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
  });
});
