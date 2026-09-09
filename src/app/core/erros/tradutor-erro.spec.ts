import { HttpErrorResponse } from '@angular/common/http';
import { ErroPadrao } from '../api/erro-padrao';
import { CATALOGO_ERROS, MENSAGEM_GENERICA, MENSAGEM_SEM_RESPOSTA } from './catalogo-erros';
import { traduzirErro } from './tradutor-erro';

function respostaDoServidor(parcial: Partial<ErroPadrao>): HttpErrorResponse {
  const corpo: ErroPadrao = {
    timestamp: '2026-09-08T12:00:00Z',
    status: parcial.status ?? 422,
    codigo: parcial.codigo ?? 'SYS-001',
    error: 'Unprocessable Entity',
    message: parcial.message ?? 'mensagem crua do servidor',
    path: '/operacoes',
    ...parcial,
  };
  return new HttpErrorResponse({ status: corpo.status, error: corpo, url: corpo.path });
}

describe('Tradução de erro por código', () => {
  it('@spec:AC-001 código conhecido vira a mensagem do produto, com o código guardado para o rodapé', () => {
    const traduzido = traduzirErro(
      respostaDoServidor({ codigo: 'OPE-004', message: 'Quantidade de venda excede a posição atual' }),
      { quantidade: 30 },
    );

    expect(traduzido.mensagem).toBe('Você tem apenas 30 unidades desta ação.');
    expect(traduzido.codigo).toBe('OPE-004');
    expect(traduzido.conhecido).toBe(true);
    expect(traduzido.comportamento).toBe('permanecer-no-formulario');
    expect(traduzido.campoDestacado).toBe('quantidade');
  });

  it('@spec:AC-001 a decisão vem do código, nunca do texto: mesmo texto com códigos diferentes dá telas diferentes', () => {
    const mesmoTexto = 'texto idêntico do servidor';
    const naoEncontrada = traduzirErro(respostaDoServidor({ codigo: 'COR-001', message: mesmoTexto }));
    const duplicada = traduzirErro(respostaDoServidor({ codigo: 'COR-002', message: mesmoTexto }));

    expect(naoEncontrada.mensagem).not.toBe(duplicada.mensagem);
    expect(naoEncontrada.comportamento).not.toBe(duplicada.comportamento);
    expect(naoEncontrada.mensagem).not.toContain(mesmoTexto);
  });

  it('@spec:AC-001 a tabela inteira do PRD-009 tem mensagem própria e nenhuma cai no genérico', () => {
    const codigos = [
      'COR-001', 'COR-002', 'COR-003', 'COR-004',
      'ACA-001', 'ACA-002', 'ACA-003', 'ACA-004',
      'CAR-001', 'CAR-002',
      'OPE-001', 'OPE-003', 'OPE-004', 'OPE-005',
      'AUT-001', 'AUT-002', 'AUT-003', 'AUT-004', 'AUT-005', 'AUT-006', 'AUT-007', 'AUT-008',
      'EXT-007', 'EXT-008', 'EXT-009', 'EXT-010', 'EXT-011',
      'VAL-001', 'SYS-001',
    ];

    for (const codigo of codigos) {
      expect(CATALOGO_ERROS[codigo], `${codigo} fora do catálogo`).toBeDefined();
      const traduzido = traduzirErro(respostaDoServidor({ codigo }), { horario: '11:45', quantidade: 1 });
      expect(traduzido.conhecido, `${codigo} caiu no genérico`).toBe(true);
      if (codigo !== 'SYS-001') {
        expect(traduzido.mensagem, `${codigo} repete o texto genérico`).not.toBe(MENSAGEM_GENERICA);
      }
    }
  });

  it('@spec:AC-001 COR-003 reproduz o motivo que o servidor informou, sem resumir os quatro casos', () => {
    const motivo = 'Corretora não autorizada na CVM';
    const traduzido = traduzirErro(respostaDoServidor({ codigo: 'COR-003', message: motivo }));

    expect(traduzido.mensagem).toContain(motivo);
    expect(traduzido.comportamento).toBe('permanecer-no-formulario');
    expect(traduzido.campoDestacado).toBe('cnpj');
  });

  it('@spec:AC-001 EXT-007 é falha de infraestrutura, nunca reprovação da corretora', () => {
    const traduzido = traduzirErro(respostaDoServidor({ codigo: 'EXT-007', status: 503 }));

    expect(traduzido.mensagem).toBe('Não conseguimos verificar esta corretora agora. Tente novamente em instantes.');
    expect(traduzido.comportamento).toBe('permanecer-no-formulario');
    expect(traduzido.mensagem).not.toMatch(/autorizada|reprov/i);
  });

  it('@spec:AC-002 código desconhecido cai no genérico com o código visível', () => {
    const traduzido = traduzirErro(respostaDoServidor({ codigo: 'XYZ-999', message: 'algo interno' }));

    expect(traduzido.mensagem).toBe(MENSAGEM_GENERICA);
    expect(traduzido.codigo).toBe('XYZ-999');
    expect(traduzido.exibirCodigo).toBe(true);
    expect(traduzido.conhecido).toBe(false);
    expect(traduzido.mensagem).not.toContain('algo interno');
  });

  it('@spec:AC-003 VAL-001 distribui as mensagens por campo, sem nenhum balão único no topo', () => {
    const traduzido = traduzirErro(
      respostaDoServidor({
        status: 400,
        codigo: 'VAL-001',
        fieldErrors: [
          { field: 'cpf', message: 'CPF deve ter 11 dígitos' },
          { field: 'senha', message: 'Precisa ter ao menos 8 caracteres, com letra e número' },
        ],
      }),
    );

    expect(traduzido.porCampo).toEqual({
      cpf: 'CPF deve ter 11 dígitos',
      senha: 'Precisa ter ao menos 8 caracteres, com letra e número',
    });
    expect(traduzido.mensagem).toBe('');
    expect(traduzido.comportamento).toBe('destacar-campos');
  });

  it('@spec:AC-003 VAL-001 sem fieldErrors (campo omitido quando vazio) não quebra nem inventa balão', () => {
    const traduzido = traduzirErro(respostaDoServidor({ status: 400, codigo: 'VAL-001' }));

    expect(traduzido.porCampo).toEqual({});
    expect(traduzido.comportamento).toBe('destacar-campos');
  });

  it('@spec:AC-004 sem resposta do servidor tem mensagem própria, diferente do erro do servidor', () => {
    const semResposta = traduzirErro(
      new HttpErrorResponse({ status: 0, error: new ProgressEvent('error'), url: '/carteiras' }),
    );
    const erroDoServidor = traduzirErro(respostaDoServidor({ status: 500, codigo: 'SYS-001' }));

    expect(semResposta.mensagem).toBe(MENSAGEM_SEM_RESPOSTA);
    expect(semResposta.mensagem).not.toBe(erroDoServidor.mensagem);
    expect(semResposta.codigo).toBeNull();
    expect(semResposta.exibirCodigo).toBe(false);
  });

  it('@spec:AC-004 resposta sem corpo no formato do contrato também não vira texto técnico', () => {
    const traduzido = traduzirErro(
      new HttpErrorResponse({ status: 502, error: '<html>Bad Gateway</html>', url: '/carteiras' }),
    );

    expect(traduzido.mensagem).toBe(MENSAGEM_GENERICA);
    expect(traduzido.mensagem).not.toContain('html');
  });
});
