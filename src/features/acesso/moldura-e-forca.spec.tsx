import { readFileSync } from 'node:fs';
import { render } from '@testing-library/react';
import { classesDe, gerarCss } from '@/test/tailwind';
import { ForcaDaSenha } from './forca-da-senha';
import { MolduraAcesso } from './moldura-acesso';
import { validarSenha } from './validadores';

function montarMoldura() {
  return render(
    <MolduraAcesso>
      <form>
        <input aria-label="Primeiro campo" />
        <button type="button">Continuar</button>
      </form>
    </MolduraAcesso>,
  ).container;
}

function simularMovimentoReduzido(reduzido: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((consulta: string) =>
    ({
      matches: reduzido && consulta.includes('prefers-reduced-motion'),
      media: consulta,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

describe('Medidor da força da senha', () => {
  it('@spec:AC-255 concorda com o validador real para senhas aceitas e recusadas', () => {
    for (const senha of ['', 'abc', 'abcdefgh', '12345678', 'abc123', 'segura123']) {
      const { container, unmount } = render(<ForcaDaSenha senha={senha} />);
      const aceitaNoFormulario = validarSenha(senha) === null;
      expect(container.querySelector('[data-forca-senha]')?.getAttribute('data-aceitavel')).toBe(String(aceitaNoFormulario));
      unmount();
    }
  });

  it('@spec:AC-255 mostra por texto e preenchimento o progresso nos três requisitos', () => {
    const { container } = render(<ForcaDaSenha senha="abcdefg1" />);

    expect(container.querySelectorAll('[data-requisito]')).toHaveLength(3);
    expect(container.textContent).toMatch(/8 ou mais caracteres.*atendido/i);
    expect(container.textContent).toMatch(/ao menos uma letra.*atendido/i);
    expect(container.textContent).toMatch(/ao menos um número.*atendido/i);
    // Preenchimento por escala: 1 é a trilha inteira.
    expect((container.querySelector('[data-preenchimento]') as HTMLElement).style.transform).toBe('scaleX(1)');
  });
});

describe('Moldura das telas de acesso', () => {
  it('@spec:AC-251 separa o formulário da região de marca e limita a largura de leitura', async () => {
    const elemento = montarMoldura();

    expect(elemento.querySelector('[data-regiao-formulario] form')).not.toBeNull();
    expect(elemento.querySelector('[data-regiao-marca]')).not.toBeNull();

    const grade = await gerarCss(classesDe(elemento.querySelector('[data-moldura-acesso]')!));
    expect(grade).toMatch(/grid-template-columns:/);
    const largura = await gerarCss(classesDe(elemento.querySelector('[data-regiao-formulario] > div')!));
    expect(largura).toMatch(/width:\s*min\(100%,\s*440px\)/);
  });

  it('@spec:AC-252 mantém a marca fora da tabulação e deixa os controles no formulário', () => {
    const elemento = montarMoldura();
    const marca = elemento.querySelector('[data-regiao-marca]') as HTMLElement;

    expect(marca.getAttribute('aria-hidden')).toBe('true');
    expect(marca.querySelectorAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
    expect(elemento.querySelector('[data-regiao-formulario] input')).not.toBeNull();
  });

  it('@spec:AC-253 @spec:AC-302 desliga o movimento opcional e anima somente transformação e opacidade (moldura)', () => {
    const restaurar = simularMovimentoReduzido(true);
    const parado = montarMoldura();
    expect(parado.querySelector('[data-holofote]')?.getAttribute('data-movimento')).toBe('parado');
    restaurar();

    const restaurarAtivo = simularMovimentoReduzido(false);
    expect(montarMoldura().querySelector('[data-holofote]')?.getAttribute('data-movimento')).toBe('ativo');
    restaurarAtivo();

    // O que o holofote anima: só deslocamento horizontal e opacidade, nada de layout.
    const fonte = readFileSync('src/components/ui/holofote.tsx', 'utf8');
    const animado = [...fonte.matchAll(/(?:animate|initial)=\{[^}]*?\{([^}]*)\}/g)].map(([, corpo]) => corpo).join(' ');
    const propriedades = [...animado.matchAll(/(\w+):/g)].map(([, nome]) => nome);
    expect(propriedades.length).toBeGreaterThan(0);
    expect(propriedades.every((nome) => ['x', 'opacity'].includes(nome))).toBe(true);
  });
});
