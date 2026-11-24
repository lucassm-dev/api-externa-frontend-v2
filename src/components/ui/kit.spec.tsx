import { readFileSync } from 'node:fs';
import { fireEvent, render } from '@testing-library/react';
import { Pencil } from 'lucide-react';
import { classesDe, gerarCss } from '@/test/tailwind';
import { BotaoIcone } from './botao-icone';
import { Cartao } from './cartao';
import { DialogoConfirmacao } from './dialogo-confirmacao';
import { Esqueleto } from './esqueleto';
import { Paginador } from './paginador';
import { Selo, VarianteSelo } from './selo';

const MOVIMENTO = readFileSync('src/components/ui/movimento.css', 'utf8');

describe('Botão de ícone', () => {
  const montar = () =>
    render(
      <BotaoIcone rotulo="Editar operação">
        <Pencil />
      </BotaoIcone>,
    ).container.querySelector('button') as HTMLButtonElement;

  it('@spec:AC-216 exige e aplica um nome acessível enquanto oculta o ícone', () => {
    const botao = montar();
    expect(botao.getAttribute('aria-label')).toBe('Editar operação');
    expect(botao.querySelector('[data-icone]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('@spec:AC-217 mantém área acionável de pelo menos 24 por 24 pixels', () => {
    const classes = classesDe(montar());
    // Escala de espaço do Tailwind: 1 unidade = 4px.
    const largura = Number(classes.find((c) => /^min-w-\d+$/.test(c))?.slice('min-w-'.length)) * 4;
    const altura = Number(classes.find((c) => /^min-h-\d+$/.test(c))?.slice('min-h-'.length)) * 4;
    expect(largura).toBeGreaterThanOrEqual(24);
    expect(altura).toBeGreaterThanOrEqual(24);
  });

  it('@spec:AC-228 declara foco de teclado visível sem remover o contorno', async () => {
    const classes = classesDe(montar());
    expect(classes).not.toContain('focus-visible:outline-none');

    const css = await gerarCss(classes);
    const foco = css.match(/\.focus-visible\\:outline-acento:focus-visible\s*{[^}]*}/)?.[0] ?? '';
    expect(foco).toMatch(/outline-color:\s*var\(--cor-acento\)/);
  });
});

describe('Cartão', () => {
  it('@spec:AC-225 agrupa título e conteúdo numa estrutura de seção previsível', () => {
    const { container } = render(<Cartao titulo="Resumo da carteira" apoio="Atualizado às 11:45" />);

    const titulo = container.querySelector('[data-cartao-titulo]');
    const conteudo = container.querySelector('[data-cartao-conteudo]');

    expect(titulo?.tagName).toBe('H2');
    expect(titulo?.textContent).toContain('Resumo da carteira');
    expect(container.querySelector('[data-cartao-apoio]')?.textContent).toContain('Atualizado às 11:45');
    expect(conteudo?.getAttribute('role')).toBe('region');
    expect(conteudo?.getAttribute('aria-labelledby')).toBe(titulo?.id);
    expect(container.querySelector('[data-cartao-acoes]')).toBeTruthy();
  });
});

describe('Diálogo de confirmação', () => {
  function montar() {
    const aoConfirmar = vi.fn();
    const aoCancelar = vi.fn();
    render(
      <DialogoConfirmacao
        titulo="Remover esta corretora?"
        consequencia="A corretora sai do catálogo para todos os investidores."
        rotuloConfirmar="Remover"
        aoConfirmar={aoConfirmar}
        aoCancelar={aoCancelar}
      />,
    );
    return { aoConfirmar, aoCancelar };
  }

  it('@spec:AC-087 descreve a consequência e oferece exatamente dois botões', () => {
    montar();

    expect(document.querySelector('[data-titulo]')?.textContent).toContain('Remover esta corretora?');
    expect(document.querySelector('[data-consequencia]')?.textContent).toContain(
      'A corretora sai do catálogo para todos os investidores.',
    );
    expect(document.body.querySelectorAll('button')).toHaveLength(2);
    expect(document.querySelector('[data-confirmar]')?.textContent).toContain('Remover');
    expect(document.querySelector('[data-cancelar]')).toBeTruthy();
  });

  it('@spec:AC-087 não pede que o investidor digite o nome do que será removido', () => {
    montar();

    expect(document.body.querySelectorAll('input')).toHaveLength(0);
    expect(document.body.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('@spec:AC-087 cada botão avisa quem abriu o diálogo', () => {
    const { aoConfirmar, aoCancelar } = montar();

    fireEvent.click(document.querySelector('[data-confirmar]')!);
    fireEvent.click(document.querySelector('[data-cancelar]')!);

    expect(aoConfirmar).toHaveBeenCalledOnce();
    expect(aoCancelar).toHaveBeenCalledOnce();
  });
});

describe('Esqueleto de carregamento', () => {
  it('@spec:AC-221 expõe formatos com silhuetas distintas e fica oculto da árvore acessível', () => {
    for (const formato of ['linha', 'bloco', 'tabela'] as const) {
      const { container, unmount } = render(<Esqueleto formato={formato} />);
      const elemento = container.querySelector('[data-esqueleto]') as HTMLElement;

      expect(elemento.getAttribute('data-formato')).toBe(formato);
      expect(elemento.getAttribute('aria-hidden')).toBe('true');
      expect(elemento.querySelectorAll('[data-linha]')).toHaveLength(formato === 'tabela' ? 5 : 1);
      unmount();
    }
  });

  it('@spec:AC-229 desliga a animação quando o sistema pede movimento reduzido', () => {
    const freio = MOVIMENTO.slice(MOVIMENTO.indexOf('prefers-reduced-motion: reduce'));
    expect(MOVIMENTO).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(freio).toMatch(/\.esqueleto-linha::after\s*{[^}]*animation:\s*none/);
  });

  it('@spec:AC-230 anima somente transform e opacity, sem propriedades de layout', () => {
    const animacao = MOVIMENTO.match(/@keyframes brilho-esqueleto[\s\S]*?\n}/)?.[0] ?? '';
    expect(animacao).toMatch(/transform:/);
    expect(animacao).toMatch(/opacity:/);
    expect(animacao).not.toMatch(/(?:width|height|left|right|top|bottom|margin|padding):/);
  });
});

describe('Paginador', () => {
  function montar(pagina: number, aoMudarPagina = vi.fn()) {
    const { container } = render(
      <Paginador pagina={pagina} totalPaginas={14} totalItens={135} itensPorPagina={10} aoMudarPagina={aoMudarPagina} />,
    );
    return {
      elemento: container,
      anterior: container.querySelector('[data-anterior]') as HTMLButtonElement,
      proxima: container.querySelector('[data-proxima]') as HTMLButtonElement,
    };
  }

  it('@spec:AC-224 informa posição, faixa e desabilita os controles nos limites', () => {
    let { elemento, anterior, proxima } = montar(1);
    expect(elemento.querySelector('[data-pagina]')?.textContent).toContain('Página 1 de 14');
    expect(elemento.querySelector('[data-faixa]')?.textContent).toContain('1–10 de 135');
    expect(anterior.disabled).toBe(true);
    expect(proxima.disabled).toBe(false);

    ({ elemento, anterior, proxima } = montar(14));
    expect(elemento.querySelector('[data-faixa]')?.textContent).toContain('131–135 de 135');
    expect(anterior.disabled).toBe(false);
    expect(proxima.disabled).toBe(true);
  });

  it('@spec:AC-224 emite a nova página apenas quando o avanço está disponível', () => {
    const aoMudarPagina = vi.fn();
    const { anterior, proxima } = montar(2, aoMudarPagina);

    fireEvent.click(anterior);
    fireEvent.click(proxima);
    expect(aoMudarPagina.mock.calls.map(([pagina]) => pagina)).toEqual([1, 3]);
  });
});

describe('Selo de situação', () => {
  it('@spec:AC-222 todas as variantes comunicam por texto e símbolo além da cor', () => {
    const variantes: VarianteSelo[] = ['alta', 'baixa', 'estavel', 'sucesso', 'aviso', 'erro'];
    const simbolos = new Set<string>();

    for (const variante of variantes) {
      const { container, unmount } = render(<Selo variante={variante} texto={`Situação ${variante}`} />);
      const elemento = container.querySelector('[data-selo]') as HTMLElement;
      const icone = elemento.querySelector('svg[data-icone]');

      expect(elemento.textContent).toContain(`Situação ${variante}`);
      expect(icone?.getAttribute('aria-hidden')).toBe('true');
      expect(elemento.getAttribute('data-variante')).toBe(variante);
      simbolos.add(icone?.getAttribute('data-icone') ?? '');
      unmount();
    }

    expect(simbolos.has('')).toBe(false);
    expect(simbolos.size).toBe(6);
  });
});

