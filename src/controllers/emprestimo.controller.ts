import { listarMeusEmprestimos } from "@/models/services/emprestimo.service";
import { sessaoAtual } from "@/lib/supabase/sessao";

export async function obterMeusEmprestimos() {
  return listarMeusEmprestimos(await sessaoAtual());
}
