import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Selecao } from '@/components/ui/selecao';
import { ErroTraduzido, ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { MERCADOS, Mercado } from '@/features/carteiras/carteiras.model';
import { useFormulario } from '@/lib/formulario';
import { Acao } from './acoes.model';
import { acoesService } from './acoes.service';

const REGRA_TICKER = 'O código do papel na bolsa, como PETR4 ou AAPL.';

/**
 * Dois campos: ticker e mercado. O resto — nome da empresa, moeda, cotação e o
 * horário dela — vem da fonte do mercado escolhido.
 *
 * O pré-requisito que mais confunde no produto está aqui: cadastrar ação exige
 * ter carteira (ADR-003). A tela pergunta isso ao servidor ANTES de renderizar
 * campo algum — ninguém deve preencher um formulário para descobrir que não
 * podia. ACA-004 continua tratado, mas como rede de segurança.
 *
 * Não saber se o investidor tem carteira não é o mesmo que ele não ter: com a
 * consulta falha, o formulário abre e quem decide é o servidor no envio.
 */
export function CadastroAcao() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  // A lista oferece cadastrar o ticker que a busca não achou — ele já vem preenchido.
  const formulario = useFormulario({ ticker: parametros.get('ticker') ?? '', mercado: 'BR' }, ({ ticker }) =>
    ticker.trim() ? {} : { ticker: 'Informe o ticker da ação.' },
  );
  const [verificandoCarteira, setVerificandoCarteira] = useState(true);
  const [temCarteira, setTemCarteira] = useState<boolean | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState<{ texto: string | null; codigo: string | null } | null>(null);
  const [existente, setExistente] = useState<Acao | null>(null);
  const [faltaCarteira, setFaltaCarteira] = useState(false);

  useEffect(() => {
    void acoesService.investidorTemCarteira().then((tem) => {
      setTemCarteira(tem);
      setVerificandoCarteira(false);
    });
  }, []);

  // O bloqueio é do estado conhecido: `null` (consulta falhou) não bloqueia.
  const bloqueado = temCarteira === false;

  /**
   * O comportamento sai do código do erro, nunca do texto (P-004). EXT-008
   * destaca o ticker e não perde o que foi digitado; ACA-002 vai buscar a ação
   * existente; ACA-004 repete o atalho do pré-requisito.
   */
  const tratarRecusa = (recusa: ErroTraduzido, ticker: string) => {
    const porCampo = Object.entries(recusa.porCampo).filter(([campo]) => campo === 'ticker' || campo === 'mercado');
    if (porCampo.length > 0) {
      formulario.aplicarErrosDoServidor(Object.fromEntries(porCampo));
      setErro({ texto: null, codigo: recusa.codigo });
    } else {
      setErro({ texto: recusa.mensagem, codigo: recusa.codigo });
      if (recusa.campoDestacado === 'ticker') formulario.aplicarErrosDoServidor({ ticker: REGRA_TICKER });
    }
    if (recusa.comportamento === 'oferecer-existente') void acoesService.porTicker(ticker).then(setExistente);
    if (recusa.comportamento === 'oferecer-pre-requisito') setFaltaCarteira(true);
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (consultando || bloqueado) return;
    setErro(null);
    setExistente(null);
    setFaltaCarteira(false);
    if (formulario.invalido) {
      formulario.tocarTodos();
      return;
    }

    setConsultando(true);
    const { ticker, mercado } = formulario.valores;
    try {
      const acao = await acoesService.cadastrar({ ticker, mercado: mercado as Mercado });
      setConsultando(false);
      navegar(`/acoes/${acao.ticker}`);
    } catch (falha) {
      setConsultando(false);
      if (!ehErroTraduzido(falha)) throw falha;
      tratarRecusa(falha, ticker);
    }
  };

  return (
    <section className="grid max-w-(--largura-formulario) gap-5">
      <div>
        <h1 className="m-0 mb-1 text-titulo font-bold tracking-(--entrelinha-titulo)">Cadastrar ação</h1>
        <p className="m-0 text-texto-fraco">
          Informe o ticker e o mercado. O nome da empresa, a moeda e a cotação vêm da fonte daquele mercado — a ação entra no catálogo
          compartilhado, disponível para todos os investidores.
        </p>
      </div>

      {erro?.texto && <MensagemFeedback nivel="erro" mensagem={erro.texto} codigo={erro.codigo} />}

      {existente && (
        <article data-existente className="grid gap-1 rounded-grande border border-borda bg-superficie p-4 shadow-baixa">
          <h2 className="m-0 text-medio font-semibold">{existente.ticker}</h2>
          <p className="m-0 text-apoio text-texto-fraco">{existente.nomeEmpresa}</p>
          <Botao asChild intencao="primaria" className="mt-3 justify-self-start">
            <Link data-abrir to={`/acoes/${existente.ticker}`}>
              Ver esta ação
            </Link>
          </Botao>
        </article>
      )}

      {verificandoCarteira ? (
        <div aria-hidden="true" className="grid gap-3">
          <Esqueleto formato="bloco" />
        </div>
      ) : bloqueado || faltaCarteira ? (
        <div data-sem-carteira className="grid gap-2 rounded-grande border border-dashed border-borda bg-superficie p-6">
          <h2 className="m-0 text-medio font-semibold">Antes, uma carteira</h2>
          <p className="m-0 text-texto-fraco">
            Crie uma carteira antes de cadastrar ações. É nela que as compras e vendas desta ação serão registradas, e o sistema exige ao
            menos uma carteira ativa para aceitar o cadastro.
          </p>
          <Botao asChild intencao="primaria" className="mt-2 justify-self-start">
            <Link data-criar-carteira to={`/carteiras/nova?${new URLSearchParams({ voltarPara: '/acoes/nova' })}`}>
              Criar carteira
            </Link>
          </Botao>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="grid gap-4 rounded-grande border border-borda bg-superficie p-6 shadow-cartao max-sm:p-4">
          <Campo
            rotulo="Ticker"
            name="ticker"
            data-campo-ticker
            autoComplete="off"
            autoCapitalize="characters"
            dica={REGRA_TICKER}
            value={formulario.valores.ticker}
            onChange={(evento) => formulario.mudar('ticker', evento.target.value)}
            onBlur={() => formulario.tocar('ticker')}
            erro={formulario.erroDe('ticker')}
          />
          <Selecao
            rotulo="Mercado"
            empilhado
            name="mercado"
            data-campo-mercado
            value={formulario.valores.mercado}
            onChange={(evento) => formulario.mudar('mercado', evento.target.value)}
            erro={formulario.erroDe('mercado')}
          >
            {MERCADOS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </Selecao>
          <Botao intencao="primaria" type="submit" data-enviar ocupado={consultando} className="justify-self-start">
            {consultando ? 'Consultando…' : 'Cadastrar ação'}
          </Botao>
          {consultando && (
            <p data-consultando role="status" className="m-0 text-apoio text-texto-fraco">
              Consultando a fonte de cotação do mercado escolhido. Isso leva alguns segundos.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
