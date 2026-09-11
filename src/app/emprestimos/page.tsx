import type { Metadata } from "next";
import { obterMeusEmprestimos } from "@/controllers/emprestimo.controller";
import type { ResultadoEmprestimos } from "@/models/repositories/emprestimo.repository";
import { EmprestimosView } from "@/views/emprestimos/EmprestimosView";
export const metadata: Metadata = { title: "Empréstimos" };
export default async function EmprestimosPage() {
  let resultado: ResultadoEmprestimos;
  let erro: string | undefined;
  try {
    resultado = await obterMeusEmprestimos();
  } catch (falha) {
    console.error("Falha ao carregar solicitações de empréstimo", falha);
    resultado = { dados: [], fonte: "supabase", requerLogin: false };
    erro = "Não foi possível carregar as solicitações agora.";
  }
  return <EmprestimosView resultado={resultado} erro={erro} />;
}
