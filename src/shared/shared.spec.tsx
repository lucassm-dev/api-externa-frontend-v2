import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { LIMITE_DEFASAGEM_MINUTOS, estaDefasado, idadeEmMinutos } from '@/core/dados/idade-dado';
import { EstadoVazio } from './estado-vazio';
import { Monograma } from './monograma';
import { ValorComHorario } from './valor-com-horario';
import { Variacao } from './variacao';
import { VisibilidadeSenha } from './visibilidade-senha';

describe('Estado vazio', () => {
  it('@spec:AC-223 explica a ausência e oferece um próximo passo acionável', () => {
    const aoAcionar = vi.fn();
    const { container } = render(
      <EstadoVazio
        titulo="Nenhuma carteira ainda"
        descricao="Crie uma carteira para começar a organizar seus ativos."
        rotuloAcao="Criar carteira"
        aoAcionar={aoAcionar}
      />,
    );
    const botao = container.querySelector('[data-proximo-passo]') as HTMLButtonElement;

    expect(container.querySelector('[data-titulo]')?.textContent).toContain('Nenhuma carteira ainda');
    expect(container.querySelector('[data-descricao]')?.textContent).toContain('Crie uma carteira');
    expect(botao.textContent).toContain('Criar carteira');
    fireEvent.click(botao);
    expect(aoAcionar).toHaveBeenCalledOnce();
  });
});

