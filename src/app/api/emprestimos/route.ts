import { obterMeusEmprestimos } from "@/controllers/emprestimo.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resultado = await obterMeusEmprestimos();
    return Response.json(resultado);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
    return Response.json({ erro: "Não foi possível carregar os empréstimos.", detalhe: mensagem }, { status: 500 });
  }
}
