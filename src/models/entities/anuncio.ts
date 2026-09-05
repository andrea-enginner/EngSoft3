/**
 * Camada MODEL — entidade Anúncio.
 *
 * Um anúncio é um item que o usuário publicou, para doação ou empréstimo.
 */

export type TipoAnuncio = "doacao" | "emprestimo";

export type Anuncio = {
  id: string;
  tipo: TipoAnuncio;
  titulo: string;
  descricao: string;
  imagem: string | null;
  publicadoEm: string;
  ativo: boolean;
};

export function contarAtivos(anuncios: Anuncio[]): number {
  return anuncios.filter((anuncio) => anuncio.ativo).length;
}
