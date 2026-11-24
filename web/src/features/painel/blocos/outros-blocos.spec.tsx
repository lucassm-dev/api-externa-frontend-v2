import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { CarteiraResumida, Movimentacao } from '../painel.model';
import { decidirProximoPasso } from '../proximo-passo';
import { CarteirasDoInvestidor, ConviteProximoPasso, UltimasMovimentacoes } from './outros-blocos';

const comRotas = (conteudo: ReactNode) => render(<MemoryRouter>{conteudo}</MemoryRouter>).container;

function carteira(id: number, nome: string, nomeCorretora: string): CarteiraResumida {
  return { id, investidorId: 1, corretoraId: 1, nomeCorretora, mercado: 'BR', moeda: 'BRL', nome, ativa: true };
}

describe('Cartões das carteiras', () => {
  it('@spec:AC-057 os cartões saem na ordem recebida, da mais recente para a mais antiga', () => {
    const elemento = comRotas(
      <CarteirasDoInvestidor carteiras={[carteira(9, 'Longo prazo', 'XP'), carteira(4, 'Dividendos', 'Rico'), carteira(2, 'Primeira', 'Clear')]} />,
    );
    expect([...elemento.querySelectorAll('[data-carteira]')].map((cartao) => cartao.getAttribute('data-carteira'))).toEqual(['9', '4', '2']);
  });

  it('@spec:AC-058 cada cartão traz nome, corretora e o atalho que abre aquela carteira', () => {
    const cartao = comRotas(<CarteirasDoInvestidor carteiras={[carteira(9, 'Longo prazo', 'XP')]} />).querySelector('[data-carteira="9"]')!;

    expect(cartao.querySelector('[data-nome]')?.textContent).toContain('Longo prazo');
    expect(cartao.querySelector('[data-corretora]')?.textContent).toContain('XP');
    expect(cartao.querySelector('[data-abrir]')?.getAttribute('href')).toBe('/carteiras/9');
  });
});

describe('Convite do próximo passo', () => {
  const montar = (estado: { catalogoTemCorretora: boolean; temCarteira: boolean; temOperacao: boolean }) =>
    comRotas(<ConviteProximoPasso passo={decidirProximoPasso(estado)!} />);

  it('@spec:AC-060 sem corretora no catálogo o convite é cadastrar corretora, com o atalho', () => {
    const elemento = montar({ catalogoTemCorretora: false, temCarteira: false, temOperacao: false });

    expect(elemento.querySelector('[data-proximo-passo]')?.getAttribute('data-passo')).toBe('cadastrar-corretora');
    expect(elemento.querySelector('[data-titulo]')?.textContent).toContain('corretora');
    expect(elemento.querySelector('[data-acao]')?.getAttribute('href')).toBe('/corretoras');
  });

  it('@spec:AC-061 com corretora e sem carteira o convite é criar carteira', () => {
    const elemento = montar({ catalogoTemCorretora: true, temCarteira: false, temOperacao: false });

    expect(elemento.querySelector('[data-proximo-passo]')?.getAttribute('data-passo')).toBe('criar-carteira');
    expect(elemento.querySelector('[data-acao]')?.getAttribute('href')).toBe('/carteiras');
  });

  it('@spec:AC-062 com carteira e sem operação o convite é registrar a primeira compra', () => {
    const elemento = montar({ catalogoTemCorretora: true, temCarteira: true, temOperacao: false });

    expect(elemento.querySelector('[data-proximo-passo]')?.getAttribute('data-passo')).toBe('registrar-compra');
    expect(elemento.querySelector('[data-acao]')?.getAttribute('href')).toBe('/operacoes');
  });

  it('@spec:AC-241 painel sem carteira mostra o estado vazio: ícone, explicação e a ação seguinte', () => {
    const convite = montar({ catalogoTemCorretora: true, temCarteira: false, temOperacao: false }).querySelector('[data-proximo-passo]')!;

    expect(convite.querySelector('[data-icone]')?.getAttribute('aria-hidden')).toBe('true');
    expect(convite.querySelector('[data-explicacao]')?.textContent?.trim().length).toBeGreaterThan(0);
    const acao = convite.querySelector('[data-acao]') as HTMLAnchorElement;
    expect(acao.textContent).toContain('Criar carteira');
    expect(acao.getAttribute('href')).toBe('/carteiras');
  });

  it('@spec:AC-064 o convite é um só, nunca uma lista de pendências', () => {
    const elemento = montar({ catalogoTemCorretora: false, temCarteira: false, temOperacao: false });

    expect(elemento.querySelectorAll('[data-proximo-passo]')).toHaveLength(1);
    expect(elemento.querySelectorAll('[data-acao]')).toHaveLength(1);
  });
});

