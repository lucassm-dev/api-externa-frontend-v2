import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { classesDe, gerarCss } from '@/test/tailwind';
import { Botao, IntencaoBotao } from './botao';

function TelaDeTeste({ intencao = 'primaria', ocupadoInicial = false }: { intencao?: string; ocupadoInicial?: boolean }) {
  const [ocupado, setOcupado] = useState(ocupadoInicial);
  const [cliques, setCliques] = useState(0);
  return (
    <>
      <Botao type="button" intencao={intencao} ocupado={ocupado} onClick={() => setCliques((c) => c + 1)}>
        Registrar compra
      </Botao>
      <output data-cliques>{cliques}</output>
      <input type="checkbox" aria-label="ocupado" onChange={() => setOcupado(true)} />
    </>
  );
}

const botao = () => screen.getByRole('button', { name: /Registrar compra/ });
const cliques = () => Number(document.querySelector('[data-cliques]')?.textContent);

describe('Botão do produto', () => {
  it('@spec:AC-267 cada intenção conhecida marca o botão com aparência própria', () => {
    const intencoes: IntencaoBotao[] = ['primaria', 'secundaria', 'sutil', 'destrutiva'];
    const aparencias = new Set<string>();

    for (const intencao of intencoes) {
      const { unmount } = render(<TelaDeTeste intencao={intencao} />);
      expect(botao().getAttribute('data-intencao')).toBe(intencao);
      aparencias.add(classesDe(botao()).sort().join(' '));
      unmount();
    }

    expect(aparencias.size).toBe(4);
  });

  it('@spec:AC-267 intenção desconhecida é recusada, não vira aparência padrão', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<TelaDeTeste intencao="urgente" />)).toThrow(/Inten..o de bot.o desconhecida/);
  });

  it('@spec:AC-268 ocupado se anuncia, mantém o rótulo e não dispara a ação de novo', () => {
    render(<TelaDeTeste />);

    fireEvent.click(botao());
    expect(cliques()).toBe(1);

    fireEvent.click(screen.getByRole('checkbox', { name: 'ocupado' }));

    expect(botao().getAttribute('aria-busy')).toBe('true');
    expect((botao() as HTMLButtonElement).disabled).toBe(true);
    expect(botao().textContent?.trim()).toBe('Registrar compra');

    fireEvent.click(botao());
    expect(cliques()).toBe(1);
  });

  it('@spec:AC-269 o foco é visível com anel próprio, sem apagar o contorno do sistema', async () => {
    render(<TelaDeTeste />);

    botao().focus();
    expect(document.activeElement).toBe(botao());

    const css = await gerarCss(classesDe(botao()));
    // A regra é da própria classe do botão (camada de utilitários), não do piso global.
    const foco = css.match(/:focus-visible\s*{[^}]*}/)?.[0] ?? '';
    expect(foco).toMatch(/--tw-shadow:\s*var\(--anel-foco\)/);
    expect(foco).toMatch(/box-shadow:/);
  });

  it('@spec:AC-269 nenhum tamanho fica abaixo do alvo de toque onde há toque', async () => {
    const { container } = render(
      <>
        <Botao type="button">Médio</Botao>
        <Botao type="button" tamanho="compacto">
          Compacto
        </Botao>
      </>,
    );
    const [medio, compacto] = [...container.querySelectorAll('button')];

    expect(await gerarCss(classesDe(medio))).toMatch(/min-height:\s*var\(--alvo-toque\)/);

    const cssCompacto = await gerarCss(classesDe(compacto));
    const blocoDeToque = cssCompacto.slice(cssCompacto.indexOf('@media (pointer: coarse)'));
    expect(cssCompacto).toContain('@media (pointer: coarse)');
    expect(blocoDeToque).toMatch(/min-height:\s*var\(--alvo-toque\)/);
  });
});
