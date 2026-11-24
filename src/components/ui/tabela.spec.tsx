import { readFileSync } from 'node:fs';
import { fireEvent, render } from '@testing-library/react';
import { CabecalhoOrdenavel, SentidoOrdenacao, Tabela } from './tabela';

const estilo = readFileSync('src/components/ui/tabela.css', 'utf8');

describe('Estilo base de tabela', () => {
  it('@spec:AC-244 alinha as colunas numéricas à direita, em fonte de largura fixa e com dígitos de mesma largura', () => {
    const numerica = estilo.match(/td\[data-numero\][\s\S]*?\}/)?.[0] ?? '';
    expect(numerica).not.toBe('');
    expect(numerica).toMatch(/text-align:\s*right/);
    expect(numerica).toMatch(/font-family:\s*var\(--fonte-numero\)/);
    expect(numerica).toMatch(/font-variant-numeric:\s*[^;]*tabular-nums/);
  });

  it('@spec:AC-245 destaca a linha sob o ponteiro sem que o destaque seja a única forma de distingui-la', () => {
    const hover = estilo.match(/tbody tr:hover\s*\{[^}]*\}/)?.[0] ?? '';
    expect(hover).not.toBe('');
    expect(hover).toMatch(/(background|outline):/);

    expect(estilo).toMatch(/tbody tr:nth-child\((?:even|odd)\)\s*\{[^}]*background:/);
  });

  it('@spec:AC-244 a tabela do kit usa essa folha', () => {
    const { container } = render(<Tabela />);
    expect(container.querySelector('table')?.classList.contains('tabela')).toBe(true);
    expect(readFileSync('src/styles/global.css', 'utf8')).toContain('../components/ui/tabela.css');
  });
});

describe('Tabela — rolagem contida', () => {
  const base = estilo.match(/\.tabela\s*\{[^}]*\}/)?.[0] ?? '';

  it('@spec:AC-272 mantém a rolagem horizontal dentro do bloco da tabela', () => {
    expect(base).not.toBe('');
    expect(base).toMatch(/display:\s*block/);
    expect(base).toMatch(/overflow-x:\s*(auto|scroll)/);
    expect(base).toMatch(/max-width:\s*100%/);
  });

  it('@spec:AC-272 impede que a rolagem da tabela arraste a página de lado', () => {
    expect(base).toMatch(/overscroll-behavior(-x)?:\s*[^;]*contain/);
  });

  it('@spec:AC-272 dá contorno próprio à região rolável quando ela recebe foco de teclado', () => {
    const foco = estilo.match(/\.tabela:focus-visible\s*\{[^}]*\}/)?.[0] ?? '';
    expect(foco).not.toBe('');
    expect(foco).toMatch(/outline:\s*[^;]*var\(--cor-foco\)/);
    expect(foco).not.toMatch(/outline:\s*none/);
  });

  it('@spec:AC-272 preserva o nome acessível da região rolável pela caption da tabela', () => {
    expect(estilo).toMatch(/\.tabela\s+caption\s*\{[^}]*\}/);
  });
});

describe('Cabeçalho ordenável', () => {
  function montar(sentido: SentidoOrdenacao, aoOrdenar = vi.fn()) {
    const { container } = render(
      <Tabela>
        <thead>
          <tr>
            <CabecalhoOrdenavel rotulo="Data" sentido={sentido} aoOrdenar={aoOrdenar} />
          </tr>
        </thead>
      </Tabela>,
    );
    return container.querySelector('th') as HTMLTableCellElement;
  }

  it('@spec:AC-242 anuncia o sentido atual em aria-sort e o alterna conforme o estado recebido', () => {
    expect(montar('nenhum').getAttribute('aria-sort')).toBe('none');
    expect(montar('crescente').getAttribute('aria-sort')).toBe('ascending');
    expect(montar('decrescente').getAttribute('aria-sort')).toBe('descending');
    expect(montar('nenhum').tagName).toBe('TH');
  });

  it('@spec:AC-242 responde ao acionamento do cabeçalho emitindo o pedido de ordenação', () => {
    const aoOrdenar = vi.fn();
    const th = montar('nenhum', aoOrdenar);

    fireEvent.click(th.querySelector('button')!);
    fireEvent.click(th.querySelector('button')!);

    expect(aoOrdenar).toHaveBeenCalledTimes(2);
  });

  it('@spec:AC-242 mantém o glifo decorativo, deixando aria-sort e o nome do botão anunciarem', () => {
    const th = montar('crescente');
    const botao = th.querySelector('button') as HTMLButtonElement;
    const glifo = th.querySelector('[data-glifo]') as SVGElement;

    expect(botao.textContent?.trim()).toContain('Data');
    expect(botao.disabled).toBe(false);
    expect(glifo.getAttribute('aria-hidden')).toBe('true');
    expect(glifo.getAttribute('focusable')).toBe('false');
  });

  it('@spec:AC-242 pinta o glifo apenas com token ou currentColor, sem cor literal (P-003)', () => {
    const fonte = readFileSync('src/components/ui/tabela.tsx', 'utf8');
    expect(fonte).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
    expect(fonte).toContain('fill-current');
  });
});
