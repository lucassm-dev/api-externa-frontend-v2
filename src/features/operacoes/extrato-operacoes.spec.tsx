import { fireEvent, render } from '@testing-library/react';
import { Carteira } from '@/features/carteiras/carteiras.model';
import { esperarElemento } from '@/test/servidor';
import { ExtratoOperacoes } from './extrato-operacoes';
import { OperacaoDoExtrato } from './operacoes.model';

const CARTEIRAS: Carteira[] = [{ id: 9, investidorId: 1, corretoraId: 7, nomeCorretora: 'XP', mercado: 'BR', moeda: 'BRL', nome: 'Dividendos', ativa: true }];

const COMPRA: OperacaoDoExtrato = {
  id: 1,
  carteiraId: 9,
  ticker: 'PETR4',
  tipo: 'COMPRA',
  quantidade: 100,
  precoUnitario: 32.5,
  valorTotal: 3250,
  dataHora: '2026-09-09T10:00:00',
  moeda: 'BRL',
};

const VENDA: OperacaoDoExtrato = { ...COMPRA, id: 2, tipo: 'VENDA', quantidade: 50, precoUnitario: 40, valorTotal: 2000, dataHora: '2026-09-09T11:00:00', lucroRealizado: 500 };

interface Entradas {
  pagina?: number;
  totalDePaginas?: number;
  totalDeItens?: number;
  carregando?: boolean;
}

function montar(operacoes: OperacaoDoExtrato[], entradas: Entradas = {}) {
  const eventos = { paginas: [] as number[], editadas: [] as OperacaoDoExtrato[], excluidas: [] as OperacaoDoExtrato[], primeiras: 0 };
  const { container } = render(
    <ExtratoOperacoes
      operacoes={operacoes}
      carteiras={CARTEIRAS}
      totalDeItens={60}
      {...entradas}
      aoMudarPagina={(pagina) => eventos.paginas.push(pagina)}
      aoEditar={(operacao) => eventos.editadas.push(operacao)}
      aoExcluir={(operacao) => eventos.excluidas.push(operacao)}
      aoRegistrarPrimeira={() => eventos.primeiras++}
    />,
  );
  return { raiz: container, eventos };
}

const botao = (raiz: HTMLElement, seletor: string) => raiz.querySelector(`${seletor} button`) as HTMLButtonElement;

