import { sessaoAtual } from "@/lib/supabase/sessao";
import { listarSolicitacoesAvaliadas } from "@/models/services/avaliacao.service";

export async function obterSolicitacoesAvaliadas(): Promise<string[]> {
  const avaliadas = await listarSolicitacoesAvaliadas(await sessaoAtual());
  return Array.from(avaliadas);
}
