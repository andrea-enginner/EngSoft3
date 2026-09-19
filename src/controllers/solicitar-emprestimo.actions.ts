"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { SolicitacaoEmprestimoError, solicitarEmprestimo } from "@/models/services/emprestimo.service";

export type EstadoSolicitacao = { erro: string; sucesso: boolean; conversaId: string | null };

export async function solicitarEmprestimoAction(
  _estado: EstadoSolicitacao,
  dados: FormData,
): Promise<EstadoSolicitacao> {
  try {
    const resultado = await solicitarEmprestimo(
      await sessaoAtual(),
      String(dados.get("anuncioId") ?? ""),
      String(dados.get("inicioEm") ?? ""),
      Number(dados.get("duracaoQuantidade")),
      String(dados.get("duracaoUnidade") ?? ""),
      dados.get("confirmacao") === "on",
    );
    revalidatePath("/emprestimos");
    revalidatePath("/mensagens");
    return { erro: "", sucesso: true, conversaId: resultado.conversaId };
  } catch (erro) {
    if (erro instanceof SolicitacaoEmprestimoError) return { erro: erro.message, sucesso: false, conversaId: null };
    console.error("Falha ao solicitar empréstimo", erro);
    return { erro: "Não foi possível registrar a solicitação. Verifique se ela já existe e tente novamente.", sucesso: false, conversaId: null };
  }
}
