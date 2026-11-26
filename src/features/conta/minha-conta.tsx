import { useState, useSyncExternalStore, type ChangeEvent, type FormEvent } from 'react';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Cartao } from '@/components/ui/cartao';
import { EscolhaDeArquivo } from '@/components/ui/escolha-de-arquivo';
import { aplicarErroNoFormulario } from '@/core/erros/erro-em-formulario';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { sessao } from '@/core/sessao/sessao.service';
import { ForcaDaSenha } from '@/features/acesso/forca-da-senha';
import { REGRA_EMAIL, REGRA_SENHA, emailValido, validarSenha } from '@/features/acesso/validadores';
import { useFormulario, type Erros } from '@/lib/formulario';
import { CampoSenha } from '@/shared/visibilidade-senha';
import { TIPOS_DE_FOTO, conta, problemaDaFoto } from './conta';
import { FotoDePerfil } from './foto-de-perfil';

interface Mensagem {
  texto: string;
  nivel: 'sucesso' | 'erro' | 'aviso' | 'informacao';
  codigo?: string | null;
}

function ligarCampo<T extends Record<string, string>>(formulario: ReturnType<typeof useFormulario<T>>, campo: keyof T & string) {
  return {
    name: campo,
    value: formulario.valores[campo],
    onChange: (evento: ChangeEvent<HTMLInputElement>) => formulario.mudar(campo, evento.target.value),
    onBlur: () => formulario.tocar(campo),
    erro: formulario.erroDe(campo),
  };
}

/** Recusa do servidor: no campo quando o catálogo aponta um, senão na seção. */
function tratarRecusa<T extends Record<string, string>>(
  erro: unknown,
  formulario: ReturnType<typeof useFormulario<T>>,
  campos: string[],
  setMensagem: (mensagem: Mensagem | null) => void,
) {
  if (!ehErroTraduzido(erro)) throw erro;
  const { porCampo, geral } = aplicarErroNoFormulario(erro, campos);
  formulario.aplicarErrosDoServidor(porCampo as Erros<T>);
  setMensagem(geral ? { texto: geral, nivel: erro.nivel, codigo: erro.exibirCodigo ? erro.codigo : null } : null);
}

interface DadosSenha extends Record<string, string> {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

function validarTrocaDeSenha({ senhaAtual, novaSenha, confirmarSenha }: DadosSenha): Erros<DadosSenha> {
  const erros: Erros<DadosSenha> = {};
  if (!senhaAtual) erros.senhaAtual = 'Informe sua senha atual';
  const regra = validarSenha(novaSenha);
  if (regra) erros.novaSenha = regra;
  if (!confirmarSenha) erros.confirmarSenha = 'Confirme a senha nova';
  else if (novaSenha !== confirmarSenha) erros.confirmarSenha = 'As senhas não coincidem';
  return erros;
}

function FormularioSenha({ aoTrocar }: { aoTrocar: () => void }) {
  const formulario = useFormulario<DadosSenha>({ senhaAtual: '', novaSenha: '', confirmarSenha: '' }, validarTrocaDeSenha);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setMensagem(null);
    if (formulario.invalido) {
      formulario.tocarTodos();
      return;
    }
    setEnviando(true);
    try {
      await conta.trocarSenha(formulario.valores.senhaAtual, formulario.valores.novaSenha);
      aoTrocar();
    } catch (erro) {
      setEnviando(false);
      tratarRecusa(erro, formulario, ['senhaAtual', 'novaSenha'], setMensagem);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4">
      {mensagem && <MensagemFeedback nivel={mensagem.nivel} mensagem={mensagem.texto} codigo={mensagem.codigo} />}
      <CampoSenha rotulo="Senha atual" autoComplete="current-password" {...ligarCampo(formulario, 'senhaAtual')} />
      <CampoSenha rotulo="Senha nova" autoComplete="new-password" dica={REGRA_SENHA} {...ligarCampo(formulario, 'novaSenha')} />
      <CampoSenha rotulo="Confirmar senha nova" autoComplete="new-password" {...ligarCampo(formulario, 'confirmarSenha')} />
      <ForcaDaSenha senha={formulario.valores.novaSenha} />
      <Botao intencao="secundaria" type="submit" ocupado={enviando} className="justify-self-start">
        Trocar senha
      </Botao>
    </form>
  );
}

function SecaoSenha() {
  // Remontar o formulário é o jeito de limpar os campos depois da troca.
  const [trocas, setTrocas] = useState(0);
  return (
    <div data-secao-conta="senha">
      <Cartao titulo="Senha" apoio="Ao trocar, as outras sessões abertas com a senha antiga deixam de valer.">
        <div className="grid gap-4">
          {trocas > 0 && <MensagemFeedback nivel="sucesso" mensagem="Senha trocada. Você continua conectado." />}
          <FormularioSenha key={trocas} aoTrocar={() => setTrocas((valor) => valor + 1)} />
        </div>
      </Cartao>
    </div>
  );
}

interface DadosEmail extends Record<string, string> {
  email: string;
  senhaAtual: string;
}

function validarTrocaDeEmail({ email, senhaAtual }: DadosEmail): Erros<DadosEmail> {
  const erros: Erros<DadosEmail> = {};
  if (!email || !emailValido(email)) erros.email = REGRA_EMAIL;
  if (!senhaAtual) erros.senhaAtual = 'Informe sua senha atual';
  return erros;
}

function validarCodigo({ codigo }: { codigo: string }): Erros<{ codigo: string }> {
  return /^\d{6}$/.test(codigo) ? {} : { codigo: 'O código tem 6 dígitos' };
}

function FluxoEmail({ aoConfirmar }: { aoConfirmar: () => void }) {
  const pedido = useFormulario<DadosEmail>({ email: '', senhaAtual: '' }, validarTrocaDeEmail);
  const confirmacao = useFormulario<{ codigo: string }>({ codigo: '' }, validarCodigo);
  const [aguardandoCodigo, setAguardandoCodigo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);

  const pedir = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setMensagem(null);
    if (pedido.invalido) {
      pedido.tocarTodos();
      return;
    }
    setEnviando(true);
    try {
      await conta.pedirTrocaDeEmail(pedido.valores.email, pedido.valores.senhaAtual);
      setAguardandoCodigo(true);
    } catch (erro) {
      tratarRecusa(erro, pedido, ['email', 'senhaAtual'], setMensagem);
    }
    setEnviando(false);
  };

