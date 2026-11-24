import { fireEvent, render, waitFor } from '@testing-library/react';
import { traduzirErro } from '@/core/erros/tradutor-erro';
import { esperarElemento, json, simularServidor, type Chamada } from '@/test/servidor';
import { DesfechoDoRegistro, FormularioOperacao, PedidoDeRegistro } from './formulario-operacao';
import { TipoOperacao } from './operacoes.model';

const AGORA = new Date().toISOString();
const pagina = (content: unknown[]) => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 200 });
const carteira = (id: number, nome: string) => ({ id, investidorId: 1, corretoraId: 7, nomeCorretora: 'XP', mercado: 'BR', moeda: 'BRL', nome, ativa: true });
const acao = (id: number, ticker: string, nomeEmpresa: string, cotacaoAtual: number) => ({ id, ticker, nomeEmpresa, mercado: 'BR', moeda: 'BRL', cotacaoAtual, dataHoraCotacao: AGORA });
const posicao = (ticker: string, quantidade: number) => ({ id: 1, ticker, nomeEmpresa: `Empresa ${ticker}`, quantidade, precoMedio: 10, cotacaoAtual: 12, dataHoraCotacao: AGORA, rentabilidadeNaoRealizada: 0 });

const CARTEIRAS = [carteira(9, 'Dividendos'), carteira(10, 'Cripto')];
const CATALOGO = [acao(1, 'PETR4', 'Petrobras', 32.5), acao(2, 'VALE3', 'Vale', 60), acao(3, 'MGLU3', 'Magazine Luiza', 2)];

const caminho = (chamada: Chamada) => new URL(chamada.url, 'http://localhost').pathname;
const busca = (chamada: Chamada) => new URL(chamada.url, 'http://localhost').searchParams;

interface Cenario {
  carteiras?: unknown[];
  posicoes?: Record<number, unknown[]>;
  /** Responde a leitura das posições de uma carteira só quando o teste mandar. */
  segurarPosicoesDe?: number;
  desfecho?: DesfechoDoRegistro;
}

afterEach(() => vi.unstubAllGlobals());

async function montar(cenario: Cenario = {}, tipoInicial: TipoOperacao = 'COMPRA') {
  const posicoes = cenario.posicoes ?? { 9: [posicao('PETR4', 100)], 10: [posicao('VALE3', 20)] };
  const servidor = simularServidor((chamada) => {
    const rota = caminho(chamada);
    if (rota === '/carteiras') return json(pagina(cenario.carteiras ?? CARTEIRAS));
    if (rota === '/acoes') return json(pagina(CATALOGO));
    const id = Number(rota.split('/')[2]);
    if (id === cenario.segurarPosicoesDe) return servidor.segurar();
    return json(posicoes[id] ?? []);
  });
  const pedidos: PedidoDeRegistro[] = [];
  const { container: raiz } = render(
    <FormularioOperacao
      carteiraInicial={null}
      tipoInicial={tipoInicial}
      enviando={false}
      aoRegistrar={async (pedido) => {
        pedidos.push(pedido);
        return cenario.desfecho ?? true;
      }}
    />,
  );
  await waitFor(() => expect(raiz.querySelectorAll('[data-campo-acao] option')).toHaveLength(CATALOGO.length + 1));

  const campo = <T extends HTMLElement = HTMLInputElement>(seletor: string) => raiz.querySelector(seletor) as T;
  const mudar = (seletor: string, valor: string) => fireEvent.change(campo(seletor), { target: { value: valor } });
  const opcoesDeAcao = () => [...raiz.querySelectorAll('[data-campo-acao] option')].map((opcao) => opcao.getAttribute('value')).filter(Boolean);
  const leiturasDePosicoes = (id: number) => servidor.chamadas.filter((chamada) => caminho(chamada) === `/carteiras/${id}/posicoes`).length;

  const escolherTipo = (tipo: TipoOperacao) => fireEvent.click(campo(`[data-tipo="${tipo}"] input`));
  const escolherCarteira = async (id: number) => {
    const antes = leiturasDePosicoes(id);
    mudar('[data-campo-carteira]', String(id));
    await waitFor(() => expect(leiturasDePosicoes(id)).toBe(antes + 1));
    await waitFor(() => expect(campo('[data-campo-carteira]').closest('form')).toBeTruthy());
  };
  const confirmar = () => fireEvent.click(campo('[data-confirmar]'));
  const botaoDesabilitado = () => campo<HTMLButtonElement>('[data-confirmar]').disabled;

  return { raiz, servidor, pedidos, campo, mudar, opcoesDeAcao, leiturasDePosicoes, escolherTipo, escolherCarteira, confirmar, botaoDesabilitado };
}