describe('Monograma do ativo', () => {
  const montar = (ticker: string, logoUrl: string | null = null) => render(<Monograma ticker={ticker} logoUrl={logoUrl} />).container;

  it('@spec:AC-380 o ativo mostra o logo da brapi, decorativo, com o ticker anunciado por fora', () => {
    const elemento = montar(' petr4 ').querySelector('[data-monograma]') as HTMLElement;
    const imagem = elemento.querySelector('img') as HTMLImageElement;

    expect(imagem.getAttribute('src')).toBe('https://icons.brapi.dev/icons/PETR4.svg');
    expect(imagem.alt).toBe('');
    expect(elemento.getAttribute('role')).toBe('img');
    expect(elemento.getAttribute('aria-label')).toContain('PETR4');
  });

  it('@spec:AC-381 sem logo, ícone na cor do ativo e nenhuma letra; ticker novo tenta o logo de novo', () => {
    const { container, rerender } = render(<Monograma ticker="XXXX9" />);
    fireEvent.error(container.querySelector('img')!);

    const elemento = container.querySelector('[data-monograma]') as HTMLElement;
    expect(elemento.querySelector('img')).toBeNull();
    expect(elemento.querySelector('[data-icone-ativo]')).not.toBeNull();
    expect(elemento.textContent?.trim()).toBe('');
    expect(elemento.style.getPropertyValue('--cor-monograma')).toMatch(/^var\(--cor-serie-[1-8]\)$/);

    rerender(<Monograma ticker="VALE3" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://icons.brapi.dev/icons/VALE3.svg');
  });

  it('@spec:AC-219 deriva uma cor de série estável para o mesmo ticker', () => {
    const primeiro = montar('PETR4').querySelector('[data-monograma]') as HTMLElement;
    const segundo = montar('petr4').querySelector('[data-monograma]') as HTMLElement;

    expect(primeiro.getAttribute('data-serie')).toBe(segundo.getAttribute('data-serie'));
    expect(primeiro.style.getPropertyValue('--cor-monograma')).toMatch(/^var\(--cor-serie-[1-8]\)$/);
  });

  it('@spec:AC-220 anuncia o ticker no fallback e no logo curado', () => {
    const { container } = render(<Monograma ticker="VALE3" />);
    fireEvent.error(container.querySelector('img')!);
    const reserva = container.querySelector('[data-monograma]') as HTMLElement;
    expect(reserva.getAttribute('role')).toBe('img');
    expect(reserva.getAttribute('aria-label')).toContain('VALE3');

    // Com logo, quem anuncia é o elemento de fora; a imagem não repete o ticker.
    const comLogo = montar('VALE3', '/ativos/VALE3.svg').querySelector('[data-monograma]') as HTMLElement;
    expect(comLogo.getAttribute('aria-label')).toContain('VALE3');
    expect(comLogo.querySelector('img')?.getAttribute('src')).toBe('/ativos/VALE3.svg');
  });
});

describe('Valor com horário de obtenção', () => {
  const AGORA = new Date();
  const minutosAtras = (minutos: number, segundos = 0) => new Date(AGORA.getTime() - minutos * 60_000 - segundos * 1_000);
  const renderizar = (obtidoEm: Date) =>
    render(<ValorComHorario valor={32.15} moeda="BRL" obtidoEm={obtidoEm} />).container.querySelector(
      '[data-valor-com-horario]',
    ) as HTMLElement;

  it('@spec:AC-008 o valor nunca aparece sozinho: vem com o momento em que foi obtido', () => {
    const elemento = renderizar(minutosAtras(2));

    expect(elemento.querySelector('[data-numero]')?.textContent).toContain('32,15');
    expect(elemento.querySelector('[data-numero]')?.textContent).toContain('R$');
    expect(elemento.querySelector('[data-horario]')?.textContent?.trim()).toBeTruthy();
    expect(elemento.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-009 passados 15 minutos o dado ganha marcação, além do horário em texto', () => {
    const recente = renderizar(minutosAtras(2));
    const velho = renderizar(minutosAtras(40));

    expect(recente.getAttribute('data-defasado')).toBe('false');
    expect(velho.getAttribute('data-defasado')).toBe('true');
    expect(velho.querySelector('[data-marcacao-defasado]')?.textContent?.trim()).toBeTruthy();
    expect(recente.querySelector('[data-marcacao-defasado]')).toBeNull();
  });

  it('@spec:AC-010 o limite de 15 minutos é exato', () => {
    expect(LIMITE_DEFASAGEM_MINUTOS).toBe(15);
    expect(estaDefasado(minutosAtras(15), AGORA)).toBe(false);
    expect(estaDefasado(minutosAtras(15, 1), AGORA)).toBe(true);
    expect(estaDefasado(minutosAtras(0), AGORA)).toBe(false);
  });

  it('@spec:AC-010 a idade é contada em minutos a partir do momento de obtenção', () => {
    expect(idadeEmMinutos(minutosAtras(0), AGORA)).toBe(0);
    expect(idadeEmMinutos(minutosAtras(90), AGORA)).toBe(90);
    expect(idadeEmMinutos(new Date(AGORA.getTime() + 60_000), AGORA)).toBe(0);
  });
});

describe('Ganho e perda', () => {
  const renderizar = (valor: number) =>
    render(<Variacao valor={valor} moeda="BRL" />).container.querySelector('[data-variacao]') as HTMLElement;

  it('@spec:AC-021 alta, baixa e estável têm sinal próprio, legível sem depender de cor', () => {
    const elementos = [renderizar(120.5), renderizar(-80.25), renderizar(0)];

    const sinais = elementos.map((el) => el.querySelector('[data-sinal]')?.textContent?.trim());
    expect(new Set(sinais).size).toBe(3);
    expect(sinais.every((s) => !!s)).toBe(true);
    expect(elementos.map((el) => el.getAttribute('data-direcao'))).toEqual(['alta', 'baixa', 'estavel']);
  });

  it('@spec:AC-021 o significado também vai em texto, para quem usa leitor de tela', () => {
    expect(renderizar(120.5).querySelector('[data-descricao]')?.textContent?.trim()).toBe('alta');
    expect(renderizar(-80.25).querySelector('[data-descricao]')?.textContent?.trim()).toBe('baixa');
  });

  it('@spec:AC-021 o número sai formatado em pt-BR e a perda não é lida como valor negativo solto', () => {
    expect(renderizar(-80.25).querySelector('[data-numero]')?.textContent).toContain('80,25');
  });
});

describe('Botão de visibilidade da senha', () => {
  function TelaDeTeste({ campo = 'senha', aoEnviar = () => undefined }: { campo?: string; aoEnviar?: () => void }) {
    const [visivel, setVisivel] = useState(false);
    return (
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          aoEnviar();
        }}
      >
        <input type={visivel ? 'text' : 'password'} defaultValue="segredo-123" aria-label="Senha" data-campo />
        <VisibilidadeSenha visivel={visivel} aoAlternar={setVisivel} campo={campo} />
      </form>
    );
  }

  const campo = () => document.querySelector('[data-campo]') as HTMLInputElement;
  const botao = () => document.querySelector('[data-visibilidade-senha]') as HTMLButtonElement;

  it('@spec:AC-295 revela o conteúdo digitado e volta a ocultar', () => {
    render(<TelaDeTeste />);
    expect(campo().type).toBe('password');

    fireEvent.click(botao());
    expect(campo().type).toBe('text');
    expect(campo().value).toBe('segredo-123');

    fireEvent.click(botao());
    expect(campo().type).toBe('password');
  });

  it('@spec:AC-296 o nome acessível descreve a ação e acompanha o estado', () => {
    render(<TelaDeTeste />);

    expect(botao().getAttribute('aria-label')).toBe('Mostrar senha');
    expect(botao().getAttribute('aria-pressed')).toBe('false');
    expect(botao().querySelector('[data-icone="revela"]')).not.toBeNull();

    fireEvent.click(botao());

    expect(botao().getAttribute('aria-label')).toBe('Ocultar senha');
    expect(botao().getAttribute('aria-pressed')).toBe('true');
    expect(botao().querySelector('[data-icone="oculta"]')).not.toBeNull();
  });

  it('@spec:AC-296 o rótulo nomeia o campo, para distinguir dois na mesma tela', () => {
    render(<TelaDeTeste campo="confirmação de senha" />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Mostrar confirmação de senha');
  });

  it('@spec:AC-298 acionar o botão não envia o formulário que o contém', () => {
    const aoEnviar = vi.fn();
    render(<TelaDeTeste aoEnviar={aoEnviar} />);

    expect(botao().type).toBe('button');
    fireEvent.click(botao());
    expect(aoEnviar).not.toHaveBeenCalled();
  });
});
