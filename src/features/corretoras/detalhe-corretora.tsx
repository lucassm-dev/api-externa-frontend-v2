import { ArrowLeft, BadgeCheck, CircleAlert, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { DialogoConfirmacao } from '@/components/ui/dialogo-confirmacao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { feedback } from '@/core/feedback/feedback.service';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarData } from '@/core/formatacao/formatacao';
import { sessao } from '@/core/sessao/sessao.service';
import { formatarCnpj } from './cnpj';
import { Corretora, nomeExibido } from './corretoras.model';
import { corretorasService } from './corretoras.service';

type Erro = { texto: string; codigo: string | null };

/**
 * Os dados vêm de fonte externa e não são editáveis. A data da base da CVM
 * aparece junto da validação porque a base reflete o último dia útil: uma
 * corretora autorizada hoje de manhã pode ainda não constar nela (PRD-004).
 *
 * Remover é só do ADMIN (AC-317, AC-318); para ele, a única proteção é o
 * vínculo ativo, que o servidor decide.
 */
export function DetalheCorretora() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [corretora, setCorretora] = useState<Corretora | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState<Erro | null>(null);

  useEffect(() => {
    let vigente = true;
    setCarregando(true);
    corretorasService.porId(Number(id)).then(
      (resposta) => {
        if (!vigente) return;
        setCorretora(resposta);
        setCarregando(false);
      },
      (falha: unknown) => {
        if (!vigente || !ehErroTraduzido(falha)) return;
        setCarregando(false);
        if (falha.comportamento === 'voltar-a-lista') {
          feedback.errar(falha.mensagem, falha.codigo);
          navegar('/corretoras');
        } else {
          setErro({ texto: falha.mensagem, codigo: falha.codigo });
        }
      },
    );
    return () => {
      vigente = false;
    };
  }, [id, navegar]);

  /**
   * A remoção é lógica no backend, mas isso não aparece aqui: para o
   * investidor, a corretora some da lista. Sem lixeira, sem desfazer (ADR-007).
   */
  const confirmarRemocao = async () => {
    if (!corretora || removendo) return;
    setRemovendo(true);
    try {
      await corretorasService.remover(corretora.id);
      setRemovendo(false);
      setConfirmandoRemocao(false);
      feedback.informar(`${nomeExibido(corretora)} saiu do catálogo.`);
      navegar('/corretoras');
    } catch (falha) {
      setRemovendo(false);
      if (!ehErroTraduzido(falha)) throw falha;
      // COR-004 cancela a exclusão. O texto é o do catálogo e não nomeia
      // investidor nem quantidade: de quem são as carteiras não se revela.
      setConfirmandoRemocao(false);
      setErro({ texto: falha.mensagem, codigo: falha.codigo });
    }
  };

  const dados: Array<[string, string | null]> = corretora
    ? [
        ['Razão social', corretora.razaoSocial],
        ['Nome fantasia', corretora.nomeFantasia],
        ['Situação cadastral', corretora.situacaoCadastral],
        ['E-mail', corretora.email],
        ['Telefone', corretora.telefone],
        ['CEP', corretora.cep],
        ['Logradouro', corretora.logradouro ? `${corretora.logradouro}${corretora.numero ? `, ${corretora.numero}` : ''}` : null],
        ['Complemento', corretora.complemento],
        ['Bairro', corretora.bairro],
        ['Cidade', corretora.cidade || corretora.uf ? `${corretora.cidade ?? ''}${corretora.uf ? `/${corretora.uf}` : ''}` : null],
        ['No catálogo desde', formatarData(corretora.dataCadastro)],
      ]
    : [];

  return (
    <section className="grid gap-5">
      <Link to="/corretoras" className="inline-flex items-center gap-1 justify-self-start text-apoio font-semibold no-underline hover:underline">
        <ArrowLeft aria-hidden="true" focusable="false" className="size-4" />
        Voltar às corretoras
      </Link>

      {erro && <MensagemFeedback nivel="erro" mensagem={erro.texto} codigo={erro.codigo} />}

      {carregando ? (
        <div aria-hidden="true" className="grid gap-3">
          <Esqueleto />
          <Esqueleto formato="bloco" />
        </div>
      ) : (
        corretora && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">{nomeExibido(corretora)}</h1>
                <p className="m-0 mt-1 font-numero text-texto-fraco">{formatarCnpj(corretora.cnpj)}</p>
              </div>
              {sessao.papel() === 'ADMIN' && (
                <Botao intencao="destrutiva" type="button" data-remover onClick={() => {
                  setErro(null);
                  setConfirmandoRemocao(true);
                }}>
                  <Trash2 aria-hidden="true" focusable="false" />
                  Remover do catálogo
                </Botao>
              )}
            </header>

            <p data-validacao className="m-0 grid gap-1 rounded-grande border border-borda bg-superficie p-4">
              <span className="inline-flex items-center gap-2 font-semibold">
                {corretora.validadaNaCvm ? (
                  <BadgeCheck aria-hidden="true" focusable="false" className="size-5 text-sucesso-texto" />
                ) : (
                  <CircleAlert aria-hidden="true" focusable="false" className="size-5 text-aviso-texto" />
                )}
                {corretora.validadaNaCvm ? 'Validada na CVM' : 'Sem validação na CVM'}
              </span>
              {corretora.dataBaseCvm && (
                <span data-base-cvm className="text-apoio text-texto-fraco">
                  Base oficial de {formatarData(corretora.dataBaseCvm)} — ela reflete o último dia útil, então uma autorização recente pode
                  ainda não constar.
                </span>
              )}
            </p>

            <dl className="m-0 grid gap-x-6 gap-y-4 rounded-grande border border-borda bg-superficie p-5 sm:grid-cols-2">
              {dados
                .filter(([, valor]) => valor)
                .map(([rotulo, valor]) => (
                  <div key={rotulo} className="grid gap-0.5">
                    <dt className="text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco">{rotulo}</dt>
                    <dd className="m-0 break-words">{valor}</dd>
                  </div>
                ))}
            </dl>

            {confirmandoRemocao && (
              <DialogoConfirmacao
                titulo="Remover esta corretora?"
                consequencia="Ela sai do catálogo para todos os investidores e não aparece mais nas listas. Não há como desfazer."
                rotuloConfirmar="Remover"
                ocupado={removendo}
                aoConfirmar={() => void confirmarRemocao()}
                aoCancelar={() => setConfirmandoRemocao(false)}
              />
            )}
          </>
        )
      )}
    </section>
  );
}
