import { sessaoAtual } from "@/lib/supabase/sessao";
import {
  carregarPainelMensagens,
  obterDownloadAnexo,
} from "@/models/services/mensagem.service";

export async function obterPainelMensagens(conversaId?: string) {
  return carregarPainelMensagens(await sessaoAtual(), conversaId);
}

export async function obterDownloadMensagem(mensagemId: string) {
  return obterDownloadAnexo(await sessaoAtual(), mensagemId);
}
