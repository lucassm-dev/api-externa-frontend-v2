import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { CATALOGO_ERROS } from '@/core/erros/catalogo-erros';
import { aplicarErroNoFormulario } from '@/core/erros/erro-em-formulario';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { ROTA_INICIAL_ADMIN } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { useFormulario, type Erros } from '@/lib/formulario';
import { VisibilidadeSenha } from '@/shared/visibilidade-senha';
import { acesso } from './acesso';
import { ROTA_AREA_INTERNA, ROTA_CADASTRO, ROTA_ESQUECI_SENHA } from './acesso.model';
import { CartaoAcesso, MensagemDoEnvio, type MensagemDaTela } from './cartao-acesso';
import { MolduraAcesso } from './moldura-acesso';
import { emailValido } from './validadores';

interface Credenciais extends Record<string, string> {
  email: string;
  senha: string;
}

function validar({ email, senha }: Credenciais): Erros<Credenciais> {
  const erros: Erros<Credenciais> = {};
  if (!email || !emailValido(email)) erros.email = 'Informe um e-mail válido';
  if (!senha) erros.senha = 'Informe sua senha';
  return erros;
}

export function Login() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();

  const formulario = useFormulario<Credenciais>({ email: parametros.get('email') ?? '', senha: '' }, validar);
  // Sempre oculta ao abrir a tela: a preferência não sobrevive ao recarregar.
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemDaTela | null>(null);

  // Confirmação de conta criada, vinda do cadastro.
  const contaCriada = parametros.get('contaCriada') === '1';
  const senhaRedefinida = parametros.get('senhaRedefinida') === '1';
  const contaExcluida = parametros.get('contaExcluida') === '1';
  // Motivo do retorno ao login: o texto vem do catálogo pelo código, nunca do servidor.
  const motivo = parametros.get('motivo');
  const motivoDeSaida = motivo ? (CATALOGO_ERROS[motivo]?.mensagem ?? null) : null;

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
      await acesso.entrar(formulario.valores);
      setEnviando(false);
      navegar(sessao.papel() === 'ADMIN' ? ROTA_INICIAL_ADMIN : ROTA_AREA_INTERNA);
    } catch (erro) {
      setEnviando(false);
      if (!ehErroTraduzido(erro)) throw erro;
      // AUT-004 é genérico de propósito: nada aqui aponta qual campo errou.
      const { porCampo, geral } = aplicarErroNoFormulario(erro, ['email', 'senha']);
      formulario.aplicarErrosDoServidor(porCampo);
      setMensagem(geral ? { texto: geral, nivel: erro.nivel, codigo: erro.exibirCodigo ? erro.codigo : null } : null);
    }
  };

  return (
    <MolduraAcesso>
      <CartaoAcesso
        titulo="Entrar"
        apoio="Acompanhe suas carteiras hipotéticas."
        rodape={{ texto: 'Não tem conta?', rotulo: 'Criar conta', para: ROTA_CADASTRO }}
        avisos={
          <>
            {contaCriada && <MensagemFeedback nivel="informacao" mensagem="Conta criada. Entre para começar." />}
            {senhaRedefinida && <MensagemFeedback nivel="sucesso" mensagem="Senha redefinida. Entre com a senha nova." />}
            {contaExcluida && <MensagemFeedback nivel="informacao" mensagem="Sua conta foi excluída. O e-mail dela está livre para um novo cadastro." />}
            {motivoDeSaida && <MensagemFeedback nivel="aviso" mensagem={motivoDeSaida} />}
            <MensagemDoEnvio mensagem={mensagem} />
          </>
        }
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <Campo
            rotulo="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={formulario.valores.email}
            onChange={(evento) => formulario.mudar('email', evento.target.value)}
            onBlur={() => formulario.tocar('email')}
            erro={formulario.erroDe('email')}
          />
          <Campo
            rotulo="Senha"
            name="senha"
            type={senhaVisivel ? 'text' : 'password'}
            autoComplete="current-password"
            value={formulario.valores.senha}
            onChange={(evento) => formulario.mudar('senha', evento.target.value)}
            onBlur={() => formulario.tocar('senha')}
            erro={formulario.erroDe('senha')}
            sufixo={<VisibilidadeSenha visivel={senhaVisivel} aoAlternar={setSenhaVisivel} campo="senha" />}
          />
          <Link
            to={`${ROTA_ESQUECI_SENHA}?${new URLSearchParams({ email: formulario.valores.email })}`}
            className="justify-self-end text-apoio"
          >
            Esqueci a senha
          </Link>
          <Botao intencao="primaria" type="submit" ocupado={enviando} className="mt-2 w-full">
            Entrar
          </Botao>
        </form>
      </CartaoAcesso>
    </MolduraAcesso>
  );
}
