/**
 * Navegação para quem não é componente (o cliente HTTP, ao encerrar a sessão).
 * O roteador registra a dele ao montar; antes disso, recarregar a página no
 * endereço pedido chega ao mesmo lugar.
 */
let navegar: (url: string) => void = (url) => window.location.assign(url);

export function definirNavegacao(funcao: (url: string) => void): void {
  navegar = funcao;
}

export function irPara(url: string): void {
  navegar(url);
}
