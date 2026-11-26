import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Selecao } from '@/components/ui/selecao';
import { aplicarErroNoFormulario } from '@/core/erros/erro-em-formulario';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { Corretora, nomeExibido } from '@/features/corretoras/corretoras.model';
import { corretorasService } from '@/features/corretoras/corretoras.service';
import { useFormulario, type Erros } from '@/lib/formulario';
import { MERCADOS, Mercado } from './carteiras.model';
import { carteirasService } from './carteiras.service';

/** Página larga do ASM-046: no Angular só as 20 primeiras corretoras apareciam (AC-308). */
export const CORRETORAS_NA_ESCOLHA = 200;

interface DadosDaCarteira extends Record<string, string> {
  nome: string;
  corretoraId: string;
  mercado: string;
}

function validar({ nome, corretoraId, mercado }: DadosDaCarteira): Erros<DadosDaCarteira> {
  const erros: Erros<DadosDaCarteira> = {};
  if (!nome || nome.length > 100) erros.nome = 'Dê um nome à carteira.';
  if (!corretoraId) erros.corretoraId = 'Escolha a corretora desta carteira.';
  if (!mercado) erros.mercado = 'Escolha o mercado de referência.';
  return erros;
}

/**
 * Três campos, nenhum a mais. O mercado continua aqui porque o backend o exige,
 * mas é moeda de referência, não restrição: a carteira aceita ações dos dois
 * mercados (ADR-004). Nenhum valor padrão escondido — gravar um mercado que o
 * investidor não escolheu é pior do que pedir a escolha (PRD-005).
 *
 * Catálogo vazio não vira seletor vazio: a tela leva ao cadastro de corretora
 * e traz o investidor de volta para cá.
 */
export function CriarCarteira() {
  const navegar = useNavigate();
  const [catalogo, setCatalogo] = useState<Corretora[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<{ texto: string; codigo: string | null } | null>(null);
  const formulario = useFormulario<DadosDaCarteira>({ nome: '', corretoraId: '', mercado: '' }, validar);

  useEffect(() => {
    corretorasService.listar(0, CORRETORAS_NA_ESCOLHA).then(
      (pagina) => {
        setCatalogo(pagina.content);
        setCarregando(false);
      },
      () => setCarregando(false),
    );
  }, []);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (criando) return;
    setErro(null);
    if (formulario.invalido) {
      formulario.tocarTodos();
      return;
    }
    const { nome, corretoraId, mercado } = formulario.valores;
    setCriando(true);
    try {
      const carteira = await carteirasService.criar({ corretoraId: Number(corretoraId), mercado: mercado as Mercado, nome: nome.trim() });
      setCriando(false);
      navegar(`/carteiras/${carteira.id}`);
    } catch (falha) {
      setCriando(false);
      if (!ehErroTraduzido(falha)) throw falha;
      const { porCampo, geral } = aplicarErroNoFormulario(falha, ['nome', 'corretoraId', 'mercado']);
      formulario.aplicarErrosDoServidor(porCampo);
      setErro(geral ? { texto: geral, codigo: falha.codigo } : null);
    }
  };

  const ligar = (campo: keyof DadosDaCarteira & string) => ({
    name: campo,
    value: formulario.valores[campo],
    onBlur: () => formulario.tocar(campo),
    erro: formulario.erroDe(campo),
  });

  return (
    <section className="grid max-w-(--largura-formulario) gap-5">
      <div>
        <h1 className="m-0 mb-1 text-titulo font-bold tracking-(--entrelinha-titulo)">Criar carteira</h1>
        <p className="m-0 text-texto-fraco">
          A carteira é onde suas compras e vendas são registradas. Ela aceita ações dos dois mercados — o mercado escolhido abaixo é só
          a moeda de referência dos totais.
        </p>
      </div>

      {erro && <MensagemFeedback nivel="erro" mensagem={erro.texto} codigo={erro.codigo} />}

      {carregando ? (
        <div aria-hidden="true" className="grid gap-3">
          <Esqueleto formato="bloco" />
        </div>
      ) : catalogo.length === 0 ? (
        <div data-sem-corretora className="grid gap-2 rounded-grande border border-dashed border-borda bg-superficie p-6">
          <h2 className="m-0 text-medio font-semibold">Antes, uma corretora</h2>
          <p className="m-0 text-texto-fraco">
            Toda carteira pertence a uma corretora, e ainda não há nenhuma no catálogo. Cadastre a corretora onde você investe e você volta
            direto para cá.
          </p>
          <Botao asChild intencao="primaria" className="mt-2 justify-self-start">
            <Link data-cadastrar-corretora to={`/corretoras/nova?${new URLSearchParams({ voltarPara: '/carteiras/nova' })}`}>
              Cadastrar corretora
            </Link>
          </Botao>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="grid gap-4 rounded-grande border border-borda bg-superficie p-6 shadow-cartao max-sm:p-4">
          <Campo rotulo="Nome da carteira" data-campo-nome autoComplete="off" {...ligar('nome')} onChange={(evento) => formulario.mudar('nome', evento.target.value)} />
          <Selecao rotulo="Corretora" empilhado data-campo-corretora {...ligar('corretoraId')} onChange={(evento) => formulario.mudar('corretoraId', evento.target.value)}>
            <option value="">Escolha a corretora</option>
            {catalogo.map((corretora) => (
              // Descontinuada não aceita carteira nova (COR-005): fica à vista, mas indisponível (AC-375).
              <option key={corretora.id} value={corretora.id} disabled={corretora.descontinuada}>
                {nomeExibido(corretora)}
                {corretora.descontinuada && ' (descontinuada)'}
              </option>
            ))}
          </Selecao>
          <Selecao
            rotulo="Mercado de referência"
            empilhado
            data-campo-mercado
            dica="Define a moeda dos totais. A carteira continua aceitando ações dos dois mercados."
            {...ligar('mercado')}
            onChange={(evento) => formulario.mudar('mercado', evento.target.value)}
          >
            <option value="">Escolha o mercado</option>
            {MERCADOS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </Selecao>
          <Botao intencao="primaria" type="submit" data-criar ocupado={criando} className="justify-self-start">
            {criando ? 'Criando…' : 'Criar carteira'}
          </Botao>
        </form>
      )}
    </section>
  );
}
