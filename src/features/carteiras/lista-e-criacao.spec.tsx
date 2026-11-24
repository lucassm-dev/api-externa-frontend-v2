import { fireEvent, waitFor } from '@testing-library/react';
import { feedback } from '@/core/feedback/feedback.service';
import { Corretora } from '@/features/corretoras/corretoras.model';
import { montarEm } from '@/test/rotas';
import { esperarElemento, json, simularServidor, type Chamada } from '@/test/servidor';
import { classesDe, gerarCss } from '@/test/tailwind';
import { Carteira } from './carteiras.model';
import { CriarCarteira } from './criar-carteira';
import { ListaCarteiras } from './lista-carteiras';

const DIVIDENDOS: Carteira = { id: 9, investidorId: 1, corretoraId: 7, nomeCorretora: 'XP Investimentos', mercado: 'BR', moeda: 'BRL', nome: 'Dividendos', ativa: true };
const SMALL_CAPS: Carteira = { ...DIVIDENDOS, id: 4, nome: 'Small caps', mercado: 'US' };
const CONSOLIDADO = { valorInvestido: 10_000, valorDeMercado: 11_500.5, lucroNaoRealizado: 1_500.5, taxaCambioAtual: 5.42, dataHoraTaxaCambio: '2026-09-09T12:00:00', avisos: [] };
const busca = (url: string) => new URL(url, 'http://localhost').searchParams;

interface Cenario {
  paginas: Carteira[][];
  totalElements?: number;
  consolidadoFalha?: number[];
  excluir?: () => Response;
}

/** O backend da lista: páginas de carteiras, números por carteira e a exclusão. */
function servidorDaLista({ paginas, totalElements, consolidadoFalha = [], excluir }: Cenario) {
  return simularServidor(({ url, metodo }: Chamada) => {
    if (metodo === 'DELETE') return excluir ? excluir() : json(undefined, 204);
    const consolidado = url.match(/^\/carteiras\/(\d+)\/consolidado/);
    if (consolidado) return consolidadoFalha.includes(Number(consolidado[1])) ? json('', 500) : json(CONSOLIDADO);
    if (url.includes('/lucro-realizado')) return json({ total: 320.75, porTicker: { PETR4: 320.75 } });
    const numero = Number(busca(url).get('page'));
    const conteudo = paginas[numero] ?? [];
    return json({ content: conteudo, totalElements: totalElements ?? conteudo.length, totalPages: paginas.length, number: numero, size: 20 });
  });
}

async function abrirLista(cenario: Cenario) {
  const servidor = servidorDaLista(cenario);
  const tela = montarEm({ '/carteiras': <ListaCarteiras />, '/carteiras/nova': <p data-tela-nova />, '/carteiras/:id': <p data-tela-detalhe /> }, '/carteiras');
  await waitFor(() => expect(tela.raiz.querySelector('[data-carteira], [data-proximo-passo]')).not.toBeNull());
  return { ...tela, servidor };
}

const linha = (raiz: HTMLElement, id: number) => raiz.querySelector(`[data-carteira="${id}"]`) as HTMLElement;

afterEach(() => vi.unstubAllGlobals());

