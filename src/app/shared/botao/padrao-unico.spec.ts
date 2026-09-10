import { readFileSync } from 'node:fs';

/**
 * AC-266: uma única origem para todo botão. Este teste varre os templates de
 * tela do produto e falha se sobrar diretiva de botão do Angular Material ou se
 * algum `<button>` de tela não passar pelo componente compartilhado `appBotao`.
 */
const TEMPLATES = [
  'src/app/layout/casca.html',
  'src/app/shared/paginador/paginador.html',
  'src/app/shared/confirmacao/dialogo-confirmacao.html',
  'src/app/shared/estado-vazio/estado-vazio.html',
  'src/app/shared/tabela/cabecalho-ordenavel.html',
  'src/app/features/acesso/login/login.html',
  'src/app/features/acesso/cadastro/cadastro.html',
  'src/app/features/carteiras/lista/lista-carteiras.html',
  'src/app/features/carteiras/criacao/criar-carteira.html',
  'src/app/features/carteiras/detalhe/detalhe-carteira.html',
  'src/app/features/carteiras/detalhe/movimentacoes-carteira.html',
  'src/app/features/corretoras/lista/lista-corretoras.html',
  'src/app/features/corretoras/cadastro/cadastro-corretora.html',
  'src/app/features/corretoras/detalhe/detalhe-corretora.html',
  'src/app/features/acoes/lista/lista-acoes.html',
  'src/app/features/acoes/cadastro/cadastro-acao.html',
  'src/app/features/acoes/detalhe/detalhe-acao.html',
  'src/app/features/operacoes/formulario/formulario-operacao.html',
  'src/app/features/operacoes/edicao/editar-operacao.html',
];

const DIRETIVA_MATERIAL = /\bmat-(?:flat-|stroked-|raised-|fab-|mini-fab-)?button\b|\bmatButton\b/;

function tagsDeAbertura(conteudo: string, tag: 'button' | 'a'): string[] {
  return conteudo.match(new RegExp(`<${tag}\\b[\\s\\S]*?>`, 'g')) ?? [];
}

describe('Botão único do produto', () => {
  const fontes = TEMPLATES.map((caminho) => ({ caminho, html: readFileSync(caminho, 'utf8') }));

  it('@spec:AC-266 nenhum template de tela chama diretiva de botão do Material', () => {
    const infratores = fontes
      .filter(({ html }) => DIRETIVA_MATERIAL.test(html))
      .map(({ caminho }) => caminho);

    expect(infratores).toEqual([]);
  });

  it('@spec:AC-266 todo <button> de tela passa pelo botão compartilhado appBotao', () => {
    const semAppBotao: string[] = [];

    for (const { caminho, html } of fontes) {
      for (const tag of tagsDeAbertura(html, 'button')) {
        if (!/\bappBotao\b/.test(tag)) {
          semAppBotao.push(`${caminho}: ${tag.replace(/\s+/g, ' ').trim()}`);
        }
      }
    }

    expect(semAppBotao).toEqual([]);
  });

  it('@spec:AC-266 os links que agem como botão passam pelo appBotao', () => {
    // Âncoras de call-to-action, nomeadas uma a uma para não confundir com os
    // links de ícone e de navegação que dividem `data-*` parecido. Cada uma
    // tinha diretiva do Material antes desta tarefa; agora tem `appBotao`.
    const LINKS_CTA: Array<[string, RegExp]> = [
      ['src/app/features/carteiras/lista/lista-carteiras.html', /<a\b[\s\S]*?\bdata-nova\b[\s\S]*?>/],
      [
        'src/app/features/carteiras/criacao/criar-carteira.html',
        /<a\b[\s\S]*?\bdata-cadastrar-corretora\b[\s\S]*?>/,
      ],
      [
        'src/app/features/carteiras/detalhe/detalhe-carteira.html',
        /<a\b[\s\S]*?\bdata-registrar-compra\b[\s\S]*?>/,
      ],
      [
        'src/app/features/carteiras/detalhe/detalhe-carteira.html',
        /<a\b[\s\S]*?\bdata-registrar-venda\b[\s\S]*?>/,
      ],
      [
        'src/app/features/corretoras/lista/lista-corretoras.html',
        /<a\b[\s\S]*?\bdata-cadastrar-buscado\b[\s\S]*?>/,
      ],
      [
        'src/app/features/corretoras/cadastro/cadastro-corretora.html',
        /<a\b[\s\S]*?\bdata-abrir\b[\s\S]*?>/,
      ],
      [
        'src/app/features/acoes/lista/lista-acoes.html',
        /<a\b[\s\S]*?\bdata-cadastrar-buscado\b[\s\S]*?>/,
      ],
      ['src/app/features/acoes/cadastro/cadastro-acao.html', /<a\b[\s\S]*?\bdata-abrir\b[\s\S]*?>/],
      [
        'src/app/features/acoes/cadastro/cadastro-acao.html',
        /<a\b[\s\S]*?\bdata-criar-carteira\b[\s\S]*?>/,
      ],
    ];

    const semAppBotao: string[] = [];
    for (const [caminho, re] of LINKS_CTA) {
      const html = fontes.find((f) => f.caminho === caminho)!.html;
      const tag = html.match(re)?.[0];
      if (!tag || !/\bappBotao\b/.test(tag)) {
        semAppBotao.push(`${caminho}: ${tag?.replace(/\s+/g, ' ').trim() ?? '(não encontrado)'}`);
      }
    }

    expect(semAppBotao).toEqual([]);
  });

  it('@spec:AC-266 o componente compartilhado é um só e mora em shared/botao', () => {
    const botao = readFileSync('src/app/shared/botao/botao.ts', 'utf8');
    expect(botao).toMatch(/selector:\s*'button\[appBotao\],\s*a\[appBotao\]'/);
  });
});
