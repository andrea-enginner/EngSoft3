import { obterItemDetalhe } from "@/models/services/item-detalhe.service";
import { sessaoAtual } from "@/lib/supabase/sessao";

export async function carregarItemDetalhe(id: string) {
  const sessao = await sessaoAtual();
  const resultado = await obterItemDetalhe(id, sessao?.token ?? null);
  return {
    item: resultado?.item ?? null,
    relacionados: resultado?.relacionados ?? [],
    autenticado: Boolean(sessao),
  };
}
