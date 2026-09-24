import {
  alternarItemDesejado,
  listarIdsDesejados,
  verificarItemDesejado,
} from "@/models/repositories/lista-desejos.repository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ListaDesejosError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ListaDesejosError";
  }
}

export function obterIdsDesejados(token: string | null): Promise<string[]> {
  return token ? listarIdsDesejados(token) : Promise.resolve([]);
}

export function itemEstaNaLista(
  token: string | null,
  anuncioId: string,
): Promise<boolean> {
  return token
    ? verificarItemDesejado(token, anuncioId)
    : Promise.resolve(false);
}

export async function alternarListaDesejos(
  token: string | null,
  anuncioId: string,
): Promise<boolean> {
  if (!token) throw new ListaDesejosError("Entre na sua conta para usar a lista de desejos.");
  if (!UUID.test(anuncioId)) throw new ListaDesejosError("Anúncio inválido.");
  return alternarItemDesejado(token, anuncioId);
}
