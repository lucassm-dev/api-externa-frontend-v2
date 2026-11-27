import { readFileSync } from 'node:fs';
import { cleanup, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, json, simularServidor } from '@/test/servidor';

// O jsdom não calcula layout: aqui se prova a regra (classes e estrutura); o resultado visual foi conferido no navegador.
const INVESTIDOR: Identidade = { papel: 'INVESTIDOR', nome: 'Lucas Mendes', fotoUrl: null };
const ADMIN: Identidade = { papel: 'ADMIN', nome: null, fotoUrl: null };
const USUARIO = { id: 1, email: 'lucas@exemplo.com', nome: 'Lucas Mendes', papel: 'INVESTIDOR', situacao: 'ATIVO', motivoBloqueio: null, carteirasAtivas: 1, temPosicaoAberta: false };

const caminho = (chamada: Chamada) => new URL(chamada.url, 'http://localhost').pathname;

function abrir(endereco: string, identidade: Identidade = INVESTIDOR) {
  sessao.iniciar({ token: 't', tipo: 'Bearer', expiraEm: new Date(Date.now() + 36e5).toISOString() }, 'lucas@exemplo.com', identidade);
  simularServidor((chamada) => {
    const rota = caminho(chamada);
    if (rota === '/admin/usuarios/totais') return json({ ATIVO: 1, BLOQUEADO: 0 });
    if (rota === '/admin/usuarios') return json({ content: [USUARIO], totalElements: 1, totalPages: 1, number: 0, size: 20 });
    return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: [endereco] })} />);
}

const esperar = <T,>(buscar: () => T | null | undefined) =>
  waitFor(() => {
    const achado = buscar();
    if (!achado) throw new Error('ainda não apareceu');
    return achado;
  });
const classes = (elemento: Element | null) => elemento?.getAttribute('class') ?? '';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Coluna central', () => {
  it('@spec:AC-376 o conteúdo fica numa coluna central e a barra do topo alinha com ela', async () => {
    abrir('/conta');
    const principal = await esperar(() => document.querySelector('main'));

    expect(classes(principal)).toContain('mx-auto');
    expect(classes(principal)).toContain('max-w-(--largura-pagina)');
    expect(classes(document.querySelector('[data-barra]'))).toContain('var(--largura-pagina)');
    expect(readFileSync('src/styles/tokens.css', 'utf8')).toMatch(/--largura-pagina:\s*1280px/);
  });

  it('@spec:AC-377 Minha conta e os formulários ficam no centro da coluna', async () => {
    const paginas: Array<[string, Identidade]> = [
      ['/conta', INVESTIDOR],
      ['/carteiras/nova', INVESTIDOR],
      ['/acoes/nova', INVESTIDOR],
      ['/corretoras/nova', ADMIN],
      ['/admin/usuarios/novo', ADMIN],
    ];
    for (const [endereco, identidade] of paginas) {
      abrir(endereco, identidade);
      const pagina = await esperar(() => document.querySelector('main > section'));
      expect(classes(pagina), endereco).toContain('mx-auto');
      expect(classes(pagina), endereco).toMatch(/max-w-\(--largura-(formulario|conta)\)/);
      cleanup();
      vi.unstubAllGlobals();
    }
  });
});

describe('Telas na língua do kit', () => {
  it('@spec:AC-378 escolher foto é um botão do kit com o campo de arquivo dentro e a dica ligada', async () => {
    abrir('/conta');
    const secao = await esperar(() => document.querySelector('[data-secao-conta="foto"]'));
    const campo = await esperar(() => secao.querySelector('input[type="file"]'));
    const botao = campo.closest('label')!;

    expect(botao.textContent).toContain('Escolher foto');
    expect(classes(botao)).toContain('rounded-pilula');
    expect(classes(campo)).toContain('sr-only');
    expect(document.getElementById(campo.getAttribute('aria-describedby')!)?.textContent).toContain('JPEG, PNG ou WebP');
  });

  it('@spec:AC-379 filtros do extrato num cartão e tabela de usuários na largura da coluna', async () => {
    abrir('/relatorios');
    const filtros = await esperar(() => document.querySelector('[data-filtros-extrato]'));
    expect(classes(filtros)).toMatch(/rounded-grande.*border|border.*rounded-grande/);
    expect(classes(filtros)).toContain('bg-superficie');
    cleanup();
    vi.unstubAllGlobals();

    abrir('/admin/usuarios', ADMIN);
    const linha = await esperar(() => document.querySelector('[data-usuario="1"]'));
    expect([...linha.querySelectorAll('td')].some((celula) => classes(celula).split(' ').includes('w-full'))).toBe(true);
  });
});
