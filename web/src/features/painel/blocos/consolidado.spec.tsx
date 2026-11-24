import { fireEvent, render } from '@testing-library/react';
import { CarteiraResumida, ConsolidadoDaCarteira } from '../painel.model';
import { Consolidado } from './consolidado';

function carteira(id: number, nome: string): CarteiraResumida {
  return { id, investidorId: 1, corretoraId: 1, nomeCorretora: 'Corretora', mercado: 'BR', moeda: 'BRL', nome, ativa: true };
}

const carteiras = [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')];
const numeros: ConsolidadoDaCarteira = {
  valorInvestido: 10_000,
  valorDeMercado: 11_500.5,
  lucroNaoRealizado: 1500.5,
  taxaCambioAtual: 5.42,
  dataHoraTaxaCambio: new Date().toISOString(),
  avisos: [],
};

function montar(consolidado: ConsolidadoDaCarteira | null, selecionada: number | null = 9, aoSelecionar = vi.fn()) {
  return render(<Consolidado carteiras={carteiras} carteiraSelecionada={selecionada} consolidado={consolidado} aoSelecionar={aoSelecionar} />).container;
}

describe('Consolidado de uma carteira', () => {
  it('@spec:AC-053 mostra investido, valor de mercado e resultado da carteira escolhida, em real', () => {
    const elemento = montar(numeros);

    expect(elemento.querySelector('[data-valor-investido]')?.textContent).toContain('R$');
    expect(elemento.querySelector('[data-valor-investido]')?.textContent).toContain('10.000,00');
    expect(elemento.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(elemento.querySelector('[data-lucro-nao-realizado]')?.textContent).toContain('1.500,50');
    expect(elemento.querySelector('[data-lucro-nao-realizado] [data-variacao]')?.getAttribute('data-direcao')).toBe('alta');
  });

  it('@spec:AC-053 a taxa de câmbio e o horário dela aparecem junto do número', () => {
    const cambio = montar(numeros).querySelector('[data-taxa-cambio]');

    expect(cambio?.querySelector('[data-numero]')?.textContent).toContain('5,42');
    expect(cambio?.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-053 o seletor lista as carteiras e escolher uma avisa quem pediu o consolidado', () => {
    const aoSelecionar = vi.fn();
    const seletor = montar(numeros, 9, aoSelecionar).querySelector('[data-seletor-carteira]') as HTMLSelectElement;

    expect([...seletor.options].map((opcao) => opcao.textContent?.trim())).toEqual(['Longo prazo', 'Dividendos']);
    fireEvent.change(seletor, { target: { value: '4' } });
    expect(aoSelecionar).toHaveBeenCalledWith(4);
  });

  it('@spec:AC-054 abre já na carteira lembrada, sem o investidor escolher de novo', () => {
    expect((montar(numeros, 4).querySelector('[data-seletor-carteira]') as HTMLSelectElement).value).toBe('4');
  });

  it('@spec:AC-055 aviso de câmbio aparece como aviso, com os números ainda na tela', () => {
    const elemento = montar({ ...numeros, avisos: ['Câmbio indisponível: usando a última taxa conhecida.'] });

    expect(elemento.querySelector('[data-aviso-consolidado] [data-nivel]')?.getAttribute('data-nivel')).toBe('aviso');
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
    expect(elemento.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
  });

  it('@spec:AC-238 cada indicador põe o rótulo pequeno acima e o valor em destaque, com selo de variação no resultado', () => {
    const elemento = montar(numeros);
    const indicadores = [...elemento.querySelectorAll('[data-indicador]')];
    expect(indicadores).toHaveLength(3);
    for (const indicador of indicadores) {
      const rotulo = indicador.querySelector('[data-indicador-rotulo]')!;
      const valor = indicador.querySelector('[data-indicador-valor]')!;
      expect(rotulo.compareDocumentPosition(valor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(elemento.querySelector('[data-valor-investido]')!.closest('[data-indicador-valor]')).not.toBeNull();
    const resultado = elemento.querySelector('[data-lucro-nao-realizado]')!;
    expect(resultado.matches('[data-indicador-valor]')).toBe(true);
    expect(resultado.querySelector('[data-variacao]')).not.toBeNull();
    const selo = elemento.querySelector('[data-selo-resultado] [data-selo]')!;
    expect(selo.getAttribute('data-variante')).toBe('alta');
    expect(selo.textContent).toContain('Alta');
  });

  it('@spec:AC-238 o selo de variação do resultado acompanha o sinal do número', () => {
    expect(montar({ ...numeros, lucroNaoRealizado: -800 }).querySelector('[data-selo-resultado] [data-selo]')?.getAttribute('data-variante')).toBe('baixa');
    expect(montar({ ...numeros, lucroNaoRealizado: 0 }).querySelector('[data-selo-resultado] [data-selo]')?.getAttribute('data-variante')).toBe('estavel');
  });

  it('@spec:AC-239 nenhum indicador mostra comparação com período anterior ou miniatura de evolução', () => {
    const elemento = montar(numeros);

    expect(
      elemento.querySelector('[data-comparacao], [data-vs-periodo], [data-periodo-anterior], [data-evolucao], [data-sparkline], [data-minigrafico], canvas, svg[data-grafico]'),
    ).toBeNull();
    expect(elemento.textContent ?? '').not.toMatch(/m[êe]s anterior|per[íi]odo anterior|últimos?\s+\d+\s+dias|no ano|desde o in[íi]cio/i);
  });

  it('@spec:AC-056 taxa com mais de quinze minutos ganha a marcação de dado defasado', () => {
    expect(montar(numeros).querySelector('[data-taxa-cambio] [data-valor-com-horario]')?.getAttribute('data-defasado')).toBe('false');

    const velha = montar({ ...numeros, dataHoraTaxaCambio: new Date(Date.now() - 40 * 60_000).toISOString() });
    expect(velha.querySelector('[data-taxa-cambio] [data-valor-com-horario]')?.getAttribute('data-defasado')).toBe('true');
    expect(velha.querySelector('[data-marcacao-defasado]')).not.toBeNull();
  });

  it('@spec:AC-302 com movimento reduzido os números do consolidado já aparecem no valor final', () => {
    const original = window.matchMedia;
    window.matchMedia = ((consulta: string) =>
      ({ matches: consulta.includes('prefers-reduced-motion'), media: consulta, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList) as typeof window.matchMedia;

    const elemento = montar(numeros);
    window.matchMedia = original;

    // A camada visual (a que conta) e o texto lido pelo leitor de tela dizem o mesmo número.
    expect(elemento.querySelector('[data-valor-investido] [data-contagem]')?.textContent).toContain('10.000,00');
    expect(elemento.querySelector('[data-valor-de-mercado] [data-contagem]')?.textContent).toContain('11.500,50');
    expect(elemento.querySelector('[data-valor-investido] .sr-only')?.textContent).toContain('10.000,00');
  });
});
