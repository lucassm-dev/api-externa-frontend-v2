import { fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { feedback } from '@/core/feedback/feedback.service';
import { erroPadrao, esperarElemento, json, simularServidor } from '@/test/servidor';
import { montarEm } from '@/test/rotas';
import { classesDe, gerarCss } from '@/test/tailwind';
import { CadastroCorretora } from './cadastro-corretora';
import { Corretora } from './corretoras.model';
import { corretorasService } from './corretoras.service';
import { DetalheCorretora } from './detalhe-corretora';
import { ListaCorretoras } from './lista-corretoras';

function corretora(id: number, razaoSocial = 'XP INVESTIMENTOS CCTVM S.A.', cnpj = '02332886000104', extra: Partial<Corretora> = {}): Corretora {
  return {
    id, cnpj, razaoSocial, nomeFantasia: 'XP Investimentos', email: 'contato@xp.com.br', telefone: '1130000000', cep: '04538133',
    logradouro: 'Avenida Brigadeiro Faria Lima', numero: '3600', complemento: '10 andar', bairro: 'Itaim Bibi', cidade: 'São Paulo', uf: 'SP',
    situacaoCadastral: 'ATIVA', validadaNaCvm: true, dataBaseCvm: '2026-09-08', dataCadastro: '2026-09-09T10:00:00', ...extra,
  };
}
const pagina = <T,>(content: T[], extra: Record<string, number> = {}) => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 20, ...extra });
const busca = (url: string) => new URL(url, 'http://localhost').searchParams;

afterEach(() => vi.unstubAllGlobals());

describe('Catálogo de corretoras', () => {
  it('@spec:AC-074 o cadastro envia só o CNPJ, em dígitos, e nada é guardado quando é recusado', async () => {
    const servidor = simularServidor(({ metodo }) => (metodo === 'POST' ? erroPadrao('COR-003', 422, { message: 'Empresa não autorizada na CVM.' }) : json(pagina([]))));

    await expect(corretorasService.cadastrar('02.332.886/0001-04')).rejects.toBeTruthy();
    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'POST', url: '/corretoras', corpo: { cnpj: '02332886000104' } });

    expect((await corretorasService.listar(0)).content).toEqual([]);
  });

  it('@spec:AC-078 a listagem é paginada e pede a página que a tela pediu', async () => {
    const servidor = simularServidor(() => json(pagina([corretora(1)], { totalElements: 41, totalPages: 3, number: 2 })));

    await corretorasService.listar(2);

    expect(busca(servidor.chamadas[0].url).get('page')).toBe('2');
    expect(busca(servidor.chamadas[0].url).get('size')).toBe('20');
  });

  it('@spec:AC-079 a busca por CNPJ consulta a rota por CNPJ em dígitos puros', async () => {
    const servidor = simularServidor(() => json(corretora(7)));

    expect((await corretorasService.porCnpj('02.332.886/0001-04'))?.id).toBe(7);
    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'GET', url: '/corretoras/cnpj/02332886000104' });
  });

  it('@spec:AC-080 CNPJ ausente do catálogo devolve nada encontrado, não um erro', async () => {
    simularServidor(() => erroPadrao('COR-001', 404));

    await expect(corretorasService.porCnpj('02332886000104')).resolves.toBeNull();
  });

  it('@spec:AC-081 a contagem do selo percorre todas as páginas das carteiras do investidor', async () => {
    const servidor = simularServidor(({ url }) =>
      busca(url).get('page') === '0'
        ? json({ content: [{ corretoraId: 1 }, { corretoraId: 1 }, { corretoraId: 2 }], totalElements: 4, totalPages: 2, number: 0, size: 200 })
        : json({ content: [{ corretoraId: 2 }], totalElements: 4, totalPages: 2, number: 1, size: 200 }),
    );

    const contagem = await corretorasService.carteirasPorCorretora();

    expect(busca(servidor.chamadas[0].url).get('size')).toBe('200');
    expect(servidor.chamadas).toHaveLength(2);
    expect(contagem.get(1)).toBe(2);
    expect(contagem.get(2)).toBe(2);
  });

  it('@spec:AC-083 falha ao ler as carteiras vira contagem vazia, nunca erro na lista', async () => {
    simularServidor(() => json({}, 500));

    expect((await corretorasService.carteirasPorCorretora()).size).toBe(0);
  });

  it('remover chama a exclusão da corretora pelo identificador', async () => {
    const servidor = simularServidor(() => json(undefined, 204));

    await corretorasService.remover(7);

    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'DELETE', url: '/corretoras/7' });
  });
});

