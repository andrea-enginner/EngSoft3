import type { Metadata } from "next";
import { obterMeusEmprestimos } from "@/controllers/emprestimo.controller";
import { sessaoAtual } from "@/lib/supabase/sessao";
import type { ResultadoEmprestimos } from "@/models/repositories/emprestimo.repository";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";
import { EmprestimosView } from "@/views/emprestimos/EmprestimosView";
export const metadata: Metadata = { title: "Empréstimos" };
export default async function EmprestimosPage() {
  if (!(await sessaoAtual())) {
    return <AcessoRestrito titulo="Entre para acompanhar seus empréstimos" descricao="Solicitações e reservas são privadas e visíveis apenas para as pessoas envolvidas." destino="/emprestimos" />;
  }

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
