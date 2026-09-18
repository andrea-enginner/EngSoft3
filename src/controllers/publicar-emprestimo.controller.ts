import { sessaoAtual } from "@/lib/supabase/sessao";
import { carregarEmprestimoParaEdicao } from "@/models/services/publicar-emprestimo.service";

export async function obterEmprestimoParaEdicao(id: string) {
  const sessao = await sessaoAtual();
  if (!sessao) return null;
  return carregarEmprestimoParaEdicao(sessao, id);
}
