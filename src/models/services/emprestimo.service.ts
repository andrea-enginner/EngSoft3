import { buscarMeusEmprestimos } from "@/models/repositories/emprestimo.repository";

export async function listarMeusEmprestimos() {
  return buscarMeusEmprestimos();
}