const CATALOGO = [
  corretora(1, 'XP INVESTIMENTOS CCTVM S.A.', '02332886000104', { nomeFantasia: null }),
  corretora(2, 'RICO INVESTIMENTOS CTVM', '01234567000195', { nomeFantasia: null, cidade: 'Rio de Janeiro', uf: 'RJ' }),
  corretora(3, 'CLEAR CTVM', '11222333000181', { nomeFantasia: null, validadaNaCvm: false }),
];

function servidorDaLista(conteudo: Corretora[], carteiras: { corretoraId: number }[] | 'falha', extra: Record<string, number> = {}) {
  return simularServidor(({ url }) => {
    if (url.startsWith('/carteiras')) return carteiras === 'falha' ? json({}, 500) : json({ content: carteiras, totalElements: carteiras.length, totalPages: 1, number: 0, size: 200 });
    if (url.startsWith('/corretoras/cnpj/')) {
      const achada = CATALOGO.find((c) => url.endsWith(c.cnpj));
      return achada && achada.id !== 3 ? json(achada) : erroPadrao('COR-001', 404);
    }
    const numero = Number(busca(url).get('page'));
    return json(pagina(conteudo, { totalPages: extra.totalPages ?? 1, number: numero }));
  });
}

async function abrirLista(conteudo = CATALOGO, carteiras: { corretoraId: number }[] | 'falha' = [], extra: Record<string, number> = {}) {
  const servidor = servidorDaLista(conteudo, carteiras, extra);
  const tela = montarEm({ '/corretoras': <ListaCorretoras />, '/corretoras/nova': <p data-tela-nova />, '/corretoras/:id': <p data-tela-detalhe /> }, '/corretoras');
  await waitFor(() => expect(tela.raiz.querySelector('[data-corretora], [data-proximo-passo]')).not.toBeNull());
  await waitFor(() => expect(servidor.para('/carteiras').length).toBeGreaterThan(0));
  return { ...tela, servidor };
}

