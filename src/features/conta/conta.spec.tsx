import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, erroPadrao, json, simularServidor } from '@/test/servidor';

const EMAIL = 'lucas@exemplo.com';
const EMAIL_NOVO = 'novo@exemplo.com';
const TOKEN = (token = 'jwt-abc') => ({
  token,
  tipo: 'Bearer',
  expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
});
const INVESTIDOR: Identidade = { papel: 'INVESTIDOR', nome: 'Lucas Mendes', fotoUrl: null };
const COM_FOTO: Identidade = { ...INVESTIDOR, fotoUrl: '/auth/me/foto' };

/** O "banco" do servidor falso: muda conforme as chamadas de troca. */
let eu: Identidade & { email: string };

function responder({ metodo, url }: Chamada): Response {
  if (url === '/auth/me') return json(eu);
  if (url === '/auth/senha') return json(TOKEN('jwt-novo'));
  if (url === '/auth/email') return json(undefined, 202);
  if (url === '/auth/email/confirmar') {
    eu = { ...eu, email: EMAIL_NOVO };
    return json(undefined, 204);
  }
  if (url === '/auth/me/foto' && metodo === 'GET') {
    return eu.fotoUrl ? new Response(new Blob(['png'], { type: 'image/png' })) : erroPadrao('AUT-019', 404);
  }
  if (url === '/auth/me/foto' && metodo === 'PUT') {
    eu = { ...eu, fotoUrl: '/auth/me/foto' };
    return json(undefined, 204);
  }
  if (url === '/auth/me/foto' && metodo === 'DELETE') {
    eu = { ...eu, fotoUrl: null };
    return json(undefined, 204);
  }
  return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
}

function conectar(identidade: Identidade = INVESTIDOR) {
  eu = { ...identidade, email: EMAIL };
  sessao.iniciar(TOKEN(), EMAIL, identidade);
}

function abrir(url: string) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [url] });
  render(<RouterProvider router={roteador} />);
  return { caminho: () => roteador.state.location.pathname };
}

const secao = (nome: string) => document.querySelector(`[data-secao-conta="${nome}"]`) as HTMLElement | null;
const formDe = (nome: string) =>
  waitFor(() => {
    const form = secao(nome)?.querySelector('form');
    if (!form) throw new Error(`sem formulário em ${nome}`);
    return form;
  });
const preencher = (form: Element, campo: string, valor: string) =>
  fireEvent.change(form.querySelector(`input[name="${campo}"]`)!, { target: { value: valor } });
const erroDoCampo = (form: Element, campo: string) => {
  const id = form.querySelector(`input[name="${campo}"]`)?.getAttribute('aria-describedby') ?? '';
  return id
    .split(' ')
    .map((parte) => document.getElementById(parte)?.textContent ?? '')
    .join(' ');
};
const avatarDoTopo = () => document.querySelector('[data-avatar-investidor]');

