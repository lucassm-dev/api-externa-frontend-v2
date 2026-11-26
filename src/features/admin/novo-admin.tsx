import { ArrowLeft } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { aplicarErroNoFormulario } from '@/core/erros/erro-em-formulario';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { feedback } from '@/core/feedback/feedback.service';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { ForcaDaSenha } from '@/features/acesso/forca-da-senha';
import { REGRA_EMAIL, REGRA_SENHA, emailValido, validarSenha } from '@/features/acesso/validadores';
import { useFormulario, type Erros } from '@/lib/formulario';
import { CampoSenha } from '@/shared/visibilidade-senha';
import { adminService } from './admin.service';

interface DadosDoAdmin extends Record<string, string> {
  email: string;
  senha: string;
  confirmarSenha: string;
}

function validar({ email, senha, confirmarSenha }: DadosDoAdmin): Erros<DadosDoAdmin> {
  const erros: Erros<DadosDoAdmin> = {};
  if (!email || !emailValido(email)) erros.email = REGRA_EMAIL;
  const regra = validarSenha(senha);
  if (regra) erros.senha = regra;
  if (!confirmarSenha) erros.confirmarSenha = 'Confirme a senha';
  else if (senha !== confirmarSenha) erros.confirmarSenha = 'As senhas não coincidem';
  return erros;
}

/** Só um ADMIN cria outro ADMIN; o cadastro público cria apenas investidor. */
export function NovoAdmin() {
  const navegar = useNavigate();
  const formulario = useFormulario<DadosDoAdmin>({ email: '', senha: '', confirmarSenha: '' }, validar);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ligar = (campo: keyof DadosDoAdmin & string) => ({
    name: campo,
    value: formulario.valores[campo],
    onChange: (evento: { target: { value: string } }) => formulario.mudar(campo, evento.target.value),
    onBlur: () => formulario.tocar(campo),
    erro: formulario.erroDe(campo),
  });

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setErro(null);
    if (formulario.invalido) {
      formulario.tocarTodos();
      return;
    }
    setEnviando(true);
    const { email, senha } = formulario.valores;
    try {
      await adminService.criarAdmin(email, senha);
      feedback.informar(`Administrador ${email} criado.`);
      navegar('/admin/usuarios');
    } catch (falha) {
      setEnviando(false);
      if (!ehErroTraduzido(falha)) throw falha;
      const { porCampo, geral } = aplicarErroNoFormulario(falha, ['email', 'senha']);
      formulario.aplicarErrosDoServidor(porCampo);
      setErro(geral);
    }
  };

  return (
    <section className="grid max-w-(--largura-formulario) gap-5">
      <header className="grid gap-3">
        <Botao asChild intencao="sutil" tamanho="compacto" className="justify-self-start">
          <Link to="/admin/usuarios">
            <ArrowLeft aria-hidden="true" focusable="false" />
            Voltar aos usuários
          </Link>
        </Botao>
        <div>
          <h1 className="m-0 mb-1 text-titulo font-bold tracking-(--entrelinha-titulo)">Novo administrador</h1>
          <p className="m-0 text-texto-fraco">A pessoa entra com este e-mail e senha e passa a ter acesso ao painel administrativo.</p>
        </div>
      </header>

      {erro && <MensagemFeedback nivel="erro" mensagem={erro} />}

      <form
        data-novo-admin
        onSubmit={enviar}
        noValidate
        className="grid gap-4 rounded-grande border border-borda bg-superficie p-6 shadow-cartao max-sm:p-4"
      >
        <Campo rotulo="E-mail" type="email" autoComplete="off" dica={REGRA_EMAIL} {...ligar('email')} />
        <CampoSenha rotulo="Senha" autoComplete="new-password" dica={REGRA_SENHA} {...ligar('senha')} />
        <CampoSenha rotulo="Confirmar senha" autoComplete="new-password" {...ligar('confirmarSenha')} />
        <ForcaDaSenha senha={formulario.valores.senha} />
        <Botao intencao="primaria" type="submit" ocupado={enviando} className="justify-self-start">
          Criar administrador
        </Botao>
      </form>
    </section>
  );
}