  const confirmar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setMensagem(null);
    if (confirmacao.invalido) {
      confirmacao.tocarTodos();
      return;
    }
    setEnviando(true);
    try {
      await conta.confirmarTrocaDeEmail(confirmacao.valores.codigo);
      aoConfirmar();
    } catch (erro) {
      setEnviando(false);
      tratarRecusa(erro, confirmacao, ['codigo'], setMensagem);
    }
  };

  return (
    <div className="grid gap-4">
      {mensagem && <MensagemFeedback nivel={mensagem.nivel} mensagem={mensagem.texto} codigo={mensagem.codigo} />}
      {aguardandoCodigo ? (
        <form onSubmit={confirmar} noValidate className="grid gap-4">
          <p className="m-0 text-texto-fraco">
            Enviamos um código de 6 dígitos para <strong className="text-texto">{pedido.valores.email}</strong>. Ele vale 10 minutos.
          </p>
          <Campo
            rotulo="Código"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            {...ligarCampo(confirmacao, 'codigo')}
          />
          <div className="flex flex-wrap gap-2">
            <Botao intencao="secundaria" type="submit" ocupado={enviando}>
              Confirmar e-mail
            </Botao>
            <Botao intencao="sutil" type="button" onClick={() => setAguardandoCodigo(false)}>
              Voltar
            </Botao>
          </div>
        </form>
      ) : (
        <form onSubmit={pedir} noValidate className="grid gap-4">
          <Campo rotulo="E-mail novo" type="email" autoComplete="email" dica={REGRA_EMAIL} {...ligarCampo(pedido, 'email')} />
          <CampoSenha rotulo="Senha atual" autoComplete="current-password" {...ligarCampo(pedido, 'senhaAtual')} />
          <Botao intencao="secundaria" type="submit" ocupado={enviando} className="justify-self-start">
            Enviar código
          </Botao>
        </form>
      )}
    </div>
  );
}

function SecaoEmail() {
  const emailAtual = useSyncExternalStore(sessao.assinar, () => sessao.email());
  const [trocas, setTrocas] = useState(0);
  return (
    <div data-secao-conta="email">
      <Cartao titulo="E-mail" apoio={`Hoje você entra com ${emailAtual ?? ''}.`}>
        <div className="grid gap-4">
          {trocas > 0 && <MensagemFeedback nivel="sucesso" mensagem="E-mail trocado. Use o novo para entrar." />}
          <FluxoEmail key={trocas} aoConfirmar={() => setTrocas((valor) => valor + 1)} />
        </div>
      </Cartao>
    </div>
  );
}

function SecaoFoto() {
  const temFoto = useSyncExternalStore(sessao.assinar, () => Boolean(sessao.identidade()?.fotoUrl));
  const [ocupado, setOcupado] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);

  const executar = async (acao: () => Promise<void>) => {
    setOcupado(true);
    try {
      await acao();
    } catch (erro) {
      if (!ehErroTraduzido(erro)) throw erro;
      setProblema(erro.mensagem);
    } finally {
      setOcupado(false);
    }
  };

  const escolher = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    // Limpa para que escolher o mesmo arquivo de novo dispare a troca.
    evento.target.value = '';
    if (!arquivo) return;
    const recusa = problemaDaFoto(arquivo);
    setProblema(recusa);
    if (!recusa) void executar(() => conta.enviarFoto(arquivo));
  };

  return (
    <div data-secao-conta="foto">
      <Cartao titulo="Foto" apoio="Aparece no topo, ao lado do seu nome.">
        <div className="flex flex-wrap items-center gap-5">
          <FotoDePerfil className="size-20 text-medio" />
          <div className="flex min-w-0 flex-[1_1_16rem] flex-wrap items-start gap-2">
            <EscolhaDeArquivo
              rotulo={temFoto ? 'Trocar foto' : 'Escolher foto'}
              accept={TIPOS_DE_FOTO.join(',')}
              dica="JPEG, PNG ou WebP, até 2 MB"
              erro={problema}
              disabled={ocupado}
              onChange={escolher}
            />
            {temFoto && (
              <Botao
                intencao="sutil"
                type="button"
                ocupado={ocupado}
                className="justify-self-start"
                onClick={() => void executar(conta.removerFoto)}
              >
                Remover foto
              </Botao>
            )}
          </div>
        </div>
      </Cartao>
    </div>
  );
}

export function Conta() {
  return (
    <section className="mx-auto grid w-full max-w-(--largura-conta) gap-5">
      <div>
        <h1 className="m-0 mb-1 text-titulo font-bold tracking-(--entrelinha-titulo)">Minha conta</h1>
        <p className="m-0 text-texto-fraco">Sua foto, o e-mail de acesso e a senha.</p>
      </div>
      <SecaoFoto />
      <SecaoEmail />
      <SecaoSenha />
    </section>
  );
}