beforeAll(() => {
  // jsdom não tem URL.createObjectURL: a foto vira um endereço blob conhecido.
  Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:foto'), revokeObjectURL: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Chegar à minha conta', () => {
  it('@spec:AC-325 o botão Minha conta do topo abre a página com Foto, E-mail e Senha', async () => {
    simularServidor(responder);
    conectar({ papel: 'ADMIN', nome: null, fotoUrl: null });
    const { caminho } = abrir('/corretoras');

    const botao = await waitFor(() => {
      const encontrado = document.querySelector('button[aria-label="Minha conta"]');
      if (!encontrado) throw new Error('sem botão');
      return encontrado;
    });
    fireEvent.click(botao);

    await waitFor(() => expect(caminho()).toBe('/conta'));
    await waitFor(() => expect(secao('foto')).not.toBeNull());
    expect(secao('email')).not.toBeNull();
    expect(secao('senha')).not.toBeNull();
  });
});

describe('Trocar a senha', () => {
  it('@spec:AC-326 trocar a senha guarda o token novo, limpa os campos e confirma', async () => {
    const servidor = simularServidor(responder);
    conectar();
    abrir('/conta');
    const form = await formDe('senha');

    preencher(form, 'senhaAtual', 'antiga123');
    preencher(form, 'novaSenha', 'nova12345');
    preencher(form, 'confirmarSenha', 'nova12345');
    fireEvent.submit(form);

    await waitFor(() => expect(sessao.token()).toBe('jwt-novo'));
    expect(servidor.para('/auth/senha')[0]).toMatchObject({
      metodo: 'PUT',
      corpo: { senhaAtual: 'antiga123', novaSenha: 'nova12345' },
    });
    expect(sessao.ativa()).toBe(true);
    await waitFor(() => expect(secao('senha')?.textContent).toContain('Senha trocada'));
    const depois = await formDe('senha');
    expect((depois.querySelector('input[name="senhaAtual"]') as HTMLInputElement).value).toBe('');
  });

  it('@spec:AC-327 senha nova fora da política ou diferente da confirmação não sai', async () => {
    const servidor = simularServidor(responder);
    conectar();
    abrir('/conta');
    const form = await formDe('senha');

    preencher(form, 'senhaAtual', 'antiga123');
    preencher(form, 'novaSenha', 'semnumero');
    preencher(form, 'confirmarSenha', 'outra1234');
    fireEvent.submit(form);

    await waitFor(() => expect(erroDoCampo(form, 'novaSenha')).toContain('8 caracteres'));
    expect(erroDoCampo(form, 'confirmarSenha')).toContain('não coincidem');
    expect(servidor.para('/auth/senha')).toHaveLength(0);
  });

  it('@spec:AC-328 senha atual errada aparece no campo e a sessão continua', async () => {
    simularServidor((chamada) => (chamada.url === '/auth/senha' ? erroPadrao('AUT-014', 422) : responder(chamada)));
    conectar();
    abrir('/conta');
    const form = await formDe('senha');

    preencher(form, 'senhaAtual', 'errada123');
    preencher(form, 'novaSenha', 'nova12345');
    preencher(form, 'confirmarSenha', 'nova12345');
    fireEvent.submit(form);

    await waitFor(() => expect(erroDoCampo(form, 'senhaAtual')).toContain('senha atual está incorreta'));
    expect(sessao.token()).toBe('jwt-abc');
  });
});

describe('Trocar o e-mail', () => {
  async function pedirTroca() {
    const form = await formDe('email');
    preencher(form, 'email', EMAIL_NOVO);
    preencher(form, 'senhaAtual', 'segura123');
    fireEvent.submit(form);
    return form;
  }

  it('@spec:AC-333 pedir a troca envia o código para o e-mail novo e pede o código', async () => {
    const servidor = simularServidor(responder);
    conectar();
    abrir('/conta');
    await pedirTroca();

    await waitFor(() => expect(secao('email')?.querySelector('input[name="codigo"]')).not.toBeNull());
    expect(servidor.para('/auth/email')[0]).toMatchObject({
      metodo: 'POST',
      corpo: { novoEmail: EMAIL_NOVO, senhaAtual: 'segura123' },
    });
    expect(secao('email')?.textContent).toContain(EMAIL_NOVO);
  });

  it('@spec:AC-334 confirmar o código recarrega quem sou eu e mostra o e-mail novo', async () => {
    const servidor = simularServidor(responder);
    conectar({ papel: 'ADMIN', nome: null, fotoUrl: null });
    abrir('/conta');
    await pedirTroca();
    const form = await waitFor(() => {
      const encontrado = secao('email')?.querySelector('form');
      if (!encontrado?.querySelector('input[name="codigo"]')) throw new Error('sem passo do código');
      return encontrado;
    });

    preencher(form, 'codigo', '123456');
    fireEvent.submit(form);

    await waitFor(() => expect(sessao.email()).toBe(EMAIL_NOVO));
    expect(servidor.para('/auth/email/confirmar')[0].corpo).toEqual({ codigo: '123456' });
    expect(servidor.para('/auth/me').length).toBeGreaterThan(0);
    await waitFor(() => expect(document.querySelector('[data-identidade-investidor]')?.textContent).toContain(EMAIL_NOVO));
  });

  it('@spec:AC-335 senha errada e e-mail em uso vão aos campos; pedidos demais vão à seção', async () => {
    let codigo = 'AUT-014';
    simularServidor((chamada) =>
      chamada.url === '/auth/email' ? erroPadrao(codigo, codigo === 'AUT-001' ? 409 : 422) : responder(chamada),
    );
    conectar();
    abrir('/conta');

    let form = await pedirTroca();
    await waitFor(() => expect(erroDoCampo(form, 'senhaAtual')).toContain('senha atual está incorreta'));

    codigo = 'AUT-001';
    preencher(form, 'senhaAtual', 'segura1234');
    fireEvent.submit(form);
    await waitFor(() => expect(erroDoCampo(form, 'email')).toContain('já está em uso'));

    codigo = 'AUT-015';
    preencher(form, 'email', 'outro@exemplo.com');
    fireEvent.submit(form);
    await waitFor(() => expect(secao('email')?.textContent).toContain('códigos demais'));

    codigo = 'EXT-012';
    form = await formDe('email');
    fireEvent.submit(form);
    await waitFor(() => expect(secao('email')?.textContent).toContain('Não conseguimos enviar o e-mail'));
  });
});

describe('Foto de perfil', () => {
  const escolher = async (arquivo: File) => {
    const entrada = await waitFor(() => {
      const encontrada = secao('foto')?.querySelector('input[type="file"]');
      if (!encontrada) throw new Error('sem escolha de arquivo');
      return encontrada;
    });
    fireEvent.change(entrada, { target: { files: [arquivo] } });
  };
  const imagemDe = (onde: Element | null) => onde?.querySelector('img')?.getAttribute('src') ?? null;

  it('@spec:AC-336 enviar uma foto válida a mostra na página e no topo', async () => {
    const servidor = simularServidor(responder);
    conectar();
    abrir('/conta');

    await escolher(new File(['png'], 'eu.png', { type: 'image/png' }));

    await waitFor(() => expect(imagemDe(avatarDoTopo())).toBe('blob:foto'));
    await waitFor(() => expect(imagemDe(secao('foto'))).toBe('blob:foto'));
    const envio = servidor.para('/auth/me/foto').find((chamada) => chamada.metodo === 'PUT')!;
    expect(envio.corpo).toBeInstanceOf(FormData);
    expect((envio.corpo as FormData).get('arquivo')).toBeInstanceOf(File);
    // O navegador põe o boundary do multipart: o front não pode fixar o Content-Type.
    expect(envio.cabecalhos.get('Content-Type')).toBeNull();
  });

  it('@spec:AC-337 arquivo grande demais ou de outro tipo não sai; a recusa do servidor também é dita', async () => {
    let recusa: string | null = null;
    const servidor = simularServidor((chamada) => (chamada.metodo === 'PUT' && recusa ? erroPadrao(recusa, 422) : responder(chamada)));
    conectar();
    abrir('/conta');

    await escolher(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'grande.png', { type: 'image/png' }));
    await waitFor(() => expect(secao('foto')?.textContent).toContain('no máximo 2 MB'));

    await escolher(new File(['gif'], 'eu.gif', { type: 'image/gif' }));
    await waitFor(() => expect(secao('foto')?.textContent).toContain('JPEG, PNG ou WebP'));
    expect(servidor.chamadas.filter((chamada) => chamada.metodo === 'PUT')).toHaveLength(0);

    recusa = 'AUT-017';
    await escolher(new File(['falso'], 'disfarce.png', { type: 'image/png' }));
    await waitFor(() => expect(servidor.chamadas.filter((chamada) => chamada.metodo === 'PUT')).toHaveLength(1));
    await waitFor(() => expect(secao('foto')?.textContent).toContain('JPEG, PNG ou WebP'));
  });

  it('@spec:AC-338 remover a foto volta às iniciais na página e no topo', async () => {
    const servidor = simularServidor(responder);
    conectar(COM_FOTO);
    abrir('/conta');
    await waitFor(() => expect(imagemDe(avatarDoTopo())).toBe('blob:foto'));

    const remover = await waitFor(() => {
      const botao = [...(secao('foto')?.querySelectorAll('button') ?? [])].find((b) => b.textContent?.includes('Remover foto'));
      if (!botao) throw new Error('sem remover');
      return botao;
    });
    fireEvent.click(remover);

    await waitFor(() => expect(imagemDe(avatarDoTopo())).toBeNull());
    expect(avatarDoTopo()?.textContent?.trim()).toBe('LE');
    expect(imagemDe(secao('foto'))).toBeNull();
    expect(servidor.chamadas.some((chamada) => chamada.metodo === 'DELETE' && chamada.url === '/auth/me/foto')).toBe(true);
  });

  it('@spec:AC-339 a foto vem por GET com o token; sem fotoUrl ou com falha, ficam as iniciais', async () => {
    const servidor = simularServidor(responder);
    conectar(COM_FOTO);
    abrir('/painel');

    await waitFor(() => expect(imagemDe(avatarDoTopo())).toBe('blob:foto'));
    const busca = servidor.para('/auth/me/foto')[0];
    expect(busca.metodo).toBe('GET');
    expect(busca.cabecalhos.get('Authorization')).toBe('Bearer jwt-abc');
    cleanup();
    sessao.encerrar();

    const semFoto = simularServidor(responder);
    conectar();
    abrir('/painel');
    await waitFor(() => expect(avatarDoTopo()?.textContent?.trim()).toBe('LE'));
    expect(semFoto.para('/auth/me/foto')).toHaveLength(0);
    cleanup();
    sessao.encerrar();

    simularServidor((chamada) => (chamada.url === '/auth/me/foto' ? erroPadrao('AUT-019', 404) : responder(chamada)));
    conectar(COM_FOTO);
    abrir('/painel');
    await waitFor(() => expect(avatarDoTopo()?.textContent?.trim()).toBe('LE'));
    expect(imagemDe(avatarDoTopo())).toBeNull();
  });
});
