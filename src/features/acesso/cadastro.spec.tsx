import { fireEvent, waitFor } from '@testing-library/react';
import { CHAVE_SESSAO } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { erroPadrao, json, simularServidor } from '@/test/servidor';
import { montarTela } from '@/test/telas-acesso';

const VALIDO = { nome: 'Lucas Mendes', email: 'lucas@exemplo.com', cpf: '12345678901', senha: 'segura123' };
const FORMULARIO_VALIDO = { ...VALIDO, confirmarSenha: VALIDO.senha };
const CONTA = () => json({ id: 7, nome: VALIDO.nome, email: VALIDO.email });

afterEach(() => {
  vi.unstubAllGlobals();
  sessao.encerrar();
});

const campo = (raiz: HTMLElement, nome: string) => raiz.querySelector(`input[name="${nome}"]`) as HTMLInputElement;
const erroDe = (raiz: HTMLElement, nome: string) => raiz.querySelector(`[data-campo="${nome}"] [data-erro]`)?.textContent ?? null;
const valores = (raiz: HTMLElement) =>
  Object.fromEntries(Object.keys(FORMULARIO_VALIDO).map((nome) => [nome, campo(raiz, nome).value]));

function preencher(raiz: HTMLElement, dados: Partial<typeof FORMULARIO_VALIDO> = {}) {
  for (const [nome, valor] of Object.entries({ ...FORMULARIO_VALIDO, ...dados })) {
    fireEvent.change(campo(raiz, nome), { target: { value: valor } });
  }
}

const enviar = (raiz: HTMLElement) => fireEvent.submit(raiz.querySelector('form')!);

async function recusar(resposta: () => Response) {
  const servidor = simularServidor(resposta);
  const { raiz } = await montarTela('/criar-conta');
  preencher(raiz);
  enviar(raiz);
  await waitFor(() => expect(servidor.para('/auth/cadastro')).toHaveLength(1));
  return raiz;
}

