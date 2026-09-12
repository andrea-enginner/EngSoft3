/**
 * Camada MODEL — entidade Anúncio.
 *
 * Um anúncio é um item que o usuário publicou, para doação ou empréstimo.
 */

import type { AnuncioResumo } from "@/models/entities/item";

export type { TipoAnuncio } from "@/models/entities/item";
export type Anuncio = AnuncioResumo;

export function contarAtivos(anuncios: Anuncio[]): number {
  return anuncios.filter((anuncio) => anuncio.ativo).length;
}
