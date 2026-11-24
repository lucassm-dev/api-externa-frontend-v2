import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { ErroTraduzido, ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { useFormulario } from '@/lib/formulario';
import { REGRA_CNPJ, formatarCnpj, validarCnpj } from './cnpj';
import { Corretora, cidadeComUf, nomeExibido } from './corretoras.model';
import { corretorasService } from './corretoras.service';

/**
 * Um campo só: o CNPJ. Razão social, endereço e validação vêm de fontes
 * públicas, e a consulta a elas é lenta — por isso a tela diz o que está
 * consultando em vez de apenas travar o botão (PRD-004, PRD-009).
 *
 * Aqui mora a distinção mais cara do produto: COR-003 é veredito sobre a
 * empresa, com o motivo específico vindo do servidor; EXT-007 é a fonte que
 * não respondeu. Quem separa os dois é o código do erro, nunca o texto (P-004).
 */
export function CadastroCorretora() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  // Quem chegou aqui por falta de corretora volta para onde estava (AC-092).
  const voltarPara = parametros.get('voltarPara');

  // O CNPJ que a busca não achou chega preenchido (AC-310; no Angular o parâmetro era ignorado).
  const formulario = useFormulario({ cnpj: parametros.get('cnpj') ?? '' }, ({ cnpj }) => {
    const erro = validarCnpj(cnpj);
    return erro ? { cnpj: erro } : {};
  });
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState<{ texto: string | null; codigo: string | null } | null>(null);
  const [existente, setExistente] = useState<Corretora | null>(null);

  /**
   * O que o investidor vê sai da tradução da fundação: COR-003 já vem com o
   * motivo do servidor anexado, EXT-007 com a mensagem de indisponibilidade, e
   * nenhuma das duas empresta texto da outra. O CNPJ digitado nunca se perde.
   */
  const tratarRecusa = (recusa: ErroTraduzido, cnpj: string) => {
    const porCampo = Object.entries(recusa.porCampo);
    if (porCampo.length > 0) {
      // VAL-001: a mensagem é de cada campo e nunca vira balão no topo (PRD-009).
      formulario.aplicarErrosDoServidor(Object.fromEntries(porCampo.filter(([campo]) => campo === 'cnpj')));
      setErro({ texto: null, codigo: recusa.codigo });
    } else {
      // O motivo do COR-003 é a informação principal: fica por extenso, e o
      // campo apenas destaca — é o que o PRD-009 pede para os dois (AC-071, AC-073).
      setErro({ texto: recusa.mensagem, codigo: recusa.codigo });
      if (recusa.campoDestacado === 'cnpj') formulario.aplicarErrosDoServidor({ cnpj: REGRA_CNPJ });
    }
    if (recusa.comportamento === 'oferecer-existente') {
      // COR-002 não é beco sem saída: a corretora existe e o investidor pode abri-la.
      void corretorasService.porCnpj(cnpj).then(setExistente);
    }
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (consultando) return;
    setErro(null);
    setExistente(null);
    if (formulario.invalido) {
      formulario.tocarTodos();
      return;
    }

    setConsultando(true);
    const { cnpj } = formulario.valores;
    try {
      const corretora = await corretorasService.cadastrar(cnpj);
      setConsultando(false);
      navegar(voltarPara ?? `/corretoras/${corretora.id}`);
    } catch (falha) {
      setConsultando(false);
      if (!ehErroTraduzido(falha)) throw falha;
      tratarRecusa(falha, cnpj);
    }
  };

  return (
    <section className="grid max-w-(--largura-formulario) gap-5">
      <div>
        <h1 className="m-0 mb-1 text-titulo font-bold tracking-(--entrelinha-titulo)">Cadastrar corretora</h1>
        <p className="m-0 text-texto-fraco">
          Informe o CNPJ. O resto vem das fontes públicas — a corretora entra no catálogo compartilhado, disponível para todos os
          investidores.
        </p>
      </div>

      {erro?.texto && <MensagemFeedback nivel="erro" mensagem={erro.texto} codigo={erro.codigo} />}

      {existente && (
        <article data-existente className="grid gap-1 rounded-grande border border-borda bg-superficie p-4 shadow-baixa">
          <h2 className="m-0 text-medio font-semibold">{nomeExibido(existente)}</h2>
          <p className="m-0 font-numero text-apoio text-texto-fraco">{formatarCnpj(existente.cnpj)}</p>
          {cidadeComUf(existente) && <p className="m-0 text-apoio text-texto-fraco">{cidadeComUf(existente)}</p>}
          <Botao asChild intencao="primaria" className="mt-3 justify-self-start">
            <Link data-abrir to={`/corretoras/${existente.id}`}>
              Ver esta corretora
            </Link>
          </Botao>
        </article>
      )}

      <form onSubmit={enviar} noValidate className="grid gap-4 rounded-grande border border-borda bg-superficie p-6 shadow-cartao max-sm:p-4">
        <Campo
          rotulo="CNPJ"
          name="cnpj"
          inputMode="numeric"
          autoComplete="off"
          dica={REGRA_CNPJ}
          value={formulario.valores.cnpj}
          onChange={(evento) => formulario.mudar('cnpj', evento.target.value)}
          onBlur={() => formulario.tocar('cnpj')}
          erro={formulario.erroDe('cnpj')}
        />
        <Botao intencao="primaria" type="submit" data-enviar ocupado={consultando} className="justify-self-start">
          {consultando ? 'Consultando…' : 'Cadastrar corretora'}
        </Botao>
        {consultando && (
          <p data-consultando role="status" className="m-0 text-apoio text-texto-fraco">
            Consultando as fontes externas: Receita Federal, endereço e a base da CVM. Isso leva alguns segundos.
          </p>
        )}
      </form>
    </section>
  );
}