describe('Formulário de compra e venda', () => {
  it('@spec:AC-150 o tipo é um par de opções lado a lado, marcado sem interação', async () => {
    const { raiz } = await montar();
    const seletor = raiz.querySelector('[data-seletor-tipo]')!;

    expect(seletor.tagName).not.toBe('SELECT');
    expect(seletor.querySelector('select')).toBeNull();
    expect(seletor.querySelectorAll('[data-tipo]')).toHaveLength(2);
    expect(seletor.querySelectorAll('[data-marcada="sim"]')).toHaveLength(1);
    expect(raiz.querySelector('[data-tipo="COMPRA"][data-marcada="sim"]')).toBeTruthy();
  });

  it('@spec:AC-151 trocar o tipo preserva a carteira e limpa quantidade e preço', async () => {
    const tela = await montar();
    await tela.escolherCarteira(9);
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '100');
    fireEvent.click(tela.campo('[data-preco-manual]'));
    tela.mudar('[data-campo-preco]', '31.5');

    tela.escolherTipo('VENDA');

    expect(tela.campo<HTMLSelectElement>('[data-campo-carteira]').value).toBe('9');
    expect(tela.campo('[data-campo-quantidade]').value).toBe('');
    expect(tela.campo('[data-campo-preco]')).toBeNull();
    expect(tela.campo('[data-preco-manual]').checked).toBe(false);
  });

  it('@spec:AC-152 na compra a ação vem do catálogo inteiro', async () => {
    const tela = await montar();
    await tela.escolherCarteira(9);

    expect(tela.opcoesDeAcao()).toEqual(['PETR4', 'VALE3', 'MGLU3']);
  });

  it('@spec:AC-153 o botão diz qual operação será registrada em cada tipo', async () => {
    const tela = await montar();
    const rotulo = () => tela.campo('[data-confirmar]').textContent!.trim();

    expect(rotulo()).toBe('Registrar compra');
    tela.escolherTipo('VENDA');
    expect(rotulo()).toBe('Registrar venda');
  });

  it('@spec:AC-154 confirmar a compra emite carteira, ticker e quantidade, sem preço', async () => {
    const tela = await montar();
    await tela.escolherCarteira(9);
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '100');

    tela.confirmar();

    await waitFor(() => expect(tela.pedidos).toEqual([{ tipo: 'COMPRA', operacao: { carteiraId: 9, ticker: 'PETR4', quantidade: 100 } }]));
  });

  it('@spec:AC-156 depois de registrar, a carteira fica, a quantidade sai e as posições são relidas', async () => {
    const tela = await montar();
    await tela.escolherCarteira(9);
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '100');

    tela.confirmar();

    await waitFor(() => expect(tela.leiturasDePosicoes(9)).toBe(2));
    expect(tela.campo<HTMLSelectElement>('[data-campo-carteira]').value).toBe('9');
    expect(tela.campo('[data-campo-quantidade]').value).toBe('');
    expect(tela.campo('[data-confirmar]')).toBeTruthy();
  });

  it('@spec:AC-157 na venda só aparecem ações com posição na carteira escolhida', async () => {
    const tela = await montar({ posicoes: { 9: [posicao('PETR4', 100), posicao('VALE3', 50)] } });
    tela.escolherTipo('VENDA');
    await tela.escolherCarteira(9);

    await waitFor(() => expect(tela.opcoesDeAcao()).toEqual(['PETR4', 'VALE3']));
  });

  it('@spec:AC-157 carteira sem posição aberta diz que não há o que vender', async () => {
    const tela = await montar({ posicoes: { 9: [] } });
    tela.escolherTipo('VENDA');
    await tela.escolherCarteira(9);

    await waitFor(() => expect(tela.raiz.querySelector('[data-sem-posicao]')).toBeTruthy());
  });

  it('@spec:AC-158 a venda mostra o disponível e impede exceder a posição', async () => {
    const tela = await montar();
    tela.escolherTipo('VENDA');
    await tela.escolherCarteira(9);
    await waitFor(() => expect(tela.opcoesDeAcao()).toEqual(['PETR4']));
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '10');

    expect(tela.raiz.querySelector('[data-disponivel]')!.textContent).toContain('100');

    tela.mudar('[data-campo-quantidade]', '150');
    expect(tela.raiz.querySelector('[data-excede-posicao]')!.textContent).toContain('100');
    expect(tela.botaoDesabilitado()).toBe(true);
    tela.confirmar();
    expect(tela.pedidos).toEqual([]);
  });

  it('@spec:AC-159 trocar a carteira na venda descarta ação e quantidade anteriores', async () => {
    const tela = await montar();
    tela.escolherTipo('VENDA');
    await tela.escolherCarteira(9);
    await waitFor(() => expect(tela.opcoesDeAcao()).toEqual(['PETR4']));
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '10');

    await tela.escolherCarteira(10);

    await waitFor(() => expect(tela.opcoesDeAcao()).toEqual(['VALE3']));
    expect(tela.campo<HTMLSelectElement>('[data-campo-acao]').value).toBe('');
    expect(tela.campo('[data-campo-quantidade]').value).toBe('');
  });

  it('@spec:AC-161 OPE-004 destaca a quantidade e mantém o formulário preenchido', async () => {
    const recusa = traduzirErro({ status: 422, error: { timestamp: AGORA, status: 422, codigo: 'OPE-004', error: 'erro', message: 'recusado', path: '/operacoes/venda' } });
    const tela = await montar({ desfecho: recusa });
    await tela.escolherCarteira(9);
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '150');

    tela.confirmar();

    const destaque = await esperarElemento(() => tela.raiz.querySelector('[data-erro-quantidade]'));
    expect(destaque.textContent).toContain('100');
    expect(tela.campo('[data-campo-quantidade]').getAttribute('aria-invalid')).toBe('true');
    expect(tela.campo<HTMLSelectElement>('[data-campo-acao]').value).toBe('PETR4');
    expect(tela.campo('[data-campo-quantidade]').value).toBe('150');
  });

  it('@spec:AC-306 OPE-004 relê a carteira e diz a quantidade real, nunca o marcador cru', async () => {
    const recusa = traduzirErro({ status: 422, error: { timestamp: AGORA, status: 422, codigo: 'OPE-004', error: 'erro', message: 'recusado', path: '/operacoes/venda' } });
    expect(recusa.mensagem).toContain('{quantidade}');
    const posicoes = { 9: [posicao('PETR4', 100)] };
    const tela = await montar({ desfecho: recusa, posicoes });
    tela.escolherTipo('VENDA');
    await tela.escolherCarteira(9);
    await waitFor(() => expect(tela.opcoesDeAcao()).toEqual(['PETR4']));
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '90');
    posicoes[9] = [posicao('PETR4', 80)]; // outra aba vendeu 20 enquanto o formulário estava aberto

    tela.confirmar();

    const destaque = await esperarElemento(() => tela.raiz.querySelector('[data-erro-quantidade]'));
    expect(tela.leiturasDePosicoes(9)).toBe(2);
    expect(destaque.textContent).toBe('Você tem apenas 80 unidades desta ação.');
    expect(tela.raiz.textContent).not.toContain('{quantidade}');
  });

  it('@spec:AC-162 o campo de preço não vem aberto — só o controle de opt-in', async () => {
    const { raiz } = await montar();

    expect(raiz.querySelector('[data-campo-preco]')).toBeNull();
    expect(raiz.querySelector('[data-preco-manual]')).toBeTruthy();
  });

  it('@spec:AC-163 ativar o preço manual abre o campo e o preço vai na operação', async () => {
    const tela = await montar();
    await tela.escolherCarteira(9);
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '10');
    fireEvent.click(tela.campo('[data-preco-manual]'));
    tela.mudar('[data-campo-preco]', '31.5');

    tela.confirmar();

    await waitFor(() => expect(tela.pedidos[0]?.operacao.precoUnitario).toBe(31.5));
  });

  it('@spec:AC-163 desativar o preço manual devolve a operação ao preço de mercado', async () => {
    const tela = await montar();
    await tela.escolherCarteira(9);
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '10');
    fireEvent.click(tela.campo('[data-preco-manual]'));
    tela.mudar('[data-campo-preco]', '31.5');
    fireEvent.click(tela.campo('[data-preco-manual]'));

    tela.confirmar();

    await waitFor(() => expect(tela.pedidos).toHaveLength(1));
    expect('precoUnitario' in tela.pedidos[0].operacao).toBe(false);
  });

  it('@spec:AC-164 preço manual com três casas não sai da tela e é acusado', async () => {
    const tela = await montar();
    await tela.escolherCarteira(9);
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '10');
    fireEvent.click(tela.campo('[data-preco-manual]'));
    tela.mudar('[data-campo-preco]', '31.555');

    expect(tela.raiz.querySelector('[data-preco-casas]')!.textContent).toContain('no máximo 2 casas decimais');
    tela.confirmar();
    expect(tela.pedidos).toEqual([]);
  });

  it('@spec:AC-165 a estimativa aparece com o horário da cotação e declarada como estimativa', async () => {
    const tela = await montar();
    await tela.escolherCarteira(9);
    tela.mudar('[data-campo-acao]', 'PETR4');
    tela.mudar('[data-campo-quantidade]', '100');

    const bloco = tela.raiz.querySelector('[data-estimativa]')!;
    expect(bloco.querySelector('[data-valor-com-horario]')).toBeTruthy();
    expect(tela.raiz.querySelector('[data-total-estimado]')!.textContent).toContain('3.250,00');
    expect(tela.raiz.querySelector('[data-ressalva-estimativa]')!.textContent).toContain('estimativa');
  });

  it('@spec:AC-308 as listas de carteira e de ação pedem até 200 itens, não só os 20 primeiros', async () => {
    const vinteECinco = Array.from({ length: 25 }, (_, indice) => carteira(indice + 1, `Carteira ${indice + 1}`));
    const tela = await montar({ carteiras: vinteECinco });

    for (const rota of ['/carteiras', '/acoes']) {
      const leitura = tela.servidor.chamadas.find((chamada) => caminho(chamada) === rota)!;
      expect(busca(leitura).get('size'), rota).toBe('200');
    }
    await waitFor(() => expect(tela.raiz.querySelectorAll('[data-campo-carteira] option:not([value=""])')).toHaveLength(25));
  });

  it('@spec:AC-309 a resposta atrasada da carteira anterior é descartada', async () => {
    const tela = await montar({ segurarPosicoesDe: 9 });
    tela.escolherTipo('VENDA');
    tela.mudar('[data-campo-carteira]', '9');
    await waitFor(() => expect(tela.leiturasDePosicoes(9)).toBe(1));

    await tela.escolherCarteira(10);
    await waitFor(() => expect(tela.opcoesDeAcao()).toEqual(['VALE3']));
    tela.servidor.liberar(json([posicao('PETR4', 100)]));

    await new Promise((resolver) => setTimeout(resolver, 20));
    expect(tela.opcoesDeAcao()).toEqual(['VALE3']);
    expect(tela.campo<HTMLSelectElement>('[data-campo-carteira]').value).toBe('10');
  });
});