describe('Lista de corretoras', () => {
  it('@spec:AC-076 o título é "Corretoras" e o catálogo é apresentado como compartilhado', async () => {
    const { raiz } = await abrirLista();

    expect(raiz.querySelector('h1')?.textContent?.trim()).toBe('Corretoras');
    expect(raiz.textContent).not.toContain('Minhas corretoras');
    expect(raiz.querySelector('[data-catalogo-compartilhado]')?.textContent).toMatch(/compartilhad/i);
  });

  it('@spec:AC-077 cada linha traz nome, CNPJ formatado, cidade/UF e a validação', async () => {
    const { raiz } = await abrirLista();
    const linha = raiz.querySelector('[data-corretora="1"]')!;

    expect(linha.querySelector('[data-nome]')?.textContent).toContain('XP INVESTIMENTOS');
    expect(linha.querySelector('[data-cnpj]')?.textContent).toContain('02.332.886/0001-04');
    expect(linha.querySelector('[data-lugar]')?.textContent).toContain('São Paulo/SP');
    expect(linha.querySelector('[data-validacao]')?.textContent).toMatch(/validada/i);
    expect(raiz.querySelector('[data-corretora="3"] [data-validacao]')?.textContent).not.toMatch(/^Validada/i);
  });

  it('@spec:AC-078 avançar de página pede a página seguinte ao servidor', async () => {
    const { raiz, servidor } = await abrirLista(CATALOGO, [], { totalPages: 3 });

    fireEvent.click(raiz.querySelector('[data-proxima]')!);

    await waitFor(() => expect(servidor.chamadas.some((c) => c.url.startsWith('/corretoras?') && busca(c.url).get('page') === '1')).toBe(true));
  });

  it('@spec:AC-079 buscar um CNPJ do catálogo abre o detalhe daquela corretora', async () => {
    const { raiz, caminho } = await abrirLista();

    fireEvent.change(raiz.querySelector('input[name="termo"]')!, { target: { value: '02.332.886/0001-04' } });
    fireEvent.submit(raiz.querySelector('form')!);

    await waitFor(() => expect(caminho()).toBe('/corretoras/1'));
  });

  it('@spec:AC-080 busca sem resultado vira estado vazio com oferta de cadastrar, não erro', async () => {
    const { raiz, caminho } = await abrirLista();

    fireEvent.change(raiz.querySelector('input[name="termo"]')!, { target: { value: '11.222.333/0001-81' } });
    fireEvent.submit(raiz.querySelector('form')!);

    const vazio = await esperarElemento(() => raiz.querySelector('[data-busca-vazia]'));
    expect(vazio.textContent).toContain('11.222.333/0001-81');
    expect(vazio.querySelector('[data-cadastrar-buscado]')).toBeTruthy();
    expect(raiz.textContent).not.toContain('Corretora não encontrada.');
    expect(caminho()).toBe('/corretoras');
  });

  it('@spec:AC-081 o selo conta as carteiras do investidor em cada corretora', async () => {
    const { raiz } = await abrirLista(CATALOGO, [{ corretoraId: 1 }, { corretoraId: 1 }, { corretoraId: 2 }]);

    await waitFor(() => expect(raiz.querySelector('[data-corretora="1"] [data-selo]')?.textContent).toContain('2 carteiras suas'));
    expect(raiz.querySelector('[data-corretora="2"] [data-selo]')?.textContent).toContain('1 carteira sua');
    expect(raiz.querySelector('[data-corretora="3"] [data-selo]')).toBeNull();
  });

  it('@spec:AC-082 o selo não reordena a lista', async () => {
    const { raiz } = await abrirLista(CATALOGO, [{ corretoraId: 3 }]);

    await waitFor(() => expect(raiz.querySelector('[data-corretora="3"] [data-selo]')).not.toBeNull());
    expect([...raiz.querySelectorAll('[data-corretora]')].map((linha) => linha.getAttribute('data-corretora'))).toEqual(['1', '2', '3']);
  });

  it('@spec:AC-083 falha ao contar carteiras deixa a lista inteira na tela, sem selo e sem erro', async () => {
    const { raiz } = await abrirLista(CATALOGO, 'falha');

    expect(raiz.querySelectorAll('[data-corretora]')).toHaveLength(3);
    expect(raiz.querySelectorAll('[data-selo]')).toHaveLength(0);
    expect(raiz.querySelector('[data-nivel="erro"]')).toBeNull();
    expect(raiz.textContent).not.toMatch(/erro/i);
  });

  it('o selo de uso passa a ser renderizado pela primitiva de selo, com texto e sinal', async () => {
    const { raiz } = await abrirLista(CATALOGO, [{ corretoraId: 1 }, { corretoraId: 1 }]);
    const selo = await esperarElemento(() => raiz.querySelector('[data-corretora="1"] [data-selo]'));

    expect(selo.textContent).toContain('2 carteiras suas');
    expect(selo.querySelector('[data-icone]')).not.toBeNull();
  });

  it('@spec:AC-245 a linha se destaca sob o ponteiro, e o destaque não é a única pista', async () => {
    const { raiz } = await abrirLista();
    const css = await gerarCss(classesDe(raiz.querySelector('[data-corretora]')!));

    expect(css).toMatch(/:hover[\s\S]*?background-color:/);
    expect(css).toMatch(/border-(style|width):/);
  });

  it('@spec:AC-249 o paginador informa página, total e faixa, desabilitando as pontas', async () => {
    const { raiz } = await abrirLista(CATALOGO, [], { totalPages: 3 });

    expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 1 de 3/);
    expect(raiz.querySelector('[data-faixa]')?.textContent).toMatch(/de 3/);
    expect(raiz.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(true);
    expect(raiz.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(false);

    fireEvent.click(raiz.querySelector('[data-proxima]')!);
    await waitFor(() => expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 2 de 3/));
    fireEvent.click(raiz.querySelector('[data-proxima]')!);
    await waitFor(() => expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 3 de 3/));
    expect(raiz.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(true);
    expect(raiz.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(false);
  });

  it('@spec:AC-250 carregando mostra esqueleto; catálogo vazio mostra estado vazio com próximo passo', async () => {
    const servidor = simularServidor(() => servidor.segurar());
    const { raiz } = montarEm({ '/corretoras': <ListaCorretoras /> }, '/corretoras');

    await waitFor(() => expect(raiz.querySelector('[data-esqueleto]')).not.toBeNull());
    expect(raiz.querySelector('[data-proximo-passo]')).toBeNull();
    servidor.liberar(json(pagina([])));

    await waitFor(() => expect(raiz.querySelector('[data-esqueleto]')).toBeNull());
    expect(raiz.querySelector('[data-proximo-passo]')?.textContent).toMatch(/cadastrar/i);
    servidor.liberar(json(pagina([])));
  });
});

const CNPJ = '02.332.886/0001-04';

async function abrirCadastro(responder: Parameters<typeof simularServidor>[0], url = '/corretoras/nova') {
  const servidor = simularServidor(responder);
  const tela = montarEm(
    { '/corretoras/nova': <CadastroCorretora />, '/corretoras/:id': <p data-tela-detalhe />, '/carteiras/nova': <p data-tela-carteira /> },
    url,
  );
  await waitFor(() => expect(tela.raiz.querySelector('form')).not.toBeNull());
  return { ...tela, servidor };
}

function enviar(raiz: HTMLElement, cnpj = CNPJ) {
  fireEvent.change(raiz.querySelector('input[name="cnpj"]')!, { target: { value: cnpj } });
  fireEvent.submit(raiz.querySelector('form')!);
}

async function recusar(codigo: string, status: number, message: string) {
  const tela = await abrirCadastro(({ url }) => (url.startsWith('/corretoras/cnpj/') ? json(corretora(7)) : erroPadrao(codigo, status, { message })));
  enviar(tela.raiz);
  await waitFor(() => expect(tela.raiz.querySelector('[data-nivel="erro"], [data-existente], [data-erro]')).not.toBeNull());
  return tela;
}

describe('Cadastro de corretora', () => {
  it('@spec:AC-066 o formulário tem um campo só, o CNPJ', async () => {
    const { raiz } = await abrirCadastro(() => json(corretora(7)));
    const campos = [...raiz.querySelectorAll('input, select, textarea')];

    expect(campos).toHaveLength(1);
    expect(campos[0].getAttribute('name')).toBe('cnpj');
    for (const ausente of ['Razão social', 'Nome fantasia', 'Endereço', 'CEP', 'Telefone']) {
      expect(raiz.textContent).not.toContain(ausente);
    }
  });

  it('@spec:AC-067 o CNPJ com máscara é enviado em dígitos puros', async () => {
    const { raiz, servidor } = await abrirCadastro(() => json(corretora(7)));
    enviar(raiz, '02.332.886/0001-04');
    await waitFor(() => expect(servidor.chamadas[0]?.corpo).toEqual({ cnpj: '02332886000104' }));
  });

  it('@spec:AC-067 o CNPJ em dígitos puros é aceito do mesmo jeito', async () => {
    const { raiz, servidor } = await abrirCadastro(() => json(corretora(7)));
    enviar(raiz, '02332886000104');
    await waitFor(() => expect(servidor.chamadas[0]?.corpo).toEqual({ cnpj: '02332886000104' }));
  });

  it('@spec:AC-068 enquanto consulta, a tela diz que está consultando as fontes externas', async () => {
    const { raiz, servidor } = await abrirCadastro(() => servidor.segurar());
    enviar(raiz);

    const aviso = await esperarElemento(() => raiz.querySelector('[data-consultando]'));
    expect(aviso.textContent).toContain('Receita');
    expect(aviso.textContent).toContain('CVM');
    servidor.liberar(json(corretora(7)));
  });

  it('@spec:AC-069 nenhuma segunda requisição sai durante a consulta, e o botão fica indisponível', async () => {
    const { raiz, servidor } = await abrirCadastro(() => servidor.segurar());
    enviar(raiz);
    await waitFor(() => expect((raiz.querySelector('[data-enviar]') as HTMLButtonElement).disabled).toBe(true));

    fireEvent.submit(raiz.querySelector('form')!);
    fireEvent.submit(raiz.querySelector('form')!);
    fireEvent.click(raiz.querySelector('[data-enviar]')!);

    expect(servidor.chamadas).toHaveLength(1);
    servidor.liberar(json(corretora(7)));
  });

  it('@spec:AC-070 cadastro aceito leva à corretora criada, validada e com a data da base', async () => {
    const { raiz, caminho } = await abrirCadastro(() => json(corretora(7)));
    enviar(raiz);
    await waitFor(() => expect(caminho()).toBe('/corretoras/7'));
  });

  it('@spec:AC-071 a recusa mostra o motivo específico que o servidor informou', async () => {
    const { raiz } = await recusar('COR-003', 422, 'Esta empresa não consta como corretora autorizada na CVM.');
    expect(raiz.textContent).toContain('Esta empresa não consta como corretora autorizada na CVM.');
  });

  it('@spec:AC-071 cada motivo de COR-003 chega distinto, sem virar uma mensagem resumida', async () => {
    const motivos = ['CNPJ inválido.', 'CNPJ não encontrado na Receita Federal.', 'CEP não encontrado.', 'Esta empresa não consta como corretora autorizada na CVM.'];
    const exibidos: string[] = [];
    for (const motivo of motivos) {
      const { raiz } = await recusar('COR-003', 422, motivo);
      exibidos.push(raiz.textContent ?? '');
      raiz.remove();
      vi.unstubAllGlobals();
    }
    motivos.forEach((motivo, indice) => expect(exibidos[indice]).toContain(motivo));
    expect(new Set(exibidos).size).toBe(motivos.length);
  });

  it('@spec:AC-072 falha de verificação não é apresentada como reprovação da empresa', async () => {
    const { raiz } = await recusar('EXT-007', 503, 'CVM indisponível');
    const texto = raiz.textContent ?? '';

    expect(texto).toContain('Não conseguimos verificar esta corretora agora. Tente novamente em instantes.');
    for (const proibido of ['não consta', 'não autorizada', 'inválido', 'CVM indisponível']) expect(texto).not.toContain(proibido);
  });

  it('@spec:AC-072 recusa e falha de verificação produzem textos diferentes', async () => {
    const recusa = await recusar('COR-003', 422, 'Esta empresa não consta como corretora autorizada na CVM.');
    const textoRecusa = recusa.raiz.querySelector('[data-mensagem]')?.textContent;
    recusa.raiz.remove();
    vi.unstubAllGlobals();
    const falha = await recusar('EXT-007', 503, 'CVM indisponível');
    const textoFalha = falha.raiz.querySelector('[data-mensagem]')?.textContent;

    expect(textoRecusa).toBeTruthy();
    expect(textoFalha).toBeTruthy();
    expect(textoRecusa).not.toBe(textoFalha);
  });

  it('@spec:AC-073 COR-003 preserva o CNPJ digitado e destaca o campo', async () => {
    const { raiz } = await recusar('COR-003', 422, 'CNPJ não encontrado na Receita Federal.');
    const campo = raiz.querySelector('input[name="cnpj"]') as HTMLInputElement;

    expect(campo.value).toBe(CNPJ);
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(raiz.querySelector('[data-campo="cnpj"] [data-erro]')).toBeTruthy();
  });

  it('@spec:AC-073 EXT-007 preserva o CNPJ digitado e destaca o campo', async () => {
    const { raiz } = await recusar('EXT-007', 503, 'fonte fora do ar');
    const campo = raiz.querySelector('input[name="cnpj"]') as HTMLInputElement;

    expect(campo.value).toBe(CNPJ);
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(raiz.querySelector('[data-campo="cnpj"] [data-erro]')).toBeTruthy();
  });

  it('@spec:AC-074 cadastro recusado não navega para corretora nenhuma nem cria registro', async () => {
    const { raiz, caminho, servidor } = await recusar('COR-003', 422, 'CNPJ inválido.');

    expect(caminho()).toBe('/corretoras/nova');
    expect(raiz.querySelector('[data-existente]')).toBeNull();
    expect(servidor.chamadas).toHaveLength(1);
  });

  it('@spec:AC-075 CNPJ já cadastrado mostra a corretora existente e oferece abri-la', async () => {
    const { raiz } = await recusar('COR-002', 409, 'já cadastrada');
    const cartao = await esperarElemento(() => raiz.querySelector('[data-existente]'));

    expect(cartao.textContent).toContain('XP');
    expect(cartao.textContent).toContain('02.332.886/0001-04');
    expect(cartao.querySelector('[data-abrir]')?.getAttribute('href')).toBe('/corretoras/7');
  });

  it('@spec:AC-075 COR-002 não termina em erro sem saída', async () => {
    const { raiz, servidor } = await recusar('COR-002', 409, 'já cadastrada');

    await waitFor(() => expect(raiz.querySelector('[data-abrir]')).toBeTruthy());
    expect(servidor.para('/corretoras/cnpj/02332886000104')).toHaveLength(1);
  });

  it('CNPJ que nem chega a ser CNPJ é barrado antes do envio', async () => {
    const { raiz, servidor } = await abrirCadastro(() => json(corretora(7)));
    enviar(raiz, '123');

    expect(servidor.chamadas).toHaveLength(0);
    expect(raiz.querySelector('[data-campo="cnpj"] [data-erro]')).toBeTruthy();
  });

  it('@spec:AC-092 cadastro concluído devolve o investidor à criação de carteira', async () => {
    const { raiz, caminho } = await abrirCadastro(() => json({ id: 7, cnpj: CNPJ }), '/corretoras/nova?voltarPara=%2Fcarteiras%2Fnova');
    enviar(raiz);
    await waitFor(() => expect(caminho()).toBe('/carteiras/nova'));
  });
});

async function abrirDetalhe(responder: Parameters<typeof simularServidor>[0]) {
  const servidor = simularServidor(responder);
  const tela = montarEm({ '/corretoras/:id': <DetalheCorretora />, '/corretoras': <p data-tela-lista /> }, '/corretoras/7');
  return { ...tela, servidor };
}

const carregada = async (raiz: HTMLElement) => waitFor(() => expect(raiz.querySelector('[data-remover]')).not.toBeNull());

async function pedirRemocao(raiz: HTMLElement) {
  fireEvent.click(raiz.querySelector('[data-remover]')!);
  fireEvent.click(await esperarElemento(() => document.querySelector('[data-confirmar]')));
}

describe('Detalhe da corretora', () => {
  beforeEach(() => feedback.limpar());

  it('@spec:AC-084 mostra os dados cadastrais e o endereço completo', async () => {
    const { raiz } = await abrirDetalhe(() => json(corretora(7)));
    await carregada(raiz);

    for (const trecho of ['XP INVESTIMENTOS CCTVM S.A.', 'XP Investimentos', '02.332.886/0001-04', 'ATIVA', 'contato@xp.com.br', '1130000000', '04538133', 'Avenida Brigadeiro Faria Lima', '3600', '10 andar', 'Itaim Bibi', 'São Paulo', 'SP']) {
      expect(raiz.textContent).toContain(trecho);
    }
  });

  it('@spec:AC-085 a validação na CVM vem junto da data da base oficial usada', async () => {
    const { raiz } = await abrirDetalhe(() => json(corretora(7)));
    await carregada(raiz);

    expect(raiz.querySelector('[data-validacao]')?.textContent).toMatch(/validada/i);
    expect(raiz.querySelector('[data-base-cvm]')?.textContent).toContain('08/09/2026');
  });

  it('@spec:AC-085 corretora sem validação não ganha marca de validada', async () => {
    const { raiz } = await abrirDetalhe(() => json(corretora(7, undefined, undefined, { validadaNaCvm: false })));
    await carregada(raiz);

    expect(raiz.querySelector('[data-validacao]')?.textContent?.trim()).not.toMatch(/^Validada/i);
  });

  it('@spec:AC-086 corretora inexistente devolve o investidor à lista com a mensagem do catálogo', async () => {
    const { caminho } = await abrirDetalhe(() => erroPadrao('COR-001', 404, { message: 'sumiu' }));

    await waitFor(() => expect(caminho()).toBe('/corretoras'));
    expect(feedback.mensagens().some((m) => m.texto === 'Corretora não encontrada.')).toBe(true);
  });

  it('@spec:AC-087 remover abre o diálogo de confirmação com a consequência descrita', async () => {
    const { raiz } = await abrirDetalhe(() => json(corretora(7)));
    await carregada(raiz);
    fireEvent.click(raiz.querySelector('[data-remover]')!);

    const dialogo = await esperarElemento(() => document.querySelector('[role="alertdialog"]'));
    expect(dialogo.querySelector('[data-consequencia]')?.textContent?.length).toBeGreaterThan(10);
    expect(dialogo.querySelectorAll('button')).toHaveLength(2);
    expect(dialogo.querySelectorAll('input')).toHaveLength(0);
  });

  it('@spec:AC-088 confirmar remove a corretora e volta à lista, sem lixeira nem desfazer', async () => {
    const { raiz, caminho, servidor } = await abrirDetalhe(({ metodo }) => (metodo === 'DELETE' ? json(undefined, 204) : json(corretora(7))));
    await carregada(raiz);
    await pedirRemocao(raiz);

    await waitFor(() => expect(caminho()).toBe('/corretoras'));
    expect(servidor.chamadas.find((c) => c.metodo === 'DELETE')?.url).toBe('/corretoras/7');
    expect(document.body.textContent).not.toMatch(/lixeira|desfazer|inativ/i);
  });

  it('@spec:AC-089 COR-004 cancela a exclusão sem revelar de quem são as carteiras', async () => {
    const { raiz, caminho } = await abrirDetalhe(({ metodo }) =>
      metodo === 'DELETE' ? erroPadrao('COR-004', 409, { message: 'a carteira "Longo prazo" do investidor 42 usa esta corretora' }) : json(corretora(7)),
    );
    await carregada(raiz);
    await pedirRemocao(raiz);

    await waitFor(() => expect(raiz.textContent).toContain('Esta corretora tem carteiras vinculadas e não pode ser removida.'));
    expect(raiz.querySelector('[data-mensagem]')?.textContent).not.toMatch(/investidor|Longo prazo|42|outro|dono/i);
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(caminho()).toBe('/corretoras/7');
    expect(raiz.querySelector('h1')?.textContent).toBeTruthy();
  });

  it('@spec:AC-090 remover está disponível em qualquer corretora, sem checar quem cadastrou', async () => {
    const { raiz } = await abrirDetalhe(() => json(corretora(7)));
    await carregada(raiz);

    expect((raiz.querySelector('[data-remover]') as HTMLButtonElement).disabled).toBe(false);
    expect(raiz.textContent).not.toMatch(/cadastrada por|quem cadastrou|dono|proprietári/i);
  });
});

describe('Rotas das corretoras', () => {
  it('@spec:AC-079 a área de corretoras tem lista, cadastro e detalhe com endereço próprio', () => {
    const rotas = readFileSync('src/rotas.tsx', 'utf8');

    expect(rotas).toMatch(/path: 'corretoras'[\s\S]*?index: true[\s\S]*?ListaCorretoras/);
    expect(rotas).toMatch(/path: 'nova'[\s\S]*?CadastroCorretora/);
    expect(rotas).toMatch(/path: ':id'[\s\S]*?DetalheCorretora/);
  });

  it('@spec:AC-086 o detalhe abre por identificador na URL', async () => {
    const { raiz, servidor } = await abrirDetalhe(() => json(corretora(7, 'XP INVESTIMENTOS CCTVM S.A.', '02332886000104', { nomeFantasia: null })));

    await waitFor(() => expect(raiz.textContent).toContain('XP INVESTIMENTOS CCTVM S.A.'));
    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'GET', url: '/corretoras/7' });
  });
});

describe('Bugs do Angular corrigidos em corretoras', () => {
  it('@spec:AC-310 cadastrar o CNPJ buscado já abre o cadastro com esse CNPJ no campo', async () => {
    const { raiz } = await abrirLista();

    fireEvent.change(raiz.querySelector('input[name="termo"]')!, { target: { value: '11.222.333/0001-81' } });
    fireEvent.submit(raiz.querySelector('form')!);
    const link = (await esperarElemento(() => raiz.querySelector('[data-cadastrar-buscado]'))) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/corretoras/nova?cnpj=11222333000181');
    raiz.remove();
    vi.unstubAllGlobals();

    const cadastro = await abrirCadastro(() => json(corretora(7)), '/corretoras/nova?cnpj=11222333000181');
    expect((cadastro.raiz.querySelector('input[name="cnpj"]') as HTMLInputElement).value).toBe('11222333000181');
  });
});
