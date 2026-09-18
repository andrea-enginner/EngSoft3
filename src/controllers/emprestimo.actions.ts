"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/supabase/sessao";
import {
  confirmarRecebimento,
  ControleEmprestimoError,
  informarDevolucao,
} from "@/models/services/emprestimo.service";

export type ResultadoControleEmprestimo =
  | { sucesso: true; momento: string }
  | { sucesso: false; erro: string };

function respostaDeErro(erro: unknown): ResultadoControleEmprestimo {
  if (erro instanceof ControleEmprestimoError) {
    return { sucesso: false, erro: erro.message };
  }
  console.error("Falha ao atualizar o controle do empréstimo", erro);
  return { sucesso: false, erro: "Não foi possível atualizar o empréstimo agora." };
}

function revalidarEmprestimos(): void {
  revalidatePath("/emprestimos");
  revalidatePath("/mensagens");
}

export async function informarDevolucaoAction(
  solicitacaoId: string,
): Promise<ResultadoControleEmprestimo> {
  try {
    const momento = await informarDevolucao(await sessaoAtual(), solicitacaoId);
    revalidarEmprestimos();
    return { sucesso: true, momento };
  } catch (erro) {
    return respostaDeErro(erro);
  }
}

export async function confirmarRecebimentoAction(
  solicitacaoId: string,
): Promise<ResultadoControleEmprestimo> {
  try {
    const momento = await confirmarRecebimento(await sessaoAtual(), solicitacaoId);
    revalidarEmprestimos();
    return { sucesso: true, momento };
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
