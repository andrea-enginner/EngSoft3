import { buscarItemPorId } from "@/models/repositories/item-detalhe.repository";

export async function obterItemDetalhe(id: string) {
  const idNormalizado = id.trim();
  if (!idNormalizado) return null;

  return buscarItemPorId(idNormalizado);
}
