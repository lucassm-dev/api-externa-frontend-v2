import { render } from '@testing-library/react';
import { ResultadosDaCarteira } from '../resultados';
import { NumerosDesempenho } from './numeros-desempenho';

const resultados: ResultadosDaCarteira = {
  valorInvestido: 10_000,
  valorDeMercado: 12_000,
  naoRealizado: 2000,
  naoRealizadoPercentual: 20,
  realizado: 500,
  realizadoPercentual: 5,
};

function montar(dados: ResultadosDaCarteira) {
  return render(<NumerosDesempenho resultados={dados} />).container;
}

describe('Os quatro números no topo do desempenho', () => {
  it('@spec:AC-183 os quatro aparecem nesta ordem, em real', () => {
    const elemento = montar(resultados);

    const rotulos = [...elemento.querySelectorAll('dt')].map((no) => no.textContent?.trim());
    expect(rotulos).toEqual([
      'Valor investido',
      'Valor de mercado',
      'Resultado não realizado',
      'Resultado realizado',
    ]);
    expect(elemento.querySelector('[data-valor-investido]')?.textContent).toContain('R$');
    expect(elemento.querySelector('[data-valor-investido]')?.textContent).toContain('10.000,00');
    expect(elemento.querySelector('[data-valor-de-mercado]')?.textContent).toContain('12.000,00');
  });

  it('@spec:AC-184 realizado e não realizado são cartões separados e a soma dos dois não aparece', () => {
    const elemento = montar(resultados);

    expect(elemento.querySelector('[data-nao-realizado]')?.textContent).toContain('2.000,00');
    expect(elemento.querySelector('[data-realizado]')?.textContent).toContain('500,00');
    // 2000 + 500 = 2500: nenhum elemento da tela apresenta esse número.
    expect(elemento.textContent ?? '').not.toContain('2.500,00');
  });

  it('@spec:AC-185 cada resultado traz o percentual sobre o investido', () => {
    const elemento = montar(resultados);

    expect(elemento.querySelector('[data-nao-realizado-percentual]')?.textContent).toContain('20,00%');
    expect(elemento.querySelector('[data-realizado-percentual]')?.textContent).toContain('5,00%');
  });

  it('@spec:AC-186 investido zero não mostra percentual, infinito nem NaN', () => {
    const elemento = montar({
      valorInvestido: 0,
      valorDeMercado: 0,
      naoRealizado: 0,
      naoRealizadoPercentual: null,
      realizado: 0,
      realizadoPercentual: null,
    });

    expect(elemento.querySelector('[data-nao-realizado-percentual]')).toBeNull();
    expect(elemento.querySelector('[data-realizado-percentual]')).toBeNull();
    expect(elemento.textContent ?? '').not.toMatch(/NaN|Infinity|∞/);
  });

  it('@spec:AC-187 ganho e perda trazem seta e palavra, não só cor', () => {
    const elemento = montar({ ...resultados, naoRealizado: -2000, naoRealizadoPercentual: -20 });

    const naoRealizado = elemento.querySelector('[data-nao-realizado]');
    expect(naoRealizado?.querySelector('[data-sinal]')?.textContent).toBe('▼');
    expect(naoRealizado?.querySelector('[data-descricao]')?.textContent).toBe('baixa');

    const realizado = elemento.querySelector('[data-realizado]');
    expect(realizado?.querySelector('[data-sinal]')?.textContent).toBe('▲');
    expect(realizado?.querySelector('[data-descricao]')?.textContent).toBe('alta');
  });

  it('@spec:AC-188 nenhum rótulo promete rentabilidade anualizada ou por período', () => {
    const elemento = montar(resultados);

    expect(elemento.textContent ?? '').not.toMatch(/anualizad|a\.a\.|no ano|per[íi]odo|acumulad/i);
  });

  it('@spec:AC-184 realizado que não pôde ser lido diz isso, em vez de virar zero apurado', () => {
    const elemento = montar({ ...resultados, realizado: null, realizadoPercentual: null });

    expect(elemento.querySelector('[data-realizado]')).toBeNull();
    expect(elemento.querySelector('[data-realizado-indisponivel]')?.textContent).toContain(
      'Não foi possível ler',
    );
  });

  it('@spec:AC-264 cada indicador tem rótulo pequeno, valor destacado e selo nos resultados', () => {
    const elemento = montar(resultados);
    const indicadores = [...elemento.querySelectorAll('[data-indicador]')];

    expect(indicadores).toHaveLength(4);
    for (const indicador of indicadores) {
      expect(indicador.querySelector('[data-indicador-rotulo]')).not.toBeNull();
      expect(indicador.querySelector('[data-indicador-valor]')).not.toBeNull();
    }
    expect(elemento.querySelector('[data-nao-realizado-percentual] [data-selo]')?.textContent).toContain(
      'Alta 20,00%',
    );
    expect(elemento.querySelector('[data-realizado-percentual] [data-selo]')?.textContent).toContain(
      'Alta 5,00%',
    );
  });

  it('@spec:AC-265 não sugere eixo de tempo, tendência nem comparação com período anterior', () => {
    const elemento = montar(resultados);

    expect(elemento.textContent ?? '').not.toMatch(
      /m[eê]s anterior|per[íi]odo anterior|evolu[çc][aã]o|tend[eê]ncia|hist[óo]rico/i,
    );
    expect(elemento.querySelector('[data-sparkline]')).toBeNull();
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
  });

  it('@spec:AC-302 com movimento reduzido os números do desempenho já aparecem no valor final', () => {
    const original = window.matchMedia;
    window.matchMedia = ((consulta: string) =>
      ({ matches: consulta.includes('prefers-reduced-motion'), media: consulta, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList) as typeof window.matchMedia;

    const elemento = montar(resultados);
    window.matchMedia = original;

    expect(elemento.querySelector('[data-valor-investido] [data-contagem]')?.textContent).toContain('10.000,00');
    expect(elemento.querySelector('[data-valor-de-mercado] [data-contagem]')?.textContent).toContain('12.000,00');
    expect(elemento.querySelector('[data-valor-investido] .sr-only')?.textContent).toContain('10.000,00');
  });
});
