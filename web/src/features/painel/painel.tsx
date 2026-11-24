import { useEffect, useState } from 'react';
import { Esqueleto } from '@/components/ui/esqueleto';
import { BarraMercado } from './blocos/barra-mercado';
import { Consolidado } from './blocos/consolidado';
import { CarteirasDoInvestidor, ConviteProximoPasso, UltimasMovimentacoes } from './blocos/outros-blocos';
import { carteiraPreferida } from './carteira-preferida';
import { BarraDeMercado, CarteiraResumida, ConsolidadoDaCarteira, Movimentacao } from './painel.model';
import { painelService } from './painel.service';
import { decidirProximoPasso } from './proximo-passo';

/**
 * O painel: a barra de mercado sempre, e embaixo ou os blocos do investidor ou
 * um convite único para o próximo passo (ADR-003). Enquanto as três leituras
 * que decidem isso não voltam, cada bloco mostra o seu esqueleto (AC-065).
 */
export function Painel() {
  const [barra, setBarra] = useState<BarraDeMercado | null>(null);
  const [carteiras, setCarteiras] = useState<CarteiraResumida[] | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[] | null>(null);
  const [catalogoTemCorretora, setCatalogoTemCorretora] = useState<boolean | null>(null);
  const [consolidado, setConsolidado] = useState<ConsolidadoDaCarteira | null>(null);
  const [carteiraSelecionada, setCarteiraSelecionada] = useState<number | null>(null);
  const [carregandoEstado, setCarregandoEstado] = useState(true);
  const [carregandoConsolidado, setCarregandoConsolidado] = useState(false);

  useEffect(() => {
    let vivo = true;
    void painelService.barraDeMercado().then((resposta) => vivo && setBarra(resposta));

    const sonda = painelService
      .catalogoTemCorretora()
      .catch(() => null)
      .then((tem) => vivo && setCatalogoTemCorretora(tem));
    const lista = painelService
      .carteiras()
      .catch(() => null)
      .then((resposta) => {
        if (!vivo) return;
        setCarteiras(resposta);
        const escolhida = resposta ? carteiraPreferida.escolherEntre(resposta) : null;
        if (escolhida) setCarteiraSelecionada(escolhida.id);
      });
    const extrato = painelService
      .ultimasMovimentacoes()
      .catch(() => null)
      .then((resposta) => vivo && setMovimentacoes(resposta));

    void Promise.all([sonda, lista, extrato]).then(() => vivo && setCarregandoEstado(false));
    return () => {
      vivo = false;
    };
  }, []);

  // Uma carteira por vez. Trocar a escolha descarta a resposta da anterior:
  // a tela nunca mostra o consolidado de uma carteira com o nome de outra.
  useEffect(() => {
    if (carteiraSelecionada === null) return;
    let vigente = true;
    setCarregandoConsolidado(true);
    setConsolidado(null);
    void painelService
      .consolidado(carteiraSelecionada)
      .catch(() => null)
      .then((resposta) => {
        if (!vigente) return;
        setConsolidado(resposta);
        setCarregandoConsolidado(false);
      });
    return () => {
      vigente = false;
    };
  }, [carteiraSelecionada]);

  const trocarCarteira = (carteiraId: number) => {
    carteiraPreferida.lembrar(carteiraId);
    setCarteiraSelecionada(carteiraId);
  };

  const proximoPasso = carregandoEstado
    ? null
    : decidirProximoPasso({
        catalogoTemCorretora,
        temCarteira: carteiras === null ? null : carteiras.length > 0,
        temOperacao: movimentacoes === null ? null : movimentacoes.length > 0,
      });
  const mostrarBlocosDoInvestidor = carregandoEstado || proximoPasso === null;

  return (
    // Sem o piso zero na coluna, a faixa que rola alarga a pista e leva a página junto (AC-290).
    <div data-painel className="grid auto-rows-min grid-cols-[minmax(0,1fr)] gap-8">
      <BarraMercado barra={barra} />

      {mostrarBlocosDoInvestidor ? (
        <>
          {carteiras ? (
            carteiras.length > 0 && (
              <>
                <Consolidado
                  carteiras={carteiras}
                  carteiraSelecionada={carteiraSelecionada}
                  consolidado={consolidado}
                  carregando={carregandoConsolidado}
                  aoSelecionar={trocarCarteira}
                />
                <CarteirasDoInvestidor carteiras={carteiras} />
              </>
            )
          ) : (
            carregandoEstado && (
              <div data-esqueleto-carteiras aria-hidden="true" className="grid gap-4">
                <Esqueleto formato="bloco" />
              </div>
            )
          )}

          {movimentacoes ? (
            <UltimasMovimentacoes movimentacoes={movimentacoes} />
          ) : (
            carregandoEstado && (
              <div data-esqueleto-movimentacoes aria-hidden="true">
                <Esqueleto formato="tabela" />
              </div>
            )
          )}
        </>
      ) : (
        proximoPasso && <ConviteProximoPasso passo={proximoPasso} />
      )}
    </div>
  );
}
