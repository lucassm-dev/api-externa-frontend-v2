import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { aplicarErroNoFormulario } from '@/core/erros/erro-em-formulario';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { ROTA_LOGIN } from '@/core/sessao/sessao.model';
import { useFormulario, type Erros } from '@/lib/formulario';
import { CampoSenha } from '@/shared/visibilidade-senha';
import { acesso } from './acesso';
import { CartaoAcesso, MensagemDoEnvio, type MensagemDaTela } from './cartao-acesso';
import { ForcaDaSenha } from './forca-da-senha';
import { MolduraAcesso } from './moldura-acesso';
import { REGRA_EMAIL, REGRA_SENHA, emailValido, validarSenha } from './validadores';

interface DadosRedefinicao extends Record<string, string> {
  codigo: string;
  novaSenha: string;
  confirmarSenha: string;
}

function validarEmail({ email }: { email: string }): Erros<{ email: string }> {
  return email && emailValido(email) ? {} : { email: REGRA_EMAIL };
}

function validarRedefinicao({ codigo, novaSenha, confirmarSenha }: DadosRedefinicao): Erros<DadosRedefinicao> {
  const erros: Erros<DadosRedefinicao> = {};
  if (!/^\d{6}$/.test(codigo)) erros.codigo = 'O código tem 6 dígitos';
  const regra = validarSenha(novaSenha);
  if (regra) erros.novaSenha = regra;
  if (!confirmarSenha) erros.confirmarSenha = 'Confirme a senha nova';
  else if (novaSenha !== confirmarSenha) erros.confirmarSenha = 'As senhas não coincidem';
  return erros;
}

/**
 * Dois passos na mesma tela: pedir o código e redefinir. O primeiro passo
 * nunca diz se o e-mail existe (AC-330); o servidor responde 202 de qualquer jeito.
 */
export function EsqueciSenha() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const pedido = useFormulario<{ email: string }>({ email: parametros.get('email') ?? '' }, validarEmail);
  const redefinicao = useFormulario<DadosRedefinicao>({ codigo: '', novaSenha: '', confirmarSenha: '' }, validarRedefinicao);
  const [codigoPedido, setCodigoPedido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemDaTela | null>(null);

  const falhou = (erro: unknown, campos: string[], aplicar: (porCampo: Record<string, string>) => void) => {
    setEnviando(false);
    if (!ehErroTraduzido(erro)) throw erro;
    const { porCampo, geral } = aplicarErroNoFormulario(erro, campos);
    aplicar(porCampo);
    setMensagem(geral ? { texto: geral, nivel: erro.nivel, codigo: erro.exibirCodigo ? erro.codigo : null } : null);
  };

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
      await acesso.pedirCodigoDeSenha(pedido.valores.email);
      setEnviando(false);
      setCodigoPedido(true);
    } catch (erro) {
      falhou(erro, ['email'], pedido.aplicarErrosDoServidor);
    }
  };

  const redefinir = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setMensagem(null);
    if (redefinicao.invalido) {
      redefinicao.tocarTodos();
      return;
    }
    setEnviando(true);
    const { email } = pedido.valores;
    try {
      await acesso.redefinirSenha({
        email,
        codigo: redefinicao.valores.codigo,
        novaSenha: redefinicao.valores.novaSenha,
      });
      navegar(`${ROTA_LOGIN}?${new URLSearchParams({ email, senhaRedefinida: '1' })}`);
    } catch (erro) {
      falhou(erro, ['codigo', 'novaSenha'], redefinicao.aplicarErrosDoServidor);
    }
  };

  const ligar = (campo: keyof DadosRedefinicao & string) => ({
    name: campo,
    value: redefinicao.valores[campo],
    onChange: (evento: { target: { value: string } }) => redefinicao.mudar(campo, evento.target.value),
    onBlur: () => redefinicao.tocar(campo),
    erro: redefinicao.erroDe(campo),
  });

  return (
    <MolduraAcesso>
      <CartaoAcesso
        titulo="Esqueci a senha"
        apoio={codigoPedido ? 'Informe o código que chegou no e-mail e escolha uma senha nova.' : 'Enviamos um código para o seu e-mail.'}
        rodape={{ texto: 'Lembrou a senha?', rotulo: 'Entrar', para: ROTA_LOGIN }}
        avisos={
          <>
            {codigoPedido && (
              <MensagemFeedback nivel="informacao" mensagem="Se o e-mail existir, enviamos um código. Ele vale 10 minutos." />
            )}
            <MensagemDoEnvio mensagem={mensagem} />
          </>
        }
      >
        {codigoPedido ? (
          <form onSubmit={redefinir} noValidate className="grid gap-4">
            <Campo rotulo="Código" inputMode="numeric" maxLength={6} autoComplete="one-time-code" autoFocus {...ligar('codigo')} />
            <CampoSenha rotulo="Senha nova" autoComplete="new-password" dica={REGRA_SENHA} {...ligar('novaSenha')} />
            <CampoSenha rotulo="Confirmar senha nova" autoComplete="new-password" {...ligar('confirmarSenha')} />
            <ForcaDaSenha senha={redefinicao.valores.novaSenha} />
            <Botao intencao="primaria" type="submit" ocupado={enviando} className="mt-2 w-full">
              Redefinir senha
            </Botao>
            <Botao intencao="sutil" type="button" onClick={() => setCodigoPedido(false)}>
              Pedir outro código
            </Botao>
          </form>
        ) : (
          <form onSubmit={pedir} noValidate className="grid gap-4">
            <Campo
              rotulo="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={pedido.valores.email}
              onChange={(evento) => pedido.mudar('email', evento.target.value)}
              onBlur={() => pedido.tocar('email')}
              erro={pedido.erroDe('email')}
            />
            <Botao intencao="primaria" type="submit" ocupado={enviando} className="mt-2 w-full">
              Enviar código
            </Botao>
          </form>
        )}
      </CartaoAcesso>
    </MolduraAcesso>
  );
}
