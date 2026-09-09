import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { Carteira } from '../../carteiras/carteiras.model';
import { OperacaoDoExtrato } from '../operacoes.model';
import { ExtratoOperacoes } from './extrato-operacoes';

const ESTILO = 'src/app/features/operacoes/extrato/extrato-operacoes.scss';

const CARTEIRAS: Carteira[] = [
  {
    id: 9,
    investidorId: 1,
    corretoraId: 7,
    nomeCorretora: 'XP',
    mercado: 'BR',
    moeda: 'BRL',
    nome: 'Dividendos',
    ativa: true,
  },
];

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

const VENDA: OperacaoDoExtrato = {
  ...COMPRA,
  id: 2,
  tipo: 'VENDA',
  quantidade: 50,
  precoUnitario: 40,
  valorTotal: 2000,
  dataHora: '2026-09-09T11:00:00',
  lucroRealizado: 500,
};

describe('Extrato de operações', () => {
  let fixture: ComponentFixture<ExtratoOperacoes>;
  let componente: ExtratoOperacoes;
  let elemento: HTMLElement;

  function montar(operacoes: OperacaoDoExtrato[], entradas: Record<string, unknown> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(ExtratoOperacoes);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('operacoes', operacoes);
    fixture.componentRef.setInput('carteiras', CARTEIRAS);
    for (const [chave, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(chave, valor);
    }
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  }

  it('@spec:AC-169 cada linha traz data e hora, carteira, tipo, ticker, quantidade, preço, total e moeda', () => {
    montar([COMPRA]);

    const linha = elemento.querySelector('[data-operacao="1"]')!;
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
    montar([VENDA, COMPRA]);

    const ids = [...elemento.querySelectorAll('[data-operacao]')].map((linha) =>
      linha.getAttribute('data-operacao'),
    );
    expect(ids).toEqual(['2', '1']);
  });

  it('@spec:AC-170 a venda mostra o resultado realizado e a compra não', () => {
    montar([VENDA, COMPRA]);

    const venda = elemento.querySelector('[data-operacao="2"]')!;
    const compra = elemento.querySelector('[data-operacao="1"]')!;
    expect(venda.querySelector('[data-resultado-realizado]')!.textContent).toContain('500,00');
    expect(compra.querySelector('[data-resultado-realizado]')).toBeNull();
  });

  it('@spec:AC-170 venda sem resultado na resposta não exibe traço nem zero', () => {
    montar([{ ...VENDA, lucroRealizado: undefined }]);

    const venda = elemento.querySelector('[data-operacao="2"]')!;
    expect(venda.querySelector('[data-resultado-realizado]')).toBeNull();
    expect(venda.textContent).not.toContain('—');
    expect(venda.textContent).not.toContain('R$ 0,00');
  });

  it('@spec:AC-171 a paginação diz onde está e pede a página pedida', () => {
    montar([COMPRA], { pagina: 1, totalDePaginas: 3 });
    const pedidas: number[] = [];
    componente.mudarPagina.subscribe((pagina) => pedidas.push(pagina));

    expect(elemento.querySelector('[data-paginacao] [data-pagina]')!.textContent).toContain(
      'Página 2 de 3',
    );
    elemento.querySelector<HTMLButtonElement>('[data-proxima]')!.click();
    elemento.querySelector<HTMLButtonElement>('[data-anterior]')!.click();

    expect(pedidas).toEqual([2, 0]);
  });

  it('@spec:AC-171 na primeira página não há anterior, e na última não há próxima', () => {
    montar([COMPRA], { pagina: 0, totalDePaginas: 2 });
    expect(elemento.querySelector<HTMLButtonElement>('[data-anterior]')!.disabled).toBe(true);

    montar([COMPRA], { pagina: 1, totalDePaginas: 2 });
    expect(elemento.querySelector<HTMLButtonElement>('[data-proxima]')!.disabled).toBe(true);
  });

  it('@spec:AC-172 não existe nenhum controle de filtro ou busca no extrato', () => {
    montar([COMPRA, VENDA]);

    expect(elemento.querySelectorAll('select').length).toBe(0);
    expect(elemento.querySelectorAll('input').length).toBe(0);
    expect(elemento.textContent!.toLowerCase()).not.toContain('filtrar');
    expect(elemento.textContent!.toLowerCase()).not.toContain('buscar');
    expect(elemento.textContent!.toLowerCase()).not.toContain('período');
  });

  it('@spec:AC-179 excluir pede confirmação avisando do recálculo e da ausência de desfazer', () => {
    montar([COMPRA]);
    const excluidas: OperacaoDoExtrato[] = [];
    componente.excluir.subscribe((operacao) => excluidas.push(operacao));

    elemento.querySelector<HTMLButtonElement>('[data-excluir] button')!.click();
    fixture.detectChanges();

    const dialogo = elemento.querySelector('[data-confirmar-exclusao]')!;
    expect(dialogo).toBeTruthy();
    expect(dialogo.textContent).toContain('recalcular a posição e o resultado da carteira');
    expect(dialogo.textContent).toContain('Não há como desfazer');
    expect(excluidas).toEqual([]);

    componente.confirmarExclusao();
    expect(excluidas).toEqual([COMPRA]);
  });

  it('@spec:AC-180 cancelar a exclusão fecha a confirmação sem excluir nada', () => {
    montar([COMPRA]);
    const excluidas: OperacaoDoExtrato[] = [];
    componente.excluir.subscribe((operacao) => excluidas.push(operacao));

    componente.pedirExclusao(COMPRA);
    componente.cancelarExclusao();
    fixture.detectChanges();

    expect(elemento.querySelector('[data-confirmar-exclusao]')).toBeNull();
    expect(excluidas).toEqual([]);
  });

  it('@spec:AC-182 editar avisa quem cuida da operação escolhida', () => {
    montar([COMPRA]);
    const editadas: OperacaoDoExtrato[] = [];
    componente.editar.subscribe((operacao) => editadas.push(operacao));

    elemento.querySelector<HTMLButtonElement>('[data-editar] button')!.click();

    expect(editadas).toEqual([COMPRA]);
  });

  it('@spec:AC-244 números de valor e quantidade saem alinhados à direita, em fonte de largura fixa e dígitos de mesma largura', () => {
    montar([COMPRA]);

    const linha = elemento.querySelector('[data-operacao="1"]')!;
    for (const seletor of ['[data-quantidade]', '[data-preco]', '[data-total]']) {
      expect(linha.querySelector(seletor)!.hasAttribute('data-numero')).toBe(true);
    }

    const estilo = readFileSync(ESTILO, 'utf8');
    expect(estilo).toMatch(/\[data-numero\][\s\S]*text-align:\s*right/);
    expect(estilo).toMatch(/\[data-numero\][\s\S]*var\(--fonte-numero\)/);
    expect(estilo).toMatch(/tabular-nums/);
  });

  it('@spec:AC-246 tipo e resultado aparecem como selo com texto e sinal, nunca só cor', () => {
    montar([VENDA]);
    const linha = elemento.querySelector('[data-operacao="2"]')!;

    const seloTipo = linha.querySelector('[data-tipo] [data-selo]')!;
    expect(seloTipo).toBeTruthy();
    expect(seloTipo.textContent).toContain('VENDA');
    expect(seloTipo.getAttribute('data-variante')).toBeTruthy();
    expect(seloTipo.querySelector('svg')).toBeTruthy();

    const seloResultado = linha.querySelector('[data-resultado-realizado] [data-selo]')!;
    expect(seloResultado).toBeTruthy();
    expect(seloResultado.textContent).toContain('500,00');
    expect(seloResultado.getAttribute('data-variante')).toBeTruthy();
    expect(seloResultado.querySelector('svg')).toBeTruthy();
  });

  it('@spec:AC-247 a linha do ativo mostra o monograma junto do ticker', () => {
    montar([COMPRA]);

    const celula = elemento.querySelector('[data-operacao="1"] [data-ticker]')!;
    expect(celula.textContent).toContain('PETR4');
    expect(celula.querySelector('app-monograma')).toBeTruthy();
    expect(celula.querySelector('[data-monograma], img')).toBeTruthy();
  });

  it('@spec:AC-248 as ações da linha são botões de ícone com nome acessível da ação e do item', () => {
    montar([COMPRA]);
    const editadas: OperacaoDoExtrato[] = [];
    componente.editar.subscribe((operacao) => editadas.push(operacao));

    const editar = elemento.querySelector<HTMLButtonElement>('[data-editar] button')!;
    const excluir = elemento.querySelector<HTMLButtonElement>('[data-excluir] button')!;

    expect(editar.tagName).toBe('BUTTON');
    expect(editar.getAttribute('aria-label')).toContain('Editar operação de PETR4 em');
    expect(editar.getAttribute('aria-label')).toContain('09/09/2026');
    expect(excluir.getAttribute('aria-label')).toContain('Excluir operação de PETR4 em');

    // ícone nomeado: nenhum rótulo de texto visível na ação
    expect(editar.textContent?.trim()).toBe('');
    expect(editar.querySelector('svg')).toBeTruthy();
    expect(excluir.querySelector('svg')).toBeTruthy();

    editar.click();
    expect(editadas).toEqual([COMPRA]);
  });

  it('@spec:AC-249 o rodapé informa página, total de páginas e a faixa de itens, travando as pontas', () => {
    montar([COMPRA, VENDA], { pagina: 1, totalDePaginas: 3 });
    const rodape = elemento.querySelector('[data-paginacao]')!;

    expect(rodape.querySelector('[data-pagina]')!.textContent).toContain('Página 2 de 3');
    expect(rodape.querySelector('[data-faixa]')!.textContent).toMatch(
      /\d+\s*[–-]\s*\d+\s*de\s*\d+/,
    );

    montar([COMPRA], { pagina: 0, totalDePaginas: 2 });
    expect(elemento.querySelector<HTMLButtonElement>('[data-anterior]')!.disabled).toBe(true);

    montar([COMPRA], { pagina: 1, totalDePaginas: 2 });
    expect(elemento.querySelector<HTMLButtonElement>('[data-proxima]')!.disabled).toBe(true);
  });

  it('@spec:AC-250 carregando mostra o esqueleto com a silhueta das linhas, não uma área em branco', () => {
    montar([], { carregando: true });

    const esqueleto = elemento.querySelector('[data-esqueleto]')!;
    expect(esqueleto).toBeTruthy();
    expect(esqueleto.querySelectorAll('[data-linha]').length).toBeGreaterThan(1);
    expect(elemento.querySelector('table')).toBeNull();
  });

  it('@spec:AC-250 sem resultados mostra o estado vazio com próximo passo, não uma área em branco', () => {
    montar([]);

    const vazio = elemento.querySelector('[data-extrato-vazio]')!;
    expect(vazio).toBeTruthy();
    expect(vazio.textContent!.trim().length).toBeGreaterThan(0);
    expect(vazio.querySelector('[data-proximo-passo]')).toBeTruthy();
    expect(elemento.querySelector('table')).toBeNull();
  });

  it('extrato vazio não vira erro, e sim estado vazio', () => {
    montar([]);

    expect(elemento.querySelector('[data-extrato-vazio]')).toBeTruthy();
    expect(elemento.querySelector('table')).toBeNull();
  });
});