describe('Lista de carteiras', () => {
  it('@spec:AC-096 cada linha traz nome, corretora, mercado e os números da carteira', async () => {
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS]] });
    await waitFor(() => expect(linha(raiz, 9).querySelector('[data-realizado]')).not.toBeNull());

    expect(linha(raiz, 9).textContent).toContain('Dividendos');
    expect(linha(raiz, 9).textContent).toContain('XP Investimentos');
    expect(linha(raiz, 9).textContent).toContain('Brasil');
    expect(linha(raiz, 9).querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(linha(raiz, 9).querySelector('[data-nao-realizado]')?.textContent).toContain('1.500,50');
    expect(linha(raiz, 9).querySelector('[data-realizado]')?.textContent).toContain('320,75');
  });

  it('@spec:AC-097 a lista pede a página ordenada da mais recente para a mais antiga', async () => {
    const { servidor } = await abrirLista({ paginas: [[]] });
    expect(busca(servidor.chamadas[0].url).get('sort')).toBe('id,desc');
  });

  it('@spec:AC-097 avançar de página pede a página seguinte ao servidor', async () => {
    const { raiz, servidor } = await abrirLista({ paginas: [[DIVIDENDOS], [SMALL_CAPS]] });

    fireEvent.click(raiz.querySelector('[data-proxima]')!);

    await waitFor(() => expect(servidor.chamadas.some((c) => c.url.startsWith('/carteiras?') && busca(c.url).get('page') === '1')).toBe(true));
  });

  it('@spec:AC-097 a ordem exibida é a que o servidor devolveu', async () => {
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS, SMALL_CAPS]] });
    expect([...raiz.querySelectorAll('[data-carteira]')].map((l) => l.getAttribute('data-carteira'))).toEqual(['9', '4']);
  });

  it('@spec:AC-098 cada linha oferece abrir, renomear e excluir', async () => {
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS]] });
    for (const acao of ['[data-abrir]', '[data-renomear]', '[data-excluir]']) expect(linha(raiz, 9).querySelector(acao)).toBeTruthy();
  });

  it('@spec:AC-099 nada na tela sugere carteiras de outros investidores', async () => {
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS]] });
    expect(raiz.textContent).not.toMatch(/outro investidor|outros investidores|todos os investidores|compartilhad/i);
    expect(raiz.querySelector('[data-busca-investidor]')).toBeNull();
  });

  it('@spec:AC-100 número que falha some da linha, sem derrubar a lista nem alarmar', async () => {
    feedback.limpar();
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS, SMALL_CAPS]], consolidadoFalha: [9] });
    await waitFor(() => expect(linha(raiz, 4).querySelector('[data-valor-de-mercado]')).not.toBeNull());
    await waitFor(() => expect(linha(raiz, 9).querySelector('[data-realizado]')).not.toBeNull());

    expect(raiz.querySelectorAll('[data-carteira]')).toHaveLength(2);
    expect(linha(raiz, 9).querySelector('[data-valor-de-mercado]')).toBeNull();
    expect(linha(raiz, 9).querySelector('[data-realizado]')?.textContent).toContain('320,75');
    expect(linha(raiz, 4).querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(feedback.mensagens().filter((m) => m.nivel === 'erro')).toEqual([]);
    expect(raiz.textContent).not.toMatch(/algo deu errado/i);
  });

  it('@spec:AC-119 excluir faz a carteira sumir, sem lixeira e sem desfazer', async () => {
    const cenario: Cenario = { paginas: [[DIVIDENDOS, SMALL_CAPS]] };
    const { raiz, servidor } = await abrirLista(cenario);

    fireEvent.click(linha(raiz, 9).querySelector('[data-excluir] button')!);
    cenario.paginas[0] = [SMALL_CAPS];
    fireEvent.click(await esperarElemento(() => document.querySelector('[data-confirmar]')));

    await waitFor(() => expect(linha(raiz, 9)).toBeNull());
    expect(servidor.chamadas.find((c) => c.metodo === 'DELETE')?.url).toBe('/carteiras/9');
    expect(raiz.textContent).not.toMatch(/lixeira|desfazer|inativ/i);
  });

  it('@spec:AC-119 a confirmação descreve a consequência antes de excluir', async () => {
    const { raiz, servidor } = await abrirLista({ paginas: [[DIVIDENDOS]] });

    fireEvent.click(linha(raiz, 9).querySelector('[data-excluir] button')!);

    const dialogo = await esperarElemento(() => document.querySelector('[role="alertdialog"]'));
    expect(dialogo.textContent).toMatch(/não há como desfazer/i);
    expect(servidor.chamadas.some((c) => c.metodo === 'DELETE')).toBe(false);
  });

  it('@spec:AC-245 o cartão se destaca sob o ponteiro, e o destaque não é a única pista', async () => {
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS]] });
    const css = await gerarCss(classesDe(linha(raiz, 9)));

    expect(css).toMatch(/:hover[\s\S]*?background-color:/);
    expect(css).toMatch(/border-(style|width):/);
  });

  it('@spec:AC-248 as ações da linha viram botões de ícone com nome acessível da ação e do item', async () => {
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS]] });
    const abrir = linha(raiz, 9).querySelector('[data-abrir]') as HTMLElement;
    const renomear = linha(raiz, 9).querySelector('[data-renomear] button') as HTMLElement;
    const excluir = linha(raiz, 9).querySelector('[data-excluir] button') as HTMLElement;

    expect(abrir.getAttribute('aria-label')).toBe('Abrir carteira Dividendos');
    expect(renomear.getAttribute('aria-label')).toBe('Renomear carteira Dividendos');
    expect(excluir.getAttribute('aria-label')).toBe('Excluir carteira Dividendos');
    expect(abrir.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(linha(raiz, 9).querySelector('[data-renomear] [data-icone]')?.getAttribute('aria-hidden')).toBe('true');
    expect(linha(raiz, 9).querySelector('[data-excluir] [data-icone]')?.getAttribute('aria-hidden')).toBe('true');
    expect(renomear.textContent?.trim()).toBe('');
    expect(excluir.textContent?.trim()).toBe('');
    // O link "Abrir" tem área acionável de pelo menos 24×24 (8 unidades de 4px).
    expect(classesDe(abrir)).toContain('min-w-8');
    expect(await gerarCss(classesDe(abrir))).toMatch(/min-height:\s*var\(--alvo-minimo\)/);
  });

  it('@spec:AC-248 os botões de ícone acionam renomear e excluir', async () => {
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS]] });

    fireEvent.click(linha(raiz, 9).querySelector('[data-renomear] button')!);
    expect(linha(raiz, 9).querySelector('[data-campo-nome]')).not.toBeNull();

    fireEvent.click(linha(raiz, 9).querySelector('[data-excluir] button')!);
    expect(await esperarElemento(() => document.querySelector('[role="alertdialog"]'))).not.toBeNull();
  });

  it('@spec:AC-249 o paginador informa página, total e faixa, desabilitando as pontas', async () => {
    const { raiz } = await abrirLista({ paginas: [[DIVIDENDOS], [DIVIDENDOS], [DIVIDENDOS]], totalElements: 50 });

    expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 1 de 3/);
    expect(raiz.querySelector('[data-faixa]')?.textContent).toMatch(/1.*20.*50/);
    expect(raiz.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(true);
    expect(raiz.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(false);

    fireEvent.click(raiz.querySelector('[data-proxima]')!);
    await waitFor(() => expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 2 de 3/));
    fireEvent.click(raiz.querySelector('[data-proxima]')!);
    await waitFor(() => expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 3 de 3/));
    expect(raiz.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(true);
    expect(raiz.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(false);
  });

  it('@spec:AC-250 carregando mostra esqueleto; sem carteiras mostra estado vazio com próximo passo', async () => {
    const servidor = simularServidor(() => servidor.segurar());
    const { raiz } = montarEm({ '/carteiras': <ListaCarteiras /> }, '/carteiras');

    await waitFor(() => expect(raiz.querySelector('[data-esqueleto]')).not.toBeNull());
    expect(raiz.querySelector('[data-proximo-passo]')).toBeNull();
    servidor.liberar(json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }));

    await waitFor(() => expect(raiz.querySelector('[data-esqueleto]')).toBeNull());
    expect(raiz.querySelector('[data-proximo-passo]')?.textContent).toMatch(/criar carteira/i);
  });

  it('@spec:AC-307 excluir o único item da última página volta à página anterior, sem esvaziar a lista', async () => {
    const cenario: Cenario = { paginas: [[DIVIDENDOS], [SMALL_CAPS]], totalElements: 21 };
    const { raiz } = await abrirLista(cenario);
    fireEvent.click(raiz.querySelector('[data-proxima]')!);
    await waitFor(() => expect(linha(raiz, 4)).not.toBeNull());

    fireEvent.click(linha(raiz, 4).querySelector('[data-excluir] button')!);
    cenario.paginas.splice(1); // a página 2 deixa de existir no servidor
    fireEvent.click(await esperarElemento(() => document.querySelector('[data-confirmar]')));

    await waitFor(() => expect(linha(raiz, 9)).not.toBeNull());
    expect(raiz.querySelector('[data-proximo-passo]')).toBeNull();
    expect(raiz.textContent).not.toContain('Nenhuma carteira ainda');
  });
});

