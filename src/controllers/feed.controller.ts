import { carregarItensDoFeed } from "@/models/services/feed.service";
import { sessaoAtual } from "@/lib/supabase/sessao";
export async function carregarFeed(categoria?: string) {
  const sessao = await sessaoAtual();
  return {
    ...await carregarItensDoFeed(categoria, sessao?.token ?? null),
    autenticado: Boolean(sessao),
  };
}
