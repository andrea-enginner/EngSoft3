import { obterItemDetalhe } from "@/models/services/item-detalhe.service";
import { sessaoAtual } from "@/lib/supabase/sessao";

export async function carregarItemDetalhe(id: string) {
  const sessao = await sessaoAtual();
  return {
    item: await obterItemDetalhe(id, sessao?.token ?? null),
    autenticado: Boolean(sessao),
  };
}
