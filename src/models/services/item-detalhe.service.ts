import { buscarItemPorId } from "@/models/repositories/item-detalhe.repository";
import { itemEstaNaLista } from "@/models/services/lista-desejos.service";

export async function obterItemDetalhe(id: string, token: string | null = null) {
  const idNormalizado = id.trim();
  if (!idNormalizado) return null;

  const item = await buscarItemPorId(idNormalizado);
  if (!item) return null;
  return {
    ...item,
    naListaDesejos: await itemEstaNaLista(token, idNormalizado),
  };
}