function movimentacao(id: number, extra: Partial<Movimentacao> = {}): Movimentacao {
  return { id, dataHora: '2026-09-08T13:05:00', tipo: 'COMPRA', ticker: 'PETR4', quantidade: 100, precoUnitario: 38.4, valorTotal: 3840, moeda: 'BRL', ...extra };
}

describe('Últimas movimentações do painel', () => {
  const montar = (movimentacoes: Movimentacao[]) => comRotas(<UltimasMovimentacoes movimentacoes={movimentacoes} />);

  it('@spec:AC-059 exibe no máximo cinco linhas, mesmo recebendo mais', () => {
    expect(montar(Array.from({ length: 8 }, (_, i) => movimentacao(i + 1))).querySelectorAll('[data-movimentacao]')).toHaveLength(5);
  });

  it('@spec:AC-059 cada linha traz quando, tipo, ticker e total, e há atalho para o extrato', () => {
    const elemento = montar([movimentacao(1)]);
    const linha = elemento.querySelector('[data-movimentacao="1"]')!;

    expect(linha.querySelector('[data-quando]')?.textContent).toContain('08/09/2026');
    expect(linha.querySelector('[data-tipo]')?.textContent).toContain('COMPRA');
    expect(linha.querySelector('[data-ticker]')?.textContent).toContain('PETR4');
    expect(linha.querySelector('[data-total]')?.textContent).toContain('3.840,00');
    expect(elemento.querySelector('[data-ver-extrato]')?.getAttribute('href')).toBe('/operacoes');
  });

  it('@spec:AC-059 campo que o servidor não mandou some da linha, sem quebrar o bloco', () => {
    const linha = montar([movimentacao(1, { ticker: undefined, quantidade: undefined, valorTotal: undefined })]).querySelector('[data-movimentacao="1"]')!;

    expect(linha.querySelector('[data-ticker]')).toBeNull();
    expect(linha.querySelector('[data-total]')).toBeNull();
    expect(linha.querySelector('[data-quando]')).not.toBeNull();
  });

  it('@spec:AC-240 traz o monograma do ativo ao lado do ticker', () => {
    const ativo = montar([movimentacao(1, { ticker: 'PETR4' })]).querySelector('[data-movimentacao="1"] .ativo')!;

    expect(ativo.querySelector('[data-monograma]')?.getAttribute('aria-label')).toContain('PETR4');
    expect(ativo.querySelector('[data-ticker]')?.textContent).toContain('PETR4');
  });

  it('@spec:AC-240 sem ticker não há monograma na linha', () => {
    const linha = montar([movimentacao(1, { ticker: undefined })]).querySelector('[data-movimentacao="1"]')!;

    expect(linha.querySelector('[data-monograma]')).toBeNull();
    expect(linha.querySelector('.ativo')).toBeNull();
  });

  it('@spec:AC-240 o tipo da operação aparece como selo com o texto', () => {
    const tipo = montar([movimentacao(1, { tipo: 'COMPRA' })]).querySelector('[data-tipo="COMPRA"]')!;

    expect(tipo.querySelector('[data-selo]')).not.toBeNull();
    expect(tipo.textContent).toContain('COMPRA');
  });

  it('@spec:AC-240 o selo do tipo distingue compra de venda pela variante', () => {
    expect(montar([movimentacao(1, { tipo: 'COMPRA' })]).querySelector('[data-tipo="COMPRA"] [data-selo]')?.getAttribute('data-variante')).toBe('alta');
    expect(montar([movimentacao(2, { tipo: 'VENDA' })]).querySelector('[data-tipo="VENDA"] [data-selo]')?.getAttribute('data-variante')).toBe('baixa');
  });
});