const CORRETORA = { id: 7, cnpj: '02332886000104', razaoSocial: 'XP INVESTIMENTOS CCTVM S.A.', nomeFantasia: 'XP Investimentos' } as Corretora;

async function abrirCriacao(corretoras: Corretora[]) {
  const servidor = simularServidor(({ url, metodo }) =>
    metodo === 'POST' ? json({ ...DIVIDENDOS }) : url.startsWith('/corretoras') ? json({ content: corretoras, totalElements: corretoras.length, totalPages: 1, number: 0, size: 200 }) : json(null, 404),
  );
  const tela = montarEm({ '/carteiras/nova': <CriarCarteira />, '/carteiras/:id': <p data-tela-detalhe />, '/corretoras/nova': <p data-tela-corretora /> }, '/carteiras/nova');
  await waitFor(() => expect(tela.raiz.querySelector('form, [data-sem-corretora]')).not.toBeNull());
  return { ...tela, servidor };
}

function preencher(raiz: HTMLElement, valores: { nome?: string; corretoraId?: string; mercado?: string }) {
  if (valores.nome !== undefined) fireEvent.change(raiz.querySelector('[data-campo-nome]')!, { target: { value: valores.nome } });
  if (valores.corretoraId !== undefined) fireEvent.change(raiz.querySelector('[data-campo-corretora]')!, { target: { value: valores.corretoraId } });
  if (valores.mercado !== undefined) fireEvent.change(raiz.querySelector('[data-campo-mercado]')!, { target: { value: valores.mercado } });
  fireEvent.submit(raiz.querySelector('form')!);
}