describe('Tela de cadastro', () => {
  it('@spec:AC-034 as regras de CPF, senha e e-mail já estão na tela antes de qualquer erro', async () => {
    const { raiz } = await montarTela('/criar-conta');

    expect(raiz.textContent).toMatch(/11 dígitos/i);
    expect(raiz.textContent).toMatch(/8 caracteres/i);
    expect(raiz.textContent).toMatch(/letra/i);
    expect(raiz.textContent).toMatch(/número/i);
    expect(raiz.textContent).toMatch(/nome@dominio/i);
  });

  it('@spec:AC-027 CPF fora do formato barra o envio antes de chamar o backend', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz } = await montarTela('/criar-conta');

    preencher(raiz, { cpf: '123' });
    enviar(raiz);

    expect(servidor.chamadas).toHaveLength(0);
    expect(erroDe(raiz, 'cpf')).toBeTruthy();
  });

  it('@spec:AC-148 o campo mostra o CPF pontuado enquanto o investidor digita', async () => {
    const { raiz } = await montarTela('/criar-conta');

    for (const [digitado, esperado] of [
      ['123', '123'],
      ['123456', '123.456'],
      ['123456789', '123.456.789'],
      ['12345678901', '123.456.789-01'],
    ] as const) {
      fireEvent.change(campo(raiz, 'cpf'), { target: { value: digitado } });
      expect(campo(raiz, 'cpf').value).toBe(esperado);
    }
  });

  it('@spec:AC-148 o campo não aceita nada além de dígitos, e o CPF completo continua válido', async () => {
    const { raiz } = await montarTela('/criar-conta');

    fireEvent.change(campo(raiz, 'cpf'), { target: { value: '123abc456!789-01x' } });
    fireEvent.blur(campo(raiz, 'cpf'));

    expect(campo(raiz, 'cpf').value).toBe('123.456.789-01');
    expect(erroDe(raiz, 'cpf')).toBeNull();
  });

  it('@spec:AC-149 o servidor recebe os 11 dígitos, sem a máscara', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz } = await montarTela('/criar-conta');

    preencher(raiz, { cpf: '123.456.789-01' });
    enviar(raiz);

    await waitFor(() => expect(servidor.para('/auth/cadastro')).toHaveLength(1));
    expect((servidor.para('/auth/cadastro')[0].corpo as { cpf: string }).cpf).toBe('12345678901');
  });

  it('@spec:AC-028 senha fora da política barra o envio antes de chamar o backend', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz } = await montarTela('/criar-conta');

    preencher(raiz, { senha: 'semnumero', confirmarSenha: 'semnumero' });
    enviar(raiz);

    expect(servidor.chamadas).toHaveLength(0);
    expect(erroDe(raiz, 'senha')).toBeTruthy();
  });

  it('@spec:AC-291 pede a confirmação logo depois da senha sem antecipar erro', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz } = await montarTela('/criar-conta');
    const blocoSenha = raiz.querySelector('[data-campo="senha"]');
    const blocoConfirmacao = raiz.querySelector('[data-campo="confirmarSenha"]');

    expect(blocoSenha?.nextElementSibling).toBe(blocoConfirmacao);
    expect(campo(raiz, 'confirmarSenha').autocomplete).toBe('new-password');
    expect(raiz.textContent).not.toContain('As senhas não coincidem');

    preencher(raiz, { confirmarSenha: '' });
    enviar(raiz);

    expect(servidor.chamadas).toHaveLength(0);
    expect(erroDe(raiz, 'confirmarSenha')).toBe('Confirme sua senha');
  });

  it('@spec:AC-292 mostra a divergência no blur e barra a requisição', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz } = await montarTela('/criar-conta');

    preencher(raiz, { confirmarSenha: 'diferente123' });
    expect(raiz.textContent).not.toContain('As senhas não coincidem');

    fireEvent.blur(campo(raiz, 'confirmarSenha'));
    expect(raiz.textContent).toContain('As senhas não coincidem');

    enviar(raiz);
    expect(servidor.chamadas).toHaveLength(0);
  });

  it('@spec:AC-293 revalida a confirmação quando a senha original muda', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz } = await montarTela('/criar-conta');

    preencher(raiz);
    fireEvent.change(campo(raiz, 'senha'), { target: { value: 'novaSenha123' } });
    enviar(raiz);

    expect(servidor.chamadas).toHaveLength(0);
    expect(raiz.textContent).toContain('As senhas não coincidem');
  });

  it('@spec:AC-294 envia o cadastro quando as senhas coincidem sem mandar a confirmação', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz } = await montarTela('/criar-conta');

    preencher(raiz);
    enviar(raiz);

    await waitFor(() => expect(servidor.para('/auth/cadastro')).toHaveLength(1));
    expect(servidor.para('/auth/cadastro')[0].corpo).toEqual(VALIDO);
    expect(servidor.para('/auth/cadastro')[0].corpo).not.toHaveProperty('confirmarSenha');
  });

  it('@spec:AC-029 e-mail fora de formato barra o envio antes de chamar o backend', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz } = await montarTela('/criar-conta');

    preencher(raiz, { email: 'lucas-arroba-exemplo' });
    enviar(raiz);

    expect(servidor.chamadas).toHaveLength(0);
    expect(erroDe(raiz, 'email')).toBeTruthy();
  });

  it('@spec:AC-025 cadastro válido leva ao login com o e-mail preenchido e a conta confirmada', async () => {
    const servidor = simularServidor(CONTA);
    const { raiz, roteador } = await montarTela('/criar-conta');

    preencher(raiz);
    enviar(raiz);

    await waitFor(() => expect(roteador.state.location.pathname).toBe('/entrar'));
    expect(servidor.para('/auth/cadastro')[0].corpo).toEqual(VALIDO);
    const busca = new URLSearchParams(roteador.state.location.search);
    expect(busca.get('email')).toBe(VALIDO.email);
    expect(busca.get('contaCriada')).toBeTruthy();
  });

  it('@spec:AC-026 cadastro concluído não cria sessão nem guarda a senha', async () => {
    simularServidor(CONTA);
    const { raiz, roteador } = await montarTela('/criar-conta');

    preencher(raiz);
    enviar(raiz);

    await waitFor(() => expect(roteador.state.location.pathname).toBe('/entrar'));
    expect(sessao.ativa()).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain(VALIDO.senha);
  });

  it('@spec:AC-030 e-mail duplicado preserva o que foi digitado e destaca só o campo do e-mail', async () => {
    const raiz = await recusar(() => erroPadrao('AUT-001', 409));

    await waitFor(() => expect(erroDe(raiz, 'email')).toBe('Este e-mail já está em uso.'));
    expect(valores(raiz)).toEqual({ ...FORMULARIO_VALIDO, cpf: '123.456.789-01' });
    expect(erroDe(raiz, 'cpf')).toBeNull();
    expect(erroDe(raiz, 'senha')).toBeNull();
    expect(erroDe(raiz, 'nome')).toBeNull();
  });

  it('@spec:AC-031 CPF duplicado destaca só o CPF, sem limpar o formulário', async () => {
    const raiz = await recusar(() => erroPadrao('AUT-002', 409));

    await waitFor(() => expect(erroDe(raiz, 'cpf')).toBe('Este CPF já está em uso.'));
    expect(erroDe(raiz, 'email')).toBeNull();
    expect(campo(raiz, 'nome').value).toBe(VALIDO.nome);
  });

  it('@spec:AC-032 senha recusada pelo servidor destaca a senha', async () => {
    const raiz = await recusar(() => erroPadrao('AUT-008', 422));

    await waitFor(() => expect(erroDe(raiz, 'senha')).toBe('A senha precisa ter ao menos 8 caracteres, com letra e número.'));
    expect(campo(raiz, 'senha').value).toBe(VALIDO.senha);
  });

  it('@spec:AC-033 erro de validação do servidor se distribui pelos campos, sem balão de topo', async () => {
    const raiz = await recusar(() =>
      erroPadrao('VAL-001', 400, {
        fieldErrors: [
          { field: 'nome', message: 'Nome é obrigatório' },
          { field: 'cpf', message: 'CPF deve conter 11 dígitos numéricos' },
        ],
      }),
    );

    await waitFor(() => expect(erroDe(raiz, 'nome')).toBe('Nome é obrigatório'));
    expect(erroDe(raiz, 'cpf')).toBe('CPF deve conter 11 dígitos numéricos');
    expect(raiz.querySelector('[data-mensagem]')).toBeNull();
  });

  it('@spec:AC-040 o cadastro tem caminho de um clique de volta para o login', async () => {
    const { raiz } = await montarTela('/criar-conta');
    expect(raiz.querySelector('a[href="/entrar"]')).not.toBeNull();
  });

  it('@spec:AC-254 só mostra a orientação do nome obrigatório depois que o campo perde foco', async () => {
    const { raiz } = await montarTela('/criar-conta');

    expect(raiz.querySelector('[data-erro]')).toBeNull();
    fireEvent.blur(campo(raiz, 'nome'));

    expect(erroDe(raiz, 'nome')).toMatch(/informe seu nome/i);
  });

  it('@spec:AC-255 liga o campo de senha ao medidor da política vigente', async () => {
    const { raiz } = await montarTela('/criar-conta');

    fireEvent.change(campo(raiz, 'senha'), { target: { value: 'segura123' } });

    expect(raiz.querySelector('[data-forca-senha]')?.getAttribute('data-aceitavel')).toBe('true');
  });

  it('@spec:AC-256 deixa o primeiro campo pronto para digitar quando a tela abre', async () => {
    const { raiz } = await montarTela('/criar-conta');

    expect(campo(raiz, 'nome')).toBe(raiz.querySelector('form input'));
    expect(document.activeElement).toBe(campo(raiz, 'nome'));
  });

  it('@spec:AC-257 mantém o rótulo Criar conta ao lado do indicador durante o envio', async () => {
    const servidor = simularServidor(() => servidor.segurar());
    const { raiz } = await montarTela('/criar-conta');

    preencher(raiz);
    enviar(raiz);
    const botao = raiz.querySelector('button[type="submit"]') as HTMLButtonElement;

    await waitFor(() => expect(botao.disabled).toBe(true));
    expect(botao.getAttribute('aria-busy')).toBe('true');
    expect(botao.querySelector('[data-giro]')).not.toBeNull();
    expect(botao.textContent?.trim()).toBe('Criar conta');
    servidor.liberar(CONTA());
  });

  it('@spec:AC-258 exibe nível e código definidos pelo catálogo, ignorando o texto cru', async () => {
    const raiz = await recusar(() => erroPadrao('SYS-001', 500));

    await waitFor(() => expect(raiz.querySelector('[data-nivel="erro"]')).not.toBeNull());
    expect(raiz.querySelector('[data-codigo]')?.textContent).toContain('SYS-001');
    expect(raiz.textContent).not.toContain('mensagem crua do servidor');
  });

  it('@spec:AC-297 revelar a senha não revela a confirmação, e vice-versa', async () => {
    const { raiz } = await montarTela('/criar-conta');
    const [botaoSenha, botaoConfirmacao] = [...raiz.querySelectorAll('[data-visibilidade-senha]')] as HTMLButtonElement[];

    expect(campo(raiz, 'senha').type).toBe('password');
    expect(campo(raiz, 'confirmarSenha').type).toBe('password');

    fireEvent.click(botaoSenha);
    expect(campo(raiz, 'senha').type).toBe('text');
    expect(campo(raiz, 'confirmarSenha').type).toBe('password');

    fireEvent.click(botaoConfirmacao);
    expect(campo(raiz, 'senha').type).toBe('text');
    expect(campo(raiz, 'confirmarSenha').type).toBe('text');

    fireEvent.click(botaoSenha);
    expect(campo(raiz, 'senha').type).toBe('password');
    expect(campo(raiz, 'confirmarSenha').type).toBe('text');
  });

  it('@spec:AC-296 cada botão nomeia o seu próprio campo', async () => {
    const { raiz } = await montarTela('/criar-conta');
    const rotulos = [...raiz.querySelectorAll('[data-visibilidade-senha]')].map((b) => b.getAttribute('aria-label'));

    expect(rotulos).toEqual(['Mostrar senha', 'Mostrar confirmação de senha']);
  });
});
