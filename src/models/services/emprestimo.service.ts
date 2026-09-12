import { buscarMeusEmprestimos } from "@/models/repositories/emprestimo.repository";
import type { SessaoUsuario } from "@/models/entities/usuario";

export async function listarMeusEmprestimos(sessao: SessaoUsuario | null = null) {
  return buscarMeusEmprestimos(sessao);
}
