import { listarMeusEmprestimos } from "@/models/services/emprestimo.service";

export async function obterMeusEmprestimos() {
  return listarMeusEmprestimos();
}
