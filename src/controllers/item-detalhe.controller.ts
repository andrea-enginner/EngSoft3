import { obterItemDetalhe } from "@/models/services/item-detalhe.service";

export async function carregarItemDetalhe(id: string) {
  return obterItemDetalhe(id);
}