describe('Criar carteira', () => {
  it('@spec:AC-091 o formulário pede nome, corretora e mercado, e nada mais', async () => {
    const { raiz } = await abrirCriacao([CORRETORA]);

    expect(raiz.querySelectorAll('input, select, textarea')).toHaveLength(3);
    for (const campo of ['[data-campo-nome]', '[data-campo-corretora]', '[data-campo-mercado]']) expect(raiz.querySelector(campo)).toBeTruthy();
  });

  it('@spec:AC-091 a corretora é escolhida entre as do catálogo', async () => {
    const { raiz } = await abrirCriacao([CORRETORA]);
    expect([...raiz.querySelectorAll('[data-campo-corretora] option[value]')].map((o) => o.textContent?.trim())).toContain('XP Investimentos');
  });

  it('@spec:AC-092 catálogo vazio não vira seletor vazio: a tela conduz ao cadastro de corretora', async () => {
    const { raiz } = await abrirCriacao([]);
    const atalho = raiz.querySelector('[data-cadastrar-corretora]') as HTMLAnchorElement;

    expect(raiz.querySelector('[data-campo-corretora]')).toBeNull();
    expect(raiz.textContent).toMatch(/corretora/i);
    expect(atalho.getAttribute('href')).toContain('/corretoras/nova');
    expect(atalho.getAttribute('href')).toContain('voltarPara=%2Fcarteiras%2Fnova');
  });

  it('@spec:AC-093 sem mercado escolhido nenhuma criação é enviada', async () => {
    const { raiz, servidor } = await abrirCriacao([CORRETORA]);

    preencher(raiz, { nome: 'Dividendos', corretoraId: '7' });

    expect(servidor.chamadas.some((c) => c.metodo === 'POST')).toBe(false);
    expect(raiz.textContent).toMatch(/escolha o mercado/i);
  });

  it('@spec:AC-093 a criação leva exatamente o mercado escolhido pelo investidor', async () => {
    const { raiz, servidor } = await abrirCriacao([CORRETORA]);

    preencher(raiz, { nome: 'Small caps', corretoraId: '7', mercado: 'US' });

    await waitFor(() => expect(servidor.chamadas.find((c) => c.metodo === 'POST')?.corpo).toEqual({ corretoraId: 7, mercado: 'US', nome: 'Small caps' }));
  });

  it('@spec:AC-094 carteira criada abre no detalhe dela', async () => {
    const { raiz, caminho } = await abrirCriacao([CORRETORA]);

    preencher(raiz, { nome: 'Dividendos', corretoraId: '7', mercado: 'BR' });

    await waitFor(() => expect(caminho()).toBe('/carteiras/9'));
  });

  it('@spec:AC-095 o mercado é apresentado como moeda de referência, sem restringir a carteira', async () => {
    const { raiz } = await abrirCriacao([CORRETORA]);

    expect(raiz.textContent).toMatch(/moeda de referência/i);
    expect(raiz.textContent).toMatch(/aceita ações dos dois mercados/i);
    expect(raiz.textContent).not.toMatch(/apenas ações|somente ações|só aceita/i);
  });

  it('@spec:AC-308 a escolha de corretora oferece até 200 do catálogo, não só as 20 primeiras', async () => {
    const vinteECinco = Array.from({ length: 25 }, (_, i) => ({ ...CORRETORA, id: i + 1, nomeFantasia: `Corretora ${i + 1}` }));
    const { raiz, servidor } = await abrirCriacao(vinteECinco);

    expect(busca(servidor.para('/corretoras')[0].url).get('size')).toBe('200');
    expect(raiz.querySelectorAll('[data-campo-corretora] option[value]:not([value=""])')).toHaveLength(25);
  });
});
