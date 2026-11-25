import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Selecao } from '@/components/ui/selecao';
import { ErroTraduzido, ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { MERCADOS, Mercado } from '@/features/carteiras/carteiras.model';
import { useFormulario } from '@/lib/formulario';
import { acoesService } from './acoes.service';

const REGRA_TICKER = 'O código do papel na bolsa, como PETR4 ou AAPL.';

/**
 * Dois campos: ticker e mercado. O resto — nome da empresa, moeda, cotação e o
 * horário dela — vem da fonte do mercado escolhido. Não há cadastro no
 * servidor: a pesquisa com o mercado inclui a ação no catálogo (AC-319), e
 * por isso não há pré-requisito de carteira (ASM-078).
 */
export function CadastroAcao() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  // A lista oferece cadastrar o ticker que a busca não achou — ele já vem preenchido.
  const formulario = useFormulario(
    { ticker: parametros.get('ticker') ?? '', mercado: 'BR' },
    ({ ticker }) => (ticker.trim() ? {} : { ticker: 'Informe o ticker da ação.' }),
  );
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState<{ texto: string | null; codigo: string | null } | null>(null);

  /**
   * O comportamento sai do código do erro, nunca do texto (P-004). EXT-008
   * destaca o ticker e não perde o que foi digitado.
   */
  const tratarRecusa = (recusa: ErroTraduzido) => {
    const porCampo = Object.entries(recusa.porCampo).filter(
      ([campo]) => campo === 'ticker' || campo === 'mercado',
    );
    if (porCampo.length > 0) {
      formulario.aplicarErrosDoServidor(Object.fromEntries(porCampo));
      setErro({ texto: null, codigo: recusa.codigo });
    } else {
      setErro({ texto: recusa.mensagem, codigo: recusa.codigo });
      if (recusa.campoDestacado === 'ticker')
        formulario.aplicarErrosDoServidor({ ticker: REGRA_TICKER });
    }
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (consultando) return;
    setErro(null);
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
      tratarRecusa(falha);
    }
  };

  return (
    <section className="grid max-w-(--largura-formulario) gap-5">
      <div>
        <h1 className="m-0 mb-1 text-titulo font-bold tracking-(--entrelinha-titulo)">
          Cadastrar ação
        </h1>
        <p className="m-0 text-texto-fraco">
          Informe o ticker e o mercado. O nome da empresa, a moeda e a cotação vêm da fonte daquele
          mercado — a ação entra no catálogo compartilhado, disponível para todos os investidores.
        </p>
      </div>

      {erro?.texto && <MensagemFeedback nivel="erro" mensagem={erro.texto} codigo={erro.codigo} />}

      <form
        onSubmit={enviar}
        noValidate
        className="grid gap-4 rounded-grande border border-borda bg-superficie p-6 shadow-cartao max-sm:p-4"
      >
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
        <Botao
          intencao="primaria"
          type="submit"
          data-enviar
          ocupado={consultando}
          className="justify-self-start"
        >
          {consultando ? 'Consultando…' : 'Cadastrar ação'}
        </Botao>
        {consultando && (
          <p data-consultando role="status" className="m-0 text-apoio text-texto-fraco">
            Consultando a fonte de cotação do mercado escolhido. Isso leva alguns segundos.
          </p>
        )}
      </form>
    </section>
  );
}
