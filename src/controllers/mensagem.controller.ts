import { sessaoAtual } from "@/lib/supabase/sessao";
import { carregarPainelMensagens } from "@/models/services/mensagem.service";

export async function obterPainelMensagens(conversaId?: string) {
  return carregarPainelMensagens(await sessaoAtual(), conversaId);
}
