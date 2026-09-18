"use server";

import { sessaoAtual } from "@/lib/supabase/sessao";
import { SolicitacaoEmprestimoError, solicitarEmprestimo } from "@/models/services/emprestimo.service";

export type EstadoSolicitacao = { erro: string; sucesso: boolean };

export async function solicitarEmprestimoAction(
  _estado: EstadoSolicitacao,
  dados: FormData,
): Promise<EstadoSolicitacao> {
  try {
    await solicitarEmprestimo(
      await sessaoAtual(),
      String(dados.get("anuncioId") ?? ""),
      String(dados.get("inicioEm") ?? ""),
      Number(dados.get("duracaoQuantidade")),
      dados.get("confirmacao") === "on",
    );
    return { erro: "", sucesso: true };
  } catch (erro) {
    if (erro instanceof SolicitacaoEmprestimoError) return { erro: erro.message, sucesso: false };
    console.error("Falha ao solicitar empréstimo", erro);
    return { erro: "Não foi possível registrar a solicitação. Verifique se ela já existe e tente novamente.", sucesso: false };
  }
}
