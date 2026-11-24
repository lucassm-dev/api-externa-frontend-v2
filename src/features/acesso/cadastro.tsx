import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { aplicarErroNoFormulario } from '@/core/erros/erro-em-formulario';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { ROTA_LOGIN } from '@/core/sessao/sessao.model';
import { useFormulario, type Erros } from '@/lib/formulario';
import { VisibilidadeSenha } from '@/shared/visibilidade-senha';
import { acesso } from './acesso';
import { CartaoAcesso, MensagemDoEnvio, type MensagemDaTela } from './cartao-acesso';
import { ForcaDaSenha } from './forca-da-senha';
import { MolduraAcesso } from './moldura-acesso';
import { REGRA_CPF, REGRA_EMAIL, REGRA_SENHA, digitosDoCpf, emailValido, formatarCpf, validarCpf, validarSenha } from './validadores';

interface DadosCadastro extends Record<string, string> {
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  confirmarSenha: string;
}

const CAMPOS_DO_SERVIDOR = ['nome', 'email', 'cpf', 'senha', 'confirmarSenha'];

function validar(dados: DadosCadastro): Erros<DadosCadastro> {
  const erros: Erros<DadosCadastro> = {};
  if (!dados.nome) erros.nome = 'Informe seu nome';
  if (!dados.email || !emailValido(dados.email)) erros.email = REGRA_EMAIL;
  const cpf = validarCpf(dados.cpf);
  if (cpf) erros.cpf = cpf;
  const senha = validarSenha(dados.senha);
  if (senha) erros.senha = senha;
  // Regra do grupo: vazio pede confirmação; preenchido e diferente diverge (AC-291 a AC-293).
  if (!dados.confirmarSenha) erros.confirmarSenha = 'Confirme sua senha';
  else if (dados.senha !== dados.confirmarSenha) erros.confirmarSenha = 'As senhas não coincidem';
  return erros;
}

export function Cadastro() {
  const navegar = useNavigate();
  const formulario = useFormulario<DadosCadastro>({ nome: '', email: '', cpf: '', senha: '', confirmarSenha: '' }, validar);
  // Um estado por campo: revelar a senha não revela a confirmação (AC-297).
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmacaoVisivel, setConfirmacaoVisivel] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemDaTela | null>(null);

  const ligar = (campo: keyof DadosCadastro & string) => ({
    name: campo,
    value: formulario.valores[campo],
    onChange: (evento: { target: { value: string } }) => formulario.mudar(campo, evento.target.value),
    onBlur: () => formulario.tocar(campo),
    erro: formulario.erroDe(campo),
  });

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setMensagem(null);
    // O que dá para validar antes do envio é validado antes (PRD-009).
    if (formulario.invalido) {
      formulario.tocarTodos();
      return;
    }

    setEnviando(true);
    const { nome, email, cpf, senha } = formulario.valores;
    try {
      // O backend valida 11 dígitos: a pontuação fica na tela, não no envio.
      const conta = await acesso.cadastrar({ nome, email, cpf: digitosDoCpf(cpf), senha });
      setEnviando(false);
      // Cadastro não entra no sistema: o backend não devolve token (ADR-001).
      navegar(`${ROTA_LOGIN}?${new URLSearchParams({ email: conta.email, contaCriada: '1' })}`);
    } catch (erro) {
      setEnviando(false);
      if (!ehErroTraduzido(erro)) throw erro;
      const { porCampo, geral } = aplicarErroNoFormulario(erro, CAMPOS_DO_SERVIDOR);
      formulario.aplicarErrosDoServidor(porCampo);
      setMensagem(geral ? { texto: geral, nivel: erro.nivel, codigo: erro.exibirCodigo ? erro.codigo : null } : null);
    }
  };

  return (
    <MolduraAcesso>
      <CartaoAcesso
        titulo="Criar conta"
        apoio="Monte carteiras hipotéticas e acompanhe o desempenho delas."
        rodape={{ texto: 'Já tem conta?', rotulo: 'Entrar', para: ROTA_LOGIN }}
        avisos={<MensagemDoEnvio mensagem={mensagem} />}
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <Campo rotulo="Nome" autoComplete="name" autoFocus {...ligar('nome')} />
          <Campo rotulo="E-mail" type="email" autoComplete="email" dica={REGRA_EMAIL} {...ligar('email')} />
          <Campo
            rotulo="CPF"
            inputMode="numeric"
            maxLength={14}
            autoComplete="off"
            dica={REGRA_CPF}
            {...ligar('cpf')}
            // A máscara acompanha a digitação; o que não é dígito não entra no campo.
            onChange={(evento) => formulario.mudar('cpf', formatarCpf(evento.target.value))}
          />
          <Campo
            rotulo="Senha"
            type={senhaVisivel ? 'text' : 'password'}
            autoComplete="new-password"
            dica={REGRA_SENHA}
            sufixo={<VisibilidadeSenha visivel={senhaVisivel} aoAlternar={setSenhaVisivel} campo="senha" />}
            {...ligar('senha')}
          />
          <Campo
            rotulo="Confirmar senha"
            type={confirmacaoVisivel ? 'text' : 'password'}
            autoComplete="new-password"
            sufixo={<VisibilidadeSenha visivel={confirmacaoVisivel} aoAlternar={setConfirmacaoVisivel} campo="confirmação de senha" />}
            {...ligar('confirmarSenha')}
          />

          <ForcaDaSenha senha={formulario.valores.senha} />

          <Botao intencao="primaria" type="submit" ocupado={enviando} className="mt-2 w-full">
            Criar conta
          </Botao>
        </form>
      </CartaoAcesso>
    </MolduraAcesso>
  );
}
