import { render } from '@testing-library/react';
import { MensagemFeedback } from './mensagem-feedback';
import { NivelFeedback } from './feedback.model';
import { FeedbackService } from './feedback.service';

function renderizar(nivel: NivelFeedback, mensagem: string, codigo: string | null = null): HTMLElement {
  const { container } = render(<MensagemFeedback nivel={nivel} mensagem={mensagem} codigo={codigo} />);
  return container.querySelector('[data-nivel]') as HTMLElement;
}

describe('Os três níveis de comunicação', () => {
  it('@spec:AC-006 informação, aviso e erro se apresentam de forma distinta e anunciável', () => {
    const informacao = renderizar('informacao', 'Cotação de 11:45');
    const aviso = renderizar('aviso', 'Operação registrada com o preço de 15 minutos atrás');
    const erro = renderizar('erro', 'Você não tem posição nesta ação para vender.');

    const niveis = [informacao, aviso, erro].map((el) => el.getAttribute('data-nivel'));
    expect(new Set(niveis).size).toBe(3);

    const rotulos = [informacao, aviso, erro].map((el) => el.querySelector('[data-rotulo]')?.textContent?.trim());
    expect(new Set(rotulos).size).toBe(3);
    expect(rotulos).toEqual(['Informação', 'Aviso', 'Erro']);

    expect(erro.getAttribute('role')).toBe('alert');
    expect(aviso.getAttribute('role')).not.toBe('alert');
    expect(informacao.getAttribute('role')).not.toBe('alert');
  });

  it('@spec:AC-212 sucesso tem rótulo e papel próprios sem depender da cor', () => {
    const sucesso = renderizar('sucesso', 'Operação registrada.');

    expect(sucesso.getAttribute('data-nivel')).toBe('sucesso');
    expect(sucesso.getAttribute('role')).toBe('status');
    expect(sucesso.querySelector('[data-rotulo]')?.textContent?.trim()).toBe('Sucesso');
    expect(sucesso.querySelector('[data-icone="sucesso"]')).toBeTruthy();
  });

  it('@spec:AC-215 cada nível usa um ícone SVG próprio, decorativo, e mantém o rótulo', () => {
    const niveis: NivelFeedback[] = ['informacao', 'aviso', 'erro', 'sucesso'];
    const icones: string[] = [];

    for (const nivel of niveis) {
      const mensagem = renderizar(nivel, 'texto');
      const icone = mensagem.querySelector('svg[data-icone]');
      icones.push(icone?.getAttribute('data-icone') ?? '');
      expect(icone?.getAttribute('aria-hidden')).toBe('true');
      expect(mensagem.querySelector('[data-rotulo]')?.textContent?.trim()).toBeTruthy();
    }

    expect(new Set(icones).size).toBe(4);
    expect(icones.every(Boolean)).toBe(true);
  });

  it('@spec:AC-214 a apresentação de falha conserva mensagem e código em regiões distintas', () => {
    const erro = renderizar('erro', 'Não foi possível registrar.', 'OPE-409');

    expect(erro.querySelector('[data-mensagem]')?.textContent).toContain('Não foi possível registrar.');
    expect(erro.querySelector('[data-codigo]')?.textContent).toContain('OPE-409');
  });

  it('@spec:AC-006 cada nível traz um símbolo próprio, então nada depende só de cor', () => {
    const simbolos: (string | undefined)[] = [];
    for (const nivel of ['informacao', 'aviso', 'erro'] as NivelFeedback[]) {
      const el = renderizar(nivel, 'texto');
      simbolos.push(el.querySelector('svg[data-icone]')?.getAttribute('data-icone') ?? undefined);
    }

    expect(new Set(simbolos).size).toBe(3);
    expect(simbolos.every((s) => !!s)).toBe(true);
  });

  it('@spec:AC-006 o código do erro aparece discreto no rodapé, nunca como texto principal', () => {
    const erro = renderizar('erro', 'Algo deu errado do nosso lado. Tente novamente.', 'XYZ-999');

    const rodape = erro.querySelector('[data-codigo]');
    expect(rodape?.textContent).toContain('XYZ-999');
    expect(erro.querySelector('[data-mensagem]')?.textContent).not.toContain('XYZ-999');
  });

  it('@spec:AC-007 sucesso com avisos vira aviso, nunca erro', () => {
    const feedback = new FeedbackService();

    feedback.sucessoComAvisos('Compra registrada.', [
      'O preço usado é de 15 minutos atrás.',
      'A cotação do dólar usa a taxa de 11:30.',
    ]);

    const mensagens = feedback.mensagens();
    expect(mensagens.some((m) => m.nivel === 'erro')).toBe(false);
    expect(mensagens.filter((m) => m.nivel === 'aviso')).toHaveLength(2);
    expect(mensagens.some((m) => m.nivel === 'informacao' && m.texto === 'Compra registrada.')).toBe(true);
  });

  it('@spec:AC-007 aviso não bloqueia e erro bloqueia', () => {
    const feedback = new FeedbackService();

    feedback.avisar('O preço usado é de 15 minutos atrás.');
    feedback.errar('Não foi possível conectar ao sistema.', 'SYS-001');

    const [aviso, erro] = feedback.mensagens();
    expect(aviso.bloqueia).toBe(false);
    expect(erro.bloqueia).toBe(true);
  });
});
