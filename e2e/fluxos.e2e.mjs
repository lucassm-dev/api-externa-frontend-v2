// Fluxos de ponta a ponta contra o backend de verdade (#58). Sem serviço externo:
// brapi, CVM e SMTP ficam de fora para o resultado não depender deles.
//
// E2E_BASE_URL     onde o front responde (CI: nginx de produção na 8081)
// E2E_ADMIN_EMAIL  ADMIN semeado pelo backend (ADMIN_EMAIL/ADMIN_SENHA)
// E2E_ADMIN_SENHA
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { after, before, describe, test } from 'node:test';
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:8081';
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, senha: process.env.E2E_ADMIN_SENHA };
const CAPTURAS = 'e2e/capturas';

/** CPF com dígitos verificadores válidos: o backend confere o formato. */
function cpfValido() {
  const digitos = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const verificador = (parcial) => {
    const soma = parcial.reduce((total, digito, i) => total + digito * (parcial.length + 1 - i), 0) % 11;
    return soma < 2 ? 0 : 11 - soma;
  };
  digitos.push(verificador(digitos));
  digitos.push(verificador(digitos));
  return digitos.join('');
}

const sufixo = `${Date.now()}`.slice(-8);
const investidor = { nome: 'Investidor E2E', email: `e2e.${sufixo}@exemplo.com`, senha: `E2e${sufixo}x`, cpf: cpfValido() };

let navegador;

before(async () => {
  assert.ok(ADMIN.email && ADMIN.senha, 'defina E2E_ADMIN_EMAIL e E2E_ADMIN_SENHA');
  mkdirSync(CAPTURAS, { recursive: true });
  navegador = await chromium.launch();
});

after(async () => {
  await navegador?.close();
});

/** Cada passo numa sessão limpa; falhou, fica a captura para o artefato do CI. */
async function comPagina(nome, passos) {
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pagina = await contexto.newPage();
  try {
    await passos(pagina);
  } catch (erro) {
    await pagina.screenshot({ path: `${CAPTURAS}/${nome}.png`, fullPage: true }).catch(() => {});
    throw erro;
  } finally {
    await contexto.close();
  }
}

async function entrar(pagina, { email, senha }) {
  await pagina.goto(`${BASE}/entrar`);
  await pagina.fill('input[name="email"]', email);
  await pagina.fill('input[name="senha"]', senha);
  await pagina.click('form button[type="submit"]');
}

describe('Fluxos contra o backend real', () => {
  test('cadastro e login de um investidor abrem o painel', () =>
    comPagina('cadastro-login', async (pagina) => {
      await pagina.goto(`${BASE}/criar-conta`);
      await pagina.fill('input[name="nome"]', investidor.nome);
      await pagina.fill('input[name="email"]', investidor.email);
      await pagina.fill('input[name="cpf"]', investidor.cpf);
      await pagina.fill('input[name="senha"]', investidor.senha);
      await pagina.fill('input[name="confirmarSenha"]', investidor.senha);
      await pagina.click('form button[type="submit"]');
      await pagina.waitForURL(/\/entrar\?.*contaCriada=1/);

      await pagina.fill('input[name="senha"]', investidor.senha);
      await pagina.click('form button[type="submit"]');
      await pagina.waitForURL(/\/painel$/);
      await pagina.waitForSelector(`[data-identidade-investidor]:has-text("${investidor.nome}")`);
    }));

  test('Minha conta mostra os dados pessoais vindos do backend', () =>
    comPagina('dados-pessoais', async (pagina) => {
      await entrar(pagina, investidor);
      await pagina.waitForURL(/\/painel$/);
      await pagina.goto(`${BASE}/conta`);
      const dados = pagina.locator('[data-secao-conta="dados"]');
      await dados.getByText(investidor.nome).waitFor();
      await dados.getByText(investidor.email).waitFor();
    }));

  test('recarregar uma tela que divide o endereço com a API devolve o app, e a API continua respondendo', () =>
    comPagina('recarregar', async (pagina) => {
      for (const caminho of ['/corretoras', '/carteiras', '/operacoes', '/admin/usuarios']) {
        const tela = await pagina.request.get(`${BASE}${caminho}`, { headers: { Accept: 'text/html' } });
        assert.match(tela.headers()['content-type'] ?? '', /text\/html/, `${caminho} como página`);
        assert.match(await tela.text(), /<div id="raiz"/, `${caminho} devolve o app`);
      }
      const api = await pagina.request.get(`${BASE}/corretoras`, { headers: { Accept: 'application/json' } });
      assert.match(api.headers()['content-type'] ?? '', /json/, '/corretoras como API chega ao backend');
    }));

  test('o ADMIN entra por Usuários, bloqueia o investidor e desbloqueia', async () => {
    const linhaDoInvestidor = (pagina) => pagina.locator('[data-usuario]', { hasText: investidor.email });

    await comPagina('admin-bloqueio', async (pagina) => {
      await entrar(pagina, ADMIN);
      await pagina.waitForURL(/\/admin\/usuarios$/);
      await linhaDoInvestidor(pagina).getByRole('button', { name: 'Bloquear', exact: true }).click();
      const dialogo = pagina.getByRole('alertdialog');
      await dialogo.locator('input[name="motivo"]').fill('Teste de ponta a ponta');
      await dialogo.locator('[data-confirmar]').click();
      await linhaDoInvestidor(pagina).getByText('Bloqueado').waitFor();
    });

    await comPagina('investidor-bloqueado', async (pagina) => {
      await entrar(pagina, investidor);
      await pagina.getByText('Esta conta está bloqueada').waitFor();
      assert.match(pagina.url(), /\/entrar/);
    });

    await comPagina('admin-desbloqueio', async (pagina) => {
      await entrar(pagina, ADMIN);
      await pagina.waitForURL(/\/admin\/usuarios$/);
      await linhaDoInvestidor(pagina).getByRole('button', { name: 'Desbloquear', exact: true }).click();
      await linhaDoInvestidor(pagina).getByText('Ativo').waitFor();
    });

    await comPagina('investidor-desbloqueado', async (pagina) => {
      await entrar(pagina, investidor);
      await pagina.waitForURL(/\/painel$/);
    });
  });

  test('excluir a própria conta encerra a sessão e o login seguinte é recusado', async () => {
    await comPagina('excluir-conta', async (pagina) => {
      await entrar(pagina, investidor);
      await pagina.waitForURL(/\/painel$/);
      await pagina.goto(`${BASE}/conta`);
      const excluir = pagina.locator('[data-secao-conta="excluir"]').getByRole('button', { name: 'Excluir minha conta' });
      await pagina.waitForFunction(() => {
        const botao = document.querySelector('[data-secao-conta="excluir"] button');
        return botao && !botao.disabled;
      });
      await excluir.click();
      await pagina.getByRole('alertdialog').locator('[data-confirmar]').click();
      await pagina.waitForURL(/\/entrar\?contaExcluida=1/);
      await pagina.getByText('Sua conta foi excluída').waitFor();
    });

    await comPagina('login-depois-de-excluir', async (pagina) => {
      await entrar(pagina, investidor);
      await pagina.getByText('E-mail ou senha incorretos').waitFor();
      assert.match(pagina.url(), /\/entrar/);
    });
  });
});
