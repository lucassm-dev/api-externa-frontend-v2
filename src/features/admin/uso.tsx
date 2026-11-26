import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Cartao } from '@/components/ui/cartao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { CATALOGO_ERROS } from '@/core/erros/catalogo-erros';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarNumero } from '@/core/formatacao/formatacao';
import { useFormulario, type Erros } from '@/lib/formulario';
import { EstadoVazio } from '@/shared/estado-vazio';
import { RelatorioDeUso } from './admin.model';
import { adminService } from './admin.service';

interface Periodo extends Record<string, string> {
  dataInicio: string;
  dataFim: string;
}

const DATA_FINAL_ANTES = CATALOGO_ERROS['AUT-018'].mensagem;

function validar({ dataInicio, dataFim }: Periodo): Erros<Periodo> {
  // Datas ISO (AAAA-MM-DD) comparam certo como texto.
  return dataInicio && dataFim && dataFim < dataInicio ? { dataFim: DATA_FINAL_ANTES } : {};
}

/** "2026-11-20T14:00:00" vira "20/11 às 14h"; a hora chega sem fuso e fica como veio (ASM-091). */
function rotuloDaHora(hora: string): string {
  const [, mes, dia, horas] = /^\d{4}-(\d{2})-(\d{2})T(\d{2})/.exec(hora) ?? [];
  return dia ? `${dia}/${mes} às ${horas}h` : hora;
}

const formatarData = (iso: string) => iso.split('-').reverse().join('/');

function FormularioPeriodo({ periodo, recusa, aoAplicar }: { periodo: Periodo; recusa: string | null; aoAplicar: (periodo: Periodo) => void }) {
  const formulario = useFormulario<Periodo>(periodo, validar);
  const [enviado, setEnviado] = useState(false);

  const aplicar = (evento: FormEvent) => {
    evento.preventDefault();
    setEnviado(true);
    if (formulario.invalido) {
      formulario.tocarTodos();
      return;
    }
    aoAplicar(formulario.valores);
  };

  const ligar = (campo: keyof Periodo & string) => ({
    name: campo,
    value: formulario.valores[campo],
    onChange: (evento: { target: { value: string } }) => formulario.mudar(campo, evento.target.value),
    // A recusa do servidor vale para o período que já está no endereço; enviar de novo a apaga.
    erro: formulario.erroDe(campo) ?? (campo === 'dataFim' && recusa && !enviado ? recusa : null),
  });

  return (
    <form data-periodo-uso aria-label="Período do relatório" onSubmit={aplicar} noValidate className="flex flex-wrap items-end gap-3">
      <Campo rotulo="Data inicial" type="date" className="min-w-44" {...ligar('dataInicio')} />
      <Campo rotulo="Data final" type="date" className="min-w-44" {...ligar('dataFim')} />
      <Botao intencao="secundaria" type="submit">
        Aplicar
      </Botao>
    </form>
  );
}

/**
 * Quanto a API foi usada no período. Os picos são as 10 horas com mais
 * requisições, já ordenadas: um ranking, não uma série no tempo (ASM-090). Cada
 * barra traz o valor escrito ao lado, então a lista é também a versão em tabela.
 */
export function Uso() {
  const [busca, setBusca] = useSearchParams();
  const dataInicio = busca.get('dataInicio') ?? '';
  const dataFim = busca.get('dataFim') ?? '';

  const [relatorio, setRelatorio] = useState<RelatorioDeUso | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [recusa, setRecusa] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    setRecusa(null);
    setErro(null);
    adminService
      .uso({ ...(dataInicio && { dataInicio }), ...(dataFim && { dataFim }) })
      .then(setRelatorio, (falha) => {
        setRelatorio(null);
        if (!ehErroTraduzido(falha)) throw falha;
        if (falha.codigo === 'AUT-018') setRecusa(falha.mensagem);
        else setErro(falha.mensagem);
      })
      .finally(() => setCarregando(false));
  }, [dataInicio, dataFim]);

  const aplicar = ({ dataInicio: inicio, dataFim: fim }: Periodo) =>
    setBusca(() => new URLSearchParams(Object.entries({ dataInicio: inicio, dataFim: fim }).filter(([, valor]) => valor)));

  const descricaoDoPeriodo =
    !dataInicio && !dataFim
      ? 'Últimos 7 dias'
      : `${dataInicio ? `De ${formatarData(dataInicio)}` : 'Até'}${dataFim ? `${dataInicio ? ' a ' : ' '}${formatarData(dataFim)}` : ' em diante'}`;

  const maiorPico = Math.max(0, ...(relatorio?.picos.map((pico) => pico.requisicoes) ?? []));

  return (
    <section className="grid gap-5">
      <header className="grid gap-1">
        <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Uso da API</h1>
        <p data-periodo className="m-0 text-texto-fraco">
          {descricaoDoPeriodo}
        </p>
      </header>

      <FormularioPeriodo key={`${dataInicio}|${dataFim}`} periodo={{ dataInicio, dataFim }} recusa={recusa} aoAplicar={aplicar} />

      {erro && <MensagemFeedback nivel="erro" mensagem={erro} />}

      {carregando ? (
        <Esqueleto formato="bloco" />
      ) : (
        relatorio &&
        (relatorio.total === 0 ? (
          <div data-uso-vazio>
            <EstadoVazio titulo="Nenhuma requisição no período" descricao="Escolha outro período para ver o uso da API." />
          </div>
        ) : (
          <>
            <div data-total-requisicoes className="w-fit rounded-grande border border-borda bg-superficie px-5 py-4 shadow-cartao">
              <p className="m-0 text-rotulo font-medium text-texto-fraco">Requisições no período</p>
              <p className="m-0 text-titulo font-bold tabular-nums">{formatarNumero(relatorio.total, 0)}</p>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-2">
              <Cartao titulo="Horas de maior uso" apoio="As 10 horas com mais requisições no período.">
                <ol aria-label="Horas de maior uso" className="m-0 grid list-none gap-3 p-0">
                  {relatorio.picos.map((pico) => (
                    <li key={pico.hora} data-pico className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
                      <span className="text-apoio tabular-nums">{rotuloDaHora(pico.hora)}</span>
                      <span aria-hidden="true" className="h-2 rounded-pilula bg-superficie-alta">
                        <span
                          data-barra
                          className="block h-full rounded-pilula bg-serie-1"
                          style={{ width: `${maiorPico === 0 ? 0 : Math.round((pico.requisicoes / maiorPico) * 100)}%` }}
                        />
                      </span>
                      <span className="text-apoio font-semibold tabular-nums">{formatarNumero(pico.requisicoes, 0)}</span>
                    </li>
                  ))}
                </ol>
              </Cartao>

              <Cartao titulo="Quem mais chamou" apoio="Os 10 usuários com mais requisições no período.">
                <ol aria-label="Quem mais chamou" className="m-0 grid list-none gap-2 p-0">
                  {relatorio.usuarios.map((usuario) => (
                    <li key={usuario.id} data-usuario-uso className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate">{usuario.email}</span>
                      <span className="text-apoio font-semibold tabular-nums">{formatarNumero(usuario.requisicoes, 0)}</span>
                    </li>
                  ))}
                </ol>
              </Cartao>
            </div>
          </>
        ))
      )}
    </section>
  );
}