describe('Extrato de operações', () => {
  it('@spec:AC-169 cada linha traz data e hora, carteira, tipo, ticker, quantidade, preço, total e moeda', () => {
    const linha = montar([COMPRA]).raiz.querySelector('[data-operacao="1"]')!;

    expect(linha.querySelector('[data-quando]')!.textContent).toContain('09/09/2026');
    expect(linha.querySelector('[data-carteira]')!.textContent).toContain('Dividendos');
    expect(linha.querySelector('[data-tipo]')!.textContent).toContain('COMPRA');
    expect(linha.querySelector('[data-ticker]')!.textContent).toContain('PETR4');
    expect(linha.querySelector('[data-quantidade]')!.textContent).toContain('100');
    expect(linha.querySelector('[data-preco]')!.textContent).toContain('32,50');
    expect(linha.querySelector('[data-total]')!.textContent).toContain('3.250,00');
    expect(linha.querySelector('[data-total]')!.textContent).toContain('R$');
  });

  it('@spec:AC-169 as linhas saem na ordem recebida, começando pela mais recente', () => {
    const ids = [...montar([VENDA, COMPRA]).raiz.querySelectorAll('[data-operacao]')].map((linha) => linha.getAttribute('data-operacao'));

    expect(ids).toEqual(['2', '1']);
  });

  it('@spec:AC-169 carteira fora da listagem carregada aparece pelo identificador, nunca em branco', () => {
    const linha = montar([{ ...COMPRA, carteiraId: 31 }]).raiz.querySelector('[data-operacao="1"] [data-carteira]')!;

    expect(linha.textContent).toBe('Carteira 31');
  });

  it('@spec:AC-170 a venda mostra o resultado realizado e a compra não', () => {
    const { raiz } = montar([VENDA, COMPRA]);

    expect(raiz.querySelector('[data-operacao="2"] [data-resultado-realizado]')!.textContent).toContain('500,00');
    expect(raiz.querySelector('[data-operacao="1"] [data-resultado-realizado]')).toBeNull();
  });

  it('@spec:AC-170 venda sem resultado na resposta não exibe traço nem zero', () => {
    const venda = montar([{ ...VENDA, lucroRealizado: undefined }]).raiz.querySelector('[data-operacao="2"]')!;

    expect(venda.querySelector('[data-resultado-realizado]')).toBeNull();
    expect(venda.textContent).not.toContain('—');
    expect(venda.textContent).not.toContain('R$ 0,00');
  });

  it('@spec:AC-171 a paginação diz onde está e pede a página pedida', () => {
    const { raiz, eventos } = montar([COMPRA], { pagina: 1, totalDePaginas: 3 });

    expect(raiz.querySelector('[data-paginacao] [data-pagina]')!.textContent).toContain('Página 2 de 3');
    fireEvent.click(raiz.querySelector('[data-proxima]')!);
    fireEvent.click(raiz.querySelector('[data-anterior]')!);

    expect(eventos.paginas).toEqual([2, 0]);
  });

  it('@spec:AC-171 na primeira página não há anterior, e na última não há próxima', () => {
    expect(montar([COMPRA], { pagina: 0, totalDePaginas: 2 }).raiz.querySelector<HTMLButtonElement>('[data-anterior]')!.disabled).toBe(true);
    expect(montar([COMPRA], { pagina: 1, totalDePaginas: 2 }).raiz.querySelector<HTMLButtonElement>('[data-proxima]')!.disabled).toBe(true);
  });

  it('@spec:AC-179 excluir pede confirmação avisando do recálculo e da ausência de desfazer', async () => {
    const { raiz, eventos } = montar([COMPRA]);

    fireEvent.click(botao(raiz, '[data-excluir]'));
    const dialogo = await esperarElemento(() => document.querySelector('[role="alertdialog"], [role="dialog"]'));

    expect(dialogo.textContent).toContain('recalcular a posição e o resultado da carteira');
    expect(dialogo.textContent).toContain('Não há como desfazer');
    expect(eventos.excluidas).toEqual([]);

    fireEvent.click(document.querySelector('[data-confirmar]')!);
    expect(eventos.excluidas).toEqual([COMPRA]);
  });

  it('@spec:AC-180 cancelar a exclusão fecha a confirmação sem excluir nada', async () => {
    const { raiz, eventos } = montar([COMPRA]);

    fireEvent.click(botao(raiz, '[data-excluir]'));
    fireEvent.click(await esperarElemento(() => document.querySelector('[data-cancelar]')));

    expect(document.querySelector('[data-confirmar]')).toBeNull();
    expect(eventos.excluidas).toEqual([]);
  });

  it('@spec:AC-182 editar avisa quem cuida da operação escolhida', () => {
    const { raiz, eventos } = montar([COMPRA]);

    fireEvent.click(botao(raiz, '[data-editar]'));

    expect(eventos.editadas).toEqual([COMPRA]);
  });

  it('@spec:AC-244 números de valor e quantidade saem alinhados à direita, em fonte de largura fixa e dígitos de mesma largura', () => {
    const linha = montar([COMPRA]).raiz.querySelector('[data-operacao="1"]')!;

    expect(linha.closest('table')?.classList.contains('tabela')).toBe(true);
    for (const seletor of ['[data-quantidade]', '[data-preco]', '[data-total]']) {
      expect(linha.querySelector(seletor)!.hasAttribute('data-numero')).toBe(true);
    }
  });

  it('@spec:AC-246 tipo e resultado aparecem como selo com texto e sinal, nunca só cor', () => {
    const linha = montar([VENDA]).raiz.querySelector('[data-operacao="2"]')!;

    const seloTipo = linha.querySelector('[data-tipo] [data-selo]')!;
    expect(seloTipo.textContent).toContain('VENDA');
    expect(seloTipo.getAttribute('data-variante')).toBe('baixa');
    expect(seloTipo.querySelector('svg')).toBeTruthy();

    const seloResultado = linha.querySelector('[data-resultado-realizado] [data-selo]')!;
    expect(seloResultado.textContent).toContain('500,00');
    expect(seloResultado.getAttribute('data-variante')).toBe('alta');
    expect(seloResultado.querySelector('svg')).toBeTruthy();
  });

  it('@spec:AC-247 a linha do ativo mostra o monograma junto do ticker', () => {
    const celula = montar([COMPRA]).raiz.querySelector('[data-operacao="1"] [data-ticker]')!;

    expect(celula.textContent).toContain('PETR4');
    expect(celula.querySelector('[data-monograma], img')).toBeTruthy();
  });

  it('@spec:AC-248 as ações da linha são botões de ícone com nome acessível da ação e do item', () => {
    const { raiz, eventos } = montar([COMPRA]);
    const editar = botao(raiz, '[data-editar]');
    const excluir = botao(raiz, '[data-excluir]');

    expect(editar.getAttribute('aria-label')).toContain('Editar operação de PETR4 em');
    expect(editar.getAttribute('aria-label')).toContain('09/09/2026');
    expect(excluir.getAttribute('aria-label')).toContain('Excluir operação de PETR4 em');
    expect(editar.textContent?.trim()).toBe('');
    expect(editar.querySelector('svg')).toBeTruthy();
    expect(excluir.querySelector('svg')).toBeTruthy();

    fireEvent.click(editar);
    expect(eventos.editadas).toEqual([COMPRA]);
  });

  it('@spec:AC-249 o rodapé informa página, total de páginas e a faixa de itens, travando as pontas', () => {
    const rodape = montar([COMPRA, VENDA], { pagina: 1, totalDePaginas: 3 }).raiz.querySelector('[data-paginacao]')!;

    expect(rodape.querySelector('[data-pagina]')!.textContent).toContain('Página 2 de 3');
    expect(rodape.querySelector('[data-faixa]')!.textContent).toMatch(/\d+\s*[–-]\s*\d+\s*de\s*\d+/);
  });

  it('@spec:AC-250 carregando mostra o esqueleto com a silhueta das linhas, não uma área em branco', () => {
    const { raiz } = montar([], { carregando: true });

    expect(raiz.querySelector('[data-esqueleto]')!.querySelectorAll('[data-linha]').length).toBeGreaterThan(1);
    expect(raiz.querySelector('table')).toBeNull();
  });

  it('@spec:AC-250 sem resultados mostra o estado vazio com próximo passo, não uma área em branco', () => {
    const { raiz, eventos } = montar([]);
    const vazio = raiz.querySelector('[data-extrato-vazio]')!;

    expect(vazio.textContent!.trim().length).toBeGreaterThan(0);
    expect(raiz.querySelector('table')).toBeNull();
    fireEvent.click(vazio.querySelector('[data-proximo-passo]')!);
    expect(eventos.primeiras).toBe(1);
  });

  it('@spec:AC-243 ordenar uma coluna reordena só a página carregada, sem pedir outra', () => {
    const { raiz, eventos } = montar([COMPRA, VENDA]);
    const ordem = () => [...raiz.querySelectorAll('[data-operacao]')].map((linha) => linha.getAttribute('data-operacao'));

    fireEvent.click(raiz.querySelector('th[aria-sort] button')!);
    expect(ordem()).toEqual(['1', '2']);
    fireEvent.click(raiz.querySelector('th[aria-sort] button')!);
    expect(ordem()).toEqual(['2', '1']);
    expect(raiz.querySelector('th[aria-sort]')!.getAttribute('aria-sort')).toBe('descending');
    expect(eventos.paginas).toEqual([]);
  });
});
